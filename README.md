# 力扣征途

一个基于原生 HTML、CSS、JavaScript 构建的 LeetCode 刷题进度管理工具。

项目目标不是“再做一个题单页面”，而是把刷题过程拆成**轮次训练、日常打卡、历史回顾、复习推进、趋势分析、数据备份**几个稳定环节，让个人刷题记录变成一个可持续维护的训练系统。

## 项目定位

`力扣征途` 是一个**纯前端、无后端、无构建依赖**的静态项目，适合以下场景：

- 想按阶段推进 LeetCode 训练，而不是无序刷题
- 希望把不同题库（基础题库、Hot100、面试经典 150）统一管理
- 希望保留每日打卡、复习、图表、分享、备份这些能力
- 不想引入数据库、服务端或复杂工程化环境

项目入口页面为 [`index.html`](index.html)，应用启动逻辑由 [`script.js`](script.js) 负责，数据加载与轮次组织由 [`js/data.js`](js/data.js) 负责。

---

## 核心能力

### 1. 七轮题库组织

题目会在加载后被组织到七个训练轮次中：

- `round1`：简单题，通过率 ≥ 50%
- `round2`：中等题，通过率 ≥ 50%
- `round3`：算法理论强化（树、图与回溯算法、贪心、动态规划）
- `round4`：困难题与低通过率题
- `round5`：SQL 数据库专项
- `round6`：Hot100
- `round7`：面试经典 150

对应组织逻辑见 [`organizeProblemsByRounds()`](js/data.js)。

### 2. 本地多用户进度隔离

用户通过输入用户名登录，进度保存在浏览器本地，不依赖服务端。

- 当前用户状态由 [`js/auth.js`](js/auth.js) 维护
- 用户进度数据保存在 `localStorage`
- 不同用户名对应不同进度和浏览状态

### 3. 打卡、统计与当前进度追踪

主界面支持：

- 按轮次切换训练范围
- 按分类浏览题目
- 点击题目进行打卡 / 取消打卡
- 自动更新当前轮次完成数、总题数、完成率
- 显示全局连续打卡、今日答题、当前进度、总进度

相关逻辑主要位于 [`js/ui.js`](js/ui.js)。

### 4. 复习工作台

复习功能已经从单一弹窗升级为“准备层 + 执行层”两部分：

- 主执行界面：[`#reviewWorkspace`](index.html)
- 高级筛选面板：[`#reviewModal`](index.html)

当前复习工作台支持：

- 按复习阶段切换范围
- 按题库 / 分类切换来源
- 按数量抽取待复习题目
- 标记本轮已复习
- 展示本次摘要与今日完成列表
- 记忆工作台来源、数量、筛选状态

复习相关核心逻辑位于 [`js/ui.js`](js/ui.js) 与 [`generateAllReviewProblemsGrouped()`](js/data.js)。

### 5. 搜索与定位

支持按题号或标题进行搜索，并直接跳转到对应题目。

- 搜索入口：[`js/search.js`](js/search.js)
- 若题目存在于多个分类，会弹出分类选择面板

### 6. 日历与历史记录

项目提供完整的打卡历史回顾能力：

- 日历月视图
- 每日打卡详情
- 月度题目汇总
- 复习记录与首次完成记录统一展示

相关模块：

- [`js/calendar.js`](js/calendar.js)
- [`js/calendar-detail.js`](js/calendar-detail.js)

### 7. 图表与分享卡片

项目内置可视化与分享能力，包括：

- 轮次进度环图
- 趋势折线图
- 分类雷达图
- 年度热力图
- 今日 / 本月 / 全局分享卡片

相关模块：

- [`js/chart.js`](js/chart.js)
- [`js/chart-progress.js`](js/chart-progress.js)
- [`js/chart-trend.js`](js/chart-trend.js)
- [`js/chart-radar-heatmap.js`](js/chart-radar-heatmap.js)
- [`js/share-card.js`](js/share-card.js)
- [`js/share-overall.js`](js/share-overall.js)

### 8. 导入 / 导出备份

项目支持将进度导出为 JSON 文件，也支持通过 JSON 文件恢复数据。

- 导出：[`exportProgress()`](js/data.js)
- 导入：[`handleImport()`](js/data.js)

这是当前项目中最重要的数据保护能力之一。

---

## 快速开始

### 运行要求

本项目不依赖 Node、数据库或后端服务，只需要一个能访问静态文件的浏览器环境。

### 启动方式

#### 方式一：直接打开

1. 下载或克隆项目到本地
2. 用浏览器打开 [`index.html`](index.html)
3. 输入用户名后开始使用

#### 方式二：使用静态文件服务（推荐）

由于浏览器对本地 `fetch` 存在限制，推荐使用任意静态文件服务启动项目，例如：

- VS Code Live Server
- 任意本地 HTTP 静态服务

题库数据加载依赖 [`loadProblemsData()`](js/data.js)，它会读取：

- [`problems-data.json`](problems-data.json)
- [`hot100-data.json`](hot100-data.json)
- [`interview150-data.json`](interview150-data.json)

---

## 使用流程

### 基础刷题流程

1. 打开 [`index.html`](index.html)
2. 输入用户名登录
3. 选择当前轮次
4. 选择分类
5. 点击题目进行打卡
6. 使用顶部搜索快速定位题目
7. 查看日历、图表和历史记录
8. 定期导出进度文件备份

### 复习流程

1. 从悬浮复习入口或复习面板进入工作台
2. 选择当前复习阶段
3. 选择题库或分类范围
4. 设定抽取数量
5. 打开题目链接完成复习
6. 回到工作台标记“本轮已完成”
7. 查看今日完成与阶段摘要

---

## 页面结构概览

主页面结构集中在 [`index.html`](index.html)，主要包含以下区域：

- 登录页
- 顶部导航与搜索框
- 全局统计面板
- 当前轮次统计面板
- 轮次切换按钮
- 分类面板与题目列表
- 复习悬浮入口与复习工作台
- 日历、图表、技巧、数据管理等弹窗

如果要理解项目 UI 的整体结构，从 [`index.html`](index.html) 和 [`js/ui.js`](js/ui.js) 开始看是最直接的路径。

---

## 核心数据流

### 启动流程

应用启动流程如下：

1. [`script.js`](script.js) 监听 `DOMContentLoaded`
2. 调用 [`loadProblemsData()`](js/data.js)
3. 合并三份题库数据
4. 调用 [`organizeProblemsByRounds()`](js/data.js) 生成轮次结构
5. 调用 [`checkLogin()`](js/auth.js)
6. 根据用户状态进入登录页或主页面

### 进度流转

题目打卡与复习数据主要遵循以下路径：

- 打卡：[`toggleProblem()`](js/ui.js)
- 查询进度：[`getProblemProgress()`](js/data.js)
- 持久化：[`saveUserProgress()`](js/data.js)
- 复习标记：[`markProblemReviewed()`](js/data.js)
- 工作台状态保存：[`saveReviewWorkspaceState()`](js/ui.js)

### 搜索与跳转

- 搜索输入触发 [`searchProblems()`](js/search.js)
- 若题目存在于多个分类，走 [`openCategoryChoiceModal()`](js/modals.js)
- 最终导航到指定轮次和分类

---

## 目录结构

```text
liko/
├── index.html
├── script.js
├── README.md
├── LICENSE
├── problems-data.json
├── hot100-data.json
├── interview150-data.json
├── leetcode_progress_admin_2026-04-06.json
├── css/
│   ├── base.css
│   ├── login.css
│   ├── main.css
│   ├── modals.css
│   ├── calendar.css
│   ├── search.css
│   └── responsive.css
└── js/
    ├── auth.js
    ├── data.js
    ├── ui.js
    ├── search.js
    ├── modals.js
    ├── calendar.js
    ├── calendar-detail.js
    ├── chart.js
    ├── chart-progress.js
    ├── chart-trend.js
    ├── chart-radar-heatmap.js
    ├── share-card.js
    ├── share-overall.js
    └── utils.js
```

---

## 文件职责说明

### 入口与页面骨架

- [`index.html`](index.html)：页面结构、主要弹窗骨架、脚本与样式入口
- [`script.js`](script.js)：应用入口、全局变量初始化

### 数据与状态

- [`js/data.js`](js/data.js)：题库加载、轮次组织、进度存储、导入导出、复习分组数据
- [`problems-data.json`](problems-data.json)：基础题库
- [`hot100-data.json`](hot100-data.json)：Hot100 题库
- [`interview150-data.json`](interview150-data.json)：面试经典 150 题库

### 用户与主界面交互

- [`js/auth.js`](js/auth.js)：登录、登出、页面切换
- [`js/ui.js`](js/ui.js)：主界面交互、统计更新、分类渲染、复习工作台
- [`js/search.js`](js/search.js)：搜索与导航
- [`js/modals.js`](js/modals.js)：各类弹窗开关、分类选择弹窗
- [`js/utils.js`](js/utils.js)：通用工具方法

### 日历、图表与分享

- [`js/calendar.js`](js/calendar.js)：日历月视图与事件聚合
- [`js/calendar-detail.js`](js/calendar-detail.js)：日期详情、月度详情
- [`js/chart.js`](js/chart.js)：图表主控
- [`js/chart-progress.js`](js/chart-progress.js)：轮次进度图
- [`js/chart-trend.js`](js/chart-trend.js)：趋势图
- [`js/chart-radar-heatmap.js`](js/chart-radar-heatmap.js)：雷达图与热力图
- [`js/share-card.js`](js/share-card.js)：当日 / 本月分享卡片
- [`js/share-overall.js`](js/share-overall.js)：全局分享卡片

---

## 数据存储说明

项目使用浏览器 `localStorage` 保存数据。

### 主要键名

- `leetcodeUser`：当前登录用户名
- `progress_{用户名}`：用户刷题进度
- `viewState_{用户名}`：最近浏览的轮次与分类
- `reviewWorkspaceState_{用户名}`：复习工作台状态
- `noticeHidden`：顶部数据提醒横幅是否关闭

### 进度结构示例

```json
{
  "round1": {
    "1": {
      "solvedAt": "2025-10-28T08:00:00.000Z",
      "round": "round1",
      "reviewCount": 2,
      "reviewHistory": [
        "2025-11-01T10:00:00.000Z",
        "2025-11-15T09:00:00.000Z"
      ],
      "lastReviewAt": "2025-11-15T09:00:00.000Z"
    }
  },
  "round2": {},
  "round3": {},
  "round4": {},
  "round5": {},
  "round6": {},
  "round7": {}
}
```

### 备份建议

- 数据只保存在当前浏览器环境
- 清理浏览器缓存会导致进度丢失
- 更换设备不会自动同步
- 强烈建议定期通过导出功能备份

---

## 技术栈

- 前端：原生 HTML / CSS / JavaScript
- 图表：Chart.js
- 存储：浏览器 `localStorage`
- 图片生成：Canvas API
- 部署方式：静态文件部署

---

## 已知设计取舍

这是一个**刻意保持简单的静态前端项目**，不是框架化单页应用。

### 优点

- 部署简单
- 运行门槛低
- 不依赖构建工具
- 修改成本低，适合个人持续维护

### 代价

- 当前仍使用全局状态和内联事件
- 模块边界依赖人为约定，不是强约束
- 功能继续增加时，需要持续控制重复逻辑和共享常量

换句话说，这个项目的价值在于**够直接、够稳定、够可维护**，而不是“技术栈看起来很现代”。

---

## README 当前维护原则

这份文档不应该写成“作者随手记事本”，而应该满足最基本的工程文档要求：

- 先说明项目是什么
- 再说明能做什么
- 再说明怎么运行
- 再说明结构怎么组织
- 最后说明数据怎么存、限制在哪里

后续更新 [`README.md`](README.md) 时，优先保持：

1. 结构稳定
2. 信息可验证
3. 与实际代码一致
4. 少写口号，多写事实

---

## 许可证

项目使用 [MIT License](LICENSE)。
