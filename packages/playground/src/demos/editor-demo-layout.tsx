import { Editor } from '@textbus/xnote'
import { EditorContainer, ToolbarDemoRoute } from './editor-container'
import { HtmlFormPanel } from './html-form-panel'

export function EditorDemoLayout(props: { route: ToolbarDemoRoute, title: string, enableCollaboration?: boolean }) {
  let editor: Editor | null = null

  return () => {
    return (
      <div class="editor-main">
        <div class="editor-center">
          <EditorContainer
            route={props.route}
            title={props.title}
            enableCollaboration={props.enableCollaboration}
            onEditorReady={instance => {
              editor = instance
            }}
          />
        </div>
        <div class="editor-right">
          <HtmlFormPanel getEditor={() => editor}/>
        </div>
      </div>
    )
  }
}
