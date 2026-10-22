'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function BlogForm({ initialData = null, onSubmit, loading }: any) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    status: initialData?.status || 'draft',
    author: initialData?.author || 'Desert Smart Tourism',
    tags: initialData?.tags?.join(', ') || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
  });
  
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, coverImage: file });
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
          <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="auto-generated if empty" className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
        <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Short summary..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <div className="bg-white">
            <ReactQuill theme="snow" value={formData.content} onChange={handleEditorChange} modules={modules} className="h-64 mb-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
          {initialData?.coverImage && !file && (
              <p className="text-sm text-gray-500 mt-1">Current: {initialData.coverImage.split('/').pop()}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
          <input type="text" name="author" value={formData.author} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="Culture, Adventure..." className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} className="w-full border rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={loading} className={`px-8 py-3 rounded-lg text-white font-medium ${loading ? 'bg-[#f0a99c]' : 'bg-[#DF6951] hover:bg-[#c85a43]'} transition`}>
          {loading ? 'Saving...' : (initialData ? 'Update Blog Post' : 'Publish Blog Post')}
        </button>
      </div>
    </form>
  );
}
