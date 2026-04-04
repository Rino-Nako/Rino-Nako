# Rino Nako

基于 **Next.js 14** 的 Web 前端：与多厂商大模型对话，并可通过 **WebUSB + ADB** 连接 Android 设备，配合 **scrcpy** 投屏与自动化操作（Agent 循环）。

## 技术栈

- **框架**：Next.js 14（App Router）、React 18、TypeScript  
- **样式**：Tailwind CSS  
- **设备与投屏**：[@yume-chan/adb](https://github.com/yume-chan/ya-webadb)、[@yume-chan/scrcpy](https://github.com/yume-chan/ya-webadb) 等（见 `package.json`）  
- **对话代理**：`/api/chat` 将请求转发至智谱、OpenAI 兼容接口、Claude 或 Gemini（见下文）

## 功能概览

- **多会话聊天**：侧边栏会话管理（`useChatSessions`）  
- **Agent 模式**：根据模型输出解析动作，控制设备、截图与任务步骤展示  
- **Deep Collab / 独立模式**：可选的多阶段协作与独立执行配置（设置中开启）  
- **设备面板**：USB 连接设备、投屏、触控与 SoM（可交互元素）相关能力  
- **统一聊天代理**：浏览器请求发往本站 `/api/chat`，由服务端转发到实际模型 API，便于兼容流式与非流式响应

## 环境要求

- **Node.js**：建议 **18.x 或 20.x**（与 Next.js 14 常见实践一致）  
- **包管理**：使用项目内 `package-lock.json` 时推荐 `npm ci` / `npm install`  
- **浏览器（连接手机）**：需支持 **WebUSB** 的 Chromium 系浏览器（如 Chrome、Edge）；页面需在 **HTTPS** 或 **localhost** 下打开，否则 WebUSB 不可用

## 快速开始

```bash
cd web-client
npm install
npm run dev
```

默认开发地址：<http://localhost:3000>

其他脚本：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务（需先 `build`） |
| `npm run lint` | ESLint（Next 配置） |

## API 与密钥配置

应用通过 **`Authorization: Bearer <密钥>`** 调用 `/api/chat`。密钥与 **服务商**、**Base URL**、**模型名** 等通常在界面「设置」中填写，也可由上层产品约定写入 Cookie/状态（以实际 `app/page.tsx` 与相关 hook 为准）。

`/api/chat` 根据请求头 **`X-Api-Provider`** 选择上游（默认 **`zhipu`**）：

| `X-Api-Provider` | 行为摘要 |
|------------------|----------|
| `zhipu` | 默认转发至智谱 `.../v4/chat/completions`；若提供 `X-Base-Url` 则使用该基址 + `/chat/completions` |
| `openai` | 无 `X-Base-Url` 时使用 OpenAI 官方；有则使用自定义 OpenAI 兼容地址 |
| `claude` | 转发至 Anthropic Messages API |
| `gemini` | 转发至 Google Generative Language API；可选 `X-Base-Url` 覆盖默认 `v1beta` 根路径 |

**说明**：密钥仍会经浏览器发往你的 Next 服务端，再由服务端转发上游；请勿在公共环境泄露密钥。生产部署请配合 HTTPS 与访问控制。

## 功能开关（构建前配置）

`lib/config.ts` 中的布尔常量用于在构建时隐藏部分 UI 能力（按需改为 `true` 后重新构建）：

- `HIDEEX_FUNCTION`：插件相关设置  
- `HIDE_BETAFUN`：实验性功能  
- `HIDE_CLOUDSYNC`：云同步相关  

## 目录结构（简要）

```
web-client/
├── app/                 # App Router：页面与 API 路由
│   ├── api/chat/        # 聊天代理 route
│   ├── layout.tsx
│   └── page.tsx         # 主界面与状态聚合
├── components/          # UI 组件（聊天、设备、侧栏、设置等）
├── hooks/               # useAgentLoop、useScrcpy、会话等逻辑
├── lib/                 # 提示词、ADB/解析、配置等
├── types/               # TypeScript 类型
└── config/              # 应用文案与列表等静态配置
```

## 常见问题

- **无法连接手机**：确认使用 Chrome/Edge、站点为 localhost 或 HTTPS，并在手机上开启 USB 调试、授权 USB 调试弹窗。  
- **模型报错 401/403**：检查设置中的 API Key、服务商与 Base URL 是否与所用模型一致。  
- **流式响应**：代理路径对 `stream: true` 的请求会透传 SSE（见 `app/api/chat/route.ts`）。
