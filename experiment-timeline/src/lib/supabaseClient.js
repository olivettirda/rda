import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const SUPABASE_URL = 'https://jfabgawkxahqcsrwjdgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYWJnYXdreGFocWNzcndqZGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzkwNDUsImV4cCI6MjA4MzQxNTA0NX0.KfT1iAjap3J1sEtovH2N1hD2a0cBbHcYqMLrT2rtfDg';

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('Supabase 클라이언트 초기화 완료');
