import { CommentFormatValue } from '@textbus/xnote'

export abstract class CommentService {
  abstract createComment(text: string): Promise<CommentFormatValue>
}
