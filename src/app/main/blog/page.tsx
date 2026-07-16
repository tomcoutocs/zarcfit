import { getPublishedBlogPosts } from '@/lib/blog';
import BlogListClient from './BlogListClient';

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return <BlogListClient posts={posts} />;
}
