# Our Little Home

**A little world, just for us.** 第一阶段的双人生活模拟游戏基础世界。当前为公开可参观的单人漫步原型，身份、NPC 行为、双人互动和云端数据留待后续阶段。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，以及 npm。

```bash
npm install
npm run dev
```

打开终端显示的地址，通常是 `http://localhost:5173/`。点击「进入小屋」后，角色出现在庭院南侧入口附近。用 **WASD** 或 **方向键**移动；手机和平板使用屏幕左下角方向键。沿石子路走到北侧小屋门口进入室内，走到室内南侧房门可返回庭院。右上角按钮返回首页。

## 检查与构建

```bash
npm run typecheck
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

最后一条可供同一局域网内设备预览；访问运行机器的 IP 和 Vite 显示的端口。生产静态文件在 `dist/`，可部署到支持静态站点的服务。

推送到 GitHub 的 `main` 分支后，`.github/workflows/pages.yml` 会运行测试、构建并部署到 GitHub Pages。站点使用相对资源路径，支持仓库子路径。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/App.tsx` | 首页、北京时间环境状态与游戏入口 |
| `src/components/HousePreview.tsx` | 首页原创 Canvas 像素小屋动画 |
| `src/components/GameScreen.tsx` | Phaser 容器、加载提示、触控方向键与游戏 HUD |
| `src/game/HomeScene.ts` | 角色动画、移动、镜头、雨效和淡入淡出切图 |
| `src/game/maps.ts` | 16×16 网格地图、家具绘制、碰撞和门口触发区 |
| `src/game/environment.ts` | 北京时间昼夜、季节与按日期固定的模拟天气 |
| `src/game/input.ts` | 独立触控输入状态 |
| `src/game/contracts.ts` | 未来身份、角色外观、NPC、互动、回忆和存档接口 |
| `src/style.css` | 响应式像素风界面 |

## 地图与素材

- 庭院：44×34 格，南侧院门，北侧小屋，石子路、纪念树、长椅、花圃、路灯及散步空间。初始坐标约 `(22, 30)`。
- 室内：30×24 格，床、书架、衣柜、沙发、茶几、书桌、绿植和房门按第一阶段指定坐标固定摆放；中央可行走。没有厨房。
- 碰撞按角色脚部约 8×4 像素检查，水平和垂直轴分别处理。镜头按场景边界约束并平滑跟随。
- 小屋、地图、角色和界面图形均为项目内手绘代码生成的**原创临时像素素材**。角色帧由 `HomeScene.ts` 生成；后续可用同尺寸或调整帧配置的正式精灵图替换。没有使用第三方商业游戏素材。
- 昼夜与季节按 `Asia/Shanghai` 时区计算；天气根据北京时间日期确定，同一天刷新可复现。此阶段无天气 API、音效或持久化。

## 后续扩展边界

Phaser 场景只处理基础世界。`contracts.ts` 提供未来接入姐姐身份、游客权限、门都 NPC、自主行为、角色换装、互动、日记相册及云端存档的接口起点。此阶段没有接入 Supabase、认证、付费服务或管理后台。正式角色图片接入时，可替换 `createCharacterSheet` 的纹理来源，并保持四方向动画帧命名。
