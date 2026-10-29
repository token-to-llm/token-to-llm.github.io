/* 十章数据。split16 只描述 16 课时教学拆分，课件本身不拆。 */
window.CHAPTERS = [
  {
    "n": 1,
    "title": "大语言模型综述",
    "ppt": "llm.pdf",
    "code": "src/",
    "tags": [
      "基础"
    ],
    "sections": [
      {
        "no": "1.1",
        "title": "大语言模型介绍",
        "note": "概念、历史与模型脉络",
        "slide": 3
      },
      {
        "no": "1.2",
        "title": "大语言模型特点",
        "note": "缩放、涌现与苦涩的教训",
        "slide": 12
      },
      {
        "no": "1.3",
        "title": "大语言模型研究现状",
        "note": "从语言建模到架构、技术路线与训练数据",
        "slide": 21
      },
      {
        "no": "1.4",
        "title": "自然语言数据处理",
        "note": "分词、词嵌入、Word2Vec 与词嵌入层",
        "slide": 45
      },
      {
        "no": "1.5",
        "title": "小结",
        "note": "本章要点回顾与后续章节的路线",
        "slide": 65
      }
    ],
    "split16": null
  },
  {
    "n": 2,
    "title": "Transformer 模型",
    "ppt": "transformer.pdf",
    "code": "src/",
    "tags": [
      "基础"
    ],
    "sections": [
      {
        "no": "2.1",
        "title": "Transformer 概述",
        "note": "自注意力机制与 Transformer 的核心价值",
        "slide": 3
      },
      {
        "no": "2.2",
        "title": "注意力机制",
        "note": "序列表征、注意力概念与注意力分数",
        "slide": 7
      },
      {
        "no": "2.3",
        "title": "Transformer 模型结构",
        "note": "输入层、编码器、解码器与输出层",
        "slide": 24
      },
      {
        "no": "2.4",
        "title": "Transformer 训练和推理",
        "note": "并行训练与自回归推理",
        "slide": 76
      },
      {
        "no": "2.5",
        "title": "关键代码实践",
        "note": "缩放点积注意力与多头注意力的 PyTorch 实现",
        "slide": 85
      },
      {
        "no": "2.6",
        "title": "小结",
        "note": "本章要点与位置编码的必要性（附录 2.6.1）",
        "slide": 92
      }
    ],
    "split16": {
      "upper": [
        "2.1",
        "2.2",
        "2.3"
      ],
      "lower": [
        "2.4",
        "2.5",
        "2.6"
      ],
      "note": "上：概述与注意力机制、模型结构；下：训练推理与代码实践"
    }
  },
  {
    "n": 3,
    "title": "GPT 模型",
    "ppt": "gpt.pdf",
    "code": "src/",
    "tags": [
      "预训练"
    ],
    "sections": [
      {
        "no": "3.1",
        "title": "GPT 模型介绍",
        "note": "GPT 系列的演进、关键改进与预训练目标",
        "slide": 3
      },
      {
        "no": "3.2",
        "title": "GPT 网络结构",
        "note": "输入层、解码器与输出层",
        "slide": 24
      },
      {
        "no": "3.3",
        "title": "BPE 编码",
        "note": "BPE 的词表训练、编码与解码",
        "slide": 48
      },
      {
        "no": "3.4",
        "title": "GPT 模型生成",
        "note": "串行推理与各类生成策略",
        "slide": 60
      },
      {
        "no": "3.5",
        "title": "小结",
        "note": "范式、可扩展性与影响",
        "slide": 73
      },
      {
        "no": "3.6*",
        "title": "附录：语言模型的压缩理论*",
        "note": "压缩、编码与似然最大化",
        "slide": 77
      }
    ],
    "split16": null
  },
  {
    "n": 4,
    "title": "Llama 模型",
    "ppt": "llama.pdf",
    "code": "src/",
    "tags": [
      "预训练"
    ],
    "sections": [
      {
        "no": "4.1",
        "title": "Llama 模型",
        "note": "开源里程碑与预训练规模",
        "slide": 3
      },
      {
        "no": "4.2",
        "title": "Llama 模型结构",
        "note": "整体结构、Llama 块与四个关键模块",
        "slide": 14
      },
      {
        "no": "4.3",
        "title": "键值缓存",
        "note": "生成分析、实现与显存",
        "slide": 44
      },
      {
        "no": "4.4",
        "title": "长文本继续预训练",
        "note": "扩展方案与位置编码改造",
        "slide": 58
      },
      {
        "no": "4.5",
        "title": "小结",
        "note": "结构要点与后续衔接",
        "slide": 77
      },
      {
        "no": "4.6",
        "title": "附录：稀疏混合专家系统",
        "note": "Top-K 门控与负载均衡",
        "slide": 80
      }
    ],
    "split16": {
      "upper": [
        "4.1",
        "4.2",
        "4.3"
      ],
      "lower": [
        "4.4",
        "4.5",
        "4.6"
      ],
      "note": "上：模型与结构、键值缓存；下：长文本继续预训练与附录"
    }
  },
  {
    "n": 5,
    "title": "有监督微调",
    "ppt": "finetune.pdf",
    "code": "src/",
    "tags": [
      "微调"
    ],
    "sections": [
      {
        "no": "5.1",
        "title": "语言模型微调概览",
        "note": "微调类型与 PEFT 概览",
        "slide": 3
      },
      {
        "no": "5.2",
        "title": "参数高效微调",
        "note": "软提示、前缀、适配器、LoRA",
        "slide": 23
      },
      {
        "no": "5.3",
        "title": "LoRA 算法原理",
        "note": "低秩重参数化与子空间分析",
        "slide": 32
      },
      {
        "no": "5.4",
        "title": "QLoRA",
        "note": "LoRA 上量化基座，降低显存",
        "slide": 49
      },
      {
        "no": "5.5",
        "title": "微调方法对比",
        "note": "三种微调的精度、显存与吞吐",
        "slide": 52
      },
      {
        "no": "5.6",
        "title": "小结",
        "note": "回顾与 LoRA 的扩展方向",
        "slide": 56
      }
    ],
    "split16": null
  },
  {
    "n": 6,
    "title": "提示词工程和 LLM 应用",
    "ppt": "prompt.pdf",
    "code": "src/",
    "tags": [
      "应用"
    ],
    "sections": [
      {
        "no": "6.1",
        "title": "提示词工程",
        "note": "从任务描述到上下文学习：提示词如何激发预训练模型的能力",
        "slide": 3
      },
      {
        "no": "6.2",
        "title": "思维链",
        "note": "让模型先推理再作答：从推理问题的困难到 CoT 提示",
        "slide": 16
      },
      {
        "no": "6.3",
        "title": "CoT 扩展方案",
        "note": "自一致性、零样本 CoT 与思维树：从单条链到搜索",
        "slide": 27
      },
      {
        "no": "6.4",
        "title": "检索增强生成",
        "note": "用外部知识弥补幻觉与时效性：RAG、Self-RAG 与嵌入模型",
        "slide": 41
      },
      {
        "no": "6.5",
        "title": "智能体",
        "note": "规划、记忆与工具：LLM 作为智能体的大脑",
        "slide": 53
      },
      {
        "no": "6.6",
        "title": "自指令数据合成",
        "note": "用提示词生成指令数据：Self-Instruct 与 Alpaca",
        "slide": 63
      },
      {
        "no": "6.7",
        "title": "评估",
        "note": "基准测评、胜率、ELO 排位与大模型裁判",
        "slide": 75
      },
      {
        "no": "6.8",
        "title": "小结",
        "note": "两条路径、两个方向：本章的回顾",
        "slide": 86
      },
      {
        "no": "6.9",
        "title": "附录：In-Context learning 理论*",
        "note": "贝叶斯、梯度下降与信息论三个视角",
        "slide": 89
      }
    ],
    "split16": null
  },
  {
    "n": 7,
    "title": "强化学习",
    "ppt": "rl.pdf",
    "code": "src/",
    "tags": [
      "强化学习"
    ],
    "sections": [
      {
        "no": "7.1",
        "title": "强化学习",
        "note": "MDP、回报、价值函数与贝尔曼方程",
        "slide": 3
      },
      {
        "no": "7.2",
        "title": "强化学习方法",
        "note": "三大类方法的全景与表 7.1",
        "slide": 31
      },
      {
        "no": "7.3",
        "title": "动态规划",
        "note": "策略评估、策略改进与 GPI",
        "slide": 36
      },
      {
        "no": "7.4",
        "title": "蒙特卡洛方法",
        "note": "用完整幕的平均回报估计价值",
        "slide": 47
      },
      {
        "no": "7.5",
        "title": "时序差分学习",
        "note": "TD、SARSA、Q 学习、DQN 与 TD(λ)",
        "slide": 59
      },
      {
        "no": "7.6",
        "title": "策略梯度方法",
        "note": "直接优化参数化策略：定理、证明与 REINFORCE",
        "slide": 88
      },
      {
        "no": "7.7",
        "title": "演员-评论家",
        "note": "演员更新策略、评论家评估价值：AC、TRPO、GAE 与 PPO",
        "slide": 109
      },
      {
        "no": "7.8",
        "title": "大语言模型的 MDP 描述",
        "note": "状态是词元序列，动作是下一个词元",
        "slide": 125
      },
      {
        "no": "7.9",
        "title": "小结",
        "note": "全章脉络：从 MDP 到三类求解方法",
        "slide": 129
      }
    ],
    "split16": {
      "upper": [
        "7.1",
        "7.2",
        "7.3",
        "7.4",
        "7.5"
      ],
      "lower": [
        "7.6",
        "7.7",
        "7.8",
        "7.9"
      ],
      "note": "上：MDP 与三类求解方法；下：策略梯度、演员-评论家与 LLM 的 MDP"
    }
  },
  {
    "n": 8,
    "title": "基于强化学习的大语言模型训练",
    "ppt": "rl-llm.pdf",
    "code": "src/",
    "tags": [
      "对齐"
    ],
    "sections": [
      {
        "no": "8.1",
        "title": "大语言模型后训练与对齐",
        "note": "指令微调、人类偏好对齐与推理强化学习",
        "slide": 3
      },
      {
        "no": "8.2",
        "title": "人工智能系统对齐定义",
        "note": "对齐的目标 RICE 与对齐循环",
        "slide": 12
      },
      {
        "no": "8.3",
        "title": "基于人类反馈的强化学习",
        "note": "RLHF 三步流程、PPO 实现细节与算法分析",
        "slide": 23
      },
      {
        "no": "8.4",
        "title": "直接偏好优化",
        "note": "从 Bradley-Terry 模型推导 DPO 损失",
        "slide": 58
      },
      {
        "no": "8.5",
        "title": "大语言模型推理强化学习",
        "note": "规则奖励、GRPO 与 DeepSeek-R1 的训练框架",
        "slide": 78
      },
      {
        "no": "8.6",
        "title": "小结",
        "note": "偏好对齐与推理强化学习的两条路线",
        "slide": 100
      }
    ],
    "split16": {
      "upper": [
        "8.1",
        "8.2",
        "8.3"
      ],
      "lower": [
        "8.4",
        "8.5",
        "8.6"
      ],
      "note": "上：后训练、对齐定义与 RLHF；下：DPO 与推理强化学习"
    }
  },
  {
    "n": 9,
    "title": "大语言模型的训练",
    "ppt": "training.pdf",
    "code": "src/",
    "tags": [
      "系统"
    ],
    "sections": [
      {
        "no": "9.1",
        "title": "大语言模型训练",
        "note": "三大挑战、训练框架、显存开销与通信基础",
        "slide": 3
      },
      {
        "no": "9.2",
        "title": "混合并行策略",
        "note": "四种并行及其正交组合",
        "slide": 24
      },
      {
        "no": "9.3",
        "title": "分布式训练系统",
        "note": "DeepSpeed 零冗余优化器与显存分区",
        "slide": 61
      },
      {
        "no": "9.4",
        "title": "小结",
        "note": "并行算法的取舍与系统视角",
        "slide": 75
      },
      {
        "no": "9.5",
        "title": "附录：专家并行*",
        "note": "MoE 的专家部署与两次全交换",
        "slide": 79
      },
      {
        "no": "9.6",
        "title": "附录：训练-推理解耦架构*",
        "note": "RL 训练的采样部署、参数同步与异步推理",
        "slide": 84
      }
    ],
    "split16": {
      "upper": [
        "9.1",
        "9.2"
      ],
      "lower": [
        "9.3",
        "9.4",
        "9.5",
        "9.6"
      ],
      "note": "上：训练挑战与混合并行；下：分布式系统与两个附录"
    }
  },
  {
    "n": 10,
    "title": "高效大语言模型",
    "ppt": "inference.pdf",
    "code": "src/",
    "tags": [
      "系统"
    ],
    "sections": [
      {
        "no": "10.1",
        "title": "LLM推理特点分析",
        "note": "推理两阶段与加速方案分类",
        "slide": 3
      },
      {
        "no": "10.2",
        "title": "Flash Attention",
        "note": "Online-Softmax 与分块注意力",
        "slide": 11
      },
      {
        "no": "10.3",
        "title": "vLLM 推理服务",
        "note": "分页注意力与连续批处理",
        "slide": 62
      },
      {
        "no": "10.4",
        "title": "量化压缩部署",
        "note": "SmoothQuant 与 AWQ",
        "slide": 77
      },
      {
        "no": "10.5",
        "title": "投机解码",
        "note": "块解码与投机解码",
        "slide": 86
      },
      {
        "no": "10.6",
        "title": "小结",
        "note": "四条加速路线各自的瓶颈与手段",
        "slide": 97
      }
    ],
    "split16": {
      "upper": [
        "10.1",
        "10.2"
      ],
      "lower": [
        "10.3",
        "10.4",
        "10.5",
        "10.6"
      ],
      "note": "上：推理特点与 Flash Attention；下：vLLM、量化压缩与投机解码"
    }
  }
];
