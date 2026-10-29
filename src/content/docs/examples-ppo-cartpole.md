# 示例六：PPO 跑 CartPole

对应第 8 章 8.2 节。前面的强化学习例子都在表格上，这一条把同样的方法用到连续状态空间。

```bash
python src/rl/ppo.py
```

```text
step 7500: greedy policy average return 276
step 15000: greedy policy average return 483
step 30000: greedy policy average return 500
end of training (60000 steps): average return 500 (max 500)
```

CartPole 的理论上限是 500 步，训练到 3 万步时贪心策略已经跑满。

## 智能体看到了什么

四维观测依次是：小车位置、小车速度、杆的角度、杆的角速度。策略网络只吃这四个数，输出“向左推”或“向右推”两个动作的概率。

主页上那条动画不是录像，而是把同一局里每个时刻的四维状态逐帧录下来，再在浏览器里按物理量重画。杆的角度直接按弧度映射到画布上，所以动画里的摆动是训练出来的策略真实的摆动。

## 为什么用 PPO

PPO 的截断目标把新旧策略的比率夹在 $1\pm\epsilon$ 之间：单次更新幅度被限制住，同一批样本可以反复用几轮而不至于崩掉。这一点在第 8 章里和 GRPO 对照着讲——GRPO 去掉了价值模型，截断的写法原封不动保留。

## 下一步

[表格型强化学习的交叉验证](examples-rl-tabular.html) · [自己加一个示例](examples-contributing.html)
