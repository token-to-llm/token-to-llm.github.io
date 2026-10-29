# 示例五：表格型强化学习的交叉验证

对应第 7 章 7.3–7.5 节。这一条最能说明“同一族方法”这件事。

```bash
python src/rl/run_all.py
```

`run_all.py` 先在一个带目标格的小网格上用动态规划求精确解，再让四种控制方法各自训练，最后用真实模型评估它们学到的策略。

```text
[deterministic] optimal policy 0:1 1:1 3:1 4:1 5:1 6:3 7:3  V(start) = 4.580
  control methods: return of the greedy policy, evaluated on the true model
    Q-learning      ok   V=4.580  0:1 1:1 3:1 4:1 5:1 6:3 7:3
    SARSA           ok   V=4.580  0:1 1:1 3:1 4:1 5:1 6:3 7:3
    expected SARSA  ok   V=4.580  0:1 1:1 3:1 4:1 5:1 6:3 7:3
    MC control      ok   V=4.580  0:1 1:1 3:1 4:1 5:1 6:3 7:3
```

确定性环境里，四种方法都收敛到同一条最优策略，起始状态价值 4.580，与动态规划精确解一致。

## 换成带风扰动的环境

结果就分化了：

```text
[wind] optimal policy 0:3 1:1 3:3 4:3 5:1 6:3 7:3  V(start) = 5.443
    Q-learning      off  V=5.371  0:1 1:1 3:3 4:3 5:1 6:3 7:3
    SARSA           off  V=5.163  0:1 1:1 3:3 4:1 5:1 6:3 7:3
    expected SARSA  off  V=5.163  0:1 1:1 3:3 4:1 5:1 6:3 7:3
    MC control      ok   V=5.443  0:3 1:1 3:3 4:3 5:1 6:3 7:3
```

只有蒙特卡洛控制仍匹配精确解。原因在自举：Q-learning、SARSA 用估计值代替真实回报，在随机转移下偏差会累积；蒙特卡洛用完整回报，偏差为零（方差更大）。这是“偏差—方差权衡”在一张表里的直接体现。

## $\lambda$ 的对比

值估计部分还有一组 $\lambda$ 的对比：

```text
    MC estimate       ok   max error 0.049
    TD(lambda=0.0)    ok   max error 0.226
    TD(lambda=0.5)    ok   max error 0.357
    TD(lambda=1.0)    off  max error 0.901
```

在 `slip` 场景下，$\lambda$ 从 0 增到 1，误差从 0.226 增到 0.901。$\lambda=1$ 等价于蒙特卡洛估计，但这里用有限步数截断，反而引入了偏差。

## 下一步

[NTK-RoPE 的维度分工](examples-ntk-rope.html) · [PPO 跑 CartPole](examples-ppo-cartpole.html)
