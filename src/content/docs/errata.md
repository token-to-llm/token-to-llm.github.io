# 勘误

本页收录首印（2026 年 10 月第 1 次印刷）的勘误，整理日期 **2026-10-18**。分两类：

- **错误类**：影响语义、公式或引用的错误，建议对照修改。
- **笔误类**：拼写、符号、上下标等不影响理解的笔误。

若你使用的印次晚于首印，部分条目可能已在重印中修正。发现的任何问题都欢迎[联系我们](../contact/index.html)或在[仓库 Issue](https://github.com/token-to-llm/token-to-llm/issues) 中提出。

## 一、错误类（9 条）

| 页码 | 原文 | 改正 | 说明 |
| --- | --- | --- | --- |
| p30 | 式 (2-11)、(2-12)、(2-14)、(2-15) 中残差连接与层归一化的写法有误 | $\boldsymbol{X}=\boldsymbol{X}_{\text{attn}}+\boldsymbol{X}^{(l-1)}$；$\boldsymbol{X}=\text{Layer\_Norm\_1}(\boldsymbol{X})$；$\boldsymbol{X}=\boldsymbol{X}_{\text{ffn}}+\boldsymbol{X}$；$\boldsymbol{X}^{(l)}=\text{Layer\_Norm\_2}(\boldsymbol{X})$ | 编码块残差连接误将输出累加到自身。左侧为修改后的完整顺序：注意力残差 → 归一化 → 前馈 → 前馈残差 → 归一化，见式 (2-10)–(2-15) |
| p37–p38 | 式 (2-51)、(2-52)、(2-54)、(2-55)、(2-57)、(2-58) 中残差连接与层归一化的写法有误 | $\boldsymbol{Y}=\boldsymbol{Y}_{\text{attn}}+\boldsymbol{Y}^{(l-1)}$；$\boldsymbol{Y}=\text{Layer\_Norm\_1}(\boldsymbol{Y})$；$\boldsymbol{Y}=\boldsymbol{Y}_{\text{attn}}+\boldsymbol{Y}$；$\boldsymbol{Y}=\text{Layer\_Norm\_2}(\boldsymbol{Y})$；$\boldsymbol{Y}=\boldsymbol{Y}_{\text{ffn}}+\boldsymbol{Y}$；$\boldsymbol{Y}^{(l)}=\text{Layer\_Norm\_3}(\boldsymbol{Y})$ | 解码器同样问题。第 3 组的 $\boldsymbol{Y}_{\text{attn}}$ 为编码器—解码器注意力输出，见式 (2-50)–(2-58) |
| 目录 VI | Auto-CoT | 零样本-CoT | 目录条目与正文术语不一致，统一为零样本 CoT |
| p111 | “如思维树...” | “如零样本CoT[151]，思维树...” | 补回被漏掉的术语与引用 |
| p112 | “自动化提示词生成技术（如AutoCoT)被提出以自动构建提示示例，” | “自动化提示词技术被提出以自动构建提示，” | 删除冗余修饰并补全标点 |
| p113 | Auto-CoT，自动化思维链 | 零样本CoT，零样本思维链 | 术语统一，同 p111 |
| p72–p73 | 式 (4-40) 下方的 `@misc` 引用块 | 替换为以下 9 行 RMSNorm 实现代码 | 原框内容误将参考文献条目混入代码块 |
| p246 | [125] ... | `[125] AINSLIE J, LEE-THORP J, de JONG M, et al. GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints[DB/OL]. arXiv. (2023/05/22) [2026/04/23]. https://arxiv.org/abs/2305.13245. arXiv: 2305.13245.` | 原条目内容缺失 |
| p248 | [151] ... | `[151] KOJIMA T, GU S S, REID M, et al. Large Language Models are Zero-Shot Reasoners[DB/OL]. arXiv. (2023/01/29) [2026/04/23]. https://arxiv.org/abs/2205.11916. arXiv: 2205.11916.` | 原条目内容缺失 |

### P72–P73 替换代码

```python
class RMSNorm(torch.nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.gamma = torch.nn.Parameter(torch.ones(dim))

    def forward(self, x):
        var = x.pow(2).mean(dim=-1, keepdim=True)
        inv_rms = torch.rsqrt(var + self.eps)
        return x * inv_rms * self.gamma
```

## 二、笔误类（31 条）

| 页码 | 原文 | 改正 | 说明 |
| --- | --- | --- | --- |
| 符号对照表 | $X_{j,:}$ 与 $X_{:,j}$ 混用 | $X_{:,j}$ | 行、列下标写反 |
| p1 | 泛化表现[34,252] | 泛化表现[1, 2] | 引用序号与正文不对应 |
| p5 | 768M | 768K | 单位数量级错误 |
| p6 | $A=406.5$ / 模型参数规模 | $A=406.4$ / 模型训练计算量 | 数值与量名各错一处 |
| p41 | Tranformer，漏了字母 | Transformer | 拼写错误 |
| p77 | $k_n R_m^d$，下标 m 错误 | $k_n R_n^d$ | RoPE 旋转矩阵下标应与位置序号一致 |
| p82 | `ma\vx_new` | `max_new` | 反斜杠误作字母 |
| p84 | n | 字母 $l$ | 式 (4-60) 中的层数符号误排为 n |
| p85 | 式 4.62 中 $1^T R^{m-n} 1$ | $1 R^{m-n} 1^T$ | 转置号位置错误 |
| p86 | $b-2(i-2)/d$ | $b-2(i-1)/d$ | 位置编码下标差一 |
| p90 | 显著减少了模型的计算开销 | 显著减少了模型的 KV-Cache | 主语写错，比较对象应为 KV-Cache 体积 |
| p95 | 49.1，式 5.1 中 $i=0$ | 48.9，式 5.1 中 $i=1$ | 数值与下标起点均错 |
| p97 | 显著降低了训练过程中训练过程中 | 显著降低了训练过程中 | 重复短语 |
| p98 | LoRA 已衍生大量变体[144]。其核心....低秩分解，如 Galore 方法[145]（原注：Galore 不是引用 [145]，以下改法能保证引用连续） | LoRA 已衍生大量变体[144,145]。其核心....低秩分解。 | 合并引用并删除不连续的引用标注 |
| p102 | 实现结果表明： | 实验结果表明： | 用词错误 |
| p103 | 式 5.13 的 LoRA 下标未声明（原注：未加 $\|\cdot\|$，可去除，与 5.12 保持一致） | 加入 $\|\cdot\|$ 表示数量 | 范数符号缺失 |
| p105 | 表 5-10 中 Galore、LoRA 和... | 表 5-10 中 LoRA 和... | 删除表中未出现的条目 |
| p110 | 选择题问答；5 个；研究者提出了思维链 (Chain-of-Thought,CoT)[151] 提示方法 | 问答；2 个；研究者提出了思维链 (Chain-of-Thought,CoT)[149] 提示方法 | 三处：删冗余、数量、引用序号 |
| p141 | ...或符合规规则... | ...或符合规则... | 叠字 |
| p116 | ...输入或者本身模型为具有相关知识... | ...输入或者本身模型为不具有相关知识... | 漏掉否定词，语义反转 |
| p118 | ...As-Vec[162] 和 N... | ...As-Vec[163] 和 N... | 引用序号错误 |
| p145 | 算法 7.4 输出：最优状态值函数.... | 输出：状态价值函数估计 $V(s)\approx v_\pi(s)$ | 该算法估计策略价值而非最优价值 |
| p146, p147 | $[1,0]$ | $[0,1]$ | 向量元素次序颠倒 |
| p154 | $\hat v(s;\boldsymbol W)$ 或 $\tilde v(s;\boldsymbol W)$ 作为基线（原注：两个元素一样） | 去除一个元素 | 两种写法等价，保留其一 |
| p158 | 算法 7.12 第 16 行 $V_{\text{old}}(s_t)$ | 算法 7.12 第 16 行 $V_{\text{old}}(S_t)$ | 状态符号大小写不一致 |
| p167 | 式 8.1 中 $\mathcal{E}(x,y_w,y_l)[...$ | 式 8.1 中 $\mathcal{E}(x,y_w,y_l)\,[...$ | 缺少空格，公式与括号粘连 |
| p169 | 算法 8.1 第 2 行（原注：去除。若按式替换，行数不变，可用“在样采样与训练”替换） | 去除该行，或替换为“在样采样与训练” | 该行重复了上一行的循环条件 |
| p187 | Throught Output | Throughput | 拼写错误 |
| p194 | 即 GPU $i$ 存储了梯度 $\tilde G_i=\sum_{j=1}^{n-1}G_{i+1,j}$ | $\tilde G_i=\sum_{j=0}^{n-1}G_{(i+1)\%n,\,j}$ | 环状规约的求和下标与取模说明 |
| p128 | 算法 10.1 第 6 行缺少右括号 | $L^{\text{new}}\leftarrow L\exp(M-M^{\text{new}})+\text{rowsum}\big(\exp(X_i-M^{\text{new}})\big)$ | 补全 `rowsum(...)` 的右括号 |
| p236 | $\boldsymbol W\boldsymbol X$，$\|\|((\text{diag}(s)...$ | $\boldsymbol X\boldsymbol W$，$\|(\text{diag}(s)...$ | 矩阵乘法次序与范数符号错误 |

## 三、如何反馈

发现新的问题，请附上**页码、原文、建议改法**三要素，发送到[联系页面](../contact/index.html)所列邮箱，注明主题 `[勘误]`，或在[仓库 Issue](https://github.com/token-to-llm/token-to-llm/issues) 中提交。经确认的条目会并入本表并标注版本。
