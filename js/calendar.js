// js/calendar.js

// 日历状态变量
let calendarDate = new Date();
let calendarCurrentMonth = calendarDate.getMonth();
let calendarCurrentYear = calendarDate.getFullYear();

/**
 * 打开日历弹窗并渲染。
 */
function toggleCalendar() {
    document.getElementById('calendarModal').classList.add('active');
    renderCalendar();
}

/**
 * 关闭日历弹窗。
 */
function closeCalendar() {
    document.getElementById('calendarModal').classList.remove('active');
}

/**
 * 渲染日历网格，包括日期、打卡活动和导航。
 */
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('currentMonth');

    const { totalCount } = getMonthlyActivity();
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    monthDisplay.textContent = `${calendarCurrentYear}年 ${monthNames[calendarCurrentMonth]} (本月完成 ${totalCount} 题)`;

    grid.innerHTML = '';

    const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1).getDay();
    const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();

    // 填充上个月的空白天数
    for (let i = 0; i < firstDay; i++) {
        grid.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>');
    }

    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activity = getDailyActivity(dateStr);

        const today = new Date();
        if (day === today.getDate() && calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        if (activity && activity.count > 0) {
            if (activity.count >= 6) dayElement.classList.add('high-activity');
            else if (activity.count >= 3) dayElement.classList.add('medium-activity');
            else dayElement.classList.add('low-activity');
        }

        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            ${activity && activity.count > 0 ? `<div class="calendar-day-count">${activity.count}题</div>` : ''}
        `;
        dayElement.onclick = () => showDateDetail(dateStr, activity);
        grid.appendChild(dayElement);
    }

    // 填充下个月的空白天数
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        grid.insertAdjacentHTML('beforeend', '<div class="calendar-day other-month"></div>');
    }
}

/**
 * 获取指定日期的打卡活动（完成的题目列表和数量）。
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)。
 * @returns {{count: number, problems: Array}} - 包含题目数量和题目详情数组的对象。
 */
function getDailyActivity(dateStr) {
    let totalSolved = 0;
    const problems = [];

    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.entries(userProgress[roundKey]).forEach(([problemId, progress]) => {
                if (progress.solvedAt && new Date(progress.solvedAt).toISOString().split('T')[0] === dateStr) {
                    totalSolved++;
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
            });
        }
    });

    return { count: totalSolved, problems: problems };
}

/**
 * 显示指定日期的打卡详情弹窗。
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)。
 * @param {object} activity - 当天的活动数据。
 */
function showDateDetail(dateStr, activity) {
    if (!activity || activity.count === 0) return;

    const modal = document.getElementById('dateDetailModal');
    const title = document.getElementById('dateDetailTitle');
    const content = document.getElementById('dateDetailContent');

    const date = new Date(dateStr);
    title.textContent = `📝 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 - 共完成 ${activity.count} 题`;

    content.innerHTML = generateDetailContentHTML(activity.problems);
    modal.classList.add('active');
}

/**
 * 关闭日期详情弹窗。
 */
function closeDateDetail() {
    document.getElementById('dateDetailModal').classList.remove('active');
}

/**
 * 切换到上一个月并重新渲染日历。
 */
function previousMonth() {
    calendarCurrentMonth--;
    if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    }
    renderCalendar();
}

/**
 * 切换到下一个月并重新渲染日历。
 */
function nextMonth() {
    calendarCurrentMonth++;
    if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    }
    renderCalendar();
}

/**
 * 获取当前月份的所有打卡活动（题目去重）。
 * @returns {{problemsByRound: object, totalCount: number}} - 包含按轮次分组的题目和总题目数的对象。
 */
function getMonthlyActivity() {
    const problemsMap = new Map();

    const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activity = getDailyActivity(dateStr);
        activity.problems.forEach(problem => {
            if (!problemsMap.has(problem.id)) {
                problemsMap.set(problem.id, { ...problem, dates: [dateStr] });
            } else {
                problemsMap.get(problem.id).dates.push(dateStr);
            }
        });
    }

    const problemsByRound = { round1: [], round2: [], round3: [], round4: [] };
    problemsMap.forEach(problem => {
        problemsByRound[problem.round].push(problem);
    });

    return { problemsByRound, totalCount: problemsMap.size };
}

/**
 * 显示月度打卡详情弹窗。
 */
function showMonthDetail() {
    const modal = document.getElementById('monthDetailModal');
    const title = document.getElementById('monthDetailTitle');
    const content = document.getElementById('monthDetailContent');

    const { problemsByRound, totalCount } = getMonthlyActivity();
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    title.textContent = `📊 ${calendarCurrentYear}年${monthNames[calendarCurrentMonth]} - 共完成 ${totalCount} 题（去重）`;

    if (totalCount === 0) {
        content.innerHTML = '<div class="no-data">本月暂无打卡记录</div>';
    } else {
        const allProblemsInMonth = Object.values(problemsByRound).flat();
        content.innerHTML = generateDetailContentHTML(allProblemsInMonth, true);
    }

    modal.classList.add('active');
}

/**
 * 关闭月度详情弹窗。
 */
function closeMonthDetail() {
    document.getElementById('monthDetailModal').classList.remove('active');
}

/**
 * 为详情弹窗（日/月）生成题目列表的HTML内容。
 * @param {Array} problems - 要显示的题目数组。
 * @param {boolean} showDates - 是否显示打卡日期。
 * @returns {string} - 生成的HTML字符串。
 */
function generateDetailContentHTML(problems, showDates = false) {
    const problemsByRound = { round1: [], round2: [], round3: [], round4: [] };
    problems.forEach(p => problemsByRound[p.round].push(p));

    let html = `
        <div class="detail-search-container">
            <input type="text" class="detail-search-input" placeholder="🔍 搜索题目..." oninput="filterDetailProblems(this)">
            <div class="detail-actions">
                <button class="detail-action-btn" onclick="expandAllSections()" title="全部展开">📖 展开全部</button>
                <button class="detail-action-btn" onclick="collapseAllSections()" title="全部折叠">📁 折叠全部</button>
            </div>
        </div>
    `;

    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮' };

    Object.keys(problemsByRound).forEach(roundKey => {
        const roundProblems = problemsByRound[roundKey];
        if (roundProblems.length > 0) {
            const problemsByCategory = {};
            roundProblems.forEach(p => {
                if (!problemsByCategory[p.category]) problemsByCategory[p.category] = [];
                problemsByCategory[p.category].push(p);
            });

            html += `
                <div class="round-section">
                    <h3 class="round-title ${roundKey}" onclick="toggleSection(this)">
                        <span>${roundNames[roundKey]} (${roundProblems.length}题)</span><span class="toggle-icon">▼</span>
                    </h3>
                    <div class="round-content">
            `;

            Object.keys(problemsByCategory).forEach(category => {
                const categoryProblems = problemsByCategory[category].sort((a, b) => parseInt(a.id) - parseInt(b.id));
                html += `
                    <div class="category-section">
                        <h4 class="category-title" onclick="toggleSection(this)">
                            <span>${category} (${categoryProblems.length}题)</span><span class="toggle-icon">▼</span>
                        </h4>
                        <div class="problems-list">
                `;
                categoryProblems.forEach(problem => {
                    const problemInfo = allProblems.find(p => p.id.toString() === problem.id.toString());
                    const difficultyClass = problem.difficulty === '简单' ? 'easy' : problem.difficulty === '中等' ? 'medium' : 'hard';
                    const datesText = showDates ? `<span class="problem-dates">${problem.dates.map(d => `${parseInt(d.split('-')[2])}日`).join(', ')}</span>` : '';

                    html += `
                        <div class="problem-detail-item">
                            <span class="problem-number">${problem.id}</span>
                            <span class="problem-title-detail">${problemInfo.title}</span>
                            <span class="problem-difficulty ${difficultyClass}">${problem.difficulty}</span>
                            ${datesText}
                            ${problemInfo.url ? `<button class="link-problem-btn" onclick="window.open('${problemInfo.url}', '_blank')" title="跳转到题目页面">🔗</button>` : ''}
                            <button class="copy-problem-btn" onclick="copyProblemId('${problem.id}', event)" title="复制题号">📋</button>
                        </div>
                    `;
                });
                html += `</div></div>`;
            });
            html += `</div></div>`;
        }
    });

    return html;
}

/**
 * 在详情弹窗中根据输入过滤题目列表。
 * @param {HTMLInputElement} inputElement - 搜索输入框元素。
 */
function filterDetailProblems(inputElement) {
    const query = inputElement.value.toLowerCase();
    const modalBody = inputElement.closest('.modal-body');

    modalBody.querySelectorAll('.problem-detail-item').forEach(item => {
        const title = item.querySelector('.problem-title-detail').textContent.toLowerCase();
        const id = item.querySelector('.problem-number').textContent;
        item.style.display = (title.includes(query) || id.includes(query)) ? 'flex' : 'none';
    });

    modalBody.querySelectorAll('.category-section').forEach(categorySection => {
        const hasVisibleItem = !!categorySection.querySelector('.problem-detail-item[style*="display: flex"]');
        categorySection.style.display = hasVisibleItem ? 'block' : 'none';
    });

    modalBody.querySelectorAll('.round-section').forEach(roundSection => {
        const hasVisibleItem = !!roundSection.querySelector('.category-section[style*="display: block"]');
        roundSection.style.display = hasVisibleItem ? 'block' : 'none';
    });
}

/**
 * 一键展开所有轮次和分类。
 */
function expandAllSections() {
    document.querySelectorAll('.round-content').forEach(content => {
        content.style.display = 'block';
    });
    document.querySelectorAll('.problems-list').forEach(content => {
        content.style.display = '';  // 清除内联样式，恢复 CSS 的 display: grid
    });
    document.querySelectorAll('.round-title .toggle-icon, .category-title .toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
}

/**
 * 一键折叠所有轮次和分类。
 */
function collapseAllSections() {
    document.querySelectorAll('.round-content, .problems-list').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.round-title .toggle-icon, .category-title .toggle-icon').forEach(icon => {
        icon.textContent = '▶';
    });
}
