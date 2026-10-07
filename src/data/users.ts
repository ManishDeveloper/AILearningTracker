export interface User {
  username: string;
  password: string;
  displayName: string;
}

// Client-side only: fine for a friends' tracker, not real security.
export const USERS: User[] = [
  { username: "alice", password: "alice123", displayName: "Alice" },
  { username: "bob", password: "bob123", displayName: "Bob" },
  { username: "carol", password: "carol123", displayName: "Carol" },
  { username: "dave", password: "dave123", displayName: "Dave" },
];

export function authenticate(username: string, password: string): User | null {
  const user = USERS.find((u) => u.username === username.trim().toLowerCase());
  return user && user.password === password ? user : null;
}
