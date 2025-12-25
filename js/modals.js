// js/modals.js

/**
 * 显示刷题技巧弹窗。
 */
function showTipsMenu() {
    document.getElementById('tipsModal').classList.add('active');
}

/**
 * 关闭刷题技巧弹窗。
 */
function closeTipsMenu() {
    document.getElementById('tipsModal').classList.remove('active');
}

/**
 * 显示数据管理弹窗。
 */
function showDataMenu() {
    document.getElementById('dataModal').classList.add('active');
}

/**
 * 关闭数据管理弹窗。
 */
function closeDataMenu() {
    document.getElementById('dataModal').classList.remove('active');
}

/**
 * 关闭顶部的黄色数据备份提醒横幅。
 */
function closeNotice() {
    document.getElementById('dataNotice').classList.add('hidden');
    localStorage.setItem('noticeHidden', 'true');
}

/**
 * 检查是否需要显示数据备份提醒横幅。
 */
function checkNoticeVisibility() {
    const noticeHidden = localStorage.getItem('noticeHidden');
    if (noticeHidden === 'true') {
        document.getElementById('dataNotice').classList.add('hidden');
    }
}

/**
 * 当题目存在于多个分类时，打开一个弹窗让用户选择要跳转到哪个分类。
 * @param {Array<object>} locations - 题目存在的位置信息数组。
 * @param {number|string} problemId - 题目ID。
 */
function openCategoryChoiceModal(locations, problemId) {
    const modal = document.getElementById('categoryChoiceModal');
    const content = document.getElementById('categoryChoiceContent');

    content.innerHTML = `
        <p>题目 <strong>${problemId}</strong> 存在于多个分类中，请选择要跳转的位置：</p>
        <div class="category-choices">
            ${locations.map(loc => `
                <button class="choice-btn" onclick="handleCategoryChoice(${loc.round}, '${loc.category}', ${problemId})">
                    <span class="choice-round round${loc.round}">${problemsData[loc.roundKey].name.split(' ')[0]}</span>
                    <span class="choice-category">${loc.category}</span>
                </button>
            `).join('')}
        </div>
    `;

    modal.classList.add('active');
}

/**
 * 处理用户在多分类选择弹窗中的选择。
 * @param {number} round - 选择的轮次。
 * @param {string} categoryName - 选择的分类名。
 * @param {number|string} problemId - 题目ID。
 */
function handleCategoryChoice(round, categoryName, problemId) {
    navigateToProblem(round, categoryName, problemId); // 依赖 search.js
    closeCategoryChoiceModal();
}

/**
 * 关闭分类选择弹窗。
 */
function closeCategoryChoiceModal() {
    document.getElementById('categoryChoiceModal').classList.remove('active');
}

// 全局点击事件，用于关闭打开的弹窗
document.addEventListener('click', function(e) {
    const modals = [
        { id: 'dataModal', closeFn: closeDataMenu },
        { id: 'tipsModal', closeFn: closeTipsMenu },
        { id: 'calendarModal', closeFn: closeCalendar },
        { id: 'dateDetailModal', closeFn: closeDateDetail },
        { id: 'monthDetailModal', closeFn: closeMonthDetail },
        { id: 'categoryChoiceModal', closeFn: closeCategoryChoiceModal }
    ];

    for (const modalInfo of modals) {
        const modalElement = document.getElementById(modalInfo.id);
        if (e.target === modalElement) {
            modalInfo.closeFn();
        }
    }
});
