<template>
  <v-card>
    <v-card-title>Edit section</v-card-title>
    <v-card-text style="padding-bottom: 0">
      <v-list dense style="padding-top: 0">
        <v-list-item>
          <v-list-item-title>Start</v-list-item-title>
        </v-list-item>
        <v-list-item style="justify-content: center">
          <TimestampField
            :initial="start"
            :max="{ type: 'section end', value: end }"
          ></TimestampField>
        </v-list-item>
        <v-list-item>
          <v-list-item-title>End</v-list-item-title>
        </v-list-item>
        <v-list-item style="justify-content: center">
          <TimestampField
            :initial="end"
            :max="max"
            class="pa-0"
          ></TimestampField>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions style="padding-top: 0">
      <v-row no-gutters>
        <v-col>
          <v-btn tile text block small color="green">Save</v-btn>
        </v-col>
        <v-col>
          <v-btn tile text block small color="red">Cancel</v-btn>
        </v-col>
      </v-row>
    </v-card-actions>
  </v-card>
</template>

<script>
import TimestampField from "./TimestampField";
import { Timestamp } from "vidsnip-utils";
export default {
  name: "SectionEdit",
  components: { TimestampField },
  props: {
    start: {
      type: Timestamp,
      required: true
    },
    end: {
      type: Timestamp,
      required: true
    },
    max: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped></style>
