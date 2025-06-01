# 4 Artifact创建流程

## 4.1 概述

Artifact 是 Vibesgram 平台核心内容单元，当前主要支持单文件 HTML 的创建和托管，后续将扩展为支持多文件项目。本文档详细描述 Artifact 的创建、预览和发布流程，以及相关数据模型设计。

## 4.2 数据模型

Artifact 在数据库中的模型已经通过 Prisma Schema 定义，核心字段包括：

| 字段名           | 类型         | 描述                                        |
| ---------------- | ------------ | ------------------------------------------- |
| id               | String       | 唯一标识符（CUID）                          |
| title            | String       | Artifact 标题                               |
| description      | String?      | 描述文本                                    |
| language         | String?      | 主要使用的编程语言                          |
| storagePath      | String       | R2 中的存储路径（正式发布版本）             |
| previewPath      | String?      | 预览版本的存储路径                          |
| entryPoint       | String       | 多文件情况下的入口文件，默认为 "index.html" |
| fileSize         | Int          | 文件总大小（字节）                          |
| fileCount        | Int          | 文件数量（当前为 1）                        |
| deployStatus     | DeployStatus | 部署状态（DRAFT/PREVIEW/PUBLISHED）         |
| previewExpiresAt | DateTime?    | 预览版本过期时间                            |
| publishedAt      | DateTime?    | 正式发布时间                                |
| conversationId   | String?      | 关联的对话 ID                               |

### 4.2.1 关联关系

- 每个 Artifact 属于一个用户（User）
- 每个 Artifact 可以关联到一个对话（Conversation）
- Artifact 可以被点赞、评论和收藏

### 4.2.2 部署状态

DeployStatus 枚举定义了三种状态：

1. **DRAFT**：草稿状态，内容仅在前端/浏览器中，尚未上传到 R2 存储
2. **PREVIEW**：预览状态，内容已上传到 R2 预览路径，可通过预览 URL 访问
3. **PUBLISHED**：已发布状态，内容已上传到 R2 正式路径，可通过正式 URL 访问

## 4.3 存储设计

### 4.3.1 R2 存储路径结构

```
vibesgram-artifacts/
├── public/
│   └── {artifactId}/
│       ├── content/       # 实际提供服务的内容
│       │   ├── index.html
│       │   ├── assets/
│       │   └── ...
│       └── metadata.json  # 额外元数据
└── preview/
    └── {artifactId}/
        ├── content/
        │   ├── index.html
        │   └── ...
        └── metadata.json
```

### 4.3.2 URL 设计

- 预览版本：`preview-{artifactId}.vibesgram.app`
- 发布版本：`{artifactId}.vibesgram.app`

### 4.3.3 存储生命周期

- 预览版本设置 3 小时过期时间，使用 R2 生命周期规则自动清理
- 发布版本永久保存，除非用户手动删除

## 4.4 Artifact 创建流程

### 4.4.1 草稿创建阶段

1. 用户在前端 Chat 界面与 AI 交互创建内容
2. 系统创建 Conversation 记录并保存对话历史
3. 用户决定将内容转换为 Artifact
4. 系统创建 Artifact 记录，状态为 DRAFT
5. 系统填充元数据（标题、描述、语言等）

### 4.4.2 上传与预览阶段

1. 用户编辑完内容后请求上传 Artifact
2. 前端将 HTML 内容通过 API 发送到服务端
3. 服务端验证内容并将其上传到 R2 存储
4. 上传完成后，系统更新 Artifact 记录：
   - 设置 deployStatus 为 PREVIEW
   - 更新 previewPath
   - 设置 previewExpiresAt（当前时间 + 3小时）
   - 更新 fileSize 和 fileCount
5. 系统返回预览 URL（`preview-{artifactId}.vibesgram.app`）

### 4.4.3 发布阶段

1. 用户确认发布 Artifact
2. 系统将内容从预览路径复制到正式路径（使用 R2 API）
3. 系统更新 Artifact 记录：
   - 设置 deployStatus 为 PUBLISHED
   - 更新 storagePath
   - 设置 publishedAt 为当前时间
4. 系统返回正式 URL（`{artifactId}.vibesgram.app`）

### 4.4.4 更新 Artifact

1. 用户可以随时更新 Artifact 的元数据（标题、描述、语言等）
2. 系统更新数据库中的相应字段
3. 如需更新内容，用户需重新上传并发布

### 4.4.5 编辑已发布 Artifact

1. 用户请求编辑 Artifact
2. 系统加载关联的 Conversation
3. 用户在 Chat 界面继续与 AI 交互编辑内容
4. 按照前述流程再次进行上传、预览和发布

## 4.5 API 设计

### 4.5.1 创建 Artifact

```
createArtifact
输入:
- conversationId: 关联的对话 ID
- title: Artifact 标题
- description: 描述
- language: 主要语言

输出:
- artifactId: 新创建的 Artifact ID
```

### 4.5.2 更新 Artifact 元数据

```
updateArtifact
输入:
- artifactId: Artifact ID
- title: Artifact 标题（可选）
- description: 描述（可选）
- language: 主要语言（可选）

输出:
- 更新后的 Artifact 对象
```

### 4.5.3 上传 Artifact 内容

```
uploadArtifactContent
输入:
- artifactId: Artifact ID
- content: 文件内容（HTML）

输出:
- previewUrl: 预览 URL
- previewExpiresAt: 预览过期时间
```

### 4.5.4 发布 Artifact

```
publishArtifact
输入:
- artifactId: Artifact ID

输出:
- publishUrl: 发布 URL
- publishedAt: 发布时间
```

### 4.5.5 获取 Artifact 列表

```
getUserArtifacts
输入:
- limit: 每页数量
- cursor: 分页游标

输出:
- artifacts: Artifact 对象数组
- nextCursor: 下一页游标
```

### 4.5.6 获取 Artifact 详情

```
getArtifactById
输入:
- artifactId: Artifact ID

输出:
- artifact: 完整的 Artifact 对象，包括 URL
```

## 4.6 安全考量

1. **内容验证**：上传前检查文件类型和内容，防止恶意代码
2. **资源限制**：
   - 预览版本 3 小时自动过期
   - 单个文件大小限制（目前 10MB）
   - 用户存储空间总量限制
3. **权限控制**：
   - 仅 Artifact 创建者可以编辑和发布
   - 仅已认证用户可以创建 Artifact
4. **内容扫描**：部署前扫描内容，检测潜在的恶意脚本和违规内容

## 4.7 Artifact 与 Conversation 关联设计

### 4.7.1 关联模型

- Artifact 和 Conversation 是一对一关系
- Conversation 模型存储完整的对话历史
- 编辑 Artifact 时回到原始对话继续交互

### 4.7.2 优势

1. **编辑连续性**：保持上下文，便于后续编辑
2. **历史记录**：保留创作过程
3. **用户体验**：简化工作流程，无需记住上下文

### 4.7.3 潜在问题及解决方案

| 问题         | 解决方案                                     |
| ------------ | -------------------------------------------- |
| 存储空间占用 | 对话历史压缩存储                             |
| 多版本管理   | 后续可扩展为一对多关联，每个对话代表一个版本 |
| 协作编辑     | 可扩展为支持多个用户参与同一对话             |

## 4.8 实施计划

1. 数据库模型调整（已完成）
2. R2 存储桶配置和生命周期规则设置
3. tRPC API 实现
4. 前端集成
5. 预览和发布功能测试
6. 安全和性能优化

