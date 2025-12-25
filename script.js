// =================================================================
//  主脚本 (Main Script) - script.js
//  =================================================================
//  职责:
//  1. 定义全局变量。
//  2. 设置应用的入口点 (DOMContentLoaded 事件监听器)。
//  3. 启动数据加载过程。
// =================================================================

// --- 全局变量定义 ---

let allProblems = [];      // 存储从 JSON 加载的所有题目信息
let problemsData = {};     // 按轮次和分类组织后的题目数据
let currentUser = null;    // 当前登录的用户名
let currentRound = 1;      // 当前所在的刷题轮次
let selectedCategory = null; // 当前选中的题目分类
let userProgress = {};     // 当前用户的刷题进度

// --- 应用初始化 ---

/**
 * 当 DOM 内容完全加载并解析后，启动应用。
 * 这是整个应用的入口点。
 */
document.addEventListener('DOMContentLoaded', function() {
    // 调用 data.js 中的函数来开始加载题目数据
    loadProblemsData();
});
