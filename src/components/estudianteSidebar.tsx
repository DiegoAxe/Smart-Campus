// Modulo para el NavBar del estudiante, con las opciones de ver su perfil, cerrar sesión y etc
"use client"; 

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

import "../styles/sidebar.css";

export default function estudianteSidebar() {
    //Variables utilizadas para navegar entre paginas y las variables de sesion
    const pathname = usePathname();
    const { usuario } = useAuth();
    const router = useRouter();
    const { cerrarSesion } = useAuth();

    const handleLogout = () => {
        cerrarSesion();
        router.push("/");
    };

    return (
        <nav className="estudiante-sidebar">
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
            {/* 
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
            */}
            <div className="link-separador"></div>
            <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <span className="material-symbols-outlined"> logout </span>
                <p>Cerrar sesión</p>
            </button>

            

            <div className="sidebar-footer">
                
                {/*<img src="file.svg" alt="Foto de Perfil" className="fotoPerfil" /> */}

                <div className="user-circle">
                    <span className="material-symbols-outlined"> account_circle </span>
                </div>
                <div className="sidebar-footer-text">
                    <h1>{usuario?.apellidos}</h1>
                    <h3>{usuario?.rol}</h3>
                </div>
            </div>
        </nav>
    );
}