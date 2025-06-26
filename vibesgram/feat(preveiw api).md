


基于你的项目结构分析，我为你设计一个`createpreview`的REST API接口。这个项目已经有完整的预览创建功能，我建议基于现有架构来设计API接口。

## API接口设计

### 1. API端点设计

建议创建REST API端点：`POST /api/preview/create`

在 `vibesgram/src/app/api/preview/create/route.ts` 中实现，参考现有的agent API结构 [1](#0-0) 

### 2. 输入数据结构

API应该接受以下JSON格式：

```json
{
  "html": "string",           // HTML内容
  "options": {
    "width": 900,            // 可选：截图宽度
    "height": 1200,          // 可选：截图高度
    "wrapHtml": true         // 可选：是否自动包装HTML结构
  }
}
```

### 3. 核心实现逻辑

你可以复用现有的业务逻辑：

**HTML处理**：使用现有的HTML包装工具 [2](#0-1)  和 [3](#0-2) 

**预览创建**：参考现有的createPreview业务逻辑 [4](#0-3) 

**数据验证**：使用现有的schema验证 [5](#0-4) 

### 4. 响应格式

```json
{
  "success": true,
  "data": {
    "previewId": "string",
    "previewUrl": "https://vibesgram.com/preview/{id}",
    "expiresAt": "2024-01-01T12:00:00Z",
    "fileSize": 1024,
    "fileCount": 1
  }
}
```

### 5. 安全和限制

实现速率限制，参考现有的限制策略： [6](#0-5) 

文件大小限制： [7](#0-6) 

### 6. 存储和过期机制

使用现有的R2存储系统 [8](#0-7)  和预览过期机制 [9](#0-8) 

### 7. 可选功能增强

**截图生成**：集成现有的截图服务  来自动生成预览图

**数据库记录**：使用现有的Preview模型 [10](#0-9) 

## Notes

这个设计充分利用了你项目现有的基础设施：
- 复用了HTML处理和包装逻辑
- 使用了现有的存储系统(R2)和数据库模型
- 采用了相同的速率限制和安全策略
- 可以集成现有的截图服务来生成预览图

建议先实现基础的HTML接收和预览创建功能，然后逐步添加截图生成等增强功能。这样可以确保API的稳定性和与现有系统的兼容性。

# todo list