/* orbit-field.js —— 同心的椭圆轨道 + 沿轨道公转的卫星，自挂载或手动 create。

   整盘共用一个中心、一个轴比（squash）和一个倾角（tilt），倾斜只作用在最外层 <g>，
   所以五条轨道天然平行，读作同一个盘面而不是几圈乱叠的等高线。颜色一律留
   currentColor，由调用方的 CSS 决定。

   用法：OrbitField.create(hostEl, { tilt, rings, satellites })，或给元素加
   data-orbit（可带 data-orbit-config 的 JSON）自挂载。

   无 fetch、无依赖，file:// 双击即可运行；找不到宿主时静默退出。 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* ring.r 是长半轴，短半轴 = r × squash。satellite.phase 是起始角（度，0° = 右侧，
     顺时针为正）；tone 只写类名，颜色交给 CSS。 */
  var DEFAULTS = {
    size: 400,
    center: 200,
    tilt: -16,      /* 整盘倾角，所有椭圆共用 */
    squash: 0.34,   /* 轴比 ry / rx，所有椭圆共用 */
    rings: [
      { r: 190, tone: 'far',   width: 1,   dash: null },
      { r: 168, tone: 'far',   width: 1,   dash: '5 9' },
      { r: 146, tone: 'near',  width: 1.2, dash: null },
      { r: 124, tone: 'far',   width: 1,   dash: '18 6 2 6' },
      { r: 102, tone: 'near',  width: 1.5, dash: null }
    ],
    satellites: [
      { ring: 0, r: 2.4, dur: 27, phase: 12,  reverse: false, tone: 'accent' },
      { ring: 1, r: 2.1, dur: 35, phase: 208, reverse: true,  tone: 'base' },
      { ring: 2, r: 2.6, dur: 22, phase: 122, reverse: false, tone: 'base' },
      { ring: 3, r: 2.0, dur: 30, phase: 296, reverse: true,  tone: 'accent' },
      { ring: 4, r: 2.3, dur: 44, phase: 66,  reverse: false, tone: 'base' }
    ]
  };

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  /* 深合并：一层对象与数组整体替换，够这里用 */
  function merge(base, patch) {
    var out = {};
    var k;
    for (k in base) {
      if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    }
    for (k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) out[k] = patch[k];
    }
    return out;
  }

  function create(host, patch) {
    if (!host) return null;
    var cfg = merge(DEFAULTS, patch || {});

    var cx = cfg.center;
    var cy = cfg.center;
    var k = cfg.squash;
    var rings = cfg.rings || [];
    var sats = cfg.satellites || [];

    var svg = el('svg', {
      class: 'of-svg',
      viewBox: '0 0 ' + cfg.size + ' ' + cfg.size,
      fill: 'none',
      'aria-hidden': 'true'
    });

    /* 整盘倾角只写一次：椭圆与卫星一起转，倾斜天然统一 */
    var root = el('g', {
      class: 'of-root',
      transform: 'rotate(' + cfg.tilt + ' ' + cx + ' ' + cy + ')'
    });

    var ringLayer = el('g', { class: 'of-rings' });
    for (var i = 0; i < rings.length; i++) {
      var R = rings[i];
      var attrs = {
        class: 'of-ring of-ring--' + (R.tone || 'near'),
        cx: cx,
        cy: cy,
        rx: R.r,
        ry: (R.r * k).toFixed(2),
        'stroke-width': R.width == null ? 1 : R.width
      };
      if (R.dash) {
        attrs['stroke-dasharray'] = R.dash;
        attrs['stroke-linecap'] = 'round';
      }
      var ring = el('ellipse', attrs);
      if (R.opacity != null) ring.setAttribute('stroke-opacity', R.opacity);
      ringLayer.appendChild(ring);
    }
    root.appendChild(ringLayer);

    /* 卫星沿椭圆走靠四层变换逐层剥掉压扁：
         .of-squash   translate(0, cy(1-k)) scale(1, k)   整盘以 y=cy 为轴压扁
           .of-orbit  CSS rotate(θ)                       绕中心匀速公转
             <g translate(r 0)>                           推到该圈长轴端点
               .of-cancel  CSS rotate(-θ)                  抵消公转
                 <g scale(1, 1/k)>                         抵消压扁
                   <circle>                                净变换 = 单位阵
       于是圆点在任何角度都是正圆，圆心精确落在椭圆曲线上。拖尾弧也放在
       .of-orbit 里，随点一起转，所以永远是“点身后那一段”。 */
    var squashLayer = el('g', {
      class: 'of-squash',
      transform: 'translate(0 ' + (cy * (1 - k)).toFixed(2) + ') scale(1 ' + k + ')'
    });

    for (var j = 0; j < sats.length; j++) {
      var S = sats[j];
      var ringCfg = rings[S.ring] || rings[rings.length - 1];
      if (!ringCfg) continue;
      var radius = ringCfg.r;
      var reverse = !!S.reverse;
      var tone = S.tone && S.tone !== 'base' ? ' of-sat--' + S.tone : '';

      var orbit = el('g', {
        class: 'of-orbit' + tone,
        style:
          '--of-phase:' + (S.phase || 0) + 'deg;' +
          '--of-sweep:' + (reverse ? '-360deg' : '360deg') + ';' +
          '--of-dur:' + (S.dur || 30) + 's;' +
          '--of-del:' + (S.delay == null ? -((S.dur || 30) * 0.3) : S.delay) + 's'
      });

      /* 拖尾：近处亮、远处淡。pathLength 归一成 1000，弧长比例与椭圆半径无关。
         顺时针运动时拖尾在起始角“之后”（负路径长度），故偏移取正值。 */
      if (S.trail !== false) {
        var tA = reverse ? 0 : 26;
        var tB = reverse ? -26 : 90;
        orbit.appendChild(el('circle', {
          class: 'of-trail of-trail--near',
          cx: cx, cy: cy, r: radius, pathLength: 1000,
          'stroke-dasharray': '26 974',
          'stroke-dashoffset': tA
        }));
        orbit.appendChild(el('circle', {
          class: 'of-trail of-trail--far',
          cx: cx, cy: cy, r: radius, pathLength: 1000,
          'stroke-dasharray': '64 936',
          'stroke-dashoffset': tB
        }));
      }

      var anchor = el('g', { transform: 'translate(' + (cx + radius) + ' ' + cy + ')' });
      var cancel = el('g', { class: 'of-cancel' });
      var restore = el('g', { transform: 'scale(1 ' + (1 / k).toFixed(4) + ')' });
      var halo = el('circle', { class: 'of-sat__halo', r: (S.r || 2.2) * 2.2 });
      var dot = el('circle', { class: 'of-sat__dot', r: S.r || 2.2 });

      restore.appendChild(halo);
      restore.appendChild(dot);
      cancel.appendChild(restore);
      anchor.appendChild(cancel);
      orbit.appendChild(anchor);
      squashLayer.appendChild(orbit);
    }

    root.appendChild(squashLayer);
    svg.appendChild(root);
    host.appendChild(svg);
    return svg;
  }

  function autoMount() {
    var hosts = document.querySelectorAll('[data-orbit]');
    for (var i = 0; i < hosts.length; i++) {
      var node = hosts[i];
      if (node.querySelector('.of-svg')) continue;
      var patch = null;
      var raw = node.getAttribute('data-orbit-config');
      if (raw) {
        try {
          patch = JSON.parse(raw);
        } catch (e) {
          patch = null;
        }
      }
      create(node, patch);
    }
  }

  global.OrbitField = { create: create, defaults: DEFAULTS, autoMount: autoMount };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  } else {
    autoMount();
  }
})(window);
