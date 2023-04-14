<script setup lang="ts">
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { onUnmounted, reactive } from 'vue'
import { LeftToolbarService } from '@/services/left-toolbar.service'
import { Renderer } from '@textbus/core'

const injector = useReflectiveInjector()
const leftToolbarService = injector.get(LeftToolbarService)
const renderer = injector.get(Renderer)
const position = reactive({
  left: 0,
  top: 0,
  display: false
})
const subscription = leftToolbarService.onComponentActive.subscribe((c) => {
  if (!c) {
    position.display = false
    return
  }
  position.display = true
  const vNode = renderer.getVNodeByComponent(c)
  const nativeNode = renderer.getNativeNodeByVNode(vNode) as HTMLElement
  position.left = nativeNode.offsetLeft
  position.top = nativeNode.offsetTop
})

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>
<template>
  <div class="editor-left-toolbar">
    <div class="editor-left-btn" :style="{
      left: position.left + 'px',
      top: position.top + 'px',
      display: position.display ? 'block' : 'none'
    }">
      <button type="button">+</button>
    </div>
  </div>
</template>
<style scoped lang="scss">
.editor-left-btn {
  position: absolute;
  transition: all .2s;
}

.editor-left-toolbar {
  position: absolute;
  left: -30px;
  top: 0;
}
</style>
