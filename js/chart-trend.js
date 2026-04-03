// js/chart-trend.js

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

    // 使用本地日期格式化，避免 UTC 时区偏移问题
    document.getElementById('trendStartDate').value = getLocalDateString(startDate);
    document.getElementById('trendEndDate').value = getLocalDateString(today);

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

    let startDate;
    let endDate;

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
        // 使用本地日期格式化，避免 UTC 时区偏移问题
        const dateStr = getLocalDateString(currentDate);

        const count = getActivityEventsByDate(dateStr).length;

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
