export type CurrentUser = { id: string; email: string; username: string; level: number };
export type RegisterInput = { email: string; username: string; password: string; confirmPassword: string };
export type LoginInput = { email: string; password: string };
