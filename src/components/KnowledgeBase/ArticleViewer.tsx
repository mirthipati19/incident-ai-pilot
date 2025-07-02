
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Eye, Clock } from "lucide-react";
import { KnowledgeArticle } from "@/services/knowledgeBaseService";
import { format } from "date-fns";

interface ArticleViewerProps {
  article: KnowledgeArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (id: string, isHelpful: boolean) => void;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  isOpen,
  onClose,
  onVote
}) => {
  if (!article) return null;

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
            
            {onVote && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVote(article.id, true)}
                  className="flex items-center space-x-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{article.helpful_votes || 0}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVote(article.id, false)}
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
