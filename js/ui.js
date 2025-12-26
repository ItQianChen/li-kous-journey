// js/ui.js

/**
 * 选择并显示指定轮次的内容。
 * @param {number} round - 要选择的轮次编号 (1-4)。
 * @param {string} categoryName - 可选，要选择的分类名称。
 */
function selectRound(round, categoryName = null) {
    currentRound = round;
    selectedCategory = null;

    // 更新轮次选择按钮的激活状态
    const buttons = document.querySelectorAll('.round-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', index + 1 === round);
    });

    renderCategories(categoryName);
    updateStats();
    updateGlobalStats();
}

/**
 * 渲染当前轮次下的所有分类卡片。
 * @param {string} targetCategoryName - 可选，要选择的分类名称。
 */
function renderCategories(targetCategoryName = null) {
    const container = document.getElementById('categoriesContainer');
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    container.innerHTML = '';

    if (!roundData || !roundData.categories || roundData.categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无题目数据</p>';
        document.getElementById('problemsContainer').innerHTML = ''; // 清空题目列表
        return;
    }

    // 查找目标分类或默认选择第一个分类
    let targetIndex = 0;
    if (targetCategoryName) {
        const foundIndex = roundData.categories.findIndex(c => c.name === targetCategoryName);
        if (foundIndex !== -1) {
            targetIndex = foundIndex;
        }
    }
    selectedCategory = roundData.categories[targetIndex];

    roundData.categories.forEach((category, index) => {
        const solved = category.problems.filter(p => userProgress[roundKey] && userProgress[roundKey][p]).length;
        const total = category.problems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'category-card';
        if (index === targetIndex) {
            card.classList.add('active');
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

    // 渲染选中分类的题目
    if (selectedCategory) {
        renderProblems();
    }
}

/**
 * 渲染当前选中分类下的所有题目。
 */
function renderProblems() {
    if (!selectedCategory) {
        document.getElementById('problemsContainer').innerHTML = '';
        return;
    }

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
        const problemInfo = allProblems.find(p => p.id.toString() === problemNum.toString());
        if (!problemInfo) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'problem-wrapper';

        const item = document.createElement('div');
        item.className = 'problem-item';

        const isSolved = userProgress[roundKey] && userProgress[roundKey][problemNum];
        let solvedDateStr = '';
        if (isSolved) {
            item.classList.add('solved');
            const solvedInfo = userProgress[roundKey][problemNum];
            if (solvedInfo.solvedAt) {
                const solvedDate = new Date(solvedInfo.solvedAt);
                solvedDateStr = `${solvedDate.getFullYear()}-${String(solvedDate.getMonth() + 1).padStart(2, '0')}-${String(solvedDate.getDate()).padStart(2, '0')} ${String(solvedDate.getHours()).padStart(2, '0')}:${String(solvedDate.getMinutes()).padStart(2, '0')}`;
            }
        }

        item.innerHTML = `
            <div class="problem-content">
                <div class="problem-number">${problemNum}</div>
                <div class="problem-title">${problemInfo.title}</div>
            </div>
        `;

        if (isSolved) {
            const solvedInfo = userProgress[roundKey][problemNum];
            if (solvedInfo.solvedAt) {
                const solvedDate = new Date(solvedInfo.solvedAt);
                const dateStr = `${solvedDate.getMonth() + 1}/${solvedDate.getDate()}`;
                const dateBadge = document.createElement('div');
                dateBadge.className = 'solved-date-badge';
                dateBadge.textContent = dateStr;
                item.appendChild(dateBadge);
            }
        }

        if (problemInfo.url) {
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

        item.title = isSolved && solvedDateStr
            ? `题目 ${problemNum}: ${problemInfo.title}\n打卡时间: ${solvedDateStr}\n点击取消打卡`
            : `题目 ${problemNum}: ${problemInfo.title}\n点击打卡`;

        item.onclick = (e) => {
            e.stopPropagation();
            toggleProblem(roundKey, problemNum, item);
        };

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制题号';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            copyProblemNumber(problemNum, copyBtn); // 依赖 utils.js
        };

        wrapper.appendChild(item);
        wrapper.appendChild(copyBtn);
        grid.appendChild(wrapper);
    });
}

/**
 * 切换题目的完成状态（打卡/取消打卡）。
 * @param {string} roundKey - 当前轮次的键名 (e.g., 'round1')。
 * @param {number|string} problemNum - 题目编号。
 * @param {HTMLElement} element - 被点击的题目元素。
 */
function toggleProblem(roundKey, problemNum, element) {
    if (!userProgress[roundKey]) {
        userProgress[roundKey] = {};
    }

    const isSolved = userProgress[roundKey][problemNum];

    if (isSolved) {
        delete userProgress[roundKey][problemNum];
        element.classList.remove('solved');
    } else {
        userProgress[roundKey][problemNum] = {
            solvedAt: new Date().toISOString(),
            round: roundKey
        };
        element.classList.add('solved');

        // 添加打卡动画
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    saveUserProgress(); // 依赖 data.js
    updateStats();
    updateGlobalStats(); // 更新全局统计（连续打卡、今日答题、当前进度）
    // 修复：传递当前选中的分类名称，避免打卡后跳转到第一个分类
    renderCategories(selectedCategory ? selectedCategory.name : null);
    renderCalendar(); // 依赖 calendar.js
}

/**
 * 更新统计面板的数据，包括已完成、总数和完成率。
 */
function updateStats() {
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    if (!roundData) return;

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

    const completionRate = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

    document.getElementById('totalSolved').textContent = solvedProblems;
    document.getElementById('totalProblems').textContent = totalProblems;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('currentRound').textContent = roundData.name.split(' ')[0];
}

/**
 * 更新全局统计面板（连续打卡、今日答题、当前进度、总进度）
 */
function updateGlobalStats() {
    // 计算连续打卡天数
    const streak = calculateGlobalStreak();
    document.getElementById('globalStreak').textContent = streak + '天';

    // 计算今日答题数
    const todayCount = getTodayProblemCount();
    document.getElementById('todayCount').textContent = todayCount + '题';

    // 显示当前进度
    const progress = getCurrentProgressText();
    document.getElementById('currentProgress').textContent = progress;

    // 显示总进度（已刷题目数/总数及百分比）
    const overallStats = getOverallStats();
    const totalProgressEl = document.getElementById('globalTotalProgress');
    const totalPercentEl = document.getElementById('globalTotalPercent');
    if (totalProgressEl) {
        totalProgressEl.textContent = `${overallStats.totalSolved}/${overallStats.totalProblems}`;
    }
    if (totalPercentEl) {
        const percent = overallStats.totalProblems > 0
            ? Math.round((overallStats.totalSolved / overallStats.totalProblems) * 100)
            : 0;
        totalPercentEl.textContent = percent + '%';
    }
}

/**
 * 计算全局连续打卡天数（从今天往前算）
 */
function calculateGlobalStreak() {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) { // 最多检查一年
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        const dayCount = getDayProblemCount(dateStr);

        if (dayCount > 0) {
            streak++;
        } else if (i > 0) { // 如果不是今天且没有打卡，则中断
            break;
        }
        // 如果今天还没打卡，继续检查昨天
    }

    return streak;
}

/**
 * 获取指定日期的打卡题目数
 */
function getDayProblemCount(dateStr) {
    let count = 0;
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.values(userProgress[roundKey]).forEach(progress => {
                if (progress.solvedAt && new Date(progress.solvedAt).toISOString().split('T')[0] === dateStr) {
                    count++;
                }
            });
        }
    });
    return count;
}

/**
 * 获取今日答题数量
 */
function getTodayProblemCount() {
    const today = new Date().toISOString().split('T')[0];
    return getDayProblemCount(today);
}

/**
 * 获取当前进度文本（根据实际打卡情况计算）
 * 找到第一个未完成的分类作为当前进度
 */
function getCurrentProgressText() {
    const roundNames = ['一', '二', '三', '四'];

    // 遍历所有轮次，找到第一个未完成的分类
    for (let round = 1; round <= 4; round++) {
        const roundKey = `round${round}`;
        const roundData = problemsData[roundKey];

        if (!roundData || !roundData.categories) continue;

        for (const category of roundData.categories) {
            const solved = category.problems.filter(p =>
                userProgress[roundKey] && userProgress[roundKey][p]
            ).length;
            const total = category.problems.length;

            // 如果这个分类未完成，就是当前进度
            if (solved < total) {
                return `第${roundNames[round - 1]}轮·${category.name}`;
            }
        }
    }

    // 如果全部完成
    return '🎉 全部完成';
}

/**
 * 获取当前进度（轮次和分类）
 * @returns {{round: number, category: string}|null} 返回当前进度的轮次和分类，如果全部完成则返回null
 */
function getCurrentProgress() {
    // 遍历所有轮次，找到第一个未完成的分类
    for (let round = 1; round <= 4; round++) {
        const roundKey = `round${round}`;
        const roundData = problemsData[roundKey];

        if (!roundData || !roundData.categories) continue;

        for (const category of roundData.categories) {
            const solved = category.problems.filter(p =>
                userProgress[roundKey] && userProgress[roundKey][p]
            ).length;
            const total = category.problems.length;

            // 如果这个分类未完成，就是当前进度
            if (solved < total) {
                return { round: round, category: category.name };
            }
        }
    }

    // 如果全部完成，返回null
    return null;
}

/**
 * 跳转到当前进度位置
 */
function jumpToCurrentProgress() {
    const progress = getCurrentProgress();
    if (progress) {
        selectRound(progress.round, progress.category);
    } else {
        // 全部完成，默认显示第一轮
        selectRound(1);
    }
}

/**
 * 获取所有轮次的总进度统计。
 * @returns {{totalSolved: number, totalProblems: number}} - 包含总完成数和总题目数的对象。
 */
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
