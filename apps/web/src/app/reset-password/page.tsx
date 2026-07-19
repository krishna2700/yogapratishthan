"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/form/field-wrapper";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not reset password");
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Centered>
        <p className="text-sm font-medium text-foreground">This link is missing its token.</p>
        <p className="text-sm text-muted-foreground">Request a new password reset from the login page.</p>
      </Centered>
    );
  }

  if (done) {
    return (
      <Centered>
        <CheckCircle2 className="size-8 text-primary" />
        <p className="text-sm font-medium text-foreground">Password changed</p>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </Centered>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-1 text-center">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">Yogapratishthan</p>
        <h1 className="text-lg font-semibold text-foreground">Set a new password</h1>
      </div>
      <FieldWrapper htmlFor="password" label="New password" error={error ?? undefined}>
        <Input id="password" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
      </FieldWrapper>
      <FieldWrapper htmlFor="confirmPassword" label="Confirm new password">
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </FieldWrapper>
      <Button type="submit" disabled={isSubmitting || !password || !confirmPassword} className="w-full">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Set password
      </Button>
    </form>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-6 text-center shadow-sm">
      {children}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
