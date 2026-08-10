import * as vscode from "vscode";
import type { CompletionInput, CompleteOpts } from "./types";
import { buildContext } from "./context";
import { getProvider as getProviderInstance } from "./providers";
import {
  isEnabled,
  getProvider,
  getDebounceDelay,
  getMaxTokens,
  getTemperature,
  getExtraStopSequences,
} from "./config";
import { log, logError } from "./logger";

export type ActivityState = "idle" | "loading" | "error";

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || (err as any).code === 20);
}

/**
 * 清洗模型返回的补全文本：
 * - 去除 markdown 围栏
 * - 去除首尾空行
 * - 去除模型回显的当前行前缀（如把整行重复输出）
 * - 去除与 suffix 开头重复的部分
 */
function cleanCompletion(raw: string, input: CompletionInput): string {
  if (!raw) {
    return "";
  }
  let text = raw;

  // 去除 markdown 代码围栏
  const fence = /^```[^\n]*\n([\s\S]*?)```$/;
  const m = text.match(fence);
  if (m) {
    text = m[1];
  }
  // 若以 ``` 开头但未闭合，去掉首行围栏
  text = text.replace(/^\s*```[^\n]*\n?/, "");

  // 去除首尾空白行（保留内部缩进）
  text = text.replace(/^\s*\n/, "").replace(/\n\s*$/, "");

  // 去除回显的当前行前缀：若补全以 currentLinePrefix 的某个尾部子串开头，则截掉
  const linePrefix = input.currentLinePrefix;
  if (linePrefix) {
    // 找出最长匹配的尾部子串
    const maxMatch = Math.min(linePrefix.length, text.length);
    for (let i = maxMatch; i > 0; i--) {
      if (linePrefix.endsWith(text.slice(0, i))) {
        text = text.slice(i);
        break;
      }
    }
  }

  // 去除与 suffix 当前行开头重复的部分（避免补全重复已有内容）
  const suffixCurrentLine = input.suffix.split("\n")[0] ?? "";
  if (suffixCurrentLine && text.endsWith(suffixCurrentLine) && suffixCurrentLine.trim().length > 0) {
    text = text.slice(0, text.length - suffixCurrentLine.length);
  }

  return text.trim() === "" ? "" : text;
}

export class SmartCompletionProvider implements vscode.InlineCompletionItemProvider {
  private currentAbort: AbortController | undefined;
  private onActivity?: (state: ActivityState, msg?: string) => void;

  constructor(onActivity?: (state: ActivityState, msg?: string) => void) {
    this.onActivity = onActivity;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    if (!isEnabled()) {
      return undefined;
    }

    // 取消上一次未完成请求
    this.currentAbort?.abort();
    const ac = new AbortController();
    this.currentAbort = ac;
    const sub = token.onCancellationRequested(() => ac.abort());

    const isManual = context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke;

    try {
      // 自动触发防抖
      if (!isManual) {
        const debounce = getDebounceDelay();
        if (debounce > 0) {
          try {
            await delay(debounce, ac.signal);
          } catch {
            return undefined;
          }
        }
      }
      if (ac.signal.aborted) {
        return undefined;
      }

      const input = buildContext(document, position);

      // 前置过滤：前缀为空或仅空白时不自动请求（手动触发仍允许）
      if (!isManual && input.prefix.trim() === "") {
        return undefined;
      }

      const opts: CompleteOpts = {
        maxTokens: getMaxTokens(),
        temperature: getTemperature(),
        stop: getExtraStopSequences(),
      };

      const provider = getProviderInstance(getProvider());
      this.onActivity?.("loading");
      log(`[${provider.displayName}] request (manual=${isManual}, lang=${input.languageId})`);

      const raw = await provider.complete(input, opts, ac.signal);
      if (ac.signal.aborted) {
        return undefined;
      }

      const cleaned = cleanCompletion(raw, input);
      if (!cleaned) {
        this.onActivity?.("idle");
        return undefined;
      }

      this.onActivity?.("idle");
      return [new vscode.InlineCompletionItem(cleaned)];
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return undefined;
      }
      const msg = err instanceof Error ? err.message : String(err);
      logError("completion failed", err);
      if (isManual) {
        this.onActivity?.("error", msg);
      } else {
        this.onActivity?.("idle");
      }
      return undefined;
    } finally {
      sub.dispose();
      if (this.currentAbort === ac) {
        this.currentAbort = undefined;
      }
    }
  }
}
