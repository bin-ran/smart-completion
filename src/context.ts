import * as vscode from "vscode";
import type { CompletionInput } from "./types";
import { getMaxPrefixLines, getMaxSuffixLines } from "./config";

/**
 * 从 document + position 构建 FIM 上下文：prefix（光标前）、suffix（光标后）。
 * 按 maxPrefixLines / maxSuffixLines 截断，避免上下文过长。
 */
export function buildContext(document: vscode.TextDocument, position: vscode.Position): CompletionInput {
  const maxPrefix = getMaxPrefixLines();
  const maxSuffix = getMaxSuffixLines();

  const lineCount = document.lineCount;
  const currentLine = position.line;

  const prefixStartLine = Math.max(0, currentLine - maxPrefix + 1);
  const suffixEndLine = Math.min(lineCount - 1, currentLine + maxSuffix);

  const prefixRange = new vscode.Range(prefixStartLine, 0, currentLine, position.character);
  const suffixRange = new vscode.Range(currentLine, position.character, suffixEndLine, document.lineAt(suffixEndLine).text.length);

  const prefix = document.getText(prefixRange);
  const suffix = document.getText(suffixRange);
  const currentLinePrefix = document.lineAt(currentLine).text.substring(0, position.character);

  return {
    prefix,
    suffix,
    languageId: document.languageId,
    currentLinePrefix,
  };
}
