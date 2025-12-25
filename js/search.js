// js/search.js

/**
 * 根据输入框中的内容搜索题目，并显示结果。
 */
function searchProblems() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 1) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        return;
    }

    const filteredProblems = allProblems.filter(p =>
        p.id.toString().includes(query) || p.title.toLowerCase().includes(query)
    );

    const uniqueProblems = Array.from(new Map(filteredProblems.map(p => [p.id, p])).values());

    uniqueProblems.sort((a, b) => {
        const aId = a.id.toString();
        const bId = b.id.toString();
        if (aId === query && bId !== query) return -1;
        if (bId === query && aId !== query) return 1;
        if (aId.startsWith(query) && !bId.startsWith(query)) return -1;
        if (bId.startsWith(query) && !aId.startsWith(query)) return 1;
        return 0;
    });

    const resultsToShow = uniqueProblems.slice(0, 10);

    if (resultsToShow.length > 0) {
        resultsContainer.innerHTML = resultsToShow.map(p => {
            const locations = findProblemLocations(p.id);
            let locationInfo = '';
            if (locations.length === 1) {
                const loc = locations[0];
                const roundName = problemsData[loc.roundKey].name.split(' ')[0];
                locationInfo = `<span class="search-category" title="${roundName} - ${loc.category}">${roundName} - ${loc.category}</span>`;
            } else if (locations.length > 1) {
                locationInfo = `<span class="search-category multiple" title="该题目存在于多个分类中">多个分类</span>`;
            }

            return `
                <div class="search-result-item" onmousedown="selectProblem(${p.id})" title="${p.id}. ${p.title}">
                    <span class="search-id">${p.id}</span>
                    <span class="search-title">${p.title}</span>
                    ${locationInfo}
                </div>
            `;
        }).join('');
    } else {
        resultsContainer.innerHTML = '<div class="search-no-results">无匹配结果</div>';
    }
    resultsContainer.classList.add('active');
}

/**
 * 当用户从搜索结果中选择一个题目时调用。
 * @param {number} problemId - 被选中的题目ID。
 */
function selectProblem(problemId) {
    const locations = findProblemLocations(problemId);

    if (locations.length === 0) {
        alert('未找到该题目所属的分类。');
        return;
    }

    if (locations.length === 1) {
        navigateToProblem(locations[0].round, locations[0].category, problemId);
    } else {
        openCategoryChoiceModal(locations, problemId); // 依赖 modals.js
    }
    document.getElementById('searchInput').value = '';
    hideSearchResults();
}

/**
 * 查找一个题目存在于哪些轮次和分类中。
 * @param {number|string} problemId - 要查找的题目ID。
 * @returns {Array<object>} - 包含位置信息的数组。
 */
function findProblemLocations(problemId) {
    const locations = [];
    ['round1', 'round2', 'round3', 'round4'].forEach((roundKey, roundIndex) => {
        problemsData[roundKey].categories.forEach(category => {
            if (category.problems.includes(problemId) || category.problems.includes(problemId.toString())) {
                locations.push({
                    round: roundIndex + 1,
                    category: category.name,
                    roundKey: roundKey
                });
            }
        });
    });
    return locations;
}

/**
 * 导航到指定的题目位置（切换轮次、分类，并高亮题目）。
 * @param {number} round - 轮次编号。
 * @param {string} categoryName - 分类名称。
 * @param {number|string} problemId - 题目ID。
 */
async function navigateToProblem(round, categoryName, problemId) {
    if (currentRound !== round) {
        selectRound(round); // 依赖 ui.js
    }

    const categoryCards = document.querySelectorAll('.category-card');
    const targetCard = Array.from(categoryCards).find(card =>
        card.querySelector('.category-name').textContent === categoryName
    );

    if (targetCard) {
        if (!targetCard.classList.contains('active')) {
            targetCard.click();
        }

        // 等待UI渲染
        setTimeout(() => {
            const problemItems = document.querySelectorAll('.problem-item');
            const targetItem = Array.from(problemItems).find(item =>
                item.querySelector('.problem-number')?.textContent == problemId
            );
            if (targetItem) {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetItem.classList.add('highlight');
                setTimeout(() => targetItem.classList.remove('highlight'), 2000);
            }
        }, 100);
    }
}

/**
 * 显示搜索结果列表。
 */
function showSearchResults() {
    const input = document.getElementById('searchInput');
    if (input.value) {
        document.getElementById('searchResults').classList.add('active');
    }
}

/**
 * 隐藏搜索结果列表。
 */
function hideSearchResults() {
    // 使用延迟确保点击事件可以被触发
    setTimeout(() => {
        document.getElementById('searchResults').classList.remove('active');
    }, 200);
}
