import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BenefitsBanner } from "@/components/BenefitsBanner";
import { TechStackScroll } from "@/components/TechStackScroll";
import { SubmitSection } from "@/components/SubmitSection";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#09090b] text-[#a1a1aa]">
      {/* 1. Navbar: Orange terminal logo, Status indicator, Track order search input */}
      <Navbar />

      {/* 2. Hero: Review & Capstone Code Debugging — Guaranteed Run or ₹0 Charge */}
      <Hero />

      {/* 3. Key Benefits Banner: 1-2 Hour Turnaround, Anonymous & Encrypted, Includes 1-Page Viva Defense Sheet */}
      <BenefitsBanner />

      {/* 4. Supported Tech Stacks & Frameworks */}
      <TechStackScroll />

      {/* 5. Instant Code Submission / Debug Triage Protocol */}
      <SubmitSection />

      {/* 6. Frequently Asked Questions */}
      <FaqSection />

      {/* 7. Footer */}
      <Footer />
    </main>
  );
}
