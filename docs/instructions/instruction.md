# vibesgram 项目指导书

根据 [3-实施规划.md](./3-实施规划.md) 的需求，我为你制定了详细的项目指导书。以下是实现这些阶段的计划。

实现的过程中请一步一步来，每一步都是我们可以手动验证的状态。

我们现在在 4.1 主页与探索页面基础实现阶段，目标：

- 实现简单主页设计
- 实现用户上传 artifact
- 实现标题图上传和托管
  - 【可选】实现根据预览自动截图
- 实现基础内容展示，/a/[id] artifact 展示页面

测试点：用户能够浏览和发现内容

# 附录：项目核心原则

## 1. 代码规范

- 项目是一个多包的 pnpm monorepo，注意根目录。
  - 服务端源代码在 vibesgram/
  - worker 源代码在 vibesgram-cf-worker/
- 使用 pnpm，import alias 用 @/
- 用英文注释，项目中不要出现中文。
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 组件使用 `.tsx` 扩展名
- 工具函数使用 `.ts` 扩展名
- 在 client component 使用 `use client`
- 在代码和 comment 中使用英文
- 环境变量在 `src/env.js` 中显式定义
- 多个地方使用且可能后续需要更改的常量，在 `src/lib/const.ts` 中定义
- 使用 jest 做测试
- 在允许的地方，尽量使用 ?? 代替 ||。
- 对外站的链接默认 nofollow
- 注意不要在 API 里面透露模型提供方的信息

## 2. 文件结构

```text
vibesgram/
  src/
  ├── app/                    # Next.js 路由
  ├── server/                 # 服务端代码
  │   ├── api/               # API 路由
  │   ├── db/                # Prisma 客户端
  │   └── trpc/              # tRPC 实现
  ├── lib/                    # 通用工具
  └── components/            # React 组件
```

## 3. 命名约定

- 工具函数: camelCase (如 `formatDate.ts`)
- 路由处理器: page.tsx, route.ts

## 4. 数据库规范

- 时间字段: createdAt, updatedAt
- 软删除: 使用 status 枚举
- 索引: 为常用查询字段创建索引

## 5. API 设计

- 使用 tRPC 进行类型安全的 API 调用
- 路由分组遵循业务领域
- 使用 Zod 进行输入验证
- 统一错误处理

## 6. 组件开发

- 优先使用 shadcn/ui 组件
- 自定义组件遵循原子设计
- 用 Tailwind CSS 进行样式设计
- 实现响应式设计

更多组件开发原则请参考 [5-React 组件开发原则.md](./5-React 组件开发原则.md)

## 7. SEO 最佳实践

- 使用语义化 HTML
- 实现动态元标签
- URL 结构清晰
- 实现静态生成

## 8. 安全性

- iframe 沙箱配置
- API 速率限制
- 输入数据验证
- XSS 防护

## 9. 性能优化

- 图片优化
- 组件懒加载
- 缓存策略
- 代码分割

## 10. 错误处理

后端使用 TRPC 错误处理机制，前端使用 toast 提示错误。

```typescript
// 统一错误处理示例
throw new TRPCError({
  code: "NOT_FOUND",
  message: "User not found",
});

// 前端错误处理示例

const { toast } = useToast();
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});
```

## 注意事项

1. 所有数据库操作都通过 tRPC 路由进行
2. 组件状态管理优先使用 React hooks
3. 避免在客户端存储敏感信息
4. 实现适当的错误边界
5. 保持代码简洁和可维护性
6. 优先使用 shadcn/ui 组件和其他封装好的第三方库
7. 考虑 SEO，优先使用 SSR

