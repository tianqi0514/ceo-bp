"""FastAPI application factory for the CEO-BP platform foundation."""

from __future__ import annotations

import re
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

from ceobp.schemas import (
    Capability,
    CapabilityList,
    HealthResponse,
    ServiceLinks,
    ServiceRoot,
    SystemInfo,
)
from ceobp.settings import Settings

REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")


def _request_id(candidate: str | None) -> str:
    if candidate and REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate
    return str(uuid.uuid4())


def create_app(settings: Settings | None = None) -> FastAPI:
    runtime = settings or Settings.from_environment()
    app = FastAPI(
        title=runtime.product_name,
        summary="企业经营决策分析平台统一 API",
        version=runtime.version,
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
    )
    app.state.settings = runtime

    @app.middleware("http")
    async def request_context(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = _request_id(request.headers.get("X-Request-ID"))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/", response_model=ServiceRoot, tags=["system"])
    async def root() -> ServiceRoot:
        return ServiceRoot(
            product=runtime.product_name,
            service=runtime.service_name,
            version=runtime.version,
            status="foundation",
            links=ServiceLinks(
                openapi="/openapi.json",
                docs="/docs",
                health="/health/ready",
            ),
        )

    @app.get("/health/live", response_model=HealthResponse, tags=["health"])
    async def liveness() -> HealthResponse:
        return HealthResponse(status="ok", service=runtime.service_name, version=runtime.version)

    @app.get("/health/ready", response_model=HealthResponse, tags=["health"])
    async def readiness() -> HealthResponse:
        return HealthResponse(status="ready", service=runtime.service_name, version=runtime.version)

    @app.get("/api/v1/system/info", response_model=SystemInfo, tags=["system"])
    async def system_info() -> SystemInfo:
        return SystemInfo(
            product=runtime.product_name,
            service=runtime.service_name,
            version=runtime.version,
            environment=runtime.environment,
            build_sha=runtime.build_sha,
        )

    @app.get(
        "/api/v1/system/capabilities",
        response_model=CapabilityList,
        tags=["system"],
    )
    async def capabilities() -> CapabilityList:
        return CapabilityList(
            items=[
                Capability(
                    id="platform-foundation",
                    name="平台 API、健康检查与请求追踪",
                    status="foundation",
                    target_phase="P1",
                ),
                Capability(id="metrics", name="指标中心", status="planned", target_phase="P2"),
                Capability(
                    id="knowledge",
                    name="企业知识库",
                    status="planned",
                    target_phase="P3",
                ),
                Capability(
                    id="decisions",
                    name="决策事项与行动复盘",
                    status="planned",
                    target_phase="P3",
                ),
                Capability(
                    id="forecast",
                    name="统计预测与场景模拟",
                    status="planned",
                    target_phase="P4",
                ),
            ]
        )

    return app


app = create_app()
