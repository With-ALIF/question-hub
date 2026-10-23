"use client";

import { LogOut } from "lucide-react";

import { adminSignOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function AdminSignOutButton({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs uppercase tracking-wide text-muted-foreground sm:inline">
        {role.replace("_", " ")}
      </span>
      <form action={adminSignOutAction}>
        <Button type="submit" variant="outline" size="sm" className="gap-2">
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
