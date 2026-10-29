"""把 content/docs/*.md 打进一个 JS 包，供 file:// 协议下顶替 fetch。

浏览器在 file:// 下禁止 XHR/fetch 读本地文件，双击打开时文档页会整页空白。
这个脚本把同样的正文预生成为 window.MD_CONTENT，markdown.js 取不到 fetch 时回退到它。
http(s) 部署时 fetch 正常，这个包不会被用到，但保留着也没有副作用。

用法：python3 src/tools/gen_content_js.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))          # src/tools
SITE = os.path.dirname(HERE)                               # src
DOCS = os.path.join(SITE, "content", "docs")
OUT = os.path.join(SITE, "assets", "js", "content-bundle.js")


def main():
    parts = ["/* 自动生成：由 src/tools/gen_content_js.py 从 content/docs/*.md 提取，请勿手改。",
             "   用途：双击打开（file:// 协议）时 fetch 被浏览器拦下，页面改从这里取正文。 */",
             "window.MD_CONTENT = {"]

    names = sorted(f for f in os.listdir(DOCS) if f.endswith(".md"))
    count = 0
    for name in names:
        with open(os.path.join(DOCS, name), encoding="utf-8") as f:
            text = f.read()
        parts.append("  %s: %s," % (json.dumps(name[:-3]), json.dumps(text)))
        count += 1

    parts.append("};")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(parts) + "\n")

    print("wrote", OUT)
    print("  entries:", count)


if __name__ == "__main__":
    main()
