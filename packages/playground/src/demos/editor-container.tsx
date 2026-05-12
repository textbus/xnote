import { createRef, onMounted } from '@viewfly/core'
import { SyncConnector, YWebsocketConnector } from '@textbus/collaborate'
import {
  Editor,
  InlineToolbarPlugin,
  LeftToolbarPlugin,
  StaticToolbarPlugin,
  SuspensionToolbarPlugin
} from '@textbus/xnote'
import { providers, user } from './demo-context'
import './editor-container.css'

export type ToolbarDemoRoute = 'inline-left' | 'suspension' | 'static'

function createPluginsByRoute(route: ToolbarDemoRoute, staticToolbarHost?: HTMLElement) {
  if (route === 'inline-left') {
    return [
      new InlineToolbarPlugin({
        theme: 'dark'
      }),
      new LeftToolbarPlugin({
        theme: 'dark'
      })
    ]
  }

  if (route === 'suspension') {
    return [new SuspensionToolbarPlugin({
      theme: 'dark'
    })]
  }

  return [
    new StaticToolbarPlugin({
      theme: 'dark',
      host: staticToolbarHost!
    })
  ]
}

export function EditorContainer(props: {
  route: ToolbarDemoRoute,
  title: string,
  enableCollaboration?: boolean,
  onEditorReady?: (editor: Editor | null) => void
}) {
  const editorRef = createRef<HTMLDivElement>()
  const staticToolbarRef = createRef<HTMLDivElement>()
  let editor: Editor | null = null

  onMounted(() => {
    editor = new Editor({
      locale: 'en-US',
      readonly: false,
      ...(props.enableCollaboration ? {
        collaborateConfig: {
          userinfo: user,
          createConnector(yDoc): SyncConnector {
            return new YWebsocketConnector('wss://textbus.io/api', 'xnote', yDoc)
          }
        }
      } : {}),
      providers,
      plugins: createPluginsByRoute(props.route, staticToolbarRef.value!)
    })
    props.onEditorReady?.(editor)

    editor.mount(editorRef.value!).then(() => {
      // mounted
    })

    return () => {
      props.onEditorReady?.(null)
      editor?.destroy()
      editor = null
    }
  })

  return () => {
    return (
      <div class="editor-card">
        <h3 class="editor-title">{props.title}</h3>
        {props.route === 'static'
          ? <div ref={staticToolbarRef} class="editor-static-toolbar"></div>
          : null}
        <div ref={editorRef} class="editor-host"></div>
        <div class="editor-scroll-spacer"></div>
      </div>
    )
  }
}
