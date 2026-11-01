import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from './providers';
import RefreshSplash from '@/components/RefreshSplash';
import SplashOverlay from '@/components/SplashOverlay';
import ToastContainer from '@/components/Toast';



export const metadata: Metadata = {
  title: "S",
  icons: {
  icon: "/favicon.png?v=2",
  shortcut: "/favicon.png",
  apple: "/favicon.png",
},
};

const splashScript = `
(function(){
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') {
      var el = document.getElementById('refresh-splash');
      if (el) el.classList.add('active');
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased selection:bg-brand selection:text-black min-h-screen">

        {/* Raw splash*/}
        <div id="refresh-splash" suppressHydrationWarning>
          <img src="/S_logo.svg" alt="S" />
        </div>

        {/* Inline script*/}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: splashScript }}
        />

        <Providers>
          <RefreshSplash />
          <SplashOverlay />
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}