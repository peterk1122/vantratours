import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Subcategory from '@/models/Subcategory';
import Category from '@/models/Category'; // Import to ensure model registration
import { uploadImage } from '@/lib/file-upload';

const toSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('category'); // filter by root category
    const parentId = searchParams.get('parent'); // filter by parent subcategory ('null' = top-level only)
    const slug = searchParams.get('slug'); // look up a single subcategory by slug (pair with category/parent)

    if (id) {
      const subcategory = await Subcategory.findById(id).populate('category', 'name slug');
      if (!subcategory) {
        return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: subcategory });
    }

    const query: any = {};

    if (categoryId) {
      if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = categoryId;
      } else {
        const categoryDoc = await Category.findOne({ slug: categoryId });
        query.category = categoryDoc ? categoryDoc._id : null;
      }
    }

    if (parentId === 'null') {
      query.parent = null;
    } else if (parentId) {
      query.parent = parentId;
    }

    if (slug) {
      query.slug = slug;
      const subcategory = await Subcategory.findOne(query).populate('category', 'name slug');
      if (!subcategory) {
        return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: subcategory });
    }

    const subcategories = await Subcategory.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const categoryId = formData.get('category') as string;
    const parentId = (formData.get('parent') as string) || null;
    const description = (formData.get('description') as string) || '';
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const metaKeywords = formData.get('metaKeywords') as string;
    const file = formData.get('image') as File;

    if (!name || !categoryId) {
      return NextResponse.json({ success: false, error: 'Name and category are required' }, { status: 400 });
    }

    const customSlug = formData.get('slug') as string;
    const slug = customSlug ? toSlug(customSlug) : toSlug(name);

    let image: string | undefined;
    if (file && file.size > 0) {
      image = await uploadImage(file);
    }

    const subcategory = await Subcategory.create({
      name,
      slug,
      category: categoryId,
      parent: parentId || null,
      description,
      image,
      metaTitle,
      metaDescription,
      metaKeywords,
    });

    return NextResponse.json({ success: true, data: subcategory }, { status: 201 });
  } catch (error: any) {
    // Duplicate slug within the same category+parent
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A subcategory with this URL slug already exists under the selected parent' },
        { status: 409 }
      );
    }
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ success: false, error: 'Failed to create subcategory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Subcategory ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (formData.has('name')) updateData.name = formData.get('name');
    if (formData.has('description')) updateData.description = formData.get('description');
    if (formData.has('category')) updateData.category = formData.get('category');
    if (formData.has('metaTitle')) updateData.metaTitle = formData.get('metaTitle');
    if (formData.has('metaDescription')) updateData.metaDescription = formData.get('metaDescription');
    if (formData.has('metaKeywords')) updateData.metaKeywords = formData.get('metaKeywords');

    if (formData.has('parent')) {
      const parentVal = formData.get('parent') as string;
      updateData.parent = parentVal ? parentVal : null;
    }

    if (formData.get('slug')) {
      const newSlug = toSlug(formData.get('slug') as string);
      if (newSlug) updateData.slug = newSlug;
    }

    const file = formData.get('image') as File;
    if (file && file.size > 0) {
      updateData.image = await uploadImage(file);
    }

    const updated = await Subcategory.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A subcategory with this URL slug already exists under the selected parent' },
        { status: 409 }
      );
    }
    console.error('Error updating subcategory:', error);
    return NextResponse.json({ success: false, error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing subcategory ID' }, { status: 400 });
    }

    // Guard against orphaning nested subcategories underneath this one
    const childCount = await Subcategory.countDocuments({ parent: id });
    if (childCount > 0) {
      return NextResponse.json(
        { success: false, error: 'This subcategory has nested subcategories under it. Delete or reassign those first.' },
        { status: 409 }
      );
    }

    const deleted = await Subcategory.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete subcategory' }, { status: 500 });
  }
}
