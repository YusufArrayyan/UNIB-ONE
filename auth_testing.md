# UNIB ONE Auth Testing

JWT auth with Bearer token (localStorage `unib_token`). Login returns `{token, user}`.

## API test
```
curl -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"m.yusuf.24009@student.unib.ac.id","password":"unibone2026"}'
# returns {token, user}
TOKEN=... ; curl http://localhost:8001/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Roles: super_admin, admin_bpu, admin_internal. bcrypt hashes ($2b$). Users seeded on startup, password kept in sync with env for owner.
