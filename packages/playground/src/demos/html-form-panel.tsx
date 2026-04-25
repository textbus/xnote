import { createRef } from '@viewfly/core'
import { Editor } from '@textbus/xnote'

export function HtmlFormPanel(props: { getEditor: () => Editor | null }) {
  const htmlRef = createRef<HTMLTextAreaElement>()
  const contentRef = createRef<HTMLDivElement>()

  return () => {
    return (
      <div class="html-panel-card">
        <h4 class="html-panel-title">HTML 面板</h4>
        <div class="editor-actions">
          <button type="button" class="editor-btn editor-btn-secondary" onClick={() => {
            const editor = props.getEditor()
            if (!editor) {
              return
            }
            const html = editor.getHTML()
            htmlRef.value!.value = html
            contentRef.value!.innerHTML = html
          }}>获取 HTML
          </button>
          <button type="button" class="editor-btn editor-btn-primary" onClick={() => {
            const editor = props.getEditor()
            if (!editor) {
              return
            }
            editor.setContent(htmlRef.value!.value)
          }}>设置 HTML
          </button>
        </div>
        <textarea
          name=""
          id=""
          ref={htmlRef}
          cols="30"
          rows="10"
          class="editor-html-input"
        ></textarea>
        <div class="editor-preview">
          <div class="editor-preview-title">HTML 预览</div>
          <div ref={contentRef}></div>
        </div>
      </div>
    )
  }
}
