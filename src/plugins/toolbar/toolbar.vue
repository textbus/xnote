<script setup lang="ts">
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { Selection } from '@textbus/core'
import { onUnmounted } from 'vue'

const injector = useReflectiveInjector()
const selection = injector.get(Selection)
const subscription = selection.onChange.subscribe(() => {
  console.log(4)
})

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>
<template>
  <div class="editor-toolbar">
    <div class="editor-toolbar-item">
      <button class="editor-toolbar-btn" type="button">h1</button>
    </div>
    <div class="editor-toolbar-item">
      <button class="editor-toolbar-btn" type="button">h2</button>
    </div>
    <div class="editor-toolbar-item">
      <button class="editor-toolbar-btn" type="button">h3</button>
    </div>
    <div class="editor-toolbar-item">
      <button class="editor-toolbar-btn" type="button">h4</button>
    </div>
  </div>
</template>
<style scoped lang="scss">
.editor-toolbar-btn {
  border: none;
  background: none;
  outline: none;
  padding: 6px 5px;
  cursor: pointer;
  border-radius: 3px;
  transition: all .2s;

  &:hover {
    background: rgba(0, 0, 0, .1);
  }
}

.editor-toolbar-item {
  padding: 3px;
}

.editor-toolbar {
  position: absolute;
  background: #fff;
  border-radius: 5px;
  padding: 0 6px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid #dee0e3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, .08);
  display: flex;
  font-size: 18px;
  text-align: left;
  //display: none;
}
</style>
