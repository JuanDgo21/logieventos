# 🧪 Pruebas API - LogiEventos

Este repositorio contiene la documentación y estructura de las pruebas API realizadas en **Postman** para el backend del sistema **LogiEventos**, una plataforma de gestión de eventos que incluye autenticación de usuarios, manejo de recursos, contratos, personal y proveedores, entre otros.

> 📌 Nota: Este `README.md` está enfocado exclusivamente en el entorno de pruebas Postman. Para la documentación completa del backend, consulta el archivo `README.md` principal del proyecto.

---

## 📂 Estructura de carpetas en Postman

La colección está organizada por **módulos funcionales** y **roles de usuario** (Admin, Líder, Coordinador). Cada carpeta deberá incluir las operaciones CRUD básicas:

LogiEventos
├── Auth
│ ├── Register → Registro de nuevos usuarios
│ ├── Login → Inicio de sesión y obtención de token
│ ├── Refresh Token → Renovación del token de acceso
│ └── Logout → Cierre de sesión
│ ⚠️ Orden sugerido: Register → Login → Refresh → Logout

├── Users
│ ├── CRUD Admin → Gestión completa de usuarios por el Admin
│ ├── CRUD Líder → Gestión parcial por parte del Líder
│ └── CRUD Coordinador → Consultas y acciones autorizadas por Coordinador

├── Core
│ ├── Events
│ │ ├── CRUD Admin
│ │ ├── CRUD Líder
│ │ └── CRUD Coordinador
│ ├── Contracts
│ │ ├── CRUD Admin
│ │ ├── CRUD Líder
│ │ └── CRUD Coordinador
│ ├── Resources
│ │ ├── CRUD Admin
│ │ ├── CRUD Líder
│ │ └── CRUD Coordinador
│ ├── Staff
│ │ ├── CRUD Admin
│ │ ├── CRUD Líder
│ │ └── CRUD Coordinador
│ └── Suppliers
│ ├── CRUD Admin
│ ├── CRUD Líder
│ └── CRUD Coordinador

├── Types
│ ├── Event Types
│ ├── Resource Types
│ ├── Staff Types
│ └── Supplier Types
│ │
│ ├── CRUD Admin
│ ├── CRUD Líder
│ └── CRUD Coordinador

└── Support
└── Reports
├── CRUD Admin
├── CRUD Líder
└── CRUD Coordinador


---

## ⚙️ Variables de entorno (no definitivas aún)

Se recomienda usar variables de entorno en Postman para facilitar la gestión de tokens y endpoints.

| Variable             | Descripción                                 |
|----------------------|---------------------------------------------|
| `{{base_url}}`       | URL base de la API (ej: http://localhost:3000/api) |
| `{{token_admin}}`    | Token JWT para autenticación como Admin     |
| `{{token_lider}}`    | Token JWT para autenticación como Líder     |
| `{{token_coordinador}}` | Token JWT para Coordinador              |
| `{{user_id}}`, `{{event_id}}`, etc. | IDs dinámicos usados en pruebas |

---

## 🚀 ¿Cómo usar la colección?

1. **Clona este repositorio** o accede desde el enlace compartido.
2. **Importa la colección a Postman**.
3. **Configura las variables de entorno** (`base_url`, tokens, etc.).
4. **Ejecuta los requests** en el siguiente orden recomendado por carpeta:
   - `GET` todos los registros
   - `GET` por ID
   - `POST` para crear un nuevo recurso
   - `PUT` para actualizar un recurso
   - `DELETE` para eliminar un recurso

---

## 👥 Roles y permisos

| Rol         | Descripción                                                  |
|-------------|--------------------------------------------------------------|
| **Admin**   | Acceso total a todos los módulos. Crea, modifica y elimina.  |
| **Líder**   | Acceso intermedio. Puede gestionar recursos asignados.       |
| **Coordinador** | Acceso limitado. Consulta y apoya seguimiento.          |

---

## 📬 Enlace a la colección en Postman

🔗 [Haz clic aquí para ver la colección Postman](https://warped-station-929017.postman.co/workspace/Team-Workspace~732cfcbe-bdda-440a-8dfc-2b193e5e495e/collection/35040370-aad36faf-683b-4365-8987-1f1f691ddcf4?action=share&creator=35040370)

---

## ✅ Estado actual

- [x] Estructura de carpetas creada
- [ ] Endpoints CRUD pendientes de implementar por módulo y rol
- [ ] Confirmar y definir variables de entorno finales
- [ ] Documentar cada request con descripciones y ejemplos

---

## 🤝 Contribuciones

Si deseas proponer mejoras, agregar endpoints o sugerencias, siéntete libre de colaborar mediante pull requests o comentarios en el equipo de trabajo.

---

## 📌 Notas finales

Este entorno de pruebas está diseñado para facilitar el desarrollo y verificación de la API. Toda contribución o corrección será bienvenida para garantizar una validación completa y profesional del backend de LogiEventos.

---

