"use client";

import { Provider } from "react-redux";
import store from "../../redux/store";

import "../../styles/variables.css";

import Sidebar from "../../components/estudianteSidebar";

export default function PortalEstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <Sidebar />
      {children}
    </Provider>
  );
}