import { Observable } from '@textbus/core'

export interface LLMParams {
  text: string
}

export interface LLMTranslateParams extends LLMParams{
  targetLanguage: string
}

/**
 * 大模型接口
 */
export abstract class LLMService {
  /** 续写 */
  abstract continue(params: LLMParams): Observable<string>

  /** 润色内容 */
  abstract polish(params: LLMParams): Observable<string>

  /** 简化内容 */
  abstract simplify(params: LLMParams): Observable<string>

  /** 丰富内容 */
  abstract enrich(params: LLMParams): Observable<string>

  /** 翻译内容 */
  abstract translate(params: LLMTranslateParams): Observable<string>

  /** 总结内容 */
  abstract summarize(params: LLMParams): Observable<string>
}
