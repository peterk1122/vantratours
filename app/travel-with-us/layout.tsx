import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel With Us | Desert Smart Tourism',
  description: 'Explore our wide range of tours, safaris, and luxury experiences across the UAE.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
