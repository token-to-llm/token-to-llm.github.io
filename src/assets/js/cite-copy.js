/* 引用本书：复制按钮。
   只处理带 [data-copy-target] 的按钮，取目标元素的 textContent。
   clipboard API 只在安全上下文（https / localhost）可用，
   所以保留 execCommand 兜底：两种都失败时把按钮文字改成“请手动选择”，
   不弹 alert，不打断阅读。 */
(function () {
  const LABEL = {
    idle: '复制',
    done: '已复制',
    fail: '请手动选择',
  };

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function flash(btn, label) {
    btn.textContent = label;
    btn.classList.toggle('is-done', label === LABEL.done);
    clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(function () {
      btn.textContent = LABEL.idle;
      btn.classList.remove('is-done');
    }, 1600);
  }

  function handle(ev) {
    const btn = ev.currentTarget;
    const target = document.getElementById(btn.getAttribute('data-copy-target'));
    if (!target) return;
    const text = target.textContent;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { flash(btn, LABEL.done); },
        function () { flash(btn, fallbackCopy(text) ? LABEL.done : LABEL.fail); }
      );
      return;
    }

    flash(btn, fallbackCopy(text) ? LABEL.done : LABEL.fail);
  }

  function init() {
    document.querySelectorAll('button[data-copy-target]').forEach(function (btn) {
      btn.addEventListener('click', handle);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
