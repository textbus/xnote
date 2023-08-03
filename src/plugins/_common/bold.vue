<script lang="ts" setup>
import Button from '@/components/button.vue'
import { useReflectiveInjector } from '@tanbo/vue-di-plugin'
import { Commander, Query, QueryStateType } from '@textbus/core'
import { RefreshService } from '@/services/refresh.service'
import { boldFormatter } from '@/textbus/formatters/inline-element.formatter'
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
  const state = query.queryFormat(boldFormatter)

  if (state.state === QueryStateType.Normal) {
    commander.applyFormat(boldFormatter, true)
  } else {
    commander.unApplyFormat(boldFormatter)
  }
}

const sub = refreshService.onRefresh.subscribe(() => {
  const state = query.queryFormat(boldFormatter)
  viewModel.highlight = state.state === QueryStateType.Enabled
})

onUnmounted(() => {
  sub.unsubscribe()
})

</script>
<template>
  <Button @click="toggle">加粗</Button>
</template>
