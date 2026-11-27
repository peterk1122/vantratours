import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Vantra Travel & Tourism',
  description: 'Read the terms and conditions for booking tours and experiences with Vantra Travel & Tourism.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
