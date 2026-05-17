import { Component, createVNode, StackableFormatter, VElement, VTextNode } from '@textbus/core'

import './comment.scss'

export interface CommentFormatValue {
  id: string
  userId: string
}

export const commentFormatter = new StackableFormatter<CommentFormatValue>('comment', {
  inheritable: false,
  priority: -10,
  render(children: Array<VElement | VTextNode | Component>, formatValue: CommentFormatValue,): VElement {
    return createVNode('span', {
      class: 'xnote-comment',
      'data-comment-id': formatValue.id,
      'data-user-id': formatValue.userId,
    }, children)
  }
})
