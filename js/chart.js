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
