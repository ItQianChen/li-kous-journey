// js/utils.js

/**
 * 复制题号到剪贴板，并提供视觉反馈。
 * @param {number|string} problemNum - 要复制的题号。
 * @param {HTMLElement} button - 被点击的复制按钮元素。
 */
function copyProblemNumber(problemNum, button) {
    const textArea = document.createElement('textarea');
    textArea.value = problemNum;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        const originalText = button.innerHTML;
        button.innerHTML = '✓';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 1000);
    } catch (err) {
        alert('复制失败，请手动复制');
    }
    document.body.removeChild(textArea);
}

/**
 * 在详情弹窗中复制题目ID到剪贴板。
 * @param {number|string} problemId - 要复制的题目ID。
 * @param {Event} event - 点击事件对象。
 */
function copyProblemId(problemId, event) {
    event.stopPropagation();
    const button = event.target.closest('button');
    copyProblemNumber(problemId, button);
}

/**
 * 切换详情弹窗中可折叠区域的显示/隐藏状态。
 * @param {HTMLElement} headerElement - 被点击的标题元素。
 */
function toggleSection(headerElement) {
    const section = headerElement.parentElement;
    const content = section.querySelector('.round-content, .problems-list');
    const icon = headerElement.querySelector('.toggle-icon');

    if (content && icon) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? (content.classList.contains('problems-list') ? 'grid' : 'block') : 'none';
        icon.textContent = isHidden ? '▼' : '▶';
    }
}
