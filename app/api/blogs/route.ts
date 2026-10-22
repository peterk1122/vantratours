import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { uploadImage } from '@/lib/file-upload';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const slug = searchParams.get('slug');

    let query: any = {};
    if (status) query.status = status;
    if (slug) query.slug = slug;

    const blogs = await Blog.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const status = (formData.get('status') as string) || 'draft';
    const imageFile = formData.get('coverImage') as File;
    const author = formData.get('author') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    let coverImageUrl = '';
    if (imageFile && imageFile.size > 0) {
      coverImageUrl = await uploadImage(imageFile);
    }

    let tags: string[] = [];
    const tagsJson = formData.get('tags') as string;
    try {
      if (tagsJson) tags = JSON.parse(tagsJson);
    } catch (e) {
      console.error('Failed to parse tags', e);
    }

    const newBlog = await Blog.create({
      title,
      excerpt,
      content,
      status,
      author: author || 'Desert Smart Tourism',
      coverImage: coverImageUrl,
      tags,
      metaTitle,
      metaDescription,
    });

    return NextResponse.json({ success: true, data: newBlog }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to create blog' }, { status: 500 });
  }
}
