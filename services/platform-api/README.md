# platform-api

CEO-BP 的 Python 控制面和经营业务面入口。当前 v0.2.0 只实现可部署的平台基础、健康检查、请求追踪和能力清单，不连接数据库，也不包含伪造业务数据。

## 本地开发

```bash
uv sync --frozen
uv run ruff check .
uv run mypy
uv run pytest
uv run uvicorn ceobp.main:app --reload
```

接口：

- `GET /`：服务入口；
- `GET /health/live`：进程存活；
- `GET /health/ready`：依赖就绪；
- `GET /api/v1/system/info`：非敏感构建信息；
- `GET /api/v1/system/capabilities`：平台能力实施状态；
- `GET /docs`：OpenAPI UI。

业务模块将在后续纵向切片中加入，并遵守端口与适配器边界。
