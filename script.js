// 全局变量
let allProblems = []; // 所有题目数据
let problemsData = {}; // 按轮次组织的题目数据
let currentUser = null;
let currentRound = 1;
let selectedCategory = null;
let userProgress = {};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadProblemsData();
});

// 从JSON文件加载题目数据
async function loadProblemsData() {
    try {
        const response = await fetch('problems-data.json');
        const data = await response.json();
        allProblems = data.problems;

        // 根据难度和通过率自动分配轮次
        organizeProblemsByRounds();

        // 检查登录状态
        checkLogin();
    } catch (error) {
        console.error('加载题目数据失败:', error);
        alert('加载题目数据失败，请刷新页面重试');
    }
}

// 根据难度和通过率组织题目到不同轮次
function organizeProblemsByRounds() {
    // 初始化数据结构
    problemsData = {
        round1: {
            name: "第一轮 (简单 50%+)",
            description: "难度简单，通过率在50%以上的题目",
            categories: {}
        },
        round2: {
            name: "第二轮 (中等 50%+)",
            description: "难度中等，通过率在50%以上的题目",
            categories: {}
        },
        round3: {
            name: "第三轮 (算法理论)",
            description: "学习算法理论后，刷树、图、贪心、动态规划",
            categories: {}
        },
        round4: {
            name: "第四轮 (困难)",
            description: "困难题目和通过率低于50%的题目",
            categories: {}
        }
    };

    // 第三轮特定分类
    const round3Categories = ['树', '图与回溯算法', '贪心', '动态规划'];

    // 遍历所有题目并分配到相应轮次
    allProblems.forEach(problem => {
        const { difficulty, passRate, category } = problem;

        // 第三轮：树、图、贪心、动态规划相关（不论难度）
        if (round3Categories.includes(category)) {
            if (!problemsData.round3.categories[category]) {
                problemsData.round3.categories[category] = [];
            }
            problemsData.round3.categories[category].push(problem.id);
        }
        // 第一轮：简单且通过率>=50%
        else if (difficulty === '简单' && passRate >= 50) {
            if (!problemsData.round1.categories[category]) {
                problemsData.round1.categories[category] = [];
            }
            problemsData.round1.categories[category].push(problem.id);
        }
        // 第二轮：中等且通过率>=50%
        else if (difficulty === '中等' && passRate >= 50) {
            if (!problemsData.round2.categories[category]) {
                problemsData.round2.categories[category] = [];
            }
            problemsData.round2.categories[category].push(problem.id);
        }
        // 第四轮：困难题目或通过率<50%
        else {
            const round4Category = '综合挑战';
            if (!problemsData.round4.categories[round4Category]) {
                problemsData.round4.categories[round4Category] = [];
            }
            problemsData.round4.categories[round4Category].push(problem.id);
        }
    });

    // 转换categories对象为数组格式
    ['round1', 'round2', 'round3', 'round4'].forEach(roundKey => {
        const categoriesObj = problemsData[roundKey].categories;
        problemsData[roundKey].categories = Object.keys(categoriesObj).map(name => ({
            name: name,
            problems: categoriesObj[name]
        }));
    });
}

// 检查登录状态
function checkLogin() {
    const savedUser = localStorage.getItem('leetcodeUser');
    if (savedUser) {
        currentUser = savedUser;
        loadUserProgress();
        showMainPage();
    } else {
        showLoginPage();
    }
}

// 登录函数
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
    loadUserProgress();
    showMainPage();
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        currentUser = null;
        localStorage.removeItem('leetcodeUser');
        showLoginPage();
    }
}

// 显示登录页面
function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('mainPage').classList.remove('active');
}

// 显示主页面
function showMainPage() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
    document.getElementById('currentUser').textContent = `👤 ${currentUser}`;
    checkNoticeVisibility();
    selectRound(currentRound);
}

// 加载用户进度
function loadUserProgress() {
    const saved = localStorage.getItem(`progress_${currentUser}`);
    if (saved) {
        userProgress = JSON.parse(saved);
    } else {
        userProgress = {
            round1: {},
            round2: {},
            round3: {},
            round4: {}
        };
    }
}

// 保存用户进度
function saveUserProgress() {
    localStorage.setItem(`progress_${currentUser}`, JSON.stringify(userProgress));
}

// 选择轮次
function selectRound(round) {
    currentRound = round;
    selectedCategory = null;

    // 更新按钮状态
    const buttons = document.querySelectorAll('.round-btn');
    buttons.forEach((btn, index) => {
        if (index + 1 === round) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 渲染分类
    renderCategories();
    updateStats();
}

// 渲染分类卡片
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    container.innerHTML = '';

    if (!roundData || !roundData.categories || roundData.categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无题目数据</p>';
        return;
    }

    roundData.categories.forEach((category, index) => {
        const solved = category.problems.filter(p =>
            userProgress[roundKey] && userProgress[roundKey][p]
        ).length;
        const total = category.problems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'category-card';
        if (index === 0 && !selectedCategory) {
            card.classList.add('active');
            selectedCategory = category;
        }

        card.innerHTML = `
            <div class="category-header">
                <div class="category-name">${category.name}</div>
                <div class="category-progress">${solved}/${total}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;

        card.onclick = () => {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedCategory = category;
            renderProblems();
        };

        container.appendChild(card);
    });

    // 渲染第一个分类的题目
    if (selectedCategory) {
        renderProblems();
    }
}

// 渲染题目列表
function renderProblems() {
    if (!selectedCategory) return;

    const container = document.getElementById('problemsContainer');
    const roundKey = `round${currentRound}`;

    container.innerHTML = `
        <div class="problems-section">
            <div class="section-title">
                📝 ${selectedCategory.name} - 题目列表
            </div>
            <div class="problems-grid" id="problemsGrid"></div>
        </div>
    `;

    const grid = document.getElementById('problemsGrid');

    selectedCategory.problems.forEach(problemNum => {
        const wrapper = document.createElement('div');
        wrapper.className = 'problem-wrapper';

        const item = document.createElement('div');
        item.className = 'problem-item';

        const isSolved = userProgress[roundKey] && userProgress[roundKey][problemNum];
        if (isSolved) {
            item.classList.add('solved');
        }

        item.textContent = problemNum;
        item.title = `点击打卡题目 ${problemNum}`;

        item.onclick = (e) => {
            e.stopPropagation();
            toggleProblem(roundKey, problemNum, item);
        };

        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制题号';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            copyProblemNumber(problemNum, copyBtn);
        };

        wrapper.appendChild(item);
        wrapper.appendChild(copyBtn);
        grid.appendChild(wrapper);
    });
}

// 复制题号到剪贴板
function copyProblemNumber(problemNum, button) {
    navigator.clipboard.writeText(problemNum).then(() => {
        // 显示复制成功反馈
        const originalText = button.innerHTML;
        button.innerHTML = '✓';
        button.classList.add('copied');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 1000);
    }).catch(err => {
        // 如果剪贴板API不可用，使用备用方案
        const textArea = document.createElement('textarea');
        textArea.value = problemNum;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.classList.add('copied');
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 1000);
        } catch (err) {
            alert('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
    });
}

// 切换题目完成状态
function toggleProblem(roundKey, problemNum, element) {
    if (!userProgress[roundKey]) {
        userProgress[roundKey] = {};
    }

    const isSolved = userProgress[roundKey][problemNum];

    if (isSolved) {
        // 取消打卡
        delete userProgress[roundKey][problemNum];
        element.classList.remove('solved');
    } else {
        // 打卡
        userProgress[roundKey][problemNum] = {
            solvedAt: new Date().toISOString(),
            round: roundKey
        };
        element.classList.add('solved');

        // 添加打卡动画效果
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    saveUserProgress();
    updateStats();
    renderCategories();
}

// 更新统计数据
function updateStats() {
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    if (!roundData) return;

    // 计算总题目数
    let totalProblems = 0;
    let solvedProblems = 0;

    roundData.categories.forEach(category => {
        totalProblems += category.problems.length;
        category.problems.forEach(problemNum => {
            if (userProgress[roundKey] && userProgress[roundKey][problemNum]) {
                solvedProblems++;
            }
        });
    });

    const completionRate = totalProblems > 0
        ? Math.round((solvedProblems / totalProblems) * 100)
        : 0;

    // 更新显示
    document.getElementById('totalSolved').textContent = solvedProblems;
    document.getElementById('totalProblems').textContent = totalProblems;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('currentRound').textContent = roundData.name.split(' ')[0];
}

// 获取总体进度统计
function getOverallStats() {
    let totalSolved = 0;
    let totalProblems = 0;

    Object.keys(problemsData).forEach(roundKey => {
        problemsData[roundKey].categories.forEach(category => {
            totalProblems += category.problems.length;
            category.problems.forEach(problemNum => {
                if (userProgress[roundKey] && userProgress[roundKey][problemNum]) {
                    totalSolved++;
                }
            });
        });
    });

    return { totalSolved, totalProblems };
}

// 显示刷题技巧菜单
function showTipsMenu() {
    document.getElementById('tipsModal').classList.add('active');
}

// 关闭刷题技巧菜单
function closeTipsMenu() {
    document.getElementById('tipsModal').classList.remove('active');
}

// 显示数据管理菜单
function showDataMenu() {
    document.getElementById('dataModal').classList.add('active');
}

// 关闭数据管理菜单
function closeDataMenu() {
    document.getElementById('dataModal').classList.remove('active');
}

// 关闭提醒横幅
function closeNotice() {
    document.getElementById('dataNotice').classList.add('hidden');
    localStorage.setItem('noticeHidden', 'true');
}

// 检查是否显示提醒横幅
function checkNoticeVisibility() {
    const noticeHidden = localStorage.getItem('noticeHidden');
    if (noticeHidden === 'true') {
        document.getElementById('dataNotice').classList.add('hidden');
    }
}

// 导出进度数据
function exportProgress() {
    const dataStr = JSON.stringify(userProgress, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leetcode_progress_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // 显示成功提示
    alert('✅ 数据导出成功！\n文件已保存到下载文件夹');
    closeDataMenu();
}

// 触发导入文件选择
function triggerImport() {
    document.getElementById('importFile').click();
}

// 处理导入文件
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            // 验证数据格式
            if (!imported || typeof imported !== 'object') {
                throw new Error('数据格式不正确');
            }

            if (confirm('⚠️ 导入数据将覆盖当前进度，确定要继续吗？\n\n建议先导出当前数据作为备份。')) {
                userProgress = imported;
                saveUserProgress();
                selectRound(currentRound);
                alert('✅ 进度数据导入成功！');
                closeDataMenu();
            }
        } catch (error) {
            alert('❌ 导入失败：文件格式不正确\n\n请确保导入的是有效的JSON文件');
        }
    };
    reader.readAsText(file);

    // 重置文件选择器
    event.target.value = '';
}

// 点击弹窗外部关闭
document.addEventListener('click', function(e) {
    const dataModal = document.getElementById('dataModal');
    const tipsModal = document.getElementById('tipsModal');

    if (e.target === dataModal) {
        closeDataMenu();
    }
    if (e.target === tipsModal) {
        closeTipsMenu();
    }
});
