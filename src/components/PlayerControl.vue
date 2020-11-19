<template>
  <v-card tile height="100%" width="100%">
    <v-card-actions>
      <v-row no-gutters>
        <v-col>
          <v-row dense>
            <v-col cols="2"></v-col>
            <v-col class="d-flex justify-center align-center" cols="8">
              <template v-if="$store.getters.loading">
                <v-skeleton-loader type="avatar"></v-skeleton-loader>
              </template>
              <template v-else>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      icon
                      v-on="{ ...tooltip }"
                      :disabled="noPreviousSection"
                      @click="previousSection"
                      ><v-icon>mdi-skip-previous</v-icon></v-btn
                    >
                  </template>
                  <span>{{ $t("playPreviousSection") }}</span>
                </v-tooltip>
                <v-tooltip bottom v-if="isPlay">
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      class="mx-2"
                      fab
                      dark
                      small
                      :color="
                        $store.getters.color[
                          $vuetify.theme.dark ? 'dark' : 'light'
                        ]
                      "
                      v-on="{ ...tooltip }"
                      @click="$store.getters['video/player/player'].playVideo()"
                    >
                      <v-icon dark>mdi-play</v-icon>
                    </v-btn>
                  </template>
                  {{ $t("play") }}
                </v-tooltip>
                <v-tooltip bottom v-else-if="isPause">
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      class="mx-2"
                      fab
                      dark
                      small
                      :color="
                        $store.getters.color[
                          $vuetify.theme.dark ? 'dark' : 'light'
                        ]
                      "
                      v-on="{ ...tooltip }"
                      @click="
                        $store.getters['video/player/player'].pauseVideo()
                      "
                    >
                      <v-icon dark>mdi-pause</v-icon>
                    </v-btn>
                  </template>
                  {{ $t("pause") }}
                </v-tooltip>
                <v-tooltip bottom v-else-if="isRestart">
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      class="mx-2"
                      fab
                      dark
                      small
                      :color="
                        $store.getters.color[
                          $vuetify.theme.dark ? 'dark' : 'light'
                        ]
                      "
                      v-on="{ ...tooltip }"
                      @click="restart"
                    >
                      <v-icon dark>mdi-restart</v-icon>
                    </v-btn>
                  </template>
                  {{ $t("restart") }}
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn
                      icon
                      v-on="{ ...tooltip }"
                      :disabled="noNextSection"
                      @click="nextSection"
                      ><v-icon>mdi-skip-next</v-icon></v-btn
                    >
                  </template>
                  <span>{{ $t("playNextSection") }}</span>
                </v-tooltip>
              </template>
            </v-col>
            <v-col class="d-flex justify-end align-center" cols="2">
              <template v-if="!$store.getters.loading">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn icon v-on="{ ...tooltip }" @click="showShareDialog"
                      ><v-icon>mdi-share</v-icon></v-btn
                    >
                  </template>
                  <span>{{ $t("share") }}</span>
                </v-tooltip>
              </template>
            </v-col>
          </v-row>
          <v-row dense v-if="$store.getters.loading">
            <v-col cols="1">
              <v-skeleton-loader type="text"></v-skeleton-loader>
            </v-col>
            <v-col cols="10">
              <v-skeleton-loader type="text"></v-skeleton-loader>
            </v-col>
            <v-col cols="1">
              <v-skeleton-loader type="text"></v-skeleton-loader>
            </v-col>
          </v-row>
          <v-row dense v-else>
            <v-col>
              <v-slider
                hide-details
                v-model="sliderValue"
                :color="
                  $store.getters.color[$vuetify.theme.dark ? 'dark' : 'light']
                "
                :min="$store.getters['video/currentSectionStart'].fullSeconds"
                :max="$store.getters['video/currentSectionEnd'].fullSeconds"
                @click="onClick"
                @start="onDragStart"
                @end="onDragEnd"
                class="align-center"
              >
                <template v-slot:prepend>
                  <div>{{ currentTime }}</div>
                </template>
                <template v-slot:append>
                  <div>-{{ timeLeft }}</div>
                </template>
              </v-slider>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-actions>
    <share-project-dialog ref="shareDialog"></share-project-dialog>
  </v-card>
</template>

<script>
import Vue from "vue";
import { Timestamp } from "vidsnip-utils";
import ShareProjectDialog from "@/components/ShareProjectDialog";

export default Vue.extend({
  name: "PlayerControl",
  components: {
    ShareProjectDialog,
  },
  data: () => ({
    sliderValue: 0,
    sliderDrag: false,
    unwatchCurrentTime: undefined,
  }),
  computed: {
    currentTime() {
      return (this.sliderDrag
        ? Timestamp.fromSeconds(this.sliderValue)
        : this.$store.getters["video/player/state"] === -1
        ? this.$store.getters["video/currentSectionStart"]
        : this.$store.getters["video/currentTime"]
      ).toString();
    },
    timeLeft() {
      return (this.sliderDrag
        ? Timestamp.fromSeconds(
            this.$store.getters["video/currentSectionEnd"].fullSeconds -
              this.sliderValue
          )
        : this.$store.getters["video/currentSectionTimeLeft"]
      ).toString();
    },
    isDisabled() {
      return this.$store.getters["video/player/state"] === -1; // UNSTARTED
    },
    isPlay() {
      const state = this.$store.getters["video/player/state"];
      return state === 5 || state === 2 || state === -1; // CUED, PAUSED, UNSTARTED
    },
    isPause() {
      const state = this.$store.getters["video/player/state"];
      return state === 1 || state === 3; // PLAYING, BUFFERING
    },
    isRestart() {
      return this.$store.getters["video/player/state"] === 0; // ENDED
    },
    noPreviousSection() {
      return (
        this.$store.getters["video/sections/index"] < 1 ||
        this.$store.getters["video/sections/index"] >=
          this.$store.getters["video/sections/sections"].length
      );
    },
    noNextSection() {
      return (
        this.$store.getters["video/sections/index"] < 0 ||
        this.$store.getters["video/sections/index"] >=
          this.$store.getters["video/sections/sections"].length - 1
      );
    },
  },
  methods: {
    setSliderValue(value) {
      if (!this.sliderDrag) this.sliderValue = value;
    },
    onClick() {
      this.$store.getters["video/player/player"].seekTo(this.sliderValue, true);
    },
    onDragStart() {
      this.sliderDrag = true;
    },
    onDragEnd(value) {
      this.$store.getters["video/player/player"].seekTo(value, true);
      this.value = value;
      this.sliderDrag = false;
    },
    previousSection() {
      this.$store.commit(
        "video/sections/index",
        this.$store.getters["video/sections/index"] - 1
      );
      this.$store.getters["video/player/player"].seekTo(
        this.$store.getters["video/currentSectionStart"].fullSeconds,
        true
      );
      this.$store.getters["video/player/player"].playVideo();
    },
    nextSection() {
      this.$store.commit(
        "video/sections/index",
        this.$store.getters["video/sections/index"] + 1
      );
      this.$store.getters["video/player/player"].seekTo(
        this.$store.getters["video/currentSectionStart"].fullSeconds,
        true
      );
      this.$store.getters["video/player/player"].playVideo();
    },
    restart() {
      const start =
        this.$store.getters["video/sections/sections"].length !== 0
          ? this.$store.getters["video/sections/sections"][0].start.fullSeconds
          : 0;
      this.$store.getters["video/player/player"].seekTo(start, true);
      this.$store.commit("video/sections/index", 0);
    },
    showShareDialog() {
      this.$refs.shareDialog.show = true;
    },
  },
  mounted() {
    this.unwatchCurrentTime = this.$store.watch(
      (state, getters) => getters["video/currentTime"],
      (value) => this.setSliderValue(value.fullSeconds)
    );
  },
  destroyed() {
    this.unwatchCurrentTime();
  },
});
</script>

<style scoped></style>
