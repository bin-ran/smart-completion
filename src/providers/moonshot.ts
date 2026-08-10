import type { CompletionInput, CompleteOpts } from "../types";
import { BaseProvider, ConfigError, chatFim } from "./base";
import { getProviderConfig } from "../config";

/**
 * Moonshot / Kimi：无原生 FIM 端点，走 chat 模拟 FIM。
 */
export class MoonshotProvider extends BaseProvider {
  readonly id = "moonshot" as const;
  readonly displayName = "Kimi (Moonshot)";

  async complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string> {
    const cfg = getProviderConfig("moonshot");
    if (!cfg.apiKey) {
      throw new ConfigError("未配置 Moonshot / Kimi API Key（设置 smartCompletion.moonshot.apiKey）");
    }
    return chatFim({
      baseUrl: cfg.baseUrl || "https://api.moonshot.cn/v1",
      apiKey: cfg.apiKey,
      model: cfg.model || "moonshot-v1-8k",
      input,
      opts,
      signal,
    });
  }
}
