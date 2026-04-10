// js/calendar-detail.js

/**
 * 显示指定日期的打卡详情弹窗。
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)。
 * @param {object} activity - 当天的活动数据。
 */
// 当前显示的日期详情
let currentDateDetailStr = null;
let currentDateDetailActivity = null;

function showDateDetail(dateStr, activity) {
    if (!activity || activity.count === 0) return;

    currentDateDetailStr = dateStr;
    currentDateDetailActivity = activity;

    const modal = document.getElementById('dateDetailModal');
    const title = document.getElementById('dateDetailTitle');
    const content = document.getElementById('dateDetailContent');

    const date = new Date(dateStr);
    title.textContent = `📝 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 - 共完成 ${activity.count} 题`;

    content.innerHTML = generateDetailContentHTML(activity.problems);
    modal.classList.add('active');
}

/**
 * 从日期详情弹窗分享当日打卡
 */
function shareDateCardFromModal() {
    if (currentDateDetailStr && currentDateDetailActivity) {
        shareDateCard(currentDateDetailStr, currentDateDetailActivity);
    }
}

/**
 * 关闭日期详情弹窗。
 */
function closeDateDetail() {
    document.getElementById('dateDetailModal').classList.remove('active');
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
    const problemsByRound = getOrderedRoundKeys().reduce((result, roundKey) => {
        result[roundKey] = [];
        return result;
    }, {});
    problems.forEach(p => {
        if (!problemsByRound[p.round]) {
            problemsByRound[p.round] = [];
        }
        problemsByRound[p.round].push(p);
    });

    let html = `
        <div class="detail-search-container">
            <input type="text" class="detail-search-input" placeholder="🔍 搜索题目..." oninput="filterDetailProblems(this)">
            <div class="detail-actions">
                <button class="detail-action-btn" onclick="expandAllSections()" title="全部展开">📖 展开全部</button>
                <button class="detail-action-btn" onclick="collapseAllSections()" title="全部折叠">📁 折叠全部</button>
            </div>
        </div>
    `;

    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮', round5: '数据库轮次', round6: 'Hot100', round7: '面试经典150' };

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
                    const reviewStageText = problem.eventType === 'review' && problem.reviewStage
                        ? `<span class="problem-dates">第${problem.reviewStage}轮复习</span>`
                        : '';

                    html += `
                        <div class="problem-detail-item">
                            <span class="problem-number">${problem.id}</span>
                            <span class="problem-title-detail">${problemInfo.title}</span>
                            <span class="problem-difficulty ${difficultyClass}">${problem.difficulty}</span>
                            ${reviewStageText}
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
        content.style.display = '';
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
