-- ============================================
-- BETSTARTERS DISCOVERY COCKPIT
-- Supabase Database Schema
-- Production-ready
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'team_member', 'consultant')),
  pin TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  market_focus TEXT,
  work_type TEXT CHECK (work_type IN ('fulltime', 'parttime') OR work_type IS NULL),
  location TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  current_projects_month INTEGER DEFAULT 0,
  target_projects_month INTEGER DEFAULT 8,
  target_timeline_months INTEGER DEFAULT 12,
  ttd_current INTEGER,
  ttd_target INTEGER DEFAULT 30,
  -- Owner private data
  budget_total INTEGER,
  margin_target INTEGER,
  strategic_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISCOVERY QUESTIONS
-- ============================================

CREATE TABLE discovery_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  answered BOOLEAN DEFAULT FALSE,
  answer TEXT,
  answered_by TEXT,
  answered_at TIMESTAMPTZ,
  ai_analysis TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASK DEFINITIONS (predefined list)
-- ============================================

CREATE TABLE task_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TASKS (max 10 per user)
-- ============================================

CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES task_definitions(id),
  task_name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- ============================================
-- USER BLOCKERS
-- ============================================

CREATE TABLE user_blockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('process', 'tool', 'information', 'communication', 'organizational')),
  impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved')),
  requires_owner BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IMPROVEMENT SUGGESTIONS
-- ============================================

CREATE TABLE improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  expected_benefit TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'completed', 'declined')),
  response TEXT,
  responded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKET INTELLIGENCE
-- ============================================

CREATE TABLE market_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  status TEXT NOT NULL,
  regulator TEXT,
  summary TEXT,
  cultural TEXT,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high', 'verified')),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DECISIONS (audit log)
-- ============================================

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT,
  made_by TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STT SESSIONS
-- ============================================

CREATE TABLE stt_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  started_by UUID REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  transcript_count INTEGER DEFAULT 0,
  extraction_count INTEGER DEFAULT 0
);

-- ============================================
-- STT EXTRACTIONS
-- ============================================

CREATE TABLE stt_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES stt_sessions(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  category TEXT,
  quote TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI INSIGHTS
-- ============================================

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN ('gap', 'suggestion', 'risk', 'opportunity')),
  title TEXT NOT NULL,
  content TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  actionable BOOLEAN DEFAULT TRUE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROWTH OBJECTIVES
-- ============================================

CREATE TABLE growth_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL CHECK (type IN ('temporal', 'economic', 'market', 'operational')),
  title TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'at_risk', 'completed')),
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_questions_project ON discovery_questions(project_id);
CREATE INDEX idx_questions_priority ON discovery_questions(priority);
CREATE INDEX idx_questions_answered ON discovery_questions(answered);
CREATE INDEX idx_user_tasks_user ON user_tasks(user_id);
CREATE INDEX idx_blockers_user ON user_blockers(user_id);
CREATE INDEX idx_blockers_status ON user_blockers(status);
CREATE INDEX idx_blockers_requires_owner ON user_blockers(requires_owner);
CREATE INDEX idx_suggestions_user ON improvement_suggestions(user_id);
CREATE INDEX idx_decisions_project ON decisions(project_id);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);
CREATE INDEX idx_markets_region ON market_intelligence(region);
CREATE INDEX idx_stt_extractions_session ON stt_extractions(session_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stt_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_objectives ENABLE ROW LEVEL SECURITY;

-- Policies: allow all for authenticated (simplified - customize per your needs)
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON discovery_questions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON task_definitions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON user_tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON user_blockers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON improvement_suggestions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON market_intelligence FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON decisions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON stt_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON stt_extractions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ai_insights FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON growth_objectives FOR ALL USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON discovery_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blockers_updated_at BEFORE UPDATE ON user_blockers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON improvement_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON market_intelligence FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON growth_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at();
