"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
};

export function AdminReportResolveModal({ open, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const res = await onConfirm();
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "সমাধান সম্পন্ন করা যায়নি।");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
            <CheckCircle2 className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            রিপোর্ট সমাধান নিশ্চিতকরণ
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            রিপোর্টটি সমাধান হয়েছে বলে নিশ্চিত করছেন? এটি পেন্ডিং তালিকা থেকে মুছে ফেলা হবে।
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading} className="text-xs h-8">
            বাতিল
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{loading ? "সমাধান হচ্ছে..." : "হ্যাঁ, সমাধান সম্পন্ন"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
