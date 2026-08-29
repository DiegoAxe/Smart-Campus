
CREATE DATABASE IF NOT EXISTS sistema_asistencia
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE sistema_asistencia;

-- Tabla Profesores
CREATE TABLE Profesores (
    id_profesor VARCHAR(20) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    correo_institucional VARCHAR(150) NOT NULL UNIQUE,
    departamento_facultad VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Estudiantes
CREATE TABLE Estudiantes (
    id_estudiante VARCHAR(20) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    correo_institucional VARCHAR(150) NOT NULL UNIQUE,
    codigo_qr VARCHAR(255) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Materias
CREATE TABLE Materias (
    id_materia VARCHAR(20) PRIMARY KEY,
    nombre_materia VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Grupos
CREATE TABLE Grupos (
    id_grupo VARCHAR(20) PRIMARY KEY,
    id_materia VARCHAR(20) NOT NULL,
    id_profesor VARCHAR(20) NOT NULL,
    numero_grupo VARCHAR(10) NOT NULL,
    ciclo_academico VARCHAR(20) NOT NULL,
    aula VARCHAR(25) NOT NULL,
    CONSTRAINT fk_grupo_materia FOREIGN KEY (id_materia) 
        REFERENCES Materias(id_materia) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_grupo_profesor FOREIGN KEY (id_profesor) 
        REFERENCES Profesores(id_profesor) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Inscripciones
CREATE TABLE Inscripciones (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante VARCHAR(20) NOT NULL,
    id_grupo VARCHAR(20) NOT NULL,
    CONSTRAINT fk_inscripcion_estudiante FOREIGN KEY (id_estudiante) 
        REFERENCES Estudiantes(id_estudiante) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_grupo FOREIGN KEY (id_grupo) 
        REFERENCES Grupos(id_grupo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_estudiante_grupo UNIQUE (id_estudiante, id_grupo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Sesiones
CREATE TABLE Sesiones (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('Programada', 'Finalizada', 'Cancelada') DEFAULT 'Programada',
    token_qr VARCHAR(255) NULL,
    CONSTRAINT fk_sesion_grupo FOREIGN KEY (id_grupo) 
        REFERENCES Grupos(id_grupo) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Asistencias
CREATE TABLE Asistencias (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT NOT NULL,
    id_estudiante VARCHAR(20) NOT NULL,
    estado_asistencia ENUM('Presente', 'Ausente', 'Tardanza', 'Permiso') DEFAULT 'Presente',
    hora_marca DATETIME DEFAULT CURRENT_TIMESTAMP,
    metodo_registro VARCHAR(50) DEFAULT 'QR',
    CONSTRAINT fk_asistencia_sesion FOREIGN KEY (id_sesion) 
        REFERENCES Sesiones(id_sesion) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_asistencia_estudiante FOREIGN KEY (id_estudiante) 
        REFERENCES Estudiantes(id_estudiante) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_asistencia_sesion_estudiante UNIQUE (id_sesion, id_estudiante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;