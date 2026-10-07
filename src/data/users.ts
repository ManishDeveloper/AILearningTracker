import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export function toAppUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      user.user_metadata?.display_name ??
      user.email?.split("@")[0] ??
      "Learner",
  };
}
