/* hero-lights.js —— 首屏 hero 的“符号呼吸”层（自挂载）。

   满色不透明，只有字形本身在 · ✢ ✳ ✶ ✻ ✽ 之间来回变换。每颗的符号序列、
   停留时长、起始相位都不同，所以二十颗永远不同步。

   已有 .hero-lights 就跳过；整层 pointer-events:none、aria-hidden；找不到 .hero
   安静退出。无 fetch、无依赖，file:// 可运行；页面没引 hero-lights.css 时按自身
   路径补一个 <link>。 */
(function () {
  'use strict';

  var script = document.currentScript;

  function ensureStylesheet() {
    if (document.querySelector('link[data-hero-lights]')) return;
    var href = '';
    if (script && script.src) {
      try {
        href = new URL('../css/hero-lights.css', script.src).href;
      } catch (e) {
        href = '';
      }
    }
    if (!href) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-hero-lights', '');
    document.head.appendChild(link);
  }

  function div(className) {
    var el = document.createElement('div');
    el.className = className;
    return el;
  }

  /* 二十颗的常量表。set 是轮换的符号序列，step 是每个符号停留的毫秒数；
     层次只靠字号拉开，没有透明度这个维度。

     布局（1440 宽桌面首屏）：左栏 x < 52% 只放 9 颗且字号压小，满色之后靠体积
     收敛，不与汉字笔画抢视线；右半幅是书封与轨道，密度最高；中段右侧
     （x≈80–95, y≈60–70）留空做呼吸区。任何两颗至少隔开约 8% 宽度。 */
  var GLYPHS = [
    /* 左栏（x < 52%） */
    { set: ['·', '✢', '✳'],         x: 3,  y: 9,  size: 24, tone: 'base',   step: 780, phase: 0 },
    { set: ['✢', '✳', '✶', '✻'],   x: 20, y: 4,  size: 11, tone: 'base',   step: 560, phase: 700 },
    { set: ['✳', '✶', '✽'],         x: 41, y: 3,  size: 12, tone: 'base',   step: 640, phase: 1450 },
    { set: ['✶', '✻', '✽', '·'],   x: 3,  y: 38, size: 14, tone: 'base',   step: 600, phase: 2300 },
    { set: ['✻', '✽', '✢'],         x: 15, y: 64, size: 11, tone: 'base',   step: 720, phase: 900 },
    { set: ['✽', '·', '✳'],         x: 3,  y: 93, size: 13, tone: 'base',   step: 660, phase: 1750 },
    { set: ['·', '✢', '✳', '✶'],   x: 28, y: 90, size: 17, tone: 'base',   step: 580, phase: 400 },
    { set: ['✢', '✳', '✻'],         x: 44, y: 76, size: 10, tone: 'base',   step: 500, phase: 2600 },
    { set: ['✳', '✶', '✽', '·'],   x: 24, y: 27, size: 11, tone: 'base',   step: 700, phase: 1200 },

    /* 右半幅上缘（书的上方） */
    { set: ['✶', '✻', '✽'],         x: 58, y: 10, size: 12, tone: 'base',   step: 620, phase: 320 },
    { set: ['✻', '✽', '·', '✢'],   x: 74, y: 22, size: 19, tone: 'accent', step: 640, phase: 1900 },
    { set: ['✽', '·', '✢', '✳'],   x: 95, y: 4,  size: 14, tone: 'base',   step: 560, phase: 800 },
    { set: ['·', '✢', '✳'],         x: 97, y: 34, size: 11, tone: 'base',   step: 820, phase: 2200 },

    /* 右半幅中段（书身两侧） */
    { set: ['✢', '✳', '✶', '✻'],   x: 86, y: 52, size: 20, tone: 'accent', step: 740, phase: 300 },
    { set: ['✳', '✶', '✻', '✽'],   x: 68, y: 44, size: 12, tone: 'base',   step: 560, phase: 1500 },
    { set: ['✶', '✻', '✽'],         x: 56, y: 58, size: 13, tone: 'base',   step: 660, phase: 2450 },
    { set: ['✻', '✽', '·'],         x: 88, y: 30, size: 10, tone: 'accent', step: 500, phase: 1050 },

    /* 右半幅下缘 / 右下角 */
    { set: ['✽', '·', '✢', '✳'],   x: 76, y: 74, size: 18, tone: 'base',   step: 700, phase: 1650 },
    { set: ['·', '✢', '✳'],         x: 96, y: 78, size: 12, tone: 'accent', step: 600, phase: 550 },
    { set: ['✢', '✳', '✶', '✻', '✽'], x: 61, y: 88, size: 24, tone: 'accent', step: 880, phase: 1950 }
  ];

  /* 唯一的一个共享计时器，不用逐帧 rAF：换字是瞬时的，60ms 一个 tick 就够。
     每拍只改该换字的那几颗的 textContent，不触发重排；页面切后台被节流时下标
     由 Date.now() 直接算出，回到前台立刻对齐。 */
  var items = [];

  /* 与最短 step（500ms）整除，避免 0.5s 的节拍被抖成 0.48/0.54 */
  var TICK = 50;

  function buildGlyphs(layer) {
    var frag = document.createDocumentFragment();
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (var i = 0; i < GLYPHS.length; i++) {
      var g = GLYPHS[i];
      var el = div('hl-glyph');
      if (g.tone === 'accent') el.className += ' hl-glyph--accent';

      /* 位置 / 字号走自定义属性而不是内联 left/top：内联样式优先级高于媒体查询里的
         普通声明，写成变量后断点才好接手。 */
      el.style.setProperty('--hl-x', g.x + '%');
      el.style.setProperty('--hl-y', g.y + '%');
      el.style.setProperty('--hl-fs', g.size + 'px');

      el.textContent = g.set[0];

      items.push({
        el: el,
        set: g.set,
        step: g.step,
        phase: g.phase,
        idx: 0,
        frozen: reduced      /* 减少动态时停在第一个符号 */
      });

      frag.appendChild(el);
    }
    layer.appendChild(frag);
  }

  function tick() {
    var now = Date.now();
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.frozen) continue;
      var idx = Math.floor((now + it.phase) / it.step) % it.set.length;
      if (idx !== it.idx) {
        it.idx = idx;
        it.el.textContent = it.set[idx];
      }
    }
  }

  function mount() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (hero.querySelector('.hero-lights')) return;

    ensureStylesheet();

    var layer = div('hero-lights');
    layer.setAttribute('aria-hidden', 'true');
    /* 静态属性也内联写一份：CSS 还没到的那一两帧不会挤动布局 */
    layer.style.position = 'absolute';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '0';

    buildGlyphs(layer);

    /* 插成第一个子元素，落在所有内容之下 */
    hero.insertBefore(layer, hero.firstChild);

    /* 先对齐一次相位再挂计时器；页面隐藏时停表省电 */
    tick();
    var timer = null;
    function start() {
      if (timer === null) timer = window.setInterval(tick, TICK);
    }
    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    start();
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else { tick(); start(); }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
