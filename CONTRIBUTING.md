# 参与贡献

感谢你愿意为《磐石之旅》出一份力。为了减少来回沟通，动手前请先花两分钟看完这份说明。

## 先选对渠道

| 你想做的事 | 去哪里 |
| --- | --- |
| 报告 Bug | [新建 Bug 报告](https://github.com/CTNStudio/StoneAdventure/issues/new?template=bug_report.yml) |
| 提功能建议、平衡性意见 | [新建功能请求](https://github.com/CTNStudio/StoneAdventure/issues/new?template=feature_request.yml) |
| 提 PR 前想先讨论方案 | [新建讨论 Issue](https://github.com/CTNStudio/StoneAdventure/issues/new) |
| 玩法求助、联机、闲聊 | [QQ 群 860577116](https://qm.qq.com/q/GikRP6ZZio) |

**不要在 Issue 里问安装和玩法问题**，那些去群里问更快；也不要重复提问，先搜索已有 Issue。

## 提交 PR

1. Fork 仓库，从 `main` 拉分支，分支名用 `feat/xxx` 或 `fix/xxx`。
2. 改动尽量聚焦——一个 PR 只做一件事，方便 review。
3. 按 [PR 模板](.github/pull_request_template.md) 填写说明，写清楚改了什么、怎么验证、有没有动美术资源。
4. 提交前自查：
   - 代码风格与现有文件一致；
   - 文本改动同步了 `zh_CN` / `zh_TW` / `en_US` / `ru_RU` 四套语言；
   - 更新了 [changelog.md](changelog.md)；
   - 没有提交第三方受版权保护的资源。

## 关于美术

纹理、模型、音效由工作室美术统一把关。**未经确认的贴图改动可能不会被合并**，即使功能上没问题。想贡献美术，先在 Issue 里附上样张沟通。

## 关于代码

- 脚本位于 `磐石之旅BP/scripts/`，遵循现有模块划分；
- 新增依赖请谨慎，引入第三方库必须保留其 LICENSE 并在 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) 中登记；
- 涉及存档数据的改动，请在 PR 里明确标注兼容性风险。

## 许可

提交 PR 即表示你同意：你的**代码**贡献以 BSD-3-Clause 授权合并；你的**美术**贡献在合并后归星屹工作室所有，用于本项目及其衍生版本。

---

<sub>有任何疑问，欢迎在 Issue 里问。</sub>
