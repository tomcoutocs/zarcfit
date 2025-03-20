'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, PenSquare, Trash2, Search } from 'lucide-react';

// Mock data for demo
const mockBlogPosts = [
  {
    id: '1',
    title: 'The Ultimate Guide to High-Intensity Interval Training',
    status: 'Published',
    author: 'John Smith',
    category: 'Workouts',
    date: '2023-06-15',
  },
  {
    id: '2',
    title: 'Nutrition Tips for Building Muscle',
    status: 'Published',
    author: 'Sarah Johnson',
    category: 'Nutrition',
    date: '2023-05-28',
  },
  {
    id: '3',
    title: 'How to Stay Motivated in Your Fitness Journey',
    status: 'Draft',
    author: 'Maria Garcia',
    category: 'Motivation',
    date: '2023-07-03',
  },
  {
    id: '4',
    title: 'The Benefits of Strength Training for Women',
    status: 'Published',
    author: 'John Smith',
    category: 'Workouts',
    date: '2023-06-22',
  },
  {
    id: '5',
    title: 'Post-Workout Recovery Strategies',
    status: 'Draft',
    author: 'David Wilson',
    category: 'Recovery',
    date: '2023-07-10',
  },
];

export default function BlogAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [blogPosts, setBlogPosts] = useState(mockBlogPosts);
  
  const filteredPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletePost = (id: string) => {
    // In a real app, this would call an API to delete the post
    setBlogPosts(blogPosts.filter(post => post.id !== id));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Blog Posts</CardTitle>
          <CardDescription>
            Create, edit, and delete blog posts for your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>{post.title}</TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          post.status === 'Published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      </TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>{new Date(post.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/blog/edit/${post.id}`}>
                            <PenSquare className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                              deletePost(post.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No blog posts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 