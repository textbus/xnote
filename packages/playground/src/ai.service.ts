import { Observable } from '@textbus/core'
import { LLMService, LLMParams, LLMTranslateParams } from '@textbus/xnote'

/** 本地模拟分块流式输出，行为类似 SSE data 行 */
function mockStreamingResponse(text: string, chunkSize = 4, intervalMs = 25): Observable<string> {
  return new Observable<string>(observer => {
    let i = 0
    const id = setInterval(() => {
      if (i >= text.length) {
        clearInterval(id)
        observer.complete()
        return
      }
      const end = Math.min(i + chunkSize, text.length)
      observer.next(text.slice(i, end))
      i = end
    }, intervalMs)
    return () => {
      clearInterval(id)
    }
  })
}

export class AiService extends LLMService {
  continue(params: LLMParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    return mockStreamingResponse(
      `${t}……（本地模拟续写）在原有思路上可以进一步展开：补充例证、调整节奏，并检查与上下文的衔接是否自然。`
    )
  }

  polish(params: LLMParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    return mockStreamingResponse(
      `【润色·本地模拟】${t.length > 80 ? t.slice(0, 80) + '…' : t} —— 已按更书面、更通顺的方式整理句式与标点。`
    )
  }

  simplify(params: LLMParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    return mockStreamingResponse(
      `【简化·本地模拟】${t.length > 120 ? t.slice(0, 60) + '（…截断后摘要）' + t.slice(-40) : t}`
    )
  }

  enrich(params: LLMParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    return mockStreamingResponse(
      `【丰富·本地模拟】${t}。此外可补充：背景、对比与小结，使论述更完整。（以上为占位说明，非真实大模型。）`
    )
  }

  translate(params: LLMTranslateParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    const lang = params.targetLanguage || 'en'
    return mockStreamingResponse(
      `[${lang}] [mock] ${t} — The quick brown fox jumps over the lazy dog. (local placeholder translation)`
    )
  }

  summarize(params: LLMParams): Observable<string> {
    const t = params.text?.trim() || '（无内容）'
    return mockStreamingResponse(
      `【摘要·本地模拟】${t.length > 200 ? t.slice(0, 200) + '…' : t}（要点已压缩为占位摘要。）`
    )
  }
}
