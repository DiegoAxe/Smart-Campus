//Solo necesita el redux provider, no hay mas layout para el inicio de seion

"use client";

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El link es para acceder a ciertos iconos, sin necesidad de descargarlos
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}