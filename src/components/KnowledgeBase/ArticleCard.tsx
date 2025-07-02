
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { KnowledgeArticle } from "@/services/knowledgeBaseService";
import { format } from "date-fns";

interface ArticleCardProps {
  article: KnowledgeArticle;
  onClick: (article: KnowledgeArticle) => void;
  onVote?: (id: string, isHelpful: boolean) => void;
  showVoting?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onClick,
  onVote,
  showVoting = false
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader onClick={() => onClick(article)}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
            <Badge variant="outline">{article.category}</Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{article.view_count || 0}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent onClick={() => onClick(article)}>
        <CardDescription className="mb-4">
          {article.summary || article.content.substring(0, 150) + "..."}
        </CardDescription>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex space-x-1">
                {article.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {showVoting && onVote && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(article.id, true);
                }}
                className="flex items-center space-x-1"
              >
                <ThumbsUp className="h-3 w-3" />
                <span>{article.helpful_votes || 0}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(article.id, false);
                }}
                className="flex items-center space-x-1"
              >
                <ThumbsDown className="h-3 w-3" />
                <span>{article.unhelpful_votes || 0}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
