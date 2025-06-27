// Importamos React, necesario para trabajar con componentes y JSX
import React from 'react';

// Importamos ReactDOM para renderizar la aplicación en el navegador
import ReactDOM from 'react-dom/client';

// Importamos BrowserRouter de react-router-dom para manejar las rutas en nuestra aplicación
import { BrowserRouter } from 'react-router-dom';

// Importamos el componente principal de la aplicación (App.jsx)
import App from './App';

// Importamos los estilos personalizados de nuestra app
import './styles/index.css';

// Importamos los estilos de Bootstrap para usar su sistema de diseño y componentes
import 'bootstrap/dist/css/bootstrap.min.css';

// Importamos la librería de iconos Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';

// Importamos algunos iconos específicos de Font Awesome para usarlos en nuestra app
import { 
  faCalendarAlt, 
  faCheckCircle, 
  faChartLine, 
  faCogs, 
  faFileAlt,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

// Agregamos los iconos importados a la biblioteca de Font Awesome para que estén disponibles en toda la app
library.add(faCalendarAlt, faCheckCircle, faChartLine, faCogs, faFileAlt, faArrowRight);

// Renderizamos la aplicación dentro del elemento con id 'root' (que está en el archivo index.html)
ReactDOM.createRoot(document.getElementById('root')).render(
  // React.StrictMode ayuda a detectar errores y buenas prácticas en desarrollo
  <React.StrictMode>
    {/* BrowserRouter permite navegar entre páginas sin recargar la app */}
    <BrowserRouter>
      {/* App es el componente principal que contiene toda la estructura de la aplicación */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
