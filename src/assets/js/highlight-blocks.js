/* 代码高亮：把所有 <pre data-lang="..."><code> 交给 highlight.js。
   docs/ 里的 markdown 由 markdown.js 自己处理，这里管的是手写在页面里的代码块
   （首页代码卡、code 页）。data-lang 为空或 "text" 时只上底色与等宽字形，不做语法着色。

   highlight.js 与主题都用本地 vendor，不引 CDN：断网可用。 */
(function () {
  const HERE = document.currentScript.src.replace(/[^/]*$/, '');
  const BASE = HERE.replace(/js\/$/, '');
  const HLJS_JS = BASE + 'vendor/hljs/highlight.min.js';
  const HLJS_CSS = BASE + 'vendor/hljs/atom-one-dark.min.css';

  /* data-lang 与 hljs 的语言名对不上的，在这里改名 */
  const ALIAS = {
    shell: 'bash',
    sh: 'bash',
    console: 'bash',
    py: 'python',
    text: '', // 纯文本，不着色
    '': '',
  };

  function loadCss(href) {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    document.head.appendChild(el);
  }

  function highlightAll() {
    if (!window.hljs) return;
    document.querySelectorAll('pre[data-lang] > code').forEach(function (code) {
      const pre = code.parentElement;
      const raw = (pre.getAttribute('data-lang') || '').trim().toLowerCase();
      const lang = Object.prototype.hasOwnProperty.call(ALIAS, raw) ? ALIAS[raw] : raw;
      if (!lang) {
        pre.classList.add('is-plain');
        return;
      }
      code.className = 'language-' + lang;
      try {
        window.hljs.highlightElement(code);
      } catch (e) {
        /* 认不出的语言保留原文，不影响阅读 */
        pre.classList.add('is-plain');
      }
    });
  }

  function init() {
    if (!document.querySelector('pre[data-lang]')) return;
    loadCss(HLJS_CSS);
    if (window.hljs) return highlightAll();
    const s = document.createElement('script');
    s.src = HLJS_JS;
    s.onload = highlightAll;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HIGHLIGHT_BLOCKS = highlightAll;
})();
