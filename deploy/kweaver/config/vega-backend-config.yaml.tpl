server:
  runMode: release
  httpPort: 13014
  language: zh-CN
  readTimeOut: 60
  writeTimeOut: 60
log:
  logLevel: info
  developMode: false
  maxAge: 7
  maxBackups: 3
  maxSize: 20
otel:
  service_name: vega-backend
  environment: development
  otlp_endpoint: unavailable.invalid:4318
  trace:
    enabled: false
    sampling_rate: 0
  log:
    enabled: false
    level: info
crypto:
  enabled: false
  privateKeyPath: ""
  publicKeyPath: ""
depServices:
  rds:
    host: mariadb
    port: 3306
    user: ceobp
    password: __DB_PASSWORD_JSON__
    type: MariaDB
  mq:
    mqType: kafka
    mqHost: redpanda
    mqPort: 9092
    protocol: plaintext
    tenant: ceobp-p2
    auth:
      username: ""
      password: ""
      mechanism: PLAIN
  opensearch:
    host: opensearch
    port: 9200
    protocol: http
    user: ""
    password: ""
  redis:
    connectInfo:
      username: ""
      password: ""
      sentinelHost: ""
      sentinelPort: 0
      sentinelUsername: ""
      sentinelPassword: ""
      masterGroupName: ""
      host: redis
      port: 6379
      masterHost: ""
      masterPort: 0
      slaveHost: ""
      slavePort: 0
    connectType: standalone
  kafka-connect:
    host: unavailable.invalid
    port: 8083
    protocol: http
  mf-model-manager:
    host: unavailable.invalid
    port: 9899
    protocol: http
  mf-model-api:
    host: unavailable.invalid
    port: 9898
    protocol: http
rateLimiting:
  concurrency:
    enabled: true
    global:
      max_concurrent_queries: 4
