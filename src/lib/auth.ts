import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  getAdminEmails,
  hasSupabaseAdminCredentials,
  isSupabaseConfigured,
} from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, ViewerSession } from "@/lib/types";

type ClientSession = ViewerSession & { user: Profile & { role: "client" } };
type AdminSession = ViewerSession & { user: Profile & { role: "admin" } };

async function syncAdminRoleIfNeeded(
  user: User,
  currentRole: Profile["role"] | null | undefined,
) {
  const email = user.email?.toLowerCase();

  if (
    !email ||
    currentRole === "admin" ||
    !getAdminEmails().includes(email) ||
    !hasSupabaseAdminCredentials()
  ) {
    return currentRole ?? "client";
  }

  try {
    const adminClient = getSupabaseAdminClient();
    const { error } = await adminClient
      .from("profiles")
      .update({
        role: "admin",
        email: user.email ?? "",
        display_name:
          user.user_metadata.full_name ??
          user.user_metadata.name ??
          "Clinic Admin",
        avatar_url: user.user_metadata.avatar_url ?? null,
      })
      .eq("id", user.id);

    if (!error) {
      return "admin";
    }
  } catch {
    // Ignore bootstrap failures and continue with the current role.
  }

  return currentRole ?? "client";
}

export async function getViewerSession(): Promise<ViewerSession> {
  if (!isSupabaseConfigured()) {
    return { mode: "anonymous", user: null, needsPhone: false };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { mode: "anonymous", user: null, needsPhone: false };
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, display_name, phone, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const role = await syncAdminRoleIfNeeded(user, profileData?.role);

    const profile: Profile = {
      id: user.id,
      email: profileData?.email ?? user.email ?? "client@webappzzclinic.app",
      displayName:
        profileData?.display_name ??
        user.user_metadata.full_name ??
        user.user_metadata.name ??
        "Clinic Client",
      phone: profileData?.phone ?? null,
      role,
      avatarUrl: profileData?.avatar_url ?? null,
    };

    return {
      mode: "supabase",
      user: profile,
      needsPhone: !profile.phone,
    };
  } catch {
    return { mode: "anonymous", user: null, needsPhone: false };
  }
}

export async function requireClient(nextPath: string): Promise<ClientSession> {
  const session = await getViewerSession();

  if (!session.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (session.user.role !== "client") {
    redirect("/admin");
  }

  return session as ClientSession;
}

export async function requireAdmin(nextPath: string): Promise<AdminSession> {
  const session = await getViewerSession();

  if (!session.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session as AdminSession;
}
