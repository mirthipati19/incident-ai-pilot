
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { ArticleCard } from "@/components/KnowledgeBase/ArticleCard";
import { ArticleViewer } from "@/components/KnowledgeBase/ArticleViewer";
import { knowledgeBaseService, KnowledgeArticle, CommunityQuestion } from "@/services/knowledgeBaseService";
import { useToast } from "@/hooks/use-toast";

export const KnowledgeBasePage: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isArticleViewerOpen, setIsArticleViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const categories = ["Technical", "Hardware", "Software", "Network", "Security", "General"];

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [articlesData, questionsData] = await Promise.all([
        knowledgeBaseService.getArticles(selectedCategory || undefined, searchTerm || undefined),
        knowledgeBaseService.getQuestions(searchTerm || undefined)
      ]);
      
      setArticles(articlesData);
      setQuestions(questionsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load knowledge base data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleClick = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setIsArticleViewerOpen(true);
  };

  const handleVoteArticle = async (id: string, isHelpful: boolean) => {
    try {
      await knowledgeBaseService.voteArticle(id, isHelpful);
      await loadData(); // Reload to get updated vote counts
      toast({
        title: "Vote Recorded",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record vote.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-gray-600">Find answers to common questions and browse our knowledge articles</p>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search articles and questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">Knowledge Articles</TabsTrigger>
          <TabsTrigger value="community">Community Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Articles</CardTitle>
                  <CardDescription>
                    Browse our comprehensive knowledge base
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={handleArticleClick}
                    onVote={handleVoteArticle}
                    showVoting={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Community Q&A</CardTitle>
                  <CardDescription>
                    Ask questions and get answers from the community
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{question.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{question.view_count || 0} views</span>
                        <span>{question.upvotes || 0} upvotes</span>
                        <span>{format(new Date(question.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3">{question.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ArticleViewer
        article={selectedArticle}
        isOpen={isArticleViewerOpen}
        onClose={() => setIsArticleViewerOpen(false)}
        onVote={handleVoteArticle}
      />
    </div>
  );
};

export default KnowledgeBasePage;
