// js/chart.js

// 图表实例
let progressChart = null;
let trendChart = null;
let radarChart = null;
let currentChartType = 'progress';

// 趋势图日期范围（默认30天）
let trendDays = 30;
let trendStartDate = null;
let trendEndDate = null;
let isCustomRange = false;

/**
 * 显示图表弹窗
 */
function showChartModal() {
    document.getElementById('chartModal').classList.add('active');
    currentChartType = 'progress';
    updateChartTabs();
    renderCurrentChart();
}

/**
 * 关闭图表弹窗
 */
function closeChartModal() {
    document.getElementById('chartModal').classList.remove('active');
    destroyAllCharts();
}

/**
 * 销毁所有图表实例
 */
function destroyAllCharts() {
    if (progressChart) { progressChart.destroy(); progressChart = null; }
    if (trendChart) { trendChart.destroy(); trendChart = null; }
    if (radarChart) { radarChart.destroy(); radarChart = null; }
}

/**
 * 切换图表类型
 */
function switchChart(type) {
    currentChartType = type;
    updateChartTabs();
    renderCurrentChart();
}

/**
 * 更新标签和面板的激活状态
 */
function updateChartTabs() {
    // 更新标签
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.chart-tab[onclick="switchChart('${currentChartType}')"]`).classList.add('active');

    // 更新面板
    document.querySelectorAll('.chart-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${currentChartType}Panel`).classList.add('active');
}

/**
 * 渲染当前选中的图表
 */
function renderCurrentChart() {
    destroyAllCharts();

    switch (currentChartType) {
        case 'progress':
            renderProgressChart();
            break;
        case 'trend':
            renderTrendChart();
            break;
        case 'radar':
            renderRadarChart();
            break;
        case 'heatmap':
            renderHeatmapChart();
            break;
    }
}

/**
 * 获取各轮次的进度数据
 */
function getRoundProgressData() {
    const roundData = [];
    const roundNames = ['第一轮', '第二轮', '第三轮', '第四轮'];
    const roundColors = ['#4CAF50', '#2196F3', '#FF9800', '#f44336'];
    const roundBgColors = ['rgba(76, 175, 80, 0.2)', 'rgba(33, 150, 243, 0.2)', 'rgba(255, 152, 0, 0.2)', 'rgba(244, 67, 54, 0.2)'];

    for (let i = 1; i <= 4; i++) {
        const roundKey = `round${i}`;
        const round = problemsData[roundKey];

        if (!round || !round.categories) {
            roundData.push({ name: roundNames[i - 1], solved: 0, total: 0, percent: 0, color: roundColors[i - 1], bgColor: roundBgColors[i - 1] });
            continue;
        }

        let solved = 0;
        let total = 0;

        round.categories.forEach(category => {
            total += category.problems.length;
            category.problems.forEach(problemNum => {
                if (userProgress[roundKey] && userProgress[roundKey][problemNum]) {
                    solved++;
                }
            });
        });

        const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
        roundData.push({ name: roundNames[i - 1], solved, total, percent, color: roundColors[i - 1], bgColor: roundBgColors[i - 1] });
    }

    return roundData;
}

/**
 * 渲染轮次进度环形图
 */
function renderProgressChart() {
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    const legendContainer = document.getElementById('chartLegend');

    const roundData = getRoundProgressData();

    let totalSolved = 0;
    let totalProblems = 0;
    roundData.forEach(r => { totalSolved += r.solved; totalProblems += r.total; });
    const overallPercent = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

    const datasets = roundData.map((round, index) => ({
        label: round.name,
        data: [round.percent, 100 - round.percent],
        backgroundColor: [round.color, round.bgColor],
        borderWidth: 0,
        cutout: `${60 + index * 8}%`,
        circumference: 360,
        rotation: -90
    }));

    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['已完成', '未完成'], datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const round = roundData[context.datasetIndex];
                            return context.dataIndex === 0 ? `${round.name}: ${round.solved}/${round.total} (${round.percent}%)` : '';
                        }
                    }
                }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#667eea';
                ctx.fillText(`${overallPercent}%`, centerX, centerY - 10);
                ctx.font = '14px "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#888';
                ctx.fillText('总完成率', centerX, centerY + 20);
                ctx.restore();
            }
        }]
    });

    renderChartLegend(legendContainer, roundData);
}

/**
 * 渲染图表图例
 */
function renderChartLegend(container, roundData) {
    container.innerHTML = roundData.map((round, index) => `
        <div class="legend-item round${index + 1}">
            <div class="legend-color" style="background: ${round.color}"></div>
            <div class="legend-info">
                <div class="legend-name">${round.name}</div>
                <div class="legend-progress">${round.solved}/${round.total}</div>
            </div>
            <div class="legend-percent">${round.percent}%</div>
        </div>
    `).join('');
}

/**
 * 设置趋势图日期范围（预设按钮）
 */
function setTrendRange(days) {
    trendDays = days;
    isCustomRange = false;

    // 更新按钮状态
    document.querySelectorAll('.trend-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 隐藏自定义日期选择器
    document.getElementById('trendCustomRange').style.display = 'none';

    // 重新渲染图表
    renderTrendChart();
}

/**
 * 显示自定义日期范围选择器
 */
function showCustomRange() {
    isCustomRange = true;

    // 更新按钮状态
    document.querySelectorAll('.trend-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // 显示自定义日期选择器
    const customRange = document.getElementById('trendCustomRange');
    customRange.style.display = 'flex';

    // 设置默认日期
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('trendStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('trendEndDate').value = today.toISOString().split('T')[0];

    trendStartDate = startDate;
    trendEndDate = today;

    renderTrendChart();
}

/**
 * 从自定义日期更新趋势图
 */
function updateTrendFromCustom() {
    const startInput = document.getElementById('trendStartDate').value;
    const endInput = document.getElementById('trendEndDate').value;

    if (startInput && endInput) {
        trendStartDate = new Date(startInput);
        trendEndDate = new Date(endInput);

        if (trendStartDate <= trendEndDate) {
            renderTrendChart();
        }
    }
}

/**
 * 获取指定日期范围的刷题数据
 */
function getTrendData() {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate;

    if (isCustomRange && trendStartDate && trendEndDate) {
        startDate = new Date(trendStartDate);
        endDate = new Date(trendEndDate);
    } else {
        endDate = today;
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - trendDays + 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

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

        // 根据日期范围选择不同的标签格式
        const daysDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        let label;
        if (daysDiff <= 14) {
            label = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        } else if (daysDiff <= 90) {
            label = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        } else {
            label = `${currentDate.getMonth() + 1}月`;
        }

        data.push({
            date: label,
            fullDate: dateStr,
            count: count
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
}

/**
 * 渲染刷题趋势折线图
 */
function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    const ctx = canvas.getContext('2d');
    const data = getTrendData();

    // 销毁旧图表
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }

    // 计算统计数据
    const totalCount = data.reduce((sum, d) => sum + d.count, 0);
    const maxCount = Math.max(...data.map(d => d.count));
    const avgCount = data.length > 0 ? (totalCount / data.length).toFixed(1) : 0;
    const activeDays = data.filter(d => d.count > 0).length;

    // 更新统计摘要
    const summaryEl = document.getElementById('trendSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="trend-stat">
                <div class="trend-stat-value">${totalCount}</div>
                <div class="trend-stat-label">总完成</div>
            </div>
            <div class="trend-stat">
                <div class="trend-stat-value">${avgCount}</div>
                <div class="trend-stat-label">日均</div>
            </div>
            <div class="trend-stat">
                <div class="trend-stat-value">${maxCount}</div>
                <div class="trend-stat-label">单日最高</div>
            </div>
            <div class="trend-stat">
                <div class="trend-stat-value">${activeDays}</div>
                <div class="trend-stat-label">活跃天数</div>
            </div>
        `;
    }

    // 根据数据量决定是否显示所有点
    const showAllPoints = data.length <= 31;
    const pointRadius = showAllPoints ? 4 : 2;

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: '每日刷题数',
                data: data.map(d => d.count),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: pointRadius,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    callbacks: {
                        title: (context) => {
                            const idx = context[0].dataIndex;
                            return data[idx].fullDate;
                        },
                        label: (context) => `完成 ${context.raw} 题`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        maxTicksLimit: showAllPoints ? undefined : 15
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

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
                if (userProgress[roundKey] && userProgress[roundKey][problemNum]) {
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
