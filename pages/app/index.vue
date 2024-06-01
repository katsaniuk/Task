<script setup lang="ts">
const pageTitle = useState('page-title')
onMounted(() => {
  pageTitle.value = 'My App'
})
</script>

<template>
  <div>
    <VCard>
      Hello World
    </VCard>
  </div>
</template>
