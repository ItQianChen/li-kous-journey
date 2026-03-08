# 🎯 力扣征途 - 系统化算法刷题进度工具

> 一个基于纯 [`HTML`](index.html)、[`CSS`](css/main.css) 和 [`JavaScript`](script.js) 构建的 LeetCode 刷题追踪工具，强调循序渐进、可视化反馈和本地优先的数据管理。

## 项目简介

[`力扣征途`](README.md) 是一个无需后端、开箱即用的本地刷题进度管理项目。它通过预置题库、轮次划分、打卡记录、图表分析和分享卡片，把“刷题”这件事从零散行为变成可持续的训练流程。

项目当前采用浏览器原生脚本组织方式：
- 页面结构由 [`index.html`](index.html) 提供
- 全局状态由 [`script.js`](script.js:12) 初始化
- 题目数据加载与轮次组织由 [`loadProblemsData()`](js/data.js:158) 和 [`organizeProblemsByRounds()`](js/data.js:196) 完成
- 页面交互以全局函数 + 内联事件为主，追求低门槛部署和简单维护

## 核心价值

- 🎯 **系统化刷题路径**：不是简单题单堆砌，而是按轮次组织训练节奏
- 📊 **即时反馈**：当前进度、总进度、连续打卡、图表趋势一目了然
- 📅 **历史回顾能力**：支持按天、按月查看打卡明细
- 📤 **分享能力**：支持生成当日、本月、全局的分享卡片
- 💾 **本地优先**：数据存储在浏览器本地，无需注册服务器
- 🧩 **低耦合静态部署**：直接打开 [`index.html`](index.html) 即可运行

## 当前功能概览

### 1. 用户与进度管理
- 多用户本地隔离，用户名存放在 [`localStorage`](README.md)
- 每个用户拥有独立的刷题进度和视图状态
- 进度支持导出与导入
- 页面会自动恢复最近浏览的轮次与分类，见 [`loadUserViewState()`](js/data.js:62)

### 2. 七轮题库组织
当前项目已经不是旧版 README 中写的“四轮”，而是 **七轮结构**，这点以前文档写错了，现在已修正。

轮次来源见 [`problemsData`](js/data.js:197)：
- `round1`：简单题，通过率 ≥ 50%
- `round2`：中等题，通过率 ≥ 50%
- `round3`：算法理论强化（树、图与回溯算法、贪心、动态规划）
- `round4`：困难题与低通过率题
- `round5`：SQL 数据库专项
- `round6`：Hot100
- `round7`：面试经典 150

### 3. 主界面能力
主界面结构定义在 [`index.html`](index.html:36)，主要包含：
- 顶部搜索栏
- 全局统计面板
- 当前轮次统计面板
- 轮次切换按钮
- 分类列表与题目列表
- 日历、图表、数据管理、技巧说明等弹窗入口

### 4. 搜索与跳转
- 支持按题号、标题模糊搜索，入口见 [`searchProblems()`](js/search.js:6)
- 搜索结果可直接定位到题目所在轮次与分类
- 若同题属于多个位置，会弹出分类选择弹窗

### 5. 打卡与统计
- 点击题目可打卡或取消打卡，核心逻辑见 [`toggleProblem()`](js/ui.js:192)
- 支持当前轮次统计与全局统计
- 全局统计包括连续打卡、今日答题、当前进度、总进度，更新逻辑见 [`updateGlobalStats()`](js/ui.js:256)

### 6. 日历与历史记录
- 日历入口见 [`toggleCalendar()`](js/calendar.js:11)
- 支持切换月份、查看每日活动、月度汇总
- 支持按轮次/分类折叠查看打卡明细
- 支持在详情中搜索已完成题目

### 7. 图表可视化
图表入口见 [`showChartModal()`](js/chart.js:18)，当前包含：
- 轮次进度环图 [`renderProgressChart()`](js/chart-progress.js:49)
- 趋势折线图 [`renderTrendChart()`](js/chart-trend.js:135)
- 分类雷达图 [`renderRadarChart()`](js/chart-radar-heatmap.js:34)
- 年度热力图 [`renderHeatmapChart()`](js/chart-radar-heatmap.js:116)

### 8. 分享卡片
- 当日 / 本月分享逻辑位于 [`js/share-card.js`](js/share-card.js)
- 全局分享逻辑位于 [`js/share-overall.js`](js/share-overall.js)
- 使用 Canvas 生成高清图片，支持下载

## 最近一次结构整理

这次代码整理的重点不是“把文件切碎”，而是把已经变胖的职责拆开。

### 已完成的 JS 拆分
原本职责过多的两个文件已经按功能拆分：

#### 日历相关
- [`js/calendar.js`](js/calendar.js)：日历状态、月视图渲染、活动聚合、月统计
- [`js/calendar-detail.js`](js/calendar-detail.js)：日期详情、月度详情、详情筛选、折叠展开
- [`js/share-card.js`](js/share-card.js)：当日/本月分享卡片、下载、圆角绘制
- [`js/share-overall.js`](js/share-overall.js)：全局分享统计与全局分享卡片

#### 图表相关
- [`js/chart.js`](js/chart.js)：图表弹窗、切换、实例销毁、统一分发
- [`js/chart-progress.js`](js/chart-progress.js)：轮次进度图
- [`js/chart-trend.js`](js/chart-trend.js)：趋势图与日期范围控制
- [`js/chart-radar-heatmap.js`](js/chart-radar-heatmap.js)：雷达图与热力图

### 这次拆分带来的好处
- 单文件职责更清晰
- 后续加功能不必继续往一个 1000 行文件里硬塞
- 保留了现有全局入口，兼容 [`index.html`](index.html) 中的内联事件
- 不引入构建工具，仍可静态部署

## 快速开始

### 运行方式
最简单的方式：
1. 克隆或下载项目到本地
2. 直接用浏览器打开 [`index.html`](index.html)
3. 输入任意用户名开始使用

如果浏览器对本地 [`fetch`](js/data.js:161) 有限制，也可以使用任意静态文件服务启动，例如 VS Code Live Server。

### 基本使用流程
1. 打开 [`index.html`](index.html)
2. 登录用户名
3. 选择轮次
4. 选择分类
5. 点击题目进行打卡
6. 使用顶部搜索快速定位题目
7. 使用日历查看历史记录
8. 使用图表观察整体趋势
9. 定期通过数据管理导出进度备份

## 项目结构

```text
liko/
├── index.html
├── script.js
├── README.md
├── problems-data.json
├── hot100-data.json
├── interview150-data.json
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
    ├── calendar.js
    ├── calendar-detail.js
    ├── share-card.js
    ├── share-overall.js
    ├── chart.js
    ├── chart-progress.js
    ├── chart-trend.js
    ├── chart-radar-heatmap.js
    ├── search.js
    ├── modals.js
    └── utils.js
```

## 文件职责说明

### 页面与入口
- [`index.html`](index.html)：页面结构、弹窗骨架、脚本加载顺序
- [`script.js`](script.js)：定义全局状态并在 DOM 加载后启动数据加载

### 数据与状态
- [`js/data.js`](js/data.js)：题库加载、轮次组织、用户进度持久化、导入导出、视图状态恢复
- [`problems-data.json`](problems-data.json)：基础题库
- [`hot100-data.json`](hot100-data.json)：Hot100 题库
- [`interview150-data.json`](interview150-data.json)：面试经典 150 题库

### UI 与交互
- [`js/ui.js`](js/ui.js)：轮次切换、分类渲染、题目渲染、主统计更新
- [`js/search.js`](js/search.js)：搜索、定位、跳转
- [`js/modals.js`](js/modals.js)：技巧弹窗、数据弹窗、分类选择弹窗等
- [`js/utils.js`](js/utils.js)：复制题号、折叠 section 等通用辅助函数

### 日历与分享
- [`js/calendar.js`](js/calendar.js)：日历核心
- [`js/calendar-detail.js`](js/calendar-detail.js)：日/月详情视图
- [`js/share-card.js`](js/share-card.js)：当日与月度分享
- [`js/share-overall.js`](js/share-overall.js)：全局分享

### 图表
- [`js/chart.js`](js/chart.js)：图表主控
- [`js/chart-progress.js`](js/chart-progress.js)：轮次进度环图
- [`js/chart-trend.js`](js/chart-trend.js)：趋势图
- [`js/chart-radar-heatmap.js`](js/chart-radar-heatmap.js)：雷达图与年度热力图

## 数据存储说明

项目使用浏览器 [`localStorage`](README.md) 存储用户数据。

### 主要键名
- 当前用户：`leetcodeUser`
- 用户进度：`progress_{用户名}`
- 浏览状态：`viewState_{用户名}`（由 `saveCurrentViewState()` 保存最近浏览的轮次与分类）
- 横幅关闭状态：`noticeHidden`

### 进度结构示例

```javascript
{
  "round1": {
    "1": {
      "solvedAt": "2025-10-28T08:00:00.000Z",
      "round": "round1"
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

### 注意事项
- 数据只保存在当前浏览器
- 清理浏览器缓存会导致数据丢失
- 强烈建议定期通过 [`exportProgress()`](js/data.js:292) 备份数据

## 技术栈

- 前端：原生 [`HTML`](index.html)、[`CSS`](css/main.css)、[`JavaScript`](script.js)
- 图表库：[`Chart.js 4.4.1`](index.html:14)
- 存储：浏览器 `localStorage`
- 图像生成：Canvas API
- 复制功能：Clipboard / 原生 DOM 方案

## 已知设计取舍

这不是一个使用工程化构建链的项目，而是一个刻意保持简单的静态前端。

### 优点
- 部署简单
- 学习成本低
- 不依赖 Node 构建
- 修改 HTML/CSS/JS 即可见效

### 代价
- 目前仍依赖全局变量和内联事件
- 模块边界比现代前端框架更脆弱
- 复杂功能继续增加时，需要进一步收敛重复常量和共享逻辑

## 后续改进建议

### 值得继续做的
- 抽取轮次名称、颜色等共享常量，避免在多个文件重复定义
- 继续拆分 [`js/data.js`](js/data.js)，把“题库加载”和“进度存储”进一步分离
- 为 README 增加截图或演示 GIF
- 增加静态服务启动说明

### 暂时别瞎折腾的
- 不要急着一口气改成完整模块化框架
- 不要为了“现代化”把简单静态项目变成复杂构建工程
- 不要随意改动全局函数名，否则会直接破坏 [`index.html`](index.html) 中的事件绑定

## 使用建议

1. 严格按轮次推进，不要来回乱跳
2. 每周至少导出一次进度备份
3. 第三轮前先补算法理论
4. 定期查看图表和热力图，找出薄弱环节
5. 善用搜索和分享卡片，提升复盘效率

## 结语

[`力扣征途`](README.md) 现在已经不只是一个“能打卡”的页面，而是一个有训练路径、有历史回顾、有统计反馈的静态刷题工具。

这类项目最重要的不是技术花哨，而是结构别烂、文档别假、功能别互相踩。当前 README 已按现有代码结构更新，可作为后续维护的基准文档。
