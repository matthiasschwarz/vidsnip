/* eslint @typescript-eslint/no-explicit-any: 0 */

import Vue from "vue";
import { default as Vuex } from "vuex";
import {
  Change,
  ChangeType,
  getTypeTooltip,
  IndexableSection,
  Section,
  SectionAdd,
  SectionRemove,
  SectionSplit,
  SectionSwap,
  Timestamp,
  TimestampUpdate
} from "vidsnip-utils";
import {
  Video as VideoCodec,
  Section as VideoCodecSection,
  encode,
  decode
} from "vidsnip-codec";

Vue.use(Vuex);

const historyModule = {
  namespaced: true,
  state: {
    index: -1,
    changes: Array<Change>()
  },
  getters: {
    changes(state: any): Array<Change> {
      return state.changes;
    },
    isUndo(state: any): boolean {
      return state.index >= 0;
    },
    isRedo(state: any): boolean {
      return state.index < state.changes.length - 1;
    },
    undoTooltip(state: any): string {
      let tooltip = "Undo";
      const change = state.changes[state.index];
      if (change !== undefined) tooltip += ` ${getTypeTooltip(change.type)}`;
      return tooltip;
    },
    redoTooltip(state: any): string {
      let tooltip = "Redo";
      const change = state.changes[state.index + 1];
      if (change !== undefined) tooltip += ` ${getTypeTooltip(change.type)}`;
      return tooltip;
    }
  },
  mutations: {
    add(state: any, change: Change) {
      state.changes.splice(state.index + 1, Number.MAX_SAFE_INTEGER, change);
      ++state.index;
    },
    clear(state: any) {
      state.changes.splice(0, Number.MAX_SAFE_INTEGER);
      state.index = -1;
    }
  },
  actions: {
    undo(context: any): Change | undefined {
      if (context.getters.isUndo) {
        const change = context.state.changes[context.state.index];
        --context.state.index;
        return change;
      }
      return undefined;
    },
    redo(context: any): Change | undefined {
      if (context.getters.isRedo) {
        const change = context.state.changes[context.state.index + 1];
        ++context.state.index;
        return change;
      }
      return undefined;
    }
  }
};

const sectionsModule = {
  namespaced: true,
  state: {
    index: -1, // current playing section, -1 = no playing section
    sections: Array<Section>()
  },
  getters: {
    index(state: any): number {
      return state.index;
    },
    sections(state: any): Array<Section> {
      return state.sections;
    },
    indexInRange(state: any): boolean {
      return state.index >= 0 && state.index < state.sections.length;
    },
    currentSection(state: any, getters: any): Section | undefined {
      return getters.indexInRange ? state.sections[state.index] : undefined;
    }
  },
  mutations: {
    add(state: any, section: Section) {
      state.sections.push(section);
    },
    set(state: any, indexableSection: IndexableSection) {
      const oldSection = state.sections[indexableSection.index];
      if (oldSection && oldSection !== indexableSection.section)
        state.sections.splice(
          indexableSection.index,
          1,
          indexableSection.section
        );
    },
    insert(state: any, indexableSection: IndexableSection) {
      state.sections.splice(
        indexableSection.index,
        0,
        indexableSection.section
      );
      if (state.index >= indexableSection.index) ++state.index;
    },
    splice(
      state: any,
      args: { index: number; deleteCount: number; items?: Array<Section> }
    ) {
      if (args.items === undefined || args.items.length === 0)
        state.sections.splice(args.index, args.deleteCount);
      else state.sections.splice(args.index, args.deleteCount, ...args.items);
    },
    swap(state: any, args: { oldIndex: number; newIndex: number }) {
      if (
        args.oldIndex >= 0 &&
        args.oldIndex < state.sections.length &&
        args.newIndex >= 0 &&
        args.newIndex < state.sections.length
      ) {
        const secondSection = state.sections[args.newIndex];
        state.sections.splice(args.newIndex, 1, state.sections[args.oldIndex]);
        if (state.index === args.oldIndex) state.index = args.newIndex;
        state.sections.splice(args.oldIndex, 1, secondSection);
      }
    },
    remove(state: any, index: number) {
      if (index >= 0 && index < state.sections.length) {
        if (state.index > index) --state.index;
        else if (state.index === index) state.index = -1;
        state.sections.splice(index, 1);
      }
    },
    index(state: any, index: number) {
      if (index >= -1 && index < state.sections.length) state.index = index;
    }
  },
  actions: {
    setStart(context: any, start: { index: number; start: Timestamp }) {
      const oldSection = context.state.sections[start.index];
      if (
        oldSection &&
        oldSection.start.fullSeconds !== start.start.fullSeconds
      ) {
        context.commit("set", {
          index: start.index,
          section: { start: start.start, end: oldSection.end }
        });
      }
    },
    setEnd(context: any, end: { index: number; end: Timestamp }) {
      const oldSection = context.state.sections[end.index];
      if (oldSection && oldSection.end.fullSeconds !== end.end.fullSeconds)
        context.commit("set", {
          index: end.index,
          section: { start: oldSection.start, end: end.end }
        });
    },
    removeLast(context: any) {
      context.commit("remove", context.state.sections.length - 1);
    },
    undoAdd(context: any) {
      context.dispatch("removeLast").then();
    },
    redoAdd(context: any, change: SectionAdd) {
      context.commit("add", change.section);
    },
    undoRemove(context: any, change: SectionRemove) {
      context.commit("insert", change);
    },
    redoRemove(context: any, change: SectionRemove) {
      context.commit("remove", change.index);
    },
    undoSplit(context: any, change: SectionSplit) {
      if (change.first.index === undefined) {
        context.dispatch("removeLast").then();
        context.dispatch("removeLast").then();
      } else {
        context.commit("remove", change.first.index + 1);
        context.commit("set", {
          index: change.first.index,
          section: change.first.old
        });
      }
    },
    redoSplit(context: any, change: SectionSplit) {
      if (change.first.index === undefined) {
        context.commit("add", change.first.new);
        context.commit("add", change.second);
      } else {
        context.commit("set", {
          index: change.first.index,
          section: change.first.new
        });
        context.commit("insert", {
          index: change.first.index + 1,
          section: change.second
        });
      }
    },
    undoSwap(context: any, change: SectionSwap) {
      context.commit("swap", {
        oldIndex: change.new,
        newIndex: change.old
      });
    },
    redoSwap(context: any, change: SectionSwap) {
      context.commit("swap", {
        oldIndex: change.old,
        newIndex: change.new
      });
    },
    undoStartUpdate(context: any, change: TimestampUpdate) {
      context
        .dispatch("setStart", {
          index: change.index,
          start: change.old
        })
        .then();
    },
    redoStartUpdate(context: any, change: TimestampUpdate) {
      context
        .dispatch("setStart", {
          index: change.index,
          start: change.new
        })
        .then();
    },
    undoEndUpdate(context: any, change: TimestampUpdate) {
      context
        .dispatch("setEnd", {
          index: change.index,
          end: change.old
        })
        .then();
    },
    redoEndUpdate(context: any, change: TimestampUpdate) {
      context
        .dispatch("setEnd", {
          index: change.index,
          end: change.new
        })
        .then();
    }
  }
};

const playerModule = {
  namespaced: true,
  state: {
    player: undefined,
    state: -1, // UNDEFINED
    rendering: false,
    hidden: true
  },
  getters: {
    player(state: any): any {
      return state.player;
    },
    state(state: any): number {
      return state.state;
    },
    rendering(state: any): boolean {
      return state.rendering;
    },
    hidden(state: any): boolean {
      return state.hidden;
    }
  },
  mutations: {
    player(state: any, player: any) {
      state.player = player;
    },
    state(vstate: any, state: number) {
      vstate.state = state;
    },
    rendering(state: any, value: boolean) {
      state.rendering = value;
    },
    hidden(state: any, value: boolean) {
      state.hidden = value;
    }
  }
};

const videoModule = {
  namespaced: true,
  modules: {
    player: playerModule,
    sections: sectionsModule
  },
  state: {
    id: "",
    currentTime: Timestamp.fromSeconds(0),
    duration: Timestamp.fromSeconds(0)
  },
  getters: {
    id(state: any): string {
      return state.id;
    },
    validId(state: any): boolean {
      return state.id.length !== 0;
    },
    invalidId(state: any): boolean {
      return state.id.length === 0;
    },
    currentTime(state: any): Timestamp {
      return state.currentTime;
    },
    duration(state: any): Timestamp {
      return state.duration;
    },
    currentSectionStart(state: any, getters: any): Timestamp {
      const currentSection = getters["sections/currentSection"];
      return currentSection !== undefined
        ? currentSection.start
        : new Timestamp();
    },
    currentSectionEnd(state: any, getters: any): Timestamp {
      const currentSection = getters["sections/currentSection"];
      return currentSection !== undefined ? currentSection.end : state.duration;
    },
    currentSectionTimeLeft(state: any, getters: any): Timestamp {
      return Timestamp.fromSeconds(
        getters.currentSectionEnd.fullSeconds - state.currentTime.fullSeconds
      );
    },
    export(state: any, getters: any): string | null {
      const video: VideoCodec = {
        id: state.id,
        sections: getters["sections/sections"].map((section: Section) => {
          return {
            start: section.start.fullSeconds,
            end: section.end.fullSeconds
          };
        })
      };
      return encode(video);
    }
  },
  mutations: {
    id(state: any, id: string) {
      state.id = id;
    },
    currentTime(state: any, currentTime: Timestamp) {
      state.currentTime = currentTime;
    },
    duration(state: any, duration: Timestamp) {
      state.duration = duration;
    },
    import(state: any, string: string) {
      const video: VideoCodec | null = decode(string);
      if (video !== null) {
        state.sections.sections = video.sections.map(
          (section: VideoCodecSection) => {
            return {
              start: Timestamp.fromSeconds(section.start),
              end: Timestamp.fromSeconds(section.end)
            };
          }
        );
        state.id = video.id;
      }
    }
  }
};

const colorModule = {
  namespaced: true,
  state: {
    light: {
      play: "red darken-1",
      edit: "green darken-1"
    },
    dark: {
      play: "red darken-3",
      edit: "green darken-3"
    }
  },
  getters: {
    play(state: any): { light: string; dark: string } {
      return { light: state.light.play, dark: state.dark.play };
    },
    edit(state: any): { light: string; dark: string } {
      return { light: state.light.edit, dark: state.dark.edit };
    }
  }
};

export default new Vuex.Store({
  modules: {
    color: colorModule,
    video: videoModule,
    history: historyModule
  },
  state: {
    mode: 0,
    initialMode: true,
    loaded: false
  },
  getters: {
    loaded(state: any): boolean {
      return state.loaded;
    },
    loading(state: any): boolean {
      return !state.loaded;
    },
    initialMode(state: any): boolean {
      return state.initialMode;
    },
    color(state: any, getters): { light: string; dark: string } {
      return getters.isPlayMode ? getters["color/play"] : getters["color/edit"];
    },
    isPlayMode(state): boolean {
      return state.mode === 0;
    },
    isEditMode(state): boolean {
      return state.mode === 1;
    },
    mode(state): number {
      return state.mode;
    }
  },
  mutations: {
    loaded(state, loaded: boolean) {
      state.loaded = loaded;
    },
    mode(state, n: number) {
      state.mode = n;
    },
    switchMode(state: any, n: number) {
      if (n === 0) {
        state["video/player/state"] = -1;
        state["video/currentTime"] =
          state["video/sections/sections"].length !== 0
            ? state["video/sections/sections"][0].start
            : new Timestamp();
        state["video/sections/index"] = 0;
      }
      state.mode = n;
    }
  },
  actions: {
    switchMode(context: any, n: number) {
      if (n === 0 && !context.state.initialMode) {
        /*context.commit('video/player/hidden', true);
        context.commit("video/player/rendering", false);
        //context.state.loaded = false;
        setTimeout(() => {
          context.commit("video/player/rendering", true)
          //context.state.loaded = true;
        });*/
        //context.state.loaded = true;
        context.commit("video/player/state", -1);
        context.commit("video/sections/index", 0);
        context.commit(
          "video/currentTime",
          context.getters["video/currentSectionStart"]
        );
      }
      context.commit("mode", n);
      if (context.state.initialMode) context.state.initialMode = false;
    },
    addSectionWithHistory(context, section: Section) {
      context.commit("video/sections/add", section);
      const change: SectionAdd = { type: ChangeType.SectionAdd, section };
      context.commit("history/add", change);
    },
    updateSectionStartWithHistory(
      context: any,
      indexableSection: IndexableSection
    ) {
      const old = context.state.video.sections.sections[indexableSection.index];
      if (old) {
        context.commit("video/sections/set", indexableSection);
        context.commit("history/add", {
          type: ChangeType.SectionStartUpdate,
          index: indexableSection.index,
          old: old.start,
          new: indexableSection.section.start
        });
      }
    },
    updateSectionEndWithHistory(
      context: any,
      indexableSection: IndexableSection
    ) {
      const old = context.state.video.sections.sections[indexableSection.index];
      if (old) {
        context.commit("video/sections/set", indexableSection);
        context.commit("history/add", {
          type: ChangeType.SectionEndUpdate,
          index: indexableSection.index,
          old: old.end,
          new: indexableSection.section.end
        });
      }
    },
    removeSectionWithHistory(context: any, index: number) {
      const section = context.state.video.sections.sections[index];
      if (section) {
        context.commit("video/sections/remove", index);
        const change: SectionRemove = {
          type: ChangeType.SectionRemove,
          index,
          section
        };
        context.commit("history/add", change);
      }
    },
    swapSectionWithHistory(
      context: any,
      args: { oldIndex: number; newIndex: number }
    ) {
      if (
        args.oldIndex >= 0 &&
        args.oldIndex < context.getters["video/sections/sections"].length &&
        args.newIndex >= 0 &&
        args.newIndex < context.getters["video/sections/sections"].length
      ) {
        context.commit("video/sections/swap", args);
        context.commit("history/add", {
          type: ChangeType.SectionSwap,
          old: args.oldIndex,
          new: args.newIndex
        });
      }
    },
    splitSectionWithHistory(context: any) {
      const currentTime = context.getters["video/currentTime"];
      const firstSection = {
        start: context.getters["video/currentSectionStart"].clone(),
        end: currentTime.clone()
      };
      const secondSection = {
        start: currentTime.clone(),
        end: context.getters["video/currentSectionEnd"].clone()
      };
      const change = {
        type: ChangeType.SectionSplit,
        first: { index: undefined, old: undefined, new: firstSection },
        second: secondSection
      };
      if (context.getters["video/sections/index"] !== -1) {
        const index = context.getters["video/sections/index"];
        change.first.index = index;
        change.first.old = context.getters["video/sections/currentSection"];
        context.commit("video/sections/set", {
          index: index,
          section: firstSection
        });
        context.commit("video/sections/insert", {
          index: index + 1,
          section: secondSection
        });
      } else {
        context.commit("video/sections/add", firstSection);
        context.commit("video/sections/add", secondSection);
      }
      context.commit("history/add", change);
    },
    undo(context: any) {
      context.dispatch("history/undo").then((change: Change | undefined) => {
        if (change !== undefined) {
          switch (change.type) {
            case ChangeType.SectionAdd:
              context.dispatch("video/sections/undoAdd", change).then();
              break;
            case ChangeType.SectionRemove:
              context.dispatch("video/sections/undoRemove", change).then();
              break;
            case ChangeType.SectionSplit:
              context.dispatch("video/sections/undoSplit", change).then();
              break;
            case ChangeType.SectionSwap:
              context.dispatch("video/sections/undoSwap", change).then();
              break;
            case ChangeType.SectionStartUpdate:
              context.dispatch("video/sections/undoStartUpdate", change).then();
              break;
            case ChangeType.SectionEndUpdate:
              context.dispatch("video/sections/undoEndUpdate", change).then();
              break;
          }
        }
      });
    },
    redo(context: any) {
      context.dispatch("history/redo").then((change: Change | undefined) => {
        if (change !== undefined) {
          switch (change.type) {
            case ChangeType.SectionAdd:
              context.dispatch("video/sections/redoAdd", change).then();
              break;
            case ChangeType.SectionRemove:
              context.dispatch("video/sections/redoRemove", change).then();
              break;
            case ChangeType.SectionSplit:
              context.dispatch("video/sections/redoSplit", change).then();
              break;
            case ChangeType.SectionSwap:
              context.dispatch("video/sections/redoSwap", change).then();
              break;
            case ChangeType.SectionStartUpdate:
              context.dispatch("video/sections/redoStartUpdate", change).then();
              break;
            case ChangeType.SectionEndUpdate:
              context.dispatch("video/sections/redoEndUpdate", change).then();
              break;
          }
        }
      });
    },
    reload(context: any) {
      context.commit("video/player/hidden", true);
      context.state.loaded = false;
      context.state.loaded = true;
    }
  }
});
