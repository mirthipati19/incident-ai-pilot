
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, ThumbsUp, ThumbsDown, Eye, Plus, Filter } from 'lucide-react';
import { ArticleCard } from '@/components/KnowledgeBase/ArticleCard';
import { ArticleViewer } from '@/components/KnowledgeBase/ArticleViewer';
import { ArticleForm } from '@/components/KnowledgeBase/ArticleForm';
import { knowledgeBaseService, KnowledgeArticle } from '@/services/knowledgeBaseService';
import { useToast } from '@/hooks/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';

const KnowledgeBase = () => {
  const { user } = useImprovedAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = ['All', 'Hardware', 'Software', 'Network', 'Security', 'General'];

  useEffect(() => {
    loadArticles();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(!!data && data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await knowledgeBaseService.getArticles();
      setArticles(data);
    } catch (error: any) {
      console.error('Failed to load articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge base articles.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadArticles();
      return;
    }

    try {
      setLoading(true);
      const results = await knowledgeBaseService.getArticles(undefined, searchTerm);
      setArticles(results);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to search articles.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    try {
      // Update view count locally
      setArticles(prev => 
        prev.map(a => 
          a.id === article.id 
            ? { ...a, view_count: (a.view_count || 0) + 1 }
            : a
        )
      );
      
      // Update in database
      await knowledgeBaseService.updateArticle(article.id, {
        view_count: (article.view_count || 0) + 1
      });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to provide feedback.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await knowledgeBaseService.voteArticle(articleId, isHelpful);
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
      loadArticles(); // Refresh to show updated counts
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateArticle = async (articleData: any) => {
    try {
      await knowledgeBaseService.createArticle({
        ...articleData,
        author_id: user?.id
      });
      toast({
        title: 'Success',
        description: 'Article created successfully.',
      });
      setShowForm(false);
      loadArticles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create article.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateArticle = async (articleData: any) => {
    if (!editingArticle) return;

    try {
      await knowledgeBaseService.updateArticle(editingArticle.id, articleData);
      toast({
        title: 'Success',
        description: 'Article updated successfully.',
      });
      setEditingArticle(null);
      setShowForm(false);
      loadArticles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update article.',
        variant: 'destructive',
      });
    }
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (showForm) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <ArticleForm
            article={editingArticle}
            onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle}
            onCancel={() => {
              setShowForm(false);
              setEditingArticle(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWwsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NEgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10">
          <ArticleViewer
            article={selectedArticle}
            isOpen={true}
            onClose={() => setSelectedArticle(null)}
            onBack={() => setSelectedArticle(null)}
            onVote={handleFeedback}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NEgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Knowledge Base</h1>
          <p className="text-blue-200">Find solutions, guides, and documentation to help resolve your IT issues.</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Knowledge Base
              </CardTitle>
              {isAdmin && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search articles, solutions, and guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">No Articles Found</h3>
              <p className="text-blue-200">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'No articles available at the moment.'}
              </p>
              {isAdmin && (
                <Button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Article
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
                onVote={handleFeedback}
                onEdit={isAdmin ? handleEditArticle : undefined}
                showVoting={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
