---
name: Auth security config
description: Password hashing library choice — bcrypt is broken, must use sha256_crypt.
---

## Rule
Use `passlib` with `sha256_crypt` scheme. Never switch to bcrypt.

**Why:** The bcrypt version installed on this repl has a conflict that causes runtime errors. `sha256_crypt` from passlib is a secure alternative that works. Located in `Backend/app/core/security.py`.

**How to apply:** If auth breaks and someone suggests switching to bcrypt, refuse. The fix is always within sha256_crypt usage.
