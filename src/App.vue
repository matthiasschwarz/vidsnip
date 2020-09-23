<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <v-list nav dense>
        <v-list-item>
          <v-list-item-icon><v-icon>mdi-alpha-v-box</v-icon></v-list-item-icon>
          <v-list-item-title>VidSnip</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item link @click="openCloseableImportDialog">
          <v-list-item-icon>
            <v-icon>mdi-import</v-icon>
          </v-list-item-icon>
          <v-list-item-title>Import</v-list-item-title>
        </v-list-item>

        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-theme-light-dark</v-icon>
          </v-list-item-icon>
          <v-list-item-action class="ma-0">
            <v-switch
              v-model="$vuetify.theme.dark"
              dense
              hide-details
              class="pa-0 ma-0"
            ></v-switch>
          </v-list-item-action>
          <v-list-item-action-text
            class="text-subtitle-2"
            style="margin-left: 12px"
            >Dark mode</v-list-item-action-text
          >
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <v-alert text dense type="warning" :icon="false"
          >VidSnip is not affiliated or endorsed by
          <a href="https://www.youtube.com" target="_blank">YouTube</a></v-alert
        >
      </template>
    </v-navigation-drawer>

    <v-app-bar
      app
      :color="$store.getters.color[$vuetify.theme.dark ? 'dark' : 'light']"
      dark
      dense
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>VidSnip</v-toolbar-title>
      <template v-if="$store.getters.loaded">
        <v-spacer></v-spacer>
        <div>
          <v-tabs
            :value="$store.getters['mode']"
            @change="switchMode"
            :background-color="
              $store.getters.color[$vuetify.theme.dark ? 'dark' : 'light']
            "
          >
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-tab v-on="on">Play</v-tab>
              </template>
              <span>Play mode</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-tab v-on="on">Edit</v-tab>
              </template>
              <span>Edit mode</span>
            </v-tooltip>
          </v-tabs>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <Video ref="video"></Video>
    </v-main>
  </v-app>
</template>

<script>
import Vue from "vue";
import Video from "@/components/Video.vue";

export default Vue.extend({
  name: "App",
  components: {
    Video
  },
  data: () => ({
    drawer: false
  }),
  methods: {
    switchMode(n) {
      this.$store.dispatch("switchMode", n);
      if (n === 0 && !this.$store.getters.initialMode) {
        this.$refs.video.rerenderPlayer();
        //this.$store.dispatch('reload');
      }
    },
    openCloseableImportDialog() {
      this.$refs.video.openCloseableImportDialog();
    }
  }
});
</script>

<style>
html {
  overflow-y: auto; /* hide scrollbar */
}
.fill-parent {
  height: 100%;
  width: 100%;
}
</style>
