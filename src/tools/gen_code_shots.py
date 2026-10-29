"""为官网「代码」板块采集真实运行画面。

不做二次绘图，只采集脚本自己吐出来的东西：CartPole 用训练后的 PPO 策略
实际跑一局，取其中的渲染帧拼成 assets/img/code/rl-cartpole.png。
页面展示的数字与画面都可复核。
"""
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))          # src/tools
SITE = os.path.dirname(HERE)                               # src
IMG = os.path.join(SITE, "assets", "img", "code")

# 取的是 token-to-llm 开源仓库里的实现，它不随本站发布。
# 用环境变量指向一份本地 clone；未设置时脚本只报告并退出。
RL = os.environ.get("TOKEN_TO_LLM_SRC", "")
RL = os.path.join(RL, "src", "rl") if RL else ""

plt.rcParams.update(
    {
        "figure.dpi": 200,
        "savefig.dpi": 200,
        "font.family": "sans-serif",
        "font.sans-serif": ["PingFang SC", "Hiragino Sans GB", "Arial Unicode MS", "DejaVu Sans"],
        "axes.unicode_minus": False,
    }
)


def cartpole_frames():
    """用训练好的 PPO 策略跑一局 CartPole，取 4 帧。"""
    sys.path.insert(0, RL)
    import torch
    from envs.cartpole import CartPole
    from ppo import PPO

    torch.manual_seed(0)
    env = CartPole(render=False, seed=0)
    agent = PPO(env)

    for _ in range(12):          # 与 ppo.py 的 main 相同：按 rollout 迭代更新
        agent.update()

    # 重新开一局，用贪心策略走，边跑边取渲染帧
    import gymnasium as gym

    raw = gym.make("CartPole-v1", render_mode="rgb_array")
    raw.reset(seed=0)

    # 先把整局走完，记下每一帧，再按步数均匀取 4 帧，
    # 否则边跑边算比例时总步数还没确定，取到的会全挤在开头几步。
    all_frames = [raw.render()]
    for t in range(500):
        state = torch.as_tensor(raw.unwrapped.state, dtype=torch.float32)
        with torch.no_grad():
            a = int(agent.actor_model(state.unsqueeze(0)).argmax())
        _, _, terminated, truncated, _ = raw.step(a)
        all_frames.append(raw.render())
        if terminated or truncated:
            break
    raw.close()

    steps = len(all_frames) - 1
    pick = [round(i * (len(all_frames) - 1) / 3) for i in range(4)]
    frames = [(all_frames[i], i) for i in pick]

    if not frames:
        raise SystemExit("没有采到帧")

    fig, axes = plt.subplots(2, 2, figsize=(6.4, 4.6))
    for ax, (fr, step) in zip(axes.ravel(), frames):
        ax.imshow(fr)
        ax.set_xticks([])
        ax.set_yticks([])
        for sp in ax.spines.values():
            sp.set_visible(False)
        ax.set_title("第 %d 步" % step, fontsize=9, color="#4a5163", pad=5)
    fig.tight_layout(pad=0.5)
    path = os.path.join(IMG, "rl-cartpole.png")
    fig.savefig(path, bbox_inches="tight", facecolor="white", pad_inches=0.06)
    plt.close(fig)
    print("wrote", path)
    print("  episode length:", steps)


if __name__ == "__main__":
    os.makedirs(IMG, exist_ok=True)
    which = sys.argv[1:] or ["cartpole"]
    if "cartpole" in which:
        cartpole_frames()
