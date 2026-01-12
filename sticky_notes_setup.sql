-- ============================================
-- 스티키 노트 Supabase 테이블 설정
-- ============================================

-- 1. 스티키 노트 테이블 생성
CREATE TABLE IF NOT EXISTS sticky_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT DEFAULT '',
    color VARCHAR(20) DEFAULT 'yellow',
    position_x FLOAT DEFAULT 100,
    position_y FLOAT DEFAULT 100,
    width FLOAT DEFAULT 220,
    height FLOAT DEFAULT 220,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 - 사용자는 자신의 노트만 접근 가능
CREATE POLICY "Users can view their own notes"
    ON sticky_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
    ON sticky_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON sticky_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON sticky_notes FOR DELETE
    USING (auth.uid() = user_id);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sticky_notes_updated_at
    BEFORE UPDATE ON sticky_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 실시간 동기화 활성화
-- Supabase 대시보드에서 Realtime 설정:
-- Database > Replication > sticky_notes 테이블 활성화

-- ============================================
-- Google OAuth 설정 방법
-- ============================================
-- 1. Google Cloud Console (https://console.cloud.google.com)
--    - 새 프로젝트 생성 또는 기존 프로젝트 선택
--    - APIs & Services > Credentials
--    - Create Credentials > OAuth client ID
--    - Application type: Web application
--    - Authorized redirect URIs:
--      https://[your-project].supabase.co/auth/v1/callback
--
-- 2. Supabase 대시보드 (https://supabase.com/dashboard)
--    - Authentication > Providers > Google
--    - Enable Google provider
--    - Client ID: Google에서 발급받은 ID 입력
--    - Client Secret: Google에서 발급받은 Secret 입력
--    - Save
