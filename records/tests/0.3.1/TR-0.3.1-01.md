# TR-0.3.1-01：运行状态控制台去概念化测试报告

- 候选提交：`44c94030a5286f8904096cb189966811aa9dde91`
- 应用版本：0.3.1
- 环境：本地 Python/Node/Docker；GitHub Actions；121.196.149.55 集成服务器
- 执行日期：2026-07-30
- 结论：Go（限运行状态控制台）

## 摘要

控制台已删除未来能力导航、阶段标签、路线图、系统链路和交付理念，只保留实际运行状态及可执行交互。前后端自动化、生产制品、受限容器、9006 原位升级、内外烟雾和共享服务共存检查全部通过。

## 自动化与代码质量

| 检查 | 结果 | 证据摘要 |
|---|---|---|
| 文档校验 | Pass | 57 个 Markdown 文件通过 |
| Python Ruff / mypy strict | Pass | 0 问题 |
| Python pytest | Pass | 9/9；123/123 语句，100% 覆盖率 |
| 前端 Biome / TypeScript | Pass | 0 格式、静态或类型问题 |
| 前端 Vitest | Pass | 5/5；覆盖真实数据、链接、错误重试和重复刷新 |
| 前端覆盖率 | Pass | statements 94.11%，branches 89.70%，functions 100%，lines 95.55% |
| 前端生产构建 | Pass | HTML 0.60 kB；CSS 5.55 kB；JS 201.30 kB（gzip 64.07 kB） |
| Compose / Shell / Docker | Pass | 配置、语法、`linux/amd64` 构建和受限运行通过 |

GitHub Actions：

- [`docs` run 30537387232](https://github.com/tianqi0514/ceo-bp/actions/runs/30537387232)：success；
- [`ceo-bp-fullstack` run 30537387246](https://github.com/tianqi0514/ceo-bp/actions/runs/30537387246)：success。

## 交互与内容验证

| 项目 | 结果 |
|---|---|
| 成功态按钮 | 仅 `刷新状态`；点击后总览 API 调用从 1 次增至 2 次 |
| 错误态按钮 | `重新检查`；再次发起真实请求 |
| 按钮执行态 | 请求期间禁用并显示“正在刷新”，完成后恢复 |
| 链接 | API 文档及 4 个后端返回的真实 endpoint 均有实际目标 |
| 概念内容 | 组件断言不显示规划内容；生产 JS 不含“规划中”“下一个纵向切片”“能力建设状态” |
| 运行数据 | API 返回实例启动时间、服务器时间、运行时长、版本、环境、build SHA 和真实端点 |

## 制品、部署与烟雾

- 镜像：`ceo-bp/platform-api:0.3.1`；Image ID `sha256:a70467eadea3ee934696ccceaadedefbdb933163dfa4e3d9c9895a7b046c4976`；`linux/amd64`；
- 传输归档 SHA-256：`e61151b6723ac2cc6f7826130dcfe2b137c721bc5ff0a11ca9d826f148a11005`，服务器加载后删除；
- GitHub 直连两次失败后，使用 Git 原生完整 bundle fast-forward；bundle SHA-256 `3f14efa2b1e5540537f56754846f9a156dc011ae5151c913a68a2d926fbd433f`，使用后删除；
- 外部与主机内部健康检查各 20/20；HTML、JS、总览和 OpenAPI 均可访问；
- 运行身份 `10001:10001`；只读根文件系统；256 MiB；0.75 CPU；128 PID；healthy；
- 部署前后其他 15 个容器名称一致，只重建 `ceo-bp-platform-api-1`；服务器项目工作区干净。

## 残余风险

1. 未执行真实浏览器视觉回归、跨浏览器和辅助技术人工测试；本轮按当前工作约束使用组件、构建制品和 HTTP 验证；
2. 9006 仍是公开演示端口，禁止输入真实、敏感或受监管数据；
3. 身份、租户和经营业务能力尚未实现，本报告不构成业务 UAT；
4. 服务器补丁、root 口令登录和 SELinux 关闭风险保持不变。

## 结论

0.3.1 可在指定演示环境持续运行。后续任何新页面必须以真实业务任务为入口，并对按钮、链接、菜单和表单逐项验收。
