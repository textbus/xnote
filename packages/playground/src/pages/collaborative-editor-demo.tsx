import { createRef, onMounted } from '@viewfly/core'
import { SyncConnector, YWebsocketConnector } from '@textbus/collaborate'
import { Editor, InlineToolbarPlugin, LeftToolbarPlugin } from '@textbus/xnote'
import { providers, user } from '../editor-common/demo-context'
import { HtmlFormPanel } from '../editor-common/html-form-panel'

export function CollaborativeEditorDemo() {
  const editorRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      readonly: false,
      collaborateConfig: {
        userinfo: user,
        createConnector(yDoc): SyncConnector {
          return new YWebsocketConnector('wss://textbus.io/api', 'xnote', yDoc)
        }
      },
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
          <h3 class="editor-title">协作编辑器（行内 + 左侧工具条）</h3>
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
