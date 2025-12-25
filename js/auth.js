// js/auth.js

/**
 * 检查用户的登录状态。
 * 如果本地存储中有用户信息，则加载用户数据并显示主页面。
 * 否则，显示登录页面。
 */
function checkLogin() {
    const savedUser = localStorage.getItem('leetcodeUser');
    if (savedUser) {
        currentUser = savedUser;
        loadUserProgress(); // 依赖 data.js
        showMainPage();
    } else {
        showLoginPage();
    }
}

/**
 * 处理用户登录。
 * 验证用户名，保存到本地存储，然后加载用户进度并显示主页面。
 */
function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('请输入用户名');
        return;
    }

    if (username.length < 2) {
        alert('用户名至少需要2个字符');
        return;
    }

    currentUser = username;
    localStorage.setItem('leetcodeUser', username);
    loadUserProgress(); // 依赖 data.js
    showMainPage();
}

/**
 * 处理用户登出。
 * 清除本地存储中的用户信息并显示登录页面。
 */
function logout() {
    if (confirm('确定要退出登录吗？')) {
        currentUser = null;
        localStorage.removeItem('leetcodeUser');
        showLoginPage();
    }
}

/**
 * 显示登录页面，并隐藏主页面。
 */
function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('mainPage').classList.remove('active');
}

/**
 * 显示主页面，并隐藏登录页面。
 * 同时更新用户显示，检查通知，并渲染当前轮次的题目和日历。
 */
function showMainPage() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
    document.getElementById('currentUser').textContent = `👤 ${currentUser}`;

    checkNoticeVisibility(); // 依赖 modals.js
    selectRound(currentRound); // 依赖 ui.js
    renderCalendar(); // 依赖 calendar.js
}
