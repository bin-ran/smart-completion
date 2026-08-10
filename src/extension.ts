import * as vscode from "vscode";
import { SmartCompletionProvider, ActivityState } from "./completionProvider";
import {
  getConfig,
  getProvider,
  setProvider,
  isEnabled,
  PROVIDER_DISPLAY,
} from "./config";
import { getAllProviders } from "./providers";
import { getOutputChannel, log } from "./logger";
import type { ProviderId } from "./types";

let statusItem: vscode.StatusBarItem;
let activity: ActivityState = "idle";
let activityMsg: string | undefined;
let errorTimeout: NodeJS.Timeout | undefined;

function refreshStatus(): void {
  const id = getProvider();
  const name = PROVIDER_DISPLAY[id];
  if (!isEnabled()) {
    statusItem.text = `$(circle-slash) ${name} (off)`;
    statusItem.tooltip = "Smart Completion 已禁用";
  } else if (activity === "loading") {
    statusItem.text = `$(loading~spin) ${name}`;
    statusItem.tooltip = `${name} 正在生成补全…`;
  } else if (activity === "error") {
    statusItem.text = `$(error) ${name}`;
    statusItem.tooltip = `补全失败: ${activityMsg ?? "未知错误"}`;
  } else {
    statusItem.text = `$(sparkle) ${name}`;
    statusItem.tooltip = `Smart Completion: ${name}（点击切换 provider）`;
  }
  statusItem.show();
}

function setActivity(state: ActivityState, msg?: string): void {
  activity = state;
  activityMsg = msg;
  if (state === "error") {
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    errorTimeout = setTimeout(() => {
      activity = "idle";
      refreshStatus();
    }, 5000);
  }
  refreshStatus();
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log("activating Smart Completion");

  // 状态栏
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.command = "smartCompletion.switchProvider";
  context.subscriptions.push(statusItem);
  refreshStatus();

  // 注册 inline completion provider
  const provider = new SmartCompletionProvider(setActivity);
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider),
  );

  // 命令：切换启用
  context.subscriptions.push(
    vscode.commands.registerCommand("smartCompletion.toggle", async () => {
      const cfg = getConfig();
      const next = !isEnabled();
      await cfg.update("enabled", next, vscode.ConfigurationTarget.Global);
      log(`enabled -> ${next}`);
    }),
  );

  // 命令：手动触发
  context.subscriptions.push(
    vscode.commands.registerCommand("smartCompletion.trigger", async () => {
      await vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");
    }),
  );

  // 命令：切换 provider
  context.subscriptions.push(
    vscode.commands.registerCommand("smartCompletion.switchProvider", async () => {
      const items = getAllProviders().map((p) => ({
        label: p.displayName,
        description: p.id === getProvider() ? "当前" : undefined,
        id: p.id,
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "选择补全 provider",
      });
      if (picked) {
        await setProvider(picked.id as ProviderId);
      }
    }),
  );

  // 配置变更监听
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("smartCompletion")) {
        refreshStatus();
      }
    }),
  );

  log("Smart Completion activated");
}

export function deactivate(): void {
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
}
