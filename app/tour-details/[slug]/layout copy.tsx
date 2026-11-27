import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const res = await fetch(`https://vantratours-swart.vercel.app/api/packages?slug=${slug}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    
    if (json.success && json.data && json.data.length > 0) {
      const activeData = json.data[0];
      const cleanDescription = activeData.metaDescription || activeData.description?.replace(/<[^>]*>?/gm, '').substring(0, 160);
      
      return {
        title: activeData.metaTitle || `${activeData.title} | Vantra Travel & Tourism`,
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
    console.error("Failed to fetch package for metadata", err);
  }

  return {
    title: 'Tour Details | Vantra Travel & Tourism',
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
