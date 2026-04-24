import { EditorDemoLayout } from '../editor-demo-layout'

export function StaticDemo() {
  return () => {
    return (
      <div>
        <EditorDemoLayout route="static" title="静态工具条"/>
      </div>
    )
  }
}
