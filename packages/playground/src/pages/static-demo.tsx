import { createRef, onMounted } from '@viewfly/core'
import { Editor, StaticToolbarPlugin } from '@textbus/xnote'
import { providers } from '../editor-common/demo-context'
import { HtmlFormPanel } from '../editor-common/html-form-panel'

export function StaticDemo() {
  const editorRef = createRef<HTMLDivElement>()
  const toolbarRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      locale: 'en-US',
      readonly: false,
      providers,
      plugins: [
        new StaticToolbarPlugin({ host: toolbarRef.value! })
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
          <h3 class="editor-title">静态工具条</h3>
          <div ref={toolbarRef} class="editor-static-toolbar"></div>
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
