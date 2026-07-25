# 观俗 · 执镜 —— 传统文化应用

两个守红线的传统文化 Web 应用：

| 应用 | 定位 | 入口 |
| --- | --- | --- |
| **观俗** | 人生叙事与民俗研究模式：历法节气解释器、断语→自我叙事练习、五运六气医史博物馆、《炁体源流》文献导览 | `app/guansu/index.html` |
| **执镜** | 引用经典的苏格拉底式 AI 陪练：庄子换视角、道德经做减法、孙子评估代价、毛选逼拿事实；每次回答必附引文出处、解释置信度、适用边界、可执行小实验 | `app/zhijing/index.html` |

**共同红线**：不预测（婚姻 / 财运 / 疾病 / 考试志愿）、不诊断、不承诺改命；遇到自伤风险、重大疾病、法律与财务危机，直接转介专业资源（12356 心理援助热线、12348 法律援助等）。

## 技术栈

React 19 + TypeScript + Vite 7（多页应用）+ Tailwind CSS。全部数据与推理逻辑均在本地运行，无需任何 API Key；对话与练习笔记仅保存在浏览器 localStorage。

## 开发

```bash
cd app
npm install
npm run dev      # 开发预览 http://localhost:7100
npm run test     # 核心逻辑测试（干支历法 / 节气 / 引擎 / 风控）
npm run build    # 生产构建 → app/dist/
npm run preview  # 预览生产构建
```

## 目录结构

```
app/
├── index.html            # 门户
├── guansu/index.html     # 观俗
├── zhijing/index.html    # 执镜
├── scripts/test.ts       # 逻辑测试
└── src/
    ├── shared/           # 数据层：干支历法 / 节气 / 五运六气 / 断语 / 引文库 / 执镜引擎
    ├── guansu/           # 观俗四个模块
    └── zhijing/          # 执镜聊天界面与护栏
```

## 部署上线

`app/dist/` 是纯静态站点，可部署到任意静态托管。已内置 GitHub Pages 自动部署工作流（`.github/workflows/deploy.yml`）：

```bash
# 在本目录（仓库根）执行
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

然后到仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，推送即自动构建发布，
地址为 `https://<你的用户名>.github.io/<仓库名>/`。

其他选择：把 `app/dist/` 拖到 [Netlify Drop](https://app.netlify.com/drop)，
或在 Vercel / Cloudflare Pages 导入本仓库（构建命令 `cd app && npm ci && npm run build`，输出目录 `app/dist`）。
