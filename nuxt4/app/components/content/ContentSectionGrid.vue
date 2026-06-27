<template>
  <div ref="gridContainer" class="h3-grid-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
const gridContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!gridContainer.value) return;
  const hasExplicitTiles = gridContainer.value.querySelectorAll('.h3-grid-item').length > 0;
  if (!hasExplicitTiles) {
    processAutomatic(gridContainer.value);
  }
});

function processAutomatic(container: HTMLElement) {
  const h3Elements = Array.from(container.querySelectorAll('h3'));
  if (h3Elements.length === 0) return;

  const h3Sections: { h3: HTMLElement; content: Node[] }[] = [];
  let currentSection: { h3: HTMLElement; content: Node[] } | null = null;
  const introElements: Node[] = [];

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'H3') {
        if (currentSection) h3Sections.push(currentSection);
        currentSection = { h3: el, content: [] };
      }
      else if (currentSection) {
        currentSection.content.push(node);
      }
      else {
        introElements.push(node);
      }
    }
  });

  if (currentSection) h3Sections.push(currentSection);
  if (h3Sections.length === 0) return;

  introElements.forEach((node) => node.parentNode?.removeChild(node));

  h3Sections.forEach((section) => {
    const gridItem = document.createElement('div');
    gridItem.className = 'h3-grid-item';

    const h3 = section.h3;
    const h3Text = h3.textContent || '';
    const emojiMatch = h3Text.match(/^(\p{Emoji_Presentation}|\p{Emoji}️?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)/u);

    if (emojiMatch) {
      const emoji = emojiMatch[0];
      const textAfterEmoji = h3Text.slice(emoji.length).trim();
      h3.textContent = '';
      h3.appendChild(document.createTextNode(`${emoji} `));
      if (textAfterEmoji) {
        const textSpan = document.createElement('span');
        textSpan.className = 'h3-gradient-text';
        textSpan.textContent = textAfterEmoji;
        h3.appendChild(textSpan);
      }
    }
    else {
      const textSpan = document.createElement('span');
      textSpan.className = 'h3-gradient-text';
      textSpan.textContent = h3Text;
      h3.textContent = '';
      h3.appendChild(textSpan);
    }

    h3.parentNode?.removeChild(h3);
    gridItem.appendChild(h3);
    section.content.forEach((contentEl) => {
      contentEl.parentNode?.removeChild(contentEl);
      gridItem.appendChild(contentEl);
    });

    container.appendChild(gridItem);
  });

  introElements.reverse().forEach((node) => {
    container.insertBefore(node, container.firstChild);
  });
}
</script>

<style scoped>
.h3-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0 2rem;
}

@media screen and (max-width: 768px) {
  .h3-grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

:deep(.h3-grid-item) {
  border: 2px solid;
  border-image-slice: 1;
  border-image-source: linear-gradient(to right, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

:deep(.h3-grid-item h3) {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--secondary-color);
}

:deep(.h3-grid-item .h3-gradient-text) {
  background: linear-gradient(to right, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

:deep(.h3-grid-item p) {
  margin-bottom: 0.5rem;
  color: var(--mbl-text-body);
  line-height: 1.6;
}

:deep(.h3-grid-item p:last-child) { margin-bottom: 0; }

:deep(.h3-grid-item ul),
:deep(.h3-grid-item ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  color: var(--mbl-text-body);
}

:deep(.h3-grid-item a) {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

:deep(.h3-grid-item a:hover) { text-decoration: underline; }
</style>
