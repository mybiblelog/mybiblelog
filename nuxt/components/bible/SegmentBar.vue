<template>
  <div class="segment-bar" :style="barStyle">
    <div
      v-for="segment in segments"
      :key="segment.id"
      class="segment"
      :title="displayVerseRange(segment.startVerseId, segment.endVerseId)"
      :class="segmentClass(segment)"
      :style="segmentStyle(segment)"
    />
  </div>
</template>

<script>
import { Bible } from '@mybiblelog/shared';

export default {
  name: 'SegmentBar',
  props: {
    segments: {
      type: Array, // { weight, foregroundColor }
      default: () => [],
    },
    backgroundColor: {
      type: String,
      default: 'var(--mbl-progress-track-bg)',
    },
    foregroundColor: {
      type: String,
      default: 'var(--mbl-link-bright)',
    },
    hoverColor: {
      type: String,
      default: 'var(--primary-color)',
    },
    thick: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    barStyle() {
      return {
        height: this.thick ? '1rem' : '0.5rem',
        background: this.backgroundColor,
        '--segment-read-color': this.foregroundColor,
        '--segment-read-hover-color': this.hoverColor,
      };
    },
  },
  methods: {
    displayVerseRange(startVerseId, endVerseId) {
      return Bible.displayVerseRange(startVerseId, endVerseId, this.$i18n.locale);
    },
    segmentStyle(segment) {
      return {
        flex: segment.percentage,
      };
    },
    segmentClass(segment) {
      return {
        'is-read': segment.read,
      };
    },
  },
};
</script>

<style>
.segment-bar {
  border-radius: 5px;
  overflow: hidden;
  line-height: 0;
  display: flex;
  justify-content: stretch;
}
.segment {
  display: inline-block;
  height: 100%;

  transition: background 0.2s;
}

.segment.is-read {
  background-color: var(--segment-read-color);
}

@media (hover: hover) {
  .segment.is-read:hover {
    background-color: var(--segment-read-hover-color);
  }
}
</style>
