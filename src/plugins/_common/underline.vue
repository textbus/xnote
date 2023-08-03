<script lang="ts" setup>
import Button from '@/components/button.vue'
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { Commander, Query, QueryStateType } from '@textbus/core'
import { RefreshService } from '@/services/refresh.service'
import { underlineFormatter } from '@/textbus/formatters/inline-element.formatter'
import { onUnmounted, reactive } from 'vue'

const injector = useReflectiveInjector()
const query = injector.get(Query)
const refreshService = injector.get(RefreshService)
const commander = injector.get(Commander)

let viewModel = reactive({
  highlight: false,
  disabled: false,
})

function toggle() {
  const state = query.queryFormat(underlineFormatter)

  if (state.state === QueryStateType.Normal) {
    commander.applyFormat(underlineFormatter, true)
  } else {
    commander.unApplyFormat(underlineFormatter)
  }
}

const sub = refreshService.onRefresh.subscribe(() => {
  const state = query.queryFormat(underlineFormatter)
  viewModel.highlight = state.state === QueryStateType.Enabled
})

onUnmounted(() => {
  sub.unsubscribe()
})

</script>
<template>
  <Button @click="toggle">下划线</Button>
</template>
