"""录制 CartPole 回放数据（官网首页「PPO 跑 CartPole」卡片）。

产物两份，都写进 assets/data/cartpole-run.js：

  frames  测试视图用：训练好的策略跑一整局，逐帧记录四维观测
          [cart_x, cart_v, pole_angle, pole_angvel]，播放器按真实物理速度回放。
  runs    训练记录视图用：训练过程中取 10 个检查点（第 0 步起每隔
          total_steps/10 一个），在每个检查点当下用当时的贪心策略真实跑一局，
          逐帧录下整局。早期检查点控制不住、几帧就摔，晚期能跑满 500 帧，
          观众由此看到「随着训练轮次增加，控制越来越稳定」。

为什么要在检查点当下录、而不是训练结束后补录：agent 的参数一直在更新，
收工后再跑 10 局只能得到 10 个一样好的策略，看不出变化。

为什么输出 .js 而不是 .json：本站要能双击以 file:// 打开，fetch 本地文件
会被浏览器拦掉，所以数据必须靠 <script> 直接执行。

可重复运行：固定随机种子，同参数下产物逐字节一致。

用法：
    python3 src/tools/record_cartpole.py
    python3 src/tools/record_cartpole.py --steps 30000
"""

import argparse
import os
import sys
import time
from pathlib import Path

import torch

# 复用 token-to-llm 开源仓库里的 PPO 与 CartPole（它们按同目录相对导入）。
# 该仓库不随本站发布，用环境变量指向本地 clone。
RL_DIR = Path(os.environ.get("TOKEN_TO_LLM_SRC", "")) / "src" / "rl"
sys.path.insert(0, str(RL_DIR))

from envs.cartpole import CartPole  # noqa: E402
from ppo import PPO  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "assets" / "data" / "cartpole-run.js"

# CartPole-v1 的物理参数，播放器按同一组比例画几何
DT = 0.02          # 一步的仿真时长，gym 的 tau
POLE_HALF = 0.5    # 杆半长：杆全长 1.0
X_LIMIT = 2.4      # 小车越界即终止
THETA_LIMIT = 12 * 3.14159265358979 / 180  # 杆倾角越界即终止（约 0.2094 rad）

CHECKPOINTS = 10   # 训练记录录几局
MAX_STEPS = 500    # 单局步数上限（CartPole-v1 的 truncated 阈值）
SIZE_BUDGET = 600 * 1024  # 数据文件体积上限：超了就加大降采样步长


def record_episode(agent, seed, max_steps=MAX_STEPS):
    """贪心策略跑一整局，逐帧录下执行动作之前的观测。

    返回 (frames, actions, total_return, terminated, last_state)。
    terminated 表示杆真的摔了（不是跑满 500 步被截断）；那时把摔下去后的
    状态也带上，画面上才看得到杆倒下的瞬间。"""
    env = CartPole(seed=seed)
    state = env.reset()

    frames, actions, total_return = [], [], 0.0
    for _ in range(max_steps):
        with torch.no_grad():
            action = int(agent.actor_model(state.unsqueeze(0)).argmax())

        frames.append([float(v) for v in state])
        actions.append(action)

        state, reward, is_stop, is_cut = env.step(action)
        total_return += float(reward)
        if is_stop or is_cut:
            return frames, actions, total_return, bool(is_stop), [float(v) for v in state]

    return frames, actions, total_return, False, None


def train(total_steps, seed, episode_seed, verbose=True):
    """训练 PPO，并在每个检查点当下录一局。

    检查点是 0, total_steps/10, 2·total_steps/10 … 共 10 个。update() 一次走
    rollout_size 步，所以实际落在「跨过检查点的那次更新之后」，记录的 steps
    用真实累计步数。10 局都用同一个 episode_seed：初始状态完全一样，画面差异
    就只来自策略本身。"""
    torch.manual_seed(seed)
    agent = PPO(CartPole(seed=seed))

    marks = [total_steps * k // CHECKPOINTS for k in range(CHECKPOINTS)]
    runs = []
    steps_done = 0
    started = time.time()

    def snapshot():
        frames, _, ret, terminated, last = record_episode(agent, episode_seed)
        runs.append({
            "steps": steps_done,
            "return": ret,
            "frames": frames,
            "terminated": terminated,
            "last": last,
        })
        if verbose:
            print(f"  检查点 {steps_done} 步：{len(frames)} 帧，回报 {ret:.0f}",
                  file=sys.stderr)

    # 先录第 0 个检查点（一次更新都还没做），之后每次更新后补录跨过的检查点
    while len(runs) < len(marks) and steps_done >= marks[len(runs)]:
        snapshot()

    last_report = 0
    while steps_done < total_steps:
        steps_done += agent.update()
        while len(runs) < len(marks) and steps_done >= marks[len(runs)]:
            snapshot()
        if verbose and steps_done - last_report >= total_steps // 4:
            last_report = steps_done
            print(f"  {steps_done} 步，用时 {time.time() - started:.1f}s", file=sys.stderr)

    return agent, steps_done, runs


SHORT_RUN = 80     # 不足这么多帧的一局不降采样：早期几局本来就短，再抽稀就只剩一两帧


def run_stride(run, stride):
    """这一局实际用多大的降采样步长。短局保留全帧，失败的那一瞬才看得见。"""
    return 1 if len(run["frames"]) <= SHORT_RUN else stride


def decimate(frames, terminated, last, stride):
    """每隔 stride 帧留一帧（训练视图的 dt 因此变成 stride × DT）。
    摔下去的那一帧始终保留，否则最后几帧的倒下看不全。"""
    out = frames[::stride]
    if terminated and last is not None:
        out.append(last)
    return out


def pick_stride(runs):
    """按体积预算挑降采样步长：每帧约 34 字节（四个 3 位小数 + 括号逗号）。"""
    for stride in (2, 3, 4, 5):
        total = sum(len(decimate(r["frames"], r["terminated"], r["last"],
                                 run_stride(r, stride)))
                    for r in runs)
        if total * 34 < SIZE_BUDGET:
            return stride
    return 5


def fmt_frame(f, nd=3):
    return "[" + ", ".join(f"{v:.{nd}f}" for v in f) + "]"


def write_js(path, seed, steps_trained, training_return, total_return, frames, actions,
             episode_seed, runs, stride):
    """手写序列化：紧凑、可 diff，每帧一行，便于人工对照轨迹。"""
    path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "/* CartPole 回放数据，由 src/tools/record_cartpole.py 生成，勿手改。",
        "   用 .js 而非 .json：双击以 file:// 打开时 fetch 本地文件会被拦。",
        "   每帧四维观测 [cart_x, cart_v, pole_angle, pole_angvel]，角度单位弧度。",
        "   frames：测试视图那一局；runs：训练途中 10 个检查点各跑的一局。 */",
        "window.CARTPOLE_RUN = {",
        f"  seed: {seed},",
        f"  episode_seed: {episode_seed},",
        f"  steps_trained: {steps_trained},",
        f"  training_return: {training_return:.0f},",
        f"  total_return: {total_return:.0f},",
        f"  dt: {DT},",
        f"  x_limit: {X_LIMIT},",
        f"  theta_limit: {THETA_LIMIT:.6f},",
        f"  pole_half: {POLE_HALF},",
        "  /* 训练记录：每 1/10 训练取一个检查点，当场用当时的贪心策略跑一局。",
        "     steps 是录制时的真实累计步数，return 是那一局回报（= 存活步数），",
        "     dt 是这一局的帧间隔（降采样后变大，短局不降采样）。 */",
        "  runs: [",
    ]
    for r in runs:
        stride_r = run_stride(r, stride)
        f = decimate(r["frames"], r["terminated"], r["last"], stride_r)
        lines.append(f"    {{ steps: {r['steps']}, return: {r['return']:.0f}, "
                     f"dt: {DT * stride_r:g}, frames: [")
        lines += ["      " + fmt_frame(x) + "," for x in f]
        lines.append("    ] },")
    lines.append("  ],")
    lines.append("  frames: [")
    lines += ["    " + fmt_frame(f, 4) + "," for f in frames]
    lines.append("  ],")
    lines.append("  actions: [" + ", ".join(str(a) for a in actions) + "],")
    lines.append("};")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="录制 CartPole 回放数据")
    parser.add_argument("--steps", type=int, default=60000, help="PPO 训练步数")
    parser.add_argument("--seed", type=int, default=0, help="训练用随机种子")
    parser.add_argument("--episode-seed", type=int, default=37,
                        help="测试那一局与各检查点的初始状态种子")
    parser.add_argument("--max-steps", type=int, default=MAX_STEPS, help="单局最多录多少帧")
    args = parser.parse_args()

    print(f"训练 {args.steps} 步…", file=sys.stderr)
    agent, steps_done, raw_runs = train(args.steps, args.seed, args.episode_seed)
    print(f"训练结束：{steps_done} 步", file=sys.stderr)

    training_return = agent.average_return(episodes=10)
    print(f"训后 10 局贪心平均回报 {training_return:.0f}", file=sys.stderr)

    frames, actions, total_return, _, _ = record_episode(
        agent, args.episode_seed, args.max_steps)
    print(f"测试那一局：{len(frames)} 帧，回报 {total_return:.0f}", file=sys.stderr)
    if len(frames) < args.max_steps:
        print("警告：测试这一局提前终止，未跑满", file=sys.stderr)

    stride = pick_stride(raw_runs)
    write_js(OUT, args.seed, steps_done, training_return, total_return, frames, actions,
             args.episode_seed, raw_runs, stride)
    size = OUT.stat().st_size
    print(f"已写入 {OUT}（{size / 1024:.1f} KB，长局每 {stride} 帧取 1，"
          f"不足 {SHORT_RUN} 帧的短局保留全帧）", file=sys.stderr)
    for i, r in enumerate(raw_runs):
        n = len(decimate(r["frames"], r["terminated"], r["last"], run_stride(r, stride)))
        print(f"  第 {i + 1} 轮：{r['steps']} 步，回报 {r['return']:.0f}，"
              f"{n} 帧", file=sys.stderr)


if __name__ == "__main__":
    main()
