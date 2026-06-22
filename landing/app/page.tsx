import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Positioning } from "@/components/sections/positioning";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Positioning />
      <Features />
      <HowItWorks />
    </main>
  );
}
