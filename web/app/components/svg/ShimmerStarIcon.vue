<template>
  <div class="shimmer-star" :style="starStyle" />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ width?: string; height?: string }>(), {
  width: '24px',
  height: '24px',
});

// Create SVG data URI for mask using the star from big-favorite-star-svgrepo-com.svg
const starPath = 'M210.163,22.11c3.605-7.304,11.044-11.929,19.189-11.929c8.146-0.001,15.585,4.624,19.19,11.928l54.307,110.03c3.117,6.315,9.142,10.693,16.112,11.706l121.43,17.646c8.061,1.171,14.758,6.818,17.275,14.564c2.517,7.747,0.418,16.251-5.415,21.937l-87.869,85.648c-5.044,4.916-7.345,11.999-6.155,18.941l20.739,120.936c1.377,8.028-1.924,16.142-8.513,20.929c-6.59,4.788-15.326,5.419-22.536,1.629l-108.606-57.095c-6.234-3.277-13.681-3.277-19.915,0l-108.608,57.094c-7.21,3.791-15.946,3.159-22.536-1.629c-6.59-4.788-9.89-12.902-8.513-20.93l20.744-120.934c1.19-6.942-1.111-14.025-6.154-18.942L6.463,197.991c-5.832-5.686-7.932-14.189-5.415-21.937c2.517-7.747,9.214-13.393,17.274-14.564l121.431-17.647c6.97-1.013,12.996-5.391,16.113-11.707L210.163,22.11z';
const svgDataUri = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458.714 458.714"><path fill="white" d="${starPath}"/></svg>`,
)}`;

const starStyle = computed(() => ({
  width: props.width,
  height: props.height,
  maskImage: `url("${svgDataUri}")`,
  WebkitMaskImage: `url("${svgDataUri}")`,
}));
</script>

<style scoped>
.shimmer-star {
  aspect-ratio: 1;

  /* Decorative gradient palette (intentional asset styling, not theme tokens). */
  background: linear-gradient(90deg, #FDD81D 0%, #FDD81D 20%, #FCB634 60%, #FCB634 80%, #FDD81D 100%);
  background-size: 200% 100%;

  /* SVG mask */
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;

  /* Animation */
  animation: scrollGradient 2s linear infinite;
}

@keyframes scrollGradient {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: -200% 0%;
  }
}
</style>
