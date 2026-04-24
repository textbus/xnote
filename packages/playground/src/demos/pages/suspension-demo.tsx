import { EditorDemoLayout } from '../editor-demo-layout'

export function SuspensionDemo() {
  return () => {
    return (
      <div>
        <EditorDemoLayout route="suspension" title="悬浮工具条"/>
      </div>
    )
  }
}
