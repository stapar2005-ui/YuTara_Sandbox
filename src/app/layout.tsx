import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "YuTara | Discover land with confidence",
  description: "A trusted Philippine land marketplace for verified discovery and direct connection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('yutara-theme')==='dark'){document.documentElement.dataset.theme='dark'}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
