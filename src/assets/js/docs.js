/* 文档页统一引导：渲染页头/侧栏、载入 markdown、生成页内目录。
   与 markdown.js 一样是经典脚本（见那边的说明），通过 window.bootDoc 暴露。 */
(function () {
  /**
   * @param {string} activeId 侧栏高亮项 id
   * @param {string} mdPath   相对站根的 markdown 路径，留空表示本页自行渲染
   */
  async function bootDoc(activeId, mdPath) {
    mountChrome({ page: 'docs' });
    mountSidebar(activeId);

    const target = document.getElementById('doc-content');
    if (!target) return;

    if (!mdPath) {
      document.body.classList.add('doc-ready');
      return;
    }

    target.innerHTML = '<p class="loading">正在载入…</p>';
    try {
      const toc = await window.MD.renderMdFile(window.SITE.url(mdPath), target);
      window.MD.mountToc(toc, target);
    } catch (e) {
      console.error('[docs]', e);
    }
    document.body.classList.add('doc-ready');
  }

  window.bootDoc = bootDoc;
})();
