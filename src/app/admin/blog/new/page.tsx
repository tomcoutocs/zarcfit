'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save } from 'lucide-react';
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'draft', // default to draft
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'title' && !prev.slug ? { slug: slugifyTitle(value) } : {}),
    }));
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

      // In a real implementation, we would save the blog post to a database
      const supabase = createSupabaseBrowserClient();
      
      // Create a new blog post
      const { error: saveError } = await supabase
        .from('blog_posts')
        .insert({
          title: formData.title,
          slug: formData.slug || slugifyTitle(formData.title),
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          featured_image: formData.featured_image,
          status: formData.status,
          author_id: user?.id,
          author_name: user?.user_metadata?.firstName 
            ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
            : user?.email,
        })
        .select();
      
      if (saveError) {
        throw new Error(saveError.message);
      }
      
      setSuccess('Blog post created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/admin/blog');
      }, 2000);
    } catch (err) {
      console.error('Error creating blog post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => {
    setFormData((prev) => ({ ...prev, status: 'published' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog Posts
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Blog Post</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New Blog Post</CardTitle>
            <CardDescription>
              Create a new blog post for your website. Fill out the fields below and click &quot;Save Draft&quot; to save your post as a draft, or &quot;Publish&quot; to publish it immediately.
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
              <p className="text-sm text-muted-foreground">Used in /main/blog/[slug]. Auto-generated from title if left blank.</p>
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="submit" 
              variant="outline"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              onClick={handlePublish}
            >
              {isLoading ? 'Saving...' : 'Publish Now'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 