//Solo necesita el redux provider, no hay mas layout para el inicio de seion

"use client";

import { Provider } from "react-redux";
import store from "../redux/store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Provider store={store}>
          {children}
        </Provider>
      </body>
    </html>
  );
}