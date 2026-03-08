// js/share-card.js

// ===================== 分享卡片功能 =====================

/**
 * 当前分享的日期字符串（用于日期分享）
 */
let currentShareDate = null;

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
    const problemsByRound = getOrderedRoundKeys().reduce((result, roundKey) => {
        result[roundKey] = [];
        return result;
    }, {});
    activity.problems.forEach(p => {
        if (!problemsByRound[p.round]) {
            problemsByRound[p.round] = [];
        }
        problemsByRound[p.round].push(p);
    });

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
    const height = data.type === 'month' ? 750 : 600;

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
    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮', round5: '数据库', round6: 'Hot100', round7: '面试经典150' };
    const roundColors = { round1: '#4CAF50', round2: '#2196F3', round3: '#FF9800', round4: '#f44336', round5: '#9C27B0', round6: '#00BCD4', round7: '#8BC34A' };

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
    roundRect(ctx, 20, height - 100, width - 40, 60, { tl: 0, tr: 0, bl: 20, br: 20 });
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
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
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
