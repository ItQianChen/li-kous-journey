// js/data.js

/**
 * 从 problems-data.json 文件异步加载所有题目数据。
 * 加载后，会自动根据规则将题目组织到不同轮次，并检查用户登录状态。
 */
async function loadProblemsData() {
    try {
        const response = await fetch('problems-data.json');
        const data = await response.json();
        allProblems = data.problems;

        organizeProblemsByRounds();
        checkLogin(); // 依赖 auth.js
    } catch (error) {
        console.error('加载题目数据失败:', error);
        alert('加载题目数据失败，请刷新页面重试');
    }
}

/**
 * 根据题目的难度和通过率，将它们自动分配到四个不同的轮次中。
 */
function organizeProblemsByRounds() {
    // 初始化数据结构
    problemsData = {
        round1: { name: "第一轮 (简单 50%+)", description: "难度简单，通过率在50%以上的题目", categories: {} },
        round2: { name: "第二轮 (中等 50%+)", description: "难度中等，通过率在50%以上的题目", categories: {} },
        round3: { name: "第三轮 (算法理论)", description: "学习算法理论后，刷树、图、贪心、动态规划", categories: {} },
        round4: { name: "第四轮 (困难)", description: "困难题目和通过率低于50%的题目", categories: {} }
    };

    const round3Categories = ['树', '图与回溯算法', '贪心', '动态规划'];

    allProblems.forEach(problem => {
        const { difficulty, passRate, category } = problem;

        if (round3Categories.includes(category)) {
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

    // 转换categories对象为数组格式
    ['round1', 'round2', 'round3', 'round4'].forEach(roundKey => {
        const categoriesObj = problemsData[roundKey].categories;
        problemsData[roundKey].categories = Object.keys(categoriesObj).map(name => ({
            name: name,
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
        userProgress = { round1: {}, round2: {}, round3: {}, round4: {} };
    }
}

/**
 * 将当前用户的进度保存到本地存储。
 */
function saveUserProgress() {
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
                selectRound(currentRound); // 依赖 ui.js
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
