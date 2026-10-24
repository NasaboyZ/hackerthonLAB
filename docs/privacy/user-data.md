# User data and ownership

Authentication uses an HttpOnly server cookie. Passwords are handled only by ASP.NET Core Identity and are never returned by the API or logged.

Private Places endpoints derive the owner from the authenticated claim. The client cannot submit an owner id. Unknown or foreign resource ids return `404`. The public map and verified regulation endpoints do not require authentication.
