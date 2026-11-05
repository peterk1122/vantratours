import { Metadata } from 'next';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: "Travel Journal & Blog | Vantra Travel and Tourisms",
  description: "Discover stories, insights, and guides about UAE culture, desert safari adventures, and historical tours curated by Desert Smart Tourism.",
};

export default function BlogPage() {
  return <BlogClient />;
}
