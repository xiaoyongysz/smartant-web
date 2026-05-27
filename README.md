# SmartAnt Web

基于 **Next.js + React + TypeScript + Tailwind CSS + shadcn/ui** 的知识库前端，参考 ChatGPT 交互，提供：

1. **文档上传**：`POST /api/documents/upload`（PDF / Word / Markdown / TXT）
2. **知识库问答**：`POST /api/documents/session`（多轮对话，带 `sessionId`）

---

## 如何启动

### 前置条件

| 项 | 要求 |
|----|------|
| Node.js | **18+**（终端执行 `node -v` 检查） |
| Java 后端 | 已启动，默认地址 `http://localhost:8080` |
| 端口 | 前端占用 **7070**（与后端 8080 不冲突） |

### 第一次运行

```bash
# 进入项目目录
cd smartant-web

# 安装依赖（只需首次或 package.json 变更后）
npm install

# 配置后端地址（可选；不配置则默认代理到 localhost:8080）
cp .env.local.example .env.local
# 按需编辑 .env.local 中的 BACKEND_URL

# 启动开发模式
npm run dev
```

启动成功后终端会提示本地地址，浏览器访问：

**http://localhost:7070**

### 日常开发

```bash
cd smartant-web
npm run dev
```

改代码后页面会自动热更新，无需重启（改 `next.config.ts` 或 `.env.local` 时需重启 `npm run dev`）。

### 生产构建与运行

```bash
npm run build    # 编译
npm start        # 生产模式，同样在 7070 端口
```

### 常见问题

| 现象 | 处理 |
|------|------|
| `npm: command not found` | 安装 [Node.js](https://nodejs.org/) 并确保终端能执行 `npm` |
| 端口 7070 被占用 | 结束占用进程，或临时执行 `npx next dev -p 7071` |
| 上传/问答报错 | 确认 Java 后端已启动，且 `.env.local` 中 `BACKEND_URL` 正确 |
| 依赖安装慢 | 可使用国内 npm 镜像：`npm config set registry https://registry.npmmirror.com` |

---

## 技术栈说明

| 类别 | 技术 | 在本项目中的作用 |
|------|------|------------------|
| 框架 | [Next.js 16](https://nextjs.org/) | React 全栈框架：路由、构建、开发服务器、API 代理 |
| UI 库 | [React 19](https://react.dev/) | 组件化界面与交互状态 |
| 语言 | [TypeScript](https://www.typescriptlang.org/) | 类型安全，与后端 DTO 对齐 |
| 样式 | [Tailwind CSS 4](https://tailwindcss.com/) | 原子化 CSS，快速实现 ChatGPT 风格布局 |
| 组件 | [shadcn/ui](https://ui.shadcn.com/) 风格 | 基于 Radix UI 的可复用 Button、Dropdown、ScrollArea 等 |
| 图标 | [Lucide React](https://lucide.dev/) | 侧栏、上传、发送等图标 |
| 提示 | [Sonner](https://sonner.emilkowal.ski/) | 上传成功/失败等 Toast 通知 |
| 工具 | ESLint、PostCSS | 代码规范与 CSS 处理（随 Next 模板自带） |

**数据流简述**：浏览器 → Next.js（同源 `/api/documents/*`）→ 按 `BACKEND_URL` 代理到 Java 后端；会话列表存在浏览器 `localStorage`，`sessionId` 随每次问答请求发给后端。

---

## 根目录为什么「平铺」那么多文件？

这是 **现代前端项目的行业惯例**，不是代码写得乱。

Next.js、TypeScript、npm、ESLint 等工具 **默认只在项目根目录** 查找自己的配置文件。若强行把 `package.json`、`next.config.ts`、`tsconfig.json` 挪进子文件夹，这些工具往往 **无法识别**，需要额外 hack，得不偿失。

因此常见做法是：

- **根目录**：放「工具配置」和「项目元数据」（你截图里看到的那一批）
- **`src/` 目录**：放 **真正业务代码**（页面、组件、接口封装）

日常开发 **主要改 `src/`**；根目录文件在初始化后很少动。

### 根目录文件分类一览

```
smartant-web/
│
├── 【业务代码】只在这里写功能
│   └── src/                    → 见下文「src 目录结构」
│
├── 【框架 / 构建配置】Next、TS、样式流水线
│   ├── next.config.ts          → Next 配置（含后端 API 代理）
│   ├── next-env.d.ts           → Next 自动生成的 TS 类型（勿手改）
│   ├── tsconfig.json           → TypeScript 编译选项
│   ├── postcss.config.mjs      → PostCSS（配合 Tailwind）
│   └── eslint.config.mjs       → ESLint 规则
│
├── 【依赖与脚本】npm
│   ├── package.json            → 依赖、npm scripts（dev 端口 7070）
│   └── package-lock.json       → 锁定依赖版本（自动生成）
│
├── 【环境与文档】
│   ├── .env.local.example      → 环境变量模板（复制为 .env.local）
│   ├── .gitignore              → Git 忽略规则
│   ├── README.md               → 项目说明（本文件）
│   ├── AGENTS.md               → 给 AI 编程助手的 Next.js 规则
│   └── CLAUDE.md               → Claude 入口，指向 AGENTS.md
│
└── 【运行时生成，勿提交、勿手改】
    ├── node_modules/           → npm 安装的依赖
    └── .next/                  → 构建 / 开发缓存
```

**结论**：根目录「平铺」的是各工具的 **标准入口**；业务已按职责收拢在 `src/` 下，无需再把配置文件强行分类到子目录。

---

## src 目录结构（业务代码）

```
src/
├── app/                          # Next.js App Router（页面入口）
│   ├── layout.tsx                # 全局布局、字体、Toast
│   ├── page.tsx                  # 首页 → 挂载聊天主界面
│   └── globals.css               # 全局样式与主题变量
│
├── components/
│   ├── chat/                     # 知识库聊天相关 UI
│   │   ├── chat-page.tsx         # 页面容器：会话状态、上传、发消息
│   │   ├── chat-sidebar.tsx      # 左侧：新对话、历史列表
│   │   ├── chat-messages.tsx     # 中间：消息列表与空状态
│   │   ├── chat-input.tsx        # 底部：输入框、+ 上传菜单
│   │   └── source-segments.tsx   # 助手回复下的「引用来源」
│   └── ui/                       # 通用基础组件（shadcn 风格）
│       ├── button.tsx
│       ├── dropdown-menu.tsx
│       └── scroll-area.tsx
│
├── lib/
│   ├── api-config.ts             # 下游地址与接口路径（改 8080 只改这里 + .env）
│   ├── api.ts                    # 调用 upload、session
│   ├── session-storage.ts        # localStorage 会话读写
│   └── utils.ts                  # cn()、generateId() 等工具
│
└── types/
    └── api.ts                    # ApiResponse、AnswerResponse 等类型
```

| 模块 | 职责 |
|------|------|
| `app/` | 路由与页面壳，几乎不写业务逻辑 |
| `components/chat/` | ChatGPT 式交互：侧栏、消息、上传、溯源 |
| `components/ui/` | 可复用 UI  primitives，与业务解耦 |
| `lib/api.ts` | 统一封装 HTTP，便于改 baseURL 或加鉴权 |
| `lib/session-storage.ts` | 前端会话持久化（标题、消息历史） |
| `types/api.ts` | 与 Java 后端字段保持一致 |

---

## AI 辅助开发文档（AGENTS.md / CLAUDE.md）

这两个文件 **不参与运行**，是给 Cursor、Claude Code 等 AI 助手读的项目约定，人类开发者一般不用改。

| 文件 | 作用 |
|------|------|
| **AGENTS.md** | 约定：本项目使用 **Next.js 16**，与旧版 API/目录可能有差异；改代码前应查阅 `node_modules/next/dist/docs/` 并注意废弃说明。避免 AI 按「记忆中的旧版 Next」写出不兼容代码。 |
| **CLAUDE.md** | Claude 专用入口，内容仅为 `@AGENTS.md`，即让 Claude 同样遵守 AGENTS.md 中的规则。 |

在 Cursor 中打开本仓库时，Agent 会自动参考这些文件；你本地启动、构建 **不依赖** 它们。

---

## 下游 API 配置（统一 8080）

所有接口在 **`src/lib/api-config.ts`** 集中定义，禁止在组件里写死 URL。

| 配置项 | 说明 |
|--------|------|
| `BACKEND_URL` | 下游 Java 地址，默认 `http://localhost:8080`（`next.config` 代理用） |
| `NEXT_PUBLIC_BACKEND_URL` | 浏览器直连下游，**应与 BACKEND_URL 一致** |

`.env.local` 示例：

```env
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

| 接口 | 完整地址（默认） |
|------|------------------|
| 上传 | `http://localhost:8080/api/documents/upload` |
| 会话 | `http://localhost:8080/api/documents/session` |

改端口或域名时，只改上述两个环境变量即可，上传与会话自动一致。

**说明**：页面在 **7070** 打开；接口请求按配置打到 **8080**。若未设置 `NEXT_PUBLIC_BACKEND_URL`，会退化为相对路径 `/api/documents/*`，由 Next 根据 `BACKEND_URL` 代理到 8080（需后端对 7070 开启 CORS 时用直连方式更简单）。

**不要**使用 `/smartant/ragApi/...` 等与 `api-config.ts` 不一致的路径。

## 使用说明

1. 点击输入框左侧 **+** → **添加照片和文件**，选择文档上传至向量库。
2. 在输入框输入问题并发送，系统会携带当前会话的 `sessionId` 调用问答接口。
3. 左侧栏可新建、切换、删除对话；引用片段会展示在助手回复下方。

更多启动细节见上文 **[如何启动](#如何启动)**。
