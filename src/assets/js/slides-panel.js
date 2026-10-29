/* 主页“配套课件”面板：图片墙与内嵌 PDF 阅读器两个 tab，自挂载到 #home-ppt。
   pdf.js 只在第一次切到 PDF tab 时动态插入，默认 tab 不下载 8 MB 课件。 */
(function () {
  'use strict';

  const HOST_ID = 'home-ppt';

  /* pdf.js 锁 3.11.174：legacy build 不依赖 ES module，file:// 与老浏览器都稳；
     3.x 的 UMD 包把接口挂在 window.pdfjsLib 上。 */
  const PDFJS_VERSION = '3.11.174';
  const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VERSION + '/';
  const PDFJS_SRC = PDFJS_BASE + 'legacy/build/pdf.min.js';
  const PDFJS_WORKER = PDFJS_BASE + 'legacy/build/pdf.worker.min.js';

  const PDF_NAME = 'gpt.pdf';
  const PDF_MIRROR = 'https://raw.githubusercontent.com/token-to-llm/token-to-llm/main/ppt/' + PDF_NAME;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pdfUrlList() {
    const list = [];
    const base = window.SITE && window.SITE.ppt && window.SITE.ppt.base;
    if (base) list.push(base + PDF_NAME);
    if (list.indexOf(PDF_MIRROR) === -1) list.push(PDF_MIRROR);
    return list;
  }

  /* 从 CHAPTERS 按文件名反查课件标题，查不到就用兜底文案 */
  function pdfTitle() {
    const list = window.CHAPTERS || [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].ppt === PDF_NAME) {
        return '第 ' + list[i].n + ' 章 · ' + list[i].title;
      }
    }
    return '配套课件 · ' + PDF_NAME;
  }

  /* 站点里已有 #lightbox 就复用（只借 DOM，不依赖 index.html 那边的委托是否还在），
     没有就按同样结构补一个。 */
  let lbEl = null;

  function lightbox() {
    if (lbEl) return lbEl;
    const found = document.getElementById('lightbox');
    if (found && found.querySelector('#lightbox-img')) {
      lbEl = found;
    } else {
      lbEl = document.createElement('div');
      lbEl.className = 'lightbox';
      lbEl.id = 'lightbox';
      lbEl.hidden = true;
      lbEl.innerHTML =
        '<button class="lightbox-close" aria-label="关闭预览">×</button>' +
        '<figure class="lightbox-inner">' +
        '<img id="lightbox-img" src="" alt="">' +
        '<figcaption id="lightbox-cap"></figcaption>' +
        '</figure>';
      document.body.appendChild(lbEl);
    }
    /* 放大层开着时点哪都关：遮罩铺满视口，底下没有可点的东西 */
    lbEl.addEventListener('click', function () {
      if (!lbEl.hidden) closeLightbox();
    });
    return lbEl;
  }

  function openLightbox(src, cap) {
    const lb = lightbox();
    const img = lb.querySelector('#lightbox-img');
    const capEl = lb.querySelector('#lightbox-cap');
    if (!img) return;
    img.src = src;
    img.alt = cap || '';
    if (capEl) capEl.textContent = cap || '';
    lb.hidden = false;
    document.body.classList.add('is-locked');
    const btn = lb.querySelector('.lightbox-close');
    if (btn) btn.focus();
  }

  function closeLightbox() {
    if (!lbEl || lbEl.hidden) return;
    lbEl.hidden = true;
    const img = lbEl.querySelector('#lightbox-img');
    if (img) img.src = '';
    document.body.classList.remove('is-locked');
  }

  /* 手机端（≤760px）先收成两列三行，剩下的靠一颗按钮铺开。 */
  const COLLAPSE_MQ = '(max-width: 760px)';
  const FOLD_LIMIT = 6;

  function buildGallery(grid) {
    const items = (window.SITE && window.SITE.pptGallery) || [];
    if (!items.length) {
      grid.innerHTML = '<p class="sp-empty">课件图片暂未配置。</p>';
      return;
    }
    /* config 里的 img 相对 src/ 书写，必须过 SITE.url() 才能从仓库根的
       主页解析到 src/assets/…；直接拼进 src 会请求根目录下的 assets/，404。 */
    grid.innerHTML = items
      .map(function (p) {
        const url = window.SITE.url(p.img);
        return (
          '<figure class="sp-tile" data-full="' + esc(url) + '" data-cap="' + esc(p.cap) +
          '" role="button" tabindex="0">' +
          '<img src="' + esc(url) + '" alt="' + esc(p.alt) + '" loading="lazy">' +
          '<figcaption>' + esc(p.cap) + '</figcaption>' +
          '</figure>'
        );
      })
      .join('');

    /* 自己绑定点击与键盘，不赌 index.html 里那段委托还在；页面内联脚本也认
       .sp-tile，两个监听同时开会设两遍图，所以这里截住冒泡。 */
    grid.addEventListener('click', function (e) {
      const tile = e.target.closest('.sp-tile');
      if (!tile) return;
      e.stopPropagation();
      openLightbox(tile.dataset.full, tile.dataset.cap);
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tile = e.target.closest('.sp-tile');
      if (!tile) return;
      e.preventDefault();
      e.stopPropagation();
      openLightbox(tile.dataset.full, tile.dataset.cap);
    });

    /* 折起按钮只在手机端出现 */
    if (items.length <= FOLD_LIMIT) return;

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'sp-more';
    more.setAttribute('aria-controls', grid.id || '');
    grid.parentNode.insertBefore(more, grid.nextSibling);

    let expanded = false;
    const rest = items.length - FOLD_LIMIT;

    const sync = function () {
      const narrow = window.matchMedia(COLLAPSE_MQ).matches;
      grid.classList.toggle('is-collapsed', narrow && !expanded);
      more.hidden = !narrow || expanded;
      more.textContent = '展开其余 ' + rest + ' 张课件';
      more.setAttribute('aria-expanded', String(expanded));
    };

    more.addEventListener('click', function () {
      expanded = true;
      sync();
    });

    /* 从窄屏切回宽屏时复位，免得回窄屏时一直铺开 */
    window.matchMedia(COLLAPSE_MQ).addEventListener('change', function (e) {
      if (!e.matches) expanded = false;
      sync();
    });

    sync();
  }

  /* 卡片里只出现课件本身：没有工具条、没有下载入口、也没有滚动条。课件是 16:9
     横向页面，连续滚动只会在卡片里堆出几道看不清的横条，一屏一页更像放映。 */
  function viewerHtml(title) {
    return (
      '<div class="sp-viewer" aria-label="' + esc(title) + '">' +
      '<div class="sp-body">' +
      '<nav class="sp-thumbs" data-thumbs aria-label="页面缩略图"></nav>' +
      '<div class="sp-stage" data-stage tabindex="0" role="region" ' +
      'aria-label="课件页面，左右方向键翻页">' +
      '<div class="sp-pages" data-pages>' +
      '<div class="sp-page" data-page="1">' +
      '<span class="sp-page-no" aria-hidden="true">1</span><canvas></canvas>' +
      '</div>' +
      '</div>' +
      '<button class="sp-arrow sp-arrow--prev" type="button" data-prev ' +
      'aria-label="上一页"><span aria-hidden="true">&#8249;</span></button>' +
      '<button class="sp-arrow sp-arrow--next" type="button" data-next ' +
      'aria-label="下一页"><span aria-hidden="true">&#8250;</span></button>' +
      '<div class="sp-state" data-state data-mode="loading">' +
      '<div data-card="loading"><div class="sp-loadcard">' +
      '<p class="sp-loadtitle">正在载入课件</p>' +
      '<div class="sp-progress is-indeterminate" data-progress><span></span></div>' +
      '<p class="sp-loadnote" data-progress-note aria-live="polite">正在载入阅读器…</p>' +
      '</div></div>' +
      '<div data-card="fail"><div class="sp-failcard">' +
      '<h3>课件暂时无法载入</h3>' +
      '<p data-fail-note>请检查网络后重试。</p>' +
      '<div class="sp-actions">' +
      '<button class="btn btn-sm" type="button" data-retry>重试</button>' +
      '</div>' +
      '</div></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function setupPdf(panel) {
    const stage = panel.querySelector('[data-stage]');
    const pagesEl = panel.querySelector('[data-pages]');
    const pageEl = panel.querySelector('.sp-page');
    const canvas = pageEl ? pageEl.querySelector('canvas') : null;
    const pageNoEl = pageEl ? pageEl.querySelector('.sp-page-no') : null;
    const thumbsEl = panel.querySelector('[data-thumbs]');
    const stateEl = panel.querySelector('[data-state]');
    const prevBtn = panel.querySelector('[data-prev]');
    const nextBtn = panel.querySelector('[data-next]');
    const progressEl = panel.querySelector('[data-progress]');
    const progressBar = progressEl ? progressEl.querySelector('span') : null;
    const progressNote = panel.querySelector('[data-progress-note]');
    const failNote = panel.querySelector('[data-fail-note]');

    let phase = 'loading'; // loading | ready | fail
    let pdfDoc = null;
    let numPages = 0;
    let baseW = 0;
    let baseH = 0;
    let scale = 1;
    let epoch = 0;         // 每次重排自增，旧的渲染任务据此作废
    let curPage = 1;
    let started = false;
    let renderTask = null;

    const thumbEls = [];
    let thumbIO = null;
    let resizeTimer = 0;

    function setState(mode) {
      phase = mode;
      if (mode === 'ready') {
        stateEl.hidden = true;
        return;
      }
      stateEl.hidden = false;
      stateEl.dataset.mode = mode;
    }

    function setProgress(ratio) {
      if (!progressEl || !progressBar) return;
      if (ratio == null) {
        progressEl.classList.add('is-indeterminate');
        progressBar.style.width = '';
        return;
      }
      progressEl.classList.remove('is-indeterminate');
      progressBar.style.width = Math.max(2, Math.min(100, Math.round(ratio * 100))) + '%';
    }

    function setProgressNote(text) {
      if (progressNote) progressNote.textContent = text;
    }

    function fail(msg) {
      if (failNote && msg) failNote.textContent = msg;
      setState('fail');
      setProgress(null);
    }

    /* 整页装进舞台，横竖都不裁：用 contain 的比例（宽、高两个方向的较小者），
       一页始终完整可见。舞台尺寸由 CSS 固定，只在窗口/容器变化时重算。 */
    function measureScale() {
      if (!numPages || !baseW) return;
      const cs = window.getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = Math.max(160, (stage.clientWidth || 720) - padX);
      const availH = Math.max(120, (stage.clientHeight || 480) - padY);
      const s = Math.min(availW / baseW, availH / baseH);
      scale = isFinite(s) && s > 0 ? s : 0.5;
    }

    function layoutPage() {
      if (!numPages || !pageEl) return;
      measureScale();
      epoch++;
      pageEl.style.width = Math.round(baseW * scale) + 'px';
      pageEl.style.height = Math.round(baseH * scale) + 'px';
      /* 换比例后旧位图作废 */
      pageEl.classList.remove('is-ready');
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      renderPage(curPage);
    }

    function scheduleLayout() {
      if (resizeTimer) return;
      resizeTimer = setTimeout(function () {
        resizeTimer = 0;
        if (phase !== 'ready') return;
        layoutPage();
      }, 120);
    }

    function renderPage(n) {
      if (!pdfDoc || !canvas || n < 1 || n > numPages) return;

      if (renderTask) {
        try { renderTask.cancel(); } catch (e) { /* 已结束的任务取消会抛，忽略 */ }
        renderTask = null;
      }
      const myEpoch = epoch;
      pageEl.classList.remove('is-ready');
      if (pageNoEl) pageNoEl.textContent = String(n);

      pdfDoc.getPage(n).then(function (page) {
        if (myEpoch !== epoch) return;
        /* 按 2 倍以内的 DPR 出图，高分屏上仍清晰 */
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.max(1, Math.floor(vp.width));
        canvas.height = Math.max(1, Math.floor(vp.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const task = page.render({ canvasContext: ctx, viewport: vp });
        renderTask = task;
        return task.promise.then(function () {
          if (myEpoch !== epoch) return;
          renderTask = null;
          pageEl.classList.add('is-ready');
        });
      }).catch(function (err) {
        renderTask = null;
        if (err && err.name === 'RenderingCancelledException') return;
        if (window.console) console.warn('[slides-panel] 第 ' + n + ' 页渲染失败', err);
      });
    }

    function renderThumb(n) {
      const btn = thumbEls[n - 1];
      if (!btn || btn.dataset.rendered === '1' || !pdfDoc) return;
      const box = btn.querySelector('.sp-thumb-canvas');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      pdfDoc.getPage(n).then(function (page) {
        const v1 = page.getViewport({ scale: 1 });
        const w = box.clientWidth || 120;
        const vp = page.getViewport({ scale: (w * dpr) / v1.width });
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.floor(vp.width));
        c.height = Math.max(1, Math.floor(vp.height));
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
          box.innerHTML = '';
          box.appendChild(c);
          btn.dataset.rendered = '1';
        }).catch(function () { /* 缩略图失败就留空框，不影响跳转 */ });
      }).catch(function () {});
    }

    function buildThumbs() {
      if (thumbIO) thumbIO.disconnect();
      thumbsEl.innerHTML = '';
      thumbEls.length = 0;
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= numPages; i++) {
        /* 用 <button> 而不是 <a href="#…">：点缩略图不该改地址栏、不该把页面滚走 */
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sp-thumb' + (i === curPage ? ' is-current' : '');
        b.dataset.page = i;
        b.setAttribute('aria-label', '跳到第 ' + i + ' 页');
        b.innerHTML =
          '<span class="sp-thumb-canvas"></span>' +
          '<span class="sp-thumb-no">' + i + '</span>';
        frag.appendChild(b);
        thumbEls.push(b);
      }
      thumbsEl.appendChild(frag);

      thumbIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) renderThumb(Number(e.target.dataset.page));
        });
      }, { root: thumbsEl, rootMargin: '400px 0px' });
      thumbEls.forEach(function (el) { thumbIO.observe(el); });

  /* 首屏先出当前页附近几张，免得缩略图栏全空 */
      renderThumb(curPage);
      renderThumb(curPage + 1);
      renderThumb(curPage - 1);
    }

    /* 缩略图的点击只挂一次：重试时只重建按钮，不重复绑监听 */
    thumbsEl.addEventListener('click', function (e) {
      const t = e.target.closest('.sp-thumb');
      if (!t) return;
      showPage(Number(t.dataset.page));
    });

    function highlight(n) {
      for (let i = 0; i < thumbEls.length; i++) {
        const on = i === n - 1;
        thumbEls[i].classList.toggle('is-current', on);
        if (on) thumbEls[i].setAttribute('aria-current', 'true');
        else thumbEls[i].removeAttribute('aria-current');
      }

    /* 缩略图栏跟着走，当前页始终留在可视区域里 */
      const t = thumbEls[n - 1];
      if (!t) return;
      const tb = thumbsEl.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      if (tr.top < tb.top || tr.bottom > tb.bottom) {
        thumbsEl.scrollTop += tr.top - tb.top - 8;
      }
    }

    function updateArrows() {
      if (prevBtn) prevBtn.disabled = curPage <= 1;
      if (nextBtn) nextBtn.disabled = curPage >= numPages;
    }

    /* 翻页的唯一入口：方向键、两侧箭头、缩略图都走这里 */
    function showPage(n) {
      if (phase !== 'ready') return;
      const target = Math.max(1, Math.min(numPages, n));
      if (target === curPage && pageEl.classList.contains('is-ready')) return;
      curPage = target;
      highlight(target);
      updateArrows();
      renderPage(target);
    }

    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        if (window.pdfjsLib) return resolve(window.pdfjsLib);
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () {
          if (window.pdfjsLib) resolve(window.pdfjsLib);
          else reject(new Error('pdfjsLib missing'));
        };
        s.onerror = function () { reject(new Error('script load failed')); };
        document.head.appendChild(s);
      });
    }

    function fetchPdf(url, onProgress) {
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 60000;
        xhr.onprogress = function (e) {
          if (e.lengthComputable && e.total) onProgress(e.loaded / e.total, e.loaded, e.total);
        };
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.response && xhr.response.byteLength) {
            resolve(xhr.response);
          } else {
            reject(new Error('HTTP ' + xhr.status));
          }
        };
        xhr.onerror = function () { reject(new Error('network error')); };
        xhr.ontimeout = function () { reject(new Error('timeout')); };
        xhr.send();
      });
    }

    function mbText(bytes) {
      if (!bytes) return '';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    async function start() {
      if (started) return;
      started = true;

      setState('loading');
      setProgress(null);
      setProgressNote('正在载入阅读器…');

      try {
        await loadScript(PDFJS_SRC);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      } catch (e) {
        fail('阅读器脚本没能载入，请检查网络后重试。');
        return;
      }

      const ctxOpts = {
        cMapUrl: PDFJS_BASE + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS_BASE + 'standard_fonts/',
        isEvalSupported: false,
      };

      let bytes = null;
      let lastErr = null;
      const urls = pdfUrlList();

      for (let i = 0; i < urls.length; i++) {
        setProgress(0);
        setProgressNote('正在载入课件…');
        try {
          bytes = await fetchPdf(urls[i], function (ratio, loaded, total) {
            setProgressNote(
              '正在载入课件… ' + Math.round(ratio * 100) + '%（' +
              mbText(loaded) + ' / ' + mbText(total) + '）'
            );
            setProgress(ratio);
          });
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!bytes) {
        if (window.console) console.warn('[slides-panel] PDF 拉取失败', lastErr);
        fail('课件没能下载完成，请稍后重试。');
        return;
      }

      setProgress(null);
      setProgressNote('正在解析课件…');

      try {
        const task = window.pdfjsLib.getDocument(
          Object.assign({ data: bytes }, ctxOpts)
        );
        pdfDoc = await task.promise;
      } catch (err) {
        if (window.console) console.warn('[slides-panel] PDF 解析失败', err);
        fail('课件解析失败，请稍后重试。');
        return;
      }

      numPages = pdfDoc.numPages;
      const first = await pdfDoc.getPage(1);
      const v = first.getViewport({ scale: 1 });
      baseW = v.width;
      baseH = v.height;

      setState('ready');
      measureScale();
      pageEl.style.width = Math.round(baseW * scale) + 'px';
      pageEl.style.height = Math.round(baseH * scale) + 'px';
      buildThumbs();
      showPage(1);
      curPage = 1;
      highlight(1);
      updateArrows();

      window.addEventListener('resize', scheduleLayout);
      if (window.ResizeObserver) {
        new ResizeObserver(scheduleLayout).observe(stage);
      }
    }

    /* 舞台可聚焦：方向键 / PageUp / PageDown / Home / End 都能翻，这是鼠标之外唯一的翻页方式。 */
    stage.addEventListener('keydown', function (e) {
      if (phase !== 'ready') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        showPage(curPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        showPage(curPage - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        showPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        showPage(numPages);
      }
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { showPage(curPage - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showPage(curPage + 1); });

    const retry = panel.querySelector('[data-retry]');
    if (retry) {
      retry.addEventListener('click', function () {
        started = false;
        if (renderTask) {
          try { renderTask.cancel(); } catch (e) { /* 已结束 */ }
          renderTask = null;
        }
        if (pdfDoc && pdfDoc.destroy) {
          try { pdfDoc.destroy(); } catch (e) { /* 已销毁 */ }
        }
        pdfDoc = null;
        numPages = 0;
        epoch++;
        curPage = 1;
        thumbEls.length = 0;
        thumbsEl.innerHTML = '';
        pageEl.classList.remove('is-ready');
        if (canvas) { canvas.width = 0; canvas.height = 0; }
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        start();
      });
    }

    return { start: start };
  }

  function mount(host) {
    const galleryItems = (window.SITE && window.SITE.pptGallery) || [];

    host.innerHTML =
      '<div class="sp-tabs" role="tablist" aria-label="课件视图">' +
      '<button class="sp-tab is-active" type="button" role="tab" id="sp-tab-img" ' +
      'aria-selected="true" aria-controls="sp-panel-img" data-tab="img">图片预览</button>' +
      '<button class="sp-tab" type="button" role="tab" id="sp-tab-pdf" ' +
      'aria-selected="false" aria-controls="sp-panel-pdf" tabindex="-1" data-tab="pdf">PDF 浏览</button>' +
      '</div>' +
      '<div class="sp-panel" id="sp-panel-img" role="tabpanel" aria-labelledby="sp-tab-img">' +
      '<div class="sp-grid" id="sp-grid" data-grid></div>' +
      '</div>' +
      '<div class="sp-panel" id="sp-panel-pdf" role="tabpanel" aria-labelledby="sp-tab-pdf" hidden>' +
      viewerHtml(pdfTitle()) +
      '</div>';

    const tabs = host.querySelectorAll('.sp-tab');
    const panelImg = host.querySelector('#sp-panel-img');
    const panelPdf = host.querySelector('#sp-panel-pdf');

    buildGallery(host.querySelector('[data-grid]'));

    const viewer = setupPdf(panelPdf);

    function activate(which) {
      tabs.forEach(function (t) {
        const on = t.dataset.tab === which;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panelImg.hidden = which !== 'img';
      panelPdf.hidden = which !== 'pdf';
      /* 懒加载的唯一触发点：第一次切到 PDF 才开始下载 */
      if (which === 'pdf') viewer.start();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        activate(next.dataset.tab);
      });
    });

    /* 图片墙为空时给一句提示，而不是一块空白 */
    if (!galleryItems.length) {
      const tab = host.querySelector('[data-tab="img"]');
      if (tab) tab.title = '课件图片暂未配置';
    }
  }

  function boot() {
    /* 站点主体脚本缺失就什么都不做；已渲染过（脚本被重复引入）也跳过 */
    if (!window.SITE) return;
    const host = document.getElementById(HOST_ID);
    if (!host) return;
    if (host.querySelector('.sp-tabs')) return;
    ensureCss();
    mount(host);
  }

  /* index.html 已手工引了 slides-panel.css；这里只作兜底，免得忘加 <link> 时面板裸奔 */
  function ensureCss() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (let i = 0; i < links.length; i++) {
      if (/slides-panel\.css(\?|$)/.test(links[i].getAttribute('href') || '')) return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = window.SITE.url('assets/css/slides-panel.css');
    document.head.appendChild(l);
  }

  /* Esc 关放大层；站点里那段委托若也在跑，重复关闭是无害的 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lbEl && !lbEl.hidden) closeLightbox();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
