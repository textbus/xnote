import { inject } from '@viewfly/core'
import { Commander } from '@textbus/core'

import { Button } from '../../components/button/button'
import { linkFormatter } from '../../textbus/formatters/link'
import { useCommonState } from './_common/common-state'

export function CleanFormatsTool() {
  const commonState = useCommonState()
  const commander = inject(Commander)

  function clean() {
    commander.cleanFormats([
      linkFormatter
    ])
  }

  return () => {
    return (
      <Button disabled={commonState().inSourceCode || commonState().readonly} onClick={clean}><span class="xnote-icon-clear-formatting"></span></Button>
    )
  }
}
