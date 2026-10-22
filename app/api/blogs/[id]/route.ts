import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { uploadImage } from '@/lib/file-upload';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const params = await props.params;
    
    const blog = await Blog.findById(params.id);
    
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blog' }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const params = await props.params;
    const formData = await request.formData();
    
    const updateData: any = {};
    
    // Check which fields are provided
    if (formData.has('title')) updateData.title = formData.get('title') as string;
    if (formData.has('slug')) updateData.slug = formData.get('slug') as string;
    if (formData.has('excerpt')) updateData.excerpt = formData.get('excerpt') as string;
    if (formData.has('content')) updateData.content = formData.get('content') as string;
    if (formData.has('status')) updateData.status = formData.get('status') as string;
    if (formData.has('author')) updateData.author = formData.get('author') as string;
    if (formData.has('metaTitle')) updateData.metaTitle = formData.get('metaTitle') as string;
    if (formData.has('metaDescription')) updateData.metaDescription = formData.get('metaDescription') as string;

    const imageFile = formData.get('coverImage') as File;
    if (imageFile && imageFile.size > 0) {
      updateData.coverImage = await uploadImage(imageFile);
    }

    if (formData.has('tags')) {
      try {
        updateData.tags = JSON.parse(formData.get('tags') as string);
      } catch (e) {
        console.error('Failed to parse tags', e);
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(params.id, updateData, { new: true });
    
    if (!updatedBlog) {
        return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const params = await props.params;
    
    const deletedBlog = await Blog.findByIdAndDelete(params.id);

    if (!deletedBlog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete blog' }, { status: 500 });
  }
}
