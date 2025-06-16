# 📂 Estructura de Models

Este directorio contiene los esquemas de MongoDB para la API de Logieventos, organizados por categorías.

## 🗂️ Carpetas

### `/core` (Entidades Principales)
- `User.js`: Usuarios del sistema (autenticación y roles).
- `Event.js`: Eventos gestionados por el centro.
- `Staff.js`: Personal asignable a eventos.
- `Contract.js`: Contratos digitales con clientes/personal.
- `Resource.js`: Recursos físicos (sonido, mobiliario, etc.).
- `Supplier.js`: Proveedores externos.

### `/types` (Categorías)
- `EventType.js`: Tipos de evento (ej: "conferencia", "boda").
- `StaffType.js`: Roles de personal (ej: "logística", "chef").
- `ResourceType.js`: Categorías de recursos (ej: "audio", "mobiliario").
- `SupplierType.js`: Tipos de proveedores (ej: "catering", "seguridad").

### `/support` (Soporte)
- `Report.js`: Reportes de incidencias o fallos.
- `Assignment.js`: Asignaciones de personal a eventos *(opcional)*.

## 🔗 Relaciones Clave
- `Event` → `EventType` (un evento pertenece a un tipo).
- `Staff` → `StaffType` (un personal tiene un rol específico).
- `Resource` → `Supplier` (un recurso es provisto por un proveedor).

## 🛠️ Cómo Añadir un Nuevo Modelo
1. Crea el archivo en la carpeta correspondiente.
2. Define el schema con `mongoose.Schema`.
3. Usa `module.exports` para exportar el modelo.
4. Actualiza este README si es necesario.