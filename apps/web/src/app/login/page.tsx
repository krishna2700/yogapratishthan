"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/form/field-wrapper";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleForgotPassword() {
    setIsSendingReset(true);
    try {
      await fetch("/api/auth/request-password-reset", { method: "POST" });
      setResetSent(true);
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Incorrect password");
      }
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1 text-center">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">Yogapratishthan</p>
          <h1 className="text-lg font-semibold text-foreground">Admin sign in</h1>
        </div>
        <FieldWrapper htmlFor="password" label="Password" error={error ?? undefined}>
          <Input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FieldWrapper>
        <Button type="submit" disabled={isSubmitting || !password} className="w-full">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Sign in
        </Button>

        {resetSent ? (
          <p className="text-center text-xs text-muted-foreground">
            If email is configured, a reset link was sent — check the inbox this app is set up to notify.
          </p>
        ) : (
          <button
            type="button"
            disabled={isSendingReset}
            onClick={handleForgotPassword}
            className="text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          >
            {isSendingReset ? "Sending…" : "Forgot password?"}
          </button>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
