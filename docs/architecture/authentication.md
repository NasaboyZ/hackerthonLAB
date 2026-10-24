# Authentication

Magnetrail uses ASP.NET Core Identity with Guid-based users in the `identity` schema. Identity owns credentials, password hashing, lockout and the HttpOnly `magnetrail_session` cookie. Players owns the separate `players.profiles` record and receives only an explicit provisioning/read contract from Identity.

The web app uses a same-origin Next.js rewrite from `/api/backend/*` to the local API. Mutating requests obtain an anti-forgery token from `/api/v1/auth/csrf` and send it as `X-CSRF-TOKEN`. No JWT or browser token storage is used.

Registration creates the Identity user, provisions one level-one profile, and signs the user in. If profile provisioning fails, the newly created Identity user is deleted as compensation. This is intentionally kept as an explicit module contract until a shared transaction coordinator is introduced.
