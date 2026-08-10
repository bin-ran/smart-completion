import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel("Smart Completion");
  }
  return channel;
}

export function log(msg: string, ...args: unknown[]): void {
  const ts = new Date().toISOString();
  const rest = args.length ? " " + args.map((a) => safeStr(a)).join(" ") : "";
  getOutputChannel().appendLine(`[${ts}] ${msg}${rest}`);
}

export function logError(msg: string, err?: unknown): void {
  log(`[ERROR] ${msg}${err ? " — " + safeStr(err) : ""}`);
}

function safeStr(v: unknown): string {
  if (v instanceof Error) {
    return v.message;
  }
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
