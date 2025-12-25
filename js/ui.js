// js/ui.js

/**
 * 选择并显示指定轮次的内容。
 * @param {number} round - 要选择的轮次编号 (1-4)。
 */
function selectRound(round) {
    currentRound = round;
    selectedCategory = null;

    // 更新轮次选择按钮的激活状态
    const buttons = document.querySelectorAll('.round-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', index + 1 === round);
    });

    renderCategories();
    updateStats();
}

/**
 * 渲染当前轮次下的所有分类卡片。
 */
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    container.innerHTML = '';

    if (!roundData || !roundData.categories || roundData.categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无题目数据</p>';
        document.getElementById('problemsContainer').innerHTML = ''; // 清空题目列表
        return;
    }

    // 默认选择第一个分类
    selectedCategory = roundData.categories[0];

    roundData.categories.forEach((category, index) => {
        const solved = category.problems.filter(p => userProgress[roundKey] && userProgress[roundKey][p]).length;
        const total = category.problems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'category-card';
        if (index === 0) {
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

    // 渲染第一个分类的题目
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
    renderCategories();
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
