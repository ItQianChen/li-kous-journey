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
    const problemsMap = new Map();

    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.entries(userProgress[roundKey]).forEach(([problemId, progress]) => {
                if (progress.solvedAt && new Date(progress.solvedAt).toISOString().split('T')[0] === dateStr) {
                    const problemInfo = allProblems.find(p => p.id.toString() === problemId);
                    if (problemInfo && !problemsMap.has(problemId)) {
                        problemsMap.set(problemId, {
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

    return { count: problemsMap.size, problems: Array.from(problemsMap.values()) };
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

    const problemsByRound = getOrderedRoundKeys().reduce((result, roundKey) => {
        result[roundKey] = [];
        return result;
    }, {});
    problemsMap.forEach(problem => {
        if (!problemsByRound[problem.round]) {
            problemsByRound[problem.round] = [];
        }
        problemsByRound[problem.round].push(problem);
    });

    return { problemsByRound, totalCount: problemsMap.size };
}

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
        currentStreak: maxStreak,
        totalDays,
        totalProblems,
        daysElapsed: lastDayToCount
    };
}
