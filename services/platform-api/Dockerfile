FROM node:22.20.0-alpine3.22@sha256:dbcedd8aeab47fbc0f4dd4bffa55b7c3c729a707875968d467aaaea42d6225af AS console-builder

WORKDIR /console
COPY apps/console/package.json apps/console/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/console/ ./
RUN npm run build

FROM python:3.12.11-slim-bookworm@sha256:519591d6871b7bc437060736b9f7456b8731f1499a57e22e6c285135ae657bf7

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

RUN groupadd --gid 10001 ceobp \
    && useradd --uid 10001 --gid ceobp --no-create-home --shell /usr/sbin/nologin ceobp

COPY services/platform-api/requirements.txt ./requirements.txt
RUN apt-get update \
    && apt-get install --yes --no-install-recommends git \
    && pip install --no-cache-dir --requirement requirements.txt \
    && apt-get purge --yes --auto-remove git \
    && rm -rf /var/lib/apt/lists/*

COPY services/platform-api/src ./src
COPY --from=console-builder /console/dist ./static
ENV PYTHONPATH=/app/src

USER 10001:10001
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/ready', timeout=2)"]

CMD ["uvicorn", "ceobp.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
