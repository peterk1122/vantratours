'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ManageContentPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'categories' | 'subcategories'>('packages');
  const [packages, setPackages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // includeAll=true so the dashboard also receives draft packages
      const pkgRes = await fetch(`https://desertsmarttourism.com/api/packages?includeAll=true`);
      const pkgJson = await pkgRes.json();
      if (pkgJson.success) setPackages(pkgJson.data);

      const catRes = await fetch(`https://desertsmarttourism.com/api/categories`);
      const catJson = await catRes.json();
      if (catJson.success) setCategories(catJson.data);

      const subcatRes = await fetch(`https://desertsmarttourism.com/api/subcategories`);
      const subcatJson = await subcatRes.json();
      if (subcatJson.success) setSubcategories(subcatJson.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'packages' | 'categories' | 'subcategories') => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
      const res = await fetch(`https://desertsmarttourism.com/api/${type}?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('Deleted successfully');
        fetchData(); // Refresh list
      } else {
        alert('Failed to delete: ' + json.error);
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('An error occurred during deletion');
    }
  };

  // Publish / Unpublish a package without opening the edit form
  const handleToggleStatus = async (pkg: any) => {
    const newStatus = pkg.status === 'draft' ? 'published' : 'draft';
    const question =
      newStatus === 'draft'
        ? `Unpublish "${pkg.title}"? It will be hidden from the live site.`
        : `Publish "${pkg.title}"? It will appear on the live site.`;
    if (!confirm(question)) return;

    setUpdatingId(pkg._id);
    try {
      const data = new FormData();
      data.append('id', pkg._id);
      data.append('status', newStatus);

      const res = await fetch(`https://desertsmarttourism.com/api/packages`, { method: 'PUT', body: data });
      const json = await res.json();
      if (json.success) {
        setPackages((prev) => prev.map((p) => (p._id === pkg._id ? { ...p, status: newStatus } : p)));
      } else {
        alert('Failed to update status: ' + json.error);
      }
    } catch (err) {
      console.error('Status update error', err);
      alert('An error occurred while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Build a lookup so nested subcategories can show "Parent Name" instead of just an ID
  const subcategoryNameById: Record<string, string> = {};
  subcategories.forEach((s) => { subcategoryNameById[s._id] = s.name; });

  // Older packages have no status stored, so anything that isn't "draft" counts as published
  const isDraft = (pkg: any) => pkg.status === 'draft';
  const draftCount = packages.filter(isDraft).length;
  const publishedCount = packages.length - draftCount;
  const visiblePackages = packages.filter((pkg) => {
    if (statusFilter === 'draft') return isDraft(pkg);
    if (statusFilter === 'published') return !isDraft(pkg);
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#181E4B]">Manage Content</h1>
        <div className="flex gap-4">
             <Link href="/dashboard/create" className="bg-[#F85E46] text-white px-4 py-2 rounded-lg hover:bg-[#e54d36] transition">
                + New Package
             </Link>
             <Link href="/dashboard/categories/create" className="bg-[#181E4B] text-white px-4 py-2 rounded-lg hover:bg-[#12163a] transition">
                + New Category
             </Link>
             <Link href="/dashboard/subcategories/create" className="bg-white border border-[#181E4B] text-[#181E4B] px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                + New Subcategory
             </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('packages')}
          className={`pb-4 px-2 text-lg font-medium transition-colors ${activeTab === 'packages' ? 'border-b-2 border-[#F85E46] text-[#F85E46]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Packages
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`pb-4 px-2 text-lg font-medium transition-colors ${activeTab === 'categories' ? 'border-b-2 border-[#F85E46] text-[#F85E46]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('subcategories')}
          className={`pb-4 px-2 text-lg font-medium transition-colors ${activeTab === 'subcategories' ? 'border-b-2 border-[#F85E46] text-[#F85E46]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Subcategories
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === 'packages' && (
            <div>
              {/* Status filter */}
              <div className="flex gap-2 px-6 py-4 border-b border-gray-100">
                {([
                  { key: 'all', label: `All (${packages.length})` },
                  { key: 'published', label: `Published (${publishedCount})` },
                  { key: 'draft', label: `Drafts (${draftCount})` },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      statusFilter === f.key ? 'bg-[#181E4B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700">Image</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Subcategory</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                      <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visiblePackages.map((pkg) => (
                      <tr key={pkg._id} className={`hover:bg-gray-50 ${isDraft(pkg) ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="relative w-16 h-12 rounded-md overflow-hidden bg-gray-100">
                            {pkg.image && <Image src={pkg.image?.startsWith('/api/') ? `https://desertsmarttourism.com${pkg.image}` : pkg.image} alt={pkg.title} fill className="object-cover" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{pkg.title}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              isDraft(pkg) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isDraft(pkg) ? 'Draft' : 'Published'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{pkg.category?.name || 'Uncategorized'}</td>
                        <td className="px-6 py-4 text-gray-600">{pkg.subcategory?.name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{pkg.price} AED</td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            disabled={updatingId === pkg._id}
                            className={`font-medium text-sm disabled:opacity-50 ${
                              isDraft(pkg) ? 'text-green-600 hover:text-green-800' : 'text-amber-600 hover:text-amber-800'
                            }`}
                          >
                            {updatingId === pkg._id ? 'Saving...' : isDraft(pkg) ? 'Publish' : 'Unpublish'}
                          </button>
                          <Link 
                             href={`/dashboard/create?id=${pkg._id}`}
                             className="text-blue-600 hover:text-blue-800 font-medium text-sm ml-4"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => handleDelete(pkg._id, 'packages')}
                            className="text-red-500 hover:text-red-700 font-medium text-sm ml-4"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visiblePackages.length === 0 && (
                       <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No packages found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Image</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Description</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                         <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                           {cat.image && <Image src={cat.image?.startsWith('/api/') ? `https://desertsmarttourism.com${cat.image}` : cat.image} alt={cat.name} fill className="object-cover" />}
                         </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{cat.description}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link 
                           href={`/dashboard/categories/create?id=${cat._id}`}
                           className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(cat._id, 'categories')}
                          className="text-red-500 hover:text-red-700 font-medium text-sm ml-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'subcategories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Nested Under</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">URL</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subcategories.map((sub) => (
                    <tr key={sub._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{sub.name}</td>
                      <td className="px-6 py-4 text-gray-600">{sub.category?.name || 'Uncategorized'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {sub.parent ? (subcategoryNameById[sub.parent] || 'Parent subcategory') : <span className="text-gray-300">Top-level</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        /{sub.category?.slug}/{sub.parent ? '.../' : ''}{sub.slug}/
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                           href={`/dashboard/subcategories/create?id=${sub._id}`}
                           className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(sub._id, 'subcategories')}
                          className="text-red-500 hover:text-red-700 font-medium text-sm ml-4"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subcategories.length === 0 && (
                     <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No subcategories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
