import { Injectable } from '@viewfly/core'

import {
  normalizeXnoteLocale,
  xnoteMessageBundles,
  type XnoteMessageKey
} from '../i18n/messages'

export interface I18nServiceOptions {
  locale?: string
  messages?: Record<string, string>
}

@Injectable()
export class I18nService {
  private readonly dict: Record<string, string>

  constructor(options?: I18nServiceOptions) {
    const tag = normalizeXnoteLocale(options?.locale ?? 'zh-CN')
    const base = xnoteMessageBundles[tag]
    this.dict = { ...base, ...options?.messages }
  }

  t(key: XnoteMessageKey | (string & {})): string {
    const v = this.dict[key]
    if (v != null) {
      return v
    }
    const fallback = xnoteMessageBundles['zh-CN'][key as XnoteMessageKey]
    return fallback ?? key
  }
}
