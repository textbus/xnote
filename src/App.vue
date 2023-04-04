<template>
  <div>
    <div class="editor-root" ref="editorRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { XNote } from '@/textbus/editor';
const editorRef = ref()

const editor = new XNote()
onMounted(() => {
  editor.mount(editorRef.value)
})
onBeforeUnmount(() => {
  editor.destroy()
})
</script>

<style lang="scss">
.editor-root {
  width: 730px;
  margin: 0 auto;
}
</style>
