// 全局变量
let allProblems = []; // 所有题目数据
let problemsData = {}; // 按轮次组织的题目数据
let currentUser = null;
let currentRound = 1;
let selectedCategory = null;
let userProgress = {};

// 日历相关变量
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

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
    renderCalendar(); // 渲染日历
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
        // 获取题目详细信息
        const problemInfo = allProblems.find(p => p.id.toString() === problemNum.toString());

        const wrapper = document.createElement('div');
        wrapper.className = 'problem-wrapper';

        const item = document.createElement('div');
        item.className = 'problem-item';

        const isSolved = userProgress[roundKey] && userProgress[roundKey][problemNum];
        if (isSolved) {
            item.classList.add('solved');
        }

        // 创建题目内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'problem-content';

        // 题号
        const numberDiv = document.createElement('div');
        numberDiv.className = 'problem-number';
        numberDiv.textContent = problemNum;

        // 题目标题
        const titleDiv = document.createElement('div');
        titleDiv.className = 'problem-title';
        titleDiv.textContent = problemInfo ? problemInfo.title : '';
        titleDiv.title = problemInfo ? `${problemNum}. ${problemInfo.title}` : `题目 ${problemNum}`;

        contentDiv.appendChild(numberDiv);
        contentDiv.appendChild(titleDiv);
        item.appendChild(contentDiv);

        // 如果题目有 URL，添加跳转按钮
        if (problemInfo && problemInfo.url) {
            const linkBtn = document.createElement('button');
            linkBtn.className = 'link-btn';
            linkBtn.innerHTML = '🔗';
            linkBtn.title = '跳转到题目页面';
            linkBtn.onclick = (e) => {
                e.stopPropagation();
                window.open(problemInfo.url, '_blank');
            };
            item.appendChild(linkBtn);
        }

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
    renderCalendar(); // 更新日历显示
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

// 打开日历弹窗
function toggleCalendar() {
    document.getElementById('calendarModal').classList.add('active');
    renderCalendar();
}

// 关闭日历弹窗
function closeCalendar() {
    document.getElementById('calendarModal').classList.remove('active');
}

// 日历功能函数
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('currentMonth');

    // 更新月份显示
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    monthDisplay.textContent = `${currentYear}年 ${monthNames[currentMonth]}`;

    // 清空日历网格
    grid.innerHTML = '';

    // 获取当月第一天和最后一天
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 添加空白格子（月初前的空白）
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        grid.appendChild(emptyDay);
    }

    // 添加当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activity = getDailyActivity(dateStr);

        // 检查是否是今天
        const today = new Date();
        const isToday = day === today.getDate() &&
                        currentMonth === today.getMonth() &&
                        currentYear === today.getFullYear();

        if (isToday) {
            dayElement.classList.add('today');
        }

        // 根据题目数量添加不同的样式
        if (activity && activity.count > 0) {
            if (activity.count >= 6) {
                dayElement.classList.add('high-activity');
            } else if (activity.count >= 3) {
                dayElement.classList.add('medium-activity');
            } else {
                dayElement.classList.add('low-activity');
            }
        }

        // 设置日期内容
        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            ${activity && activity.count > 0 ? `<div class="calendar-day-count">${activity.count}题</div>` : ''}
        `;

        // 添加点击事件显示详情
        dayElement.onclick = () => showDateDetail(dateStr, activity);

        grid.appendChild(dayElement);
    }

    // 添加下月空白格子
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        grid.appendChild(emptyDay);
    }
}

// 获取某天的打卡活动
function getDailyActivity(dateStr) {
    let totalSolved = 0;
    const problems = [];

    // 遍历所有轮次的打卡记录
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.entries(userProgress[roundKey]).forEach(([problemId, progress]) => {
                if (progress.solvedAt) {
                    const solvedDate = new Date(progress.solvedAt).toISOString().split('T')[0];
                    if (solvedDate === dateStr) {
                        totalSolved++;

                        // 获取题目详细信息
                        const problemInfo = allProblems.find(p => p.id.toString() === problemId);
                        if (problemInfo) {
                            problems.push({
                                id: problemId,
                                round: roundKey,
                                difficulty: problemInfo.difficulty,
                                category: problemInfo.category,
                                solvedAt: progress.solvedAt
                            });
                        }
                    }
                }
            });
        }
    });

    return { count: totalSolved, problems: problems };
}

// 显示日期详情
function showDateDetail(dateStr, activity) {
    if (!activity || activity.count === 0) {
        return; // 没有打卡记录不显示
    }

    const modal = document.getElementById('dateDetailModal');
    const title = document.getElementById('dateDetailTitle');
    const content = document.getElementById('dateDetailContent');

    // 格式化日期显示
    const date = new Date(dateStr);
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    title.textContent = `📝 ${formattedDate} - 共完成 ${activity.count} 题`;

    // 按轮次分组题目
    const problemsByRound = {
        round1: [],
        round2: [],
        round3: [],
        round4: []
    };

    activity.problems.forEach(problem => {
        problemsByRound[problem.round].push(problem);
    });

    // 生成详情内容
    let html = '';
    const roundNames = {
        round1: '第一轮',
        round2: '第二轮',
        round3: '第三轮',
        round4: '第四轮'
    };

    Object.keys(problemsByRound).forEach(roundKey => {
        const problems = problemsByRound[roundKey];
        if (problems.length > 0) {
            html += `
                <div class="round-section">
                    <h3 class="round-title ${roundKey}">${roundNames[roundKey]}</h3>
                    <div class="problems-list">
            `;

            problems.forEach(problem => {
                // 获取题目完整信息
                const problemInfo = allProblems.find(p => p.id.toString() === problem.id.toString());
                const problemTitle = problemInfo ? problemInfo.title : '';
                const problemUrl = problemInfo ? problemInfo.url : '';

                const difficultyClass = problem.difficulty === '简单' ? 'easy' :
                                       problem.difficulty === '中等' ? 'medium' : 'hard';
                html += `
                    <div class="problem-detail-item">
                        <span class="problem-number">${problem.id}</span>
                        <span class="problem-title-detail">${problemTitle}</span>
                        <span class="problem-category">${problem.category}</span>
                        <span class="problem-difficulty ${difficultyClass}">${problem.difficulty}</span>
                        ${problemUrl ? `<button class="link-problem-btn" onclick="window.open('${problemUrl}', '_blank')" title="跳转到题目页面">
                            🔗
                        </button>` : ''}
                        <button class="copy-problem-btn" onclick="copyProblemId('${problem.id}', event)" title="复制题号">
                            📋
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }
    });

    content.innerHTML = html;
    modal.classList.add('active');
}

// 关闭日期详情弹窗
function closeDateDetail() {
    document.getElementById('dateDetailModal').classList.remove('active');
}

// 上一个月
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

// 下一个月
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// 点击弹窗外部关闭
document.addEventListener('click', function(e) {
    const dataModal = document.getElementById('dataModal');
    const tipsModal = document.getElementById('tipsModal');
    const calendarModal = document.getElementById('calendarModal');
    const dateDetailModal = document.getElementById('dateDetailModal');

    if (e.target === dataModal) {
        closeDataMenu();
    }

    if (e.target === tipsModal) {
        closeTipsMenu();
    }

    if (e.target === calendarModal) {
        closeCalendar();
    }

    if (e.target === dateDetailModal) {
        closeDateDetail();
    }

    const categoryChoiceModal = document.getElementById('categoryChoiceModal');
    if (e.target === categoryChoiceModal) {
        closeCategoryChoiceModal();
    }
});

// 复制题目ID到剪贴板（用于日期详情弹窗）
function copyProblemId(problemId, event) {
    event.stopPropagation();
    const button = event.target;

    const textArea = document.createElement('textarea');
    textArea.value = problemId;
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
}

// --- 搜索功能 ---

// 搜索题目
function searchProblems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 1) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }

    const filteredProblems = allProblems.filter(p =>
        p.id.toString().includes(query) || p.title.toLowerCase().includes(query)
    );

    // 对结果进行去重
    const uniqueProblems = Array.from(new Map(filteredProblems.map(p => [p.id, p])).values());

    // 按匹配度排序
    uniqueProblems.sort((a, b) => {
        const aId = a.id.toString();
        const bId = b.id.toString();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        // 规则1: 完全匹配题号
        if (aId === query && bId !== query) return -1;
        if (bId === query && aId !== query) return 1;

        // 规则2: 题号开头匹配
        const aStarts = aId.startsWith(query);
        const bStarts = bId.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // 规则3: 标题包含（这里可以进一步优化，但目前保持简单）
        // (如果需要更复杂的标题匹配度，可以在这里添加)

        return 0; // 保持原有顺序
    });

    const resultsToShow = uniqueProblems.slice(0, 10);

    if (resultsToShow.length > 0) {
        resultsContainer.innerHTML = resultsToShow.map(p => {
            const locations = findProblemLocations(p.id);
            let locationInfo = '';
            if (locations.length === 1) {
                const loc = locations[0];
                const roundName = problemsData[loc.roundKey].name.split(' ')[0];
                locationInfo = `<span class="search-category" title="${roundName} - ${loc.category}">${roundName} - ${loc.category}</span>`;
            } else if (locations.length > 1) {
                locationInfo = `<span class="search-category multiple" title="该题目存在于多个分类中">多个分类</span>`;
            }

            return `
                <div class="search-result-item" onmousedown="selectProblem(${p.id})" title="${p.id}. ${p.title}">
                    <span class="search-id">${p.id}</span>
                    <span class="search-title">${p.title}</span>
                    ${locationInfo}
                </div>
            `;
        }).join('');
        resultsContainer.classList.add('active');
    } else {
        resultsContainer.innerHTML = '<div class="search-no-results">无匹配结果</div>';
        resultsContainer.classList.add('active');
    }
}

// 选择一个搜索结果
function selectProblem(problemId) {
    const locations = findProblemLocations(problemId);

    if (locations.length === 0) {
        alert('未找到该题目所属的分类。');
        return;
    }

    if (locations.length === 1) {
        const loc = locations[0];
        navigateToProblem(loc.round, loc.category, problemId);
    } else {
        // 如果题目存在于多个分类，让用户选择
        openCategoryChoiceModal(locations, problemId);
    }
    document.getElementById('searchInput').value = '';
    hideSearchResults();
}

// 查找题目所在的所有位置（轮次和分类）
function findProblemLocations(problemId) {
    const locations = [];
    ['round1', 'round2', 'round3', 'round4'].forEach((roundKey, roundIndex) => {
        const roundData = problemsData[roundKey];
        roundData.categories.forEach(category => {
            if (category.problems.includes(problemId) || category.problems.includes(problemId.toString())) {
                locations.push({
                    round: roundIndex + 1,
                    category: category.name,
                    roundKey: roundKey
                });
            }
        });
    });
    return locations;
}

// 跳转到指定的题目
async function navigateToProblem(round, categoryName, problemId) {
    // 1. 切换到正确的轮次
    if (currentRound !== round) {
        selectRound(round);
    }

    // 2. 找到并激活对应的分类卡片
    const categoryCards = document.querySelectorAll('.category-card');
    let targetCard = null;
    categoryCards.forEach(card => {
        const cardCategoryName = card.querySelector('.category-name').textContent;
        if (cardCategoryName === categoryName) {
            targetCard = card;
        }
    });

    if (targetCard) {
        if (!targetCard.classList.contains('active')) {
            targetCard.click();
        }

        // 等待题目列表渲染完成
        setTimeout(() => {
            // 3. 滚动到并高亮显示题目
            const problemItems = document.querySelectorAll('.problem-item');
            problemItems.forEach(item => {
                const numberDiv = item.querySelector('.problem-number');
                if (numberDiv && numberDiv.textContent == problemId) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // 添加高亮效果
                    item.classList.add('highlight');
                    setTimeout(() => {
                        item.classList.remove('highlight');
                    }, 2000); // 2秒后移除高亮
                }
            });
        }, 100); // 延迟以确保DOM更新
    }
}

// 打开分类选择弹窗
function openCategoryChoiceModal(locations, problemId) {
    const modal = document.getElementById('categoryChoiceModal');
    const content = document.getElementById('categoryChoiceContent');

    content.innerHTML = `
        <p>题目 <strong>${problemId}</strong> 存在于多个分类中，请选择要跳转的位置：</p>
        <div class="category-choices">
            ${locations.map(loc => `
                <button class="choice-btn" onclick="handleCategoryChoice(${loc.round}, '${loc.category}', ${problemId})">
                    <span class="choice-round round${loc.round}">${problemsData[loc.roundKey].name.split(' ')[0]}</span>
                    <span class="choice-category">${loc.category}</span>
                </button>
            `).join('')}
        </div>
    `;

    modal.classList.add('active');
}

// 处理分类选择
function handleCategoryChoice(round, categoryName, problemId) {
    navigateToProblem(round, categoryName, problemId);
    closeCategoryChoiceModal();
}

// 关闭分类选择弹窗
function closeCategoryChoiceModal() {
    document.getElementById('categoryChoiceModal').classList.remove('active');
}

// 显示/隐藏搜索结果
function showSearchResults() {
    const input = document.getElementById('searchInput');
    if (input.value) {
        document.getElementById('searchResults').classList.add('active');
    }
}

function hideSearchResults() {
    // 延迟隐藏，以便点击事件可以触发
    setTimeout(() => {
        document.getElementById('searchResults').classList.remove('active');
    }, 200);
}
