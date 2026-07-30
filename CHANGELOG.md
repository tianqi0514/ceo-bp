# 变更日志

本文件记录对用户、开发者和运维人员可感知的重要变更，格式参考 Keep a Changelog，版本遵循语义化版本。

## [Unreleased]

### Added

- 新增 React/TypeScript 企业经营控制台，展示后端提供的真实平台状态和能力路线；
- 新增前端加载、错误重试、响应式导航、组件/API 测试和覆盖率门禁；
- 新增聚合总览接口 `/api/v1/overview`，并由 FastAPI 托管同版本前端制品；
- 新增前后端纵向切片 ADR 和统一完成定义；
- 新增 Python/FastAPI `platform-api` 最小可部署骨架；
- 新增存活、就绪、系统信息、能力状态和 OpenAPI 接口；
- 新增请求 ID 和基础响应安全头；
- 新增锁定依赖、严格类型/lint、95% 覆盖率门禁和代码 CI；
- 新增资源受限、只读文件系统、无 Linux Capabilities 的独立演示部署；
- 新增 121.196.149.55:9006 环境基线、P0 上游准入矩阵和风险台账。

### Changed

- 演示镜像改为多阶段构建，在同一非 root、只读容器中交付前端和 API；
- CI 和本地 `make verify` 同时校验前端与后端；
- 文档校验忽略虚拟环境、依赖和工具缓存中的第三方 Markdown。

## [0.1.0] - 2026-07-30

### Added

- 建立 CEO-BP 项目开发备忘录与文档控制基线；
- 确定“Python 控制/业务面 + 复用 Go 核心数据面”的渐进式重构路线；
- 建立产品范围、目标架构、迁移策略和首批 ADR；
- 建立需求、开发、测试、发布、验收、运维和安全流程；
- 建立版本、测试、验收、风险和决策记录目录及模板；
- 增加本地文档完整性校验工具。

[Unreleased]: https://github.com/tianqi0514/ceo-bp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tianqi0514/ceo-bp/releases/tag/v0.1.0
