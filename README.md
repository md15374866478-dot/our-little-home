# Our Little Home

**A little world, just for us.** 温暖的双人像素生活世界。玩家是马硕，门都是可自主活动的 NPC。Phase 3.3 开发分支已将获认可的 V3.1 人物方向接入实际游戏，包含四方向行走与双人互动动作；已验收的室内、庭院画面没有重绘。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，以及 npm。

```bash
npm install
npm run dev
```

打开终端显示的地址，通常是 `http://localhost:5173/`。点击「进入小屋」后，马硕出生在庭院南侧。使用 **WASD**、**方向键**或屏幕左下角触控方向键移动。走到北侧小屋门口进入室内，走到室内南侧房门返回庭院。右上角按钮返回首页。

美术验收可从 `/?preview=home` 直达**同一个可玩游戏场景**的室内安全出生点；不带参数时仍从庭院出生。`/art-review/` 展示真实游戏互动截图与两张完整透明图集。

点击门都角色，或点击右上方「与门都互动」，可选择对话、跟随、牵手、拥抱、一起坐下、一起睡觉或自由活动。坐下、睡觉、拥抱时移动即可退出；任意时刻也可从菜单切换动作。一起坐下会根据当前场景前往室内沙发或庭院长椅；一起睡觉仅在室内可用。门都距离较远时会自动寻路靠近；到不了的互动会给出提示并恢复安全状态。

## 检查、构建与部署

```bash
npm run typecheck
npm test
npm run build
```

生产静态文件在 `dist/`。`.github/workflows/ci.yml` 在以 `main` 为目标的 PR 上运行测试与构建；`.github/workflows/pages.yml` 仅在推送到 `main` 或手动触发时部署 GitHub Pages。开发分支不会覆盖线上版本。站点使用相对资源路径以支持仓库子路径。

像素 PNG 已提交，运行游戏不需要 Python。若要从源图重建当前人物图集，可安装 Pillow 并运行 `python3 scripts/prepare_characters_v33.py`；它沿用已获认可的 16 帧行走姿态，并打包 16 帧 AI 辅助互动姿态。旧角色与原有庭院临时素材脚本分别是 `scripts/draw_characters.py` 和 `scripts/draw_maps.py`。现行室内详细样板独立由 `python3 scripts/prepare_indoor_detailed.py` 导出。请先阅读 [美术规范](docs/ART_SPEC.md)：动作帧仍需按真人照片逐帧精修。

阶段 3.0 的[室内样板历史清单](docs/ART_REVIEW.md)列出底图与遮挡裁片；[Phase 3.3 验收说明](docs/PHASE33_REVIEW.md)列出本轮角色素材、动作映射和限制。重新生成图集或地图后，运行 `python3 scripts/validate_art.py` 检查帧边界、透明度与室内图层；预览用角色图集位于 `public/art-review/`，更新角色原图后需要同步这两份展示副本。

本地启动后可打开 `/art-review/index.html` 查看新版人物在真实游戏里的牵手、拥抱、坐下和睡觉画面，也可由页内链接直接进入室内互动。

阶段 3.2 的 [V3.1 角色历史对比页](character-review.html)仍可在相同 Phaser 室内地图中实时对比新旧人物。主游戏现使用 V3.3 的 40×60 图集，前 16 帧与获认可的 V3.1 行走帧完全相同。

## 结构

| 路径 | 职责 |
| --- | --- |
| `src/App.tsx`、`src/components/HousePreview.tsx` | 首页与动态像素小屋 |
| `src/components/GameScreen.tsx`、`src/style.css` | 游戏 HUD、互动菜单和触控布局 |
| `src/game/HomeScene.ts`、`src/game/createGame.ts` | Phaser 场景、玩家控制、镜头和场景切换 |
| `src/game/maps.ts`、`src/game/collision.ts` | 原有 16×16 地图碰撞格与共享脚部碰撞 |
| `src/game/artCatalog.ts`、`art-source/`、`scripts/prepare_indoor_detailed.py` | 室内样板图层、家具碰撞足迹、美术源图及可复现导出流程 |
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

- 庭院为 44×34 格，室内为 30×24 格；室内床、沙发等碰撞足迹为匹配新样板画面作了局部调整，家具功能与房门位置保留。地图使用小尺寸 PNG 底图与遮挡层。
- 玩家和 NPC 共用 `canStand` 脚部碰撞规则。A* 只规划可站立格；寻路失败或超时会取消动作，NPC 不会用瞬移掩盖普通寻路失败。
- NPC 在纪念树、长椅、花圃、书架、窗边、沙发、床边等锚点间活动，并在每处停留约 11–18 秒。夜晚在室内更倾向床边休息。跟随和牵手在场景切换后保留意图。
- 双人坐下或睡觉时，先分别走到家具外的可行走锚点，再播放进入动画。起身或起床时返回锚点。牵手保持一侧队形，狭窄处改为前后队形；脚部保持最小间距。
- `characterAssets.ts` 载入两张各含 32 帧、单帧 40×60 的透明图集，`characterAnimations.ts` 将动作映射到实际纹理；每个方向有四帧行走，另有坐下、起身、牵手、拥抱、躺下、睡觉、起床和说话姿态。加载失败时使用简化回退精灵。第二套服装槽目前为空。
- 没有接入 AI 对话、账号、云存档、衣柜、日记、相册或管理员后台；进度刷新后不保存。

## 验证边界

自动测试覆盖北京时间、原有碰撞、地图互动锚点、绕障与不可达寻路、状态取消及狭窄处队形。桌面 Chromium 和触控模拟浏览器用于运行交互流程。**实际 iPad Safari 横屏触控仍需人工验收**，尤其是持续按键、系统手势、旋转屏幕后菜单及动画状态。
