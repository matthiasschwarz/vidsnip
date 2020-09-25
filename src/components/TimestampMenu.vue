<template>
  <v-menu
    width="initial"
    tile
    v-model="show"
    :close-on-click="false"
    :close-on-content-click="false"
    @keydown.esc="show = false"
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
            >{{ initial.toString() }}</v-btn
          >
        </template>
        <span>{{ $t("editItem") }}</span>
      </v-tooltip>
    </template>
    <TimestampEdit
      v-if="show"
      :type="type"
      :initial="initial"
      :min="min"
      :max="max"
      ref="edit"
      @save="onSave"
      @cancel="show = false"
    ></TimestampEdit>
  </v-menu>
</template>

<script>
import { Timestamp } from "vidsnip-utils";
import TimestampEdit from "@/components/TimestampEdit";

export default {
  name: "TimestampMenu",
  components: { TimestampEdit },
  props: {
    type: String,
    initial: Timestamp,
    min: Object,
    max: Object
  },
  data: () => ({
    show: false
  }),
  methods: {
    onSave(timestamp) {
      if (this.initial.fullSeconds !== timestamp.fullSeconds)
        this.$emit("save", timestamp);
      this.show = false;
    }
  }
};
</script>

<style scoped></style>
