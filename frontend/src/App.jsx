// Importamos los componentes necesarios para definir las rutas
import { Routes, Route } from 'react-router-dom';

// Importamos la página de inicio
import Home from './pages/Home';

// Importamos la barra de navegación superior
import Navbar from './components/common/Navbar';

// Importamos el pie de página
import Footer from './components/common/Footer';

function App() {
  return (
    // Contenedor principal con clases de Bootstrap:
    // - d-flex: para usar flexbox
    // - flex-column: apila los elementos verticalmente
    // - min-vh-100: ocupa al menos el 100% del alto de la pantalla
    <div className="d-flex flex-column min-vh-100">
      
      {/* Barra de navegación que estará fija arriba en toda la app */}
      <Navbar />
      
      {/* Contenido principal de la página */}
      <main className="flex-grow-1">
        {/* Definimos las rutas de la aplicación */}
        <Routes>
          {/* Ruta raíz ("/") que carga el componente Home */}
          <Route path="/" element={<Home />} />
          
          {/* Aquí puedes agregar más rutas cuando tengas más páginas */}
          {/* Ejemplo:
              <Route path="/login" element={<Login />} />
          */}
        </Routes>
      </main>

      {/* Pie de página que se muestra al final en todas las páginas */}
      <Footer />
    </div>
  );
}

// Exportamos el componente App para poder usarlo en otros archivos
export default App;
