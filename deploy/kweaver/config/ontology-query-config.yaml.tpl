server:
  runMode: release
  httpPort: 13018
  language: zh-CN
  readTimeOut: 60
  writeTimeOut: 60
  viewDataTimeout: 30s
  defaultSmallModelEnabled: false
  filteredCrossJoinMaxEdgeExpand: 10000
log:
  logLevel: info
  developMode: false
  maxAge: 7
  maxBackups: 3
  maxSize: 20
otel:
  service_name: ontology-query
  environment: development
  otlp_endpoint: unavailable.invalid:4318
  trace:
    enabled: false
    sampling_rate: 0
  log:
    enabled: false
    level: info
depServices:
  opensearch:
    host: opensearch
    port: 9200
    protocol: http
    user: ""
    password: ""
  bkn-backend:
    host: bkn
    port: 13014
    protocol: http
  uniquery:
    host: unavailable.invalid
    port: 13011
    protocol: http
  vega-backend:
    host: vega
    port: 13014
    protocol: http
  mf-model-manager:
    host: unavailable.invalid
    port: 9899
    protocol: http
  mf-model-api:
    host: unavailable.invalid
    port: 9898
    protocol: http
  agent-operator-integration:
    host: unavailable.invalid
    port: 9000
    protocol: http
