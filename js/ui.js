// js/ui.js

/**
 * 选择并显示指定轮次的内容。
 * @param {number} round - 要选择的轮次编号。
 * @param {string} categoryName - 可选，要选择的分类名称。
 */
function selectRound(round, categoryName = null) {
    currentRound = round;
    selectedCategory = null;

    const roundKey = `round${round}`;

    // 更新轮次选择按钮的激活状态
    document.querySelectorAll('.round-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.roundKey === roundKey);
    });

    renderCategories(categoryName);
    renderReviewContainer(); // 渲染本轮的复习功能区
    saveCurrentViewState(); // 依赖 data.js
    updateStats();
    updateGlobalStats();
}

/**
 * 渲染当前轮次下的所有分类卡片。
 * @param {string} targetCategoryName - 可选，要选择的分类名称。
 */
function renderCategories(targetCategoryName = null) {
    const container = document.getElementById('categoriesContainer');
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    container.innerHTML = '';

    if (!roundData || !roundData.categories || roundData.categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无题目数据</p>';
        document.getElementById('problemsContainer').innerHTML = ''; // 清空题目列表
        return;
    }

    // 查找目标分类或默认选择第一个分类
    let targetIndex = 0;
    if (targetCategoryName) {
        const foundIndex = roundData.categories.findIndex(c => c.name === targetCategoryName);
        if (foundIndex !== -1) {
            targetIndex = foundIndex;
        }
    }
    selectedCategory = roundData.categories[targetIndex];

    roundData.categories.forEach((category, index) => {
        const solved = category.problems.filter(problemNum => isProblemSolved(problemNum)).length;
        const total = category.problems.length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'category-card';
        if (index === targetIndex) {
            card.classList.add('active');
        }

        card.innerHTML = `
            <div class="category-header">
                <div class="category-name">${category.name}</div>
                <div class="category-progress">${solved}/${total}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;

        card.onclick = () => {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedCategory = category;
            saveCurrentViewState(); // 依赖 data.js
            renderProblems();
        };

        container.appendChild(card);
    });

    // 渲染选中分类的题目
    if (selectedCategory) {
        renderProblems();
    }
}

/**
 * 渲染当前选中分类下的所有题目。
 */
function renderProblems() {
    if (!selectedCategory) {
        document.getElementById('problemsContainer').innerHTML = '';
        return;
    }

    const container = document.getElementById('problemsContainer');
    const roundKey = `round${currentRound}`;

    container.innerHTML = `
        <div class="problems-section">
            <div class="section-title">
                📝 ${selectedCategory.name} - 题目列表
            </div>
            <div class="problems-grid" id="problemsGrid"></div>
        </div>
    `;

    const grid = document.getElementById('problemsGrid');

    selectedCategory.problems.forEach(problemNum => {
        const problemInfo = allProblems.find(p => p.id.toString() === problemNum.toString());
        if (!problemInfo) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'problem-wrapper';

        const item = document.createElement('div');
        item.className = 'problem-item';

        const solvedInfo = getProblemProgress(problemNum);
        const solved = Boolean(solvedInfo);
        let solvedDateStr = '';
        if (solved) {
            item.classList.add('solved');
            if (solvedInfo.solvedAt) {
                const solvedDate = new Date(solvedInfo.solvedAt);
                solvedDateStr = `${solvedDate.getFullYear()}-${String(solvedDate.getMonth() + 1).padStart(2, '0')}-${String(solvedDate.getDate()).padStart(2, '0')} ${String(solvedDate.getHours()).padStart(2, '0')}:${String(solvedDate.getMinutes()).padStart(2, '0')}`;
            }
        }

        item.innerHTML = `
            <div class="problem-content">
                <div class="problem-number">${problemNum}</div>
                <div class="problem-title">${problemInfo.title}</div>
            </div>
        `;

        if (solved && solvedInfo.solvedAt) {
            const solvedDate = new Date(solvedInfo.solvedAt);
            const dateStr = `${solvedDate.getMonth() + 1}/${solvedDate.getDate()}`;
            const dateBadge = document.createElement('div');
            dateBadge.className = 'solved-date-badge';
            dateBadge.textContent = dateStr;
            item.appendChild(dateBadge);
        }

        if (problemInfo.url)                              {
            const linkBtn = document.createElement('button');
            linkBtn.className = 'link-btn';
            linkBtn.innerHTML = '🔗';
            linkBtn.title = '跳转到题目页面';
            linkBtn.onclick = (e) => {
                e.stopPropagation();
                window.open(problemInfo.url, '_blank');
            };
            item.appendChild(linkBtn);
        }

        item.title = solved && solvedDateStr
            ? `题目 ${problemNum}: ${problemInfo.title}\n打卡时间: ${solvedDateStr}\n点击取消打卡`
            : `题目 ${problemNum}: ${problemInfo.title}\n点击打卡`;

        item.onclick = (e) => {
            e.stopPropagation();
            toggleProblem(roundKey, problemNum, item);
        };

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制题号';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            copyProblemNumber(problemNum, copyBtn); // 依赖 utils.js
        };

        wrapper.appendChild(item);
        wrapper.appendChild(copyBtn);
        grid.appendChild(wrapper);
    });
}

/**
 * 切换题目的完成状态（打卡/取消打卡）。
 * @param {string} roundKey - 当前轮次的键名 (e.g., 'round1')。
 * @param {number|string} problemNum - 题目编号。
 * @param {HTMLElement} element - 被点击的题目元素。
 */
function toggleProblem(roundKey, problemNum, element) {
    if (!userProgress[roundKey]) {
        userProgress[roundKey] = {};
    }

    const solved = isProblemSolved(problemNum);

    if (solved) {
        clearProblemProgress(problemNum);
        element.classList.remove('solved');
    } else {
        userProgress[roundKey][problemNum] = {
            solvedAt: new Date().toISOString(),
            round: roundKey
        };
        element.classList.add('solved');

        // 添加打卡动画
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }

    saveUserProgress(); // 依赖 data.js
    updateStats();
    updateGlobalStats(); // 更新全局统计（连续打卡、今日答题、当前进度）
    renderCategories(selectedCategory ? selectedCategory.name : null);
    saveCurrentViewState(); // 依赖 data.js
    renderCalendar(); // 依赖 calendar.js
}

/**
 * 更新统计面板的数据，包括已完成、总数和完成率。
 */
function updateStats() {
    const roundKey = `round${currentRound}`;
    const roundData = problemsData[roundKey];

    if (!roundData) return;

    let totalProblems = 0;
    let solvedProblems = 0;

    roundData.categories.forEach(category => {
        totalProblems += category.problems.length;
        category.problems.forEach(problemNum => {
            if (isProblemSolved(problemNum)) {
                solvedProblems++;
            }
        });
    });

    const completionRate = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

    document.getElementById('totalSolved').textContent = solvedProblems;
    document.getElementById('totalProblems').textContent = totalProblems;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('currentRound').textContent = roundData.name.split(' ')[0];
}

/**
 * 更新全局统计面板（连续打卡、今日答题、当前进度、总进度）
 */
function updateGlobalStats() {
    // 计算连续打卡天数
    const streak = calculateGlobalStreak();
    document.getElementById('globalStreak').textContent = streak + '天';

    // 计算今日答题数
    const todayCount = getTodayProblemCount();
    document.getElementById('todayCount').textContent = todayCount + '题';

    // 显示当前进度
    const progress = getCurrentProgressText();
    document.getElementById('currentProgress').textContent = progress;

    // 显示总进度（已刷题目数/总数及百分比）
    const overallStats = getOverallStats();
    const totalProgressEl = document.getElementById('globalTotalProgress');
    const totalPercentEl = document.getElementById('globalTotalPercent');
    if (totalProgressEl) {
        totalProgressEl.textContent = `${overallStats.totalSolved}/${overallStats.totalProblems}`;
    }
    if (totalPercentEl) {
        const percent = overallStats.totalProblems > 0
            ? Math.round((overallStats.totalSolved / overallStats.totalProblems) * 100)
            : 0;
        totalPercentEl.textContent = percent + '%';
    }
}

/**
 * 计算全局连续打卡天数（从今天往前算）
 */
function calculateGlobalStreak() {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) { // 最多检查一年
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        const dayCount = getDayProblemCount(dateStr);

        if (dayCount > 0) {
            streak++;
        } else if (i > 0) { // 如果不是今天且没有打卡，则中断
            break;
        }
        // 如果今天还没打卡，继续检查昨天
    }

    return streak;
}

/**
 * 获取指定日期的打卡题目数（包括首次打卡和复习打卡）
 */
function getDayProblemCount(dateStr) {
    let count = 0;
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey]) {
            Object.values(userProgress[roundKey]).forEach(progress => {
                // 检查首次打卡时间
                if (progress.solvedAt && getLocalDateString(progress.solvedAt) === dateStr) {
                    count++;
                } else if (progress.reviewHistory && progress.reviewHistory.length > 0) {
                    // 只有首次打卡不在今天时，才检查复习记录
                    if (progress.reviewHistory.some(timestamp => getLocalDateString(timestamp) === dateStr)) {
                        count++;
                    }
                }
            });
        }
    });
    return count;
}

/**
 * 获取今日答题数量
 */
function getTodayProblemCount() {
    // 使用本地日期，避免 UTC 时区偏移问题
    const today = getLocalDateString(new Date());
    return getDayProblemCount(today);
}

/**
 * 获取当前进度文本（根据实际打卡情况计算）
 * 找到第一个未完成的分类作为当前进度
 */
function getCurrentProgressText() {
    const roundNameMap = {
        round1: '第一轮',
        round2: '第二轮',
        round3: '第三轮',
        round4: '第四轮',
        round5: '数据库',
        round6: 'Hot100',
        round7: '面试经典150'
    };

    for (const roundKey of getOrderedRoundKeys()) {
        const roundData = problemsData[roundKey];
        if (!roundData || !roundData.categories) continue;

        for (const category of roundData.categories) {
            const solved = category.problems.filter(problemNum => isProblemSolved(problemNum)).length;
            const total = category.problems.length;

            if (solved < total) {
                return `${roundNameMap[roundKey] || roundData.name}·${category.name}`;
            }
        }
    }

    return '🎉 全部完成';
}

/**
 * 获取当前进度（轮次和分类）
 * @returns {{round: number, category: string}|null} 返回当前进度的轮次和分类，如果全部完成则返回null
 */
function getCurrentProgress() {
    const roundKeys = getOrderedRoundKeys();

    for (const roundKey of roundKeys) {
        const roundData = problemsData[roundKey];
        if (!roundData || !roundData.categories) continue;

        for (const category of roundData.categories) {
            const solved = category.problems.filter(problemNum => isProblemSolved(problemNum)).length;
            const total = category.problems.length;

            if (solved < total) {
                return {
                    round: Number(roundKey.replace('round', '')),
                    category: category.name
                };
            }
        }
    }

    return null;
}

/**
 * 跳转到当前进度位置
 */
function jumpToCurrentProgress() {
    const savedViewState = loadUserViewState(); // 依赖 data.js
    if (savedViewState) {
        selectRound(savedViewState.round, savedViewState.category);
        return;
    }

    const progress = getCurrentProgress();
    if (progress) {
        selectRound(progress.round, progress.category);
    } else {
        // 全部完成，默认显示第一轮
        selectRound(1);
    }
}

/**
 * 获取所有轮次的总进度统计（按唯一题号去重）。
 * @returns {{totalSolved: number, totalProblems: number}} - 包含总完成数和总题目数的对象。
 */
function getOverallStats() {
    const uniqueProblemIds = new Set();

    Object.keys(problemsData).forEach(roundKey => {
        const roundData = problemsData[roundKey];
        if (!roundData || !Array.isArray(roundData.categories)) {
            return;
        }

        roundData.categories.forEach(category => {
            if (!Array.isArray(category.problems)) {
                return;
            }

            category.problems.forEach(problemNum => {
                uniqueProblemIds.add(problemNum.toString());
            });
        });
    });

    let totalSolved = 0;
    uniqueProblemIds.forEach(problemId => {
        if (isProblemSolved(problemId)) {
            totalSolved++;
        }
    });

    return {
        totalSolved,
        totalProblems: uniqueProblemIds.size
    };
}

/**
 * 刷新悬浮复习入口的显示状态
 */
function renderReviewContainer() {
    const btn = document.getElementById('floatingReviewBtn');
    if (!btn) return;
    
    const roundKey = `round${currentRound}`;
    
    // 如果本轮有任何已完成的题目，才显示复习入口 (跨轮验证)
    const testList = generateReviewProblems(roundKey, 1);
    if (testList.length > 0) {
        btn.style.display = 'flex';
    } else {
        btn.style.display = 'none';
        closeReviewModal();
    }
}

/**
 * 渲染自定义树状下拉框
 */
function renderCustomTreeSelect(hierarchy) {
    const trigger = document.getElementById('customTreeSelectTrigger');
    const label = document.getElementById('customTreeSelectLabel');
    const input = document.getElementById('reviewSourceSelect');
    const dropdown = document.getElementById('customTreeSelectDropdown');
    const wrapper = document.getElementById('customTreeSelectWrapper');
    
    if (!trigger || !dropdown) return;
    
    // 清空重构下拉结构
    dropdown.innerHTML = '';
    
    // 助手函数：选中逻辑
    const handleSelect = (val, text) => {
        input.value = val;
        label.textContent = text;
        dropdown.classList.remove('active');
    };

    // 全局盲抽选项
    const allOpt = document.createElement('div');
    allOpt.className = 'tree-option';
    allOpt.style.fontWeight = 'bold';
    allOpt.textContent = '🌐 全局 (跨所有阶梯范围)';
    allOpt.onclick = () => handleSelect('all', '🌐 全局 (跨所有阶梯范围)');
    dropdown.appendChild(allOpt);

    hierarchy.forEach(stage => {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'tree-optgroup-label';
        // 加上一个小倒三角
        groupLabel.innerHTML = `<span>📈 ${stage.name}</span><span style="font-size:0.7rem; color:#e65100; transition: transform 0.2s;">▼</span>`;
        
        const groupContent = document.createElement('div');
        groupContent.className = 'tree-optgroup-content';
        
        groupLabel.onclick = (e) => {
            e.stopPropagation();
            groupContent.classList.toggle('active');
            const icon = groupLabel.querySelector('span:last-child');
            icon.style.transform = groupContent.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
        };
        
        const stageAllOpt = document.createElement('div');
        stageAllOpt.className = 'tree-option';
        stageAllOpt.textContent = `🌐 ${stage.name} (全局)`;
        stageAllOpt.onclick = () => handleSelect(`${stage.stageKey}-all`, `🌐 ${stage.name} (全局)`);
        groupContent.appendChild(stageAllOpt);

        stage.roundGroups.forEach(rg => {
            const opt = document.createElement('div');
            opt.className = 'tree-option';
            opt.textContent = `📁 ${rg.name}`;
            opt.onclick = () => handleSelect(`${stage.stageKey}-${rg.roundKey}`, `📁 ${rg.name}`);
            groupContent.appendChild(opt);
        });
        
        dropdown.appendChild(groupLabel);
        dropdown.appendChild(groupContent);
    });

    // 绑定主触发按钮点击事件（只绑一次，防止多重触发）
    trigger.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    };

    // 阻止下拉菜单内部滚动事件冒泡，防止触发外层 modal 滚动
    dropdown.addEventListener('wheel', (e) => {
        e.stopPropagation();
    }, { passive: true });

    // 点击外部自动收起面板，绑定在全局 body 级别
    // 为了防止多次绑定需要使用一点小技巧：清理或者放到闭包外，但为了简明起见
    if (!window.hasBindCustomSelectDocClick) {
        document.addEventListener('click', (e) => {
            const dd = document.getElementById('customTreeSelectDropdown');
            const wrap = document.getElementById('customTreeSelectWrapper');
            if (dd && wrap && !wrap.contains(e.target)) {
                dd.classList.remove('active');
            }
        });
        window.hasBindCustomSelectDocClick = true;
    }

    // 默认回显状态
    if (hierarchy.length > 0) {
        handleSelect(`${hierarchy[0].stageKey}-all`, `🌐 ${hierarchy[0].name} (全局)`);
    } else {
        handleSelect('all', '🌐 全局 (跨所有阶梯范围)');
    }
}

/**
 * 打开复习弹窗
 */
function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if(!modal) return;
    
    modal.style.display = 'flex';
    
    // 获取层级嵌套题库数据
    const hierarchy = generateAllReviewProblemsGrouped(); // 依赖 data.js
    
    // 渲染手写的自定义树状选择器替代原生 Select
    renderCustomTreeSelect(hierarchy);
    
    // 渲染嵌套层级折叠面板
    renderAllReviewGroups(hierarchy);
    
    // 默认隐去推荐区
    document.getElementById('recommendReviewSection').style.display = 'none';
    document.getElementById('clearRecommendBtn').style.display = 'none';
}

/**
 * 关闭复习弹窗
 */
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if(modal) modal.style.display = 'none';
}

/**
 * 渲染所有的待复习按照分类折叠面板
 */
function renderAllReviewGroups(hierarchy) {
    const container = document.getElementById('allReviewsContainer');
    container.innerHTML = '';

    if (!hierarchy || hierarchy.length === 0) {
        container.innerHTML = '<p style="color:#888; padding: 1rem;">暂无待复习题目，快去题库打卡吧！</p>';
        return;
    }

    const createReviewCardWrapper = (item, stage) => {
        const cardWrapper = buildReviewCardHTML(
            item.id,
            item.reviewCount,
            item.solvedAt,
            item.lastReviewAt,
            item.reviewHistory,
            stage
        );
        return cardWrapper;
    };

    const createGroupElement = (group, icon, isExpanded, stage) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = isExpanded ? 'review-group expanded' : 'review-group';

        const header = document.createElement('div');
        header.className = 'review-group-header';
        header.onclick = () => groupDiv.classList.toggle('expanded');

        header.innerHTML = `
            <div class="review-group-title">
                <span>${icon} ${group.name}</span>
                <span class="review-group-badge">${group.problems.length} 题</span>
            </div>
            <div class="review-group-icon">▼</div>
        `;

        const content = document.createElement('div');
        content.className = 'review-group-content review-problems-grid';

        group.problems.forEach(item => {
            const cardWrapper = createReviewCardWrapper(item, stage);
            if (cardWrapper) content.appendChild(cardWrapper);
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(content);
        return groupDiv;
    };

    hierarchy.forEach(stage => {
        const stageWrapper = document.createElement('div');
        stageWrapper.className = 'stage-wrapper';
        stageWrapper.style.marginBottom = '1.5rem';

        const stageLabel = document.createElement('div');
        stageLabel.style.cssText = "color: #e65100; margin-bottom: 0.8rem; font-size: 1.05rem; font-weight: bold; padding: 0.6rem 0.8rem; border-left: 4px solid #ff9800; background: #fff8e1; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;";

        const totalProbs = stage.roundGroups.reduce((sum, rg) => sum + rg.problems.length, 0);

        stageLabel.innerHTML = `
            <span>📈 ${stage.name} <span style="font-size: 0.85rem; color: #d84315; font-weight: normal; margin-left: 0.5rem;">(共 ${totalProbs} 题)</span></span>
            <span class="stage-icon" style="transition: transform 0.3s; font-size: 0.8rem; color: #e65100;">▼</span>
        `;

        const contentDiv = document.createElement('div');
        let isExpanded = false;
        contentDiv.style.display = isExpanded ? 'block' : 'none';
        if (!isExpanded) {
            stageLabel.querySelector('.stage-icon').style.transform = 'rotate(-90deg)';
        }

        stageLabel.onclick = () => {
            isExpanded = !isExpanded;
            contentDiv.style.display = isExpanded ? 'block' : 'none';
            stageLabel.querySelector('.stage-icon').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        };

        stageWrapper.appendChild(stageLabel);

        stage.roundGroups.forEach(rg => {
            contentDiv.appendChild(createGroupElement(rg, '📁', false, stage.stage));
        });

        stageWrapper.appendChild(contentDiv);
        container.appendChild(stageWrapper);
    });
}

/**
 * 抽取推荐复习题目
 */
function extractRecommendProblems() {
    const select = document.getElementById('reviewSourceSelect');
    const source = select.value;
    const grid = document.getElementById('recommendReviewGrid');
    
    grid.innerHTML = '';
    
    // 全靠 data.js 里的坚实后盾，再也不要在 UI 里手写全局跨度遍历、去重、排序脏活了
    const targetList = generateReviewProblems(source, 5);
    
    if (targetList.length === 0) {
        grid.innerHTML = '<p style="color:#888; text-align: center; width: 100%;">该范围内暂无可复习题目。</p>';
    } else {
        targetList.forEach(item => {
            const cardWrapper = buildReviewCardHTML(item.id, item.reviewCount, item.solvedAt, item.lastReviewAt, item.reviewHistory, item.reviewStage);
            if(cardWrapper) grid.appendChild(cardWrapper);
        });
        
        // 抽取成功后，自动展开推荐区的 details 大折叠板以引人注意
        const recommendDetails = document.getElementById('recommendDetails');
        if (recommendDetails) {
            recommendDetails.setAttribute('open', '');
        }
    }
    
    document.getElementById('recommendReviewSection').style.display = 'block';
    document.getElementById('clearRecommendBtn').style.display = 'block';
}

/**
 * 清除推荐抽取区
 */
function clearRecommendReview() {
    document.getElementById('recommendReviewSection').style.display = 'none';
    document.getElementById('clearRecommendBtn').style.display = 'none';
    document.getElementById('recommendReviewGrid').innerHTML = '';
}

/**
 * 创建单一的复习卡片DOM片段
 */
function buildReviewCardHTML(problemNum, reviewCount, solvedAt, lastReviewAt, reviewHistory, reviewStage) {
    const problemInfo = allProblems.find(p => p.id.toString() === problemNum.toString());
    if (!problemInfo) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'review-problems-wrap';

    const history = Array.isArray(reviewHistory) ? reviewHistory : [];
    const isReviewedToday = reviewCount > reviewStage
        && history[reviewStage]
        && new Date(history[reviewStage]).toDateString() === new Date().toDateString();

    const card = document.createElement('div');
    card.className = `review-problem-item review-card-target ${isReviewedToday ? 'reviewed' : ''}`;
    card.dataset.problemId = problemNum;
    card.dataset.reviewStage = String(reviewStage);
    card.title = isReviewedToday ? "✅ 今日已完成本次复盘" : "做完这道题了吗？点击标记为已复盘！";
    
    // 构建 badge 文本：
    // reviewCount = 0 => 首刷日期
    // reviewCount >= 1 => 显示上一轮复习时间（从 reviewHistory 里取最后一条）
    let badgeText = `复习过 ${reviewCount} 次`;
    if (reviewCount === 0 && solvedAt) {
        const d = new Date(solvedAt);
        badgeText = `首刷于 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } else if (reviewCount >= 1) {
        // 当前阶段卡片展示“上一轮完成时间”，而不是最后一次复习时间
        const previousStageTime = history[reviewCount - 1] || lastReviewAt;
        if (previousStageTime) {
            const d = new Date(previousStageTime);
            badgeText = `第${reviewCount}轮复习于 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
    }
    
    card.innerHTML = `
        <div class="review-count-badge">${badgeText}</div>
        <div class="problem-content">
            <div class="problem-number">${problemNum}</div>
            <div class="problem-title">${problemInfo.title}</div>
        </div>
    `;
    
    card.onclick = (e) => {
        e.stopPropagation();
        if (card.classList.contains('reviewed')) return;

        markProblemReviewed(null, problemNum); // 数据落库

        const progress = getProblemProgress(problemNum);
        if (!progress) return;

        const newCount = progress.reviewCount || (reviewCount + 1);
        const reviewTime = progress.lastReviewAt || new Date().toISOString();
        const reviewDate = new Date(reviewTime);
        const todayStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2,'0')}-${String(reviewDate.getDate()).padStart(2,'0')}`;

        card.classList.add('reviewed');
        card.dataset.reviewStage = String(reviewStage);
        card.title = "✅ 已完成本次复盘";
        const currentBadge = card.querySelector('.review-count-badge');
        if (currentBadge) currentBadge.textContent = `第${newCount}轮复习于 ${todayStr}`;
        card.style.transform = 'scale(1.1)';
        setTimeout(() => { if (card) card.style.transform = ''; }, 200);

        // 【核心体验】同步更新推荐区等其他同题卡片，但不覆盖当前卡片的即时视觉反馈
        document.querySelectorAll(`.review-card-target[data-problem-id="${problemNum}"]`).forEach(node => {
            if (node === card) return;
            if (node.dataset.reviewStage !== String(reviewStage)) return;
            node.classList.add('reviewed');
            node.dataset.reviewStage = String(reviewStage);
            node.title = "✅ 已完成本次复盘";
            const badge = node.querySelector('.review-count-badge');
            if (badge) badge.textContent = `第${newCount}轮复习于 ${todayStr}`;
            node.style.transform = 'scale(1.1)';
            setTimeout(() => { if (node) node.style.transform = ''; }, 200);
        });

        updateGlobalStats(); // 刷新今日答题统计
        renderReviewContainer();
    };

    if (problemInfo.url) {
        const linkBtn = document.createElement('button');
        linkBtn.className = 'link-btn';
        linkBtn.innerHTML = '🔗';
        linkBtn.title = '跳转到题目页面';
        linkBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(problemInfo.url, '_blank');
        };
        // 还原回挂载至拥有 position: relative 的 wrapper，防止被 overflow: hidden 裁剪，且 CSS 已修复 hover 支持
        wrapper.appendChild(linkBtn);
    }
    
    wrapper.appendChild(card);
    return wrapper;
}

/**
 * 初始化悬浮按钮拖拽逻辑
 */
function initFloatingReviewBtn() {
    const btn = document.getElementById('floatingReviewBtn');
    if(!btn) return;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    btn.addEventListener('mousedown', dragStart);
    btn.addEventListener('touchstart', dragStart, {passive: false});

    function dragStart(e) {
        if(e.type === "touchstart") {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        
        // 获取实际的 left/top 值，防止 left == 'auto' 导致的问题
        const rect = btn.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        btn.style.transition = 'none';
        btn.classList.remove('docked', 'docked-left', 'docked-right');
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, {passive: false});
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        
        btn.setAttribute('data-moved', 'false');
    }

    function drag(e) {
        let currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        let currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
        
        let dx = currentX - startX;
        let dy = currentY - startY;
        
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            btn.setAttribute('data-moved', 'true');
            isDragging = true;
        }
        
        let newX = initialX + dx;
        let newY = initialY + dy;
        
        newX = Math.max(0, Math.min(newX, window.innerWidth - btn.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - btn.offsetHeight));
        
        btn.style.left = newX + 'px';
        btn.style.top = newY + 'px';
    }

    function dragEnd(e) {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
        
        btn.style.transition = 'left 0.3s ease, top 0.3s ease, transform 0.3s ease, opacity 0.3s ease';
        
        setTimeout(() => {
            const rect = btn.getBoundingClientRect();
            let currentX = rect.left + (btn.offsetWidth / 2);
            let centerX = window.innerWidth / 2;
            
            if (currentX < centerX) {
                btn.style.left = '0px';
                btn.classList.add('docked-left');
            } else {
                btn.style.left = (window.innerWidth - btn.offsetWidth) + 'px';
                btn.classList.add('docked-right');
            }
            btn.classList.add('docked');
        }, 50);
        
        setTimeout(() => {
            isDragging = false;
        }, 100);
    }
    
    btn.addEventListener('click', (e) => {
        if (btn.getAttribute('data-moved') === 'true' || isDragging) {
            e.preventDefault();
            btn.setAttribute('data-moved', 'false'); // reset
            return;
        }
        openReviewModal();
    });

    window.addEventListener('resize', () => {
        if (btn.classList.contains('docked-right')) {
            btn.style.left = (window.innerWidth - btn.offsetWidth) + 'px';
        }
    });
}

document.addEventListener('DOMContentLoaded', initFloatingReviewBtn);
