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

---

## 🏁 Objetivo final del proceso

✅ Lograr que **todas las pruebas unitarias estén completas, legibles**,
✅ Asegurar una **cobertura del 100%** en todo el frontend Angular,
✅ Mantener el proyecto **estable, sin bugs y conforme a buenas prácticas**,

