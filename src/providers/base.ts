import type { CompletionInput, CompleteOpts, Provider } from "../types";
import { chatCompletions } from "../api/openaiClient";

/**
 * 通用 chat 模拟 FIM：把 prefix/suffix 拼进 messages，要求模型只输出光标处的补全。
 * 供 Moonshot / GLM 等不暴露原生 FIM 端点的 provider 复用。
 */
export async function chatFim(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  input: CompletionInput;
  opts: CompleteOpts;
  signal: AbortSignal;
}): Promise<string> {
  const { baseUrl, apiKey, model, input, opts, signal } = params;

  const system =
    "You are a code completion engine. Complete the code at the cursor position marked by <CURSOR>. " +
    "Output ONLY the code that should be inserted at <CURSOR>. " +
    "Do NOT output any explanation, markdown fences, or echo surrounding code. " +
    "If unsure, output nothing.";

  const user =
    `Language: ${input.languageId}\n` +
    `\n----- CODE BEFORE CURSOR -----\n${input.prefix}<CURSOR>\n----- CODE AFTER CURSOR -----\n${input.suffix}\n` +
    `\nFill in the code at <CURSOR>. Output only the inserted code.`;

  return chatCompletions({
    baseUrl,
    apiKey,
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts,
    signal,
  });
}

/** provider 必须返回的 apiKey 校验失败时抛出的错误 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export abstract class BaseProvider implements Provider {
  abstract readonly id: Provider["id"];
  abstract readonly displayName: string;
  abstract complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string>;
}
