"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setLastDashboardMode } from "@/lib/dashboardMode";

export function ModeToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState<"travel" | "hosting">(
    pathname?.startsWith("/host") ? "hosting" : "travel"
  );

  useEffect(() => {
    setValue(pathname?.startsWith("/host") ? "hosting" : "travel");
  }, [pathname]);

  // Try to prefetch both dashboards to reduce switch latency
  useEffect(() => {
    try {
      (router as any)?.prefetch?.("/dashboard");
      (router as any)?.prefetch?.("/host/dashboard");
    } catch {}
  }, [router]);

  const [isSwitching, setIsSwitching] = useState(false);
  const [showTimer, setShowTimer] = useState<NodeJS.Timeout | null>(null);

  // When route changes, keep overlay briefly so change is visible, then clear
  // useEffect(() => {
  //   setShowTimer((prev) => {
  //     if (prev) clearTimeout(prev);
  //     return null;
  //   });
  //   if (isSwitching) {
  //     const done = setTimeout(() => setIsSwitching(false), 500);
  //     return () => clearTimeout(done);
  //   }
  // }, [pathname, isSwitching]);

  const onChange = (next: string) => {
    const v = next === "hosting" ? "hosting" : "travel";
    setLastDashboardMode(v);
    setValue(v);
    if (showTimer) clearTimeout(showTimer);
    // Only show overlay if navigation takes longer than 250ms
    //const t = setTimeout(() => setIsSwitching(true), 250);
    //setShowTimer(t);
    const target = v === "hosting" ? "/host/dashboard" : "/dashboard";
    router.push(target);
  }

  // useEffect(() => {
  //   // Failsafe: hide overlay after 8s in dev if something stalls
  //   if (!isSwitching) return;
  //   //const fail = setTimeout(() => setIsSwitching(false), 8000);
  //   //return () => clearTimeout(fail);
  // }, [isSwitching]);

  // useEffect(() => () => {
  //   if (showTimer) clearTimeout(showTimer);
  // }, [showTimer]);

  return (
    <div className="w-full flex flex-col items-center py-3 relative">
      {/* Hidden Links to hint Next.js to prefetch both dashboards */}
      <div aria-hidden className="hidden">
        <Link href="/dashboard" prefetch>
          <span className="sr-only">prefetch user dashboard</span>
        </Link>
        <Link href="/host/dashboard" prefetch>
          <span className="sr-only">prefetch host dashboard</span>
        </Link>
      </div>

      <Tabs value={value} onValueChange={onChange} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="travel">Buying</TabsTrigger>
          <TabsTrigger value="hosting">Hosting</TabsTrigger>
        </TabsList>
      </Tabs>

      {isSwitching && (
        <div className="fixed inset-0 z-[70] bg-background/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
