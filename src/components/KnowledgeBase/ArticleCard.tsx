
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Eye, Calendar, User, Edit } from 'lucide-react';
import { KnowledgeArticle } from '@/services/knowledgeBaseService';

interface ArticleCardProps {
  article: KnowledgeArticle;
  onClick: () => void;
  onVote?: (articleId: string, isHelpful: boolean) => void;
  onEdit?: (article: KnowledgeArticle) => void;
  showVoting?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onClick,
  onVote,
  onEdit,
  showVoting = false
}) => {
  const handleVote = (e: React.MouseEvent, isHelpful: boolean) => {
    e.stopPropagation();
    if (onVote) {
      onVote(article.id, isHelpful);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(article);
    }
  };

  return (
    <Card 
      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2 text-white">
              {article.title}
            </CardTitle>
            <CardDescription className="text-blue-200 mt-1">
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-500/30">
                {article.category}
              </Badge>
            </CardDescription>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-blue-200 hover:text-white hover:bg-white/10 flex-shrink-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex-1">
          {article.summary && (
            <p className="text-blue-100 text-sm line-clamp-3 mb-4">
              {article.summary}
            </p>
          )}
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs bg-white/5 border-white/20 text-blue-200"
                >
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-white/5 border-white/20 text-blue-200"
                >
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{article.view_count || 0} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {showVoting && onVote && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleVote(e, true)}
                className="text-green-400 hover:text-green-300 hover:bg-green-400/10 flex items-center gap-1"
              >
                <ThumbsUp className="w-3 h-3" />
                <span className="text-xs">{article.helpful_votes || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleVote(e, false)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 flex items-center gap-1"
              >
                <ThumbsDown className="w-3 h-3" />
                <span className="text-xs">{article.unhelpful_votes || 0}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
