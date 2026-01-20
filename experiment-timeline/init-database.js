// 데이터베이스 초기화 스크립트
// Node.js로 실행: node init-database.js

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { INITIAL_PROJECT } from './src/data/initialData.js';

// Supabase 설정 (personal 프로젝트)
const SUPABASE_URL = 'https://lbfvshavniomfykvqnwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZnZzaGF2bmlvbWZ5a3ZxbndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTMzMjMsImV4cCI6MjA4MzcyOTMyM30.HfZudwH6vKbsukg_K3wZGxQ1oEiEvJ1kGoxPnp1-2FA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initDatabase() {
  console.log('='.repeat(60));
  console.log('데이터베이스 초기화 시작');
  console.log('='.repeat(60));

  try {
    // 1. 사용자 생성
    console.log('\n[1/3] 사용자 생성 중...');

    // 관리자 비밀번호 해싱
    const adminPasswordHash = await bcrypt.hash('1234', 10);
    const olivettiPasswordHash = await bcrypt.hash('juicy90', 10);

    // 기존 사용자 삭제 (있다면)
    await supabase.from('timeline_users').delete().eq('username', 'admin');
    await supabase.from('timeline_users').delete().eq('username', 'olivetti90');

    // 관리자 사용자 생성
    const { data: admin, error: adminError } = await supabase
      .from('timeline_users')
      .insert([
        {
          username: 'admin',
          password_hash: adminPasswordHash,
          email: 'admin@rda.kr',
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (adminError) {
      console.error('관리자 생성 실패:', adminError);
      throw adminError;
    }

    console.log('✓ 관리자 생성 완료:', admin.username);

    // olivetti90 사용자 생성
    const { data: olivetti, error: olivettiError } = await supabase
      .from('timeline_users')
      .insert([
        {
          username: 'olivetti90',
          password_hash: olivettiPasswordHash,
          email: 'olivetti90@rda.kr',
          role: 'user'
        }
      ])
      .select()
      .single();

    if (olivettiError) {
      console.error('olivetti90 생성 실패:', olivettiError);
      throw olivettiError;
    }

    console.log('✓ olivetti90 생성 완료:', olivetti.username);

    // 2. 프로젝트 생성 (olivetti90 계정에)
    console.log('\n[2/3] 영진 돌연변이 프로젝트 생성 중...');

    const { data: project, error: projectError } = await supabase
      .from('timeline_projects')
      .insert([
        {
          user_id: olivetti.id,
          project_name: INITIAL_PROJECT.projectName,
          description: INITIAL_PROJECT.description,
          settings: INITIAL_PROJECT.settings
        }
      ])
      .select()
      .single();

    if (projectError) {
      console.error('프로젝트 생성 실패:', projectError);
      throw projectError;
    }

    console.log('✓ 프로젝트 생성 완료:', project.project_name);

    // 3. 시기 및 항목 생성
    console.log('\n[3/3] 시기 및 실험 항목 생성 중...');

    for (const period of INITIAL_PROJECT.periods) {
      // 시기 생성
      const { data: newPeriod, error: periodError } = await supabase
        .from('timeline_periods')
        .insert([
          {
            project_id: project.id,
            name: period.name,
            short_name: period.shortName,
            start_date: period.startDate,
            end_date: period.endDate,
            display_order: period.order
          }
        ])
        .select()
        .single();

      if (periodError) {
        console.error('시기 생성 실패:', periodError);
        throw periodError;
      }

      // 항목들 생성
      if (period.items && period.items.length > 0) {
        const items = period.items.map(item => ({
          period_id: newPeriod.id,
          title: item.title,
          description: item.description || '',
          priority: item.priority,
          completed: item.completed,
          completed_at: item.completedAt,
          memo: item.memo || '',
          tags: item.tags || [],
          populations: item.populations || []
        }));

        const { error: itemsError } = await supabase
          .from('timeline_items')
          .insert(items);

        if (itemsError) {
          console.error('항목 생성 실패:', itemsError);
          throw itemsError;
        }

        console.log(`  ✓ ${period.shortName}: ${period.items.length}개 항목 생성`);
      }
    }

    // 4. 집단 생성
    console.log('\n[4/4] 집단 정보 생성 중...');

    const populations = INITIAL_PROJECT.populations.map(pop => ({
      project_id: project.id,
      name: pop.name,
      parent_population: pop.parentPopulation,
      current_status: pop.currentStatus,
      active_periods: pop.activePeriods || [],
      notes: pop.notes || ''
    }));

    const { error: populationsError } = await supabase
      .from('timeline_populations')
      .insert(populations);

    if (populationsError) {
      console.error('집단 생성 실패:', populationsError);
      throw populationsError;
    }

    console.log(`✓ ${populations.length}개 집단 생성 완료`);

    // 완료
    console.log('\n' + '='.repeat(60));
    console.log('데이터베이스 초기화 완료!');
    console.log('='.repeat(60));
    console.log('\n로그인 정보:');
    console.log('  관리자:    admin / 1234');
    console.log('  일반 사용자: olivetti90 / juicy90');
    console.log('\n영진 돌연변이 실험 데이터가 olivetti90 계정에 저장되었습니다.');
    console.log('');

  } catch (error) {
    console.error('\n❌ 초기화 실패:', error);
    process.exit(1);
  }
}

// 실행
initDatabase();
