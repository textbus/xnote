<script lang="ts" setup>
import Button from '@/components/button.vue'
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { Commander, Query, QueryStateType } from '@textbus/core'
import { RefreshService } from '@/services/refresh.service'
import { strikeThroughFormatter } from '@/textbus/formatters/inline-element.formatter'
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
  const state = query.queryFormat(strikeThroughFormatter)

  if (state.state === QueryStateType.Normal) {
    commander.applyFormat(strikeThroughFormatter, true)
  } else {
    commander.unApplyFormat(strikeThroughFormatter)
  }
}

const sub = refreshService.onRefresh.subscribe(() => {
  const state = query.queryFormat(strikeThroughFormatter)
  viewModel.highlight = state.state === QueryStateType.Enabled
})

onUnmounted(() => {
  sub.unsubscribe()
})

</script>
<template>
  <Button @click="toggle">删除线</Button>
</template>
