import React from 'react'
import { Inter } from "next/font/google";
import GoogleAuthCard from "@/components/google-auth-card";
import { useSession } from 'next-auth/react';
import Dashboard from '@/components/dashboard';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function index() {
  const { status } = useSession();
  return (
    <div className={inter.className}>
      {status === "authenticated" ? <Dashboard /> : <GoogleAuthCard />} 
    </div>
  );
}
