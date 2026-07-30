# REL-0.2.0：平台基础演示部署

- 版本：0.2.0
- 源提交：`87863ef858928827dd02acec40146f97d8123e5e`
- 环境：121.196.149.55:9006
- 发布窗口：2026-07-30 17:54—18:02 CST
- 状态：Deployed（demo only）
- 发布角色：Codex 执行；项目负责人待复核

## 制品

| 制品 | 标识 | 说明 |
|---|---|---|
| 源码 | `87863ef858928827dd02acec40146f97d8123e5e` | GitHub 分支 `codex/p1-platform-skeleton` |
| 镜像 | `ceo-bp/platform-api:0.2.0` | Image ID `sha256:8a677536cab0fd6a258ae02869fb9eb78f8cd6b556ace70722034ab10b30f592` |
| 传输归档 | SHA-256 `595948f1c848e3a750e283b53352c3235971d0636aee22f0538ca82ffe96e7d8` | 加载后已删除 |
| 基础镜像 | `python:3.12.11-slim-bookworm` + 固定 OCI 摘要 | `sha256:519591...657bf7` |

## 门禁

- 测试：[TR-0.2.0-01](../tests/0.2.0/TR-0.2.0-01.md)，Conditional Go；
- 环境：[ENV-2026-0001](../environments/ENV-2026-0001.md)；
- CI：文档和平台 API 均 success；
- 数据迁移：N/A，本版本无数据库；
- 业务 UAT：N/A，本版本无业务功能；
- 安全：运行依赖/开发环境已知漏洞扫描无发现；主机风险保留。

## 实际执行

1. 确认目标目录不存在、9006 空闲、可用内存约 2.6 GiB；
2. 从 GitHub 克隆精确分支并核对提交；
3. 预检通过；服务器直接构建因 Docker Hub 层停滞取消，未启动容器；
4. 从受信任本地 `linux/amd64` 构建，传输并核验归档后 `docker load`；
5. 以独立 Compose 项目/网络和 `--no-build` 启动；
6. 完成健康、契约、外部烟雾、资源和共存检查；
7. 删除临时镜像归档。

## 回滚

本版本无持久数据。若需回滚，执行：

```bash
docker compose -p ceo-bp -f /home/tianqi/ceo-bp/deploy/compose/compose.demo.yml stop platform-api
```

只停止 CEO-BP 容器，不操作其他容器、镜像、网络或卷。

## 结论

部署成功并保持运行。允许用于开发联调和平台基础演示，不构成产品上线批准。
