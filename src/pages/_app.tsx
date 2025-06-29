import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <NuqsAdapter>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </NuqsAdapter>
  );
}
