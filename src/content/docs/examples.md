# 运行示例

仓库 [token-to-llm](https://github.com/token-to-llm/token-to-llm) 里每个脚本都能独立跑。这里按知识点分成六页，每页说明一段脚本验证的是书里的哪一步、跑出来是什么样、结果说明了什么。

<table>
<tr>
<td width="50%"><b>环境</b><br>Python 3.10 · PyTorch 2.9 · Matplotlib 3.10</td>
<td><b>硬件</b><br>Apple Silicon，CPU 即可，无需 GPU</td>
</tr>
</table>

## 六条示例

<div class="example-list">
<a class="example-card" href="examples-attention.html">
<span class="example-no">01</span>
<b>缩放点积注意力与多头切分</b>
<span>第 2 章 2.3.1 节 · 注意力不改变张量形状，只重排信息</span>
</a>
<a class="example-card" href="examples-rmsnorm.html">
<span class="example-no">02</span>
<b>RMSNorm 与 LayerNorm 的差别</b>
<span>第 4 章 4.2.2 节 · 一个减均值、一个不减，点云给出差别</span>
</a>
<a class="example-card" href="examples-gelu.html">
<span class="example-no">03</span>
<b>GELU 的三种理解</b>
<span>第 3 章 · 按正态累积概率加权，负半轴平滑过渡</span>
</a>
<a class="example-card" href="examples-ntk-rope.html">
<span class="example-no">04</span>
<b>NTK-RoPE 的维度分工</b>
<span>第 4 章 4.4 节 · 提高基频后，偏差全压在低维</span>
</a>
<a class="example-card" href="examples-rl-tabular.html">
<span class="example-no">05</span>
<b>表格型强化学习的交叉验证</b>
<span>第 7 章 7.3–7.5 节 · 四种控制方法与动态规划精确解对照</span>
</a>
<a class="example-card" href="examples-ppo-cartpole.html">
<span class="example-no">06</span>
<b>PPO 跑 CartPole</b>
<span>第 8 章 8.2 节 · 连续状态空间，训练到跑满 500 步</span>
</a>
</div>

## 想自己加一条

新增脚本的目录约定、命名与出图方式见[自己加一个示例](examples-contributing.html)。

完整的依赖安装步骤见[环境安装](setup.html)。
