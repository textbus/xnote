import { Observable } from '@textbus/core'

import { LLMService, LLMParams, LLMTranslateParams } from './src/services/llm.service'

export class AiService extends LLMService {
  private baseUrl = '/api/llm'

  /**
   * 创建 SSE 流式请求（使用 POST 方法支持长内容）
   */
  private createSSEStream(endpoint: string, params: LLMParams | LLMTranslateParams): Observable<string> {
    return new Observable<string>(observer => {
      const url = `${this.baseUrl}${endpoint}`
      let isComplete = false

      // 使用 fetch API 支持 POST 请求和 SSE 流
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'x-api-key': 'xnote'
        },
        body: JSON.stringify(params)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('Response body is not readable')
          }

          const decoder = new TextDecoder()
          let buffer = ''

          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done || isComplete) {
                observer.complete()
                return
              }

              // 解码并处理 SSE 数据
              buffer += decoder.decode(value, { stream: true })

              // 解析 SSE 格式的数据
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // 保留最后一个不完整的行

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  // 检查是否是结束标记
                  if (data === '[DONE]') {
                    isComplete = true
                    observer.complete()
                    return
                  }
                  observer.next(data)
                } else if (line.startsWith('event: error')) {
                  // 处理错误事件
                  const errorLine = lines[lines.indexOf(line) + 1]
                  if (errorLine && errorLine.startsWith('data: ')) {
                    observer.error(new Error(errorLine.slice(6)))
                  }
                  isComplete = true
                  observer.complete()
                  return
                }
              }

              // 继续读取流
              readStream()
            }).catch(error => {
              observer.error(error)
            })
          }

          readStream()
        })
        .catch(error => {
          observer.error(error)
        })

      // 返回清理函数
      return () => {
        isComplete = true
      }
    })
  }

  /** 续写 */
  continue(params: LLMParams): Observable<string> {
    return this.createSSEStream('/continue', params)
  }

  /** 润色内容 */
  polish(params: LLMParams): Observable<string> {
    return this.createSSEStream('/polish', params)
  }

  /** 简化内容 */
  simplify(params: LLMParams): Observable<string> {
    return this.createSSEStream('/simplify', params)
  }

  /** 丰富内容 */
  enrich(params: LLMParams): Observable<string> {
    return this.createSSEStream('/enrich', params)
  }

  /** 翻译内容 */
  translate(params: LLMTranslateParams): Observable<string> {
    return this.createSSEStream('/translate', params)
  }

  /** 总结内容 */
  summarize(params: LLMParams): Observable<string> {
    return this.createSSEStream('/summarize', params)
  }
}
