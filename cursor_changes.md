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

## 2024-07-30 执行 Git Rebase 操作

1.  用户要求将从提交 `0bd847c10e041a858bdd7f07881ad026ccec213f` 到最新提交的所有更改 rebase 成一个。

> 此操作将通过 `git rebase -i` 完成，用户将在交互式会话中选择如何处理这些提交。