# Smart Completion

AI 代码自动补全 VSCode 插件，支持 **DeepSeek、Kimi (Moonshot)、GLM (智谱)、通义千问 (Qwen)** 等国产大模型，可随时切换 provider。

GitHub Copilot 式的灰色 ghost text 补全，利用光标前后文（FIM，Fill-in-the-Middle）生成更贴合上下文的代码。

## 特性

- 自动补全（输入停顿后防抖触发）+ 手动触发快捷键 `Alt+\`
- 支持 FIM（Fill-in-the-Middle）：用光标前后的代码填充中间，补全质量更高
- 四家 provider 一键切换，状态栏显示当前 provider
- 每家 provider 的 base URL / 模型名均可配置覆盖，方便接入自建或代理端点
- 自动取消未完成的旧请求，连续输入不串扰
- 非流式一次返回，稳定可靠

## 安装与调试

```bash
npm install
npm run compile
```

在 VSCode 中用 `F5` 启动 Extension Development Host 调试。

如需监听改动自动重建：

```bash
npm run watch
```

## 配置

在 VSCode 设置中搜索 `smart completion`。

| 配置项 | 说明 | 默认值 |
|---|---|---|
| `smartCompletion.provider` | 补全 provider | `deepseek` |
| `smartCompletion.enabled` | 是否启用 | `true` |
| `smartCompletion.debounceDelay` | 自动触发防抖延迟 (ms) | `300` |
| `smartCompletion.maxTokens` | 单次最大生成 token | `256` |
| `smartCompletion.temperature` | 采样温度 | `0.2` |
| `smartCompletion.maxPrefixLines` | 光标前最大行数 | `80` |
| `smartCompletion.maxSuffixLines` | 光标后最大行数 | `40` |
| `smartCompletion.extraStopSequences` | 额外停止序列 | `[]` |

每家 provider 各有子配置：

- `smartCompletion.deepseek.{apiKey, model, fimModel, baseUrl}`
- `smartCompletion.moonshot.{apiKey, model, baseUrl}`
- `smartCompletion.glm.{apiKey, model, baseUrl}`
- `smartCompletion.qwen.{apiKey, model, fimModel, baseUrl}`

至少填入所选 provider 的 `apiKey` 即可使用。

## 各 provider 端点说明

| Provider | 方式 | 端点 | 默认模型 |
|---|---|---|---|
| DeepSeek | 原生 FIM | `POST {base}/beta/completions` | `deepseek-coder` |
| 通义千问 Qwen | 原生 FIM | `POST {base}/completions` | `qwen-coder-plus` |
| GLM 智谱 | chat 模拟 FIM | `POST {base}/chat/completions` | `codegeex-4` |
| Kimi Moonshot | chat 模拟 FIM | `POST {base}/chat/completions` | `moonshot-v1-8k` |

## 命令

- `Smart Completion: Toggle Enable/Disable` — 开关补全
- `Smart Completion: Trigger Completion` — 手动触发（绑定 `Alt+\`）
- `Smart Completion: Switch Provider` — 切换 provider（也可点击状态栏）

## 日志

输出面板选择 `Smart Completion` 频道查看请求与错误日志。

## 架构

```
src/
├── extension.ts          # 激活、注册 provider、命令、状态栏
├── config.ts             # 配置读取
├── context.ts            # 构建 prefix/suffix
├── completionProvider.ts # InlineCompletionItemProvider：防抖、取消、清洗
├── types.ts              # 类型与 Provider 接口
├── logger.ts             # OutputChannel 日志
├── api/openaiClient.ts   # 统一 HTTP 客户端（chat + FIM）
└── providers/            # deepseek / moonshot / glm / qwen + base
```

核心抽象：`Provider` 接口统一 `complete(input, opts, signal)`；`openaiClient` 同时支持 chat completions 与 FIM completions 两种端点；不支持原生 FIM 的 provider 复用 `base.chatFim` 做 chat 模拟。

## License

MIT
