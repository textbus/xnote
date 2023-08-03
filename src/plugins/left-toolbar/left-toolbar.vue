<script setup lang="ts">
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { onUnmounted, reactive } from 'vue'
import { LeftToolbarService } from '@/services/left-toolbar.service'
import { Renderer, Selection, throttleTime } from '@textbus/core'
import { RefreshService } from '@/services/refresh.service'
import Bold from '@/plugins/_common/bold.vue'
import Italic from '@/plugins/_common/italic.vue'
import StrikeThrough from '@/plugins/_common/strike-through.vue'
import Underline from '@/plugins/_common/underline.vue'

const injector = useReflectiveInjector([
  RefreshService
])
const leftToolbarService = injector.get(LeftToolbarService)
const renderer = injector.get(Renderer)
const selection = injector.get(Selection)

const position = reactive({
  left: 0,
  top: 0,
  display: false
})

let timer = 0
const subscription = leftToolbarService.onComponentActive.subscribe((c) => {
  clearTimeout(timer)
  if (!c) {
    if (position.display) {
      timer = setTimeout(() => {
        position.display = false
      }, 200)
    }
    return
  }
  position.display = true
  const vNode = renderer.getVNodeByComponent(c)
  const nativeNode = renderer.getNativeNodeByVNode(vNode) as HTMLElement
  position.left = nativeNode.offsetLeft
  position.top = nativeNode.offsetTop
})

subscription.add(selection.onChange.pipe(throttleTime(30)).subscribe(() => {
  leftToolbarService.onRefresh.next()
}))

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>
<template>
  <div class="editor-left-toolbar">
    <div class="editor-left-btn-wrap" :style="{
      left: position.left + 'px',
      top: position.top + 'px',
      display: position.display ? 'block' : 'none'
    }">
      <button type="button" class="editor-left-btn">
        <span></span>
        <span></span>
      </button>
    </div>
    <div>
      <Bold/>
      <Italic/>
      <StrikeThrough/>
      <Underline/>
    </div>
  </div>
</template>
<style scoped lang="scss">
.editor-left-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #aaa;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0;
  cursor: pointer;

  span {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -7px;
    margin-top: -1px;
    width: 14px;
    height: 2px;
    background-color: #888;
    transition: all .2s;

    &:last-child {
      transform: rotateZ(90deg);
    }
  }

  &:hover {
    span {
      background-color: #296eff;
    }
  }
}

.editor-left-btn-wrap {
  position: absolute;
  transition: all .2s;
}

.editor-left-toolbar {
  position: absolute;
  left: -30px;
  top: 0;
}
</style>
