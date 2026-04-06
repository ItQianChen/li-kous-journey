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

const reviewWorkspaceState = {
    stage: 0,
    category: 'all',
    count: 10,
    items: [],
    isOpen: false
};

function getReviewWorkspaceStorageKey() {
    return currentUser ? `reviewWorkspaceState_${currentUser}` : null;
}

function serializeReviewWorkspaceItems(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
        id: item.id,
        reviewStage: Number(item.reviewStage) || 0,
        categoryName: item.categoryName || ''
    }));
}

function hydrateReviewWorkspaceItem(rawItem) {
    if (!rawItem || rawItem.id === undefined || rawItem.id === null) return null;

    const reviewStage = Number(rawItem.reviewStage);
    if (!Number.isInteger(reviewStage) || reviewStage < 0) return null;

    const progress = getProblemProgress(rawItem.id);
    if (!progress || !progress.solvedAt) return null;

    return {
        id: rawItem.id,
        reviewCount: Number(progress.reviewCount) || 0,
        reviewStage,
        solvedAt: progress.solvedAt,
        lastReviewAt: progress.lastReviewAt,
        reviewHistory: Array.isArray(progress.reviewHistory) ? [...progress.reviewHistory] : [],
        categoryName: rawItem.categoryName || ''
    };
}

function saveReviewWorkspaceState() {
    const storageKey = getReviewWorkspaceStorageKey();
    if (!storageKey) return;

    localStorage.setItem(storageKey, JSON.stringify({
        stage: reviewWorkspaceState.stage,
        category: reviewWorkspaceState.category,
        count: reviewWorkspaceState.count,
        items: serializeReviewWorkspaceItems(reviewWorkspaceState.items),
        isOpen: reviewWorkspaceState.isOpen === true
    }));
}

function loadReviewWorkspaceState() {
    const storageKey = getReviewWorkspaceStorageKey();
    if (!storageKey) return;

    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        if (Number.isInteger(Number(parsed.stage))) {
            reviewWorkspaceState.stage = Number(parsed.stage);
        }
        if (typeof parsed.category === 'string' && parsed.category.trim()) {
            reviewWorkspaceState.category = parsed.category;
        }
        if (Number.isInteger(Number(parsed.count))) {
            reviewWorkspaceState.count = Number(parsed.count);
        }
        reviewWorkspaceState.items = Array.isArray(parsed.items)
            ? parsed.items.map(hydrateReviewWorkspaceItem).filter(Boolean)
            : [];
        reviewWorkspaceState.isOpen = parsed.isOpen === true;
    } catch (error) {
        localStorage.removeItem(storageKey);
    }
}

function restoreReviewWorkspaceOnEntry() {
    loadReviewWorkspaceState();
    if (!reviewWorkspaceState.isOpen) return;
    openReviewWorkspace();
}

function renderReviewWorkspaceFlatPicker({
    containerId,
    selectId,
    triggerMeta,
    emptyText,
    onSelect
}) {
    const container = document.getElementById(containerId);
    const select = document.getElementById(selectId);
    if (!container || !select) return;

    const options = Array.from(select.options || []).map(option => ({
        value: option.value,
        label: option.textContent || option.label || option.value,
        disabled: option.disabled
    }));
    const activeValue = select.value;
    const activeOption = options.find(option => option.value === activeValue) || options[0];
    const pickerVariant = selectId === 'reviewWorkspaceCount' ? 'count' : 'stage';

    container.innerHTML = `
        <div class="rw-selectbox rw-selectbox-flat rw-selectbox-${pickerVariant}">
            <button type="button" class="rw-selectbox-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="rw-selectbox-trigger-text">
                    <span class="rw-selectbox-trigger-label">${activeOption ? activeOption.label : emptyText}</span>
                    <span class="rw-selectbox-trigger-meta">${triggerMeta}</span>
                </span>
                <span class="rw-selectbox-trigger-icon">▾</span>
            </button>
            <div class="rw-selectbox-panel rw-selectbox-panel-flat" role="listbox">
                ${options.map(option => `
                    <button
                        type="button"
                        class="rw-selectbox-option ${option.value === activeValue ? 'is-selected' : ''} ${option.disabled ? 'is-disabled' : ''}"
                        data-picker-value="${option.value}"
                        ${option.disabled ? 'disabled' : ''}
                    >
                        <span class="rw-selectbox-option-main">
                            <span class="rw-selectbox-option-title">${option.label}</span>
                            <span class="rw-selectbox-option-subtitle">${option.value === activeValue ? '当前已选中' : triggerMeta}</span>
                        </span>
                    </button>
                `).join('') || `<div class="rw-selectbox-empty">${emptyText}</div>`}
            </div>
        </div>
    `;

    const root = container.querySelector('.rw-selectbox');
    const trigger = container.querySelector('.rw-selectbox-trigger');
    const panel = container.querySelector('.rw-selectbox-panel');
    if (!root || !trigger || !panel) return;

    trigger.addEventListener('click', event => {
        event.stopPropagation();
        const shouldOpen = !root.classList.contains('is-open');
        closeReviewWorkspaceCategoryTrees();
        root.classList.toggle('is-open', shouldOpen);
        trigger.setAttribute('aria-expanded', String(shouldOpen));
    });

    panel.addEventListener('click', event => {
        event.stopPropagation();
    });

    container.querySelectorAll('[data-picker-value]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            const value = button.dataset.pickerValue;
            if (value === undefined) return;
            select.value = value;
            closeReviewWorkspaceCategoryTrees();
            onSelect();
        });
    });
}

function renderReviewWorkspaceStagePicker() {
    renderReviewWorkspaceFlatPicker({
        containerId: 'reviewWorkspaceStagePicker',
        selectId: 'reviewWorkspaceStageSelect',
        triggerMeta: '切换当前要推进的复习阶段',
        emptyText: '暂无可复习阶段',
        onSelect: handleReviewWorkspaceStageChange
    });
}

function renderReviewWorkspaceCountPicker() {
    renderReviewWorkspaceFlatPicker({
        containerId: 'reviewWorkspaceCountPicker',
        selectId: 'reviewWorkspaceCount',
        triggerMeta: '控制本次随机抽取题目数量',
        emptyText: '暂无可选数量',
        onSelect: handleReviewWorkspaceCountChange
    });
}

function syncReviewWorkspaceStageOptions() {
    const select = document.getElementById('reviewWorkspaceStageSelect');
    if (!select) return;

    const hierarchy = generateAllReviewProblemsGrouped();
    if (hierarchy.length === 0) {
        select.innerHTML = '<option value="-1">暂无可复习内容</option>';
        reviewWorkspaceState.stage = -1;
        renderReviewWorkspaceStagePicker();
        return;
    }

    select.innerHTML = hierarchy.map((stageItem, index) =>
        `<option value="${index}">${stageItem.name}</option>`
    ).join('');

    const targetStage = reviewWorkspaceState.stage;
    const hasCurrent = hierarchy[targetStage] !== undefined;
    
    if (hasCurrent) {
        select.value = targetStage;
    } else {
        select.value = "0";
        reviewWorkspaceState.stage = 0;
    }

    renderReviewWorkspaceStagePicker();
}

function getReviewWorkspaceStageCategoryOptions(stageIndex) {
    const hierarchy = generateAllReviewProblemsGrouped();
    const stageData = hierarchy[stageIndex];
    if (!stageData || !stageData.roundGroups) {
        return [{ value: 'all', label: '当前阶段全部分类', count: 0 }];
    }

    const totalCount = stageData.roundGroups.reduce((sum, group) => sum + (group.problems || []).length, 0);
    const result = [{ value: 'all', label: '当前阶段所有大分类与子分类', count: totalCount }];

    stageData.roundGroups.forEach(rg => {
        const groupCount = (rg.problems || []).length;
        const optgroup = {
            label: rg.name,
            roundKey: rg.roundKey,
            count: groupCount,
            options: [{ value: `${rg.roundKey}::all`, label: '全部子分类', count: groupCount, kind: 'group-all' }]
        };

        (rg.categories || []).forEach(cat => {
            optgroup.options.push({
                value: `${rg.roundKey}::${cat.name}`,
                label: cat.name,
                count: (cat.problems || []).length,
                kind: 'category'
            });
        });
        result.push(optgroup);
    });
    return result;
}

function getReviewWorkspaceCategoryText(categoryValue) {
    if (categoryValue === 'all') return '当前阶段所有分类';
    const parts = (categoryValue || '').split('::');
    if (parts.length === 2) {
        if (parts[1] === 'all') return `${problemsData[parts[0]]?.name || parts[0]} 全部子分类`;
        return `${problemsData[parts[0]]?.name || parts[0]} · ${parts[1]}`;
    }
    return categoryValue || '未选择分类';
}

function closeReviewWorkspaceCategoryTrees() {
    document.querySelectorAll('.rw-selectbox.is-open').forEach(root => {
        root.classList.remove('is-open');
        const trigger = root.querySelector('.rw-selectbox-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function renderReviewWorkspaceCategoryTree(optionsData) {
    const container = document.getElementById('reviewWorkspaceCategoryTree');
    const select = document.getElementById('reviewWorkspaceCategorySelect');
    if (!container || !select) return;

    const activeValue = select.value || 'all';
    const summaryOption = optionsData[0] || { value: 'all', label: '当前阶段所有大分类与子分类', count: 0 };
    const groups = optionsData.filter(item => item.options);

    container.innerHTML = `
        <div class="rw-selectbox rw-selectbox-category">
            <button type="button" class="rw-selectbox-trigger" aria-haspopup="dialog" aria-expanded="false">
                <span class="rw-selectbox-trigger-text">
                    <span class="rw-selectbox-trigger-label">${getReviewWorkspaceCategoryText(activeValue)}</span>
                    <span class="rw-selectbox-trigger-meta">按大分类 / 子分类筛选</span>
                </span>
                <span class="rw-selectbox-trigger-icon">▾</span>
            </button>
            <div class="rw-selectbox-panel rw-selectbox-panel-category">
                <button type="button" class="rw-selectbox-option rw-selectbox-option-root ${activeValue === 'all' ? 'is-selected' : ''}" data-category-value="all">
                    <span class="rw-selectbox-option-main">
                        <span class="rw-selectbox-option-title">${summaryOption.label}</span>
                        <span class="rw-selectbox-option-subtitle">直接覆盖当前复习阶段的全部题目</span>
                    </span>
                    <span class="rw-selectbox-option-count">${summaryOption.count} 题</span>
                </button>
                ${groups.map(group => `
                    <details class="rw-selectbox-group">
                        <summary class="rw-selectbox-group-summary">
                            <span class="rw-selectbox-group-main">
                                <span class="rw-selectbox-group-title">${group.label}</span>
                                <span class="rw-selectbox-group-subtitle">点击展开或折叠该大分类下的小分类</span>
                            </span>
                            <span class="rw-selectbox-group-meta">
                                <span class="rw-selectbox-group-count">${group.count} 题</span>
                                <span class="rw-selectbox-group-arrow">▾</span>
                            </span>
                        </summary>
                        <div class="rw-selectbox-children">
                            ${group.options.map(option => `
                                <button type="button" class="rw-selectbox-option ${activeValue === option.value ? 'is-selected' : ''} ${option.kind === 'group-all' ? 'is-group-all' : ''}" data-category-value="${option.value}">
                                    <span class="rw-selectbox-option-main">
                                        <span class="rw-selectbox-option-title">${option.label}</span>
                                        <span class="rw-selectbox-option-subtitle">${option.kind === 'group-all' ? '覆盖当前大分类下全部子分类题目' : '只抽取当前子分类题目'}</span>
                                    </span>
                                    <span class="rw-selectbox-option-count">${option.count} 题</span>
                                </button>
                            `).join('')}
                        </div>
                    </details>
                `).join('')}
            </div>
        </div>
    `;

    const root = container.querySelector('.rw-selectbox');
    const trigger = container.querySelector('.rw-selectbox-trigger');
    const panel = container.querySelector('.rw-selectbox-panel');
    if (!root || !trigger || !panel) return;

    trigger.addEventListener('click', event => {
        event.stopPropagation();
        const shouldOpen = !root.classList.contains('is-open');
        closeReviewWorkspaceCategoryTrees();
        root.classList.toggle('is-open', shouldOpen);
        trigger.setAttribute('aria-expanded', String(shouldOpen));
    });

    panel.addEventListener('click', event => {
        event.stopPropagation();
    });

    container.querySelectorAll('[data-category-value]').forEach(button => {
        button.addEventListener('click', () => {
            select.value = button.dataset.categoryValue || 'all';
            closeReviewWorkspaceCategoryTrees();
            handleReviewWorkspaceCategoryChange();
        });
    });

    if (!window.reviewWorkspaceTreeSelectDocBound) {
        document.addEventListener('click', () => closeReviewWorkspaceCategoryTrees());
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeReviewWorkspaceCategoryTrees();
            }
        });
        window.reviewWorkspaceTreeSelectDocBound = true;
    }
}

function syncReviewWorkspaceStageCategoryOptions(stageIndex) {
    const select = document.getElementById('reviewWorkspaceCategorySelect');
    if (!select) return;

    const optionsData = getReviewWorkspaceStageCategoryOptions(stageIndex);
    let html = '';
    optionsData.forEach(item => {
        if (item.options) {
            html += `<optgroup label="${item.label}">`;
            item.options.forEach(opt => {
                html += `<option value="${opt.value}">${opt.label}</option>`;
            });
            html += `</optgroup>`;
        } else {
            html += `<option value="${item.value}">${item.label}</option>`;
        }
    });
    select.innerHTML = html;

    const flatOptions = optionsData.flatMap(item => item.options ? item.options.map(option => option.value) : [item.value]);
    const fallbackValue = 'all';
    const hasCurrent = flatOptions.includes(reviewWorkspaceState.category);
    select.value = hasCurrent ? reviewWorkspaceState.category : fallbackValue;
    reviewWorkspaceState.category = select.value;
    renderReviewWorkspaceCategoryTree(optionsData);
}

function getReviewWorkspaceCategoryLabel() {
    return getReviewWorkspaceCategoryText(reviewWorkspaceState.category);
}

function collectStageReviewItems(stageIndex, categoryVal) {
    const hierarchy = generateAllReviewProblemsGrouped();
    const stageData = hierarchy[stageIndex];
    if (!stageData) return [];

    let items = [];
    
    if (categoryVal === 'all') {
        stageData.roundGroups.forEach(rg => {
            items = items.concat(rg.problems || []);
        });
    } else {
        const parts = categoryVal.split('::');
        const rKey = parts[0];
        const cName = parts[1];
        
        const rg = stageData.roundGroups.find(g => g.roundKey === rKey);
        if (rg) {
            if (cName === 'all') {
                items = items.concat(rg.problems || []);
            } else {
                const category = (rg.categories || []).find(c => c.name === cName);
                if (category) items = items.concat(category.problems || []);
            }
        }
    }

    return Array.from(new Map(items.map(item => [item.id, item])).values());
}

function getStageSourceLabel(stageIndex) {
    const hierarchy = generateAllReviewProblemsGrouped();
    const stageData = hierarchy[stageIndex];
    return stageData ? stageData.name : '未知阶段';
}

function getStageGroupedCategories(stageIndex) {
    const hierarchy = generateAllReviewProblemsGrouped();
    const stageData = hierarchy[stageIndex];
    if (!stageData) return [];

    return stageData.roundGroups.map(rg => {
        const categories = (rg.categories || []).filter(cat => (cat.problems || []).length > 0);
        const totalProbs = categories.reduce((sum, c) => sum + c.problems.length, 0);

        return {
            roundKey: rg.roundKey,
            name: rg.name,
            categories,
            totalProbs
        };
    }).filter(rg => rg.totalProbs > 0);
}

function buildReviewMetaText(reviewCount, solvedAt, lastReviewAt, reviewHistory) {
    const history = Array.isArray(reviewHistory) ? reviewHistory : [];

    if (reviewCount === 0 && solvedAt) {
        const date = new Date(solvedAt);
        return `首刷于 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    const referenceTime = history[reviewCount - 1] || lastReviewAt;
    if (referenceTime) {
        const date = new Date(referenceTime);
        return `第${reviewCount}轮复习于 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    return `复习过 ${reviewCount} 次`;
}

function getReviewWorkspaceDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getReviewWorkspaceCompletedAt(item) {
    if (!item) return null;

    const history = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
    const reviewStage = Number(item.reviewStage);
    if (!Number.isInteger(reviewStage) || reviewStage < 0) return null;

    return history[reviewStage] || null;
}

function findReviewWorkspaceCategoryName(roundKey, problemId) {
    const roundData = problemsData[roundKey];
    if (!roundData || !Array.isArray(roundData.categories)) {
        return '';
    }

    const targetId = problemId.toString();
    const category = roundData.categories.find(item =>
        Array.isArray(item.problems)
        && item.problems.some(problemNum => problemNum.toString() === targetId)
    );

    return category?.name || '';
}

function collectReviewWorkspaceStageUniverseItems(stageIndex) {
    if (!Number.isInteger(stageIndex) || stageIndex < 0) {
        return [];
    }

    const items = [];
    const seen = new Set();

    getOrderedRoundKeys().forEach(roundKey => {
        const roundProgress = userProgress?.[roundKey];
        if (!roundProgress || typeof roundProgress !== 'object') {
            return;
        }

        Object.entries(roundProgress).forEach(([problemId, progress]) => {
            if (!progress || !progress.solvedAt || seen.has(problemId)) {
                return;
            }

            const reviewCount = Number(progress.reviewCount) || 0;
            if (reviewCount < stageIndex) {
                return;
            }

            seen.add(problemId);
            items.push({
                id: problemId,
                reviewCount,
                reviewStage: stageIndex,
                solvedAt: progress.solvedAt,
                lastReviewAt: progress.lastReviewAt,
                reviewHistory: Array.isArray(progress.reviewHistory) ? [...progress.reviewHistory] : [],
                categoryName: findReviewWorkspaceCategoryName(roundKey, problemId)
            });
        });
    });

    return items;
}

function syncReviewedCardState(problemNum, reviewStage, newCount, todayStr) {
    document.querySelectorAll(`.review-card-target[data-problem-id="${problemNum}"]`).forEach(node => {
        if (node.dataset.reviewStage !== String(reviewStage)) return;
        node.classList.add('reviewed');
        node.dataset.reviewStage = String(reviewStage);
        node.title = '✅ 已完成本次复盘';
        const badge = node.querySelector('.review-count-badge, .review-workspace-card-badge, .review-card-meta');
        if (badge) badge.textContent = `第${newCount}轮复习于 ${todayStr}`;
        const doneButton = node.querySelector('.review-inline-complete-btn, .review-card-complete');
        if (doneButton) {
            doneButton.disabled = true;
            doneButton.textContent = '✅ 本轮已完成';
        }
        node.style.transform = 'scale(1.1)';
        setTimeout(() => { if (node) node.style.transform = ''; }, 200);
    });
}

function markReviewCardDone(problemNum, reviewStage, targetNode, completeButton) {
    if (targetNode && targetNode.classList.contains('reviewed')) return;

    markProblemReviewed(null, problemNum);
    if (currentUser) {
        loadUserProgress();
    }

    const progress = getProblemProgress(problemNum);
    if (!progress) return;

    const newCount = progress.reviewCount || 0;
    const reviewTime = progress.lastReviewAt || new Date().toISOString();
    const reviewDate = new Date(reviewTime);
    const todayStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2,'0')}-${String(reviewDate.getDate()).padStart(2,'0')}`;

    syncReviewedCardState(problemNum, reviewStage, newCount, todayStr);
    syncReviewWorkspaceItemsFromProgress();
    saveReviewWorkspaceState();
    updateGlobalStats();
    renderReviewContainer();
    refreshReviewWorkspaceStats();
}

function buildReviewWorkspaceCardHTML(item, sourceLabel) {
    const problemInfo = allProblems.find(p => p.id.toString() === item.id.toString());
    if (!problemInfo) return null;

    const isReviewedToday = isReviewItemCompletedToday(item);

    const card = document.createElement('div');
    card.className = `review-workspace-card review-card-target ${isReviewedToday ? 'reviewed' : ''}`;
    card.dataset.problemId = item.id;
    card.dataset.reviewStage = String(item.reviewStage);

    const metaText = buildReviewMetaText(item.reviewCount, item.solvedAt, item.lastReviewAt, item.reviewHistory);
    const stageName = `第${item.reviewStage + 1}轮复习`;
    const categoryName = item.categoryName || '未分类';

    card.innerHTML = `
        <div class="review-workspace-card-header">
            <div>
                <div class="review-workspace-card-number">#${item.id}</div>
                <div class="review-workspace-card-title">${problemInfo.title}</div>
            </div>
            <div class="review-workspace-card-badge">${isReviewedToday ? '✅ 今日已复习' : metaText}</div>
        </div>
        <div class="review-workspace-card-meta">
            <span>${sourceLabel}</span>
            <span>${categoryName}</span>
            <span>${stageName}</span>
        </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'review-workspace-card-actions';

    const linkBtn = document.createElement('button');
    linkBtn.className = 'review-card-link';
    linkBtn.textContent = '🔗 去力扣';
    linkBtn.onclick = () => {
        if (problemInfo.url) window.open(problemInfo.url, '_blank');
    };
    actions.appendChild(linkBtn);

    const completeBtn = document.createElement('button');
    completeBtn.className = 'review-card-complete';
    completeBtn.textContent = isReviewedToday ? '✅ 本轮已完成' : '标记已复习';
    completeBtn.disabled = isReviewedToday;
    completeBtn.onclick = () => markReviewCardDone(item.id, item.reviewStage, card, completeBtn);
    actions.appendChild(completeBtn);

    card.appendChild(actions);
    return card;
}

function isReviewItemCompletedToday(item) {
    const completedAt = getReviewWorkspaceCompletedAt(item);
    if (!completedAt) return false;

    return getReviewWorkspaceDateKey(completedAt) === getReviewWorkspaceDateKey();
}

function getReviewWorkspaceSummaryItems(stageIndex = reviewWorkspaceState.stage) {
    return collectReviewWorkspaceStageUniverseItems(stageIndex).map(item => ({ ...item }));
}

function loadReviewWorkspaceDailyStatsFromCache() {
    if (currentUser) {
        loadUserProgress();
    }

    syncReviewWorkspaceItemsFromProgress();

    const summaryItems = getReviewWorkspaceSummaryItems();
    const pendingItems = collectStageReviewItems(reviewWorkspaceState.stage, 'all');
    const todayCompletedItems = summaryItems
        .filter(isReviewItemCompletedToday)
        .sort((a, b) => {
            const aTime = new Date(getReviewWorkspaceCompletedAt(a) || 0).getTime();
            const bTime = new Date(getReviewWorkspaceCompletedAt(b) || 0).getTime();
            return bTime - aTime;
        });

    return {
        summaryItems,
        todayCompletedItems,
        pendingCount: pendingItems.length,
        completedCount: Math.max(summaryItems.length - pendingItems.length, 0)
    };
}

function getReviewWorkspaceOverviewItems() {
    return getReviewWorkspaceSummaryItems();
}

function getReviewWorkspaceTodayCompletedItems() {
    return loadReviewWorkspaceDailyStatsFromCache().todayCompletedItems;
}

function renderReviewWorkspaceRecentList(todayCompletedItems) {
    const list = document.getElementById('reviewWorkspaceRecentList');
    if (!list) return;

    const title = document.querySelector('.review-workspace-summary-panel .review-workspace-summary-card:nth-child(2) h3');
    if (title) {
        title.textContent = '今日完成';
    }

    if (!todayCompletedItems.length) {
        list.innerHTML = '<p class="review-workspace-recent-empty">今天还没有完成记录。</p>';
        return;
    }

    list.innerHTML = todayCompletedItems.map(item => {
        const problemInfo = allProblems.find(problem => problem.id.toString() === item.id.toString());
        const titleText = problemInfo ? problemInfo.title : '题目已不存在';
        return `
            <div class="review-workspace-recent-item">
                <strong>#${item.id}</strong>
                <span>${titleText}</span>
            </div>
        `;
    }).join('');
}

function refreshReviewWorkspaceStats() {
    const progressNode = document.getElementById('reviewWorkspaceProgress');
    const sourceNode = document.getElementById('reviewWorkspaceSourceLabel');
    const pendingNode = document.getElementById('reviewWorkspacePendingCount');
    const doneNode = document.getElementById('reviewWorkspaceDoneCount');
    const categoryLabelNode = document.getElementById('reviewWorkspaceCategoryLabel');
    const overviewCountNode = document.getElementById('reviewWorkspaceOverviewCount');
    if (!progressNode || !sourceNode || !pendingNode || !doneNode || !categoryLabelNode || !overviewCountNode) return;

    const { summaryItems, todayCompletedItems, pendingCount, completedCount } = loadReviewWorkspaceDailyStatsFromCache();
    const sourceLabel = reviewWorkspaceState.stage >= 0 ? getStageSourceLabel(reviewWorkspaceState.stage) : '暂无数据';

    progressNode.textContent = `${completedCount} / ${summaryItems.length}`;
    sourceNode.textContent = sourceLabel;
    categoryLabelNode.textContent = getReviewWorkspaceCategoryLabel();
    overviewCountNode.textContent = `${summaryItems.length} 道题`;
    pendingNode.textContent = String(pendingCount);
    doneNode.textContent = String(todayCompletedItems.length);
    saveReviewWorkspaceState();
    renderReviewWorkspaceRecentList(todayCompletedItems);
}

function getFreshReviewWorkspaceItems() {
    return collectStageReviewItems(reviewWorkspaceState.stage, reviewWorkspaceState.category)
        .sort((a, b) => {
            const aReviewed = a.reviewCount > a.reviewStage ? 1 : 0;
            const bReviewed = b.reviewCount > b.reviewStage ? 1 : 0;
            if (aReviewed !== bReviewed) return aReviewed - bReviewed;
            return a.id - b.id;
        })
        .slice(0, reviewWorkspaceState.count);
}

function syncReviewWorkspaceItemsFromProgress() {
    reviewWorkspaceState.items = reviewWorkspaceState.items
        .map(hydrateReviewWorkspaceItem)
        .filter(Boolean);
}

function drawReviewWorkspaceProblems(forceRefresh = true) {
    const grid = document.getElementById('reviewWorkspaceGrid');
    const empty = document.getElementById('reviewWorkspaceEmpty');
    const desc = document.getElementById('reviewWorkspaceDesc');
    if (!grid || !empty || !desc) return;

    if (reviewWorkspaceState.stage === -1) {
        reviewWorkspaceState.items = [];
        saveReviewWorkspaceState();
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    const sourceLabel = reviewWorkspaceState.category === 'all'
        ? getStageSourceLabel(reviewWorkspaceState.stage)
        : `${getStageSourceLabel(reviewWorkspaceState.stage)} · ${getReviewWorkspaceCategoryLabel()}`;

    if (forceRefresh || !reviewWorkspaceState.items.length) {
        reviewWorkspaceState.items = getFreshReviewWorkspaceItems();
    } else {
        syncReviewWorkspaceItemsFromProgress();
        if (!reviewWorkspaceState.items.length) {
            reviewWorkspaceState.items = getFreshReviewWorkspaceItems();
        }
    }

    const items = reviewWorkspaceState.items;
    saveReviewWorkspaceState();
    desc.textContent = `当前已按 ${sourceLabel} 抽取 ${items.length} 道题。先去力扣做题，再回来标记本轮复习。`;

    grid.innerHTML = '';
    if (!items.length) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        items.forEach(item => {
            const card = buildReviewWorkspaceCardHTML(item, sourceLabel);
            if (card) grid.appendChild(card);
        });
    }
}

function renderReviewWorkspaceCategoryGroups(roundGroups, container) {
    if (!container) return;

    if (!roundGroups.length) {
        container.innerHTML = '<p class="review-workspace-group-empty">当前条件下暂无分类题目。</p>';
        return;
    }

    container.innerHTML = '';

    roundGroups.forEach(rg => {
        const roundGroup = document.createElement('details');
        roundGroup.className = 'review-workspace-round-group';
        roundGroup.style.marginBottom = '1rem';
        roundGroup.style.border = '1px solid #ffe0b2';
        roundGroup.style.borderRadius = '12px';
        roundGroup.style.background = '#fffdf8';
        roundGroup.style.overflow = 'hidden';

        roundGroup.innerHTML = `
            <summary style="padding: 1rem; background: #fff8e1; cursor: pointer; font-weight: bold; color: #ef6c00; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>📚 ${rg.name} (大分类)</span>
                <span class="review-workspace-category-group-badge" style="background:rgba(255, 152, 0, 0.2); padding:2px 8px; border-radius:12px; font-size:0.8rem; color: #e65100;">共 ${rg.totalProbs} 题 ▼</span>
            </summary>
            <div class="review-workspace-round-group-body" style="padding: 0.5rem 1rem;"></div>
        `;

        const roundBody = roundGroup.querySelector('.review-workspace-round-group-body');
        if (!roundBody) return;

        rg.categories.forEach(category => {
            const categoryGroup = document.createElement('details');
            categoryGroup.className = 'review-workspace-category-group';
            categoryGroup.style.marginBottom = '0.8rem';
            categoryGroup.style.borderBottom = '1px dashed #ffcc80';

            categoryGroup.innerHTML = `
                <summary class="review-workspace-category-group-header" style="padding: 0.5rem; cursor:pointer; user-select:none; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h4 style="margin:0; color:#5d4037;">${category.name}</h4>
                    </div>
                    <span class="review-workspace-category-group-badge" style="background:#e0e0e0; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${category.problems.length} 题</span>
                </summary>
                <div class="review-workspace-category-problems" style="margin-top:0.5rem; padding-bottom:0.5rem;"></div>
            `;

            const problemsContainer = categoryGroup.querySelector('.review-workspace-category-problems');
            if (!problemsContainer) {
                roundBody.appendChild(categoryGroup);
                return;
            }

            const sourceLabel = `${rg.name} · ${category.name}`;
            category.problems.forEach(problem => {
                const card = buildReviewWorkspaceCardHTML(problem, sourceLabel);
                if (card) {
                    problemsContainer.appendChild(card);
                }
            });

            if (!problemsContainer.children.length) {
                problemsContainer.innerHTML = '<p class="review-workspace-group-empty">当前分类暂无题目。</p>';
            }

            roundBody.appendChild(categoryGroup);
        });

        container.appendChild(roundGroup);
    });
}
function renderReviewWorkspace() {
    const groupedContainer = document.getElementById('reviewWorkspaceGroupedContainer');
    const countSelect = document.getElementById('reviewWorkspaceCount');
    if (!groupedContainer || !countSelect) return;

    syncReviewWorkspaceStageOptions();
    
    if (reviewWorkspaceState.stage === -1) {
        groupedContainer.innerHTML = '<p class="review-workspace-group-empty">先去题库打卡吧，暂无可复习题目。</p>';
        drawReviewWorkspaceProblems(false);
        refreshReviewWorkspaceStats();
        return;
    }
    
    syncReviewWorkspaceStageCategoryOptions(reviewWorkspaceState.stage);
    countSelect.value = String(reviewWorkspaceState.count);
    renderReviewWorkspaceCountPicker();

    const groupedCategories = getStageGroupedCategories(reviewWorkspaceState.stage);

    groupedContainer.innerHTML = '';
    renderReviewWorkspaceCategoryGroups(groupedCategories, groupedContainer);
    drawReviewWorkspaceProblems(false);
    saveReviewWorkspaceState();
    refreshReviewWorkspaceStats();
}

function handleReviewWorkspaceStageChange() {
    const select = document.getElementById('reviewWorkspaceStageSelect');
    if (!select) return;
    reviewWorkspaceState.stage = Number(select.value);
    reviewWorkspaceState.category = 'all';
    reviewWorkspaceState.items = [];
    renderReviewWorkspace();
}

function handleReviewWorkspaceCategoryChange() {
    const select = document.getElementById('reviewWorkspaceCategorySelect');
    if (!select) return;
    reviewWorkspaceState.category = select.value;
    reviewWorkspaceState.items = [];
    renderReviewWorkspaceCategoryTree(getReviewWorkspaceStageCategoryOptions(reviewWorkspaceState.stage));

    drawReviewWorkspaceProblems(true);

    saveReviewWorkspaceState();
    refreshReviewWorkspaceStats();
}

function handleReviewWorkspaceCountChange(skipPickerSync) {
    const select = document.getElementById('reviewWorkspaceCount');
    if (!select) return;
    reviewWorkspaceState.count = Number(select.value) || 10;
    reviewWorkspaceState.items = [];
    if (!skipPickerSync) {
        renderReviewWorkspaceCountPicker();
    }
    
    drawReviewWorkspaceProblems(true);
    
    saveReviewWorkspaceState();
    refreshReviewWorkspaceStats();
}

function resolveReviewWorkspaceTarget(forceTarget, hierarchy) {
    if (typeof forceTarget === 'number' && hierarchy[forceTarget]) {
        return { stage: forceTarget, category: 'all' };
    }

    if (typeof forceTarget !== 'string') {
        return null;
    }

    const normalized = forceTarget.trim();
    const stageMatch = normalized.match(/^stage-(\d+)/);
    if (stageMatch) {
        const stageIndex = Number(stageMatch[1]);
        return hierarchy[stageIndex] ? { stage: stageIndex, category: 'all' } : null;
    }

    const stageIndex = hierarchy.findIndex(stageItem =>
        (stageItem.roundGroups || []).some(group => group.roundKey === normalized)
    );

    if (stageIndex === -1) {
        return null;
    }

    return {
        stage: stageIndex,
        category: `${normalized}::all`
    };
}

function openReviewWorkspace(forceStageIndex) {
    const workspace = document.getElementById('reviewWorkspace');
    if (!workspace) return;

    loadReviewWorkspaceState();
    
    const hierarchy = generateAllReviewProblemsGrouped();
    if (hierarchy.length > 0) {
        const forcedTarget = resolveReviewWorkspaceTarget(forceStageIndex, hierarchy);

        if (forcedTarget) {
            reviewWorkspaceState.stage = forcedTarget.stage;
            reviewWorkspaceState.category = forcedTarget.category;
            reviewWorkspaceState.items = [];
        } else if (reviewWorkspaceState.stage >= hierarchy.length || reviewWorkspaceState.stage < 0) {
            reviewWorkspaceState.stage = 0;
            reviewWorkspaceState.category = 'all';
            reviewWorkspaceState.items = [];
        }
    } else {
        reviewWorkspaceState.stage = -1;
        reviewWorkspaceState.items = [];
    }

    workspace.style.display = 'block';
    document.body.style.overflow = 'hidden';
    reviewWorkspaceState.isOpen = true;
    saveReviewWorkspaceState();
    renderReviewWorkspace();
}

function openReviewWorkspaceFromModal() {
    closeReviewModal();
    openReviewWorkspace();
}

function closeReviewWorkspace() {
    const workspace = document.getElementById('reviewWorkspace');
    if (!workspace) return;

    workspace.style.display = 'none';
    document.body.style.overflow = '';
    reviewWorkspaceState.isOpen = false;
    saveReviewWorkspaceState();
}

function renderReviewWorkspaceGroupedHierarchy(hierarchy, container) {
    container.innerHTML = '';

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
        let isExpanded = true;
        contentDiv.style.display = 'block';

        stageLabel.onclick = () => {
            isExpanded = !isExpanded;
            contentDiv.style.display = isExpanded ? 'block' : 'none';
            stageLabel.querySelector('.stage-icon').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        };

        stage.roundGroups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'review-group expanded';

            const header = document.createElement('div');
            header.className = 'review-group-header';
            header.innerHTML = `
                <div class="review-group-title">
                    <span>📁 ${group.name}</span>
                    <span class="review-group-badge">${group.problems.length} 题</span>
                </div>
                <div class="review-group-icon">▼</div>
            `;

            const groupContent = document.createElement('div');
            groupContent.className = 'review-group-content';
            groupContent.style.display = 'block';

            let groupExpanded = true;
            header.onclick = () => {
                groupExpanded = !groupExpanded;
                groupContent.style.display = groupExpanded ? 'block' : 'none';
                const icon = header.querySelector('.review-group-icon');
                if (icon) icon.style.transform = groupExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
            };

            (group.categories || []).forEach(category => {
                const categoryWrapper = document.createElement('details');
                categoryWrapper.className = 'review-workspace-category-block';
                categoryWrapper.open = true;
                categoryWrapper.innerHTML = `
                    <summary class="review-workspace-category-summary">
                        <span>📂 ${category.name}</span>
                        <span class="review-group-badge">${category.problems.length} 题</span>
                    </summary>
                `;

                const problemGrid = document.createElement('div');
                problemGrid.className = 'review-problems-grid';
                category.problems.forEach(item => {
                    const card = buildReviewCardHTML(item.id, item.reviewCount, item.solvedAt, item.lastReviewAt, item.reviewHistory, item.reviewStage);
                    if (card) problemGrid.appendChild(card);
                });
                categoryWrapper.appendChild(problemGrid);
                groupContent.appendChild(categoryWrapper);
            });

            groupDiv.appendChild(header);
            groupDiv.appendChild(groupContent);
            contentDiv.appendChild(groupDiv);
        });

        stageWrapper.appendChild(stageLabel);
        stageWrapper.appendChild(contentDiv);
        container.appendChild(stageWrapper);
    });
}

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

        const launchBtn = document.createElement('button');
        launchBtn.className = 'review-group-workspace-btn';
        launchBtn.textContent = '进入工作台';
        launchBtn.title = `按当前分组进入${group.name}工作台`;
        launchBtn.onclick = (e) => {
            e.stopPropagation();
            closeReviewModal();
            openReviewWorkspace(group.roundKey);
        };

        header.innerHTML = `
            <div class="review-group-title">
                <span>${icon} ${group.name}</span>
                <span class="review-group-badge">${group.problems.length} 题</span>
            </div>
            <div class="review-group-header-actions">
                <div class="review-group-icon">▼</div>
            </div>
        `;

        const headerActions = header.querySelector('.review-group-header-actions');
        if (headerActions) {
            headerActions.prepend(launchBtn);
        }

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

        const stageLaunchBtn = document.createElement('button');
        stageLaunchBtn.className = 'review-stage-workspace-btn';
        stageLaunchBtn.textContent = '进入本轮工作台';
        stageLaunchBtn.title = `按当前阶段进入${stage.name}工作台`;
        stageLaunchBtn.onclick = (e) => {
            e.stopPropagation();
            closeReviewModal();
            openReviewWorkspace(stage.stageKey || `stage-${stage.stage}-all`);
        };

        stageLabel.innerHTML = `
            <span>📈 ${stage.name} <span style="font-size: 0.85rem; color: #d84315; font-weight: normal; margin-left: 0.5rem;">(共 ${totalProbs} 题)</span></span>
            <span class="stage-label-actions">
                <span class="stage-icon" style="transition: transform 0.3s; font-size: 0.8rem; color: #e65100;">▼</span>
            </span>
        `;

        const stageActions = stageLabel.querySelector('.stage-label-actions');
        if (stageActions) {
            stageActions.prepend(stageLaunchBtn);
        }

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

    const history = Array.isArray(reviewHistory) ? reviewHistory : [];
    const isReviewedToday = isReviewItemCompletedToday({ reviewHistory: history, reviewStage });

    let badgeText = `复习过 ${reviewCount} 次`;
    if (reviewCount === 0 && solvedAt) {
        const d = new Date(solvedAt);
        badgeText = `首刷于 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (reviewCount >= 1) {
        const previousStageTime = history[reviewCount - 1] || lastReviewAt;
        if (previousStageTime) {
            const d = new Date(previousStageTime);
            badgeText = `第${reviewCount}轮复习于 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'review-problems-wrap';

    const card = document.createElement('div');
    card.className = `review-problem-item review-card-target ${isReviewedToday ? 'reviewed' : ''}`;
    card.dataset.problemId = problemNum;
    card.dataset.reviewStage = String(reviewStage);
    card.title = isReviewedToday ? '✅ 今日已完成本次复盘' : '做完这道题了吗？点击标记为已复盘！';

    card.innerHTML = `
        <div class="review-card-meta-row">
            <span class="review-card-meta">${badgeText}</span>
        </div>
        <div class="problem-content">
            <div class="problem-number">${problemNum}</div>
            <div class="problem-title">${problemInfo.title}</div>
        </div>
        <div class="review-card-footer">
            ${problemInfo.url ? '<button class="review-inline-link-btn" type="button">去力扣</button>' : ''}
            <button class="review-inline-complete-btn" type="button" ${isReviewedToday ? 'disabled' : ''}>${isReviewedToday ? '本轮已完成' : '标记已复习'}</button>
        </div>
    `;

    const linkBtn = card.querySelector('.review-inline-link-btn');
    if (linkBtn && problemInfo.url) {
        linkBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(problemInfo.url, '_blank');
        };
    }

    const completeBtn = card.querySelector('.review-inline-complete-btn');
    if (completeBtn) {
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            if (card.classList.contains('reviewed')) return;
            markReviewCardDone(problemNum, reviewStage, card, completeBtn);
        };
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
        openReviewWorkspace();
    });

    window.addEventListener('resize', () => {
        if (btn.classList.contains('docked-right')) {
            btn.style.left = (window.innerWidth - btn.offsetWidth) + 'px';
        }
    });
}

document.addEventListener('DOMContentLoaded', initFloatingReviewBtn);
