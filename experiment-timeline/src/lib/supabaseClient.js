import { createClient } from '@supabase/supabase-js';

// Supabase 설정 (personal 프로젝트)
const SUPABASE_URL = 'https://lbfvshavniomfykvqnwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZnZzaGF2bmlvbWZ5a3ZxbndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTMzMjMsImV4cCI6MjA4MzcyOTMyM30.HfZudwH6vKbsukg_K3wZGxQ1oEiEvJ1kGoxPnp1-2FA';

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('Supabase 클라이언트 초기화 완료');
