"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditAccessDialogProps {
  studentId: string | null;
  editAccessToken: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function EditAccessDialog({ studentId, editAccessToken, onOpenChange, onChanged }: EditAccessDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const url = editAccessToken && typeof window !== "undefined" ? `${window.location.origin}/edit/${editAccessToken}` : null;

  async function generate() {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/edit-access`, { method: "POST" });
      if (!res.ok) throw new Error("Could not generate link");
      onChanged();
    } catch {
      toast.error("Could not generate edit link");
    } finally {
      setIsLoading(false);
    }
  }

  async function revoke() {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/edit-access`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not revoke link");
      toast.success("Edit access revoked");
      onChanged();
      onOpenChange(false);
    } catch {
      toast.error("Could not revoke edit access");
    } finally {
      setIsLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <Dialog open={studentId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Student edit access</DialogTitle>
          <DialogDescription>
            Share this link so the student can update their own Personal and Health Information. It never lets them
            change their batch, payment, or sessions.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy link">
              <Copy className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active edit link for this student yet.</p>
        )}

        <DialogFooter>
          {url && (
            <Button type="button" variant="outline" disabled={isLoading} onClick={revoke}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
              Revoke access
            </Button>
          )}
          <Button type="button" disabled={isLoading} onClick={generate}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {url ? "Generate new link" : "Give edit access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
