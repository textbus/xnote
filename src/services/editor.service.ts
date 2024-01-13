import { Injectable } from '@viewfly/core'

@Injectable({
  provideIn: 'root'
})
export class EditorService {
  hideInlineToolbar = false
}
