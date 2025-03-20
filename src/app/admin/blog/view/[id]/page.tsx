'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  featured_image: string;
  status: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export default function ViewBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setBlogPost(data as BlogPost);
        } else {
          throw new Error('Blog post not found');
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog post');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlogPost();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', params.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      router.push('/admin/blog');
    } catch (err) {
      console.error('Error deleting blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete blog post');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Posts
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Posts
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Blog Post Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The requested blog post could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog Posts
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">View Blog Post</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/admin/blog/edit/${params.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{blogPost.title}</CardTitle>
              <CardDescription>
                {blogPost.category.charAt(0).toUpperCase() + blogPost.category.slice(1)} • 
                {blogPost.status === 'published' ? (
                  <span className="text-green-500 ml-1">Published</span>
                ) : (
                  <span className="text-yellow-500 ml-1">Draft</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {blogPost.featured_image && (
            <div className="overflow-hidden rounded-md">
              <img 
                src={blogPost.featured_image} 
                alt={blogPost.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          {blogPost.excerpt && (
            <div className="border-l-4 border-muted-foreground/20 pl-4 italic">
              {blogPost.excerpt}
            </div>
          )}
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {/* In a real app, you might want to use a markdown renderer here */}
            <div className="whitespace-pre-wrap">{blogPost.content}</div>
          </div>
          
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <p>
              Created by {blogPost.author_name} on {new Date(blogPost.created_at).toLocaleDateString()}
            </p>
            {blogPost.updated_at && blogPost.updated_at !== blogPost.created_at && (
              <p>
                Last updated on {new Date(blogPost.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/admin/blog">
              Back to Blog Posts
            </Link>
          </Button>
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/admin/blog/edit/${params.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 