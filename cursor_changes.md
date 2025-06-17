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