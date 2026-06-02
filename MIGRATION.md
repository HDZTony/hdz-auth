# 迁移说明

## 仓库

- **GitHub：** https://github.com/HDZTony/hdz-auth
- **包名：** `@hdz/auth`（TS）、`hdz-auth` / `hdz_auth`（Python）
- **历史：** 曾用名 `yidea-auth` / `@yidea/auth`

## 目录布局

```
D:/CODE/
├── hdz-auth/      ← 唯一 auth 源码
├── fashion/
└── Wormhole/
```

## TypeScript

```json
"@hdz/auth": "github:HDZTony/hdz-auth#v0.1.0"
```

本地开发：

```json
"@hdz/auth": "file:../../../hdz-auth/ts"
```

## Python (uv)

```toml
dependencies = ["hdz-auth"]

[tool.uv.sources]
hdz-auth = { git = "https://github.com/HDZTony/hdz-auth.git", subdirectory = "python", rev = "v0.1.0" }
```

本地 editable：

```toml
hdz-auth = { path = "../../../hdz-auth/python", editable = true }
```

## Fashion `auth.py`

```python
from hdz_auth.fastapi import create_auth_dependencies
from hdz_auth.router import create_auth_router
```

## 校验

```bash
cd hdz-auth/python && uv run python -m pytest
cd fashion/fashion_rec/backend && uv run python -c "from auth import auth_router; print(auth_router.prefix)"
```
