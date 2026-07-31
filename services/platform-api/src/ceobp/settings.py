"""Runtime settings with intentionally small, dependency-free parsing."""

from __future__ import annotations

import os
from dataclasses import dataclass, field

from ceobp import __version__


@dataclass(frozen=True, slots=True)
class Settings:
    service_name: str = "platform-api"
    product_name: str = "CEO-BP 企业经营决策分析平台"
    version: str = __version__
    environment: str = "development"
    build_sha: str = "local"
    static_dir: str = "/app/static"
    kweaver_base_url: str = ""
    kweaver_token: str = field(default="", repr=False)
    kweaver_business_domain: str = "bd_public"
    kweaver_timeout_seconds: float = 10.0
    kweaver_tls_insecure: bool = False
    kweaver_no_auth: bool = False

    def __post_init__(self) -> None:
        if not 0.1 <= self.kweaver_timeout_seconds <= 60:
            raise ValueError("KWeaver timeout must be between 0.1 and 60 seconds")
        if self.kweaver_token and self.kweaver_no_auth:
            raise ValueError("KWeaver token and no-auth mode are mutually exclusive")
        if self.kweaver_base_url and not (self.kweaver_token or self.kweaver_no_auth):
            raise ValueError("Configured KWeaver requires a token or explicit no-auth mode")
        if not self.kweaver_base_url and (self.kweaver_token or self.kweaver_no_auth):
            raise ValueError("KWeaver base URL is required when authentication is configured")
        if self.environment == "production" and (
            self.kweaver_no_auth or self.kweaver_tls_insecure
        ):
            raise ValueError("Production KWeaver requires authentication and TLS verification")

    @property
    def kweaver_configured(self) -> bool:
        return bool(self.kweaver_base_url)

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            environment=os.getenv("CEO_BP_ENV", "development"),
            build_sha=os.getenv("CEO_BP_BUILD_SHA", "local"),
            static_dir=os.getenv("CEO_BP_STATIC_DIR", "/app/static"),
            kweaver_base_url=os.getenv("CEO_BP_KWEAVER_BASE_URL", "").rstrip("/"),
            kweaver_token=os.getenv("CEO_BP_KWEAVER_TOKEN", ""),
            kweaver_business_domain=os.getenv(
                "CEO_BP_KWEAVER_BUSINESS_DOMAIN", "bd_public"
            ),
            kweaver_timeout_seconds=float(
                os.getenv("CEO_BP_KWEAVER_TIMEOUT_SECONDS", "10")
            ),
            kweaver_tls_insecure=_environment_bool("CEO_BP_KWEAVER_TLS_INSECURE"),
            kweaver_no_auth=_environment_bool("CEO_BP_KWEAVER_NO_AUTH"),
        )


def _environment_bool(name: str) -> bool:
    raw = os.getenv(name, "false").strip().lower()
    if raw in {"1", "true", "yes"}:
        return True
    if raw in {"0", "false", "no", ""}:
        return False
    raise ValueError(f"{name} must be a boolean value")
