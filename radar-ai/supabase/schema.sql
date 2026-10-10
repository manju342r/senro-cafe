-- Schema for Senro.AI (Adaptive Competitive Intelligence & Visibility Engine)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    own_website_url TEXT NOT NULL,
    industry TEXT,
    target_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. competitors
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT NOT NULL,
    latest_snapshot JSONB,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. traffic_metrics
CREATE TABLE traffic_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('own', 'competitor')),
    target_id UUID NOT NULL, -- Logical FK to workspaces or competitors
    visibility_score NUMERIC CHECK (visibility_score >= 0 AND visibility_score <= 100),
    estimated_traffic INTEGER,
    page_load_ms INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. comparisons
CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    own_snapshot JSONB,
    competitor_snapshot JSONB,
    strategic_gap_score INTEGER CHECK (strategic_gap_score >= 0 AND strategic_gap_score <= 100),
    actionable_recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. recommendations_log (Closed-Loop Tracking)
CREATE TABLE recommendations_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('suggested', 'implemented', 'dismissed')),
    implemented_at TIMESTAMP WITH TIME ZONE,
    pre_implementation_traffic INTEGER,
    post_implementation_traffic INTEGER,
    traffic_delta_percent NUMERIC,
    evaluation_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. user_settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bright_data_key TEXT,
    bright_data_zone TEXT DEFAULT 'web_unlocker1',
    hindsight_api_key TEXT,
    resend_api_key TEXT,
    notification_email TEXT,
    llm_key TEXT,
    llm_base_url TEXT DEFAULT 'https://api.featherless.ai/v1',
    llm_model TEXT DEFAULT 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security (RLS) Policies

-- workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workspaces" ON workspaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workspaces" ON workspaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workspaces" ON workspaces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workspaces" ON workspaces FOR DELETE USING (auth.uid() = user_id);

-- competitors
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own competitors" ON competitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own competitors" ON competitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own competitors" ON competitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own competitors" ON competitors FOR DELETE USING (auth.uid() = user_id);

-- traffic_metrics
ALTER TABLE traffic_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own metrics" ON traffic_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON traffic_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON traffic_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metrics" ON traffic_metrics FOR DELETE USING (auth.uid() = user_id);

-- comparisons
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own comparisons" ON comparisons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own comparisons" ON comparisons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comparisons" ON comparisons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comparisons" ON comparisons FOR DELETE USING (auth.uid() = user_id);

-- recommendations_log
ALTER TABLE recommendations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own logs" ON recommendations_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON recommendations_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON recommendations_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON recommendations_log FOR DELETE USING (auth.uid() = user_id);

-- user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- Enable Supabase Realtime for comparisons and recommendations_log
ALTER PUBLICATION supabase_realtime ADD TABLE comparisons;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations_log;
