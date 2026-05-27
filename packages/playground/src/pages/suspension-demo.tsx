import { createRef, onMounted } from '@viewfly/core'
import { Editor, SuspensionToolbarPlugin } from '@textbus/xnote'
import { providers } from '../editor-common/demo-context'
import { HtmlFormPanel } from '../editor-common/html-form-panel'

export function SuspensionDemo() {
  const editorRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      locale: 'en-US',
      readonly: false,
      providers,
      plugins: [
        new SuspensionToolbarPlugin({ theme: 'dark' })
      ]
    })
    editor.mount(editorRef.value!)
    return () => {
      editor?.destroy()
      editor = null
    }
  })

  return () => (
    <div class="editor-main">
      <div class="editor-center">
        <div class="editor-card">
          <h3 class="editor-title">悬浮工具条</h3>
          <div ref={editorRef} class="editor-host"></div>
          <div class="editor-scroll-spacer"></div>
        </div>
      </div>
      <div class="editor-right">
        <HtmlFormPanel getEditor={() => editor}/>
      </div>
    </div>
  )
}
