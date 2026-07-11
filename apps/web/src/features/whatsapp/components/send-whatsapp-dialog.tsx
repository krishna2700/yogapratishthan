"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WHATSAPP_TEMPLATES, toWhatsAppLink } from "../lib/templates";

export interface WhatsAppTarget {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  whatsappNumber?: string | null;
}

interface SendWhatsAppDialogProps {
  student: WhatsAppTarget | null;
  remaining?: number;
  defaultTemplate?: string;
  onOpenChange: (open: boolean) => void;
}

export function SendWhatsAppDialog({ student, remaining, defaultTemplate, onOpenChange }: SendWhatsAppDialogProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!student) return;
    const template = WHATSAPP_TEMPLATES.find((t) => t.label === defaultTemplate) ?? WHATSAPP_TEMPLATES[0]!;
    setMessage(template.build({ firstName: student.firstName, remaining }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const phone = student ? student.whatsappNumber || student.mobileNumber : "";

  function handleSend() {
    if (!student) return;
    window.open(toWhatsAppLink(phone, message), "_blank", "noopener,noreferrer");
    fetch(`/api/students/${student.id}/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }).catch(() => {});
    toast.success("Opening WhatsApp — hit send there to deliver the message");
    onOpenChange(false);
  }

  return (
    <Dialog open={student !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send WhatsApp reminder</DialogTitle>
          {student && (
            <DialogDescription>
              To {student.firstName} {student.lastName} · {phone}. Opens WhatsApp with this message ready — you
              tap send there.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {WHATSAPP_TEMPLATES.map((template) => (
            <Badge
              key={template.label}
              variant="outline"
              className="cursor-pointer select-none hover:bg-muted"
              onClick={() => student && setMessage(template.build({ firstName: student.firstName, remaining }))}
            >
              {template.label}
            </Badge>
          ))}
        </div>

        <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />

        <DialogFooter>
          <Button disabled={!message.trim()} onClick={handleSend}>
            <Send className="size-4" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
