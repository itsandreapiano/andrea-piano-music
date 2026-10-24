import AboutUsSection from "@/components/sections/about-section";
import FullVersionSection from "@/components/sections/full-version-section";
import HeroSection from "@/components/sections/hero-section";
import PortfolioSection from "@/components/sections/news-section";
import ServicesSection from "@/components/sections/services";
import VideosSection from "@/components/sections/videos-section";
import StatsSection from "@/components/sections/stats";
import Testimonials from "@/components/testimonials";
import ContactSection from "@/components/contact";

export default function Video() {
  return (
    <main className="min-h-screen">
      <VideosSection />
      {/* <HeroSection /> */}
      {/* <AboutUsSection />
      <ServicesSection /> */}
      {/* <PortfolioSection />
      <StatsSection />
      <Testimonials />
      <ContactSection />
      */}
    </main>
  );
}
