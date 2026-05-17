import { inject } from '@viewfly/core'
import { Commander } from '@textbus/core'
import { Button } from '@viewfly/ui-components'
import { IconGlyph } from '@viewfly/ui-icons'

import { linkFormatter } from '../../textbus/formatters/link'
import { useCommonState } from './_common/common-state'
import { commentFormatter } from '../../textbus/formatters/comment'

export function CleanFormatsTool() {
  const commonState = useCommonState()
  const commander = inject(Commander)

  function clean() {
    commander.cleanFormats([
      linkFormatter,
      commentFormatter,
    ])
  }

  return () => {
    return (
      <Button variant={'text'}
              size={'small'}
              inlineCompact={true}
              chevronGapless={true}
              disabled={commonState().inSourceCode || commonState().readonly || commonState().selectEmbed}
              onClick={clean}>
        <IconGlyph name={'clear-formatting'}/>
      </Button>
    )
  }
}
