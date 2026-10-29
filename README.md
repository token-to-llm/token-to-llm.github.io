# 《大语言模型：训练、精调与对齐》官网

教材的 GitHub Pages 站点，纯静态：无框架、无构建、无 node_modules。

- **配书代码**：[github.com/token-to-llm/token-to-llm](https://github.com/token-to-llm/token-to-llm) — 书中每个 `src/*.py` 对应一处算法或一幅插图
- **在线站点**：[token-to-llm.com](https://token-to-llm.com)

## 目录

```
githubio/
├── index.html          主页（GitHub Pages 入口）
├── 404.html
├── robots.txt / sitemap.xml
└── src/
    ├── docs/           文档页（客户端渲染 content/docs/*.md）
    ├── contact/ purchase/ thanks/
    ├── content/docs/   文档正文 Markdown
    ├── assets/
    │   ├── css/        site.css 主样式 + 各组件样式
    │   ├── js/         site.config.js 全站配置、chrome.js 页头页脚、markdown.js 渲染
    │   ├── data/       CartPole 回放数据
    │   ├── img/        封面、样张、课件截图
    │   └── vendor/     内置依赖（marked / KaTeX / highlight.js）
    └── tools/          内容打包与素材生成脚本
```

只有 `index.html`、`404.html`、`robots.txt`、`sitemap.xml` 留在根目录（部署入口），其余全部在 `src/`。

## 本地预览

页面用 `fetch()` 读 Markdown，`file://` 下会被浏览器拦截，需要起 HTTP 服务：

```bash
cd githubio
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 修改

几乎所有可调内容都在 `src/assets/js/site.config.js`：书名、作者、推荐辞、导航与文档侧栏、购买链接、课件来源。

文档正文是 `src/content/docs/*.md`。新增一页需要：在 `SITE.docs` 加一条侧栏项、在 `src/docs/` 复制一个页面模板（照 `setup.html`），再重跑内容打包：

```bash
python3 src/tools/gen_content_js.py   # 生成 src/assets/js/content-bundle.js
```

`content-bundle.js` 是自动生成的，不要手改——它让 `file://` 直接打开时也能读到正文。

## 许可

- 站点代码：MIT（见 [LICENSE](LICENSE)）
- 书中文字、插图与课件：© 2026 邓杭、杨耀东，仅供教学与学习使用，商用需书面许可
