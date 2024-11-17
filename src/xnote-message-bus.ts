import { Observable, Selection, Subject } from '@textbus/core'
import { CollaborateCursor, UserSelectionCursor } from '@textbus/platform-browser'
import { Message, MessageBus } from '@textbus/collaborate'

import { TableComponent } from './textbus/components/table/table.component'

export interface UserInfo {
  username: string
  color: string
  id: string
}

export interface XNoteMessage extends UserSelectionCursor {
  id: string
}

export class XNoteMessageBus extends MessageBus<XNoteMessage> {
  onMessageChange: Observable<Message<XNoteMessage>[]>
  protected messageChangeEvent = new Subject<Message<XNoteMessage>[]>()

  constructor(private selection: Selection,
              private collaborateCursor: CollaborateCursor,
              private userinfo: UserInfo) {
    super()
    this.onMessageChange = this.messageChangeEvent.asObservable()
  }

  get(): XNoteMessage {
    const selection = this.selection
    const c = selection.commonAncestorComponent
    const msg: XNoteMessage = {
      ...this.userinfo,
      selection: selection.getPaths(),
    }
    if (!selection.isCollapsed && c instanceof TableComponent) {
      const selection = c.tableSelection()!
      if (selection) {
        msg.data = {
          x1: selection.startColumn,
          x2: selection.endColumn,
          y1: selection.startRow,
          y2: selection.endRow,
        }
      }
    }
    return msg
  }

  consume(message: Message<XNoteMessage>[]) {
    message = message.filter(i => i.message)
    this.messageChangeEvent.next([...message])
    this.collaborateCursor.draw(message.filter(item => {
      return item.message.id !== this.userinfo.id
    }).map(item => {
      return item.message
    }))
  }
}
