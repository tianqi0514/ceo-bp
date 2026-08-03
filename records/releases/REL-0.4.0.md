# REL-0.4.0：经营方案加权决策分析发布

- 版本：0.4.0
- 源提交：`d9ec18cb5909e4b6e546fd6fc0165ac433f2f9c4`
- 环境：121.196.149.55:9006
- 发布窗口：2026-07-31 10:39—10:43 CST
- 状态：Deployed（demo only）
- 发布角色：Codex 执行；项目负责人待复核

## 发布内容

- 产品首页由运维状态改为经营方案比较工作台；
- 新增维度、权重、方向、备选方案和评分编辑；
- 新增 `POST /api/v1/decisions/analyze`；
- 新增归一化加权排序、成本型换算、短板和权重敏感性分析；
- 新增结果排名、差距、计算明细、稳定性和边界说明；
- 健康和系统接口继续存在，仅供运维和监控使用。

## 门禁与制品

- 测试：[TR-0.4.0-01](../tests/0.4.0/TR-0.4.0-01.md)，Go；
- 技术验收：[UAT-0.4.0-01](../acceptance/0.4.0/UAT-0.4.0-01.md)，Accepted；
- CI：候选提交 `docs` 与 `ceo-bp-fullstack` 均 success；
- 镜像：`ceo-bp/platform-api:0.4.0`；Image ID `sha256:6daeafd80d6b2f776479174a280ddd236d8a75d2d988f4080036514599e3dc50`；
- 数据迁移：N/A，本版本不保存用户数据；
- 回滚镜像：`ceo-bp/platform-api:0.3.1` 保留在服务器。

## 实际执行

1. 部署前确认 9006 归属、项目工作区、资源和其他容器清单；
2. 校验 Git bundle、镜像归档和 Image ID，将仓库 fast-forward 到候选提交；
3. 使用离线模式只重建 Compose 项目 `ceo-bp` 的 `platform-api`；
4. 验证 HTML、生产 JS、系统信息、决策分析、非法输入、OpenAPI、内外烟雾和运行限制；
5. 确认其他 15 个容器保持运行，删除服务器临时传输文件。

## 回滚

本版本无持久数据。需要回滚时指定 `CEO_BP_VERSION=0.3.1`、`CEO_BP_SKIP_BUILD=1` 和 0.3.1 build SHA，使用同一部署脚本只重建 `platform-api`。禁止执行 Compose 全项目 down 或全局 Docker 清理。

## 结论

发布成功并保持 healthy。0.4.0 是面向决策用户的首个功能版本，不构成生产上线或完整业务 UAT。
