import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Package from '@/models/Package';
import Category from '@/models/Category'; // Import to ensure model registration
import Subcategory from '@/models/Subcategory'; // Import to ensure model registration
import path from 'path';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import { uploadImage } from '@/lib/file-upload';




export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const subcategoryId = searchParams.get('subcategory');
    const slug = searchParams.get('slug');
    const search = searchParams.get('search');
    const id = searchParams.get('id'); // Restored
    const status = searchParams.get('status'); // 'draft' or 'published', dashboard use
    const includeAll = searchParams.get('includeAll'); // dashboard passes 'true' to see drafts too

    let query: any = {};
    
    // Search Logic
    if (search) {
        const searchRegex = new RegExp(search, 'i'); // Case-insensitive
        query.$or = [
            { title: { $regex: searchRegex } },
            { location: { $regex: searchRegex } },
            { tags: { $regex: searchRegex } }
        ];
    }

    if (categoryId) {
        // Check if categoryId is a valid ObjectId, otherwise treat as slug
        if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            query.category = categoryId;
        } else {
             // It's a slug, find category first
             const categoryDoc = await Category.findOne({ slug: categoryId });
             if (categoryDoc) {
                 query.category = categoryDoc._id;
             } else {
                 // Slug not found, maybe return empty or ignore? 
                 // If provided slug is invalid, we should probably return nothing
                 query.category = null; // forcing empty result
             }
        }
    }

    if (subcategoryId) {
        // Check if subcategoryId is a valid ObjectId, otherwise treat as slug
        // (a slug alone isn't guaranteed unique across categories, so this path
        // is mainly for the dashboard where the ObjectId is used)
        if (subcategoryId.match(/^[0-9a-fA-F]{24}$/)) {
            query.subcategory = subcategoryId;
        } else {
            const subcategoryDoc = await Subcategory.findOne({ slug: subcategoryId, ...(query.category ? { category: query.category } : {}) });
            query.subcategory = subcategoryDoc ? subcategoryDoc._id : null;
        }
    }

    if (slug) query = { ...query, slug: slug };
    if (id) query = { ...query, _id: id };

    // Status filtering:
    // - If an explicit status is requested (dashboard filtering by tab), use it.
    // - Else if includeAll=true (dashboard "all packages" view), don't filter by status at all.
    // - Else if fetching a single package by id (editing), don't filter — you must be able to load a draft to edit it.
    // - Otherwise (public site default), only show published packages.
    if (status === 'draft' || status === 'published') {
        query.status = status;
    } else if (includeAll === 'true' || id) {
        // no status filter — return regardless of draft/published
    } else {
        query.status = 'published';
    }

    const packages = await Package.find(query)
      .populate('category', 'name slug') // Populate category name
      .populate('subcategory', 'name slug parent') // Populate subcategory name
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
       return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 });
    }

    // Extract fields to update
    const updateData: any = {};
    
    // Text Fields
    const title = formData.get('title') as string;
    if (title) updateData.title = title;
    
    if (formData.has('price')) updateData.price = Number(formData.get('price'));
    if (formData.get('location')) updateData.location = formData.get('location');
    if (formData.get('duration')) updateData.duration = formData.get('duration');
    if (formData.get('description')) updateData.description = formData.get('description');
    if (formData.get('category')) updateData.category = formData.get('category');
    // Subcategory is optional — an explicitly empty value clears it back to "None"
    if (formData.has('subcategory')) {
        const subcategoryVal = formData.get('subcategory') as string;
        updateData.subcategory = subcategoryVal ? subcategoryVal : null;
    }
    // Draft/Published status
    if (formData.has('status')) {
        const statusVal = formData.get('status') as string;
        if (statusVal === 'draft' || statusVal === 'published') {
            updateData.status = statusVal;
        }
    }
    if (formData.get('includes')) updateData.includes = formData.get('includes');
    if (formData.get('highlights')) updateData.highlights = formData.get('highlights');
    if (formData.get('itinerary')) updateData.itinerary = formData.get('itinerary');
    if (formData.has('imageAlt')) updateData.imageAlt = formData.get('imageAlt') as string;
    // Allow updating slug manually
    if (formData.get('slug')) {
        const newSlug = (formData.get('slug') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (newSlug) updateData.slug = newSlug;
    }
    if (formData.get('minAge')) updateData.minAge = Number(formData.get('minAge'));
    if (formData.get('maxAge')) updateData.maxAge = Number(formData.get('maxAge'));
    if (formData.has('durationDays')) updateData.durationDays = Number(formData.get('durationDays'));
    if (formData.has('durationHours')) updateData.durationHours = Number(formData.get('durationHours'));
    if (formData.has('metaTitle')) updateData.metaTitle = formData.get('metaTitle') as string;
    if (formData.has('metaDescription')) updateData.metaDescription = formData.get('metaDescription') as string;
    if (formData.has('metaKeywords')) updateData.metaKeywords = formData.get('metaKeywords') as string;


    // Complex JSON fields
    if (formData.get('tags')) {
        try {
            updateData.tags = JSON.parse(formData.get('tags') as string);
        } catch (e) { console.error("Error parsing tags", e); }
    }
    if (formData.get('features')) {
        try {
            updateData.features = JSON.parse(formData.get('features') as string);
        } catch (e) { console.error("Error parsing features", e); }
    }
    if (formData.get('tourOptions')) {
        try {
            updateData.tourOptions = JSON.parse(formData.get('tourOptions') as string);
        } catch (e) { console.error("Error parsing tourOptions", e); }
    }
    
    // Handle Image Update
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
        updateData.image = await uploadImage(imageFile);
    }

    // Handle Gallery Update
    // We expect 'existingGallery' (JSON array of URLs) and/or 'gallery' (File[])
    const existingGalleryJson = formData.get('existingGallery') as string;
    let finalGallery: string[] = [];

    if (existingGalleryJson) {
        try {
            finalGallery = JSON.parse(existingGalleryJson);
        } catch (e) {
            console.error("Error parsing existingGallery", e);
        }
    } else {
         // If not sent, maybe we shouldn't wipe it? 
         // But usually if the frontend supports it, it sends the current state.
         // If we strictly follow the form, if 'existingGallery' is missing, it means none?
         // For safety, if the field is missing entirely, we might want to fetch existing?
         // But let's assume frontend sends what it wants to keep.
         // To be safe, let's fetch current if we are unsure, OR assume frontend sends `existingGallery`.
         // We will update frontend to send `existingGallery`.
    }

    const galleryFiles = formData.getAll('gallery') as File[];
    if (galleryFiles && galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        if (file.size > 0) {
             const url = await uploadImage(file);
             finalGallery.push(url);
        }
      }
    }
    
    // Only update gallery if we have changes (or if field was explicitly sent as empty list)
    if (formData.has('existingGallery') || (galleryFiles && galleryFiles.length > 0)) {
         updateData.gallery = finalGallery;
    }

    // Handle galleryAlts update
    if (formData.has('galleryAlts')) {
        try {
            updateData.galleryAlts = JSON.parse(formData.get('galleryAlts') as string);
        } catch (e) { console.error('Error parsing galleryAlts', e); }
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, { new: true });
    
    return NextResponse.json({ success: true, data: updatedPackage });

  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json({ success: false, error: 'Failed to update package' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    // Extract fields
    const title = formData.get('title') as string;
    const price = Number(formData.get('price'));
    const location = formData.get('location') as string;
    const duration = formData.get('duration') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('category') as string;
    const subcategoryId = (formData.get('subcategory') as string) || null;
    const statusInput = formData.get('status') as string;
    const status = (statusInput === 'draft' || statusInput === 'published') ? statusInput : 'published';
    const includes = formData.get('includes') as string;
    const highlights = formData.get('highlights') as string;
    const imageFile = formData.get('image') as File;
    const galleryFiles = formData.getAll('gallery') as File[];
    const metaTitle = formData.get('metaTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const metaKeywords = formData.get('metaKeywords') as string;

    // Validate fields
    const missing: string[] = [];
    if (!title) missing.push('title');
    if (price === undefined || price === null || isNaN(price)) missing.push('price');
    if (!location) missing.push('location');
    if (!duration) missing.push('duration');
    if (!description) missing.push('description');
    if (!categoryId) missing.push('categoryId');
    if (!imageFile) missing.push('image');

    if (missing.length > 0) {
      return NextResponse.json({ success: false, error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Upload Main Image
    const imageUrl = await uploadImage(imageFile);

    // Upload Gallery Images
    const galleryUrls: string[] = [];
    if (galleryFiles && galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        if (file.size > 0) {
             const url = await uploadImage(file);
             galleryUrls.push(url);
        }
      }
    }

    // Create Slug
    // Parse Features
    const featuresJson = formData.get('features') as string;
    let features = [];
    try {
        if (featuresJson) {
            features = JSON.parse(featuresJson);
        }
    } catch (e) {
        console.error("Failed to parse features", e);
    }
    
    // Default fallback for features
    if (!features || features.length === 0) {
        features = [
            { icon: '🎭', title: 'Experience Duration:', description: duration },
            { icon: '🚗', title: 'Transportation:', description: 'With Pickup and Drop-off' },
            { icon: '💬', title: 'Available Languages:', description: 'English, Arabic' },
            { icon: '⏰', title: 'Best Time to Visit:', description: 'Morning, Evening' }
        ];
    }

    // Parse Tour Options
    const tourOptionsJson = formData.get('tourOptions') as string;
    let tourOptions = [];
    try {
        if (tourOptionsJson) {
            tourOptions = JSON.parse(tourOptionsJson);
        }
    } catch (e) {
        console.error("Failed to parse tourOptions", e);
    }

    // Extract extra fields
    const durationDays = Number(formData.get('durationDays'));
    const durationHours = Number(formData.get('durationHours'));
    const minAge = formData.get('minAge') ? Number(formData.get('minAge')) : undefined;
    const maxAge = formData.get('maxAge') ? Number(formData.get('maxAge')) : undefined;

    // Itinerary (Rich Text String)
    const itinerary = formData.get('itinerary') as string;

    // Parse Extra Services (Legacy/Global)
    const extraServicesJson = formData.get('extraServices') as string;
    let extraServices = [];
    try {
        if (extraServicesJson) {
            extraServices = JSON.parse(extraServicesJson);
        }
    } catch (e) {
        console.error("Failed to parse extraServices", e);
    }
    
    // Parse Tags
    const tagsJson = formData.get('tags') as string;
    let tags: string[] = [];
    try {
        if (tagsJson) {
            tags = JSON.parse(tagsJson);
        }
    } catch (e) {
        console.error("Failed to parse tags", e);
    }

    const imageAlt = (formData.get('imageAlt') as string) || '';

    // Parse galleryAlts
    const galleryAltsJson = formData.get('galleryAlts') as string;
    let galleryAlts: string[] = [];
    try {
        if (galleryAltsJson) galleryAlts = JSON.parse(galleryAltsJson);
    } catch (e) { console.error('Failed to parse galleryAlts', e); }

    // Use user-provided slug or auto-generate from title
    const customSlug = formData.get('slug') as string;
    const slug = customSlug
      ? customSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newPackage = await Package.create({
      title,
      slug,
      category: categoryId,
      subcategory: subcategoryId,
      status,
      image: imageUrl,
      imageAlt,
      price,
      location,
      duration, // String display
      durationDays,
      durationHours,
      minAge,
      maxAge,
      description,
      peopleGoing: Math.floor(Math.random() * 100) + 10,
      rating: 5,
      includes: includes || '',
      highlights: highlights || '',
      tourOptions: tourOptions,
      features: features, 
      itinerary: itinerary,
      extraServices: extraServices,
      tags: tags,
      gallery: galleryUrls,
      galleryAlts: galleryAlts,
      metaTitle: metaTitle,
      metaDescription: metaDescription,
      metaKeywords: metaKeywords,
    });

    return NextResponse.json({ success: true, data: newPackage }, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ success: false, error: 'Failed to create package' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing package ID' }, { status: 400 });
    }

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete package' }, { status: 500 });
  }
}
