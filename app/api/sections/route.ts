import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';      // apna db connect helper
import HomeSection from '@/models/HomeSection';
import '@/models/Package';                       // populate ke liye model register hona zaroori hai

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get('active') === '1';

  const sections = await HomeSection.find(onlyActive ? { isActive: true } : {})
    .sort({ order: 1, createdAt: 1 })
    .populate({ path: 'packages', populate: [{ path: 'category' }, { path: 'subcategory' }] });

  return NextResponse.json({ success: true, data: sections });
}

export async function POST(req: Request) {
  await dbConnect();
  const { heading, packages, order } = await req.json();
  if (!heading?.trim()) {
    return NextResponse.json({ success: false, error: 'Heading required' }, { status: 400 });
  }
  const section = await HomeSection.create({ heading, packages: packages || [], order: order ?? 0 });
  return NextResponse.json({ success: true, data: section });
}