import { Commander, ContentType, Query, QueryStateType, Selection, Slot, Textbus } from '@textbus/core'
import { inject } from '@viewfly/core'

import { headingAttr } from '../../textbus/attributes/heading.attr'
import { paragraphComponent } from '../../textbus/components/paragraph/paragraph.component'
import { todolistComponent } from '../../textbus/components/todolist/todolist.component'
import { blockquoteComponent } from '../../textbus/components/blockqoute/blockquote.component'
import { sourceCodeComponent, SourceCodeComponentState } from '../../textbus/components/source-code/source-code.component'
import { tableComponent } from '../../textbus/components/table/table.component'
import { highlightBoxComponent } from '../../textbus/components/highlight-box/highlight-box.component'

export function useBlockTransform() {
  const commander = inject(Commander)
  const textbus = inject(Textbus)
  const query = inject(Query)
  const selection = inject(Selection)
  return function (value: string) {
    switch (value) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        commander.applyAttribute(headingAttr, value)
        break
      case 'paragraph':
        commander.unApplyAttribute(headingAttr)
        commander.transform({
          target: paragraphComponent,
          multipleSlot: false,
          slotFactory() {
            return new Slot([
              ContentType.InlineComponent,
              ContentType.Text
            ])
          }
        })
        break
      case 'table': {
        const table = tableComponent.createInstance(textbus)
        commander.insert(table)
        if (selection.commonAncestorSlot?.isEmpty && selection.commonAncestorComponent?.name === paragraphComponent.name) {
          commander.replaceComponent(selection.commonAncestorComponent, table)
        } else {
          commander.insert(table)
        }
      }
        break
      case 'todolist':
        commander.unApplyAttribute(headingAttr)
        commander.transform({
          target: todolistComponent,
          multipleSlot: false,
          slotFactory() {
            return new Slot([
              ContentType.InlineComponent,
              ContentType.Text
            ])
          },
          stateFactory() {
            return {
              checked: false
            }
          }
        })
        break
      case 'blockquote': {
        const state = query.queryComponent(blockquoteComponent)
        if (state.state === QueryStateType.Enabled) {
          const current = state.value!
          const parent = current.parent!

          const index = parent.indexOf(current)

          parent.retain(index)

          commander.removeComponent(current)

          current.slots.get(0)!.sliceContent().forEach(i => {
            parent.insert(i)
          })
        } else {
          const block = blockquoteComponent.createInstance(textbus)
          const slot = block.slots.get(0)!
          if (selection.startSlot === selection.endSlot) {
            const parentComponent = selection.startSlot!.parent!
            const parentSlot = parentComponent.parent!
            const position = parentSlot.indexOf(parentComponent)
            slot.insert(parentComponent)
            parentSlot.retain(position)
            parentSlot.insert(block)
          } else {
            const commonAncestorSlot = selection.commonAncestorSlot!
            const scope = selection.getCommonAncestorSlotScope()!
            commonAncestorSlot.cut(scope.startOffset, scope.endOffset).sliceContent().forEach(i => {
              slot.insert(i)
            })
            commonAncestorSlot.retain(scope.startOffset)
            commonAncestorSlot.insert(block)
          }
        }
      }
        break
      case 'sourceCode': {
        const state = query.queryComponent(sourceCodeComponent)
        if (state.state === QueryStateType.Enabled) {
          commander.transform({
            target: paragraphComponent,
            multipleSlot: false,
            slotFactory() {
              return new Slot([
                ContentType.InlineComponent,
                ContentType.Text
              ])
            }
          })
        } else {
          commander.transform({
            target: sourceCodeComponent,
            multipleSlot: true,
            slotFactory() {
              return new Slot([
                ContentType.Text
              ])
            },
            stateFactory(): SourceCodeComponentState {
              return {
                lang: '',
                theme: '',
                lineNumber: true
              }
            }
          })
        }
      }
        break
      case 'highlightBox': {
        const state = query.queryComponent(highlightBoxComponent)
        if (state.state === QueryStateType.Enabled) {
          const current = state.value!
          const parent = current.parent!

          const index = parent.indexOf(current)

          parent.retain(index)

          commander.removeComponent(current)

          current.slots.get(0)!.sliceContent().forEach(i => {
            parent.insert(i)
          })
        } else {
          const block = highlightBoxComponent.createInstance(textbus)
          const slot = block.slots.get(0)!
          if (selection.startSlot === selection.endSlot) {
            const parentComponent = selection.startSlot!.parent!
            const parentSlot = parentComponent.parent!
            const position = parentSlot.indexOf(parentComponent)
            slot.insert(parentComponent)
            parentSlot.retain(position)
            parentSlot.insert(block)
          } else {
            const commonAncestorSlot = selection.commonAncestorSlot!
            const scope = selection.getCommonAncestorSlotScope()!
            commonAncestorSlot.cut(scope.startOffset, scope.endOffset).sliceContent().forEach(i => {
              slot.insert(i)
            })
            commonAncestorSlot.retain(scope.startOffset)
            commonAncestorSlot.insert(block)
          }
        }
      }
        break
    }
  }
}
