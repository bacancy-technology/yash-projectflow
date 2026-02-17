"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, sanitizeNextPath } from "@/lib/urls";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = sanitizeNextPath(formData.get("next"), "/dashboard");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(
    `/login?message=Check your email to confirm your account&next=${encodeURIComponent(next)}`
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = sanitizeNextPath(formData.get("next"), "/dashboard");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const safeNext = sanitizeNextPath(next, "/dashboard");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
