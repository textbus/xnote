import { Controller, debounceTime, filter, Query, QueryStateType, Selection, Subject } from '@textbus/core'
import { Injectable } from '@viewfly/core'

import { commentFormatter, CommentFormatValue } from '../textbus/formatters/comment'

export interface CommentService {
  /**
   * 获取批注激活时的样式
   */
  getActiveCSSText?(): string
}

@Injectable()
export abstract class CommentService {
  onActive = new Subject<CommentFormatValue | null>()

  constructor(controller: Controller,
              query: Query,
              selection: Selection) {
    selection.onChange.pipe(
      filter(() => {
        return !controller.readonly
      }),
      debounceTime(300)
    ).subscribe(() => {
      const result = query.queryFormat(commentFormatter)
      if (result.state === QueryStateType.Enabled) {
        this.onActive.next(result.value[0])
      } else {
        this.onActive.next(null)
      }
    })
  }

  /**
   * 创建批注的接口
   * @param text
   */
  abstract createComment(text: string): Promise<CommentFormatValue>
}
