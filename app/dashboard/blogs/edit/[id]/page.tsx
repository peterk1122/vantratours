'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import BlogForm from '../../components/BlogForm';
import Link from 'next/link';

export default function EditBlog() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [blogData, setBlogData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
       fetchBlog(params.id as string);
    }
  }, [params.id]);

  const fetchBlog = async (id: string) => {
      try {
          const res = await fetch(`/api/blogs/${id}`);
          const data = await res.json();
          if (data.success) {
              setBlogData(data.data);
          } else {
              setError('Failed to fetch blog post');
          }
      } catch (err) {
          setError('Error fetching blog post data');
      } finally {
          setInitialLoading(false);
      }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
           if (key === 'tags') {
              formData.append(key, JSON.stringify(data[key].split(',').map((t: string) => t.trim()).filter(Boolean)));
           } else {
              formData.append(key, data[key]);
           }
        }
      });

      const res = await fetch(`/api/blogs/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        router.push('/dashboard/blogs');
      } else {
        setError(result.error || 'Failed to update blog post');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading blog data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#181E4B]">Edit Blog Post</h1>
          <Link href="/dashboard/blogs" className="text-gray-500 hover:text-gray-700">
            Cancel
          </Link>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">{error}</div>}
        
        {blogData && <BlogForm initialData={blogData} onSubmit={handleSubmit} loading={loading} />}
      </div>
    </div>
  );
}
