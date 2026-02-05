import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit2, Trash2, Eye, Calendar, Clock, Save } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { BlogWizard } from './BlogWizard';

interface BlogManagerProps {
  accessToken: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  excerpt: string;
  description: string;
  keywords: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  author: string;
  authorTitle: string;
  content: {
    introduction: string;
    sections: Array<{
      heading: string;
      content: string;
      list?: string[];
    }>;
    conclusion: string;
  };
  relatedProcedures: string[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export function BlogManager({ accessToken }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/blog-posts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSavePost = async (postData: any) => {
    const slug = postData.slug || generateSlug(postData.title);
    const finalPostData = {
      ...postData,
      slug,
      updatedAt: new Date().toISOString()
    };

    const method = selectedPost ? 'PUT' : 'POST';
    const url = selectedPost 
      ? `${serverUrl}/blog-posts/${selectedPost.slug}`
      : `${serverUrl}/blog-posts`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalPostData)
    });

    if (response.ok) {
      alert(selectedPost ? 'Blog post updated!' : 'Blog post created!');
      setSelectedPost(null);
      fetchPosts();
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/blog-posts/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('Blog post deleted!');
        fetchPosts();
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setWizardOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedPost(null);
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setSelectedPost(null);
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Blog Wizard */}
      <BlogWizard
        isOpen={wizardOpen}
        onClose={handleCloseWizard}
        onSave={handleSavePost}
        existingPost={selectedPost}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">Blog Management</h2>
          <p className="text-muted-foreground">Create, edit, and manage blog articles</p>
        </div>
        <Button size="lg" className="rounded-full" onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({posts.length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
        >
          Published ({posts.filter(p => p.status === 'published').length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
        >
          Drafts ({posts.filter(p => p.status === 'draft').length})
        </Button>
      </div>

      {/* Blog Posts List */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No blog posts yet. Create your first article!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.slug} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg">{post.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                          <span className="px-2 py-0.5 bg-secondary/20 rounded">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePost(post.slug)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}