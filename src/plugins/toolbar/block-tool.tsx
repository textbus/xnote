import { inject } from '@viewfly/core'
import { Commander } from '@textbus/core'

import { MenuItem } from '../../components/menu-item/menu-item'
import { Button } from '../../components/button/button'
import { Dropdown } from '../../components/dropdown/dropdown'
import { headingAttr } from '../../textbus/attributes/heading.attr'

export function BlockTool() {
  const commander = inject(Commander)

  function toBlock(value: any) {
    switch (value) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        commander.applyAttribute(headingAttr, value)
        break
    }
  }

  return () => {
    return (
      <Dropdown onCheck={toBlock} trigger={'hover'} menu={[
        {
          label: <MenuItem>标题 1</MenuItem>,
          value: 'h1'
        }, {
          label: <MenuItem>标题 2</MenuItem>,
          value: 'h2'
        }, {
          label: <MenuItem>标题 3</MenuItem>,
          value: 'h3'
        }, {
          label: <MenuItem>标题 4</MenuItem>,
          value: 'h4'
        }, {
          label: <MenuItem>标题 5</MenuItem>,
          value: 'h5'
        }, {
          label: <MenuItem>标题 6</MenuItem>,
          value: 'h6'
        },
      ]}>
        <Button arrow={true} highlight={false}>H1</Button>
      </Dropdown>
    )
  }
}
