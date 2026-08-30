Repositorio dedicado a DPS Teorico, proyecto de catedra de 2026: "Smart Campus".

Integrantes:
- 
- 
- 
- 
- 


Instrucciones de Instalacion y Despliegue

Antes de ejecutar el proyecto, asegurese de tener instalado:
- Git 
- Node.js (version 19 o superior recomendada)
- npm (incluido en Node.js)

Para clonar el repositorio, abra una terminal, como Git Bash, y ejecute: 
$ git clone https://github.com/DiegoAxe/Smart-Campus.git

Luego ingrese a la carpeta del proyecto: $ cd Smart-Campus

Instale las dependencias utilizadas del proyecto: $ npm install
Dependencias utilizadas:
- npm install recharts (utilizada para las graficas)
- npm install redux (utilizadas para los states)
- npm install express cors dotenv (utilizada para el funcionamiento de la api)
- npm install mysql2 (utilizada para el acceso a la base de datos en mysqli)

En este momento, nos encontramos en la carpeta del proyecto, pero antes de 
ejecutarlo, debemos hacer unos detalles:

Ejecutamos el servidor Apache y MySQL, para acceder a phpMyAdmin, y crear la base de datos:
smartcampus-db.sql

Ademas, necesitamos ejecutar la api REST que actuara como servidor para nuestro proyecto:
$ cd api
$ node index.js
Con esto, el servidor esta activo, y podemos probarlo en PostMan con:
http://localhost:3001/api/asistencias/estudiante/:id_estudiante

Y finalmente ejecutamos el proyecto: 
Dado que nuestro servidor esta corriendo en una terminal, debemos de abrir una terminal nueva.
$ cd Smart-Campus
$ npm run dev

Una vez iniciado, abra el navegador y acceda a: 
http://localhost:3000 (o al puerto que usted tenga elegido)
