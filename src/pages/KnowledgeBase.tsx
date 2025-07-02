
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for knowledge articles
const mockArticles = [
  {
    id: "1",
    title: "How to Reset Your Password",
    summary: "Step-by-step guide to reset your account password",
    category: "Account Management",
    tags: ["password", "account", "security"],
    view_count: 245,
    helpful_votes: 18,
    unhelpful_votes: 2,
    content: "To reset your password: 1. Go to the sign-in page, 2. Click 'Forgot Password', 3. Enter your email address, 4. Check your email for reset instructions..."
  },
  {
    id: "2",
    title: "Installing Software with Voice Commands",
    summary: "Learn how to use voice commands to install software",
    category: "Software Installation",
    tags: ["voice", "software", "installation"],
    view_count: 189,
    helpful_votes: 25,
    unhelpful_votes: 1,
    content: "You can install software using voice commands by: 1. Clicking the microphone button, 2. Speaking clearly, 3. Confirming the installation..."
  },
  {
    id: "3",
    title: "Troubleshooting Network Issues",
    summary: "Common network problems and their solutions",
    category: "Network & Connectivity",
    tags: ["network", "troubleshooting", "connectivity"],
    view_count: 156,
    helpful_votes: 12,
    unhelpful_votes: 3,
    content: "Network troubleshooting steps: 1. Check physical connections, 2. Restart your router, 3. Run network diagnostics..."
  }
];

const KnowledgeBasePage = () => {
  const [articles, setArticles] = useState(mockArticles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();

  const categories = ["All", "Account Management", "Software Installation", "Network & Connectivity"];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleVote = (articleId: string, isHelpful: boolean) => {
    setArticles(prev => prev.map(article => {
      if (article.id === articleId) {
        return {
          ...article,
          helpful_votes: isHelpful ? article.helpful_votes + 1 : article.helpful_votes,
          unhelpful_votes: !isHelpful ? article.unhelpful_votes + 1 : article.unhelpful_votes
        };
      }
      return article;
    }));
    
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded.",
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Knowledge Base</h1>
          </div>
          <p className="text-lg text-gray-600">Find answers to common questions and learn how to use our platform</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="mb-2">
                    {article.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    {article.view_count}
                  </div>
                </div>
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <CardDescription>{article.summary}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(article.id, true)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {article.helpful_votes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(article.id, false)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {article.unhelpful_votes}
                      </Button>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
