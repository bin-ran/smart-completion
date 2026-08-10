import * as vscode from "vscode";
import type { ProviderId } from "./types";

export const CONFIG_SECTION = "smartCompletion";

export interface ProviderConfig {
  apiKey: string;
  model: string;
  fimModel?: string;
  baseUrl: string;
}

export function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIG_SECTION);
}

export function getProvider(): ProviderId {
  return getConfig().get<ProviderId>("provider", "deepseek");
}

export function setProvider(id: ProviderId): Thenable<void> {
  return getConfig().update("provider", id, vscode.ConfigurationTarget.Global);
}

export function isEnabled(): boolean {
  return getConfig().get<boolean>("enabled", true);
}

export function getDebounceDelay(): number {
  return Math.max(0, getConfig().get<number>("debounceDelay", 300));
}

export function getMaxTokens(): number {
  return getConfig().get<number>("maxTokens", 256);
}

export function getTemperature(): number {
  return getConfig().get<number>("temperature", 0.2);
}

export function getMaxPrefixLines(): number {
  return getConfig().get<number>("maxPrefixLines", 80);
}

export function getMaxSuffixLines(): number {
  return getConfig().get<number>("maxSuffixLines", 40);
}

export function getExtraStopSequences(): string[] {
  return getConfig().get<string[]>("extraStopSequences", []);
}

/** 读取指定 provider 的子配置 */
export function getProviderConfig(id: ProviderId): ProviderConfig {
  const cfg = getConfig();
  const base = cfg.get<{ apiKey: string; model: string; baseUrl: string }>(
    id as any,
  ) as any;
  return {
    apiKey: base?.apiKey ?? "",
    model: base?.model ?? "",
    fimModel: base?.fimModel,
    baseUrl: base?.baseUrl ?? "",
  };
}

export const PROVIDER_DISPLAY: Record<ProviderId, string> = {
  deepseek: "DeepSeek",
  moonshot: "Kimi (Moonshot)",
  glm: "GLM (智谱)",
  qwen: "通义千问 (Qwen)",
};
