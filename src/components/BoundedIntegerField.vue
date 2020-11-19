<template>
  <v-text-field
    v-model="value"
    v-bind:style="{ width: styleWidth + 'em' }"
    :min="min"
    :max="max"
    :label="label"
    :placeholder="placeholder.toString()"
    :rules="[inRange]"
    :hide-details="true"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    @input.native="onInput"
    @beforeinput.native="onValueInput"
    @keydown.enter="onEnter"
  ></v-text-field>
</template>

<script>
import Vue from "vue";
import { InputErrorType } from "vidsnip-utils";

const nonIntegerRegex = RegExp(/[^0-9]/g);
const beforeInputInsertTypeIncludes = "insert";
const allowedBeforeInputInsertTypes = [
  "insertText",
  //"insertReplacementText",
  "insertFromYank",
  "insertFromDrop",
  "insertFromPaste",
  "insertTranspose",
  "insertCompositionText",
  "insertFromComposition",
];
export default Vue.extend({
  name: "BoundedIntegerField",
  props: {
    min: {
      type: Number,
      default: Number.MIN_SAFE_INTEGER,
    },
    max: {
      type: Number,
      default: Number.MAX_SAFE_INTEGER,
    },
    placeholder: Number,
    label: String,
    inclusive: {
      type: Boolean,
      default: true,
    },
  },
  data: () => ({
    value: "",
    inRange: undefined,
  }),
  methods: {
    onEnter() {
      if (this.valid) this.$emit("enter");
    },
    onInput(event) {
      this.$emit("input", event);
    },
    inRangeInclusive(value) {
      return value >= this.min && value <= this.max;
    },
    inRangeExclusive(value) {
      return value > this.min && value < this.max;
    },
    onValueInput(event) {
      if (
        event.inputType.includes(beforeInputInsertTypeIncludes) &&
        (!allowedBeforeInputInsertTypes.includes(event.inputType) ||
          event.data.match(nonIntegerRegex) ||
          event.target.value.length +
            event.data.length -
            (event.target.selectionEnd - event.target.selectionStart) >
            this.width)
      )
        event.preventDefault();
    },
    clear() {
      this.value = "";
    },
  },
  computed: {
    width() {
      return Math.max(this.min.toString().length, this.max.toString().length);
    },
    styleWidth() {
      return this.width * 0.575;
    },
    integerValue() {
      return parseInt(this.value);
    },
    valid() {
      const value = this.integerValue;
      return isNaN(value) || this.inRange(value);
    },
  },
  watch: {
    valid(valid) {
      if (valid) this.$emit("valid");
      else
        this.$emit(
          "invalid",
          this.value < this.min
            ? { type: InputErrorType.LESS, min: this.min }
            : this.value > this.max
            ? { type: InputErrorType.GREATER, max: this.max }
            : { type: InputErrorType.UNKNOWN }
        );
    },
  },
  beforeMount() {
    this.inRange = this.inclusive
      ? this.inRangeInclusive
      : this.inRangeExclusive;
  },
});
</script>

<style lang="css">
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
