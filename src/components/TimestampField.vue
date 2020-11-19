<template>
  <v-list dense class="pa-0">
    <v-list-item class="pa-0" v-if="units.length !== 0">
      <v-row no-gutters justify="center">
        <v-col align-self="center">
          <div class="d-flex justify-center">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn
                  icon
                  v-on="on"
                  @click="setToCurrentTime"
                  :disabled="currentTimeDisabled"
                  style="margin-top: 8px; margin-right: 8px"
                >
                  <v-icon> mdi-arrow-expand-horizontal </v-icon>
                </v-btn>
              </template>
              <span>
                {{ $t("currentTime") }}
              </span>
            </v-tooltip>
          </div>
        </v-col>
        <template v-for="(unit, index) in units">
          <v-col
            cols="auto"
            :key="'separator-' + index"
            v-if="index !== 0"
            style="max-height: 48px; padding-left: 4px; padding-right: 4px"
          >
            <div style="margin-top: 23px">{{ unit.format.separator }}</div>
          </v-col>
          <v-col cols="auto" :key="'unit-' + index" style="max-height: 48px">
            <BoundedIntegerField
              :label="unit.format.shortName"
              :min="unit.format.minValue"
              :max="unit.format.maxValue"
              :placeholder="initial.getUnit(unit.format.identifier).value"
              :ref="unitRef(unit)"
              @input="onFieldInput(unit, $event)"
              @enter="onEnter"
            ></BoundedIntegerField>
          </v-col>
        </template>
        <v-col align-self="center" class="text-right">
          <div class="d-flex justify-center">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-btn
                  icon
                  v-on="on"
                  @click="setToInitial"
                  :disabled="deleteDisabled"
                  style="margin-top: 8px; margin-left: 8px"
                >
                  <v-icon> mdi-delete </v-icon>
                </v-btn>
              </template>
              <span>
                {{ $t("delete") }}
              </span>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
    </v-list-item>
    <v-list-item
      style="
        min-height: auto;
        padding-left: 0;
        padding-right: 0;
        padding-top: 8px;
      "
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
</template>

<script>
import Vue from "vue";
import { Timestamp, capitalizeFirstLetter } from "vidsnip-utils";
import BoundedIntegerField from "@/components/BoundedIntegerField";
// TODO left / right key to jump to the next / previous unit
export default Vue.extend({
  name: "TimestampField",
  components: { BoundedIntegerField },
  props: {
    type: String,
    initial: Timestamp,
    min: Object,
    max: Object,
  },
  data: () => ({
    value: Timestamp,
    invalid: [],
  }),
  computed: {
    currentTimeDisabled() {
      return (
        (this.max &&
          this.$store.getters["video/currentTime"].fullSeconds >=
            this.max.value.fullSeconds) ||
        (this.min &&
          this.$store.getters["video/currentTime"].fullSeconds <=
            this.min.value.fullSeconds)
      );
    },
    deleteDisabled() {
      for (const unit of this.units)
        if (this.$refs[this.unitRef(unit)][0].value !== "") return false;
      return true;
    },
    error() {
      return this.invalid.length !== 0;
    },
    errorMessage() {
      const error = this.invalid[this.invalid.length - 1];
      if (error !== undefined) {
        switch (error.type) {
          case "UnitRange":
            return this.$t("error.timestamp.range", {
              name: capitalizeFirstLetter(
                this.$t(`unit.${error.args.identifier}`).toString()
              ),
              min: error.args.minValue,
              max: error.args.maxValue,
            });
          case "HigherTimestamp":
            return this.$t("error.timestamp.higher", {
              name: this.$t(error.args.type),
              value: error.args.value.toString(),
            });
          case "LowerTimestamp":
            return this.$t("error.timestamp.lower", {
              name: this.$t(error.args.type),
              value: error.args.value.toString(),
            });
          case "NoUnits":
            return this.$t("error.timestamp.unit");
        }
      }
      return "";
    },
    units() {
      return this.max.value.trimToArray();
    },
  },
  mounted() {
    this.value = this.initial.clone();
  },
  methods: {
    setToCurrentTime() {
      this.value = this.$store.getters["video/currentTime"].clone();
      for (const unit of this.units) {
        const ref = this.$refs[this.unitRef(unit)][0];
        const value = this.value.getUnitValue(unit.format.identifier);
        const oldValue = ref.value;
        if (this.initial.getUnitValue(unit.format.identifier) === value)
          ref.value = "";
        else if (value !== oldValue) ref.value = value;
      }
      if (this.invalid.length !== 0) {
        this.invalid = [];
        this.$emit("valid");
      }
    },
    setToInitial() {
      this.value = this.initial.clone();
      for (const unit of this.units)
        this.$refs[this.unitRef(unit)][0].value = "";
      if (this.invalid.length !== 0) {
        this.invalid = [];
        this.$emit("valid");
      }
    },
    onEnter() {
      if (!this.error) this.$emit("enter", this.value);
    },
    onFieldInput(unit, event) {
      const unitField = this.unitField(unit);
      if (!event.target.value)
        this.value.copyUnitValue(unit.format.identifier, this.initial);
      else if (unitField.valid) {
        this.value.setUnitValue(unit.format.identifier, unitField.integerValue);
        const index = this.invalid.findIndex(
          (value) => value.type === "UnitRange" && value.args === unit.format
        );
        if (index !== -1) {
          this.invalid.splice(index, 1);
          if (this.invalid.length === 0) this.$emit("valid");
        }
      } else {
        if (
          this.invalid.findIndex(
            (value) => value.type === "UnitRange" && value.args === unit.format
          ) === -1
        ) {
          const error = {
            type: "UnitRange",
            args: unit.format,
          };
          this.invalid.push(error);
          this.$emit("invalid", {
            invalid: error,
            array: this.invalid,
          });
        }
      }

      function timestampRange(it, predicate, type, args) {
        const index = it.invalid.findIndex((value) => value.type === type);
        if (predicate) {
          if (index === -1) {
            const error = { type, args };
            it.invalid.push(error);
            it.$emit("invalid", {
              invalid: error,
              array: it.invalid,
            });
          }
        } else if (index !== -1) {
          it.invalid.splice(index, 1);
          if (it.invalid.length === 0) it.$emit("valid");
        }
      }

      if (this.min)
        timestampRange(
          this,
          this.value.fullSeconds <= this.min.value.fullSeconds,
          "LowerTimestamp",
          this.min
        );

      if (this.max)
        timestampRange(
          this,
          this.value.fullSeconds >= this.max.value.fullSeconds,
          "HigherTimestamp",
          this.max
        );
    },
    unitRef(unit) {
      return unit.format.identifier + "Field";
    },
    unitField(unit) {
      return this.$refs[this.unitRef(unit)][0];
    },
    clear() {
      for (const unit of this.units) this.unitField(unit).clear();
      this.invalid = [];
      this.value = this.initial.clone();
    },
  },
});
</script>

<style scoped>
.centered-input >>> input {
  text-align: center;
}
</style>
