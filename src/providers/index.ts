import type { Provider, ProviderId } from "../types";
import { DeepSeekProvider } from "./deepseek";
import { MoonshotProvider } from "./moonshot";
import { GlmProvider } from "./glm";
import { QwenProvider } from "./qwen";

const registry: Record<ProviderId, Provider> = {
  deepseek: new DeepSeekProvider(),
  moonshot: new MoonshotProvider(),
  glm: new GlmProvider(),
  qwen: new QwenProvider(),
};

export function getProvider(id: ProviderId): Provider {
  return registry[id] ?? registry.deepseek;
}

export function getAllProviders(): Provider[] {
  return [registry.deepseek, registry.moonshot, registry.glm, registry.qwen];
}
