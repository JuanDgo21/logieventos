# 🧪 Guía para la Ejecución y Desarrollo de Tests en el Frontend (Angular)

Este archivo tiene como propósito **guiar el proceso de ejecución, creación y corrección de pruebas unitarias (testing)** del proyecto **frontend Angular**, 

---

## 🚀 Comando principal de testing

Para ejecutar las pruebas unitarias con **Karma + Jasmine**, utiliza el siguiente comando en la terminal desde la carpeta del proyecto frontend:

```
ng test --code-coverage
```

### 🔎 Qué sucede al ejecutarlo

* Se abrirá automáticamente una pestaña en el navegador con la interfaz de **Karma**, generalmente en una URL similar a:

  ```
  http://localhost:9876/?id=xxxxxxx
  ```
* Desde ahí podrás visualizar los resultados de las pruebas en tiempo real.
* Si alguna prueba falla, Karma mostrará detalles del error para que puedas depurarlo o solucionarlo.

---

## 📊 Consultar estadísticas de cobertura

Cada vez que ejecutes `ng test --code-coverage`, Angular generará un **reporte de cobertura** dentro del proyecto.

1. Dirígete a la ruta:

   ```
   frontend/coverage/frontend/index.html
   ```
2. Abre ese archivo en tu navegador.
   Por ejemplo:

   ```
   file:///C:/Users/Juana/OneDrive/Documentos/logieventos/frontend/coverage/frontend/index.html
   ```
3. Allí encontrarás un **resumen visual y porcentual** de la cobertura actual del proyecto (líneas cubiertas, funciones, ramas, etc.).

💡 **Objetivo:** lograr un **100% de cobertura total** en todas las áreas del proyecto.

---

## 🔄 Importante: volver a ejecutar los tests después de cada cambio

Cada vez que modifiques o agregues una prueba unitaria:

1. Guarda los cambios en el archivo `.spec.ts`.
2. Vuelve a ejecutar el comando:

   ```
   ng test --code-coverage
   ```
3. Si notas que no se actualizan los resultados o el navegador no refleja cambios, puede deberse al caché.
   En ese caso, limpia la caché con:

   ```
   ng cache clean
   ```

   Luego, vuelve a ejecutar los tests.

---

## 🧩 Orden sugerido para abordar los tests

Para mantener un flujo organizado, se recomienda trabajar **en el siguiente orden**:

1. **Servicios (`src/app/core/services/`)**
   Empieza por los servicios, ya que son la base de la lógica y comunicación del proyecto.
   Una vez que los tests de los servicios estén correctos y estables, continúa con:
2. **Módulos (`modules/`)**
3. **Componentes compartidos (`shared/`)**
4. **Páginas (`pages/`)**

Este orden facilita detectar errores base antes de avanzar a niveles más altos del frontend.

---

## 🤖 Prompt sugerido para usar con la IA (opcional)

A continuación, se deja un **prompt base recomendado** que puedes reutilizar o modificar según tus preferencias:

---

### 🧠 Prompt base

> **Prompt sugerido:**
>
> Hola, tengo mi proyecto desarrollado completamente con Angular CLI v20 y todas sus dependencias actualizadas.
> La funcionalidad ya está completamente operativa (todo funciona al 100%), pero ahora necesito implementar y completar todas las pruebas unitarias (testing) para alcanzar una cobertura del 100%, utilizando Karma + Jasmine + Coverage.
>
> Quisiera que me ayudes en este proceso paso a paso.
> Voy a ir pasándote cada archivo correspondiente a las pruebas (`.spec.ts`) junto con su respectivo archivo fuente, para que me ayudes a construir los tests desde cero (ya que actualmente no tengo ninguno escrito).
>
> Además, si durante las pruebas surgen bugs o errores, te los compartiré para que me indiques cómo solucionarlos. Si es necesario revisar un archivo adicional, te lo proporcionaré según lo requieras.
>
> 🔍 **Puntos importantes:**
>
> * Analiza cuidadosamente cada archivo antes de escribir los tests.
> * En caso de errores, solucionémoslos antes de continuar con los tests.
> * El backend está en Node.js, por lo que se pueden usar mocks o servicios simulados para las pruebas.
>
> 📁 **Objetivo final:**
> Conseguir todas las pruebas unitarias completas, legibles, bien documentadas y con cobertura del 100%.

---

## 🗂️ Archivos a trabajar

A continuación se listan las rutas completas de todos los archivos que deben tener pruebas unitarias o que ya las incluyen.
El trabajo se realizará **archivo por archivo**, verificando primero que la funcionalidad sea correcta antes de continuar con las pruebas.

> 💡 Puedes pedir los archivos por secciones (por servicios, módulos o componentes) para mantener un flujo ordenado y facilitar el seguimiento.

C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\constants\apiRouters.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\alert.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\alert.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\api.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\api.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\auth.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\auth.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\contract.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\contract.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\event.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\event.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\layout.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\layout.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\personnel.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\personnel.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\provider.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\resources.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\resources.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\sidebar-state.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\sidebar-state.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\user.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\core\services\user.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\login\login.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\login\login.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\login\login.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\login\login.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\password-recovery\password-recovery.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\password-recovery\password-recovery.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\password-recovery\password-recovery.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\password-recovery\password-recovery.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\register\register.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\register\register.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\register\register.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\auth\register\register.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resource-types\resource-types.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resource-types\resource-types.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resource-types\resource-types.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resource-types\resource-types.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resources\resources.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resources\resources.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resources\resources.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\inventory\resources\resources.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider\provider.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider\provider.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider\provider.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider\provider.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider-type\provider-type.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider-type\provider-type.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider-type\provider-type.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\provider\provider-type\provider-type.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-form\personnel-form.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-form\personnel-form.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-form\personnel-form.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-form\personnel-form.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-list\personnel-list.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-list\personnel-list.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-list\personnel-list.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-list\personnel-list.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-form\personnel-type-form.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-form\personnel-type-form.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-form\personnel-type-form.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-form\personnel-type-form.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-list\personnel-type-list.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-list\personnel-type-list.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-list\personnel-type-list.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\staff\personnel-type-list\personnel-type-list.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-form\user-form.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-form\user-form.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-form\user-form.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-form\user-form.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-list\user-list.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-list\user-list.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-list\user-list.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-list\user-list.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-profile\user-profile.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-profile\user-profile.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-profile\user-profile.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\modules\user-management\user-profile\user-profile.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\contracts-page\contracts-page.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\contracts-page\contracts-page.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\contracts-page\contracts-page.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\contracts-page\contracts-page.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard\dashboard.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard\dashboard.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard\dashboard.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard\dashboard.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-staff\dashboard-staff.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-staff\dashboard-staff.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-staff\dashboard-staff.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-staff\dashboard-staff.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-users\dashboard-users.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-users\dashboard-users.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-users\dashboard-users.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\dashboard-users\dashboard-users.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-page\event-page.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-page\event-page.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-page\event-page.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-page\event-page.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-type\event-type.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-type\event-type.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-type\event-type.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\event-type\event-type.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\inventory-page\inventory-page.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\inventory-page\inventory-page.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\inventory-page\inventory-page.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\inventory-page\inventory-page.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\providers\providers.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\providers\providers.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\providers\providers.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\pages\components\providers\providers.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\alert-modal\alert-modal.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\alert-modal\alert-modal.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\alert-modal\alert-modal.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\alert-modal\alert-modal.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\confirm-modal\confirm-modal.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\confirm-modal\confirm-modal.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\confirm-modal\confirm-modal.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\confirm-modal\confirm-modal.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\footer\footer.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\footer\footer.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\footer\footer.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\footer\footer.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\navbar\navbar.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\navbar\navbar.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\navbar\navbar.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\navbar\navbar.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar\sidebar.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar\sidebar.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar\sidebar.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar\sidebar.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar-inventory\sidebar-inventory.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar-inventory\sidebar-inventory.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar-inventory\sidebar-inventory.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\shared\components\sidebar-inventory\sidebar-inventory.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.config.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.html C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.routes.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.scss C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.spec.ts C:\Users\Juana\OneDrive\Documentos\logieventos\frontend\src\app\app.ts

---

## 🏁 Objetivo final del proceso

✅ Lograr que **todas las pruebas unitarias estén completas, legibles**,
✅ Asegurar una **cobertura del 100%** en todo el frontend Angular,
✅ Mantener el proyecto **estable, sin bugs y conforme a buenas prácticas**,

