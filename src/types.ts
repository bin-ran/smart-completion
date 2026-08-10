import * as vscode from "vscode";

export type ProviderId = "deepseek" | "moonshot" | "glm" | "qwen";

/** 光标上下文：prefix 是光标前文本，suffix 是光标后文本 */
export interface CompletionInput {
  prefix: string;
  suffix: string;
  languageId: string;
  /** 当前光标所在行的前缀部分（行首到光标），用于行内补全清洗 */
  currentLinePrefix: string;
}

export interface CompleteOpts {
  maxTokens: number;
  temperature: number;
  stop: string[];
}

/** Provider 统一接口 */
export interface Provider {
  readonly id: ProviderId;
  readonly displayName: string;
  /** 返回应插入到光标处的补全文本（已由调用方做最终清洗） */
  complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string>;
}

/** chat 消息 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
