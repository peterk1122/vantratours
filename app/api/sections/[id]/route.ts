import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HomeSection from '@/models/HomeSection';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const section = await HomeSection.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json({ success: true, data: section });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  await HomeSection.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}