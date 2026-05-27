import { createRef, onMounted } from '@viewfly/core'
import { Editor } from '@textbus/xnote'
import { providers } from '../editor-common/demo-context'

export function MobileDemo() {
  const editorRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      locale: 'en-US',
      readonly: false,
      providers,
      plugins: [
      ]
    })
    editor.mount(editorRef.value!)
    return () => {
      editor?.destroy()
      editor = null
    }
  })

  return () => (
    <div class="editor-card">
      <div ref={editorRef} class="editor-host"></div>
    </div>
  )
}
