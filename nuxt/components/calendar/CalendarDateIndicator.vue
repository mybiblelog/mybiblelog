<template>
  <div class="calendar-date-indicator">
    <div class="mbl-title mbl-title--4">
      {{ selectedMonth }}
      <info-link :to="localePath('/about/page-features--calendar')" />
    </div>
  </div>
</template>

<script>
import InfoLink from '@/components/ui/InfoLink';

export default {
  components: {
    InfoLink,
  },
  props: {
    selectedDate: {
      type: Object,
      required: true,
    },
  },
  computed: {
    selectedMonth() {
      const jsDate = this.selectedDate.toDate();
      const month = jsDate.toLocaleString(this.$i18n.locale, { month: 'long' });
      return `${month} ${jsDate.getFullYear()}`;
    },
  },
};
</script>

<style scoped>
.calendar-date-indicator .mbl-title {
  margin-bottom: 0;
}
</style>
