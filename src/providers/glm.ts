import type { CompletionInput, CompleteOpts } from "../types";
import { BaseProvider, ConfigError, chatFim } from "./base";
import { getProviderConfig } from "../config";

/**
 * GLM / 智谱：无原生 FIM 端点，走 chat 模拟 FIM（codegeex-4）。
 */
export class GlmProvider extends BaseProvider {
  readonly id = "glm" as const;
  readonly displayName = "GLM (智谱)";

  async complete(input: CompletionInput, opts: CompleteOpts, signal: AbortSignal): Promise<string> {
    const cfg = getProviderConfig("glm");
    if (!cfg.apiKey) {
      throw new ConfigError("未配置 GLM / 智谱 API Key（设置 smartCompletion.glm.apiKey）");
    }
    return chatFim({
      baseUrl: cfg.baseUrl || "https://open.bigmodel.cn/api/paas/v4",
      apiKey: cfg.apiKey,
      model: cfg.model || "codegeex-4",
      input,
      opts,
      signal,
    });
  }
}
