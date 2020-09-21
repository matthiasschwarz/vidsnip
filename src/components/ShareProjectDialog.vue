<template>
  <v-dialog :value="show" width="unset" @click:outside="show = false">
    <v-card>
      <v-card-title>
        <span>Share</span>
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ on: tooltip }">
            <v-btn icon v-on="{ ...tooltip }" @click="show = false"
              ><v-icon>mdi-close</v-icon></v-btn
            >
          </template>
          <span>Close</span>
        </v-tooltip>
      </v-card-title>
      <v-card-text>
        <v-row no-gutters>
          <v-col cols="12">
            <v-textarea
              v-model="value"
              outlined
              dense
              readonly
              auto-grow
              rows="2"
              hide-details="auto"
              style="word-break: break-all"
            >
              <template v-slot:append class="align-center">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on: tooltip }">
                    <v-btn icon v-on="{ ...tooltip }" @click="copyToClipboard"
                      ><v-icon>mdi-content-copy</v-icon></v-btn
                    >
                  </template>
                  <span>Copy</span>
                </v-tooltip>
              </template>
            </v-textarea>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ShareProjectDialog",
  data: () => ({
    show: false,
    value: ""
  }),
  watch: {
    show(value) {
      if (value) this.value = this.$store.getters["video/export"];
    }
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(this.value);
    }
  }
};
</script>

<style scoped></style>
