# Redis storage

Document defining what's stored in redis ephemeral storage.

## Sessions

Key                                 | Type | Value
------------------------------------|------|--------------------
`session_<Facebook Refresh Token>`  | HASH | `accessToken:<Facebook Access Token>, fbUserId:<Facebook User Id>`
