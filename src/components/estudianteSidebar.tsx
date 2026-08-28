// Modulo para el NavBar del estudiante, con las opciones de ver su perfil, cerrar sesión y etc
"use client"; 

import Link from "next/link";
import { usePathname } from "next/navigation";

import "../styles/sidebar.css";

export default function EstudianteSidebar() {
    const pathname = usePathname();

    return (
        <nav className="estudiante-sidebar">
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
            <div className="sidebar-header">
                <img src="UDB logo.png" alt="Logo UDB" className="logoUDB" />
                <div className="sidebar-header-text">
                    <h1>Smart Campus</h1>
                    <h3>ASISTENCIA & IA</h3>
                </div>
            </div>
            <Link href="/portalEstudiante" className={pathname === "/portalEstudiante" ? "sidebar-links active" : "sidebar-links"}> 
                <span className="icono-link material-symbols-outlined">dashboard</span>
                <p>Dashboard</p>  
            </Link>
            <Link href="/portalEstudiante/Materias" className={pathname === "/portalEstudiante/Materias" ? "sidebar-links active" : "sidebar-links"}>
                <span className="icono-link material-symbols-outlined">import_contacts</span>
                <p>Materias</p>
            </Link>
            <Link href="/portalEstudiante/Historial" className={pathname === "/portalEstudiante/Historial" ? "sidebar-links active" : "sidebar-links"}>
                <span className="icono-link material-symbols-outlined">calendar_clock</span>
                <p>Historial</p>
            </Link>
            <Link href="/portalEstudiante/IA" className={pathname === "/portalEstudiante/IA" ? "sidebar-links active" : "sidebar-links"}>
                <span className="icono-link material-symbols-outlined">network_intelligence</span>
                <p>IA Insights</p>
            </Link>

            <div className="sidebar-footer">
                {/* Esta es la parte complicada, pq debe de recibir la info de la api, tanto nombre, foto, y tipo de usuario */}
                <img src="file.svg" alt="Foto de Perfil" className="fotoPerfil" />
                <div className="sidebar-footer-text">
                    <h1>Nombre User</h1>
                    <h3>Estudiante</h3>
                </div>
            </div>
        </nav>
    );
}