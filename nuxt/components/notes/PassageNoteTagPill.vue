<template>
  <div class="passage-note-tag-pill" :style="tagStyle">
    {{ tag.label }}
  </div>
</template>

<script>
export default {
  name: 'PassageNoteTagPill',
  props: {
    tag: {
      type: Object,
      required: true,
      validator(tag) {
        return tag && typeof tag.label === 'string' && typeof tag.color === 'string';
      },
    },
  },
  computed: {
    tagStyle() {
      return {
        'background-color': this.tag.color,
      };
    },
  },
};
</script>

<style scoped>
.passage-note-tag-pill {
  font-size: 0.8em;
  color: var(--mbl-on-accent);
  text-shadow: 0 0 2px var(--mbl-text-stronger), 1px 1px 0 var(--mbl-overlay-50);
  padding: 0 0.5rem;
  border-radius: 0.25rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  max-width: 10rem;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}
</style>
