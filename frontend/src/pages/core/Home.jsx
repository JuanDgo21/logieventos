import React from 'react';
import HeroSection from '../../components/shared/HeroSection';
import FeaturesSection from '../../components/shared/FeaturesSection';
import KeyModules from '../../components/shared/KeyModules';
import TestimonialSection from '../../components/shared/TestimonialSection';
import CallToAction from '../../components/shared/CallToAction';
import Footer from '../../components/layout/Footer';
import Navbar from '../../components/layout/Navbar';

const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <KeyModules />
        <TestimonialSection />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
};

export default Home;