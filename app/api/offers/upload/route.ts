import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import OfferImage from '@/models/OfferImage';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No image received' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Please upload a JPG, PNG, WebP, GIF or AVIF image' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image is too large. Maximum size is 5 MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const saved = await OfferImage.create({
      data: buffer,
      contentType: file.type,
      filename: file.name || '',
    });

    return NextResponse.json({ success: true, url: `/api/offers/image/${saved._id}` });
  } catch (error: any) {
    console.error('Error uploading offer image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
