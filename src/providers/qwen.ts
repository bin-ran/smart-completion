import type { CompletionInput, CompleteOpts } from "../types";
import { BaseProvider, ConfigError } from "./base";
import { fimCompletions } from "../api/openaiClient";
import { getProviderConfig } from "../config";

/**
 * 通义千问 / Qwen：原生 FIM，走 DashScope 的 OpenAI 兼容 completions 端点。
 * 端点 POST {base}/completions，模型 qwen-coder-plus，body {prompt, suffix, max_tokens}。
 */
export class QwenProvider extends BaseProvider {
  readonly id = "qwen" as const;
  readonly displayName = "通义千问 (Qwen)";

  async complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string> {
    const cfg = getProviderConfig("qwen");
    if (!cfg.apiKey) {
      throw new ConfigError("未配置通义千问 API Key（设置 smartCompletion.qwen.apiKey）");
    }
    const model = cfg.fimModel || cfg.model || "qwen-coder-plus";
    return fimCompletions({
      baseUrl: cfg.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: cfg.apiKey,
      endpoint: "/completions",
      model,
      prompt: input.prefix,
      suffix: input.suffix,
      opts,
      signal,
    });
  }
}
