// Vervang de inhoud van src/app/page.tsx met:
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/voorraad");
  }, [router]);
  
  return null;
}