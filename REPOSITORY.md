# 🎯 力扣征途

> 四轮进阶算法修炼系统 | LeetCode 刷题进度跟踪工具。
> 题目号来源于网络，难度和通过率来源于AI搜索，会有不准的数据，可以自行增删改。
> 本项目全程使用AI构建

[![GitHub](https://img.shields.io/badge/GitHub-力扣征途-blue?style=flat-square&logo=github)](https://github.com/your-username/leetcode-journey)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![HTML](https://img.shields.io/badge/HTML-5-orange?style=flat-square&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-3-blue?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 📖 简介

**力扣征途** 是一个纯前端的 LeetCode 刷题进度跟踪系统，采用科学的四轮进阶学习路线，帮助你系统化地完成算法修炼，从零基础到算法高手。

### ✨ 核心特性

- 🎯 **四轮进阶体系** - 基础入门 → 进阶提升 → 算法理论 → 困难挑战
- 📊 **实时统计** - 直观的进度追踪和完成率展示
- 💾 **数据管理** - 支持导出/导入，防止数据丢失
- 💡 **刷题指南** - 内置详细的学习策略和技巧
- 👥 **多用户** - 支持多用户独立数据存储
- 📋 **快速复制** - 一键复制题号，快速跳转 LeetCode
- 🎨 **现代化UI** - 渐变紫色主题，响应式设计
- 🚀 **零依赖** - 纯静态网页，开箱即用

## 🖼️ 预览

### 登录界面
```
🎯 力扣征途
四轮进阶 · 系统化算法修炼
━━━━━━━━━━━━━━━━━━━━
欢迎回来
👤 用户名输入框
🚀 开始刷题之旅
```

### 主界面
- 📊 统计面板：当前进度、已完成、总题数、完成率
- 🎯 四轮选择：第一轮 | 第二轮 | 第三轮 | 第四轮
- 📚 分类卡片：数学、数组、链表、字符串等 13 个分类
- ✅ 题目网格：点击打卡，实时更新进度

## 🚀 快速开始

### 在线使用

1. **访问 Demo**：[在线体验](https://your-demo-url.com)
2. **输入用户名**：首次使用自动创建账号
3. **开始刷题**：选择轮次和分类，点击题号打卡

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/your-username/leetcode-journey.git

# 进入目录
cd leetcode-journey

# 直接用浏览器打开
open index.html
# 或者使用本地服务器
python -m http.server 8000
# 访问 http://localhost:8000
```

### 服务器部署

**Nginx 部署**
```bash
# 上传文件到服务器
scp -r ./* user@server:/var/www/leetcode/

# 配置 Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/leetcode;
    index index.html;
}
```

**其他部署方式**
- Vercel / Netlify：拖拽部署
- GitHub Pages：Settings → Pages → Deploy
- Docker：提供 Dockerfile

## 📚 四轮学习路线

### 🟢 第一轮：基础入门
按照 **数学 → 数组 → 链表 → 字符串 → 哈希表 → 双指针 → 递归 → 栈 → 队列** 顺序刷题
- 难度：**简单**
- 通过率：**≥50%**
- 题量：**137道**

### 🔵 第二轮：进阶提升
相同顺序，提升难度
- 难度：**中等**
- 通过率：**≥50%**
- 题量：**58道**

### 🟠 第三轮：算法理论
先学理论（分治、贪心、动规、BST、图），再刷 **树 → 图 → 贪心 → 动规**
- 难度：**简单/中等**
- 通过率：**≥50%**
- 题量：**184道**

### 🔴 第四轮：困难挑战
挑战困难题和低通过率题目
- 难度：**困难**
- 通过率：**<50%**
- 题量：**97道**

## 💡 功能说明

### 数据管理
- 📥 **导出数据**：JSON 格式，可备份
- 📤 **导入数据**：恢复之前的进度
- 💾 **本地存储**：数据保存在浏览器 localStorage

### 题目管理
- ✅ **打卡**：点击题号标记完成
- 📋 **复制**：快速复制题号到剪贴板
- 📊 **统计**：实时显示完成进度
- 🎨 **分类**：13个算法分类，科学归纳

## 📂 项目结构

```
leetcode-journey/
├── index.html              # 主页面
├── style.css              # 样式文件
├── script.js              # 核心逻辑
├── problems-data.json     # 题目数据（458道）
├── README.md              # 完整文档
├── REPOSITORY.md          # 仓库介绍（本文件）
├── .gitignore            # Git 忽略配置
```

## 🛠️ 技术栈

- **HTML5** - 页面结构
- **CSS3** - 渐变主题 + 响应式布局
- **JavaScript ES6** - 核心功能
- **localStorage** - 数据持久化
- **Clipboard API** - 复制功能

**零依赖**：无需 Node.js、无需构建工具、无需后端

## 📊 数据说明

- **题目总数**：458道
- **数据来源**：LeetCode 官方题库精选
- **更新频率**：不定期更新
- **存储方式**：浏览器 localStorage

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

```bash
# Fork 项目
# 创建分支
git checkout -b feature/your-feature

# 提交更改
git commit -m "Add: your feature"

# 推送到分支
git push origin feature/your-feature

# 创建 Pull Request
```

## 📝 开发计划

- [ ] 题目筛选和搜索功能
- [ ] 学习时长统计
- [ ] 每日打卡提醒
- [ ] 题目笔记功能
- [ ] 错题本系统
- [ ] 数据可视化图表
- [ ] 移动端优化
- [ ] 多语言支持

## ⭐ Star History

如果觉得这个项目对你有帮助，请给个 Star ⭐️ 
 

## 🙏 致谢

感谢所有为算法学习做出贡献的开发者和教育者。

---

**开始你的算法征途吧！** 💪
 
