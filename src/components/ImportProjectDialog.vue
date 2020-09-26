<template>
  <v-dialog
    :value="show"
    width="unset"
    :persistent="!closeable"
    @click:outside="closeable ? (show = false) : 0"
  >
    <v-card>
      <v-card-title>
        <span>{{ $t("import") }}</span>
        <template v-if="closeable">
          <v-spacer></v-spacer>
          <v-tooltip bottom>
            <template v-slot:activator="{ on: tooltip }">
              <v-btn icon v-on="{ ...tooltip }" @click="show = false"
                ><v-icon>mdi-close</v-icon></v-btn
              >
            </template>
            <span>{{ $t("close") }}</span>
          </v-tooltip>
        </template>
      </v-card-title>
      <v-card-text>
        <v-row no-gutters>
          <v-col cols="12">
            <v-text-field
              v-model="value"
              :label="$t('importVideo')"
              prepend-icon="mdi-youtube"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex justify-center">
            <span class="text-body-1">{{ $t("or") }}</span>
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col cols="12">
            <v-text-field
              v-model="code"
              :label="$t('importCode')"
              prepend-icon="mdi-share-variant"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { decode } from "vidsnip-codec";
import { Timestamp, validId } from "vidsnip-utils";

export default {
  name: "ImportProjectDialog",
  data: () => ({
    value: "",
    code: "",
    show: false,
    closeable: false
  }),
  watch: {
    show(value) {
      if (value) {
        this.value = "";
        this.code = "";
      }
    },
    value(value) {
      if (value !== "") this.$emit("closeErrorSnackbar");
      const id = this.$youtube.getIdFromUrl(value, { fuzzy: false }) ?? value;
      if (validId(id)) {
        this.$store.commit("video/player/hidden", true);
        this.$store.commit("loaded", false);
        this.$store.commit("video/id", id);
        if (this.closeable) {
          this.$store.commit("history/clear");
          this.$store.commit("video/sections/splice", {
            index: 0,
            deleteCount: Number.MAX_SAFE_INTEGER
          });
          this.$store.commit("video/sections/index", -1);
          this.$store.commit("mode", 0);
          this.$emit("rerenderPlayer");
        }
        this.$store.commit("video/player/rendering", true);
        this.show = false;
      }
    },
    code(value) {
      if (value !== "") this.$emit("closeErrorSnackbar");
      const video = decode(value);
      if (video !== null && validId(video.id)) {
        this.$store.commit("video/player/hidden", true);
        this.$store.commit("loaded", false);
        this.$store.commit("video/id", video.id);
        this.$store.commit(
          "video/sections/index",
          video.sections.length === 0 ? -1 : 0
        );
        if (this.closeable) {
          this.$store.commit("history/clear");
          this.$store.commit("mode", 0);
          this.$emit("rerenderPlayer");
          /*this.$store.commit('video/player/hidden', true);
              this.$store.commit('loaded', false);
              this.$store.commit("video/player/rendering", false);*/
        }
        this.$store.commit("video/sections/splice", {
          index: 0,
          deleteCount: Number.MAX_SAFE_INTEGER,
          items: video.sections.map(section => {
            return {
              start: Timestamp.fromSeconds(section.start),
              end: Timestamp.fromSeconds(section.end)
            };
          })
        });
        this.$store.commit("video/player/rendering", true);
        this.show = false;
      }
    }
  },
  methods: {
    showPersistent(error) {
      this.closeable = false;
      this.show = true;
      if (error) this.errorSnackbar = true;
    },
    showCloseable(error) {
      this.closeable = true;
      this.show = true;
      if (error) this.errorSnackbar = true;
    }
  }
};
</script>

<style scoped></style>
