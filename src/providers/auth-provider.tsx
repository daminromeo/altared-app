"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/lib/types/database";

type Profile = Tables<"profiles">;

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string, email?: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else {
        await new Promise((r) => setTimeout(r, 500));
        const { data: retryData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (retryData) {
          setProfile(retryData as Profile);
        } else {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                email: email ?? "",
                subscription_status: "free",
              },
              { onConflict: "id", ignoreDuplicates: true }
            )
            .select("*")
            .single();

          setProfile((newProfile as Profile) ?? null);
        }
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, [supabase]);

  useEffect(() => {
    let initialSessionHandled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Synchronous state updates — Supabase docs warn against await inside this callback
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        return;
      }

      if (event === "INITIAL_SESSION") {
        initialSessionHandled = true;
        if (newSession?.user) {
          // Fire profile fetch in background — do NOT await, do NOT block isLoading on it.
          // Pages depend on authUser (the Supabase user) not profile for data fetching.
          fetchProfile(newSession.user.id, newSession.user.email);
        }
        // Unblock the UI immediately once we know the auth state
        setIsLoading(false);
        return;
      }

      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        newSession?.user
      ) {
        fetchProfile(newSession.user.id, newSession.user.email);
        // Ensure loading is cleared if INITIAL_SESSION previously fired null
        setIsLoading(false);
      }
    });

    // Safety net: if INITIAL_SESSION never fires within 3s, unblock the UI
    const timeout = setTimeout(() => {
      if (!initialSessionHandled) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
