import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';
import B2BClient from './B2BClient';

export const metadata: Metadata = {
  title: "B2B Corporate Inquiries | Desert Smart Tourism",
  description: "Get in touch with our corporate team for flexible B2B solutions, competitive pricing, and curated desert and city tour experiences in the UAE.",
};

export default function B2BCorporatePage() {
  return <B2BClient />;
}
