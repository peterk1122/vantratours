'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface SubcategoryOption {
  _id: string;
  name: string;
  category: string | { _id: string };
  parent: string | null;
}

const generateSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function CreateSubcategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditing = !!editId;
  const preselectedCategory = searchParams.get('category'); // allows deep-linking from the category page

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<SubcategoryOption[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: preselectedCategory || '',
    parent: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`https://desertsmarttourism.com/api/categories`);
        const json = await res.json();
        if (json.success) setCategories(json.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all subcategories so we can populate "Nest under" once a category is chosen
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(`https://desertsmarttourism.com/api/subcategories`);
        const json = await res.json();
        if (json.success) setAllSubcategories(json.data);
      } catch (err) {
        console.error('Failed to fetch subcategories', err);
      }
    };
    fetchSubcategories();
  }, []);

  // Fetch data if editing
  useEffect(() => {
    if (!isEditing || !editId) return;
    const fetchSubcategory = async () => {
      try {
        const res = await fetch(`https://desertsmarttourism.com/api/subcategories?id=${editId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const sub = json.data;
          setFormData({
            name: sub.name || '',
            description: sub.description || '',
            category: sub.category?._id || sub.category || '',
            parent: sub.parent || '',
            metaTitle: sub.metaTitle || '',
            metaDescription: sub.metaDescription || '',
            metaKeywords: sub.metaKeywords || '',
          });
          if (sub.slug) {
            setSlug(sub.slug);
            setSlugManuallyEdited(true);
          }
          if (sub.image) setImagePreview(sub.image);
        }
      } catch (error) {
        console.error('Failed to fetch subcategory', error);
      }
    };
    fetchSubcategory();
  }, [isEditing, editId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Only offer subcategories that belong to the chosen category as nesting parents,
  // and never let something nest under itself.
  const parentOptions = allSubcategories.filter((s) => {
    const sameCategory = (typeof s.category === 'string' ? s.category : s.category?._id) === formData.category;
    const notSelf = s._id !== editId;
    return sameCategory && notSelf;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!formData.name || !formData.category) {
      setMessage('Please provide a name and select a category');
      setIsLoading(false);
      return;
    }

    try {
      const data = new FormData();
      if (isEditing && editId) data.append('id', editId);
      data.append('name', formData.name);
      if (slug) data.append('slug', slug);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('parent', formData.parent); // empty string clears it to top-level
      data.append('metaTitle', formData.metaTitle);
      data.append('metaDescription', formData.metaDescription);
      data.append('metaKeywords', formData.metaKeywords);
      if (image) data.append('image', image);

      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(`https://desertsmarttourism.com/api/subcategories`, {
        method,
        body: data,
      });

      const json = await res.json();
      if (json.success) {
        setMessage(isEditing ? 'Subcategory updated successfully!' : 'Subcategory created successfully!');
        setTimeout(() => router.push('/dashboard/manage'), 1200);
      } else {
        setMessage(json.error || 'Failed to save subcategory');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c._id === formData.category);
  const selectedParent = parentOptions.find((p) => p._id === formData.parent);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditing ? 'Edit Subcategory' : 'Create New Subcategory'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, parent: '' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nest under
                  <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  disabled={!formData.category}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Top-level (directly under the category)</option>
                  {parentOptions.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  e.g. select "Overnight" here to create "Liwa" nested underneath it.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Overnight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
                <span className="ml-2 text-xs font-normal text-gray-400">(auto-generated, editable)</span>
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-300">
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r select-none">
                  /{selectedCategory?.slug || 'category'}/{selectedParent ? `${generateSlug(selectedParent.name)}/` : ''}
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  placeholder="e.g. liwa"
                  className="flex-1 px-3 py-2 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                placeholder="Describe this subcategory..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
                <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border rounded-lg p-2"
              />
              {imagePreview && (
                <div className="mt-4 relative w-full h-48 rounded-lg overflow-hidden border">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Metadata</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="SEO Title (recommended < 60 chars)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                    placeholder="SEO Description (recommended < 160 chars)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Keywords (comma separated)"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-transform hover:-translate-y-1 ${
                isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-[#F85E46] to-[#ff8f7d]'
              }`}
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Subcategory' : 'Create Subcategory')}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CreateSubcategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateSubcategoryContent />
    </Suspense>
  );
}
