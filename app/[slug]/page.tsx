import { Metadata } from 'next';
import CategoryPageClient from './CategoryPageClient';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  try {
    await connectToDatabase();
    return await Category.findOne({ slug }).lean();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category: any = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: category.metaTitle || `${category.name} | Desert Smart Tourism`,
    description: category.metaDescription || category.description,
    keywords: category.metaKeywords || '',
    openGraph: {
      title: category.metaTitle || category.name,
      description: category.metaDescription || category.description,
      images: [category.image],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  return <CategoryPageClient slug={slug} initialCategory={JSON.parse(JSON.stringify(category))} />;
}
