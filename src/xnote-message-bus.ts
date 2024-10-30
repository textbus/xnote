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

export class XNoteMessageBug extends MessageBus<XNoteMessage> {
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
    return {
      ...this.userinfo,
      selection: selection.getPaths(),
      data: (!selection.isCollapsed && c instanceof TableComponent) ? c.getSelectedRect() : null
    }
  }

  consume(message: Message<XNoteMessage>[]) {
    this.messageChangeEvent.next([...message])
    this.collaborateCursor.draw(message.filter(item => {
      return item.message.id !== this.userinfo.id
    }).map(item => {
      return item.message
    }))
  }
}
