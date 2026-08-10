import type { CompletionInput, CompleteOpts } from "../types";
import { BaseProvider, ConfigError } from "./base";
import { fimCompletions } from "../api/openaiClient";
import { getProviderConfig } from "../config";

/**
 * DeepSeek：原生 FIM。
 * 端点 POST {base}/beta/completions，模型 deepseek-coder，body {prompt, suffix, max_tokens}。
 */
export class DeepSeekProvider extends BaseProvider {
  readonly id = "deepseek" as const;
  readonly displayName = "DeepSeek";

  async complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string> {
    const cfg = getProviderConfig("deepseek");
    if (!cfg.apiKey) {
      throw new ConfigError("未配置 DeepSeek API Key（设置 smartCompletion.deepseek.apiKey）");
    }
    const model = cfg.fimModel || "deepseek-coder";
    return fimCompletions({
      baseUrl: cfg.baseUrl || "https://api.deepseek.com",
      apiKey: cfg.apiKey,
      endpoint: "/beta/completions",
      model,
      prompt: input.prefix,
      suffix: input.suffix,
      opts,
      signal,
    });
  }
}
