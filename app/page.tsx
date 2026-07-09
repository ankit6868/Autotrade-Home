import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProofStrip from "@/components/ProofStrip";
import Problem from "@/components/Problem";
import Companion from "@/components/Companion";
import HowItWorks from "@/components/HowItWorks";
import Workstation from "@/components/Workstation";
import Automation from "@/components/Automation";
import WhaleSection from "@/components/WhaleSection";
import Security from "@/components/Security";
import Pricing from "@/components/Pricing";
import Intelligence from "@/components/Intelligence";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* A — Hero & immediate proof */}
        <Hero />
        <ProofStrip />
        {/* B — Problem & the companion */}
        <Problem />
        <Companion />
        <HowItWorks />
        {/* C — Strategy construction & validation */}
        <Workstation />
        {/* D — Automation, discipline & control */}
        <Automation />
        {/* Live whale activity (real Hyperliquid data) */}
        <WhaleSection />
        {/* E — Trust, subscription & conversion */}
        <Security />
        <Pricing />
        <Intelligence />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
