import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { notFound } from 'next/navigation';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connectToDatabase();
  const params = await props.params;
  const post = await Blog.findOne({ slug: params.slug });

  if (!post) {
    return { title: 'Post Not Found | Desert Smart Tourism' };
  }

  return {
    title: post.metaTitle || `${post.title} | Desert Smart Tourism`,
    description: post.metaDescription || post.excerpt,
  };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  await connectToDatabase();
  const params = await props.params;
  const post = await Blog.findOne({ slug: params.slug });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Header color="bg-transparent" />
      
      {/* Hero Header */}
      <section className="relative h-[50vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src={post.coverImage || "/images/disert.webp"} 
            alt={post.title} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto mt-20">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
             {post.tags?.map((tag: string) => (
                <span key={tag} className="bg-[#DF6951] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {tag}
                </span>
             ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm md:text-base font-light opacity-90">
            <span>By {post.author || 'Desert Smart Tourism'}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
         <Link href="/blog" className="inline-flex items-center text-[#DF6951] hover:text-[#c85a43] transition mb-12 font-medium">
            &larr; Back to Travel Journal
         </Link>

         {/* Rich Text Rendered Content */}
         <article className="max-w-none text-gray-800 text-lg leading-relaxed space-y-6 [&>p]:mb-6 [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mt-12 [&>h1]:mb-6 [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-[#DF6951] [&>blockquote]:pl-4 [&>blockquote]:italic [&>img]:rounded-xl [&>img]:my-8">
             <div dangerouslySetInnerHTML={{ __html: post.content }} />
         </article>
      </main>

      <Footer />
    </div>
  );
}
