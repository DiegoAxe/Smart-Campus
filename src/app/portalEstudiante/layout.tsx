// Aqui deberia de ir el navbar y el footer, para el portal del estudiante 

"use client";

import { Provider } from "react-redux";
import store from "../../redux/store";

//import Sidebar from "../../components/estudianteSidebar";
//import Footer from "../../components/Footer";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Provider store={store}>
          {/* <Sidebar /> */}
          {children}
        </Provider>
      </body>
    </html>
  );
}