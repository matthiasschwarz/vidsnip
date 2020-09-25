<template>
  <v-menu
    width="initial"
    tile
    v-model="show"
    :close-on-click="false"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template v-slot:activator="{ on: tooltip }">
          <v-btn
            text
            min-width="auto"
            class="text-body-2 pa-0"
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
            >{{ index + 1 }}</v-btn
          >
        </template>
        <span>{{ $t("editItem") }}</span>
      </v-tooltip>
    </template>
    <v-card v-if="show">
      <v-card-title>{{ $t("editIndex") }}</v-card-title>
      <v-card-text style="padding-bottom: 0">
        <v-list dense class="pa-0">
          <v-list-item class="pa-0">
            <v-row no-gutters justify="center">
              <v-col cols="auto" style="max-height: 48px">
                <BoundedIntegerField
                  :min="1"
                  :max="$store.getters['video/sections/sections'].length"
                  :placeholder="index + 1"
                  ref="inputField"
                  @valid="onValid"
                  @invalid="onInvalid"
                  @enter="onSave"
                ></BoundedIntegerField>
              </v-col>
            </v-row>
          </v-list-item>
          <v-list-item
            style="min-height: auto; padding-left: 0; padding-right: 0; padding-top: 8px"
          >
            <v-alert
              dense
              text
              type="error"
              ref="error"
              :icon="false"
              v-model="error"
              class="text-body-2 ma-0"
              >{{ errorMessage }}</v-alert
            >
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-row no-gutters>
          <v-col>
            <v-btn
              tile
              text
              block
              small
              color="green"
              @click="onSave"
              :disabled="error"
              >{{ $t("save") }}</v-btn
            >
          </v-col>
          <v-col>
            <v-btn tile text block small color="red" @click="onCancel">{{
              $t("cancel")
            }}</v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { InputErrorType } from "vidsnip-utils";
import BoundedIntegerField from "@/components/BoundedIntegerField";
export default {
  name: "IndexMenu",
  components: {
    BoundedIntegerField
  },
  props: {
    index: Number
  },
  data: () => ({
    show: false,
    errorMessage: ""
  }),
  computed: {
    error() {
      return this.errorMessage.length !== 0;
    }
  },
  methods: {
    onValid() {
      this.errorMessage = "";
    },
    onInvalid(error) {
      switch (error.type) {
        case InputErrorType.LESS:
          this.errorMessage = this.$t("error.index.lower", {
            value: error.min
          });
          break;
        case InputErrorType.GREATER:
          this.errorMessage = this.$t("error.index.higher", {
            value: error.max
          });
          break;
        default:
          this.errorMessage = this.$t("error.index.invalid");
      }
    },
    onSave() {
      const value = this.$refs.inputField.integerValue - 1;
      if (!isNaN(value) && this.index !== value)
        this.$store.dispatch("swapSectionWithHistory", {
          oldIndex: this.index,
          newIndex: value
        });
      this.show = false;
    },
    onCancel() {
      this.show = false;
    },
    clear() {
      this.errorMessage = "";
      this.$refs.inputField.clear();
    }
  },
  watch: {
    show(value) {
      if (!value) this.clear();
    }
  }
};
</script>

<style scoped>
.v-text-field {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
</style>
