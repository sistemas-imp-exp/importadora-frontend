import type { User } from "../interfaces/auth";

export function getFullName(user: User): string {
  if (!user) return "";
  const { first_name, last_name, username } = user;
  return (first_name || last_name) 
    ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
    : username;
}
