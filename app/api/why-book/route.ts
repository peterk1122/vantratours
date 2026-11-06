import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import WhyBook from '@/models/WhyBook';
import { uploadImage } from '@/lib/file-upload';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await WhyBook.findOne({ key: 'main' });
    return NextResponse.json({
      success: true,
      data: doc || { heading: 'Why book with us?', items: [] },
    });
  } catch (error) {
    console.error('Error fetching why-book:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

// Dashboard sends: heading, items (JSON list of {image,title,description}),
// and optional new image files named image_0, image_1, ...
export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const heading = ((formData.get('heading') as string) || '').trim() || 'Why book with us?';

    let items: any[] = [];
    try {
      items = JSON.parse((formData.get('items') as string) || '[]');
    } catch (e) {
      console.error('Error parsing items', e);
    }

    for (let i = 0; i < items.length; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      if (file && typeof file !== 'string' && file.size > 0) {
        items[i].image = await uploadImage(file);
      }
    }

    const saved = await WhyBook.findOneAndUpdate(
      { key: 'main' },
      { key: 'main', heading, items },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving why-book:', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}
