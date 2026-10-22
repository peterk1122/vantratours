'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';

const BlogClient = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs?status=published');
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header color="bg-transparent" />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="/images/disert.webp" 
            alt="Desert Background" 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto mt-20">
          <p className="text-sm md:text-base uppercase tracking-[0.3em] mb-4 opacity-90 font-medium">
            Stories & Insights
          </p>
          <h1 className="text-5xl md:text-7xl font-serif italic font-normal mb-6">
            Travel Journal
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-2xl mx-auto">
            Discover the hidden gems, culture, and adventures of the UAE through our curated stories.
          </p>
        </div>
      </section>

      {/* Blog Posts Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
           <div className="text-center text-gray-500 py-20">Loading travels stories...</div>
        ) : posts.length === 0 ? (
           <div className="text-center text-gray-500 py-20">No stories published yet. Check back soon!</div>
        ) : (
          <div className="flex flex-col gap-24">
            {posts.map((post, index) => (
              <article 
                key={post._id} 
                className={`flex flex-col lg:flex-row gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Image Container */}
                <Link href={`/blog/${post.slug}`} className="w-full lg:w-1/2 relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl group block cursor-pointer">
                  <Image 
                    src={post.coverImage || "/images/disert.webp"}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                      {post.tags.map((tag: string) => (
                        <span key={tag} className="bg-white/90 backdrop-blur-sm text-[#DF6951] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>

                {/* Content Container */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#181E4B] mb-6 leading-tight hover:text-[#DF6951] transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  <div className="w-20 h-1 bg-[#DF6951] mb-8" />
                  
                  <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                    <p>{post.excerpt || 'Read more about this amazing journey...'}</p>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-400">
                    <span className='font-medium text-[#DF6951]'>By {post.author || 'Desert Smart Tourism'}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Newsletter / CTA */}
      <section className="bg-[#FFF8F6] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-[#181E4B] mb-4">
            Start Your Own Adventure
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Inspired by our stories? Book your next unforgettable experience in Dubai with us today.
          </p>
          <Link 
            href="/packages"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#DF6951] text-white font-semibold rounded-full shadow-lg hover:bg-[#c85a43] transition-all transform hover:-translate-y-1"
          >
            Explore Packages
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogClient;
