# Player profiles

The Players module owns `players.profiles`. A profile is keyed by the Identity user's Guid and starts at level 1. The public profile API permits only username changes; level, ownership and timestamps are server-controlled.

Usernames are trimmed, 3–32 characters long, restricted to letters, digits, `_` and `-`, and protected by a case-insensitive database index.
