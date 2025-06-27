// Importamos la función defineConfig desde Vite.
// Esta función nos ayuda a definir la configuración del proyecto de forma más organizada.
import { defineConfig } from 'vite'

// Importamos el plugin de React para que Vite pueda entender y trabajar con archivos de React (.jsx o .tsx)
import react from '@vitejs/plugin-react'

// Exportamos la configuración usando defineConfig
// Esto permite a Vite saber cómo debe comportarse nuestro proyecto.
export default defineConfig({
  // Aquí definimos los plugins que vamos a usar. En este caso, el plugin de React.
  plugins: [react()],

  // Configuración del servidor de desarrollo (cuando ejecutamos `npm run dev`)
  server: {
    // Definimos el puerto en el que queremos que se ejecute el servidor local.
    // Por ejemplo, al correr el proyecto, se podrá acceder en http://localhost:3000
    port: 3000,
  },
})
