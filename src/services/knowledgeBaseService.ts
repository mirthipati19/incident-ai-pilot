
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type KnowledgeArticle = Tables<"knowledge_articles">;
export type CommunityQuestion = Tables<"community_questions">;
export type CommunityAnswer = Tables<"community_answers">;

export const knowledgeBaseService = {
  // Knowledge Articles
  async getArticles(category?: string, searchTerm?: string) {
    let query = supabase
      .from("knowledge_articles")
      .select("*")
      .eq("status", "published")
      .order("view_count", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (searchTerm) {
      query = query.textSearch("search_vector", searchTerm);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getArticle(id: string) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from("knowledge_articles")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);

    return data;
  },

  async createArticle(article: TablesInsert<"knowledge_articles">) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .insert(article)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateArticle(id: string, updates: TablesUpdate<"knowledge_articles">) {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async voteArticle(id: string, isHelpful: boolean) {
    const article = await this.getArticle(id);
    const updates = isHelpful
      ? { helpful_votes: (article.helpful_votes || 0) + 1 }
      : { unhelpful_votes: (article.unhelpful_votes || 0) + 1 };

    return this.updateArticle(id, updates);
  },

  // Community Q&A
  async getQuestions(searchTerm?: string) {
    let query = supabase
      .from("community_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (searchTerm) {
      query = query.ilike("title", `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getQuestion(id: string) {
    const { data, error } = await supabase
      .from("community_questions")
      .select(`
        *,
        answers:community_answers(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from("community_questions")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);

    return data;
  },

  async createQuestion(question: TablesInsert<"community_questions">) {
    const { data, error } = await supabase
      .from("community_questions")
      .insert(question)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createAnswer(answer: TablesInsert<"community_answers">) {
    const { data, error } = await supabase
      .from("community_answers")
      .insert(answer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async voteQuestion(id: string, isUpvote: boolean) {
    const question = await this.getQuestion(id);
    const updates = isUpvote
      ? { upvotes: (question.upvotes || 0) + 1 }
      : { downvotes: (question.downvotes || 0) + 1 };

    return supabase
      .from("community_questions")
      .update(updates)
      .eq("id", id);
  },

  async voteAnswer(id: string, isUpvote: boolean) {
    const { data: answer } = await supabase
      .from("community_answers")
      .select("*")
      .eq("id", id)
      .single();

    if (!answer) throw new Error("Answer not found");

    const updates = isUpvote
      ? { upvotes: (answer.upvotes || 0) + 1 }
      : { downvotes: (answer.downvotes || 0) + 1 };

    return supabase
      .from("community_answers")
      .update(updates)
      .eq("id", id);
  }
};
