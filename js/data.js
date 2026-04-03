// js/data.js

const DEFAULT_ROUND_KEYS = ['round1', 'round2', 'round3', 'round4', 'round5', 'round6', 'round7'];

/**
 * 获取当前项目的轮次键名，按 round1 -> roundN 排序。
 * @returns {string[]}
 */
function getOrderedRoundKeys() {
    const roundKeys = Object.keys(problemsData || {});
    if (roundKeys.length === 0) {
        return [...DEFAULT_ROUND_KEYS];
    }

    return roundKeys.sort((a, b) => {
        const aNum = Number(a.replace('round', ''));
        const bNum = Number(b.replace('round', ''));
        return aNum - bNum;
    });
}

/**
 * 创建空的用户进度对象。
 * @returns {Object<string, Object>}
 */
function createEmptyUserProgress() {
    return getOrderedRoundKeys().reduce((progress, roundKey) => {
        progress[roundKey] = {};
        return progress;
    }, {});
}

/**
 * 确保用户进度结构包含所有轮次。
 */
function ensureUserProgressStructure() {
    const emptyProgress = createEmptyUserProgress();
    userProgress = {
        ...emptyProgress,
        ...(userProgress || {})
    };

    getOrderedRoundKeys().forEach(roundKey => {
        if (!userProgress[roundKey] || typeof userProgress[roundKey] !== 'object') {
            userProgress[roundKey] = {};
        }
    });
}

/**
 * 获取当前用户视图状态的存储键。
 * @returns {string|null}
 */
function getUserViewStateStorageKey() {
    return currentUser ? `viewState_${currentUser}` : null;
}

/**
 * 读取当前用户上次浏览的轮次和分类。
 * @returns {{round: number, category: string|null}|null}
 */
function loadUserViewState() {
    const storageKey = getUserViewStateStorageKey();
    if (!storageKey) {
        return null;
    }

    const saved = localStorage.getItem(storageKey);
    if (!saved) {
        return null;
    }

    try {
        const parsed = JSON.parse(saved);
        const round = Number(parsed?.round);
        const roundKey = `round${round}`;
        const roundData = problemsData[roundKey];

        if (!Number.isInteger(round) || !roundData || !Array.isArray(roundData.categories) || roundData.categories.length === 0) {
            localStorage.removeItem(storageKey);
            return null;
        }

        const category = typeof parsed.category === 'string' && parsed.category.trim()
            ? parsed.category.trim()
            : null;

        if (category && !roundData.categories.some(item => item.name === category)) {
            return { round, category: null };
        }

        return { round, category };
    } catch (error) {
        localStorage.removeItem(storageKey);
        return null;
    }
}

/**
 * 保存当前用户正在浏览的轮次和分类。
 */
function saveCurrentViewState() {
    const storageKey = getUserViewStateStorageKey();
    if (!storageKey || !currentRound) {
        return;
    }

    localStorage.setItem(storageKey, JSON.stringify({
        round: currentRound,
        category: selectedCategory?.name || null
    }));
}

/**
 * 获取题目的全局打卡信息。
 * 题目只要在任意轮次打卡过，就视为已刷。
 * @param {number|string} problemNum
 * @returns {{roundKey: string, solvedAt?: string, round?: string}|null}
 */
function getProblemProgress(problemNum) {
    const problemId = problemNum.toString();

    for (const roundKey of getOrderedRoundKeys()) {
        if (userProgress[roundKey] && userProgress[roundKey][problemId]) {
            return userProgress[roundKey][problemId];
        }
    }

    return null;
}

/**
 * 判断题目是否已在任意轮次完成。
 * @param {number|string} problemNum
 * @returns {boolean}
 */
function isProblemSolved(problemNum) {
    return Boolean(getProblemProgress(problemNum));
}

/**
 * 删除题目在所有轮次中的打卡记录。
 * @param {number|string} problemNum
 */
function clearProblemProgress(problemNum) {
    const problemId = problemNum.toString();
    Object.keys(userProgress).forEach(roundKey => {
        if (userProgress[roundKey] && userProgress[roundKey][problemId]) {
            delete userProgress[roundKey][problemId];
        }
    });
}

/**
 * 从基础题库、Hot100 和面试经典150题库异步加载所有题目数据。
 * 加载后，会自动组织轮次并检查用户登录状态。
 */
async function loadProblemsData() {
    try {
        const [baseResponse, hot100Response, interview150Response] = await Promise.all([
            fetch('problems-data.json'),
            fetch('hot100-data.json'),
            fetch('interview150-data.json')
        ]);
        const [baseData, hot100Data, interview150Data] = await Promise.all([
            baseResponse.json(),
            hot100Response.json(),
            interview150Response.json()
        ]);

        const mergedProblems = new Map();
        [baseData.problems, hot100Data.problems, interview150Data.problems].forEach(problemList => {
            problemList.forEach(problem => {
                if (!mergedProblems.has(problem.id.toString())) {
                    mergedProblems.set(problem.id.toString(), problem);
                }
            });
        });

        allProblems = Array.from(mergedProblems.values());

        organizeProblemsByRounds(baseData.problems, hot100Data.problems, interview150Data.problems);
        checkLogin(); // 依赖 auth.js
    } catch (error) {
        console.error('加载题目数据失败:', error);
        alert('加载题目数据失败，请刷新页面重试');
    }
}

/**
 * 根据基础题库、Hot100 与面试经典150题库，组织各轮次题目。
 * @param {Array} baseProblems
 * @param {Array} hot100Problems
 * @param {Array} interview150Problems
 */
function organizeProblemsByRounds(baseProblems = [], hot100Problems = [], interview150Problems = []) {
    problemsData = {
        round1: { name: "第一轮 (简单 50%+)", description: "难度简单，通过率在50%以上的题目", categories: {} },
        round2: { name: "第二轮 (中等 50%+)", description: "难度中等，通过率在50%以上的题目", categories: {} },
        round3: { name: "第三轮 (算法理论)", description: "学习算法理论后，刷树、图、贪心、动态规划", categories: {} },
        round4: { name: "第四轮 (困难)", description: "困难题目和通过率低于50%的题目", categories: {} },
        round5: { name: "数据库轮次 (SQL)", description: "专门针对 SQL 数据库题目的练习轮次", categories: {} },
        round6: { name: "Hot100", description: "力扣 Hot100 单独刷题分类", categories: {} },
        round7: { name: "面试经典150", description: "LeetCode 面试经典 150 题单独刷题分类", categories: {} }
    };

    const round3Categories = ['树', '图与回溯算法', '贪心', '动态规划'];

    baseProblems.forEach(problem => {
        const { difficulty, passRate, category } = problem;

        if (category === 'SQL') {
            if (!problemsData.round5.categories[category]) {
                problemsData.round5.categories[category] = [];
            }
            problemsData.round5.categories[category].push(problem.id);
        } else if (round3Categories.includes(category)) {
            if (!problemsData.round3.categories[category]) {
                problemsData.round3.categories[category] = [];
            }
            problemsData.round3.categories[category].push(problem.id);
        } else if (difficulty === '简单' && passRate >= 50) {
            if (!problemsData.round1.categories[category]) {
                problemsData.round1.categories[category] = [];
            }
            problemsData.round1.categories[category].push(problem.id);
        } else if (difficulty === '中等' && passRate >= 50) {
            if (!problemsData.round2.categories[category]) {
                problemsData.round2.categories[category] = [];
            }
            problemsData.round2.categories[category].push(problem.id);
        } else {
            const round4Category = '综合挑战';
            if (!problemsData.round4.categories[round4Category]) {
                problemsData.round4.categories[round4Category] = [];
            }
            problemsData.round4.categories[round4Category].push(problem.id);
        }
    });

    hot100Problems.forEach(problem => {
        const hot100Category = problem.category || 'Hot100';
        if (!problemsData.round6.categories[hot100Category]) {
            problemsData.round6.categories[hot100Category] = [];
        }
        problemsData.round6.categories[hot100Category].push(problem.id);
    });

    interview150Problems.forEach(problem => {
        const interview150Category = problem.category || '面试经典150';
        if (!problemsData.round7.categories[interview150Category]) {
            problemsData.round7.categories[interview150Category] = [];
        }
        problemsData.round7.categories[interview150Category].push(problem.id);
    });

    getOrderedRoundKeys().forEach(roundKey => {
        const categoriesObj = problemsData[roundKey].categories;
        problemsData[roundKey].categories = Object.keys(categoriesObj).map(name => ({
            name,
            problems: categoriesObj[name]
        }));
    });
}

/**
 * 从本地存储加载当前用户的进度。
 * 如果没有找到，则初始化一个空的用户进度对象。
 */
function loadUserProgress() {
    const saved = localStorage.getItem(`progress_${currentUser}`);
    if (saved) {
        userProgress = JSON.parse(saved);
    } else {
        userProgress = createEmptyUserProgress();
    }

    ensureUserProgressStructure();
}

/**
 * 将当前用户的进度保存到本地存储。
 */
function saveUserProgress() {
    ensureUserProgressStructure();
    localStorage.setItem(`progress_${currentUser}`, JSON.stringify(userProgress));
}

/**
 * 导出用户的刷题进度为 JSON 文件。
 */
function exportProgress() {
    const dataStr = JSON.stringify(userProgress, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leetcode_progress_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('✅ 数据导出成功！\n文件已保存到下载文件夹');
    closeDataMenu(); // 依赖 modals.js
}

/**
 * 触发文件选择对话框以导入进度文件。
 */
function triggerImport() {
    document.getElementById('importFile').click();
}

/**
 * 处理导入的进度文件。
 * 读取文件内容，解析JSON，并在用户确认后覆盖当前进度。
 * @param {Event} event - 文件输入框的 onchange 事件。
 */
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            if (!imported || typeof imported !== 'object') {
                throw new Error('数据格式不正确');
            }

            if (confirm('⚠️ 导入数据将覆盖当前进度，确定要继续吗？\n\n建议先导出当前数据作为备份。')) {
                userProgress = imported;
                saveUserProgress();
                selectRound(currentRound, selectedCategory ? selectedCategory.name : null); // 依赖 ui.js
                alert('✅ 进度数据导入成功！');
                closeDataMenu(); // 依赖 modals.js
            }
        } catch (error) {
            alert('❌ 导入失败：文件格式不正确\n\n请确保导入的是有效的JSON文件');
        }
    };
    reader.readAsText(file);

    event.target.value = ''; // 重置文件选择器
}

/**
 * 智能复习: 基于已完成题目，按照最后一次复习时间(或首次打卡时间)升序排列，抽取最老的N道题
 * @param {string} source - 要抽取复习题的来源 (如 'all', 'stage-0-all', 'stage-0-round6')
 * @param {number} count - 要抽取的题目数量，默认5题
 * @returns {Array} - 抽取的题目对象数组
 */
function generateReviewProblems(source, count = 5) {
    if (!source) return [];
    
    const hierarchy = generateAllReviewProblemsGrouped();
    let flatAll = [];
    
    // 助手函数：按时间戳从小到大排序
    const sortProblems = (arr) => {
        arr.sort((a, b) => {
            const ta = a.lastReviewAt ? new Date(a.lastReviewAt).getTime() : new Date(a.solvedAt).getTime();
            const tb = b.lastReviewAt ? new Date(b.lastReviewAt).getTime() : new Date(b.solvedAt).getTime();
            return ta - tb;
        });
    };

    if (source === 'all') {
        const seen = new Set();
        hierarchy.forEach(stage => {
            stage.roundGroups.forEach(rg => {
                rg.problems.forEach(p => {
                    if (!seen.has(p.id)) {
                        seen.add(p.id);
                        flatAll.push(p);
                    }
                });
            });
        });
        sortProblems(flatAll);
        return flatAll.slice(0, count);
    }
    
    if (source.startsWith('stage-')) {
        const parts = source.split('-'); // ["stage", "0", "all" | "roundY"]
        const stageNumStr = parts[1];
        const subsource = parts.slice(2).join('-'); // 'all' or 'round1'
        
        const targetStage = hierarchy.find(s => s.stageKey === `stage-${stageNumStr}`);
        if (!targetStage) return [];
        
        if (subsource === 'all') {
            const seen = new Set();
            targetStage.roundGroups.forEach(rg => {
                rg.problems.forEach(p => {
                    if (!seen.has(p.id)) {
                        seen.add(p.id);
                        flatAll.push(p);
                    }
                });
            });
            sortProblems(flatAll);
            return flatAll.slice(0, count);
        } else {
            const trg = targetStage.roundGroups.find(rg => rg.roundKey === subsource);
            if (trg) {
                // 原题库内的问题已经在 hierarchy 构建时进行过一次去重了（对该轮次而言），且按时间排序了
                return trg.problems.slice(0, count);
            }
            return [];
        }
    }
    
    // 兼容原有的裸 roundKey（如 'round1'）提取逻辑，从各个阶梯中抽取组装
    const seen = new Set();
    hierarchy.forEach(stage => {
        const trg = stage.roundGroups.find(rg => rg.roundKey === source);
        if (trg) {
            trg.problems.forEach(p => {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    flatAll.push(p);
                }
            });
        }
    });
    sortProblems(flatAll);
    return flatAll.slice(0, count);
}

/**
 * 智能复习: 标记题目已被复习
 * @param {string} roundKey - 轮次 (保留为了兼容API)
 * @param {number|string} problemNum - 题号
 */
function markProblemReviewed(roundKey, problemNum) {
    const progress = getProblemProgress(problemNum);
    if (!progress || !progress.solvedAt) return;

    // 保留历次复习的时间线记录
    if (!progress.reviewHistory) {
        progress.reviewHistory = [];
    }
    progress.reviewHistory.push(new Date().toISOString());

    progress.reviewCount = (progress.reviewCount || 0) + 1;
    progress.lastReviewAt = new Date().toISOString(); 
    
    saveUserProgress(); 
}

/**
 * 智能复习: 获取所有需要复习的题目，并按照 阶段 -> 题库 的树状结构嵌套返回
 * @returns {Array} - 例如 [{ stage: 0, stageKey: 'stage-0', name: '一轮复习', roundGroups: [ { roundKey: 'round1', name: '第一轮', problems: [...] } ] }]
 */
function generateAllReviewProblemsGrouped() {
    const stageMap = {}; 
    
    // 遍历所有原始题库查找复习数据
    getOrderedRoundKeys().forEach(roundKey => {
        const roundData = problemsData[roundKey];
        if (!roundData || !roundData.categories) return;

        const seenInRound = new Set();
        
        roundData.categories.forEach(category => {
            category.problems.forEach(problemNum => {
                const problemId = problemNum.toString();
                // 确保在同一个题库内不会因为多个子分类重复追加问题
                if (seenInRound.has(problemId)) return;
                
                const progress = getProblemProgress(problemNum); 
                if (progress && progress.solvedAt) {
                    seenInRound.add(problemId);
                    
                    const reviewCount = progress.reviewCount || 0;
                    const timeToCompare = progress.lastReviewAt ? new Date(progress.lastReviewAt).getTime() : new Date(progress.solvedAt).getTime();
                    
                    const probObj = {
                        problemId: problemId,
                        time: timeToCompare,
                        reviewCount: reviewCount,
                        solvedAt: progress.solvedAt,
                        lastReviewAt: progress.lastReviewAt,
                        reviewHistory: progress.reviewHistory || []
                    };

                    if (!stageMap[reviewCount]) {
                        stageMap[reviewCount] = {};
                    }
                    if (!stageMap[reviewCount][roundKey]) {
                        stageMap[reviewCount][roundKey] = {
                            roundKey: roundKey,
                            name: roundData.name,
                            problems: []
                        };
                    }
                    stageMap[reviewCount][roundKey].problems.push(probObj);
                }
            });
        });
    });

    const hierarchy = [];
    const stageNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    
    Object.keys(stageMap).sort((a, b) => Number(a) - Number(b)).forEach(countStr => {
        const c = parseInt(countStr);
        const name = c < stageNames.length ? `${stageNames[c]}轮复习` : `第${c + 1}轮复习`;
        
        const roundGroups = [];
        getOrderedRoundKeys().forEach(rk => {
            if (stageMap[countStr][rk]) {
                const grp = stageMap[countStr][rk];
                // 当前分类下的题目按时间线排序
                grp.problems.sort((a, b) => a.time - b.time);
                roundGroups.push({
                    roundKey: rk,
                    name: grp.name,
                    problems: grp.problems.map(p => ({
                        id: p.problemId,
                        reviewCount: p.reviewCount,
                        solvedAt: p.solvedAt,
                        lastReviewAt: p.lastReviewAt,
                        reviewHistory: p.reviewHistory || []
                    }))
                });
            }
        });
        
        hierarchy.push({
            stage: c,
            stageKey: `stage-${c}`,
            name: name,
            roundGroups: roundGroups
        });
    });

    return hierarchy;
}
