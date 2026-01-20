-- Experiment Timeline Manager Database Schema
-- =============================================

-- 1. Users 테이블 (사용자 정보)
CREATE TABLE IF NOT EXISTS timeline_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Projects 테이블 (프로젝트)
CREATE TABLE IF NOT EXISTS timeline_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES timeline_users(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"showCompleted": true, "showOptional": true}'::jsonb
);

-- 3. Periods 테이블 (시기)
CREATE TABLE IF NOT EXISTS timeline_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES timeline_projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20),
  start_date DATE,
  end_date DATE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Items 테이블 (실험 항목)
CREATE TABLE IF NOT EXISTS timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES timeline_periods(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'required', -- 'required' or 'optional'
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  memo TEXT,
  tags TEXT[], -- Array of tags
  populations TEXT[], -- Array of population names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Populations 테이블 (집단 정보)
CREATE TABLE IF NOT EXISTS timeline_populations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES timeline_projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  parent_population VARCHAR(100),
  current_status VARCHAR(50),
  active_periods TEXT[], -- Array of period short names
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON timeline_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_periods_project_id ON timeline_periods(project_id);
CREATE INDEX IF NOT EXISTS idx_items_period_id ON timeline_items(period_id);
CREATE INDEX IF NOT EXISTS idx_populations_project_id ON timeline_populations(project_id);
CREATE INDEX IF NOT EXISTS idx_items_completed ON timeline_items(completed);
CREATE INDEX IF NOT EXISTS idx_users_username ON timeline_users(username);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE timeline_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_populations ENABLE ROW LEVEL SECURITY;

-- Users: Only admins can see all users, regular users can only see themselves
CREATE POLICY "Users can view own profile"
  ON timeline_users FOR SELECT
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM timeline_users WHERE id = auth.uid()::uuid AND role = 'admin'
  ));

CREATE POLICY "Admins can insert users"
  ON timeline_users FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM timeline_users WHERE id = auth.uid()::uuid AND role = 'admin'
  ));

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON timeline_projects FOR SELECT
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own projects"
  ON timeline_projects FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own projects"
  ON timeline_projects FOR UPDATE
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own projects"
  ON timeline_projects FOR DELETE
  USING (user_id = auth.uid()::uuid);

-- Periods: Users can access periods of their projects
CREATE POLICY "Users can view own periods"
  ON timeline_periods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can insert own periods"
  ON timeline_periods FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can update own periods"
  ON timeline_periods FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can delete own periods"
  ON timeline_periods FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

-- Items: Users can access items of their projects
CREATE POLICY "Users can view own items"
  ON timeline_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM timeline_periods p
    JOIN timeline_projects pr ON p.project_id = pr.id
    WHERE p.id = period_id AND pr.user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can insert own items"
  ON timeline_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM timeline_periods p
    JOIN timeline_projects pr ON p.project_id = pr.id
    WHERE p.id = period_id AND pr.user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can update own items"
  ON timeline_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM timeline_periods p
    JOIN timeline_projects pr ON p.project_id = pr.id
    WHERE p.id = period_id AND pr.user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can delete own items"
  ON timeline_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM timeline_periods p
    JOIN timeline_projects pr ON p.project_id = pr.id
    WHERE p.id = period_id AND pr.user_id = auth.uid()::uuid
  ));

-- Populations: Users can access populations of their projects
CREATE POLICY "Users can view own populations"
  ON timeline_populations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can insert own populations"
  ON timeline_populations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can update own populations"
  ON timeline_populations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

CREATE POLICY "Users can delete own populations"
  ON timeline_populations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM timeline_projects WHERE id = project_id AND user_id = auth.uid()::uuid
  ));

-- =============================================
-- Functions
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_timeline_users_updated_at BEFORE UPDATE ON timeline_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_projects_updated_at BEFORE UPDATE ON timeline_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_periods_updated_at BEFORE UPDATE ON timeline_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE ON timeline_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_populations_updated_at BEFORE UPDATE ON timeline_populations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Initial Admin User
-- Note: Password hashing should be done in application code
-- This is just a placeholder for structure
-- =============================================

-- INSERT INTO timeline_users (username, password_hash, role, email)
-- VALUES
--   ('admin', '$2a$10$...', 'admin', 'admin@rda.kr'),
--   ('olivetti90', '$2a$10$...', 'user', 'olivetti90@rda.kr');
