/* 全站唯一配置源：导航、链接、元信息都从这里取，页面里不写死。
   站根由本脚本自身 URL 推导，因此部署在 <user>.github.io/<repo>/ 子路径下也不会失效。 */
(function () {
  /* 由本脚本自身的 URL 反推站根：去掉 /assets/js/site.config.js 这一段。
     不能用 self.origin 拼接：双击打开时页面是 file:// 协议，浏览器给出的是
     字符串 "null"，拼出来会变成 null/docs/index.html，所有链接都点不动。
     直接对 href 做字符串截断，http(s):// 与 file:// 两种协议都成立。 */
  const self = new URL(document.currentScript.src);
  /* ROOT 指向 src/：页面、资源、正文都在这里面，故 url() 的路径相对 src/ 书写。
     主页与 404 留在仓库根（GitHub Pages 要求），单独用 home 指向上一层。 */
  const ROOT = self.href.replace(/assets\/js\/site\.config\.js.*$/, '');

  const REPO = 'https://github.com/token-to-llm/token-to-llm';

  window.SITE = {
    root: ROOT.href,
    home: new URL('../index.html', ROOT).href,
    url: (p = '') => new URL(p, ROOT).href,

    book: {
      title: '大语言模型：训练、精调与对齐',
      titleEn: 'Large Language Models: Training, Fine-Tuning and Alignment',
      subtitle:
        '结合北京大学首门系统讲授大语言模型的课程讲义，把公式、伪代码与可运行代码串成同一条路径。',
      authors: ['杨耀东', '邓杭'],
      publisher: '清华大学出版社',
      isbn: '978-7-302-71036-3',
      price: '69.00',
      pubDate: '2026 年',
      chapters: 10,
      slides: '900+',
    },

    repo: {
      url: REPO,
      branch: 'main',
      archive: REPO + '/archive/refs/heads/main.zip',
      issues: REPO + '/issues',
      releases: REPO + '/releases',
    },

    /* 课件以 PDF 形式从 CDN 载入，避免静态站体积膨胀。
       base 留空则只显示封面图与下载入口，不发起探测。
       GitHub 上只分发 PDF，HTML 源不对外。 */
    ppt: {
      base: 'https://cdn.jsdelivr.net/gh/token-to-llm/token-to-llm@main/ppt/',
    },

    /* 作者主页与头衔，主页与致谢页共用 */
    authors: {
      杨耀东: {
        site: 'https://www.yangyaodong.com/',
        title: '北京大学人工智能研究院研究员（博雅学者）· 博士生导师',
        extra: '灵初智能有限公司联合创始人兼首席科学家',
      },
      邓杭: {
        site: '',
        title: '北京大学 PAIR-Lab 科研助理',
        extra: '',
      },
    },

    contact: {
      email: 'dhcode95@gmail.com',
      wechat: 'xiaodongguaAIGC',
      wechatQr: 'assets/img/wechat-qr.jpg',
      people: [
        { name: '邓杭', role: '北京大学 PAIR-Lab 科研助理', email: 'dhcode95@gmail.com', wechat: 'xiaodongguaAIGC', qr: 'assets/img/wechat-qr.jpg', qrNote: '微信扫码添加' },
        { name: '杨耀东', role: '北京大学人工智能研究院研究员（博雅学者）', email: 'yaodong.yang@pku.edu.cn', wechat: '', qr: '', qrNote: '' },
      ],
    },

    /* 购买入口：链接来自 ./推广链接.md。
       qr 是该平台 App 的扫码图（当当无 App 码，由本仓库用同一链接生成）。
       源文件里京东行指向 s.click.taobao.com、淘宝行指向 union-click.jd.com，
       两行是交叉的；此处按平台对调，京东走 union-click、淘宝走 s.click。 */
    shops: [
      {
        name: '京东',
        url: 'https://union-click.jd.com/jdc?e=618%7Cpc%7C&p=JF8BATQJK1olWAQFU1taCkgXC18IHlIVXQAAVm4ZVxNJXF9RXh5UHw0cSgYYXBcIWDoXSQVJQwYHXV5dDkkVHDZNRwYlOHpfDF0gTDx0YS9hTTluWm9YVRYZTkcbM244GFoXVAAEVFtfC3snA2g4STUdVQ4CXFxeDUgfBF8JK1sTVQQCXFxdD00RBGk4HFscbV1XOlsJDR9FADpYT1xGVAAyZG5eOEwXCnsOaRpHSQBwZG5dOEgnA24IGlkcWw8CVFlBCEsUBGwMB1sTVQQCXFxdCkkTAWY4GVoUWQ8yZIDQuDMSChNSGgBoAU56PTUqeBXJjt8ZaSsVXw4ARW4cUU5BBTVtSBMdJXlUKAlUfBVSfhBeZwxnFm1hNFszCk0VaBNhZF1nHHl9E1YZTDNVM2o4G10VXzYDZA',
        qr: 'assets/img/qr/jd.png',
        appQr: 'assets/img/qr/jd-app.png',
        note: '京东自营，支持当日达',
      },
      {
        name: '淘宝 / 天猫',
        url: 'https://s.click.taobao.com/pEOPuLi',
        qr: 'assets/img/qr/taobao.png',
        appQr: 'assets/img/qr/taobao-app.png',
        note: '清华大学出版社旗舰店',
      },
      {
        name: '当当',
        url: 'https://product.dangdang.com/30113868.html',
        qr: 'assets/img/qr/dangdang.png',
        appQr: '',
        note: '图书满减，支持团购',
      },
    ],

    /* “代码仓库”不占导航项：它与 GitHub 图标合成页头右侧的一个按钮，直接跳远端仓库。 */
    nav: [
      { id: 'home', label: '主页', href: '__home__' },
      { id: 'docs', label: '文档', href: 'docs/index.html' },
      { id: 'contact', label: '联系', href: 'contact/index.html' },
    ],

    /* 侧栏分组：勘误独立成组（与参考文献、引用格式不同类），
       无法归入既有分类的单列到“其他”。
       运行示例拆成多页后，子页用 sub: true 在侧栏缩进一级挂在索引下面。 */
    docs: [
      {
        section: '开始',
        items: [
          { id: 'intro', label: '本书介绍', href: 'docs/index.html' },
          { id: 'chapters', label: '章节指引', href: 'docs/chapters.html' },
          { id: 'teaching', label: '课时安排', href: 'docs/teaching.html' },
          { id: 'setup', label: '环境安装', href: 'docs/setup.html' },
        ],
      },
      {
        section: '代码',
        items: [
          { id: 'examples', label: '运行示例', href: 'docs/examples.html' },
          { id: 'examples-attention', label: '注意力与多头切分', sub: true, href: 'docs/examples-attention.html' },
          { id: 'examples-rmsnorm', label: 'RMSNorm 与 LayerNorm', sub: true, href: 'docs/examples-rmsnorm.html' },
          { id: 'examples-gelu', label: 'GELU 的三种理解', sub: true, href: 'docs/examples-gelu.html' },
          { id: 'examples-ntk-rope', label: 'NTK-RoPE 的维度分工', sub: true, href: 'docs/examples-ntk-rope.html' },
          { id: 'examples-rl-tabular', label: '表格型强化学习', sub: true, href: 'docs/examples-rl-tabular.html' },
          { id: 'examples-ppo-cartpole', label: 'PPO 跑 CartPole', sub: true, href: 'docs/examples-ppo-cartpole.html' },
          { id: 'examples-contributing', label: '自己加一个示例', sub: true, href: 'docs/examples-contributing.html' },
        ],
      },
      {
        section: '参考',
        items: [
          { id: 'references', label: '参考文献', href: 'docs/references.html' },
          { id: 'cite', label: 'BibTeX 引用', href: 'docs/cite.html' },
        ],
      },
      {
        section: '勘误',
        items: [
          { id: 'errata', label: '勘误表', href: 'docs/errata.html' },
        ],
      },
    ],

    stats: [
      { n: '10', l: '章 · 16 课时' },
      { n: '900+', l: '页教学课件' },
      { n: '400+', l: '编号公式' },
      { n: '337', l: '篇参考文献' },
    ],

    /* 推荐辞，出自 ./推荐辞.md。
       lead 是卡片上默认显示的一两句摘要，text 是全文，点“展开全文”才出现——
       六段长评语直接摊开会把这一节压成一堵字墙。 */
    quotes: [
      {
        text: '大模型正在推动人工智能进入新的发展阶段。从预训练、微调到强化学习与对齐，本书较为完整地呈现了大模型能力形成与优化的技术脉络，是一部兼顾基础、前沿与实践的系统性优秀教材。',
        lead: '大模型正在推动人工智能进入新的发展阶段。本书较为完整地呈现了大模型能力形成与优化的技术脉络，兼顾基础、前沿与实践。',
        who: '高文',
        role: '中国工程院院士、北京大学博雅讲席教授',
      },
      {
        text: '随着大模型能力不断提升，如何使其目标与人类意图保持一致，已成为人工智能发展的关键问题之一。杨耀东教授团队长期从事强化学习与对齐研究，本书从大语言模型训练原理出发，围绕大模型的方方面面娓娓道来，尤其是其中针对基于反馈的后训练对齐、推理能力塑造及相关工程系统的介绍，对深入了解大模型技术的前沿进展，助益更多。全书结构完整，理论与实践并重，是系统理解大模型能力与行为控制的重要参考。',
        lead: '如何使大模型的目标与人类意图保持一致，已成为人工智能发展的关键问题之一。全书结构完整，理论与实践并重。',
        who: '孙茂松',
        role: '清华大学计算机科学与技术系长聘教授、人工智能研究院常务副院长、国际计算语言学协会会士',
      },
      {
        text: '大语言模型正在推动自然语言处理从任务建模走向通用能力学习。本书以“预训练、微调与对齐”为主线，依次讲清基础能力如何形成、专业能力如何适配、模型行为如何规范，并进一步介绍强化学习、推理模型与智能体等前沿进展。全书编排循序渐进，兼顾原理、代码和工程实现，既适合作为课程教材，也可帮助研究人员建立完整的大模型技术体系。',
        lead: '大语言模型正在推动自然语言处理从任务建模走向通用能力学习。全书编排循序渐进，兼顾原理、代码和工程实现。',
        who: '刘挺',
        role: '哈尔滨工业大学副校长、中国中文信息学会副理事长',
      },
      {
        text: '大模型技术更新迅速，教材既要讲清主干，也要为不同基础的读者保留进阶空间。本书在编排上颇具特色：正文突出强化学习与对齐的核心思想，关键方法配有推导和实现，较深入的理论问题则置于专题附录。全书层次分明，便于教学、自学和查阅，是一本兼顾基础、前沿与系统性的专业教材。',
        lead: '大模型技术更新迅速，教材既要讲清主干，也要为不同基础的读者保留进阶空间。全书层次分明，便于教学、自学和查阅。',
        who: '杨珉',
        role: '复旦大学计算与智能创新学院执行院长',
      },
      {
        text: '随着大模型从语言处理走向多模态和行业应用，模型不仅需要更强的感知与生成能力，也需要通过反馈学习形成稳定、可控的决策。本书以大模型的预训练和对齐为主线，系统梳理从基础理论、后训练方法到推理模型和智能体的发展脉络，并兼顾训练与部署实践。全书组织完整、重点突出，对人工智能研究及交叉应用具有很好的参考价值。',
        lead: '模型不仅需要更强的感知与生成能力，也需要通过反馈学习形成稳定、可控的决策。全书组织完整、重点突出。',
        who: '王延峰',
        role: '上海交通大学特聘教授、人工智能学院执行院长',
      },
      {
        text: '产业界对模型的要求，正从“榜单领先”转向“业务可信”。一款真正可用的智能系统，必须能在真实环境中稳定运行并持续迭代，而这考验的恰恰是训练、反馈、对齐与部署全链条的协同能力。本书系统梳理了这一闭环，逐环节阐释，并辅以代码与工程细节。对希望“带 AI 跑进业务”的研发人员而言，这是一本兼具前沿视野与实战价值的书。',
        lead: '产业界对模型的要求，正从“榜单领先”转向“业务可信”。本书系统梳理了训练、反馈、对齐与部署的全链条闭环。',
        who: '冯俊兰',
        role: '中国移动集团首席科学家、IEEE Fellow',
      },
    ],

    /* 主页课件墙：3×4，每页都由各章 PDF 直接导出为矢量 SVG，
       换到任何屏幕上都不糊。页码与用户指定的一致。 */
    pptGallery: [
      { img: 'assets/img/slides/ch01-p001.svg', alt: '第 1 章封面：大语言模型综述', cap: '第 1 章 · 大语言模型综述' },
      { img: 'assets/img/slides/ch02-p029.svg', alt: 'Transformer 网络架构图与三种注意力的位置', cap: '第 2 章 · 模型架构' },
      { img: 'assets/img/slides/ch03-p006.svg', alt: 'GPT 生成模型的发展脉络', cap: '第 3 章 · 生成模型脉络' },
      { img: 'assets/img/slides/ch04-p049.svg', alt: '带 KV-Cache 的预填充与解码两个阶段', cap: '第 4 章 · 键值缓存' },
      { img: 'assets/img/slides/ch05-p025.svg', alt: '四类参数高效微调方法', cap: '第 5 章 · 参数高效微调' },
      { img: 'assets/img/slides/ch06-p002.svg', alt: '第 6 章本章目录', cap: '第 6 章 · 提示词工程' },
      { img: 'assets/img/slides/ch07-p056.svg', alt: '试探性出发首次访问蒙特卡洛控制算法', cap: '第 7 章 · 蒙特卡洛控制' },
      { img: 'assets/img/slides/ch08-p041.svg', alt: 'PPO 的流程', cap: '第 8 章 · PPO 流程' },
      { img: 'assets/img/slides/ch08-p083.svg', alt: '推理问题的形式化', cap: '第 8 章 · 推理强化学习' },
      { img: 'assets/img/slides/ch09-p022.svg', alt: '全交换通信操作', cap: '第 9 章 · 全交换' },
      { img: 'assets/img/slides/ch09-p088.svg', alt: '第 9 章思考题与实践题', cap: '第 9 章 · 思考与练习' },
      { img: 'assets/img/slides/ch10-p043.svg', alt: '批量 Flash Attention 的双层循环', cap: '第 10 章 · 批量 FlashAttention' },
    ],
  };
})();
