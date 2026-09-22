import { useState } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import ServicesCatalog from "@/components/landing/ServicesCatalog";
import BookingForm from "@/components/landing/BookingForm";
import Gallery from "@/components/landing/Gallery";
import SocialProof from "@/components/landing/SocialProof";
import Testimonials from "@/components/landing/Testimonials";
import WhyUs from "@/components/landing/WhyUs";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import PromoBanner from "@/components/landing/PromoBanner";
import GsapEffects from "@/components/landing/GsapEffects";

export default function LandingPage() {
  const [selectedService, setSelectedService] = useState("");
  return (
    <>
      <GsapEffects />
      <Header />
      <PromoBanner />
      <main>
        <Hero />
        <About />
        <ServicesCatalog onBook={setSelectedService} />
        <BookingForm preselectedService={selectedService} />
        <Gallery />
        <SocialProof />
        <Testimonials />
        <WhyUs />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
