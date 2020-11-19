<template>
  <v-container fluid class="fill-height">
    <div class="video-grid fill-parent">
      <div class="player">
        <template v-if="$store.getters.loading">
          <v-skeleton-loader
            tile
            elevation="0"
            type="image"
            height="100%"
            width="100%"
          >
          </v-skeleton-loader>
        </template>
        <v-card
          tile
          flat
          height="100%"
          width="100%"
          v-if="$store.getters['video/player/rendering']"
          :class="$store.getters['video/player/hidden'] ? 'hidden' : ''"
        >
          <Player
            :key="playerKey"
            ref="player"
            :start="start"
            @current-time-change="currentTimeChange"
            @invalid-video="invalidVideo($event)"
          />
        </v-card>
      </div>
      <div class="section-table">
        <v-card tile class="fill-parent">
          <div class="section-table-grid fill-parent">
            <div class="section-table-title">
              <template v-if="$store.getters.loading">
                <v-row no-gutters>
                  <v-col cols="12">
                    <v-skeleton-loader
                      type="card-heading"
                      width="150px"
                    ></v-skeleton-loader>
                  </v-col>
                </v-row>
              </template>
              <template v-else>
                <v-card-title>{{ $tc("section", 2) }}</v-card-title>
              </template>
            </div>
            <div class="section-table-content">
              <template v-if="$store.getters.loading">
                <div
                  class="fill-parent align-center"
                  style="padding-left: 6px; padding-right: 6px"
                >
                  <v-row dense>
                    <v-col cols="12">
                      <v-skeleton-loader type="text"></v-skeleton-loader>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col cols="10">
                      <v-skeleton-loader type="text"></v-skeleton-loader>
                    </v-col>
                  </v-row>
                </div>
              </template>
              <template v-else>
                <template v-if="$store.getters.isEditMode">
                  <v-row no-gutters>
                    <v-col>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            icon
                            v-on="on"
                            @click="addCurrentSection"
                            class="justify-center"
                            width="100%"
                            :disabled="
                              $store.getters['video/currentTime']
                                .fullSeconds ===
                              $store.getters['video/duration'].fullSeconds
                            "
                          >
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </template>
                        <span>{{ $t("newSection") }}</span>
                      </v-tooltip>
                    </v-col>
                    <v-col>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            icon
                            v-on="on"
                            @click="showIndex = !showIndex"
                            class="justify-center"
                            width="100%"
                          >
                            <v-icon v-if="showIndex">
                              mdi-sort-variant-remove
                            </v-icon>
                            <v-icon v-else> mdi-sort-variant </v-icon>
                          </v-btn>
                        </template>
                        <span v-if="showIndex">
                          {{ $t("hideIndices") }}
                        </span>
                        <span v-else>
                          {{ $t("showIndices") }}
                        </span>
                      </v-tooltip>
                    </v-col>
                    <v-col>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            icon
                            v-on="on"
                            :disabled="splitSectionDisabled"
                            @click="$store.dispatch('splitSectionWithHistory')"
                            class="justify-center"
                            width="100%"
                          >
                            <v-icon>mdi-arrow-split-vertical</v-icon>
                          </v-btn>
                        </template>
                        <span>{{ $t("splitCurrentSection") }}</span>
                      </v-tooltip>
                    </v-col>
                    <v-col>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            icon
                            v-on="on"
                            class="justify-center"
                            width="100%"
                            @click="$store.dispatch('undo')"
                            :disabled="!$store.getters['history/isUndo']"
                          >
                            <v-icon>mdi-undo</v-icon>
                          </v-btn>
                        </template>
                        <span>{{ undoTooltip }}</span>
                      </v-tooltip>
                    </v-col>
                    <v-col>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                          <v-btn
                            icon
                            v-on="on"
                            class="justify-center"
                            width="100%"
                            @click="$store.dispatch('redo')"
                            :disabled="!$store.getters['history/isRedo']"
                          >
                            <v-icon>mdi-redo</v-icon>
                          </v-btn>
                        </template>
                        <span>{{ redoTooltip }}</span>
                      </v-tooltip>
                    </v-col>
                  </v-row>
                </template>
                <v-simple-table fixed-header :height="sectionHeight">
                  <template v-slot:default>
                    <thead>
                      <tr>
                        <th v-if="$store.getters.isEditMode"></th>
                        <th v-if="showIndex && $store.getters.isEditMode"></th>
                        <th class="text-center">{{ $t("start") }}</th>
                        <th class="text-center">{{ $t("end") }}</th>
                        <th v-if="$store.getters.isEditMode"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(section, index) in $store.getters[
                          'video/sections/sections'
                        ]"
                        :key="index"
                        :class="
                          $store.getters['video/sections/index'] === index
                            ? `highlight-section-${
                                $vuetify.theme.dark ? 'dark' : 'light'
                              }`
                            : ''
                        "
                      >
                        <template v-if="$store.getters.isEditMode">
                          <td style="padding: 0">
                            <template
                              v-if="
                                $store.getters['video/sections/index'] !== index
                              "
                            >
                              <v-tooltip bottom>
                                <template v-slot:activator="{ on: tooltip }">
                                  <v-btn
                                    icon
                                    v-on="{ ...tooltip }"
                                    @click="playSection(index)"
                                    ><v-icon small>mdi-play</v-icon></v-btn
                                  >
                                </template>
                                <span>{{ $t("play") }}</span>
                              </v-tooltip>
                            </template>
                            <template v-else>
                              <v-tooltip bottom>
                                <template v-slot:activator="{ on: tooltip }">
                                  <v-btn
                                    icon
                                    v-on="{ ...tooltip }"
                                    @click="
                                      $store.commit('video/sections/index', -1)
                                    "
                                    ><v-icon small
                                      >mdi-selection-off</v-icon
                                    ></v-btn
                                  >
                                </template>
                                <span>{{ $t("deselect") }}</span>
                              </v-tooltip>
                            </template>
                          </td>
                        </template>
                        <template v-if="showIndex && $store.getters.isEditMode">
                          <td>
                            <IndexMenu :index="index"></IndexMenu>
                          </td>
                        </template>
                        <template v-if="$store.getters.isPlayMode">
                          <td class="text-right">
                            {{ section.start.toString() }}
                          </td>
                          <td class="text-right">
                            {{ section.end.toString() }}
                          </td>
                        </template>
                        <template v-else-if="$store.getters.isEditMode">
                          <td class="text-right">
                            <TimestampMenu
                              :type="$t('editSectionStart')"
                              :initial="section.start"
                              :max="{ type: 'sectionEnd', value: section.end }"
                              @save="
                                $store.dispatch(
                                  'updateSectionStartWithHistory',
                                  {
                                    index,
                                    section: {
                                      start: $event,
                                      end: section.end,
                                    },
                                  }
                                )
                              "
                            ></TimestampMenu>
                          </td>
                          <td class="text-right">
                            <TimestampMenu
                              :type="$t('editSectionEnd')"
                              :initial="section.end"
                              :min="{
                                type: 'sectionStart',
                                value: section.start,
                              }"
                              :max="{
                                type: $t('duration'),
                                value: $store.getters['video/duration'],
                              }"
                              @save="
                                $store.dispatch('updateSectionEndWithHistory', {
                                  index,
                                  section: {
                                    start: section.start,
                                    end: $event,
                                  },
                                })
                              "
                            ></TimestampMenu>
                          </td>
                          <td style="padding: 0">
                            <v-tooltip bottom>
                              <template v-slot:activator="{ on }">
                                <v-btn
                                  icon
                                  v-on="on"
                                  @click="
                                    $store.dispatch(
                                      'removeSectionWithHistory',
                                      index
                                    )
                                  "
                                >
                                  <v-icon small>mdi-delete</v-icon>
                                </v-btn>
                              </template>
                              <span>{{ $t("delete") }}</span>
                            </v-tooltip>
                          </td>
                        </template>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
                <template
                  v-if="$store.getters['video/sections/sections'].length !== 0"
                >
                  <v-divider></v-divider>
                </template>
                <template v-else>
                  <div style="width: 100%">
                    <v-alert tile class="text-center text-body-1">{{
                      $t("noSections")
                    }}</v-alert>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </v-card>
      </div>
      <div class="player-control">
        <PlayerControl ref="playerControl"></PlayerControl>
      </div>
    </div>
    <import-project-dialog
      ref="importDialog"
      @rerender-player="rerenderPlayer"
      @close-error-snackbar="closeErrorSnackbar"
    ></import-project-dialog>
    <v-snackbar v-model="errorSnackbar" text timeout="6000" color="error" top
      ><div class="text-center">{{ errorSnackbarMessage }}</div></v-snackbar
    >
  </v-container>
</template>

<script>
import Vue from "vue";
import Player from "@/components/Player";
import TimestampMenu from "@/components/TimestampMenu";
import PlayerControl from "@/components/PlayerControl";
import ImportProjectDialog from "@/components/ImportProjectDialog";
import { Timestamp } from "vidsnip-utils";
import IndexMenu from "@/components/IndexMenu";

export default Vue.extend({
  name: "Video",
  components: {
    IndexMenu,
    ImportProjectDialog,
    PlayerControl,
    Player,
    TimestampMenu,
  },
  data: () => ({
    timestampEdit: false,
    playerKey: 0,
    showIndex: false,
    errorSnackbar: false,
    errorSnackbarMessage: "",
    sectionHeight: 0,
    unwatchSectionHeight: undefined,
  }),
  computed: {
    player() {
      return this.$refs.player.player;
    },
    start() {
      return this.$store.getters["video/sections/sections"].length !== 0
        ? this.$store.getters["video/sections/sections"][0].start.fullSeconds
        : undefined;
    },
    splitSectionDisabled() {
      const currentTimeSeconds = this.$store.getters["video/currentTime"]
        .fullSeconds;
      return (
        this.$store.getters["video/currentSectionStart"].fullSeconds ===
          currentTimeSeconds ||
        this.$store.getters["video/currentSectionEnd"].fullSeconds ===
          currentTimeSeconds
      );
    },
    undoTooltip() {
      const change = this.$store.getters["history/currentUndo"];
      return change !== undefined ? this.$t(`change.undo.${change.type}`) : "";
    },
    redoTooltip() {
      const change = this.$store.getters["history/currentRedo"];
      return change !== undefined ? this.$t(`change.redo.${change.type}`) : "";
    },
  },
  methods: {
    rerenderPlayer() {
      this.playerKey += 1;
    },
    addCurrentSection() {
      this.$store.dispatch("addSectionWithHistory", {
        start: this.$store.getters["video/currentTime"].clone(),
        end: this.$store.getters["video/duration"].clone(),
      });
      this.$store.commit(
        "video/sections/index",
        this.$store.getters["video/sections/sections"].length - 1
      );
    },
    playSection(index) {
      this.$store.commit("video/sections/index", index);
      this.player.seekTo(
        this.$store.getters["video/currentSectionStart"].fullSeconds,
        true
      );
      this.player.playVideo();
    },
    splitSection() {
      const currentTime = this.$store.getters["video/currentTime"];
      const firstSection = {
        start: this.$store.getters["video/currentSectionStart"].clone(),
        end: currentTime.clone(),
      };
      const secondSection = {
        start: currentTime.clone(),
        end: this.$store.getters["video/currentSectionEnd"].clone(),
      };
      if (this.$store.getters["video/sections/index"] !== -1) {
        this.$store.commit("video/sections/set", {
          index: this.$store.getters["video/sections/index"],
          section: firstSection,
        });
        this.$store.commit("video/sections/insert", {
          index: this.$store.getters["video/sections/index"] + 1,
          section: secondSection,
        });
      } else {
        this.$store.commit("video/sections/add", firstSection);
        this.$store.commit("video/sections/add", secondSection);
      }
    },
    currentTimeChange(value) {
      this.$store.commit("video/currentTime", Timestamp.fromSeconds(value));
    },
    openPersistentImportDialog() {
      this.$refs.importDialog.showPersistent();
    },
    openCloseableImportDialog() {
      this.$refs.importDialog.showCloseable();
    },
    invalidVideo(error) {
      this.showErrorSnackbar(error);
      this.openPersistentImportDialog();
    },
    showErrorSnackbar(message) {
      console.log("show snackbar");
      this.errorSnackbarMessage = message;
      this.errorSnackbar = true;
      console.log("show snackbar", this.errorSnackbar);
    },
    closeErrorSnackbar() {
      this.errorSnackbar = false;
      this.errorSnackbarMessage = "";
    },
    getSectionHeight() {
      return this.$store.getters["video/sections/sections"].length !== 0
        ? window.innerHeight -
            48 - // toolbar height
            64 - // section table title height
            24 - // card padding, margin and border heights
            (this.$store.getters["isEditMode"] ? 36 : 0) -
            1
        : 0;
    },
    resizeEventListener() {
      this.$nextTick(() => (this.sectionHeight = this.getSectionHeight()));
    },
  },
  mounted() {
    this.unwatchSectionHeight = this.$watch(
      this.getSectionHeight,
      () => (this.sectionHeight = this.getSectionHeight())
    );
    window.addEventListener("resize", this.resizeEventListener);
    if (this.$store.getters["video/invalidId"])
      this.openPersistentImportDialog();
  },
  destroyed() {
    window.removeEventListener("resize", this.resizeEventListener);
    this.unwatchSectionHeight();
  },
});
</script>

<style scoped lang="scss">
@import "../styles/variables.scss";

.video-grid {
  display: grid;
  grid-template-columns: auto max-content;
  grid-template-rows: auto max-content;
  grid-template-areas:
    "player section-table"
    "player-control section-table";
  column-gap: 2px;
  row-gap: 2px;
}
.player {
  grid-area: player;
}
.player-control {
  grid-area: player-control;
}
.section-table {
  grid-area: section-table;
}
.section-table-grid {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: max-content auto;
  grid-template-areas:
    "section-table-title"
    "section-table-content";
}
.section-table-title {
  grid-area: section-table-title;
}
.section-table-content {
  grid-area: section-table-content;
}
.highlight-section-light {
  background: #eee;
}
.highlight-section-dark {
  background: #616161;
}
.hidden {
  display: none;
}
</style>
