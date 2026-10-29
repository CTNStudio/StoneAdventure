# stone_star 半透明亮边：怎么让 alpha 真的生效

## 一、先说结论：三层都要对上，缺一层就只会看到"没变"

| 层 | 位置 | 现状 | 备注 |
|---|---|---|---|
| ① 贴图的 alpha | PNG 本身 | **目前是 0 或 255，一个中间值都没有** | 我实测了 `stone_star.png` / `stone_star_heart.png` / 物品图标，全部只有 0 和 255 |
| ② 渲染方式 | BP 方块 `minecraft:material_instances` | 没有显式写 → 默认 `opaque` 或 `alpha_test` | `opaque` 直接忽略 alpha；`alpha_test` 阈值 0.5，中间值会被**切掉**变成透明 |
| ③ 几何厚度 | `geometry.stonecraft.block_item` | 16×16 个 1×1×1 小方块 | 每个像素是一个立方体，半透明后会露出方块侧面和它后面的东西 |

所以只改贴图是没用的——**必须同时把 ② 改成 `blend`**。

## 二、BP 里加这一段（方块路径）

```json
"minecraft:material_instances": {
  "*": {
    "texture": "stonecraft.stone_star",
    "render_method": "blend",
    "face_dimming": false,
    "ambient_occlusion": 0
  }
}
```

- `render_method`：`opaque`（忽略 alpha）/ `alpha_test`（二值抠图）/ **`blend`（真半透明）** / `double_sided`
- **`ambient_occlusion` 在 1.26.20 之后是浮点数 0.0–10.0，不再是布尔**（默认 1.0）。
  写 `false` 会直接报 `* -> ambient_occlusion: invalid numeric value`，整个方块注册失败，
  连带报 `Block couldn't be found in the registry` + `Missing icon for data-driven item`。
  写 `0` 等于彻底关掉 AO。
- `face_dimming: false` —— **这条大概率就是你觉得"周围亮度变化很奇怪"的原因**。
  你的模型每个像素是一个 1×1×1 立方体，开着脸部定向明暗时，同一张贴图正面的小方块和侧面的小方块亮度不同，转头时光影一直在变。关掉之后整片是一个亮度。
- `texture` 用的是 `terrain_texture.json` 里的短名，**不是路径**。我在 `terrain_texture.json` 里补了
  `"stonecraft.stone_star": { "textures": "textures/blocks/items/stone_star" }`，
  之前它是缺的，所以你 `flipbook_textures.json` 里那条 `atlas_tile: "stonecraft.stone_star"` 一直是悬空的（动画没生效）。
- 1.21.80 起 `minecraft:geometry` 和 `minecraft:material_instances` **必须成对出现**，两个都要有。

## 三、贴图：已经做好一份带半透明亮边的

新文件（原文件没动）：

```
textures/blocks/items/stone_star_glow.png    16×224，14 帧
textures/items/treasures/stone_star_glow.png 16×16
```

规则（`make_star_glow.py` 里可改）：只处理**贴着轮廓的那一圈**和它的内邻一圈，
越亮的像素越透，黑描边基本保留，这样形状不会散：

| 灰度 | 环 1 alpha | 环 2 alpha |
|---|---|---|
| 179（最亮的棱） | 100 / 39% | 176 |
| 158（主要亮边） | 112 / 44% | 188 |
| 128 | 124 | 200 |
| 104 | 136 | 212 |
| 79 | 168 | 244 |
| 59 | 180 | 255 |
| 38 | 196 | 255 |
| 0（黑底） | 210 / 82% | 255 |

对照图：`star_glow_compare.png`（每对左边原版、右边半透明版，叠在草地色上）、
`star_glow_icon_compare.png`。

### 切换步骤（顺序别反）

1. 先改 BP：`render_method` → `"blend"`，进游戏确认方块没坏；
2. 再把 `terrain_texture.json` 里 `stonecraft.stone_star` 的路径改成
   `"textures/blocks/items/stone_star_glow"`（同时 `flipbook_textures.json` 里
   `flipbook_texture` 那行也要跟着改，两边必须指向同一个文件）；
3. 进游戏看边缘。

**顺序反了会出问题**：如果还在 `alpha_test`，44% 的亮边会被当成"透明"整条切掉，
星星会小一圈。这也是为什么我没有直接把原贴图覆盖掉。

## 四、顺带修掉的两个真 bug

1. `flipbook_textures.json` 里 `frames` 写了 15 帧（0–14），但
   `textures/blocks/items/stone_star.png` 只有 **16×224 = 14 帧**。
   第 15 帧会越界采样 → 每 15 帧出现一次乱像素。已改成 `[0..13]`。
   如果本意就是 15 帧，把图补成 16×240 再加回来。
2. 上面说的 `terrain_texture.json` 缺 `stonecraft.stone_star`，已补。

## 五、还有几个坑

- **`blend` 的排序**：半透明方块走独立渲染通道、不写深度，叠两层半透明方块或看穿到背面会闪。
  你的模型只有 1 像素厚，问题不大，但别把它叠在其他半透明方块上。
- **mipmap / 图集 padding**：`terrain_texture.json` 现在是 `padding: 8`、`num_mip_levels: 4`。
  远处的 mip 级会把半透明边和透明黑混在一起，边缘发黑。手上拿得很近（mip 0）不受影响；
  要是远处也糊，就把这张图的 alpha 收一点（别低于 ~0.4）或整体降 `num_mip_levels`。
- **背包图标**：方块物品的图标是 3D 模型渲染，所以 `blend` 在背包里也生效（伪动态也在这里体现）。
  如果星星其实是**普通 2D item**（`item_texture.json` 那条被 `/* */` 注释掉了），
  那 2D 图标走的是 alpha_test，半透明在图标上不生效；手持想半透明只能做
  attachable 并把 `materials.default` 设成 `entity_alphablend`。
- **想要更强的效果**：把 `make_star_glow.py` 里 `RING1` 的数值整体下调（比如 158→80），
  或者把 `RING2_ADD` 调大让第二圈更实。别低于 ~70，否则远处 mip 会露黑边。
