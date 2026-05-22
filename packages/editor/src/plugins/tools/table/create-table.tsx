import { createRef, inject, reactive } from '@viewfly/core'

import { I18nService } from '../../../services/i18n.service'
import './create-table.scss'

export interface TableParams {
  row: number
  column: number
}

export interface CreateTableProps {
  onChange(params: TableParams): void
}

export function CreateTable(props: CreateTableProps) {
  const i18n = inject(I18nService)
  const viewModel = reactive({
    row: 0,
    column: 0,
  })
  const gridRef = createRef<HTMLDivElement>()

  function mouseEnter(ev: MouseEvent) {
    const target = ev.target as HTMLElement
    const index = Array.from(gridRef.value!.children).indexOf(target)

    if (index > -1) {
      viewModel.column = index % 10 + 1
      viewModel.row = Math.floor((index + 10) / 10)
    }
  }

  function mouseLeave() {
    viewModel.row = viewModel.column = 0
  }

  return () => {
    return (
      <div class="xnote-create-table">
        <div class="xnote-create-table__grid" ref={gridRef}
             onClick={() => {
               props.onChange({
                 row: viewModel.row,
                 column: viewModel.column,
               })
             }}
             onMouseOver={mouseEnter}
             onMouseLeave={mouseLeave}>
          {
            Array.from({ length: 100 }).map((_, index) => {
              const columnCount = index % 10 + 1
              const rowCount = Math.floor((index + 10) / 10)
              return <div class={{
                'xnote-create-table__grid-active': columnCount <= viewModel.column && rowCount <= viewModel.row
              }}/>
            })
          }
        </div>
        <div class="xnote-create-table__info">
          <span>{i18n.t('tableCreate.rows')}: {viewModel.row}</span>
          <span>{i18n.t('tableCreate.columns')}: {viewModel.column}</span>
        </div>
      </div>
    )
  }
}
