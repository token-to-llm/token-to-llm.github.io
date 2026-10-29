# 环境安装

配套代码在独立仓库中维护：[token-to-llm](https://github.com/token-to-llm/token-to-llm)。
`src/` 下每个 `.py` 文件对应书中一处算法或一幅插图，命名与正文的小节号一致，便于对照阅读。

## 1. 获取代码

```bash
git clone https://github.com/token-to-llm/token-to-llm.git
cd token-to-llm
```

## 2. 创建环境

仓库依赖很轻：**PyTorch** 与 **Matplotlib** 两个主要依赖，不额外引入深度学习框架。

### 方式一：conda（推荐）

```bash
conda create -n t2t python=3.10 -y
conda activate t2t
pip install -r requirements.txt
```

### 方式二：venv

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

> 若需要使用 GPU，请先按 [PyTorch 官方指引](https://pytorch.org/get-started/locally/) 安装与你的 CUDA 版本匹配的 `torch`，再执行 `pip install -r requirements.txt`，否则 pip 可能装入 CPU 版本。

## 3. 运行单个脚本

每个脚本都可独立执行。带绘图的部分会把结果写到仓库根目录的 `output/`：

```bash
python src/transformer/scaled_dot_product_attention.py   # 缩放点积注意力
python src/llama/rmsnorm.py                             # RMSNorm 与 LayerNorm 对比
python src/gpt/gelu.py                                  # GELU 的三种理解
```

## 4. 批量运行全部示例

`tests/run_all.py` 会遍历 `src/*/*.py` 并逐个执行，报告每个脚本的通过状态与最后几行输出：

```bash
python tests/run_all.py
```

输出形如：

```text
共 43 个脚本

[OK]   src/gpt/gelu.py
         x 形状: (1000,)
         GELU 端点: tensor(-0.0036) tensor(2.9964)
[OK]   src/transformer/multi_head_attention.py
         输入形状: (4, 6, 512)
         输出形状: (4, 6, 512)
...

通过 43 / 43
```

首次运行要编译并缓存 Matplotlib 的字体，耗时略长；之后再跑会快很多。

## 5. 章节与目录对照

| 章 | 内容 | 代码目录 | 课件 |
| --- | --- | --- | --- |
| 1 | 大语言模型综述 | `src/llm/` | `ppt/llm.pdf` |
| 2 | Transformer 模型 | `src/transformer/` | `ppt/transformer.pdf` |
| 3 | GPT 模型 | `src/gpt/` | `ppt/gpt.pdf` |
| 4 | Llama 模型 | `src/llama/` | `ppt/llama.pdf` |
| 5 | 有监督微调 | `src/sft/` | `ppt/finetune.pdf` |
| 6 | 提示词工程和 LLM 应用 | `src/prompt/` | `ppt/prompt.pdf` |
| 7 | 强化学习 | `src/rl/` | `ppt/rl.pdf` |
| 8 | 基于强化学习的大语言模型训练 | `src/rl-llm/` | `ppt/rl-llm.pdf` |
| 9 | 大语言模型的训练 | `src/training/` | `ppt/training.pdf` |
| 10 | 高效大语言模型 | `src/inference/` | `ppt/inference.pdf` |

## 6. 常见问题

**`ModuleNotFoundError: No module named 'torch'`**
环境没激活，或装到了另一个 Python。确认 `which python` 指向当前环境后再 `pip install`。

**图表中文显示为方框**
Matplotlib 找不到中文字体。在脚本开头指定本机已有字体，例如
`matplotlib.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'PingFang SC']`，
并设 `axes.unicode_minus = False`。

**显存不足**
第 9、10 章的示例按“可读性优先”设计，多数脚本默认用小规模配置即可跑通；把脚本顶部的 `batch_size`、`seq_len` 调小即可。

**只想看结论，不想跑代码**
课件 PDF 与书中的图、表、算法框一致，可直接查阅[章节指引](chapters.html)。
