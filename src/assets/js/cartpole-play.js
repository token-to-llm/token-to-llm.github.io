/* CartPole 回放：把 record_cartpole.py 录下的帧逐帧重播。数据来自
   window.CARTPOLE_RUN（用 .js 而非 .json，file:// 打开时 fetch 本地文件会被拦）。
   播放器只做插值回放，不重跑物理，画面必然是录制时真实走过的轨迹。

   两个视图：测试（frames，训练好的策略跑一整局）与训练记录（runs，10 个检查点
   各一局），共用 stageMarkup / makeRig，画布逐像素一致。

   挂载：页面放 <div id="cartpole-demo"></div>，再引入本文件与 cartpole-play.css。 */

(function () {
  'use strict';

  const MAX_X = 2.4;                 // gym 的 x_threshold：小车越界即终止
  const FALLBACK = {
    dt: 0.02,
    x_limit: MAX_X,
    theta_limit: 12 * Math.PI / 180,
    pole_half: 0.5,
  };
  const SPEEDS = [0.5, 1, 2];              // 1× = 真实物理速度
  const TRAIN_SPEEDS = [1, 5];             // 1× 每次更新一帧，5× 快进

  function validFrames(list) {
    return Array.isArray(list) ? list.filter(
      (f) => Array.isArray(f) && f.length >= 4 && f.every((v) => typeof v === 'number' && isFinite(v))
    ) : [];
  }

  function readRun() {
    const run = window.CARTPOLE_RUN;
    if (!run) return null;

    // 顶层字段缺了就退回 CartPole-v1 默认值；frames 必须是四元数组
    const frames = validFrames(run.frames);
    if (frames.length < 2) return null;

    const actions = Array.isArray(run.actions) ? run.actions : [];
    return {
      frames: frames,
      actions: actions,
      dt: typeof run.dt === 'number' && run.dt > 0 ? run.dt : FALLBACK.dt,
      xLimit: typeof run.x_limit === 'number' ? run.x_limit : FALLBACK.x_limit,
      thetaLimit: typeof run.theta_limit === 'number' ? run.theta_limit : FALLBACK.theta_limit,
      poleHalf: typeof run.pole_half === 'number' ? run.pole_half : FALLBACK.pole_half,
      totalReturn: typeof run.total_return === 'number' ? run.total_return : frames.length,
      stepsTrained: typeof run.steps_trained === 'number' ? run.steps_trained : 0,
      runs: readRuns(run),
    };
  }

  /* 训练记录：第 0、1/10、…、9/10 处各录一局，用当时的贪心策略跑，越往后越稳。
     没有 runs 就返回 null，卡片退回单 tab。 */
  function readRuns(run) {
    if (!Array.isArray(run.runs)) return null;
    const runs = [];
    run.runs.forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      const frames = validFrames(r.frames);
      if (frames.length < 2) return;
      runs.push({
        steps: typeof r.steps === 'number' ? r.steps : 0,
        return: typeof r.return === 'number' ? r.return : frames.length,
        dt: typeof r.dt === 'number' && r.dt > 0 ? r.dt : FALLBACK.dt,
        frames: frames,
      });
    });
    return runs.length ? runs : null;
  }

  /* 取景照 gym 的默认画面：横向正好装下 ±x_threshold 的轨道，纵向按同一个
     米→像素比例换算，杆全长 1.0 m、小车 50×30 px。杆半长 0.5 m 对应 sx/2 像素，
     θ 直接以弧度旋转即可。 */

  const VIEW_W = 640;
  const VIEW_H = 240;
  const PAD = 26;                        // 左右留白，给边界刻度让位
  const TRACK_Y = 170;
  const CART_W = 50;
  const CART_H = 30;
  const AXLE = CART_H / 4;               // 杆轴在车顶下方 7.5px（gym 的 axleoffset）

  function makeScale(run) {
    const sx = (VIEW_W - 2 * PAD) / (2 * run.xLimit);   // px per meter
    return {
      sx: sx,
      cx: VIEW_W / 2,
      poleLenPx: 2 * run.poleHalf * sx,
      pivotY: TRACK_Y - CART_H + AXLE,
    };
  }

  /* 两个视图必须像素级一致，所以画布只有这一份 HTML 片段、绘制只有 makeRig 一个函数。 */
  function stageMarkup(run, s, aria) {
    return '<svg class="cp-svg" viewBox="0 0 ' + VIEW_W + ' ' + VIEW_H + '" ' +
             'role="img" aria-label="' + aria + '">' +
        '<g class="cp-grid">' + gridMarkup(run, s) + '</g>' +
        '<line class="cp-track" x1="' + PAD + '" y1="' + TRACK_Y + '" ' +
              'x2="' + (VIEW_W - PAD) + '" y2="' + TRACK_Y + '"></line>' +
        '<g class="cp-bounds">' + boundsMarkup(run, s) + '</g>' +
        '<g class="cp-theta-bounds" transform="translate(' + s.cx + ',' + (TRACK_Y - CART_H + AXLE) + ')">' +
          thetaLimitMarkup(run, s) +
        '</g>' +
        '<g class="cp-rig" transform="translate(' + s.cx + ',' + TRACK_Y + ')">' +
          '<line class="cp-plum" x1="0" y1="' + (AXLE - CART_H) + '" x2="0" y2="' +
                (AXLE - CART_H - s.poleLenPx) + '"></line>' +
          '<g class="cp-pole" transform="translate(0,' + (AXLE - CART_H) + ')">' +
            '<line class="cp-pole-bar" x1="0" y1="0" x2="0" y2="' + (-s.poleLenPx) + '"></line>' +
            '<circle class="cp-pole-hub" cx="0" cy="0" r="4.5"></circle>' +
          '</g>' +
          '<rect class="cp-cart-body" x="' + (-CART_W / 2) + '" y="' + (-CART_H) + '" ' +
                'width="' + CART_W + '" height="' + CART_H + '" rx="3"></rect>' +
          '<circle class="cp-wheel" cx="' + (-CART_W / 2 + 12) + '" cy="-3" r="5"></circle>' +
          '<circle class="cp-wheel" cx="' + (CART_W / 2 - 12) + '" cy="-3" r="5"></circle>' +
        '</g>' +
      '</svg>';
  }

  function makeRig(svg, s) {
    const rig = svg.querySelector('.cp-rig');
    const pole = svg.querySelector('.cp-pole');
    return {
      svg: svg,
      draw: function (state) {
        const px = s.cx + state[0] * s.sx;
        rig.setAttribute('transform', 'translate(' + px.toFixed(2) + ',' + TRACK_Y + ')');
        // 观测约定：θ 为正时杆尖偏向 +x。SVG 的 rotate 在 y 轴朝下的屏幕坐标里
        // 是顺时针，把竖直向上的杆转 +θ 正好让杆尖偏右，与观测符号一致。
        pole.setAttribute('transform', 'translate(0,' + (AXLE - CART_H) + ') rotate(' +
                          (state[2] * 180 / Math.PI).toFixed(3) + ')');
      },
    };
  }

  /* 训练记录面板：10 个检查点按顺序拼成一条连续动画。不画回报折线——车和杆本身
     就能说明问题：早几轮几帧就摔，后几轮能一直撑满 500 帧。 */

  const GAP_MS = 480;              // 局间停顿，给「换下一轮」一个分隔

  function trainPanel(run, runs) {
    const s = makeScale(run);
    return '<div class="cp-panel" role="tabpanel" id="cp-panel-train" ' +
        'aria-labelledby="cp-tab-train" data-panel="train" hidden>' +
      '<div class="cp-stage cp-train-stage">' +
        stageMarkup(run, s, '训练过程中的 CartPole：每到一个检查点放一局，越往后越稳') +
        '<p class="cp-train-caption"><span class="cp-train-round">训练 ' + fmtSteps(runs[0].steps) + ' 步</span></p>' +
      '</div>' +
      '<div class="cp-bar">' +
        '<button class="btn btn-sm cp-train-toggle" type="button">播放</button>' +
        '<input class="cp-train-range" type="range" min="0" max="' + (totalFrames(runs) - 1) +
               '" step="0.001" value="0" aria-label="训练记录进度">' +
        '<div class="cp-speeds" role="group" aria-label="训练播放速度">' +
          TRAIN_SPEEDS.map(function (v) {
            return '<button class="btn btn-sm cp-train-speed" type="button" data-speed="' + v + '"' +
                   (v === 1 ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
                   v + '×</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<p class="cp-readout">' +
        '<span class="cp-train-step">检查点 1 / ' + runs.length + '</span>' +
        '<span class="cp-train-frame">帧 1 / ' + runs[0].frames.length + '</span>' +
        '<span class="cp-train-return">已跑 0 步</span>' +
        '<span class="cp-meta">共 ' + runs.length + ' 个检查点 · 每个跑一局</span>' +
      '</p>' +
    '</div>';
  }

  function totalFrames(runs) {
    return runs.reduce(function (n, r) { return n + r.frames.length; }, 0);
  }

  function mountTraining(host, run) {
    const runs = run.runs;
    if (!runs) return;
    const panel = host.querySelector('[data-panel="train"]');
    if (!panel) return;

    const s = makeScale(run);
    const rig = makeRig(panel.querySelector('.cp-svg'), s);

    /* 每局在全局进度里的起点，进度条与读数都按它换算回「第几轮第几帧」 */
    const offsets = [];
    let total = 0;
    runs.forEach(function (r) {
      offsets.push(total);
      total += r.frames.length;
    });
    const lastGlobal = total - 1;

    const stage = panel.querySelector('.cp-train-stage');
    const slider = panel.querySelector('.cp-train-range');
    const toggle = panel.querySelector('.cp-train-toggle');
    const roundOut = panel.querySelector('.cp-train-round');
    const stepOut = panel.querySelector('.cp-train-step');
    const frameOut = panel.querySelector('.cp-train-frame');
    const retOut = panel.querySelector('.cp-train-return');
    const speedBtns = Array.prototype.slice.call(panel.querySelectorAll('.cp-train-speed'));

    /* pos 是全局帧位置，可带小数：局内按秒推进。单帧只停 0.02–0.04 秒，
       只按整数帧推进会看不出车在动，所以推进量必须留在小数里。 */
    let pos = 0;
    let playing = false;
    let rafId = 0;
    let prevTs = 0;
    let speed = 1;
    let gapLeft = 0;        // 局间停顿剩余毫秒；> 0 时画面停在上一局最后一帧

    function locate(globalPos) {
      let k = 0;
      while (k < runs.length - 1 && globalPos >= offsets[k] + runs[k].frames.length) k++;
      const local = Math.max(0, Math.min(runs[k].frames.length - 1,
                                         globalPos - offsets[k]));
      return { k: k, local: local };
    }

    function paint(state, k, localF) {
      rig.draw(state);
      const r = runs[k];
      const local = Math.min(Math.floor(localF), r.frames.length - 1);
      /* 标题报的是这一局录制时的累计训练步数，不是轮次，读起来才和数据对得上。 */
      roundOut.textContent = '训练 ' + fmtSteps(r.steps) + ' 步';
      frameOut.textContent = '帧 ' + (local + 1) + ' / ' + r.frames.length;
      stepOut.textContent = '检查点 ' + (k + 1) + ' / ' + runs.length;
      /* 这一局的帧可能被降采样过（dt 是 run.dt 的整数倍），按帧序换算回环境步；
         最后一帧直接报该局的真实回报。 */
      const ran = local >= r.frames.length - 1
        ? r.return
        : Math.round(local * r.dt / run.dt);
      retOut.textContent = '已跑 ' + ran + ' 步';
      if (document.activeElement !== slider) {
        slider.value = String(Math.min(lastGlobal, offsets[k] + localF));
      }
    }

    /* 到局尾就固定在最后一帧，不跨局插值，否则两局会被连成一条假轨迹。 */
    function sample(k, localF) {
      const frames = runs[k].frames;
      const i = Math.min(Math.floor(localF), frames.length - 1);
      if (i >= frames.length - 1) return frames[frames.length - 1];
      const f = localF - i;
      const a = frames[i];
      const b = frames[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f,
              a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
    }

    function render() {
      const at = locate(pos);
      paint(sample(at.k, at.local), at.k, at.local);
      toggle.textContent = playing ? '暂停' : (pos >= lastGlobal ? '重播' : '播放');
      toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    render();

    function tick(ts) {
      if (!playing) return;
      if (!prevTs) prevTs = ts;
      const elapsed = ts - prevTs;
      prevTs = ts;

      if (gapLeft > 0) {
        // 停顿不随倍速缩短：它是「这一轮结束了」的视觉分隔，放大倍速时反而更需要
        gapLeft -= elapsed;
        if (gapLeft <= 0) {
          gapLeft = 0;
          stage.classList.remove('is-gap');
          pos = Math.min(lastGlobal, Math.floor(pos) + 1);
          render();
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      const g = locate(pos);
      const r = runs[g.k];
      const endLocal = r.frames.length - 1;

      if (g.local >= endLocal) {
        if (g.k >= runs.length - 1) {
          pos = lastGlobal;
          playing = false;
          render();
          return;
        }
        stage.classList.add('is-gap');
        gapLeft = GAP_MS;
        rafId = requestAnimationFrame(tick);
        return;
      }

      /* 每局 dt 可能不同（短局不降采样），按当前局的 dt 推进 */
      pos = Math.min(lastGlobal, g.local + (elapsed / 1000) * speed / r.dt + offsets[g.k]);
      render();
      rafId = requestAnimationFrame(tick);
    }

    function setPlaying(on) {
      playing = on;
      if (on) {
        if (pos >= lastGlobal) {
          pos = 0;
          gapLeft = 0;
          stage.classList.remove('is-gap');
          render();
        }
        prevTs = 0;
        rafId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      render();
    }

    toggle.addEventListener('click', function () { setPlaying(!playing); });

    slider.addEventListener('input', function () {
      if (playing) setPlaying(false);
      gapLeft = 0;
      stage.classList.remove('is-gap');
      pos = Math.max(0, Math.min(lastGlobal, Number(slider.value) || 0));
      render();
    });

    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        speed = Number(btn.getAttribute('data-speed')) || 1;
        speedBtns.forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        prevTs = 0;      // 换速时重置计时基准，避免下一帧按旧速度跳很远
      });
    });
  }

  function build(host) {
    const run = readRun();
    if (!run) {
      const note = document.createElement('p');
      note.className = 'cp-empty';
      note.textContent = '动画数据未载入';
      host.appendChild(note);
      return;
    }

    const s = makeScale(run);
    const last = run.frames.length - 1;
    const runs = run.runs;

    host.classList.add('cp');
    host.innerHTML =
      (runs
        ? '<div class="cp-tabs" role="tablist" aria-label="CartPole 视图">' +
            '<button class="cp-tab is-active" type="button" role="tab" aria-selected="true" ' +
              'aria-controls="cp-panel-run" id="cp-tab-run" data-tab="run">测试</button>' +
            '<button class="cp-tab" type="button" role="tab" aria-selected="false" ' +
              'aria-controls="cp-panel-train" id="cp-tab-train" data-tab="train" tabindex="-1">训练记录</button>' +
          '</div>'
        : '') +
      '<div class="cp-panel" role="tabpanel" id="cp-panel-run" aria-labelledby="cp-tab-run" data-panel="run">' +
        '<div class="cp-stage">' +
          stageMarkup(run, s, 'CartPole 测试：训练好的 PPO 策略把杆稳在直立附近') +
        '</div>' +
        '<div class="cp-bar">' +
          '<button class="btn btn-sm cp-toggle" type="button">播放</button>' +
          '<input class="cp-range" type="range" min="0" max="' + last + '" step="0.1" value="0" ' +
                 'aria-label="回放进度">' +
          '<div class="cp-speeds" role="group" aria-label="播放速度">' +
            SPEEDS.map(function (v) {
              return '<button class="btn btn-sm cp-speed" type="button" data-speed="' + v + '"' +
                     (v === 1 ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
                     v + '×</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        /* 只报「当前帧 + 当前角度」；训练步数与测试回报交给卡片下方的 note，两处都写会重复 */
        '<p class="cp-readout"><span class="cp-frame">帧 1 / ' + run.frames.length + '</span>' +
          '<span class="cp-theta">θ = 0.0°</span></p>' +
      '</div>' +
      (runs ? trainPanel(run, runs) : '');

    const testRig = makeRig(host.querySelector('[data-panel="run"] .cp-svg'), s);
    const range = host.querySelector('.cp-range');
    const toggle = host.querySelector('.cp-toggle');
    const frameOut = host.querySelector('.cp-frame');
    const thetaOut = host.querySelector('.cp-theta');
    const speedBtns = Array.prototype.slice.call(host.querySelectorAll('.cp-speed'));


  function draw(t) {
      const i = Math.max(0, Math.min(last - 1, Math.floor(t)));
      const f = Math.max(0, Math.min(1, t - i));
      const a = run.frames[i];
      const b = run.frames[i + 1];
      const x = a[0] + (b[0] - a[0]) * f;
      const theta = a[2] + (b[2] - a[2]) * f;

      testRig.draw([x, a[1] + (b[1] - a[1]) * f, theta, a[3] + (b[3] - a[3]) * f]);

      frameOut.textContent = '帧 ' + (Math.round(t) + 1) + ' / ' + run.frames.length;
      thetaOut.textContent = 'θ = ' + (theta * 180 / Math.PI).toFixed(1) + '°';

      // 拖拽或跳转时进度条跟着走，但按住拖动时不要被反写
      if (!dragging) range.value = String(t);
    }

    let pos = 0;            // 当前帧索引（可小数）
    let playing = false;
    let rafId = 0;
    let prevTs = 0;
    let speed = 1;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceMotion = !!(reduced && reduced.matches);

    function setPlaying(on) {
      playing = on;
      syncToggle();
      if (on) {
        if (pos >= last) pos = 0;
        prevTs = 0;
        rafId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function syncToggle() {
      toggle.textContent = playing ? '暂停' : (pos >= last ? '重播' : '播放');
      toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    function tick(ts) {
      if (!playing) return;
      if (!prevTs) prevTs = ts;

      // 60fps 下每帧只推进约 1/3 个回放帧，靠插值把 500 帧拉细
      const elapsed = ts - prevTs;
      prevTs = ts;

      // 1× = 真实速度
      pos += (elapsed / 1000) * speed / run.dt;
      if (pos >= last) {
        pos = last;
        draw(pos);
        setPlaying(false);
        return;
      }

      draw(pos);
      rafId = requestAnimationFrame(tick);
    }

    let dragging = false;

    toggle.addEventListener('click', function () {
      setPlaying(!playing);
    });

    range.addEventListener('pointerdown', function () {
      dragging = true;
      if (playing) setPlaying(false);
    });
    // 松手可能落在进度条之外，所以监听在 window 上
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      syncToggle();
    });
    range.addEventListener('input', function () {
      pos = Number(range.value) || 0;
      draw(pos);
      syncToggle();
    });

    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        speed = Number(btn.getAttribute('data-speed')) || 1;
        speedBtns.forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        // 换速时重置计时基准，避免下一帧按旧速度跳很远
        prevTs = 0;
      });
    });

    /* 空格播放/暂停：焦点在按钮或进度条上时交给原生行为，避免双触发 */
    host.addEventListener('keydown', function (e) {
      if (e.key !== ' ') return;
      const tag = e.target.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT') return;
      e.preventDefault();
      setPlaying(!playing);
    });

    /* 默认停在「测试」；切到「训练记录」时停掉回放（两个动画同时跑既费电又抢注意力），
       训练播放器第一次进入才挂载。 */
    const cpTabs = Array.prototype.slice.call(host.querySelectorAll('.cp-tab'));
    const runPanel = host.querySelector('[data-panel="run"]');
    const trainPane = host.querySelector('[data-panel="train"]');
    let trainMounted = false;

    function activateView(which) {
      cpTabs.forEach(function (t) {
        const on = t.dataset.tab === which;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (runPanel) runPanel.hidden = which !== 'run';
      if (trainPane) trainPane.hidden = which !== 'train';

      if (which === 'train') {
        if (playing) setPlaying(false);
        if (!trainMounted) {
          trainMounted = true;
          mountTraining(host, run);
          startTrainAutoplay();
        }
      }
      /* 切回「测试」时不自动续播：用户刚看完一轮训练，多半想自己挑进度 */
    }

    cpTabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activateView(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = cpTabs[(i + (e.key === 'ArrowRight' ? 1 : cpTabs.length - 1)) % cpTabs.length];
        next.focus();
        activateView(next.dataset.tab);
      });
    });

    function startTrainAutoplay() {
      const btn = trainPane && trainPane.querySelector('.cp-train-toggle');
      if (!btn || reduceMotion) return;
      btn.click();
    }

    draw(0);
    syncToggle();

    if (!runs) return;

    if (reduceMotion) {
      // 减少动态：只画首帧，播放交给用户手动点
      if (!('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting && playing) setPlaying(false);
        });
      }, { threshold: 0.45 }).observe(host);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setPlaying(true);
      return;
    }

    let autoPlayed = false;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!autoPlayed) {
            autoPlayed = true;      // 只在第一次进入视口时自动播
            setPlaying(true);
          }
        } else if (playing) {
          setPlaying(false);        // 离开视口暂停
        }
      });
    }, { threshold: 0.45 });

    io.observe(host);
  }

  function fmtSteps(n) {
    return n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);
  }

  function gridMarkup(run, s) {
    // 每 0.5 m 一条短刻度
    let out = '';
    for (let x = -Math.floor(run.xLimit); x <= run.xLimit; x += 0.5) {
      const px = s.cx + x * s.sx;
      out += '<line x1="' + px.toFixed(1) + '" y1="' + (TRACK_Y + 6) + '" x2="' + px.toFixed(1) +
             '" y2="' + (TRACK_Y + 14) + '"></line>';
    }
    return out;
  }

  function boundsMarkup(run, s) {
    // 轨道两端：小车中心越过这里判定终止（gym 的 x_threshold）
    const left = s.cx - run.xLimit * s.sx;
    const right = s.cx + run.xLimit * s.sx;
    const top = TRACK_Y - CART_H - 6;
    return '<line x1="' + left.toFixed(1) + '" y1="' + top + '" x2="' + left.toFixed(1) +
             '" y2="' + (TRACK_Y + 16) + '"></line>' +
           '<line x1="' + right.toFixed(1) + '" y1="' + top + '" x2="' + right.toFixed(1) +
             '" y2="' + (TRACK_Y + 16) + '"></line>' +
           '<text x="' + left.toFixed(1) + '" y="' + (TRACK_Y + 34) + '" text-anchor="middle">−' +
             run.xLimit + '</text>' +
           '<text x="' + right.toFixed(1) + '" y="' + (TRACK_Y + 34) + '" text-anchor="middle">' +
             run.xLimit + '</text>';
  }

  function thetaLimitMarkup(run, s) {
    // 终止角 ±θ_limit 的两条弦：杆摆过它们就算失败（这一局离得很远）
    const deg = run.thetaLimit * 180 / Math.PI;
    const r = s.poleLenPx;
    const lines = [-1, 1].map(function (sign) {
      const rad = sign * run.thetaLimit;
      return '<line x1="0" y1="0" x2="' + (r * Math.sin(rad)).toFixed(1) + '" y2="' +
             (-r * Math.cos(rad)).toFixed(1) + '"></line>';
    }).join('');
    return lines +
      // 标签放在右上方、避开杆身，否则杆立直时会压住文字
      '<text x="' + (r * Math.sin(run.thetaLimit) + 30).toFixed(1) + '" y="' +
      (-r * Math.cos(run.thetaLimit) - 4).toFixed(1) + '">±' + deg.toFixed(0) + '° 终止</text>';
  }

  function start() {
    const host = document.getElementById('cartpole-demo');
    if (!host) return;
    if (host.dataset.cpReady) return;
    host.dataset.cpReady = '1';
    build(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
