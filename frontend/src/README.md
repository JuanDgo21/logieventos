# 📦 LogiEventos – Frontend

Este proyecto representa el **frontend en React** de **LogiEventos**, una aplicación web diseñada para facilitar la planificación, organización y administración de eventos.

---

## 📁 Estructura Actual del Proyecto

La estructura actual está diseñada para ser **modular, escalable y fácilmente mantenible**. Se puede modificar o extender según las necesidades futuras del proyecto.

frontend/
└── src/
├── assets/ # Recursos estáticos como imágenes, fuentes, estilos
│ └── styles/ # Hojas de estilo globales (CSS o SCSS)
│
├── components/ # Componentes reutilizables
│ ├── layout/ # Estructura general de la interfaz
│ │ ├── Footer.jsx
│ │ ├── Navbar.jsx
│ │ └── Sidebar.jsx
│ ├── shared/ # Utilidades comunes entre módulos
│ │ ├── Alert.jsx
│ │ └── Loader.jsx
│ └── User Interface/ # Elementos visuales reutilizables (UI)
│ ├── Card.jsx
│ └── Modal.jsx
│
├── contexts/ # Contextos de React (ej. autenticación, temas)
│
├── pages/ # Páginas y vistas según función o módulo
│ ├── admin/ # Páginas exclusivas del administrador
│ ├── auth/ # Autenticación (login, registro)
│ │ ├── Login.jsx
│ │ └── Register.jsx
│ └── core/ # Módulos funcionales del sistema
│ ├── Events/ # Gestión de eventos
│ ├── Staff/ # Gestión de personal
│ └── Suppliers/ # Gestión de proveedores
│
├── services/ # Lógica para llamadas a la API con Axios
│
├── utils/ # Funciones auxiliares (formateo, validaciones)