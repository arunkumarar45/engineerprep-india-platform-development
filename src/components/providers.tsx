"use client";

import type { ReactNode } from "react";
import { ToastProvider, ToastViewport } from "@/components/ui";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}
