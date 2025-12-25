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

// ===================== 分享卡片功能 =====================

/**
 * 当前分享的日期字符串（用于日期分享）
 */
let currentShareDate = null;

/**
 * 获取月度统计信息（只计算已过去的天数）
 * @returns {object} 包含最高打卡日、平均每天、连续打卡天数等统计
 */
function getMonthlyStats() {
    const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear();

    // 如果是当月，只统计到今天；否则统计整月
    const lastDayToCount = isCurrentMonth ? today.getDate() : daysInMonth;

    const dailyCounts = [];
    let maxDay = 0;
    let maxCount = 0;
    let totalDays = 0;
    let totalProblems = 0;

    // 收集每天的打卡数据（只到 lastDayToCount）
    for (let day = 1; day <= lastDayToCount; day++) {
        const dateStr = `${calendarCurrentYear}-${String(calendarCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activity = getDailyActivity(dateStr);
        dailyCounts.push({ day, count: activity.count, dateStr });

        if (activity.count > 0) {
            totalDays++;
            totalProblems += activity.count;
        }

        if (activity.count > maxCount) {
            maxCount = activity.count;
            maxDay = day;
        }
    }

    // 计算该月最长连续打卡天数（只到 lastDayToCount）
    let maxStreak = 0;
    let currentStreak = 0;

    for (let day = 1; day <= lastDayToCount; day++) {
        const activity = dailyCounts[day - 1];
        if (activity.count > 0) {
            currentStreak++;
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        } else {
            currentStreak = 0;
        }
    }

    // 计算平均每天（已过去天数中有打卡的天数）
    const avgPerDay = totalDays > 0 ? (totalProblems / totalDays).toFixed(1) : 0;

    return {
        maxDay,
        maxCount,
        avgPerDay,
        currentStreak: maxStreak,  // 返回最长连续天数
        totalDays,
        totalProblems,
        daysElapsed: lastDayToCount  // 已过去的天数
    };
}

/**
 * 生成本月分享卡片
 */
function shareMonthCard() {
    const { problemsByRound, totalCount } = getMonthlyActivity();
    const monthStats = getMonthlyStats();
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    const data = {
        type: 'month',
        title: `${calendarCurrentYear}年${monthNames[calendarCurrentMonth]}`,
        subtitle: '刷题打卡记录',
        totalCount: totalCount,
        problemsByRound: problemsByRound,
        username: currentUser || '匿名用户',
        date: new Date().toLocaleDateString('zh-CN'),
        monthStats: monthStats
    };

    generateShareCard(data);
}

/**
 * 生成日期分享卡片
 * @param {string} dateStr - 日期字符串
 * @param {object} activity - 活动数据
 */
function shareDateCard(dateStr, activity) {
    if (!activity || activity.count === 0) {
        alert('当天没有打卡记录');
        return;
    }

    const date = new Date(dateStr);
    const problemsByRound = { round1: [], round2: [], round3: [], round4: [] };
    activity.problems.forEach(p => problemsByRound[p.round].push(p));

    const data = {
        type: 'day',
        title: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
        subtitle: '刷题打卡记录',
        totalCount: activity.count,
        problemsByRound: problemsByRound,
        username: currentUser || '匿名用户',
        date: new Date().toLocaleDateString('zh-CN')
    };

    currentShareDate = dateStr;
    generateShareCard(data);
}

/**
 * 使用Canvas生成分享卡片（高清4K版本）
 * @param {object} data - 卡片数据
 */
function generateShareCard(data) {
    const modal = document.getElementById('shareCardModal');
    const canvas = document.getElementById('shareCanvas');
    const ctx = canvas.getContext('2d');

    // 高清缩放比例（3倍以支持高清显示）
    const scale = 3;

    // 逻辑尺寸 - 月度卡片需要更高
    const width = 400;
    const height = data.type === 'month' ? 680 : 560;

    // 设置物理像素尺寸（高清）
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 设置显示尺寸
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // 缩放上下文以适应高清渲染
    ctx.scale(scale, scale);

    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制白色卡片区域
    ctx.fillStyle = 'white';
    roundRect(ctx, 20, 20, width - 40, height - 40, 20);
    ctx.fill();

    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 力扣征途', width / 2, 70);

    // 绘制日期标题
    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.fillText(data.title, width / 2, 110);

    // 绘制副标题
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(data.subtitle, width / 2, 135);

    // 绘制完成题目数
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(data.totalCount, width / 2, 200);

    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('道题目', width / 2, 225);

    // 绘制分割线
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 245);
    ctx.lineTo(width - 40, 245);
    ctx.stroke();

    let yPos = 280;

    // 如果是月度卡片，绘制统计信息
    if (data.type === 'month' && data.monthStats) {
        const stats = data.monthStats;

        // 绘制统计标题
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.textAlign = 'center';
        ctx.fillText('📈 本月数据', width / 2, yPos);
        yPos += 30;

        // 绘制统计项
        ctx.textAlign = 'left';
        ctx.font = '13px "Microsoft YaHei", sans-serif';

        // 最高打卡日
        ctx.fillStyle = '#333';
        ctx.fillText('🏆 最高打卡', 50, yPos);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FF9800';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.fillText(`${stats.maxDay}日 · ${stats.maxCount}题`, width - 50, yPos);
        yPos += 28;

        // 平均每天
        ctx.textAlign = 'left';
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText('📊 日均完成', 50, yPos);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2196F3';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.fillText(`${stats.avgPerDay} 题`, width - 50, yPos);
        yPos += 28;

        // 连续打卡
        ctx.textAlign = 'left';
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText('🔥 连续打卡', 50, yPos);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.fillText(`${stats.currentStreak} 天`, width - 50, yPos);
        yPos += 35;

        // 再绘制一条分割线
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, yPos - 10);
        ctx.lineTo(width - 40, yPos - 10);
        ctx.stroke();
        yPos += 15;
    }

    // 绘制各轮次统计
    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮' };
    const roundColors = { round1: '#4CAF50', round2: '#2196F3', round3: '#FF9800', round4: '#f44336' };

    ctx.textAlign = 'left';

    Object.keys(data.problemsByRound).forEach(roundKey => {
        const count = data.problemsByRound[roundKey].length;
        if (count > 0) {
            // 绘制圆点
            ctx.fillStyle = roundColors[roundKey];
            ctx.beginPath();
            ctx.arc(50, yPos - 5, 6, 0, Math.PI * 2);
            ctx.fill();

            // 绘制轮次名称
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#333';
            ctx.fillText(roundNames[roundKey], 65, yPos);

            // 绘制题目数
            ctx.textAlign = 'right';
            ctx.fillStyle = roundColors[roundKey];
            ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
            ctx.fillText(`${count} 题`, width - 50, yPos);
            ctx.textAlign = 'left';

            yPos += 35;
        }
    });

    // 绘制底部信息
    ctx.fillStyle = '#f8f9fa';
    roundRect(ctx, 20, height - 100, width - 40, 60, {tl: 0, tr: 0, bl: 20, br: 20});
    ctx.fill();

    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(`👤 ${data.username}`, width / 2, height - 70);
    ctx.fillText(`📅 生成于 ${data.date}`, width / 2, height - 50);

    // 显示弹窗
    modal.classList.add('active');
}

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
}

/**
 * 下载分享卡片
 */
function downloadShareCard() {
    const canvas = document.getElementById('shareCanvas');
    const link = document.createElement('a');
    link.download = `力扣征途打卡-${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * 关闭分享卡片弹窗
 */
function closeShareCard() {
    document.getElementById('shareCardModal').classList.remove('active');
    currentShareDate = null;
}

// ===================== 全局分享卡片功能 =====================

/**
 * 获取全局统计数据（用于全局分享卡片）
 * @returns {object} 包含总打卡天数、最长连续、最长打卡日期、已完成轮次等信息
 */
function getOverallStatsForShare() {
    const allDates = new Set();
    let totalSolved = 0;
    let maxDayCount = 0;
    let maxDayDate = null;

    // 统计每轮的完成情况
    const roundStats = { round1: { solved: 0, total: 0 }, round2: { solved: 0, total: 0 }, round3: { solved: 0, total: 0 }, round4: { solved: 0, total: 0 } };

    // 遍历所有轮次和进度
    Object.keys(problemsData).forEach(roundKey => {
        const roundData = problemsData[roundKey];
        if (!roundData || !roundData.categories) return;

        roundData.categories.forEach(category => {
            roundStats[roundKey].total += category.problems.length;
            category.problems.forEach(problemNum => {
                if (userProgress[roundKey] && userProgress[roundKey][problemNum]) {
                    roundStats[roundKey].solved++;
                    totalSolved++;

                    const progress = userProgress[roundKey][problemNum];
                    if (progress.solvedAt) {
                        const dateStr = new Date(progress.solvedAt).toISOString().split('T')[0];
                        allDates.add(dateStr);
                    }
                }
            });
        });
    });

    // 找出打卡最多的日期
    const dateCounts = {};
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.values(userProgress[roundKey]).forEach(progress => {
                if (progress.solvedAt) {
                    const dateStr = new Date(progress.solvedAt).toISOString().split('T')[0];
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                }
            });
        }
    });

    Object.entries(dateCounts).forEach(([date, count]) => {
        if (count > maxDayCount) {
            maxDayCount = count;
            maxDayDate = date;
        }
    });

    // 计算最长连续打卡天数
    const sortedDates = Array.from(allDates).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate = null;

    sortedDates.forEach(dateStr => {
        const currentDate = new Date(dateStr);
        if (prevDate) {
            const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
        } else {
            currentStreak = 1;
        }
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }
        prevDate = currentDate;
    });

    // 判断已完成和正在练习的轮次
    const completedRounds = [];
    let currentRound = null;

    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮' };

    Object.keys(roundStats).forEach(roundKey => {
        const stats = roundStats[roundKey];
        if (stats.total > 0) {
            if (stats.solved === stats.total) {
                completedRounds.push(roundNames[roundKey]);
            } else if (stats.solved > 0 && !currentRound) {
                currentRound = roundNames[roundKey];
            }
        }
    });

    // 如果没有正在练习的轮次，找第一个未完成的
    if (!currentRound) {
        for (const roundKey of ['round1', 'round2', 'round3', 'round4']) {
            const stats = roundStats[roundKey];
            if (stats.total > 0 && stats.solved < stats.total) {
                currentRound = roundNames[roundKey];
                break;
            }
        }
    }

    // 获取总题目数
    const overallStats = getOverallStats();

    return {
        totalDays: allDates.size,
        maxStreak: maxStreak,
        maxDayDate: maxDayDate,
        maxDayCount: maxDayCount,
        totalSolved: overallStats.totalSolved,
        totalProblems: overallStats.totalProblems,
        completedRounds: completedRounds,
        currentRound: currentRound,
        roundStats: roundStats
    };
}

/**
 * 生成全局分享卡片
 */
function shareOverallCard() {
    const stats = getOverallStatsForShare();

    const data = {
        type: 'overall',
        title: '力扣征途',
        subtitle: '全部打卡记录',
        username: currentUser || '匿名用户',
        date: new Date().toLocaleDateString('zh-CN'),
        stats: stats
    };

    generateOverallShareCard(data);
}

/**
 * 使用Canvas生成全局分享卡片
 * @param {object} data - 卡片数据
 */
function generateOverallShareCard(data) {
    const modal = document.getElementById('shareCardModal');
    const canvas = document.getElementById('shareCanvas');
    const ctx = canvas.getContext('2d');

    // 高清缩放比例
    const scale = 3;

    // 逻辑尺寸
    const width = 400;
    const height = 720;

    // 设置物理像素尺寸
    canvas.width = width * scale;
    canvas.height = height * scale;

    // 设置显示尺寸
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // 缩放上下文
    ctx.scale(scale, scale);

    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制白色卡片区域
    ctx.fillStyle = 'white';
    roundRect(ctx, 20, 20, width - 40, height - 40, 20);
    ctx.fill();

    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 力扣征途', width / 2, 70);

    // 绘制副标题
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.fillText('全部打卡记录', width / 2, 100);

    // 绘制完成进度
    const percent = data.stats.totalProblems > 0
        ? Math.round((data.stats.totalSolved / data.stats.totalProblems) * 100)
        : 0;

    ctx.font = 'bold 42px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`${data.stats.totalSolved}/${data.stats.totalProblems}`, width / 2, 165);

    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(`完成率 ${percent}%`, width / 2, 190);

    // 绘制分割线
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 210);
    ctx.lineTo(width - 40, 210);
    ctx.stroke();

    let yPos = 250;

    // 绘制统计信息标题
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    ctx.fillText('📈 打卡数据', width / 2, yPos);
    yPos += 35;

    // 统计项
    ctx.textAlign = 'left';

    // 总打卡天数
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText('📅 总打卡天数', 50, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2196F3';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.fillText(`${data.stats.totalDays} 天`, width - 50, yPos);
    yPos += 30;

    // 最长连续打卡
    ctx.textAlign = 'left';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText('🔥 最长连续打卡', 50, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f44336';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.fillText(`${data.stats.maxStreak} 天`, width - 50, yPos);
    yPos += 30;

    // 最高打卡日
    ctx.textAlign = 'left';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText('🏆 最高打卡日', 50, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    if (data.stats.maxDayDate) {
        const maxDate = new Date(data.stats.maxDayDate);
        ctx.fillText(`${maxDate.getMonth() + 1}/${maxDate.getDate()} · ${data.stats.maxDayCount}题`, width - 50, yPos);
    } else {
        ctx.fillText('暂无', width - 50, yPos);
    }
    yPos += 40;

    // 绘制分割线
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, yPos - 10);
    ctx.lineTo(width - 40, yPos - 10);
    ctx.stroke();
    yPos += 15;

    // 绘制轮次进度标题
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    ctx.fillText('📊 轮次进度', width / 2, yPos);
    yPos += 30;

    // 各轮次进度
    const roundColors = { round1: '#4CAF50', round2: '#2196F3', round3: '#FF9800', round4: '#f44336' };
    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮' };

    ctx.textAlign = 'left';

    Object.keys(data.stats.roundStats).forEach(roundKey => {
        const stats = data.stats.roundStats[roundKey];
        if (stats.total > 0) {
            // 绘制圆点
            ctx.fillStyle = roundColors[roundKey];
            ctx.beginPath();
            ctx.arc(50, yPos - 5, 6, 0, Math.PI * 2);
            ctx.fill();

            // 轮次名称
            ctx.font = '13px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#333';
            ctx.fillText(roundNames[roundKey], 65, yPos);

            // 进度
            ctx.textAlign = 'right';
            const roundPercent = Math.round((stats.solved / stats.total) * 100);
            ctx.fillStyle = roundColors[roundKey];
            ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
            ctx.fillText(`${stats.solved}/${stats.total} (${roundPercent}%)`, width - 50, yPos);
            ctx.textAlign = 'left';

            yPos += 28;
        }
    });

    yPos += 10;

    // 绘制分割线
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, yPos - 5);
    ctx.lineTo(width - 40, yPos - 5);
    ctx.stroke();
    yPos += 20;

    // 已完成轮次
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('✅ 已完成轮次', 50, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.fillText(data.stats.completedRounds.length > 0 ? data.stats.completedRounds.join('、') : '暂无', width - 50, yPos);
    yPos += 28;

    // 正在练习
    ctx.textAlign = 'left';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText('📍 正在练习', 50, yPos);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2196F3';
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
    ctx.fillText(data.stats.currentRound || '暂无', width - 50, yPos);

    // 绘制底部信息
    ctx.fillStyle = '#f8f9fa';
    roundRect(ctx, 20, height - 100, width - 40, 60, {tl: 0, tr: 0, bl: 20, br: 20});
    ctx.fill();

    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(`👤 ${data.username}`, width / 2, height - 70);
    ctx.fillText(`📅 生成于 ${data.date}`, width / 2, height - 50);

    // 显示弹窗
    modal.classList.add('active');
}
