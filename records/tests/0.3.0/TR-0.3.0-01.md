# TR-0.3.0-01：企业控制台首个全栈切片测试报告

- 候选提交：`f10dc710938cf06e6825dd3478a15aea1d7f64aa`
- 应用版本：0.3.0
- 环境：本地 Python 3.12.13/Node 24/Docker；GitHub Actions；121.196.149.55 集成服务器
- 执行日期：2026-07-30
- 结论：Conditional Go（仅限全栈平台状态演示）

## 摘要

企业控制台、聚合总览 API、单镜像静态托管和 9006 升级通过计划内自动化与联合验证。页面读取真实 API，只把平台基础标记为就绪，指标、知识、决策和预测仍明确为规划中。未发现对服务器其他容器名称集的改变。

## 自动化与代码质量

| 检查 | 结果 | 证据摘要 |
|---|---|---|
| 文档校验 | Pass | 49 个 Markdown 文件，内部链接和受控元数据通过 |
| Python Ruff / mypy strict | Pass | 0 问题 |
| Python pytest | Pass | 9/9；109/109 语句，100% 覆盖率 |
| 前端 Biome / TypeScript | Pass | 14 个文件通过；0 类型问题 |
| 前端 Vitest | Pass | 5/5，覆盖 API、真实状态、错误重试和移动导航 |
| 前端覆盖率 | Pass | statements 95.45%，branches 91.07%，functions 94.11%，lines 95.12% |
| 前端生产构建 | Pass | HTML 0.64 kB；CSS 9.89 kB；JS 207.99 kB（gzip 66.46 kB） |
| npm 生产依赖审计 | Pass | 0 个已知漏洞 |
| Compose / Shell / Docker | Pass | 配置、语法、多阶段 `linux/amd64` 构建和受限运行通过 |

GitHub Actions：

- [`ceo-bp-fullstack` run 30536047725](https://github.com/tianqi0514/ceo-bp/actions/runs/30536047725)：success；
- [`ceo-bp-fullstack` run 30536047737](https://github.com/tianqi0514/ceo-bp/actions/runs/30536047737)：success。

## 制品与容器

- 镜像：`ceo-bp/platform-api:0.3.0`；Image ID `sha256:77b43a8ddcd0256f60e5778d4069074285c9b293b62f0070f87f9e8baeb8ee67`；`linux/amd64`；
- 传输归档 SHA-256：`eb8c531497ea82c5a848d055e180778bad93db1101684b8fbb234b14a0bb9d98`，服务器加载后删除；
- 运行身份：`10001:10001`；只读根文件系统；256 MiB；0.75 CPU；128 PID；healthy；
- 集成观测：45.92 MiB / 256 MiB，0.09% CPU，2 PIDs。

## 联合与外部烟雾

| 项目 | 结果 |
|---|---|
| 控制台 `/` | 200，返回 `CEO-BP · 企业经营决策分析平台` HTML |
| 静态 JS | `/assets/index-DlogQ1ok.js` 外部可访问 |
| `/api/v1/overview` | 200，version=0.3.0、environment=demo、build_sha=f10dc710938c |
| 能力状态 | 平台基础 foundation；指标/知识/决策/预测 planned |
| OpenAPI | 版本 0.3.0，包含总览接口 |
| 安全响应头 | CSP、Permissions-Policy、DENY frame、nosniff、no-referrer、Request ID 生效 |
| 主机内顺序烟雾 | 20/20，最大 0.001110 秒 |
| 外部顺序烟雾 | 20/20，最大 0.134864 秒 |
| 共存服务 | 部署前后容器名称列表一致；只重建 `ceo-bp-platform-api-1` |
| 临时文件 | 服务器镜像归档已删除；项目 Git 工作区干净 |

## 偏差与残余风险

1. 本轮未完成独立 Python 漏洞扫描：`pip-audit` 临时工具解析长时间无输出后被中止；运行依赖与 0.2.0 已扫描锁定集合相同，仍需在后续 CI 固化后重新执行；
2. 未执行真实浏览器视觉回归、浏览器矩阵和辅助技术人工测试；组件级交互、响应式状态和容器静态资源已验证；
3. 控制台没有身份、租户和业务数据，9006 仍是公开演示端口；禁止录入敏感或真实经营数据；
4. 服务器重要更新、root 口令登录和 SELinux 关闭风险保持不变；
5. 未执行并发容量、长稳、渗透、灾备或正式业务 UAT。

## 结论

允许 0.3.0 在指定 9006 集成/演示环境持续运行，作为后续前后端共同开发的基础。下一纵向切片为身份/租户上下文；完成后再进入指标中心最小业务闭环。
