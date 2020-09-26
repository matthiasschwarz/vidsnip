<template>
  <div class="fill-parent">
    <youtube
      ref="youtube"
      v-bind="$attrs"
      v-on="$listeners"
      height="100%"
      width="100%"
      :video-id="$store.getters['video/id']"
      :player-vars="{ start, end }"
      nocookie
      @ready="ready"
      @playing="playing"
    ></youtube>
  </div>
</template>

<script>
import { Timestamp } from "vidsnip-utils";

export default {
  name: "Player",
  inheritAttrs: false,
  props: {
    start: Number,
    end: Number
  },
  computed: {
    player() {
      return this.$refs.youtube.player;
    }
  },
  methods: {
    async emitCurrentTimeChange(newTime, oldTime) {
      this.$emit("currentTimeChange", newTime, oldTime);
    },
    patchPlayerInfo(player) {
      const playerInfo = player.playerInfo;
      const patchCurrentTimeProperty = this.patchCurrentTimeProperty;
      Object.defineProperty(player, "playerInfo", {
        get() {
          return this._playerInfo;
        },
        set(value) {
          this._playerInfo = value;
          patchCurrentTimeProperty(value);
        }
      });
      player.playerInfo = playerInfo;
    },
    patchCurrentTimeProperty(playerInfo) {
      const emit = this.emitCurrentTimeChange;
      Object.defineProperty(playerInfo, "currentTime", {
        get() {
          return this._currentTime;
        },
        set(newValue) {
          if (newValue !== this._currentTime) emit(newValue, this._currentTime);
          this._currentTime = newValue;
        }
      });
    },
    ready(player) {
      if (player.getDuration() === 0) {
        this.$store.commit("video/player/hidden", true);
        this.$emit("invalidVideo", this.$t("error.invalidVideo"));
        if (this.$store.getters["video/player/rendering"])
          this.$store.commit("loaded", false);
        this.$store.commit("video/player/rendering", false);
        this.$destroy();
        return;
      }
      this.$store.commit("video/player/player", player);
      this.currentTimeIntervalId = setInterval(() => {
        const currentTime = Timestamp.fromSeconds(player.getCurrentTime());
        if (
          this.$store.getters["video/currentTime"].fullSeconds !==
          currentTime.fullSeconds
        )
          this.$store.commit("video/currentTime", currentTime);
      }, 100);
      this.$store.commit("video/player/state", -1);
      this.$store.commit(
        "video/duration",
        Timestamp.fromSeconds(player.getDuration())
      ); // estimated duration
      this.$store.commit("loaded", true);
      this.$store.commit("video/player/hidden", false);
    },
    playing(player) {
      if (this.estimatedDuration) {
        this.$store.commit(
          "video/duration",
          Timestamp.fromSeconds(player.getDuration())
        ); // exact duration
        this.estimatedDuration = false;
      }
    }
  },
  data: () => ({
    estimatedDuration: true,
    unwatchCurrentTime: undefined,
    currentTimeIntervalId: undefined
  }),
  mounted() {
    this.player.addEventListener("onStateChange", event =>
      this.$store.commit("video/player/state", event.data)
    );
    this.unwatchCurrentTime = this.$store.watch(
      (state, getters) => getters["video/currentTime"],
      (newValue, oldValue) => {
        const currentSection = this.$store.getters[
          "video/sections/currentSection"
        ];
        const state = this.$store.getters["video/player/state"];
        if (
          currentSection !== undefined &&
          (state === 1 || state === 2 || state === 3)
        ) {
          const start = currentSection.start.fullSeconds;
          const end = currentSection.end.fullSeconds;
          if (newValue.fullSeconds < start || newValue.fullSeconds > end) {
            const oldValueSeconds = oldValue.fullSeconds;
            const newValueSeconds = newValue.fullSeconds;
            if (
              (oldValueSeconds < start || oldValueSeconds > end) &&
              (newValueSeconds < start || newValueSeconds > end)
            )
              if (this.$store.getters.isPlayMode) {
                this.$store.getters["video/player/player"].seekTo(
                  (oldValueSeconds < start || oldValueSeconds > end) &&
                    (newValueSeconds < start || newValueSeconds > end)
                    ? start
                    : oldValue.fullSeconds,
                  true
                );
                if (state === 1 || state === 3)
                  this.$store.getters["video/player/player"].playVideo();
              } else this.$store.commit("video/sections/index", -1);
          } else if (newValue.fullSeconds === end) {
            const index = this.$store.getters["video/sections/index"];
            if (this.$store.getters.isEditMode) {
              this.$store.getters["video/player/player"].seekTo(start, true);
            } else if (
              index <
              this.$store.getters["video/sections/sections"].length - 1
            ) {
              const nextIndex = index + 1;
              this.$store.commit("video/sections/index", nextIndex);
              this.$store.getters["video/player/player"].seekTo(
                this.$store.getters["video/sections/sections"][nextIndex].start
                  .fullSeconds,
                true
              );
            } else {
              // play mode
              if (
                newValue.fullSeconds !==
                this.$store.getters["video/duration"].fullSeconds
              ) {
                this.$store.getters["video/player/player"].seekTo(
                  this.$store.getters["video/duration"].fullSeconds + 1,
                  true
                );
              }
              //this.$store.commit("video/sections/index", 0);
            }
          }
        }
      }
    );
  },
  destroyed() {
    this.unwatchCurrentTime();
    clearInterval(this.currentTimeIntervalId);
  }
  /*,
  destroyed() {
    window.YT = undefined;
    window.YTConfig = undefined;
    window.onYTReady = undefined;
    window.onYouTubeIframeAPIReady = undefined;
    this.player.removeEventListener("onStateChange");
  }*/
};
</script>

<style scoped>
#youtube-player {
  width: 100% !important;
  height: auto !important;
}
</style>
