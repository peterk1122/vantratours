import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OfferSection from '@/models/OfferSection';

// Only allow safe link types (blocks things like javascript:)
const cleanLink = (value: any): string => {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (/^(\/|https?:\/\/|tel:|mailto:)/i.test(v)) return v;
  return '';
};

// Images must come from our own upload route or a normal web address
const cleanImage = (value: any): string => {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (v.startsWith('/api/offers/image/') || /^https?:\/\//i.test(v)) return v;
  return '';
};

async function getOrCreateSection() {
  let section = await OfferSection.findOne();
  if (!section) {
    section = await OfferSection.create({});
  }
  return section;
}

export async function GET() {
  try {
    await connectToDatabase();
    const section = await getOrCreateSection();
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { heading, subheading, offers } = body;

    const section = await getOrCreateSection();

    section.heading = typeof heading === 'string' ? heading : '';
    section.subheading = typeof subheading === 'string' ? subheading : '';

    if (Array.isArray(offers)) {
      section.offers = offers
        .map((offer: any, index: number) => ({
          image: cleanImage(offer.image),
          link: cleanLink(offer.link),
          alt: typeof offer.alt === 'string' ? offer.alt : '',
          order: offer.order ?? index,
        }))
        .filter((offer: any) => offer.image);
    }

    await section.save();

    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error('Error updating offers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update offers' },
      { status: 500 }
    );
  }
}
