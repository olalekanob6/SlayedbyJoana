import { useState } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ServicesCatalog from "@/components/landing/ServicesCatalog";
import BookingForm from "@/components/landing/BookingForm";
import Gallery from "@/components/landing/Gallery";
import SocialProof from "@/components/landing/SocialProof";
import Testimonials from "@/components/landing/Testimonials";
import WhyUs from "@/components/landing/WhyUs";
import Faq from "@/components/landing/Faq";
import About from "@/components/landing/About";
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
        {/* 1. Hero — immediate value proposition + visual impact */}
        <Hero />

        {/* 2. Social proof above the fold for trust-building */}
        <SocialProof />

        {/* 3. Services — what we offer, with transparent prices */}
        <section id="servicios">
          <ServicesCatalog onBook={setSelectedService} />
        </section>

        {/* 4. Gallery — proof of work, inspiration */}
        <section id="galeria">
          <Gallery />
        </section>

        {/* 5. About — who is Joana (brief, high-impact) */}
        <section id="sobre-joana">
          <About />
        </section>

        {/* 6. Booking — the conversion point (preselected from catalog) */}
        <section id="reservar">
          <BookingForm preselectedService={selectedService} />
        </section>

        {/* 7. Reassurance layer — testimonials, why us, FAQ */}
        <section id="faq">
          <Testimonials />
          <WhyUs />
          <Faq />
        </section>
      </main>
      <Footer />
    </>
  );
}
