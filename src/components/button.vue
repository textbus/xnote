<script lang="ts" setup>
defineProps({
  highlight: Boolean,
  disabled: Boolean
})
</script>
<template>
  <button type="button" class="editor-btn" :disabled="disabled" :class="{highlight}">
    <slot/>
  </button>
</template>
<style lang="scss" scoped>
.editor-btn {
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
</style>
