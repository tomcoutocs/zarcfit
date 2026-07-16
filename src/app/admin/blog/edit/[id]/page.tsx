'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { slugifyTitle } from '@/lib/blog';

// Blog post categories
const categories = [
  'Workouts',
  'Nutrition',
  'Motivation',
  'Recovery',
  'Weight Loss',
  'Muscle Building',
  'Health',
  'Fitness',
  'Lifestyle',
];

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
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalBlogPost, setOriginalBlogPost] = useState<BlogPost | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft',
  });

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', postId)
          .single();
          
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          setOriginalBlogPost(data as BlogPost);
          setFormData({
            title: data.title || '',
            slug: data.slug || slugifyTitle(data.title || ''),
            category: data.category || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            featured_image: data.featured_image || '',
            status: data.status || 'draft',
          });
        } else {
          throw new Error('Blog post not found');
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog post');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchBlogPost();
  }, [postId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.title) {
        setError('Title is required');
        setIsLoading(false);
        return;
      }
      
      if (!formData.category) {
        setError('Category is required');
        setIsLoading(false);
        return;
      }
      
      if (!formData.content) {
        setError('Content is required');
        setIsLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      
      // Update blog post
      const { error: saveError } = await supabase
        .from('blog_posts')
        .update({
          title: formData.title,
          slug: formData.slug || slugifyTitle(formData.title),
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          featured_image: formData.featured_image,
          status: formData.status,
          // We don't update author fields here
        })
        .eq('id', postId);
      
      if (saveError) {
        throw new Error(saveError.message);
      }
      
      setSuccess('Blog post updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/blog');
      }, 2000);
    } catch (err) {
      console.error('Error updating blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to update blog post');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog Posts
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Blog Post</CardTitle>
            <CardDescription>
              Update this blog post. You can edit any field and save changes or publish the post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="url-friendly-slug"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                onValueChange={(value) => handleSelectChange('category', value)}
                value={formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Brief summary of the post"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your blog post content here"
                className="min-h-[300px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Supports markdown formatting.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                name="featured_image"
                value={formData.featured_image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                onValueChange={(value) => handleSelectChange('status', value)}
                value={formData.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {originalBlogPost && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created by {originalBlogPost.author_name} on {new Date(originalBlogPost.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/blog')}
            >
              Cancel
            </Button>
            <div className="space-x-2">
              <Button 
                type="button"
                variant="secondary" 
                onClick={() => {
                  setFormData(prev => ({ ...prev, status: 'published' }));
                  handleSubmit({preventDefault: () => {}} as React.FormEvent);
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 