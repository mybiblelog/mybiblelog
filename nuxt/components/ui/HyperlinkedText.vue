<template>
  <span class="hyperlinked-text">
    <template v-for="node in content">
      <span v-if="node.type === 'text'" :key="node.value">{{ node.value }}</span>
      <a v-if="node.type === 'link'" :key="node.value" :href="node.value" target="_blank" rel="noreferrer nofollow">{{ node.value }}</a>
    </template>
  </span>
</template>

<script>
const linkRegex = /(https?:\/\/[^\s]+)/g;

export default {
  name: 'HyperlinkedText',
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  computed: {
    content() {
      const contentItems = [];
      const matches = this.text.matchAll(linkRegex);
      let lastEnd = 0;

      for (const match of matches) {
        const text = match[0];
        const start = match.index;
        const end = match.index + text.length;

        // ensure any text preceding the first link is captured
        if (!contentItems.length && start > 0) {
          const startText = this.text.substr(0, start);
          const startTextNode = this.createTextNode(startText);
          contentItems.push(startTextNode);
        }
        // ensure any text following the previous link is captured
        else if (lastEnd < start) {
          const midText = this.text.substr(lastEnd, start - lastEnd);
          const midTextNode = this.createTextNode(midText);
          contentItems.push(midTextNode);
        }

        // capture this link
        const linkText = this.text.substr(start, text.length);
        const linkNode = this.createLinkNode(linkText);
        contentItems.push(linkNode);

        lastEnd = end;
      }

      // ensure any text following the final link is captured
      if (lastEnd < this.text.length) {
        const endText = this.text.substr(lastEnd, this.text.length - lastEnd);
        const endTextNode = this.createTextNode(endText);
        contentItems.push(endTextNode);
      }

      return contentItems;
    },
  },
  methods: {
    createTextNode(value) {
      return {
        type: 'text',
        value,
      };
    },
    createLinkNode(value) {
      return {
        type: 'link',
        value,
      };
    },
  },
};
</script>

<style scoped>

</style>
