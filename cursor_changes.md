# cursor_changes.md

## 2024-06-09 Stripe打赏功能集成 - 第一阶段

1. 在 vibesgram/package.json 的 dependencies 中添加了以下依赖：
   - stripe
   - @stripe/stripe-js
2. 新建 vibesgram/.env.example 文件，添加了以下环境变量：
   - STRIPE_SECRET_KEY=your_stripe_secret_key
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

> 以上为Stripe打赏功能集成的第一阶段环境配置和依赖安装。 

## 2024-06-09 Stripe打赏功能集成 - 第二阶段

1. 在 vibesgram/prisma/schema.prisma 中新增 Donation 模型，包含字段：id, amount, stripePaymentIntentId, userId, artifactId, createdAt。
2. 在 User 模型中新增 donations 关系字段。
3. 在 Artifact 模型中新增 donations 关系、donationCount（打赏次数）、totalDonations（总打赏金额）字段。

> 以上为Stripe打赏功能集成的第二阶段数据库模型扩展。 

## 2024-06-09 Stripe打赏功能集成 - 第三阶段

1. 新建 vibesgram/src/server/api/routers/payment.ts，包含 createPaymentIntent 和 confirmDonation 两个接口。
2. 在 vibesgram/src/server/api/root.ts 中注册 paymentRouter。

> 以上为Stripe打赏功能集成的第三阶段后端API实现。 

## 2024-06-09 Stripe打赏功能集成 - 第四阶段

1. 新建 vibesgram/src/app/api/webhooks/stripe/route.ts，实现Stripe webhook端点，处理 payment_intent.succeeded 事件，校验签名并记录打赏。
2. 新建 vibesgram/src/app/api/webhooks/stripe/route.ts，实现 Stripe Webhook，监听 checkout.session.completed 事件，自动更新 Artifact 的 crowdfundingRaised 字段。

> 以上为Stripe打赏功能集成的第四阶段Webhook端点实现。 

## 2024-06-09 众筹目标功能集成

1. 在 vibesgram/src/server/api/routers/artifact/schema.ts 的 publishFromPreviewSchema 中新增 crowdfundingGoal 字段（可选，Int）。
2. 在 vibesgram/src/server/api/routers/artifact/publishArtifact.ts 中，将 crowdfundingGoal 写入数据库。
3. 在 vibesgram/src/components/upload/publish-form.tsx 的发布表单中新增众筹目标金额输入框，并传递到后端。

> 以上为众筹目标金额字段的后端与前端集成。已经全部撤回，无用

### 2024-00-06
- 使用 `prisma db push`，无损同步数据库结构。
- Artifact 表新增字段：
  - crowdfundingGoal（众筹目标金额，Int，可选）
  - crowdfundingRaised（已筹金额，Int，默认0）

4. 在 vibesgram/src/app/a/[id]/page.tsx 的项目详情页 CardContent 内，description 下方展示众筹进度条和金额。

5. 在 vibesgram/src/components/artifact/artifact-actions.tsx 的 like 按钮旁边添加两个 Stripe 打赏按钮，分别跳转到 1 美元和 10 美元的 Stripe 支付链接。

7. 新建 vibesgram/src/server/api/routers/payment.ts，提供 createStripeCheckoutSession 方法，动态创建带 artifactId 和金额的 Stripe Checkout Session。
8. 在 vibesgram/src/server/api/root.ts 注册 paymentRouter，暴露支付API。

9. 修改 vibesgram/src/components/artifact/artifact-actions.tsx，将打赏按钮改为点击后调用API动态生成Stripe支付链接，并跳转。
1.  用户要求将从提交 `0bd847c10e041a858bdd7f07881ad026ccec213f` 到最新提交的所有更改 rebase 成一个。

## 2025-06-16 Google Analytics 更新

1. 在 vibesgram/src/app/layout.tsx 中更新了 Google Analytics ID：
   - 旧 ID: G-84MKTCPGTV
   - 新 ID: G-RB1K1KDT96
   - Stream ID: 11363592229

> 更新了网站的 Google Analytics 配置，使用新的 Measurement ID 和 Stream ID。

## 2025-06-16 Discord 链接更新

1. 在 vibesgram/src/lib/const.ts 中更新了 Discord 邀请链接：
   - 旧链接: https://discord.gg/H64tusyH
   - 新链接: https://discord.gg/t4P8S6DH2p

> 更新了网站的 Discord 邀请链接到最新可用链接。 ([https://discord.gg/t4P8S6DH2p](https://discord.gg/t4P8S6DH2p))

## 2025-06-16 截图功能迁移至 Browserless.io

1.  **新增 API 路由**: 创建 `vibesgram/src/app/api/screenshot/route.ts` 文件。
    *   该文件封装了对 `https://chrome.browserless.io/screenshot` 的调用。
    *   使用 `BROWSERLESS_TOKEN` 进行认证（需在环境变量中配置）。
    *   请求 `browserless.io` 返回 base64 编码的图片，并将其封装为 `success: true, data: base64Image` 的 JSON 格式，以兼容现有系统。
2.  **更新 TRPC 路由**: 修改 `vibesgram/src/server/api/routers/utils/router.ts` 文件。
    *   将原先直接调用 `SCREENSHOT_SERVICE_URL` 的逻辑改为调用本地新增的 `/api/screenshot` 路由。
    *   移除了对 `env.SCREENSHOT_SERVICE_URL` 的直接引用和 `env` 的导入。
    *   简化了 `isAllowedDomain` 函数的逻辑，使其在通过本地 API 代理后仍能工作。

> 截图功能已成功迁移至 Browserless.io 服务，并通过 Next.js API 路由进行代理和兼容性处理。

## 2025-06-16 暂时隐藏截图按钮

1.  在 `vibesgram/src/components/upload/publish-form.tsx` 文件中，暂时注释掉了"Take Screenshot"按钮的 JSX 代码，使其在前端页面上不再显示。

> 暂时隐藏了截图按钮，以便在解决截图功能背后的域名安全问题时，用户可以继续使用"Upload Cover Image"功能。

# 2024-06-09 预览API（previewai）实现任务拆分

## 任务目标
实现`POST /api/preview/create`接口，实现HTML内容的预览创建，支持截图、R2存储、数据库记录、速率与大小限制等。

## 任务拆分
1. 新建`vibesgram/src/app/api/preview/create/route.ts`，实现API路由。
2. 设计并实现请求体校验（schema），支持html/options参数。
3. 集成HTML包装与处理逻辑。
4. 集成预览创建核心逻辑。
5. 集成R2存储与过期机制。
6. 集成速率限制与文件大小限制。
7. 返回标准响应格式。
8. 可选：集成截图服务，生成预览图。
9. 可选：数据库记录预览信息。

每完成一步，详细记录更改内容。

### 2024-06-09 步骤1：新建API路由文件
- 新建目录：`vibesgram/src/app/api/preview/create/`
- 新建文件：`route.ts`，用于实现POST /api/preview/create接口。

### 2024-06-09 步骤2：实现请求体校验
- 在`route.ts`中引入并使用现有schema校验工具，对html/options参数进行校验。
- 校验失败时返回400错误。

### 2024-06-09 步骤3：集成HTML包装与处理逻辑
- 计划在API中支持html字符串和options参数，自动包装为index.html文件。
- 复用`wrapHtmlContent`和`createPreviewFileFromHtml`工具，将html/options转为标准files结构。
- 若body含html字段，则自动转换为files结构，兼容前端直接传html的用法。

### 2024-06-09 步骤4：集成预览创建核心逻辑
- 在API中引入并调用`createPreview`核心业务逻辑。
- 传入标准化后的files参数，获取预览ID、URL等信息。
- 预留后续R2存储、过期机制、速率与大小限制等集成点。

### 2024-06-09 步骤5：集成R2存储与过期机制
- 预览文件上传到R2存储，路径为preview/{id}/content/。
- 数据库记录预览ID、文件大小、数量、过期时间。
- 过期时间默认3小时后。

### 2024-06-09 步骤6：预览有效期改为7天
- 新增常量`PREVIEW_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000`，写入vibesgram/src/lib/const.ts。
- API路由中过期时间由原3小时改为7天，统一用该常量控制。

## 修复vibesgram/src/app/api/preview/create/route.ts的类型安全问题

- 用zod schema类型替换了所有`any`类型，消除了TS类型警告：
  - `createPreviewFileFromHtml`返回类型由`any`改为`z.infer<typeof createPreviewSchema>["files"][number]`
  - `body.html`显式断言为`string`
  - `files`变量类型由`any`改为`z.infer<typeof createPreviewSchema>["files"]`
  - `reduce`、`some`、`map`等方法去除了`any`类型参数，全部类型安全
- 这样保证了API的类型安全，消除了eslint关于`any`和不安全赋值的报错。

## 进一步修复vibesgram/src/app/api/preview/create/route.ts的类型导入警告

- 将`NextRequest`改为`import type { NextRequest }`，只作为类型导入，消除@typescript-eslint/consistent-type-imports警告。

## 2024-06-09 批量修复ESLint类型与未使用变量警告

1. `src/app/api/preview/create/route.ts`
   - 用`unknown`类型接收`req.json()`，用zod schema校验并推断类型，彻底消除no-unsafe-assignment和no-unsafe-member-access。
   - `parsedBody`类型安全，所有成员访问都类型安全。

2. `src/components/agent/tools/base/tool-container.tsx`
   - 将`ReactNode`只用作类型导入，修复consistent-type-imports警告。

3. `src/components/artifact/artifact-actions.tsx`
   - 移除了未使用的`status`变量。
   - `catch`块移除未使用的`error`变量，修复no-unused-vars警告。

4. `src/components/sections/hero.tsx`
   - 移除了未使用的`toast`变量，修复no-unused-vars警告。

## 2024-06-09 API版本化与测试脚本同步

- 将`src/app/api/preview/create`目录迁移为`src/app/api/v1/preview/create`，API路径统一为`/api/v1/preview/create`。
- 同步修改`test/previewapi.py`中的url为新版API路径。