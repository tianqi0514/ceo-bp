# 9006 演示环境部署手册

| 属性 | 值 |
|---|---|
| 文档编号 | ENV-001 |
| 版本 | 0.2.0 |
| 状态 | Baseline |
| 生效日期 | 2026-07-30 |
| 责任角色 | 运维负责人 |

## 1. 范围

本手册适用于 CEO-BP 首个集成/演示环境：

- 主机：`121.196.149.55`；
- 项目目录：`/home/tianqi/ceo-bp`；
- 唯一新增对外端口：`9006/tcp`；
- Compose 项目：`ceo-bp`；
- 网络：`ceo-bp-net`；
- 首期服务：`platform-api` 一个容器；
- 首期不新增 PostgreSQL、Redis、Milvus、Nginx 或系统级 Python 包。

严禁修改 `/home/tianqi/aidp` 或服务器其他现有项目、容器、Nginx、数据库和端口。

## 2. 隔离与资源限制

`platform-api` 使用独立镜像和网络，文件系统只读，丢弃全部 Linux Capabilities，启用 `no-new-privileges`，限制为：

- 内存：256 MiB；
- CPU：0.75 核；
- PID：128；
- 临时目录：16 MiB tmpfs；
- 无数据库和持久卷。

部署前脚本检查 Docker、Compose、9006 占用和可用内存；发现端口被其他服务占用或可用内存低于 512 MiB时直接停止。

## 3. 部署

代码必须从受控 Git 分支/提交取得：

```bash
cd /home/tianqi/ceo-bp
CEO_BP_PORT=9006 ./deploy/scripts/deploy-demo.sh /home/tianqi/ceo-bp
```

部署脚本只构建并更新 Compose 项目 `ceo-bp` 的 `platform-api`，不执行 `docker compose down`，不清理其他镜像、网络或卷。

## 4. 验证

主机内验证：

```bash
curl --fail http://127.0.0.1:9006/health/live
curl --fail http://127.0.0.1:9006/health/ready
curl --fail http://127.0.0.1:9006/api/v1/system/info
docker compose -p ceo-bp -f deploy/compose/compose.demo.yml ps
```

外部验证：

```bash
curl --fail http://121.196.149.55:9006/health/ready
```

同时复查服务器原有监听端口和容器状态，确认没有被重启或替换。

## 5. 回滚

应用回滚使用上一个 Git 提交和对应镜像重新执行同一 Compose 项目；若首版需要完全停止，只停止本项目服务：

```bash
docker compose -p ceo-bp -f /home/tianqi/ceo-bp/deploy/compose/compose.demo.yml stop platform-api
```

禁止使用全局 Docker 清理命令。首版没有持久数据，因此无需数据迁移回滚。

## 6. 安全待办

服务器当前仍存在待评估的重要安全更新，并使用 root 口令登录。更新系统包或调整 SSH 会影响共享主机，不在本次应用部署授权范围内；应单独安排维护窗口，先验证备份和回滚，再完成补丁、密钥登录、口令轮换和最小权限运维账号配置。
