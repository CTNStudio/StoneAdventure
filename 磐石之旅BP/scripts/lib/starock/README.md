# Star Tenon API（第三方依赖）

Occultus SDK · Star Tenon API，本包引入的预编译产物。

| 项 | 内容 |
| --- | --- |
| 包名 | `@occultus/api` v0.31.0（API Level 12.1） |
| 作者 | CTN Studios（贡献者：FangLimao） |
| 协议 | MIT License —— Copyright © 2025 CTN Studios |
| 源码 | https://codeberg.org/TeamOccultus/StarTenonAPI |
| 上游文件 | 仓库 `starock/script/api.js`（作者自行构建的产物） |

## 本目录内容

- `api.js` —— 上游预编译产物，逻辑未改动；仅在文件顶部添加了版权/协议标注。
- `LICENSE` —— 上游 MIT 许可全文。
- `index.js` —— 本项目的转发入口，供 `scripts/` 下其他脚本导入。

## 使用

```js
import { StarTenon } from "../lib/starock/index.js";
console.info(StarTenon.version);
```

## 构建说明（上游）

上游用 esbuild 把所有 `@occultus/*` 依赖递归打包进单文件，并保留
`@minecraft/server` 与 `@minecraft/server-ui` 为外部依赖 ——
因此本包无需构建步骤，且这两个模块已在本包 manifest 的 dependencies 中声明。
