# Our Little Home

**A little world, just for us.** 温暖的双人像素生活世界。玩家是马硕，门都是可自主活动的 NPC。阶段 3.0 开发分支加入可替换的室内床样板和双服装资源接口；角色与环境美术仍待正式精修。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，以及 npm。

```bash
npm install
npm run dev
```

打开终端显示的地址，通常是 `http://localhost:5173/`。点击「进入小屋」后，马硕出生在庭院南侧。使用 **WASD**、**方向键**或屏幕左下角触控方向键移动。走到北侧小屋门口进入室内，走到室内南侧房门返回庭院。右上角按钮返回首页。

点击门都角色，或点击右上方「与门都互动」，可选择对话、跟随、牵手、拥抱、一起坐下、一起睡觉或自由活动。坐下、睡觉、拥抱时移动即可退出；任意时刻也可从菜单切换动作。一起坐下会根据当前场景前往室内沙发或庭院长椅；一起睡觉仅在室内可用。门都距离较远时会自动寻路靠近；到不了的互动会给出提示并恢复安全状态。

## 检查、构建与部署

```bash
npm run typecheck
npm test
npm run build
```

生产静态文件在 `dist/`。`.github/workflows/ci.yml` 在以 `main` 为目标的 PR 上运行测试与构建；`.github/workflows/pages.yml` 仅在推送到 `main` 或手动触发时部署 GitHub Pages。开发分支不会覆盖线上版本。站点使用相对资源路径以支持仓库子路径。

像素 PNG 已提交，运行游戏不需要 Python。若要重新绘制当前临时素材，可安装 Pillow 并运行 `python3 scripts/draw_characters.py` 与 `python3 scripts/draw_maps.py`，再执行测试。请先阅读 [美术规范](docs/ART_SPEC.md)：脚本生成的是项目原创的可玩临时稿，尚未达到参考图的最终画质，也没有使用参考图中的原始像素。

阶段 3.0 的[室内样板验收清单](docs/ART_REVIEW.md)列出独立床素材、双人图集、尺寸、状态和仍需外部美术制作的资源。重新生成图集或地图后，运行 `python3 scripts/validate_art.py` 检查帧边界、透明度与室内图层合成；预览用角色图集位于 `public/art-review/`，更新角色原图后需要同步这两份展示副本。

本地启动后可打开 `/art-review/index.html` 比较实际游戏截图与美术方向概念图；网页游戏仍从首页的「进入小屋」打开。

## 结构

| 路径 | 职责 |
| --- | --- |
| `src/App.tsx`、`src/components/HousePreview.tsx` | 首页与动态像素小屋 |
| `src/components/GameScreen.tsx`、`src/style.css` | 游戏 HUD、互动菜单和触控布局 |
| `src/game/HomeScene.ts`、`src/game/createGame.ts` | Phaser 场景、玩家控制、镜头和场景切换 |
| `src/game/maps.ts`、`src/game/collision.ts` | 原有 16×16 地图碰撞格与共享脚部碰撞 |
| `src/game/artCatalog.ts` | 室内样板图层、家具碰撞足迹、四季庭院资源清单 |
| `src/game/pathfinding.ts`、`src/game/routeFollower.ts` | 四方向 A* 寻路和可取消的移动执行 |
| `src/game/anchors.ts`、`src/game/interactionPositions.ts` | 家具旁活动锚点、双人站位与狭窄通道队形 |
| `src/game/behavior.ts`、`src/game/CompanionController.ts` | NPC 状态、意图与双人互动协调 |
| `src/game/characterAssets.ts`、`src/game/characterAnimations.ts`、`src/assets/characters/` | 独立角色 PNG 图集、资源配置和统一动作动画 |
| `src/game/dialogue.ts`、`src/game/DialogueBubble.ts` | 集中管理的预设台词与自动换行气泡 |
| `src/assets/maps/`、`scripts/draw_maps.py` | 室内与四季庭院的原创像素图层及生成脚本 |
| `docs/ART_SPEC.md` | 像素色板、图集帧表、替换流程与美术限制 |
| `src/game/environment.ts` | 北京时间昼夜、季节与可复现模拟天气 |
| `src/game/contracts.ts` | 后续身份、外观与存档系统的接口预留 |

## 实现说明

- 庭院为 44×34 格，室内为 30×24 格；第一阶段地图和家具坐标未改动；地图从运行时几何绘制改为小尺寸 PNG 底图与独立遮挡层。
- 玩家和 NPC 共用 `canStand` 脚部碰撞规则。A* 只规划可站立格；寻路失败或超时会取消动作，NPC 不会用瞬移掩盖普通寻路失败。
- NPC 在纪念树、长椅、花圃、书架、窗边、沙发、床边等锚点间活动，并在每处停留约 11–18 秒。夜晚在室内更倾向床边休息。跟随和牵手在场景切换后保留意图。
- 双人坐下或睡觉时，先分别走到家具外的可行走锚点，再播放短暂进入动画。起身或起床时返回锚点。牵手优先并排，狭窄处改为前后队形。
- `characterAssets.ts` 载入两张各含 32 帧的透明图集，`characterAnimations.ts` 将动作映射到实际纹理；每个方向有四帧行走，还有坐下、起身、牵手、拥抱、躺下、睡觉、起床和说话姿态。加载失败时使用简化回退精灵。正式角色可按 `docs/ART_SPEC.md` 替换素材而不改 NPC 行为。
- 没有接入 AI 对话、账号、云存档、衣柜、日记、相册或管理员后台；进度刷新后不保存。

## 验证边界

自动测试覆盖北京时间、原有碰撞、地图互动锚点、绕障与不可达寻路、状态取消及狭窄处队形。桌面 Chromium 和触控模拟浏览器用于运行交互流程。**实际 iPad Safari 横屏触控仍需人工验收**，尤其是持续按键、系统手势、旋转屏幕后菜单及动画状态。
