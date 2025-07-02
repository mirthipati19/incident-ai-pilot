
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Eye, Clock, ArrowLeft } from "lucide-react";
import { KnowledgeArticle } from "@/services/knowledgeBaseService";
import { format } from "date-fns";

interface ArticleViewerProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onVote?: (id: string, isHelpful: boolean) => void;
  onFeedback?: (id: string, isHelpful: boolean) => void;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  isOpen,
  onClose,
  onBack,
  onVote,
  onFeedback
}) => {
  if (!article) return null;

  const handleVote = onVote || onFeedback;

  // If onBack is provided, render as a full page
  if (onBack) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
        
        <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">{article.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-white/20 text-white">
                  {article.category}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-blue-200">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count || 0} views</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-blue-200">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(article.created_at), 'PPP')}</span>
                </div>
              </div>
              
              {handleVote && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(article.id, true)}
                    className="flex items-center space-x-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{article.helpful_votes || 0}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(article.id, false)}
                    className="flex items-center space-x-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>{article.unhelpful_votes || 0}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {article.summary && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-200 mb-2">Summary</h3>
                <p className="text-blue-100">{article.summary}</p>
              </div>
            )}
            
            <div className="prose max-w-none text-white">
              <div className="whitespace-pre-wrap">{article.content}</div>
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <h4 className="font-semibold mb-2 text-white">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/10 text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render as dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{article.title}</DialogTitle>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <Badge variant="outline">{article.category}</Badge>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{article.view_count || 0} views</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(article.created_at), 'PPP')}</span>
              </div>
            </div>
            
            {handleVote && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(article.id, true)}
                  className="flex items-center space-x-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{article.helpful_votes || 0}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(article.id, false)}
                  className="flex items-center space-x-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{article.unhelpful_votes || 0}</span>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          {article.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
              <p className="text-blue-800">{article.summary}</p>
            </div>
          )}
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{article.content}</div>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
