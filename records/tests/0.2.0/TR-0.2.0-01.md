# TR-0.2.0-01：平台基础与 9006 部署测试报告

- 候选提交：`87863ef858928827dd02acec40146f97d8123e5e`
- 应用版本：0.2.0
- 环境：本地 Python 3.12.13/Docker；121.196.149.55 集成服务器
- 执行日期：2026-07-30
- 结论：Conditional Go（仅限平台基础演示）

## 摘要

平台基础代码、容器和 9006 部署通过计划内验证。未发现对服务器现有容器的变更。当前没有身份、业务数据和经营分析功能，因此不能作为产品或业务验收版本。

## 自动化与代码质量

| 检查 | 结果 | 证据摘要 |
|---|---|---|
| 文档校验 | Pass | 44 个 Markdown 文件，内部链接和受控元数据通过 |
| Ruff | Pass | 0 问题 |
| mypy strict | Pass | 4 个源文件，0 问题 |
| pytest | Pass | 6/6 |
| 覆盖率 | Pass | 90/90 语句，100%；门槛 95% |
| Compose 配置 | Pass | `docker compose config --quiet` |
| Shell 语法 | Pass | 两个部署脚本 `bash -n` |

GitHub Actions：

- [`docs` run 30532475601](https://github.com/tianqi0514/ceo-bp/actions/runs/30532475601)：success；
- [`platform-api` run 30532475606](https://github.com/tianqi0514/ceo-bp/actions/runs/30532475606)：success，包含测试和镜像构建。

## 供应链与容器

- 初次已安装环境扫描发现 `pytest 8.4.2 / PYSEC-2026-1845`，已升级到 9.1.1；
- 升级后扫描：No known vulnerabilities found；
- 首次按导出 requirements 建临时审计环境因审计工具未识别刚发布的 `annotated-doc 0.0.5` 而失败，该次不计为安全通过；
- Python 基础镜像固定到 `sha256:519591d6871b7bc437060736b9f7456b8731f1499a57e22e6c285135ae657bf7`；
- 应用 Image ID：`sha256:8a677536cab0fd6a258ae02869fb9eb78f8cd6b556ace70722034ab10b30f592`，`linux/amd64`；
- 运行检查：用户 `10001:10001`、只读根文件系统、256 MiB、0.75 CPU、128 PID、healthy。

## 集成与外部烟雾

| 项目 | 结果 |
|---|---|
| `/health/live` | 200 / ok |
| `/health/ready` | 200 / ready |
| `/api/v1/system/info` | 200，environment=demo，build_sha=87863ef85892 |
| OpenAPI | 3.1.0，版本 0.2.0 |
| 安全响应头 | Request ID、nosniff、DENY frame、no-referrer、no-store 均存在 |
| 外部顺序烟雾 | 20/20 成功，观测最大 0.074634 秒 |
| 容器资源 | 约 40.85 MiB / 256 MiB，1 PID |
| 现有容器隔离 | 部署前后排除 CEO-BP 的名称集 SHA-256 完全一致 |
| firewalld | 未修改；9006 可从外部访问 |

## 偏差与残余风险

1. 服务器 Docker Hub 拉取固定层停滞超过 107 秒后取消，改用本地已验证镜像传输；归档 SHA-256 校验通过，加载后删除；
2. 服务器仍有重要安全更新、root 口令登录和 SELinux 关闭风险，未在共享主机上擅自整改；
3. 9006 当前公开提供健康、系统信息和 OpenAPI；加入任何业务数据前必须完成身份认证、授权和暴露面复审；
4. 未做并发容量、长稳、渗透、灾备和业务 UAT。

## 结论

建议允许 0.2.0 在指定 9006 集成/演示环境持续运行，用于后续开发联调；不批准生产或业务使用。下一阶段首先实现身份/租户上下文与指标中心最小纵向切片。
