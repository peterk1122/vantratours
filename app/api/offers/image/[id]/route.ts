import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import OfferImage from '@/models/OfferImage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return new NextResponse('Not found', { status: 404 });
    }

    await connectToDatabase();
    const image = await OfferImage.findById(id);

    if (!image) {
      return new NextResponse('Not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
      headers: {
        'Content-Type': image.contentType,
        // Every upload gets its own id, so the image at this address never changes
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving offer image:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
