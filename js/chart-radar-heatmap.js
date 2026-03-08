// js/chart-radar-heatmap.js

/**
 * 获取所有分类的完成数据
 */
function getCategoryProgressData() {
    const categoryData = {};

    // 收集所有分类
    Object.keys(problemsData).forEach(roundKey => {
        const round = problemsData[roundKey];
        if (!round || !round.categories) return;

        round.categories.forEach(category => {
            if (!categoryData[category.name]) {
                categoryData[category.name] = { solved: 0, total: 0 };
            }
            categoryData[category.name].total += category.problems.length;

            category.problems.forEach(problemNum => {
                if (isProblemSolved(problemNum)) {
                    categoryData[category.name].solved++;
                }
            });
        });
    });

    return categoryData;
}

/**
 * 渲染分类雷达图
 */
function renderRadarChart() {
    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');
    const categoryData = getCategoryProgressData();

    const labels = Object.keys(categoryData);
    const percentages = labels.map(name => {
        const data = categoryData[name];
        return data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0;
    });

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '完成率',
                data: percentages,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                borderWidth: 2,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const name = labels[context.dataIndex];
                            const data = categoryData[name];
                            return `${name}: ${data.solved}/${data.total} (${context.raw}%)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 20, font: { size: 10 } },
                    pointLabels: { font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            }
        }
    });
}

/**
 * 获取过去一年的刷题数据
 */
function getYearHeatmapData() {
    const data = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 收集所有日期的数据
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.values(userProgress[roundKey]).forEach(progress => {
                if (progress.solvedAt) {
                    const dateStr = new Date(progress.solvedAt).toISOString().split('T')[0];
                    data[dateStr] = (data[dateStr] || 0) + 1;
                }
            });
        }
    });

    return data;
}

/**
 * 渲染GitHub风格年度热力图
 */
function renderHeatmapChart() {
    const container = document.getElementById('heatmapContainer');
    const heatmapData = getYearHeatmapData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算起始日期（从去年的今天开始）
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);

    // 调整到周日开始
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let html = '<div class="heatmap-wrapper">';

    let currentDate = new Date(startDate);
    let currentMonth = -1;
    let weekHtml = '';
    let monthHtml = '';
    let weekCount = 0;

    while (currentDate <= today) {
        const month = currentDate.getMonth();

        // 新月份开始
        if (month !== currentMonth) {
            if (monthHtml) {
                html += `<div class="heatmap-month"><div class="heatmap-month-label">${getMonthName(currentMonth)}</div><div class="heatmap-weeks">${monthHtml}</div></div>`;
            }
            monthHtml = '';
            currentMonth = month;
            weekCount = 0;
        }

        // 周日开始新的一周
        if (currentDate.getDay() === 0) {
            if (weekHtml) {
                monthHtml += `<div class="heatmap-week">${weekHtml}</div>`;
                weekCount++;
            }
            weekHtml = '';
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const count = heatmapData[dateStr] || 0;
        const level = getHeatmapLevel(count);
        const isFuture = currentDate > today;

        const displayDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
        const tooltip = count > 0 ? `${displayDate}: ${count}题` : `${displayDate}: 无打卡`;

        weekHtml += `<div class="heatmap-day level-${level}${isFuture ? ' future' : ''}" 
            data-date="${dateStr}" 
            data-count="${count}"
            title="${tooltip}"></div>`;

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 添加最后一周
    if (weekHtml) {
        monthHtml += `<div class="heatmap-week">${weekHtml}</div>`;
    }

    // 添加最后一个月
    if (monthHtml) {
        html += `<div class="heatmap-month"><div class="heatmap-month-label">${getMonthName(currentMonth)}</div><div class="heatmap-weeks">${monthHtml}</div></div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * 获取月份名称
 */
function getMonthName(month) {
    const names = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return names[month];
}

/**
 * 获取热力图等级
 */
function getHeatmapLevel(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
}
