/* hero-geo.js —— 首屏 hero 的几何背景与运动层（自挂载）。

   全部图形层 pointer-events:none，不影响按钮点击与文字选择；没有逐帧 rAF 循环，
   动效全交给 CSS；找不到 .hero 就安静退出。无 fetch、无依赖，file:// 可运行。
   若页面未手动引入 hero-geo.css，本脚本会按自身路径补一个 <link>。 */
(function () {
  'use strict';

  var script = document.currentScript;

  /* 运动层总开关：false = 只画静态几何，所有 CSS 动画停掉。 */
  var MOTION = true;

  function ensureStylesheet() {
    if (document.querySelector('link[data-hero-geo]')) return;
    var href = '';
    if (script && script.src) {
      try {
        href = new URL('../css/hero-geo.css', script.src).href;
      } catch (e) {
        href = '';
      }
    }
    if (!href) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-hero-geo', '');
    document.head.appendChild(link);
  }

  /* 固定种子：每次刷新星位一致 */
  function makeRandom(seed) {
    return function () {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  }

  /* 内联兜底样式：CSS 未到达前也不会挤动布局 */
  function inert(el) {
    el.style.position = 'absolute';
    el.style.inset = '0';
    el.style.pointerEvents = 'none';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function div(className) {
    var el = document.createElement('div');
    el.className = className;
    return el;
  }

  function buildStars(layer, count) {
    var rnd = makeRandom(20261029);
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var isSpark = rnd() > 0.78;
      var isAccent = rnd() > 0.86;
      var star = div('hero-geo__star');
      if (isSpark) star.className += ' hero-geo__star--spark';
      if (isAccent) star.className += ' hero-geo__star--accent';

      /* 横向只落在右半幅：左栏是标题与按钮，不铺高频元素 */
      var x = 46 + rnd() * 54;
      var y = 6 + rnd() * 88;

      star.style.left = x.toFixed(2) + '%';
      star.style.top = y.toFixed(2) + '%';
      star.style.setProperty('--hg-o', (0.2 + rnd() * 0.4).toFixed(2));
      star.style.animationDelay = (-rnd() * 9).toFixed(2) + 's';

      if (!isSpark) {
        var s = 2 + Math.round(rnd() * 2);
        star.style.width = s + 'px';
        star.style.height = s + 'px';
      }

      frag.appendChild(star);
    }
    layer.appendChild(frag);
  }

  /* 书背后的轨道环，交给 OrbitField；组件脚本缺失时静默跳过 */
  function buildRings() {
    var host = div('hero-geo-book__rings');
    host.setAttribute('aria-hidden', 'true');
    /* 轨道层挂在 .hero-art 下、不在 .hero-geo 子树里，data-hero-anim="off" 那条
       CSS 规则够不到它，所以总开关得单独给宿主一个冻结标记。 */
    if (!MOTION) host.setAttribute('data-of-anim', 'off');
    if (window.OrbitField) window.OrbitField.create(host);
    return host;
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (hero.querySelector('.hero-geo')) return;

    ensureStylesheet();

    var geo = div('hero-geo');
    inert(geo);
    geo.style.zIndex = '0';

    if (!MOTION) geo.setAttribute('data-hero-anim', 'off');

    var grid = div('hero-geo__layer hero-geo__grid');
    var band = div('hero-geo__layer hero-geo__band');
    var glow = div('hero-geo__layer hero-geo__glow');
    var ticks = div('hero-geo__layer hero-geo__ticks');
    var stars = div('hero-geo__layer hero-geo__stars');

    geo.appendChild(grid);
    geo.appendChild(band);
    geo.appendChild(glow);
    geo.appendChild(ticks);
    geo.appendChild(stars);
    buildStars(stars, 26);

    hero.insertBefore(geo, hero.firstChild);

    /* 书背后的承托层：插进 .hero-art 内部，天然跟随网格断点 */
    var art = hero.querySelector('.hero-art');
    if (!art) return;
    if (art.querySelector('.hero-geo-book')) return;

    var book = div('hero-geo-book');
    inert(book);
    book.style.zIndex = '0';

    var stage = div('hero-geo-book__stage');

    var halo = div('hero-geo-book__halo');
    var slab = div('hero-geo-book__slab');
    var plane = div('hero-geo-book__plane');
    var corners = div('hero-geo-book__corners');
    var sun = div('hero-geo-book__sun');

    stage.appendChild(halo);
    stage.appendChild(slab);
    stage.appendChild(plane);
    stage.appendChild(buildRings());
    stage.appendChild(corners);
    stage.appendChild(sun);
    book.appendChild(stage);

    art.insertBefore(book, art.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
