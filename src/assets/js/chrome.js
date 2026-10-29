/* 页头、页脚、文档侧栏的唯一渲染入口。链接一律走 SITE.url()，子目录页面才不至于解析错。 */

const ICON = {
  github:
    '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  menu:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>',
  slides:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/></svg>',
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function assetUrl(p) {
  return window.SITE.url(p);
}

function renderAnnouncements() {
  const items = window.SITE.announcements || [];
  if (!items.length) return '';
  const body = items
    .map(
      (a) =>
        `<span class="announce-item">${esc(a.text)}${
          a.href ? ` <a href="${window.SITE.url(a.href)}">${esc(a.linkText || '了解详情')} →</a>` : ''
        }</span>`
    )
    .join('');
  return `<div class="announce"><div class="container"><span class="tag">公告</span><div class="announce-rotator" data-count="${items.length}">${body}</div></div></div>`;
}

function linkTo(href) {
  return href === '__home__' ? window.SITE.home : window.SITE.url(href);
}

function renderHeader(activePage) {
  const { nav, repo, book } = window.SITE;
  const links = nav
    .map(
      (n) =>
        `<a href="${linkTo(n.href)}"${n.id === activePage ? ' class="is-active" aria-current="page"' : ''}>${esc(n.label)}</a>`
    )
    .join('');
  return `
<header class="topbar">
  <div class="container">
    <a class="brand" href="${window.SITE.home}">
      <span>${esc(book.title)}<span class="brand-sub">${esc(book.titleEn ? 'token-to-llm' : '')}</span></span>
    </a>
    <nav class="nav" id="site-nav" aria-label="主导航">${links}</nav>
    <div class="nav-actions">
      <a class="btn btn-sm nav-repo" href="${repo.url}" target="_blank" rel="noopener" aria-label="代码仓库 token-to-llm（在 GitHub 打开）">${ICON.github}<span>代码仓库</span></a>
      <a class="btn btn-primary btn-sm" href="${window.SITE.home}#buy">购买</a>
      <button class="icon-btn nav-toggle" id="nav-toggle" aria-label="展开导航" aria-expanded="false" aria-controls="site-nav">${ICON.menu}</button>
    </div>
  </div>
</header>`;
}

function renderFooter() {
  const { book, repo, docs } = window.SITE;
  /* 页脚只列顶层文档：子页在侧栏已挂在索引下面，页脚再铺一遍会把一栏撑成十几行。 */
  const docLinks = docs.flatMap((g) => g.items.filter((d) => !d.sub));
  return `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="brand"><span>${esc(book.title)}</span></div>
        <p>${esc(book.publisher)} · ISBN ${esc(book.isbn)}<br>${esc(book.authors.join('、'))} 著</p>
      </div>
      <div class="footer-col">
        <h4>文档</h4>
        ${docLinks.map((d) => `<a href="${window.SITE.url(d.href)}">${esc(d.label)}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>资源</h4>
        <a href="${repo.url}" target="_blank" rel="noopener">token-to-llm 仓库</a>
        <a href="${window.SITE.url('docs/examples.html')}">运行示例</a>
        <a href="${window.SITE.home}#buy">购买</a>
      </div>
      <div class="footer-col">
        <h4>关于</h4>
        <a href="${window.SITE.url('thanks/index.html')}">致谢</a>
        <a href="${window.SITE.url('contact/index.html')}">联系与勘误</a>
        <a href="${repo.url}/issues" target="_blank" rel="noopener">反馈 Issue</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 ${esc(book.authors.join(' · '))}　保留所有权利</span>
      <span>
        <a href="mailto:${esc(window.SITE.contact.email)}">${esc(window.SITE.contact.email)}</a>
        　·　<a href="${window.SITE.url('thanks/index.html')}">致谢</a>
        　·　<a href="${repo.url}" target="_blank" rel="noopener">token-to-llm</a>
      </span>
    </div>
  </div>
</footer>`;
}

function renderDocSidebar(activeId) {
  const { docs } = window.SITE;
  return docs
    .map(
      (g) => `
    <div class="side-group">
      <h4>${esc(g.section)}</h4>
      ${g.items
        .map((it) => {
          const cls = [it.sub ? 'is-sub' : '', it.id === activeId ? 'is-active' : ''].filter(Boolean).join(' ');
          return (
            `<a href="${window.SITE.url(it.href)}"${cls ? ` class="${cls}"` : ''}` +
            `${it.id === activeId ? ' aria-current="page"' : ''}>${esc(it.label)}</a>`
          );
        })
        .join('')}
    </div>`
    )
    .join('');
}

function mountChrome({ page }) {
  const h = document.querySelector('[data-chrome="header"]');
  if (h) h.outerHTML = renderHeader(page);
  const f = document.querySelector('[data-chrome="footer"]');
  if (f) f.outerHTML = renderFooter();

  const bar = document.querySelector('.topbar');
  if (bar) {
    const sync = () => bar.classList.toggle('is-scrolled', window.scrollY > 4);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}

function mountSidebar(activeId) {
  const el = document.querySelector('[data-chrome="sidebar"]');
  if (!el) return;
  el.innerHTML = renderDocSidebar(activeId);

  /* 窄屏下 .sidebar 是 display:none，而原代码在这里找一个从未被创建过的
     #side-toggle —— 结果文档页在手机上完全没有入口切到别的章节。这里补上
     按钮本身；桌面端由 CSS 隐藏，按钮只在 ≤900px 出现。 */
  let sideToggle = document.getElementById('side-toggle');
  if (!sideToggle) {
    sideToggle = document.createElement('button');
    sideToggle.type = 'button';
    sideToggle.id = 'side-toggle';
    sideToggle.className = 'side-toggle';
    sideToggle.setAttribute('aria-expanded', 'false');
    sideToggle.textContent = '文档目录';
    el.parentNode.insertBefore(sideToggle, el);
    if (!el.id) el.id = 'doc-sidebar';
    sideToggle.setAttribute('aria-controls', el.id);
  }

  sideToggle.addEventListener('click', () => {
    const open = el.classList.toggle('is-open');
    sideToggle.setAttribute('aria-expanded', String(open));
  });
}

/* 手写页面的页内目录；markdown 页面走 MD.mountToc，这里是给 chapters / teaching 这类静态页用的。 */
function mountTocFromDom() {
  const el = document.querySelector('[data-chrome="toc"]');
  const body = document.querySelector('.doc-body');
  if (!el || !body) return;

  const heads = [...body.querySelectorAll('h2, h3')];
  if (!heads.length) {
    el.innerHTML = '';
    return;
  }

  const items = heads.map((h, i) => {
    if (!h.id) h.id = 'h-' + (h.textContent || '').trim().slice(0, 24).replace(/\s+/g, '-') + '-' + i;
    return { id: h.id, text: h.textContent.trim(), level: h.tagName === 'H2' ? 2 : 3 };
  });

  el.innerHTML =
    '<h4>本页目录</h4>' +
    items.map((t) => `<a href="#${t.id}" class="lvl-${t.level}">${esc(t.text)}</a>`).join('');

  const links = [...el.querySelectorAll('a')];
  const targets = items.map((t) => document.getElementById(t.id)).filter(Boolean);
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
