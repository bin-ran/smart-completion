import type { ChatMessage, CompleteOpts } from "../types";
import { logError } from "../logger";

/** 统一的 OpenAI 兼容 HTTP 客户端：支持 chat completions 与 FIM completions 两种端点 */

export interface ChatRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  opts: CompleteOpts;
  signal: AbortSignal;
}

export interface FimRequest {
  baseUrl: string;
  apiKey: string;
  /** 相对 baseUrl 的端点路径，如 "/chat/completions" 或 "/beta/completions" */
  endpoint: string;
  model: string;
  prompt: string;
  suffix: string;
  opts: CompleteOpts;
  signal: AbortSignal;
}

/** 抛出的错误，message 可直接给用户看 */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function joinUrl(base: string, endpoint: string): string {
  const b = base.replace(/\/+$/, "");
  const e = endpoint.replace(/^\/+/, "");
  return `${b}/${e}`;
}

async function postJson(url: string, body: unknown, apiKey: string, signal: AbortSignal): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
    throw new ApiError(`网络请求失败: ${err?.message ?? String(err)}`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const txt = await res.text();
      detail = txt.slice(0, 500);
    } catch {
      /* ignore */
    }
    throw new ApiError(`HTTP ${res.status} ${res.statusText}${detail ? " — " + detail : ""}`, res.status);
  }

  try {
    return await res.json();
  } catch (err: any) {
    throw new ApiError(`响应解析失败: ${err?.message ?? String(err)}`);
  }
}

/** chat completions，返回 assistant 文本 */
export async function chatCompletions(req: ChatRequest): Promise<string> {
  const body = {
    model: req.model,
    messages: req.messages,
    max_tokens: req.opts.maxTokens,
    temperature: req.opts.temperature,
    stop: req.opts.stop.length ? req.opts.stop : undefined,
    stream: false,
  };
  const url = joinUrl(req.baseUrl, "/chat/completions");
  const json = await postJson(url, body, req.apiKey, req.signal);
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    logError("chatCompletions: 响应缺少 choices[0].message.content", json);
    throw new ApiError("响应格式异常：缺少 message.content");
  }
  return text;
}

/** FIM completions（OpenAI completions 格式：prompt + suffix），返回补全文本 */
export async function fimCompletions(req: FimRequest): Promise<string> {
  const body = {
    model: req.model,
    prompt: req.prompt,
    suffix: req.suffix,
    max_tokens: req.opts.maxTokens,
    temperature: req.opts.temperature,
    stop: req.opts.stop.length ? req.opts.stop : undefined,
    stream: false,
  };
  const url = joinUrl(req.baseUrl, req.endpoint);
  const json = await postJson(url, body, req.apiKey, req.signal);
  const text = json?.choices?.[0]?.text;
  if (typeof text !== "string") {
    logError("fimCompletions: 响应缺少 choices[0].text", json);
    throw new ApiError("响应格式异常：缺少 choices[0].text");
  }
  return text;
}
