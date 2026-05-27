import { createRef, onMounted } from '@viewfly/core'
import { Editor, InlineToolbarPlugin, LeftToolbarPlugin } from '@textbus/xnote'
import { providers } from '../editor-common/demo-context'
import { HtmlFormPanel } from '../editor-common/html-form-panel'

export function InlineAndLeftDemo() {
  const editorRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      locale: 'en-US',
      readonly: false,
      providers,
      plugins: [
        new InlineToolbarPlugin({ theme: 'dark' }),
        new LeftToolbarPlugin({ theme: 'dark' })
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
          <h3 class="editor-title">行内工具条 + 左侧工具条</h3>
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
