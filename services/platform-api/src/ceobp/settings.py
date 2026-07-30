"""Runtime settings with intentionally small, dependency-free parsing."""

from __future__ import annotations

import os
from dataclasses import dataclass

from ceobp import __version__


@dataclass(frozen=True, slots=True)
class Settings:
    service_name: str = "platform-api"
    product_name: str = "CEO-BP 企业经营决策分析平台"
    version: str = __version__
    environment: str = "development"
    build_sha: str = "local"
    static_dir: str = "/app/static"

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            environment=os.getenv("CEO_BP_ENV", "development"),
            build_sha=os.getenv("CEO_BP_BUILD_SHA", "local"),
            static_dir=os.getenv("CEO_BP_STATIC_DIR", "/app/static"),
        )
