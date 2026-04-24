import { EditorDemoLayout } from '../editor-demo-layout'

export function CollaborativeEditorDemo() {
  return () => {
    return (
      <div>
        <EditorDemoLayout route="inline-left" title="协作编辑器（行内 + 左侧工具条）" enableCollaboration/>
      </div>
    )
  }
}
