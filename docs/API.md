# API conventions

## Success envelope

```json
{ "success": true, "data": {}, "meta": {} }
```

`meta` is optional. A success response without metadata is `{ "success": true, "data": ... }`.

## Error envelope

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message", "details": [] } }
```

`details` is optional and carries validation or field information.

## Health

`GET /api/v1/health` returns HTTP 200:

```json
{ "success": true, "data": { "status": "ok", "db": "connected", "uptime": 1.23, "environment": "development" } }
```

The `db` value is `connected` or `disconnected`; uptime is a number of seconds.
