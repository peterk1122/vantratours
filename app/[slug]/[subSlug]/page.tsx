import { Metadata } from 'next';
import SubcategoryPageClient from './SubcategoryPageClient';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Subcategory from '@/models/Subcategory';

interface Props {
  params: Promise<{ slug: string; subSlug: string }>;
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

async function getSubcategory(subSlug: string, categoryId: string | null) {
  try {
    await connectToDatabase();
    const query: any = { slug: subSlug };
    if (categoryId) query.category = categoryId;
    return await Subcategory.findOne(query).lean();
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subSlug } = await params;
  const category: any = await getCategory(slug);
  const subcategory: any = await getSubcategory(subSlug, category?._id || null);

  if (!subcategory) {
    return {
      title: 'Subcategory Not Found',
    };
  }

  return {
    title: subcategory.metaTitle || `${subcategory.name} | Desert Smart Tourism`,
    description: subcategory.metaDescription || subcategory.description,
    keywords: subcategory.metaKeywords || '',
    openGraph: {
      title: subcategory.metaTitle || subcategory.name,
      description: subcategory.metaDescription || subcategory.description,
      images: subcategory.image ? [subcategory.image] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug, subSlug } = await params;
  const category = await getCategory(slug);
  const subcategory = await getSubcategory(subSlug, (category as any)?._id || null);

  return (
    <SubcategoryPageClient
      categorySlug={slug}
      subSlug={subSlug}
      initialCategory={JSON.parse(JSON.stringify(category))}
      initialSubcategory={JSON.parse(JSON.stringify(subcategory))}
    />
  );
}
