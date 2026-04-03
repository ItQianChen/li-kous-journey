// js/share-overall.js

// ===================== 全局分享卡片功能 =====================

/**
 * 获取全局统计数据（用于全局分享卡片）
 * @returns {object} 包含总打卡天数、最长连续、最长打卡日期、已完成轮次等信息
 */
function getOverallStatsForShare() {
    const allDates = new Set();
    let maxDayCount = 0;
    let maxDayDate = null;

    // 统计每轮的完成情况
    const roundStats = getOrderedRoundKeys().reduce((result, roundKey) => {
        result[roundKey] = { solved: 0, total: 0 };
        return result;
    }, {});

    // 遍历所有轮次和进度
    Object.keys(problemsData).forEach(roundKey => {
        const roundData = problemsData[roundKey];
        if (!roundData || !roundData.categories) return;

        roundData.categories.forEach(category => {
            roundStats[roundKey].total += category.problems.length;
            category.problems.forEach(problemNum => {
                if (isProblemSolved(problemNum)) {
                    roundStats[roundKey].solved++;

                    const progress = getProblemProgress(problemNum);
                    if (progress && progress.solvedAt) {
                        // 使用本地日期，避免 UTC 时区偏移问题
                        const dateStr = getLocalDateString(progress.solvedAt);
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
                    // 使用本地日期，避免 UTC 时区偏移问题
                    const dateStr = getLocalDateString(progress.solvedAt);
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
    let currentRoundName = null;

    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮', round5: '数据库', round6: 'Hot100', round7: '面试经典150' };

    Object.keys(roundStats).forEach(roundKey => {
        const stats = roundStats[roundKey];
        if (stats.total > 0) {
            if (stats.solved === stats.total) {
                completedRounds.push(roundNames[roundKey]);
            } else if (stats.solved > 0 && !currentRoundName) {
                currentRoundName = roundNames[roundKey];
            }
        }
    });

    // 如果没有正在练习的轮次，找第一个未完成的
    if (!currentRoundName) {
        for (const roundKey of getOrderedRoundKeys()) {
            const stats = roundStats[roundKey];
            if (stats.total > 0 && stats.solved < stats.total) {
                currentRoundName = roundNames[roundKey];
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
        currentRound: currentRoundName,
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
    const height = 800;

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
    const roundColors = { round1: '#4CAF50', round2: '#2196F3', round3: '#FF9800', round4: '#f44336', round5: '#9C27B0', round6: '#00BCD4', round7: '#8BC34A' };
    const roundNames = { round1: '第一轮', round2: '第二轮', round3: '第三轮', round4: '第四轮', round5: '数据库', round6: 'Hot100', round7: '面试经典150' };

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
