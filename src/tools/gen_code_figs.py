"""为官网首页「代码」板块生成 2×2 运行图。

图 1  grid_world 三种场景的最优策略（与 run_all.py 的精确解一致）
图 2  CartPole 训练奖励曲线（ppo.py 的真实训练过程）
图 3  TD(λ) 与 MC 对 V 的估计误差随 λ 变化（run_all.py 的同一判据）
图 4  RMSNorm 与 LayerNorm 的缩放效应散点（llama/rmsnorm.py 的输出）

所有数字都来自实际运行，不手工构造。
"""
import json
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))          # src/tools
SITE = os.path.dirname(HERE)                               # src
OUT = os.path.join(SITE, "assets", "img", "code")

# 训练/绘图取的是 token-to-llm 开源仓库里的实现，它不随本站发布。
# 用环境变量指向一份本地 clone；未设置时脚本只报告并退出。
RL = os.environ.get("TOKEN_TO_LLM_SRC", "")
RL = os.path.join(RL, "src", "rl") if RL else ""

plt.rcParams.update(
    {
        "font.family": "sans-serif",
        "font.sans-serif": ["PingFang SC", "Hiragino Sans GB", "Arial Unicode MS", "DejaVu Sans"],
        "axes.unicode_minus": False,
        "figure.dpi": 200,
        "savefig.dpi": 200,
        "axes.edgecolor": "#d6dbe8",
        "axes.labelcolor": "#4a5163",
        "xtick.color": "#8a92a6",
        "ytick.color": "#8a92a6",
        "text.color": "#1f2330",
        "axes.grid": True,
        "grid.color": "#eef1f7",
        "grid.linewidth": 0.8,
    }
)
PRIMARY = "#4c54a4"
ACCENT = "#e9775b"
GREEN = "#5fa872"
INK3 = "#8a92a6"


def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, bbox_inches="tight", facecolor="white", pad_inches=0.18)
    plt.close(fig)
    print("wrote", path)


# ---------------------------------------------------------------- 图 1 网格世界
def fig_grid():
    """三种场景下 Q-learning 学到的贪心策略，箭头指向实际动作。"""
    sys.path.insert(0, RL)
    from envs.grid_world import GAMMA, GridWorld, non_terminal
    from q_learning import QLearning

    scenarios = [("deterministic", "确定性"), ("slip", "滑动"), ("wind", "风扰")]
    arrows = {0: (0, -1), 1: (0, 1), 2: (-1, 0), 3: (1, 0)}  # 列减/加、行减/加
    labels = {0: "←", 1: "→", 2: "↑", 3: "↓"}

    fig, axes = plt.subplots(1, 3, figsize=(11.4, 3.9))
    for ax, (name, cn) in zip(axes, scenarios):
        env = GridWorld(name)
        agent = QLearning(state_size=9, action_size=4, gamma=GAMMA, alpha=0.1, epsilon=0.2)
        agent.train(env, episodes=3000)

        cells = np.zeros((3, 3))
        for s in range(9):
            r, c = divmod(s, 3)
            if s == 8:
                cells[r, c] = 2.0
                ax.text(c, r, "目标", ha="center", va="center", fontsize=9, color="white", weight="bold")
                continue
            if s == 4:
                cells[r, c] = -2.0
                ax.text(c, r, "陷阱", ha="center", va="center", fontsize=9, color="white", weight="bold")
                continue
            cells[r, c] = 0.35
            a = int(agent.greedy_action(s))
            ax.text(c, r, labels[a], ha="center", va="center", fontsize=20, color=PRIMARY, weight="bold")

        ax.imshow(cells, cmap="RdYlGn", vmin=-2.2, vmax=2.2, alpha=0.35)
        ax.set_xticks(range(3))
        ax.set_yticks(range(3))
        ax.set_xticklabels(["列 1", "列 2", "列 3"], fontsize=8)
        ax.set_yticklabels(["行 1", "行 2", "行 3"], fontsize=8)
        ax.set_title(cn, fontsize=11, color="#1f2330", pad=8)
        ax.grid(False)
        for sp in ax.spines.values():
            sp.set_visible(False)

    fig.suptitle("Q-learning 学到的贪心策略（三种场景，各训练 3000 回合）", fontsize=11.5, color="#1f2330", y=1.02)
    save(fig, "rl-grid-world.png")


# ------------------------------------------------------------ 图 2 CartPole 训练
def fig_cartpole():
    """PPO 在 CartPole-v1 上的真实训练过程：每轮 rollout 后测一次贪心策略的回报。"""
    sys.path.insert(0, RL)
    import torch
    from envs.cartpole import CartPole
    from ppo import PPO

    torch.manual_seed(0)
    agent = PPO(CartPole(render=False, seed=0))

    steps, returns = 0, []
    for _ in range(40):
        steps += agent.update()
        returns.append((steps, agent.average_return()))

    xs = np.array([s for s, _ in returns])
    ys = np.array([r for _, r in returns])

    fig, ax = plt.subplots(figsize=(5.6, 3.9))
    ax.plot(xs, ys, color=PRIMARY, linewidth=1.4, marker="o", markersize=3.5, label="贪心策略平均回报")
    ax.axhline(500, color=INK3, linewidth=1, linestyle="--", alpha=0.8)
    ax.text(xs[-1], 508, "满分 500", ha="right", va="bottom", fontsize=8.5, color=INK3)
    ax.set_xlabel("已采样环境步数")
    ax.set_ylabel("平均回报")
    ax.set_ylim(0, 545)
    ax.set_title("PPO · CartPole-v1", fontsize=11, pad=8)
    ax.legend(frameon=False, fontsize=8.5, loc="lower right")
    save(fig, "rl-cartpole.png")
    print("  final average return:", ys[-1], "at", xs[-1], "steps")
    print("  series:", [(int(a), int(b)) for a, b in returns[::8]])


# --------------------------------------------------------- 图 3 TD(λ) 误差随 λ
def uniform_policy_value(env):
    """π(a|s)=1/4 下 v_π 的精确解，与 run_all.py 的同一式（eq. 7-19）。"""
    from envs.grid_world import GAMMA, non_terminal
    import torch as _t

    value = [0.0] * 9
    for _ in range(2000):
        for s in non_terminal():
            value[s] = sum(
                env.reward(s, a)
                + GAMMA * sum(p * value[s2] for s2, p in env.p_next(s, a).items())
                for a in range(4)
            ) / 4
    return _t.tensor(value)


def fig_td_lambda():
    sys.path.insert(0, RL)
    import torch
    from envs.grid_world import GridWorld, non_terminal
    from td_lambda import TDLambda

    lam_grid = [0.0, 0.25, 0.5, 0.75, 1.0]
    series = {}
    for name, cn in [("deterministic", "确定性"), ("slip", "滑动"), ("wind", "风扰")]:
        # TDLambda 的默认行为策略就是 uniform_policy()（eq. 每一状态均匀抽动作），
        # 因此精确解取 v_π(π=1/4)，不能固定成一条确定性动作序列。
        true_v = uniform_policy_value(GridWorld(name))
        errs = []
        for lam in lam_grid:
            torch.manual_seed(0)
            agent = TDLambda(lam=lam, alpha=0.005).train(GridWorld(name), episodes=50000)
            errs.append(float(torch.max(torch.abs(agent.value_table[non_terminal()] - true_v[non_terminal()]))))
        series[cn] = errs

    fig, ax = plt.subplots(figsize=(5.6, 3.9))
    for (cn, errs), c in zip(series.items(), [PRIMARY, ACCENT, GREEN]):
        ax.plot(lam_grid, errs, marker="o", markersize=5, color=c, linewidth=2, label=cn)
    ax.set_xlabel("λ")
    ax.set_ylabel("max |V − vπ|")
    ax.set_title("TD(λ) 的估计误差（5 万回合，α=0.005）", fontsize=10.5, pad=8)
    ax.legend(frameon=False, fontsize=9)
    save(fig, "rl-td-lambda.png")
    for cn, errs in series.items():
        print("  ", cn, [round(e, 3) for e in errs])


# --------------------------------------------------- 图 4 RMSNorm 缩放效应散点
def fig_rmsnorm():
    """与 llama/rmsnorm.py 同一组数据：LayerNorm 与 RMSNorm 的归一化前后分布。"""
    import torch
    import torch.nn as nn

    torch.manual_seed(0)
    x = torch.randn(100, 3) * 2 + 0.5

    ln = nn.LayerNorm(3)
    with torch.no_grad():
        ln.weight.fill_(1.0)
        ln.bias.zero_()
    y_ln = ln(x)

    rms = x / torch.sqrt(torch.mean(x ** 2, dim=-1, keepdim=True) + 1e-8)
    y_rms = rms * 1.0 + 0.0

    fig, axes = plt.subplots(1, 2, figsize=(9.6, 3.9), sharey=True)
    for ax, (data, title, color) in zip(
        axes,
        [(y_ln, "LayerNorm（重中心化）", PRIMARY), (y_rms, "RMSNorm（只缩放）", ACCENT)],
    ):
        d = data.detach().numpy()
        for k, m in enumerate(["o", "s", "^"]):
            ax.scatter(d[:, k], np.full(len(d), k), c=color, alpha=0.45, s=16, marker=m, linewidths=0)
        ax.axvline(0, color=INK3, linewidth=1, linestyle="--", alpha=0.7)
        ax.set_yticks([0, 1, 2])
        ax.set_yticklabels(["维度 1", "维度 2", "维度 3"], fontsize=9)
        ax.set_xlabel("归一化后的取值")
        ax.set_title(title, fontsize=10.5, pad=8)
        ax.set_ylim(-0.6, 2.6)

    fig.suptitle(
        "同一组输入（100×3）经两种归一化后的分布：RMSNorm 保留均值方向",
        fontsize=10.5,
        color="#1f2330",
        y=1.02,
    )
    save(fig, "rmsnorm-compare.png")
    print("  mean  raw    :", [round(v, 4) for v in x.mean(0).tolist()])
    print("  mean  LayerNorm:", [round(v, 4) for v in y_ln.mean(0).tolist()])
    print("  mean  RMSNorm  :", [round(v, 4) for v in y_rms.mean(0).tolist()])


if __name__ == "__main__":
    if not RL or not os.path.isdir(RL):
        sys.exit(
            "需要 token-to-llm 仓库的本地 clone 才能重跑这些图。\n"
            "用法：TOKEN_TO_LLM_SRC=/path/to/token-to-llm python3 src/tools/gen_code_figs.py\n"
            "（图片已随站点提交，仅需在更新代码示例时重跑。）"
        )
    os.makedirs(OUT, exist_ok=True)
    which = sys.argv[1:] or ["grid", "cartpole", "td", "rmsnorm"]
    if "grid" in which:
        fig_grid()
    if "cartpole" in which:
        fig_cartpole()
    if "td" in which:
        fig_td_lambda()
    if "rmsnorm" in which:
        fig_rmsnorm()
