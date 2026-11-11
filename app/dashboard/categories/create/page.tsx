'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const generateSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  category: string | { _id: string };
}

// Inline "+ Add Subcategory" modal — lets you create a subcategory (optionally nested
// under an existing one) without leaving the category page.
function AddSubcategoryModal({
  categoryId,
  categorySlug,
  existingSubcategories,
  onClose,
  onCreated,
}: {
  categoryId: string;
  categorySlug: string;
  existingSubcategories: Subcategory[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [parent, setParent] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!slugManuallyEdited) setSlug(generateSlug(value));
  };

  const selectedParent = existingSubcategories.find((s) => s._id === parent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Please enter a name');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('name', name);
      if (slug) data.append('slug', slug);
      data.append('category', categoryId);
      data.append('parent', parent);
      data.append('description', description);

      const res = await fetch(`/api/subcategories`, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        onCreated();
        onClose();
      } else {
        setError(json.error || 'Failed to create subcategory');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Subcategory</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Overnight"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug <span className="text-xs font-normal text-gray-400">(auto-generated, editable)</span>
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-300">
              <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r select-none">
                /{categorySlug}/{selectedParent ? `${selectedParent.slug}/` : ''}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
                className="flex-1 px-3 py-2 outline-none text-sm"
                placeholder="e.g. overnight"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nest under <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Top-level (directly under this category)</option>
              {existingSubcategories.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">e.g. pick "Overnight" to create "Liwa" nested underneath it.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-20"
            />
          </div>

          {error && <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-white font-medium ${isSaving ? 'bg-gray-400' : 'bg-[#181E4B] hover:bg-[#12163a]'}`}
            >
              {isSaving ? 'Saving...' : 'Add Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateCategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
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

  // Subcategories under this category (edit mode only)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);

  const fetchSubcategories = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/subcategories?category=${editId}`);
      const json = await res.json();
      if (json.success) setSubcategories(json.data);
    } catch (error) {
      console.error('Failed to fetch subcategories', error);
    }
  };

  useEffect(() => {
    fetchSubcategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Delete this subcategory? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/subcategories?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchSubcategories();
      } else {
        alert(json.error || 'Failed to delete subcategory');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting');
    }
  };

  // Fetch data if editing
  useEffect(() => {
    if (isEditing && editId) {
      const fetchCategory = async () => {
        try {
          const res = await fetch(`/api/categories?id=${editId}`);
          const json = await res.json();
          if (json.success && json.data) {
            setFormData({
              name: json.data.name,
              description: json.data.description,
              metaTitle: json.data.metaTitle || '',
              metaDescription: json.data.metaDescription || '',
              metaKeywords: json.data.metaKeywords || '',
            });
            if (json.data.slug) {
              setSlug(json.data.slug);
              setSlugManuallyEdited(true); // don't auto-overwrite an existing slug
            }
            if (json.data.image) setImagePreview(json.data.image);
          }
        } catch (error) {
           console.error('Failed to fetch category', error);
        }
      };
      fetchCategory();
    }
  }, [isEditing, editId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    if (!slugManuallyEdited) setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!formData.name || !formData.description) {
      setMessage('Please fill in all required fields');
      setIsLoading(false);
      return;
    }
    if (!image && !isEditing) {
        setMessage('Please upload an image');
        setIsLoading(false);
        return;
    }

    try {
      const data = new FormData();
      if (isEditing && editId) data.append('id', editId);
      data.append('name', formData.name);
      if (slug) data.append('slug', slug);
      data.append('description', formData.description);
      data.append('metaTitle', formData.metaTitle);
      data.append('metaDescription', formData.metaDescription);
      data.append('metaKeywords', formData.metaKeywords);
      if (image) data.append('image', image);

      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(`/api/categories`, {
        method: method,
        body: data,
      });

      const json = await res.json();
      if (json.success) {
        setMessage(isEditing ? 'Category updated successfully!' : 'Category created successfully!');
        if (isEditing) {
          // Stay put on edit so the person can keep managing subcategories;
          // only bounce back to the list when creating a brand new category.
        } else {
          setTimeout(() => router.push('/dashboard/manage'), 1500);
        }
      } else {
        setMessage(json.error || 'Failed to save category');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const subcategoryNameById: Record<string, string> = {};
  subcategories.forEach((s) => { subcategoryNameById[s._id] = s.name; });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Category' : 'Create New Category'}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Desert Safari"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
                <span className="ml-2 text-xs font-normal text-gray-400">(auto-generated from name, editable)</span>
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-300">
                <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r select-none">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  placeholder="e.g. desert-safari"
                  className="flex-1 px-3 py-2 outline-none text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, and hyphens. This is the category's root URL.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                placeholder="Describe this category..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
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
                    onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="SEO Title (recommended < 60 chars)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                  <textarea 
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                    placeholder="SEO Description (recommended < 160 chars)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                  <input 
                    type="text" 
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
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
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Category' : 'Create Category')}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
          </form>

          {/* Subcategories management — only once the category exists */}
          {isEditing && editId && (
            <div className="mt-10 pt-8 border-t">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Subcategories</h2>
                <button
                  onClick={() => setShowAddSubcategory(true)}
                  className="text-sm bg-[#181E4B] text-white px-4 py-2 rounded-lg hover:bg-[#12163a] transition"
                >
                  + Add Subcategory
                </button>
              </div>

              {subcategories.length === 0 ? (
                <p className="text-sm text-gray-500">No subcategories yet. e.g. "Dubai", "Morning", "Overnight" — and "Liwa" can nest inside "Overnight".</p>
              ) : (
                <div className="divide-y border rounded-lg overflow-hidden">
                  {subcategories.map((sub) => (
                    <div key={sub._id} className="flex items-center justify-between px-4 py-3 bg-white">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.name}
                          {sub.parent && (
                            <span className="ml-2 text-xs font-normal text-gray-400">
                              nested under {subcategoryNameById[sub.parent] || 'another subcategory'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">/{slug || '...'}/{sub.parent ? '.../' : ''}{sub.slug}/</p>
                      </div>
                      <div className="flex gap-3">
                        
                        <a href={`/dashboard/subcategories/create?id=${sub._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDeleteSubcategory(sub._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {showAddSubcategory && editId && (
        <AddSubcategoryModal
          categoryId={editId}
          categorySlug={slug || ''}
          existingSubcategories={subcategories}
          onClose={() => setShowAddSubcategory(false)}
          onCreated={fetchSubcategories}
        />
      )}
    </div>
  );
}

export default function CreateCategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCategoryContent />
    </Suspense>
  );
}
