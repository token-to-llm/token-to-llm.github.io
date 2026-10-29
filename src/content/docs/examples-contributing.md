# 自己加一个示例

新增脚本只要放到 `src/<章>/` 下，`tests/run_all.py` 会自动收录：

```bash
# 新增 src/transformer/my_experiment.py 之后
python tests/run_all.py
```

若脚本要出图，沿用仓库约定写到 `output/`：

```python
import os
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))), "output")
os.makedirs(OUT, exist_ok=True)
plt.savefig(os.path.join(OUT, os.path.basename(__file__).replace(".py", ".pdf")))
```

## 写作约定

- 一个脚本只验证书里的一处算法或一幅插图，命名与正文小节号一致。
- 随机种子固定，输出可复现——页面上贴的每一段输出都是从仓库直接跑出来的。
- 只依赖 PyTorch 与 Matplotlib，不引入新的第三方库。

完整的依赖安装步骤见[环境安装](setup.html)。

## 下一步

[回到示例索引](examples.html)
