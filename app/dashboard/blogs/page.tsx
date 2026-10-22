'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function BlogsDashboard() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch(`/api/blogs`);
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (blog: any) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      
      const res = await fetch(`/api/blogs/${blog._id}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(blogs.map(b => b._id === blog._id ? { ...b, status: newStatus } : b));
      }
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(blogs.filter(b => b._id !== id));
      }
    } catch (error) {
      console.error('Error deleting blog', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-6">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              &larr; Back to Dashboard
            </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#181E4B]">Manage Blogs</h1>
          <Link href="/dashboard/blogs/create" className="bg-[#DF6951] text-white px-6 py-3 rounded-lg hover:bg-[#c85a43] transition">
            + New Blog Post
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No blog posts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                        <div className="text-xs text-gray-500 max-w-[300px] truncate">{blog.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          onClick={() => handleToggleStatus(blog)}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 transition ${
                            blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {blog.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/dashboard/blogs/edit/${blog._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(blog._id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
