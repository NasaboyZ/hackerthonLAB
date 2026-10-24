export function validateUsername(value: string) { const username = value.trim(); return username.length >= 3 && username.length <= 32 && /^[\p{L}\p{N}_-]+$/u.test(username); }
export function validateEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
export function validatePassword(value: string) { return value.length >= 12; }
