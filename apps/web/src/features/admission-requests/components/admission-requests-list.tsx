"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialsOf } from "@/features/student-directory/lib/format";
import { useAdmissionRequests } from "../hooks/use-admission-requests";
import type { AdmissionRequest } from "@yogapratishthan/db";

export function AdmissionRequestsList() {
  return (
    <Tabs defaultValue="PENDING">
      <TabsList>
        <TabsTrigger value="PENDING">Pending</TabsTrigger>
        <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
        <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
      </TabsList>
      <TabsContent value="PENDING" className="pt-4">
        <RequestsTab status="PENDING" />
      </TabsContent>
      <TabsContent value="ACCEPTED" className="pt-4">
        <RequestsTab status="ACCEPTED" />
      </TabsContent>
      <TabsContent value="REJECTED" className="pt-4">
        <RequestsTab status="REJECTED" />
      </TabsContent>
    </Tabs>
  );
}

function RequestsTab({ status }: { status: "PENDING" | "ACCEPTED" | "REJECTED" }) {
  const { requests, isLoading } = useAdmissionRequests(status);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No {status.toLowerCase()} requests</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function RequestCard({ request }: { request: AdmissionRequest }) {
  return (
    <Link
      href={`/admission-requests/${request.id}`}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <Avatar size="lg" className="size-12">
        <AvatarImage src={request.photoUrl ?? undefined} alt={request.firstName} />
        <AvatarFallback>{initialsOf(request.firstName, request.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {request.firstName} {request.lastName}
        </p>
        <p className="text-xs text-muted-foreground">Submitted {format(new Date(request.createdAt), "PP")}</p>
      </div>
      {request.status === "REJECTED" && <Badge variant="destructive">Rejected</Badge>}
    </Link>
  );
}
