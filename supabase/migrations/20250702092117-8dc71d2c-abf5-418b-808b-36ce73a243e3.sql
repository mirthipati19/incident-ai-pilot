
-- Service Catalog & Request Management Tables
CREATE TABLE public.service_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('hardware', 'software', 'access', 'infrastructure')),
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_fulfillment_hours INTEGER DEFAULT 24,
  requires_approval BOOLEAN DEFAULT false,
  approval_workflow_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_catalog_id UUID NOT NULL REFERENCES public.service_catalog(id),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'pending_approval', 'approved', 'in_progress', 'fulfilled', 'rejected', 'cancelled')),
  requested_data JSONB DEFAULT '{}',
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approver_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sla_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  service_category TEXT NOT NULL,
  priority TEXT NOT NULL,
  response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  escalation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge Base Tables
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL,
  view_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  unhelpful_votes INTEGER DEFAULT 0,
  search_vector tsvector,
  version INTEGER DEFAULT 1,
  is_auto_generated BOOLEAN DEFAULT false,
  source_incident_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.article_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.community_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  accepted_answer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.community_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset & Configuration Management Tables
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('hardware', 'software', 'virtual', 'cloud_service')),
  category TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired', 'maintenance')),
  location TEXT,
  assigned_to UUID,
  cost DECIMAL(10,2),
  depreciation_rate DECIMAL(5,2),
  current_value DECIMAL(10,2),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('depends_on', 'installed_on', 'connects_to', 'part_of')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_asset_id, child_asset_id, relationship_type)
);

CREATE TABLE public.software_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  software_name TEXT NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('perpetual', 'subscription', 'volume', 'oem')),
  license_key TEXT,
  total_licenses INTEGER NOT NULL,
  used_licenses INTEGER DEFAULT 0,
  purchase_date DATE,
  expiry_date DATE,
  cost DECIMAL(10,2),
  vendor TEXT,
  maintenance_expiry DATE,
  compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'over_licensed', 'under_licensed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_license_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.software_licenses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  UNIQUE(asset_id, license_id)
);

-- Add indexes for better performance
CREATE INDEX idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_sla_due_date ON public.service_requests(sla_due_date);
CREATE INDEX idx_knowledge_articles_search_vector ON public.knowledge_articles USING gin(search_vector);
CREATE INDEX idx_knowledge_articles_tags ON public.knowledge_articles USING gin(tags);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_assigned_to ON public.assets(assigned_to);
CREATE INDEX idx_software_licenses_expiry ON public.software_licenses(expiry_date);

-- Enable Row Level Security
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_license_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Service Catalog
CREATE POLICY "Anyone can view active service catalog" ON public.service_catalog FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage service catalog" ON public.service_catalog FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- RLS Policies for Service Requests
CREATE POLICY "Users can view their own service requests" ON public.service_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create service requests" ON public.service_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own pending requests" ON public.service_requests FOR UPDATE USING (
  user_id = auth.uid() AND status IN ('submitted', 'pending_approval')
);
CREATE POLICY "Admins can view all service requests" ON public.service_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);
CREATE POLICY "Admins can update service requests" ON public.service_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- RLS Policies for Knowledge Base
CREATE POLICY "Anyone can view published articles" ON public.knowledge_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create articles" ON public.knowledge_articles FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their own articles" ON public.knowledge_articles FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all articles" ON public.knowledge_articles FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- RLS Policies for Community Q&A
CREATE POLICY "Anyone can view community questions" ON public.community_questions FOR SELECT USING (true);
CREATE POLICY "Users can create questions" ON public.community_questions FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their questions" ON public.community_questions FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Anyone can view community answers" ON public.community_answers FOR SELECT USING (true);
CREATE POLICY "Users can create answers" ON public.community_answers FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their answers" ON public.community_answers FOR UPDATE USING (author_id = auth.uid());

-- RLS Policies for Assets
CREATE POLICY "Users can view assets assigned to them" ON public.assets FOR SELECT USING (
  assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all assets" ON public.assets FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- Similar policies for other asset-related tables
CREATE POLICY "Admins can manage asset relationships" ON public.asset_relationships FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);
CREATE POLICY "Admins can manage software licenses" ON public.software_licenses FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);
CREATE POLICY "Admins can manage license assignments" ON public.asset_license_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- Create trigger for updating search vectors in knowledge articles
CREATE OR REPLACE FUNCTION update_knowledge_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.content || ' ' || array_to_string(NEW.tags, ' '));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_article_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_article_search_vector();

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all relevant tables
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON public.approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_policies_updated_at BEFORE UPDATE ON public.sla_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_questions_updated_at BEFORE UPDATE ON public.community_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_answers_updated_at BEFORE UPDATE ON public.community_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_software_licenses_updated_at BEFORE UPDATE ON public.software_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
