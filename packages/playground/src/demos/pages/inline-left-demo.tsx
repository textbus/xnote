import { EditorDemoLayout } from '../editor-demo-layout'

export function InlineAndLeftDemo() {
  return () => {
    return (
      <div>
        <EditorDemoLayout route="inline-left" title="行内工具条 + 左侧工具条"/>
      </div>
    )
  }
}
