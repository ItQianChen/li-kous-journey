// js/chart-progress.js

/**
 * 获取各轮次的进度数据
 */
function getRoundProgressData() {
    const roundData = [];
    const roundMeta = {
        round1: { name: '第一轮', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.2)' },
        round2: { name: '第二轮', color: '#2196F3', bgColor: 'rgba(33, 150, 243, 0.2)' },
        round3: { name: '第三轮', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.2)' },
        round4: { name: '第四轮', color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.2)' },
        round5: { name: '数据库', color: '#9C27B0', bgColor: 'rgba(156, 39, 176, 0.2)' },
        round6: { name: 'Hot100', color: '#00BCD4', bgColor: 'rgba(0, 188, 212, 0.2)' },
        round7: { name: '面试经典150', color: '#8BC34A', bgColor: 'rgba(139, 195, 74, 0.2)' }
    };

    getOrderedRoundKeys().forEach(roundKey => {
        const round = problemsData[roundKey];
        const meta = roundMeta[roundKey] || { name: round?.name || roundKey, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.2)' };

        if (!round || !round.categories) {
            roundData.push({ name: meta.name, solved: 0, total: 0, percent: 0, color: meta.color, bgColor: meta.bgColor });
            return;
        }

        let solved = 0;
        let total = 0;

        round.categories.forEach(category => {
            total += category.problems.length;
            category.problems.forEach(problemNum => {
                if (isProblemSolved(problemNum)) {
                    solved++;
                }
            });
        });

        const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
        roundData.push({ name: meta.name, solved, total, percent, color: meta.color, bgColor: meta.bgColor, roundKey });
    });

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

    const overallStats = getOverallStats();
    const overallPercent = overallStats.totalProblems > 0
        ? Math.round((overallStats.totalSolved / overallStats.totalProblems) * 100)
        : 0;

    const datasets = roundData.map((round, index) => ({
        label: round.name,
        data: [round.percent, 100 - round.percent],
        backgroundColor: [round.color, round.bgColor],
        borderWidth: 0,
        cutout: `${50 + index * 8}%`,
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
