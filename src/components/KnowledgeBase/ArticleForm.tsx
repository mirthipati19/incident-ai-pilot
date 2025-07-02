
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { KnowledgeArticle } from "@/services/knowledgeBaseService";

interface ArticleFormProps {
  article?: KnowledgeArticle;
  onSubmit: (articleData: any) => Promise<void>;
  onCancel?: () => void;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({
  article,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    summary: article?.summary || "",
    category: article?.category || "General",
    status: article?.status || "draft",
    tags: article?.tags || []
  });

  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["General", "Hardware", "Software", "Network", "Security"];

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle>{article ? 'Edit Article' : 'Create New Knowledge Article'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Enter article title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Brief summary of the article"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="bg-white/10 border-white/20 text-white min-h-[300px]"
              placeholder="Write your article content here..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="bg-white/10 border-white/20 text-white flex-1"
                placeholder="Add a tag"
              />
              <Button type="button" onClick={handleAddTag} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-white/10 text-white">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Saving...' : (article ? 'Update Article' : 'Create Article')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
