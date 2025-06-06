# Agent & Artifact 交互设计

## 1. 整体布局

### 1.1 桌面端布局
```
┌────────────┬───────────────────┐
│            │                   │
│            │                   │
│  Chat Area │  Artifact Panel   │
│            │     (x)           │
│            │                   │
│            │                   │
├────────────┤                   │
│  Toolbar   │                   │
├────────────┤                   │
│ Input Box  │                   │
└────────────┴───────────────────┘
```

### 1.2 移动端布局
```
基础状态：
┌────────────────────┐
│                    │
│                    │
│      Chat Area     │
│                    │
│                    │
│                    │
├────────────────────┤
│       Toolbar      │
├────────────────────┤
│     Input Box      │
└────────────────────┘

弹窗状态：
┌────────────────────┐
│   ┌──────────────┐ │
│   │   Artifact   │ │
│   │    Panel     │ │
│   │     (×)      │ │
│   └──────────────┘ │
│                    │
│      Chat Area     │
├────────────────────┤
│       Toolbar      │
├────────────────────┤
│     Input Box      │
└────────────────────┘
```

## 2. 核心组件

### 2.1 工具栏 (Toolbar)
- 位置：
  * 桌面端：在聊天区域的输入框上方，不侵入 Artifact Panel 区域
  * 移动端：固定在输入框上方
- 作用：
  * 显示当前状态（思考中、生成中、等待输入等）
  * 控制 Artifact Panel 的显示/隐藏
- 特点：
  * 作为用户操作的固定锚点
  * 不随页面滚动
  * 状态清晰可见

### 2.2 Artifact Panel
- 桌面端：
  * 独立区域，右侧显示
  * 可以通过工具栏控制展开/收起
  * 收起时聊天区域（包括工具栏和输入框）自动扩展占满空间
  * 展开时保持独立区域不被聊天区域组件侵入
  * 有关闭按钮(×)

- 移动端：
  * 以弹窗形式显示
  * 可以从任意方向弹出
  * 有关闭按钮(×)
  * 点击弹窗外区域自动关闭
  * 不影响工具栏的位置和可见性

## 3. 交互流程

### 3.1 桌面端交互
1. 默认状态
   - 左侧为完整聊天界面（包含聊天区、工具栏、输入框）
   - 右侧为独立的 Artifact Panel
   - 两个区域互不侵入

2. Panel 收起状态
   - 聊天界面（包含工具栏和输入框）占满宽度
   - 点击工具栏可重新展开 Panel

### 3.2 移动端交互
1. 默认状态
   - 显示聊天界面
   - 工具栏固定在输入框上方
   - Artifact Panel 隐藏

2. Panel 弹窗状态
   - 点击工具栏触发 Panel 弹窗
   - 弹窗可以从任意方向出现
   - 背景轻微变暗
   - 点击弹窗外区域或关闭按钮可关闭
   - 工具栏保持可见

## 4. 响应式行为
- 使用相对单位和响应式断点
- 布局基于视口大小动态调整
- 保持工具栏位置的一致性
- Panel 的显示状态在布局切换时保持

## 5. 可访问性考虑（没有也行）
- Tab 键可以按照逻辑顺序遍历所有可交互元素
- 确保焦点顺序符合视觉顺序

## 6. 状态管理
- Panel 的开关状态
- 工具栏的当前状态
- 响应式布局状态

# 实现

@instruction.md 

OK，我们开始实现。

@page.tsx 不需要实际的组件，先打个样，搞点容器我来看位置关系。

尽量用 shadcn 组件。

...

能不能做两套 sidebar？让人看起来像一套就行。现在复杂度全堆一起
