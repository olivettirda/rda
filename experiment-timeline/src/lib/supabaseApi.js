import { supabase } from './supabaseClient';
import { getCurrentUser } from './auth';

/**
 * 현재 사용자의 프로젝트 목록 가져오기
 */
export const fetchProjects = async () => {
  try {
    console.log('프로젝트 목록 조회 시작');
    const user = getCurrentUser();

    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    const { data, error } = await supabase
      .from('timeline_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('프로젝트 조회 오류:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('프로젝트 조회 성공:', data.length + '개');
    return data;
  } catch (error) {
    console.error('프로젝트 조회 실패:', error);
    throw error;
  }
};

/**
 * 프로젝트 상세 정보 가져오기 (periods, items, populations 포함)
 */
export const fetchProjectDetail = async (projectId) => {
  try {
    console.log('프로젝트 상세 조회:', projectId);

    // 1. 프로젝트 기본 정보
    const { data: project, error: projectError } = await supabase
      .from('timeline_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // 2. 시기 목록
    const { data: periods, error: periodsError } = await supabase
      .from('timeline_periods')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (periodsError) throw periodsError;

    // 3. 각 시기의 항목들
    const periodsWithItems = await Promise.all(
      periods.map(async (period) => {
        const { data: items, error: itemsError } = await supabase
          .from('timeline_items')
          .select('*')
          .eq('period_id', period.id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;

        return {
          ...period,
          items: items.map(item => ({
            itemId: item.id,
            title: item.title,
            description: item.description,
            priority: item.priority,
            completed: item.completed,
            completedAt: item.completed_at,
            populations: item.populations || [],
            memo: item.memo || '',
            tags: item.tags || [],
            createdAt: item.created_at
          }))
        };
      })
    );

    // 4. 집단 목록
    const { data: populations, error: populationsError } = await supabase
      .from('timeline_populations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (populationsError) throw populationsError;

    // 5. 결과 조합
    const result = {
      projectId: project.id,
      projectName: project.project_name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      settings: project.settings || { showCompleted: true, showOptional: true },
      periods: periodsWithItems.map(p => ({
        periodId: p.id,
        name: p.name,
        shortName: p.short_name,
        startDate: p.start_date,
        endDate: p.end_date,
        order: p.display_order,
        items: p.items
      })),
      populations: populations.map(p => ({
        populationId: p.id,
        name: p.name,
        parentPopulation: p.parent_population,
        currentStatus: p.current_status,
        activePeriods: p.active_periods || [],
        notes: p.notes || ''
      }))
    };

    console.log('프로젝트 상세 조회 성공:', {
      projectId: result.projectId,
      periodsCount: result.periods.length,
      populationsCount: result.populations.length
    });

    return result;
  } catch (error) {
    console.error('프로젝트 상세 조회 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 새 프로젝트 생성
 */
export const createProject = async (projectData) => {
  try {
    console.log('프로젝트 생성 시작:', projectData);
    const user = getCurrentUser();

    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    const { data: project, error: projectError } = await supabase
      .from('timeline_projects')
      .insert([
        {
          user_id: user.id,
          project_name: projectData.projectName,
          description: projectData.description,
          settings: projectData.settings || { showCompleted: true, showOptional: true }
        }
      ])
      .select()
      .single();

    if (projectError) throw projectError;

    console.log('프로젝트 생성 성공:', project.id);
    return project.id;
  } catch (error) {
    console.error('프로젝트 생성 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 프로젝트 전체 데이터 저장 (periods, items, populations 포함)
 */
export const saveProject = async (projectData) => {
  try {
    console.log('프로젝트 전체 저장 시작:', projectData.projectId);

    // 1. 프로젝트 업데이트
    const { error: projectError } = await supabase
      .from('timeline_projects')
      .update({
        project_name: projectData.projectName,
        description: projectData.description,
        settings: projectData.settings
      })
      .eq('id', projectData.projectId);

    if (projectError) throw projectError;

    // 2. 기존 데이터 삭제 (cascade로 자동 삭제됨)
    const { error: periodsDeleteError } = await supabase
      .from('timeline_periods')
      .delete()
      .eq('project_id', projectData.projectId);

    if (periodsDeleteError) throw periodsDeleteError;

    const { error: populationsDeleteError } = await supabase
      .from('timeline_populations')
      .delete()
      .eq('project_id', projectData.projectId);

    if (populationsDeleteError) throw populationsDeleteError;

    // 3. 시기 삽입
    for (const period of projectData.periods) {
      const { data: newPeriod, error: periodError } = await supabase
        .from('timeline_periods')
        .insert([
          {
            id: period.periodId,
            project_id: projectData.projectId,
            name: period.name,
            short_name: period.shortName,
            start_date: period.startDate,
            end_date: period.endDate,
            display_order: period.order
          }
        ])
        .select()
        .single();

      if (periodError) throw periodError;

      // 4. 해당 시기의 항목들 삽입
      if (period.items && period.items.length > 0) {
        const items = period.items.map(item => ({
          id: item.itemId,
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

        if (itemsError) throw itemsError;
      }
    }

    // 5. 집단 삽입
    if (projectData.populations && projectData.populations.length > 0) {
      const populations = projectData.populations.map(pop => ({
        id: pop.populationId,
        project_id: projectData.projectId,
        name: pop.name,
        parent_population: pop.parentPopulation,
        current_status: pop.currentStatus,
        active_periods: pop.activePeriods || [],
        notes: pop.notes || ''
      }));

      const { error: populationsError } = await supabase
        .from('timeline_populations')
        .insert(populations);

      if (populationsError) throw populationsError;
    }

    console.log('프로젝트 전체 저장 완료');
  } catch (error) {
    console.error('프로젝트 저장 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 항목 완료 상태 토글
 */
export const toggleItemCompletion = async (itemId, completed) => {
  try {
    console.log('항목 완료 토글:', { itemId, completed });

    const { error } = await supabase
      .from('timeline_items')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', itemId);

    if (error) throw error;

    console.log('항목 완료 토글 성공');
  } catch (error) {
    console.error('항목 완료 토글 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 항목 메모 업데이트
 */
export const updateItemMemo = async (itemId, memo) => {
  try {
    console.log('메모 업데이트:', { itemId, memoLength: memo.length });

    const { error } = await supabase
      .from('timeline_items')
      .update({ memo })
      .eq('id', itemId);

    if (error) throw error;

    console.log('메모 업데이트 성공');
  } catch (error) {
    console.error('메모 업데이트 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 항목 삭제
 */
export const deleteItem = async (itemId) => {
  try {
    console.log('항목 삭제:', itemId);

    const { error } = await supabase
      .from('timeline_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    console.log('항목 삭제 성공');
  } catch (error) {
    console.error('항목 삭제 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 새 항목 추가
 */
export const addItem = async (periodId, itemData) => {
  try {
    console.log('항목 추가:', { periodId, itemData });

    const { data, error } = await supabase
      .from('timeline_items')
      .insert([
        {
          period_id: periodId,
          title: itemData.title,
          description: itemData.description || '',
          priority: itemData.priority || 'required',
          completed: false,
          memo: '',
          tags: itemData.tags || [],
          populations: itemData.populations || []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('항목 추가 성공:', data.id);
    return data.id;
  } catch (error) {
    console.error('항목 추가 실패:', JSON.stringify(error, null, 2));
    throw error;
  }
};
