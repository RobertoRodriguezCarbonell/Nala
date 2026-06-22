import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Positioning } from "@/components/sections/positioning";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Showcase } from "@/components/sections/showcase";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Positioning />
      <Features />
      <HowItWorks />
      <Showcase />
      <FinalCta />
      <Footer />
    </main>
  );
}
