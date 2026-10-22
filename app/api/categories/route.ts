import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import path from 'path';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug'); // New: support query by slug

    // Prioritize ID if present, else check slug
    if (id) {
        const category = await Category.findById(id);
        if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: category });
    }
    
    if (slug) {
        const category = await Category.findOne({ slug });
        if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: category });
    }

    const categories = await Category.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const id = formData.get('id') as string;
    
    if (!id) {
       return NextResponse.json({ success: false, error: 'Category ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (formData.has('name')) updateData.name = formData.get('name');
    if (formData.has('description')) updateData.description = formData.get('description');
    if (formData.has('metaTitle')) updateData.metaTitle = formData.get('metaTitle');
    if (formData.has('metaDescription')) updateData.metaDescription = formData.get('metaDescription');
    if (formData.has('metaKeywords')) updateData.metaKeywords = formData.get('metaKeywords');

    // Allow editing the URL slug directly (falls back to nothing if left blank)
    if (formData.get('slug')) {
        const newSlug = toSlug(formData.get('slug') as string);
        if (newSlug) updateData.slug = newSlug;
    }
    
    // Image handling - simpler here, if provided update it
    const file = formData.get('image') as File;
    if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const compressedBuffer = await sharp(buffer)
        .resize(800, null, { withoutEnlargement: true }) 
        .jpeg({ quality: 80 })
        .toBuffer();

        const filename = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        // Ensure dir exists (it should)
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, compressedBuffer);
        updateData.image = `https://desertsmarttourism.com/api/uploads/${filename}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updatedCategory });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const metaKeywords = formData.get('metaKeywords') as string;
    const file = formData.get('image') as File;

    if (!name || !description || !file) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compress and resize image using sharp
    const compressedBuffer = await sharp(buffer)
      .resize(800, null, { // Resize width to 800px, maintain aspect ratio
        withoutEnlargement: true
      }) 
      .jpeg({ quality: 80 })
      .toBuffer();

    const filename = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    // Ensure the uploads directory exists - though we create it in setup, good to be safe or rely on it existing
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, compressedBuffer);

    const imageUrl = `https://desertsmarttourism.com/api/uploads/${filename}`;

    // Use a user-provided slug if given, otherwise auto-generate from the name
    const customSlug = formData.get('slug') as string;
    const slug = customSlug ? toSlug(customSlug) : toSlug(name);

    const category = await Category.create({
      name,
      slug,
      description,
      image: imageUrl,
      metaTitle,
      metaDescription,
      metaKeywords,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing category ID' }, { status: 400 });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
