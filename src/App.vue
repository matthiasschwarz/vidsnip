<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <v-list nav dense>
        <v-list-item>
          <v-list-item-icon><v-icon>mdi-content-cut</v-icon></v-list-item-icon>
          <v-list-item-title>VidSnip</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item link @click="openCloseableImportDialog">
          <v-list-item-icon>
            <v-icon>mdi-import</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ $t("import") }}</v-list-item-title>
        </v-list-item>

        <v-menu offset-y v-model="languageMenu">
          <template v-slot:activator="{ on }">
            <v-list-item link v-on="on">
              <v-list-item-icon>
                <v-icon>mdi-translate</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ localeCountry }}</v-list-item-title>
              <v-list-item-icon>
                <v-icon>mdi-menu-down</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </template>
          <v-list nav dense>
            <v-list-item link @click="setLanguage('en')">
              <v-list-item-title>English</v-list-item-title>
            </v-list-item>
            <v-list-item link @click="setLanguage('de')">
              <v-list-item-title>Deutsch</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-theme-light-dark</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ $t("darkMode") }}</v-list-item-title>
          <v-list-item-action style="width: 90px">
            <v-switch
              v-model="$vuetify.theme.dark"
              dense
              hide-details
            ></v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-list-item
          link
          href="https://github.com/matthiasschwarz/vidsnip"
          target="_blank"
        >
          <v-list-item-icon>
            <v-icon>mdi-github</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ $t("githubReference") }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <v-alert text dense type="warning" :icon="false">
          <i18n path="disclaimer" :tag="false">
            <template v-slot:app>VidSnip</template>
            <template v-slot:company
              ><a href="https://youtube.com" target="_blank"
                >YouTube</a
              ></template
            >
          </i18n>
        </v-alert>
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
                <v-tab v-on="on">{{ $t("play") }}</v-tab>
              </template>
              <span>{{ $t("playMode") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-tab v-on="on">{{ $t("edit") }}</v-tab>
              </template>
              <span>{{ $t("editMode") }}</span>
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
    Video,
  },
  data: () => ({
    drawer: false,
    languageMenu: false,
  }),
  computed: {
    localeCountry() {
      switch (this.$i18n.locale.split("-")[0]) {
        case "de":
          return "Deutsch";
        default:
          return "English";
      }
    },
  },
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
    },
    setLanguage(locale) {
      this.$i18n.locale = locale;
      document.documentElement.lang = locale;
    },
  },
  mounted() {
    const locale = this.$i18n.locale.split("-")[0]; // assume no dialects are supported
    document.documentElement.lang = this.$i18n.availableLocales.includes(locale)
      ? locale
      : this.$i18n.fallbackLocale;
  },
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
