import React from 'react'
import { Inter } from "next/font/google";
import GoogleAuthCard from "@/pages/components/google-auth-card";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function index() {
  return <div className={inter.className}>
    <GoogleAuthCard />
  </div>;
}
