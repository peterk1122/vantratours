import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: "About Us | Vantra Travel & Tourism",
  description: "Learn about Vantra Travel & Tourism, your trusted partner for authentic desert safaris, city tours, and memorable travel experiences in the UAE.",
};

export default function AboutPage() {
  return <AboutClient />;
}
