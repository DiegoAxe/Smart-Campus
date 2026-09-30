"use client";

import "../../styles/variables.css";
import Sidebar from "../../components/estudianteSidebar";

export default function PortalEstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}