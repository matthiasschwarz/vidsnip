<template>
  <v-card>
    <v-card-title>{{ type }}</v-card-title>
    <v-card-text style="padding-bottom: 0">
      <TimestampField
        v-bind="$attrs"
        :min="min"
        :max="max"
        ref="field"
        @valid="disabledSave = false"
        @invalid="disabledSave = true"
        @enter="onSave"
      ></TimestampField>
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
            @click="onSave()"
            :disabled="disabledSave"
            >{{ $t("save") }}</v-btn
          >
        </v-col>
        <v-col>
          <v-btn tile text block small color="red" @click="onCancel()">{{
            $t("cancel")
          }}</v-btn>
        </v-col>
      </v-row>
    </v-card-actions>
  </v-card>
</template>

<script>
import Vue from "vue";
import TimestampField from "./TimestampField";
export default Vue.extend({
  name: "TimestampEdit",
  inheritAttrs: false,
  props: {
    type: {
      type: String,
      required: true,
    },
    min: Object,
    max: Object,
  },
  data: () => ({
    disabledSave: false,
  }),
  components: { TimestampField },
  methods: {
    field() {
      return this.$refs.field;
    },
    onSave() {
      this.$emit("save", this.field().value);
    },
    onCancel() {
      this.$emit("cancel");
    },
    clear() {
      this.field().clear();
      this.disabledSave = false;
    },
  },
});
</script>

<style scoped></style>
