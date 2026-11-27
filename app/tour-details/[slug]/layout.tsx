
import { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Package from '@/models/Package';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    await connectToDatabase();

    const activeData = await Package.findOne({
      slug,
      status: 'published',
    }).lean();

    if (activeData) {
      const cleanDescription =
        activeData.metaDescription ||
        activeData.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) ||
        '';

      return {
        title: activeData.metaTitle ||
          `${activeData.title} | Vantra Travel & Tourism`,
        description: cleanDescription,
        keywords: activeData.metaKeywords || '',
        openGraph: {
          title: activeData.metaTitle || activeData.title,
          description: cleanDescription,
          images: activeData.image ? [activeData.image] : [],
        },
      };
    }
  } catch (err) {
    console.error('Failed to fetch local package metadata:', err);
  }

  return {
    title: 'Tour Details | Vantra Travel & Tourism',
  };
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
