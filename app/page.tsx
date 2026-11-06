import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import AttractionsSection from '@/components/sections/AttractionsSection';
import TourRowSection from '@/components/sections/TourRowSection';
import WhyBookSection from '@/components/sections/WhyBookSection';

export const metadata: Metadata = {
  title: 'Vantra Travel & Tourism | Experiences Worth Traveling For',
  description: 'Discover and book tours, attractions and activities with Vantra Travel & Tourism.',
};

export default function Home() {
  return (
    <main className="max-w-[1920px]">
      <Header />
      <HeroSection />
      <CategoriesSection />
      <AttractionsSection />
      <TourRowSection title="Go beyond the guidebook" section="guidebook" />
      <TourRowSection title="Adventures to plan your trip around" section="adventures" />
      <WhyBookSection />
      <Footer />
    </main>
  );
}
