// Importamos los componentes que se van a mostrar en la página principal (Home)
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import ModulesSection from '../components/home/ModulesSection';
import CallToAction from '../components/home/CallToAction';

// Este componente representa la página de inicio
export default function Home() {
  return (
    <>
      {/* Sección principal o de bienvenida */}
      <HeroSection />

      {/* Sección que muestra características o ventajas del sistema */}
      <FeaturesSection />

      {/* Sección que muestra los módulos o partes funcionales del sistema */}
      <ModulesSection />

      {/* Sección final que invita al usuario a realizar una acción (ej: registrarse) */}
      <CallToAction />
    </>
  );
}
