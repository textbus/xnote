import { inject } from '@viewfly/core'

import { ToolService } from './tool.service'

export function useCommonState() {
  const toolService = inject(ToolService)
  return toolService.state
}
