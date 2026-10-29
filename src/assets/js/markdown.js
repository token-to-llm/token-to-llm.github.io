/* Markdown 渲染：marked 负责结构，KaTeX 负责公式，highlight.js 负责代码。
   三者都内置在 assets/vendor/ 下（marked MIT、KaTeX MIT、highlight.js BSD-3），
   不依赖 CDN：断网可用，也不受境内访问波动影响。
   必须串行加载：auto-render 初始化时要求 window.katex 已存在。

   刻意写成经典脚本而非 ES 模块：双击打开时页面走 file:// 协议，
   浏览器对模块脚本实施 CORS 检查，import 一律被拦下，整页会一声不响地空白。
   经典脚本没有这条限制，所以这里用 window.MD 暴露接口，页面用 <script src> 引入。 */
(function () {
  /* 目录由本脚本自身 URL 推导，file:// 与 http(s):// 都成立 */
  const HERE = document.currentScript.src.replace(/markdown\.js.*$/, '');
  const ASSETS = HERE.replace(/js\/$/, '');
  const VENDOR = (p) => ASSETS + 'vendor/' + p;

  const MD_CSS = [VENDOR('katex/katex.min.css'), VENDOR('hljs/atom-one-dark.min.css')];

  /* 数组顺序即加载顺序 */
  const MD_SCRIPTS = [
    VENDOR('marked.min.js'),
    VENDOR('katex/katex.min.js'),
    VENDOR('katex/auto-render.min.js'), // 依赖上一步的 katex
    VENDOR('hljs/highlight.min.js'),
    HERE + 'math-macros.js', // 与课件共用同一套 \mat、\matQ 等宏
  ];

  const _loaded = new Map();

  function loadScript(src) {
    if (_loaded.has(src)) return _loaded.get(src);
    const p = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = resolve;
      el.onerror = () => reject(new Error('加载失败: ' + src));
      document.head.appendChild(el);
    });
    _loaded.set(src, p);
    return p;
  }

  function loadCss(href) {
    if (_loaded.has(href)) return _loaded.get(href);
    const p = new Promise((resolve) => {
      const el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = href;
      el.onload = resolve;
      el.onerror = resolve;
      document.head.appendChild(el);
    });
    _loaded.set(href, p);
    return p;
  }

  async function loadMarkdownDeps() {
    MD_CSS.forEach(loadCss);
    for (const src of MD_SCRIPTS) {
      await loadScript(src);
    }
  }

  /* 标题 slug：保留 ASCII，中文转拼音成本高，改用序号兜底，保证锚点稳定可读 */
  function slugify(text, index) {
    const ascii = text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w一-鿿\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return ascii ? 'h-' + ascii.slice(0, 40) : 'h-' + index;
  }

  function makeRenderer(toc) {
    const r = new marked.Renderer();
    let headingIndex = 0;

    r.heading = function (text, level) {
      const id = slugify(text, headingIndex++);
      if (level === 2 || level === 3) {
        toc.push({ id, text: text.replace(/<[^>]+>/g, ''), level });
      }
      return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
    };

    r.table = function (header, body) {
      return '<div class="table-wrap"><table>' + header + body + '</table></div>';
    };

    r.code = function (code, infostring) {
      const lang = (infostring || '').trim().split(/\s+/)[0];
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const cls = lang ? ' class="language-' + lang + '"' : '';
      return '<pre data-lang="' + (lang || '') + '"><code' + cls + '>' + escaped + '</code></pre>';
    };

    return r;
  }

  async function renderMarkdown(mdText, targetEl, opts) {
    const basePath = (opts && opts.basePath) || '';
    await loadMarkdownDeps();

    /* 公式先占位再解析：$...$ 里的 _ * | 会被 marked 当成强调/分隔符，
       表格单元格里尤其明显（\text{attn}_1 会变成斜体）。 */
    const { text: protectedText, restore } = protectMath(mdText);

    const toc = [];
    marked.setOptions({ gfm: true, breaks: false, renderer: makeRenderer(toc) });

    let html = marked.parse(protectedText);

    /* 相对图片路径解析到当前 md 所在目录 */
    if (basePath) {
      html = html.replace(/(<img[^>]+src=")([^":][^"]*)(")/g, (m, a, src, b) => {
        if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return m;
        return a + new URL(src, new URL(basePath, window.SITE.root)).href + b;
      });
    }

    targetEl.innerHTML = restore(html);

    if (window.renderMathInElement) {
      window.renderMathInElement(targetEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        macros: window.MATH_MACROS || {},
        throwOnError: false,
        errorColor: '#d2573a',
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      });
    }

    if (window.hljs) {
      targetEl.querySelectorAll('pre code').forEach((el) => {
        try {
          window.hljs.highlightElement(el);
        } catch (e) {
          /* 未知语言时保留原文 */
        }
      });
    }

    return toc;
  }

  /* 把 $...$ / $$...$$ / \[...\] / \(...\) 换成占位符，解析完再换回来。
     占位符用 \u0000 包裹，标记之间的正文不会被 marked 解释为强调或分隔符。 */
  function protectMath(md) {
    const slots = [];
    const token = (s) => {
      slots.push(s);
      return '\u0000MATH' + (slots.length - 1) + '\u0000';
    };

    // 先处理块级与成对定界符，再处理行内，避免 $$ 被当成两个 $
    const patterns = [
      /\$\$[\s\S]+?\$\$/g,
      /\\\[[\s\S]+?\\\]/g,
      /\\\([\s\S]+?\\\)/g,
      /(?<!\\)\$(?!\$)(?:[^$\\\n]|\\.)+?(?<!\\)\$/g,
    ];

    let text = md;
    for (const re of patterns) {
      text = text.replace(re, (m) => token(m));
    }

    const restore = (html) => html.replace(/\u0000MATH(\d+)\u0000/g, (_, i) => slots[Number(i)]);

    return { text, restore };
  }

  /* 取 markdown 原文。
     优先走 fetch（http(s) 下永远是最新的）；双击打开时 fetch 在 file:// 下会被浏览器
     拒绝，这时退回到 tools/gen_content_js.py 预生成的同名 JS 包。
     key 可显式指定（博客文章用 post-md:<slug>），不给则按文件名推断。 */
  async function loadText(mdUrl, key) {
    try {
      const res = await fetch(mdUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (err) {
      const name = key || mdUrl.replace(/^.*\//, '').replace(/\.md$/, '');
      const bundle = (window.MD_CONTENT || {})[name];
      if (typeof bundle === 'string') return bundle;
      throw err;
    }
  }

  async function renderMdFile(mdUrl, targetEl) {
    try {
      const text = await loadText(mdUrl);
      return await renderMarkdown(text, targetEl, { basePath: mdUrl });
    } catch (err) {
      console.error('[markdown]', mdUrl, err);
      const raw = mdUrl.replace(window.SITE.root, '');
      targetEl.innerHTML =
        '<div class="callout callout--warn"><span class="callout-title">此页内容加载失败</span>' +
        '可以直接查看源文件：<a href="' + mdUrl + '">' + esc(raw) + '</a>' +
        '（也可用 <code>python3 -m http.server</code> 本地预览）。<br>' +
        '<small style="color:#8a92a6">' + esc(err && err.message ? err.message : err) + '</small></div>';
      return [];
    }
  }

  /* 生成右侧页内目录并跟随滚动高亮 */
  function mountToc(toc) {
    const el = document.querySelector('[data-chrome="toc"]');
    if (!el) return;
    if (!toc.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML =
      '<h4>本页目录</h4>' +
      toc.map((t) => '<a href="#' + t.id + '" class="lvl-' + t.level + '">' + t.text + '</a>').join('');

    const links = [...el.querySelectorAll('a')];
    const targets = links
      .map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))))
      .filter(Boolean);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.classList.remove('is-active'));
          const active = links[targets.indexOf(e.target)];
          if (active) active.classList.add('is-active');
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    targets.forEach((t) => obs.observe(t));
  }

  function esc(s) {
    return String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
    );
  }

  window.MD = {
    loadMarkdownDeps,
    renderMarkdown,
    renderMdFile,
    mountToc,
    loadText,
  };
})();
