# KWeaver Core 补丁清单

适用上游：`kweaver-ai/kweaver-core@b9b35fb245c31660127114c883e91165b42dc8f0`。

| 补丁 | 服务 | 原因 | 回归证据 |
|---|---|---|---|
| `vega-allow-keyword-on-text.patch` | Vega | OpenSearch 映射已支持 text 的 keyword 子字段，但请求校验错误拒绝 BKN 初始化模型 | `I18N_MODE_UT=true go test ./driveradapters -run Test_Validate_DatasetRequest -count=1` |
| `bkn-unique-concept-schema.patch` | BKN | 初始化模型重复定义 `data_properties.index_config`，并把 `unit_type` 显示名误写为 `schedule` | `I18N_MODE_UT=true go test ./interfaces -run TestGetBKNConceptSchemaDefinitionHasUniqueFieldNames -count=1` |

补丁由 `deploy/scripts/build-kweaver-images.sh` 在 Docker 构建上下文内应用。构建脚本校验上游提交；任何补丁无法应用时构建必须失败。禁止直接修改本地共享 KWeaver Core 检出目录。

升级上游时依次执行：检查上游是否已包含等价修复、对新提交执行 `git apply --check`、运行补丁回归测试、构建三个服务镜像、执行 P2 创建/查询/重启持久化烟雾测试。确认上游已修复后删除对应补丁并保留 ADR 与测试记录。
