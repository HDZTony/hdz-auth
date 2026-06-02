# hdz-auth

Fashion、Wormhole 及云端 API **共用**的 Supabase 认证库（独立 Git 仓库）。

## 包结构

| 目录 | 包名 | 用途 |
|------|------|------|
| `ts/` | `@hdz/auth` | Vue Web、Tauri 桌面、UniApp |
| `python/` | `hdz-auth` | FastAPI Depends、JWT 校验、`/api/auth/google-native` |

## 消费方引用

### TypeScript（pnpm / npm）

**本地兄弟目录**（`D:\CODE\fashion` + `D:\CODE\Wormhole` + `D:\CODE\hdz-auth`）：

```json
"@hdz/auth": "file:../../../hdz-auth/ts"
```

**Git 依赖**（GitHub）：

```json
"@hdz/auth": "github:HDZTony/hdz-auth#v0.1.0"
```

或 HTTPS：

```json
"@hdz/auth": "git+https://github.com/HDZTony/hdz-auth.git#v0.1.0"
```

本地开发可用 `file:../../../hdz-auth/ts`。

安装后执行 `pnpm install`。

### Python（uv / pip）

**本地 path**（Fashion `fashion_rec/backend`）：

```toml
dependencies = ["hdz-auth"]

[tool.uv.sources]
hdz-auth = { path = "../../../hdz-auth/python", editable = true }
```

**Git 依赖**：

```toml
[tool.uv.sources]
hdz-auth = { git = "https://github.com/HDZTony/hdz-auth.git", subdirectory = "python", rev = "v0.1.0" }
```

## 开发

```bash
# TypeScript 测试
cd ts && pnpm install && pnpm test

# Python 测试
cd python && uv sync --group dev && uv run pytest
```

## 环境变量

| 变量 | 前端 | Python |
|------|------|--------|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` | ✓ | — |
| `SUPABASE_URL` / `SUPABASE_KEY` | — | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Admin / google-native |

## 版本

遵循 [SemVer](https://semver.org/)。破坏性变更升 major，各应用在 `package.json` / `uv.lock` 中 pin 版本或 tag。

迁移说明见 [MIGRATION.md](./MIGRATION.md)。
