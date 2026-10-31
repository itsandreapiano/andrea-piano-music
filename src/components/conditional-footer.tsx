"use client";

import { usePathname } from "next/navigation";
import FooterSection from "@/components/footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <FooterSection />;
}
