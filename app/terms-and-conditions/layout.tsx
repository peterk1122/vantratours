import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Desert Smart Tourism',
  description: 'Read the terms and conditions for booking tours and experiences with Desert Smart Tourism.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
