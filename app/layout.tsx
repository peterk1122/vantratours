import type { Metadata } from "next";
import { Poppins, Volkhov } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const volkhov = Volkhov({
  variable: "--font-volkhov",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Desert Safari Deals in Dubai | Desert Smart Tourism",
  description: "Book Dubai desert safari deals, including morning and evening desert safari with dinner, premium safari packages for a luxury experience ||  Desert Smart Tourism",
  keywords: [
    "desert safari deals",
    "morning desert safari dubai",
    "desert safari offers",
    "premium desert safari",
    "premium desert safari dubai",
    "desert safari tour",
    "desert safari package",
    "dubai desert safari dinner",
    "desert safari online booking",
    "dubai desert safari tours"
  ],
};

import { CartProvider } from '@/context/CartContext';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <head>
        <meta name="google-site-verification" content="KucvCMkFwBJ0Cv9n1cM3N5gU9sdGUBxHGbD5hxu5lzY" />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Desert Smart Tourism",
              "image": "https://vantratours-swart.vercel.app/_next/image?url=%2Fimages%2Flogo.webp&w=256&q=75",
              "@id": "",
              "url": "https://vantratours-swart.vercel.app",
              "telephone": "+971569578414",
              "priceRange": "140-2200 AED",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "F4 King Badr Saif Saud Al Jabri, Al Barsha South",
                "addressLocality": "Dubai",
                "postalCode": "00000",
                "addressCountry": "AE"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 25.399227,
                "longitude": 55.435363
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "00:00",
                "closes": "23:59"
              },
              "sameAs": [
                "https://www.facebook.com/dsmartourism",
                "https://www.youtube.com/@desertsmarttourismllc",
                "https://www.instagram.com/dsmarttourism",
                "https://vantratours-swart.vercel.app/"
              ]
            })
          }}
        />
      
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MPDHF89');
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            ::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            * {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
          }
        `}} />
      </head>
      <body
        className={`${poppins.variable} ${volkhov.variable} font-sans antialiased overflow-x-hidden`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MPDHF89"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <CartProvider>
          {children}
        </CartProvider>
        <WhatsAppButton />
      </body>
    </html>
  );
}
