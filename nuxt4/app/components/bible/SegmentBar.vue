<template>
  <div class="segment-bar" :style="barStyle">
    <div
      v-for="segment in segments"
      :key="segment.id"
      class="segment"
      :title="displayVerseRange(segment.startVerseId, segment.endVerseId)"
      :class="{ 'is-read': segment.read }"
      :style="{ flex: segment.percentage }"
    />
  </div>
</template>

<script setup lang="ts">
import { Bible } from '@mybiblelog/shared';

const props = withDefaults(defineProps<{
  segments?: Array<Record<string, unknown>>;
  backgroundColor?: string;
  foregroundColor?: string;
  hoverColor?: string;
  thick?: boolean;
}>(), {
  segments: () => [],
  backgroundColor: 'var(--mbl-progress-track-bg)',
  foregroundColor: 'var(--mbl-link-bright)',
  hoverColor: 'var(--primary-color)',
  thick: false,
});

const { locale } = useI18n();

const barStyle = computed(() => ({
  height: props.thick ? '1rem' : '0.5rem',
  background: props.backgroundColor,
  '--segment-read-color': props.foregroundColor,
  '--segment-read-hover-color': props.hoverColor,
}));

function displayVerseRange(startVerseId: number, endVerseId: number) {
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
}
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
