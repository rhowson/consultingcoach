"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print or "Save as PDF" — assessors file the report as evidence. */
export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer size={16} aria-hidden />
      Print / save PDF
    </Button>
  );
}
