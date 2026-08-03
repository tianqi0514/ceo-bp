server:
  runMode: release
  httpPort: 13014
  language: zh-CN
  readTimeOut: 60
  writeTimeOut: 60
  maxConcurrentTasks: 2
  viewDataLimit: 1000
  defaultSmallModelName: embedding
  defaultSmallModelEnabled: false
  jobMaxRetryTimes: 1
  reloadJobEnabled: false
  schedulePollInterval: 10
  scheduleLockTimeout: 300
log:
  logLevel: info
  developMode: false
  maxAge: 7
  maxBackups: 3
  maxSize: 20
otel:
  service_name: bkn-backend
  environment: development
  otlp_endpoint: unavailable.invalid:4318
  trace:
    enabled: false
    sampling_rate: 0
  log:
    enabled: false
    level: info
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
  data-model:
    host: unavailable.invalid
    port: 13020
    protocol: http
  uniquery:
    host: unavailable.invalid
    port: 13011
    protocol: http
  mf-model-manager:
    host: unavailable.invalid
    port: 9899
    protocol: http
  mf-model-api:
    host: unavailable.invalid
    port: 9898
    protocol: http
  ontology-query:
    host: ontology-query
    port: 13018
    protocol: http
  vega-backend:
    host: vega
    port: 13014
    protocol: http
  agent-operator-integration:
    host: unavailable.invalid
    port: 9000
    protocol: http
