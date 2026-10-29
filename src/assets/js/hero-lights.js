/* hero-lights.js —— 首屏 hero 的“符号呼吸”层（自挂载）。

   满色不透明，只有字形本身在 · ✢ ✳ ✶ ✻ ✽ 之间来回变换。变换不是打乱顺序，
   而是一条固定的往返路径：1→2→3→4→5→6→5→4→3→2→1→2→… 每颗只是从这条
   路径的某个点起跑（起始相位不同），所以二十颗永不同步，但走向始终一致。
   手机端（≤700px，与 hero-lights.css 的断点一致）跳过 ✳：该字符在移动端
   会被当成彩色 emoji 渲染、带一块绿底，路径因此变成 1→2→4→5→6→5→4→2→1。

   位置每次加载随机生成（带最小间距，避免叠在一起），不用常量表。
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

  /* ---------- 变换序列 ------------------------------------------------------ */

  /* 六个符号，按序号 1–6 排好。往返路径由 buildCycle 从它推出来。 */
  var CHARS = ['·', '✢', '✳', '✶', '✻', '✽'];

  /* 强制文本呈现（VS15）。这几个字符在部分系统上会被匹配成 emoji，
     带上 VS15 后一律走字形字体，不会再出现彩色／底色的方块。 */
  var VS15 = '︎';

  var MOBILE_MQ = '(max-width: 700px)';   /* 与 hero-lights.css 的窄屏断点一致 */
  var MOBILE_SKIP = '✳';                   /* 移动端渲染成带绿底的 emoji，跳过 */

  var COUNT = 20;

  /* 生成往返路径：1,2,…,n,n-1,…,2，再接回 1 循环。
     n=6 → 1 2 3 4 5 6 5 4 3 2；n=5（移动端去掉 ✳）→ 1 2 4 5 6 5 4 2。
     路径本身是闭环，所以任何一颗从哪一格起跑，都只是进入环的位置不同，
     走向依然是同一条来回序列。 */
  function buildCycle(isMobile) {
    var seq = [];
    for (var i = 0; i < CHARS.length; i++) {
      if (isMobile && CHARS[i] === MOBILE_SKIP) continue;
      seq.push(CHARS[i]);
    }
    var path = [];
    var j;
    for (j = 0; j < seq.length; j++) path.push(j);
    for (j = seq.length - 2; j >= 1; j--) path.push(j);
    return { seq: seq, path: path };
  }

  function mobileQuery() {
    if (!window.matchMedia) return null;
    try {
      return window.matchMedia(MOBILE_MQ);
    } catch (e) {
      return null;
    }
  }

  /* ---------- 随机位置 ------------------------------------------------------ */

  /* 每颗的位置每次加载现抽，但保留一个最小间距：纯均匀随机常会两三点重合，
     满色字形叠在一起会糊成一块。做法是每颗最多试 30 次，取其中离已有
     点最远的一个；试完仍不够远就用当下最好的那个，不无限重试。
     横向权重 ×1.6：首屏是宽幅，同样的百分比间距在横向上看着更近。 */
  var POS_MARGIN = 4;      /* 离边缘留余量，别被 overflow:hidden 切掉 */
  var POS_MIN_DIST = 15;   /* 任意两颗的最小间距（百分比空间） */

  function randomPositions(n) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var best = null;
      var bestD = -1;
      for (var tries = 0; tries < 30; tries++) {
        var x = POS_MARGIN + Math.random() * (100 - POS_MARGIN * 2);
        var y = POS_MARGIN + Math.random() * (100 - POS_MARGIN * 2);
        var d = Infinity;
        for (var j = 0; j < pts.length; j++) {
          var dx = (x - pts[j].x) * 1.6;
          var dy = y - pts[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < d) d = dist;
        }
        if (d > bestD) {
          bestD = d;
          best = { x: x, y: y };
        }
        if (d >= POS_MIN_DIST) break;
      }
      pts.push(best);
    }
    return pts;
  }

  /* 字号仍分几档，保留“大锚点 + 小碎点”的层次，只是不再固定绑在某颗身上。 */
  var SIZES = [10, 11, 11, 12, 12, 13, 13, 14, 17, 19, 20, 24];

  function pickSize() {
    return SIZES[Math.floor(Math.random() * SIZES.length)];
  }

  function pickStep() {
    /* 50 的整数倍，和 TICK 对齐，避免节拍被抖 */
    return 500 + Math.floor(Math.random() * 9) * 50;   /* 500–900ms */
  }

  /* ---------- 计时 ---------------------------------------------------------- */

  /* 唯一的一个共享计时器，不用逐帧 rAF：换字是瞬时的，50ms 一个 tick 就够。
     每拍只改该换字的那几颗的 textContent，不触发重排；页面切后台被节流时
     下标由 Date.now() 直接算出，回到前台立刻对齐。 */
  var items = [];
  var cycle = buildCycle(false);
  var mq = mobileQuery();

  var TICK = 50;

  function glyphText(index) {
    return cycle.seq[index] + VS15;
  }

  function buildGlyphs(layer) {
    var frag = document.createDocumentFragment();
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pts = randomPositions(COUNT);

    for (var i = 0; i < COUNT; i++) {
      var el = div('hl-glyph');
      /* 约四分之一的字形取 accent 档，随机分配，每次加载的节奏都不一样 */
      if (Math.random() < 0.22) el.className += ' hl-glyph--accent';

      /* 位置 / 字号走自定义属性而不是内联 left/top：内联样式优先级高于媒体查询里的
         普通声明，写成变量后断点才好接手。 */
      el.style.setProperty('--hl-x', pts[i].x.toFixed(2) + '%');
      el.style.setProperty('--hl-y', pts[i].y.toFixed(2) + '%');
      el.style.setProperty('--hl-fs', pickSize() + 'px');

      /* 随机起始相位：决定它从往返路径的哪一格起跑，也就是“不同的启始”。
         相位只决定入环位置，不改变路径本身——所以依旧是来回循环。 */
      var step = pickStep();
      var phase = Math.floor(Math.random() * 100000);

      var it = {
        el: el,
        step: step,
        phase: phase,
        idx: -1,
        frozen: reduced      /* 减少动态时停在第一个符号 */
      };

      it.idx = reduced ? 0 : Math.floor((Date.now() + phase) / step) % cycle.path.length;
      el.textContent = reduced ? cycle.seq[0] + VS15 : glyphText(cycle.path[it.idx]);

      items.push(it);
      frag.appendChild(el);
    }
    layer.appendChild(frag);
  }

  function tick() {
    var now = Date.now();
    var path = cycle.path;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.frozen) continue;
      var idx = Math.floor((now + it.phase) / it.step) % path.length;
      if (idx !== it.idx) {
        it.idx = idx;
        it.el.textContent = glyphText(path[idx]);
      }
    }
  }

  /* 断点切换时重建往返路径（移动端会去掉 ✳）。下标全部作废，
     下一拍按新路径重算，字形立刻跟上。 */
  function onMobileChange() {
    cycle = buildCycle(mq ? mq.matches : false);
    for (var i = 0; i < items.length; i++) items[i].idx = -1;
    tick();
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

    cycle = buildCycle(mq ? mq.matches : false);
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
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', onMobileChange);
      else if (mq.addListener) mq.addListener(onMobileChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
