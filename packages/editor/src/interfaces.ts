import { ComponentStateLiteral, TextbusConfig } from '@textbus/core'
import { ViewOptions } from '@textbus/platform-browser'
import { InjectionToken } from '@viewfly/core'
import { CollaborateConfig } from '@textbus/collaborate'

import { RootComponentState } from './textbus/components/root/root.component'
import { XnoteMessageKey } from './i18n/messages'

export abstract class FileUploader {
  abstract uploadFile(type: string): string | Promise<string>
}

export interface XNoteCollaborateConfig extends CollaborateConfig {
  userinfo: {
    username: string
    color: string
    id: string
  }
}

/**
 * XNote 配置项
 */
export interface EditorConfig extends TextbusConfig {
  /** 默认 HTML 内容*/
  content?: string | ComponentStateLiteral<RootComponentState>,
  /** 协作服务配置 */
  collaborateConfig?: XNoteCollaborateConfig,
  /** 视图配置项 */
  viewOptions?: Partial<ViewOptions>,
  /** 界面语言，默认 zh-CN；支持 en、en-US 等映射到 en-US */
  locale?: string,
  /** 覆写内置文案，key 见 XnoteMessageKey */
  messages?: Record<XnoteMessageKey, string>
}

export const EDITOR_CONFIG = new InjectionToken<EditorConfig>('EDITOR_CONFIG')
