import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  loading: true,
});
