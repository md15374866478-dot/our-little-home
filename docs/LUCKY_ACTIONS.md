# Lucky 协同动作验收

本分支 `feat/lucky-actions-trio` 基于 Lucky 集成 PR #5，保留默认人物、房间、庭院、16 px 世界坐标、碰撞及 Retina 渲染。不要合并 main 或发布 GitHub Pages，先人工验收。

## 运行与权限

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev -- --port 4180
```

普通生产构建中的「我们三个一起睡觉」及控制器入口均禁用；本地开发可测试。仅在**宿主已强制限制为本人访问**的独立验收站构建时启用 `VITE_OWNER_PRIVATE_PREVIEW=1`。这个编译开关不是身份验证，不能将带此开关的输出放到公开站。原 `.openai/hosting.json` 和 GitHub Pages 工作流保持原样；独立验收站在单独 checkout 保存自己的 Site ID，未改变原站访问权限。

`/?preview=home` 直接进入真实室内地图，仍需点「进入小屋」。点床或「与门都互动」选择三人睡觉；宠物菜单支持两个人分别抱起/抚摸、放下、玩球、回窝和叫醒。方向键可中止受控动作，已有方向键触控不变。

## 动画与资源

新增 PNG 均透明、最近邻采样，在预加载时一次性创建，不逐帧创建纹理。原始生成图保存在 `art-source/coordinated`，打包器 `scripts/prepare_coordinated.py` 需要 Python Pillow、NumPy、SciPy，只在重新整理素材时运行，游戏启动和构建不依赖 Python。

| 文件（src/assets/coordinated） | 尺寸 | 帧与用途 |
| --- | --- | --- |
| mashuo-pet.png / mendu-pet.png | 320×240 | 各 32 帧，40×60；前16为四向弯腰、抬起、抱持、蹲下触摸；后16为四向抱持步态 |
| mashuo-arms.png / mendu-arms.png | 320×240 | 同步32帧，仅前景手臂与手掌，身体在狗后、手在狗前 |
| lucky-performance.png | 320×280 | 56帧，40×40；0–3四向托抱，4–7低头咬球，8–15趴卧/蜷缩/睁眼/伸展/站起，16–31起跳/腾空/着地/钻被/醒来，32–47四向摸头反应，48–51正面躺卧与闭眼，52–55四向怀抱眨眼/尾部变化 |
| quilt-center.png | 32×62 | 被子中部独立网格，局部抬起和呼吸，不改变房间或整床尺寸 |
| kennel-back.png / kennel-cushion.png | 138×90 | 后框与床垫；沿用已有独立前沿图，显示范围仍为46×30世界单位 |

现有 Lucky 48 帧默认图集、马硕/门都默认40×60图集和两人睡觉图集保留。新增素材是根据现有图集制作的 AI 辅助动作验收版本，并非声称已经逐帧完成真人/真实 Lucky 照片还原；本工作区没有原始照片可比对。较少的关键姿势配合连续场景运动，仍需检查手掌接触、发型衔接和转向一致性。没有旋转/压扁站姿代替睡姿。

## 职责与互斥

- `ActionScope`：所有新定时动作/补间可取消，旧 promise 总会结算，旧阶段不能提交。
- `PetActionDirector`：抱起/放下、抚摸、取球和狗窝睡眠；统一释放旧动作与恢复碰撞、人体动画、控制权。
- `HumanPetAnimator`：独立姿势图与前景手掌，四向逐帧怀抱锚点；未改原人物日常动画。
- `BallAttachment`：球的地面/抛物线/嘴部状态、帧锚点、前后层次和阴影，放球后实体保留可点击。
- `TrioSleepController` + `TrioState`：返家→两人入床→Lucky醒来/接近→起跳/落地→爬入被子→三人睡眠→Lucky先离床→两人起床。利用已有 BedController，两人的睡眠状态仍独立。
- 新增三层 Lucky 渲染：被子下真实身体、被沿外仍可见身体、上沿探出的躺卧头部；遮罩随钻入过程展开，局部被子网格随阶段抬起。不是整只狗隐藏后换位置。
- `petNavigation` 在共享地图的 A* 上增加实时人物间距；`findPath` 的可选净空检查覆盖路径段，避免偏离网格的人物导致擦碰。普通人物导航保持原行为。
- 场景切换销毁遮罩、道具与控制锁；三人从庭院返回先全部走到入口，再使用原来的淡出/淡入。

## 真实场景自动检查

```sh
# 另一个终端启动上述 Vite
npx playwright install chromium ffmpeg # 首次需要；或使用系统 Chromium
CHROMIUM_PATH=/usr/bin/chromium node scripts/qa-lucky-actions.cjs
```

脚本使用真实 Phaser 场景，保存截图、连续录像和结果 JSON 到 `/tmp/lucky-actions-qa`。没有改造测试专用地图，也没有用传送跳过寻路。检查包括两人抚摸/抱持、四向抱持移动、咬球和放球、狗窝遮挡、三人流程、取消恢复、原房门往返以及牵手/拥抱/沙发回归。仅开发模式暴露的场景引用用于观察阶段及调用与菜单相同的方法，公开生产构建不暴露它。

## 仍需人工检查

真实 iPad Safari 横屏（含 Retina 清晰度、触控不滚动、菜单不压住方向键、尺寸变化、长时间帧率）；新动作手掌/宠物身体接触的自然程度；全部姿势与原角色照片的一致性。Chromium 的触控/DPR 模拟不能证明 Safari 已通过。

## 本轮验证结果

- TypeScript 类型检查与生产构建通过；38 项单元测试通过。
- `qa-lucky-actions.cjs` 的9组真实场景检查全部通过，未捕获浏览器运行异常；连续录像约3分25秒。截图时仅暂停实际场景取帧，再继续执行，没有重新摆放角色。
- 独立 Chromium 1194×834、DPR 2 验证：Canvas backing width 2300 / CSS width 1150、镜头物理缩放3；触控方向键可移动，页面scrollY保持0；睡眠期间改为1024×768后状态保留并正常起床。
- 普通生产构建验证：两个三人睡眠入口禁用，无开发调试桥。
- 真实 iPad Safari、长期设备帧率与新动作的美术自然程度仍待本人验收。

实机截图、录像与可下载图集位于 `public/lucky-actions-review/`，验收页公开编译也只能展示素材和链接，三人睡眠仍由游戏入口的私有构建开关与宿主所有者访问控制共同限制。
