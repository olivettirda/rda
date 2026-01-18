import { useState, useEffect, useCallback } from 'react';
import { INITIAL_PROJECT } from '../data/initialData';
import { loadFromStorage, saveToStorage, validateProjectData } from '../utils/storage';
import { generateId } from '../utils/helpers';

/**
 * 실험 데이터 관리 훅
 * @returns {Object} 프로젝트 데이터 및 관리 함수들
 */
export function useExperiments() {
  // 초기 상태: LocalStorage에서 로드하거나 기본 데이터 사용
  const [project, setProject] = useState(() => {
    console.log('useExperiments 초기화');
    const saved = loadFromStorage();

    if (saved && validateProjectData(saved)) {
      console.log('저장된 데이터 사용');
      return saved;
    }

    console.log('초기 데이터 사용');
    return INITIAL_PROJECT;
  });

  // LocalStorage 자동 저장
  useEffect(() => {
    console.log('프로젝트 데이터 변경 감지, LocalStorage 저장');
    saveToStorage(project);
  }, [project]);

  /**
   * 아이템 완료 상태 토글
   */
  const toggleItem = useCallback((periodId, itemId) => {
    console.log('아이템 토글:', { periodId, itemId });

    setProject(prev => {
      const updatedProject = {
        ...prev,
        updatedAt: new Date().toISOString(),
        periods: prev.periods.map(period =>
          period.periodId === periodId
            ? {
                ...period,
                items: period.items.map(item =>
                  item.itemId === itemId
                    ? {
                        ...item,
                        completed: !item.completed,
                        completedAt: !item.completed ? new Date().toISOString() : null
                      }
                    : item
                )
              }
            : period
        )
      };

      console.log('아이템 토글 완료:', {
        itemId,
        newState: updatedProject.periods
          .find(p => p.periodId === periodId)
          ?.items.find(i => i.itemId === itemId)?.completed
      });

      return updatedProject;
    });
  }, []);

  /**
   * 아이템 메모 업데이트
   */
  const updateMemo = useCallback((periodId, itemId, memo) => {
    console.log('메모 업데이트:', { periodId, itemId, memoLength: memo.length });

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: prev.periods.map(period =>
        period.periodId === periodId
          ? {
              ...period,
              items: period.items.map(item =>
                item.itemId === itemId
                  ? { ...item, memo }
                  : item
              )
            }
          : period
      )
    }));

    console.log('메모 업데이트 완료');
  }, []);

  /**
   * 새 아이템 추가
   */
  const addItem = useCallback((periodId, itemData) => {
    console.log('아이템 추가:', { periodId, itemData });

    const newItem = {
      itemId: generateId(),
      title: itemData.title,
      description: itemData.description || '',
      priority: itemData.priority || 'required',
      completed: false,
      completedAt: null,
      populations: itemData.populations || [],
      memo: '',
      tags: itemData.tags || [],
      createdAt: new Date().toISOString()
    };

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: prev.periods.map(period =>
        period.periodId === periodId
          ? {
              ...period,
              items: [...period.items, newItem]
            }
          : period
      )
    }));

    console.log('아이템 추가 완료:', newItem.itemId);
    return newItem.itemId;
  }, []);

  /**
   * 아이템 삭제
   */
  const deleteItem = useCallback((periodId, itemId) => {
    console.log('아이템 삭제:', { periodId, itemId });

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: prev.periods.map(period =>
        period.periodId === periodId
          ? {
              ...period,
              items: period.items.filter(item => item.itemId !== itemId)
            }
          : period
      )
    }));

    console.log('아이템 삭제 완료');
  }, []);

  /**
   * 아이템 수정
   */
  const updateItem = useCallback((periodId, itemId, updates) => {
    console.log('아이템 수정:', { periodId, itemId, updates });

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: prev.periods.map(period =>
        period.periodId === periodId
          ? {
              ...period,
              items: period.items.map(item =>
                item.itemId === itemId
                  ? { ...item, ...updates }
                  : item
              )
            }
          : period
      )
    }));

    console.log('아이템 수정 완료');
  }, []);

  /**
   * 새 시기 추가
   */
  const addPeriod = useCallback((periodData) => {
    console.log('시기 추가:', periodData);

    const newPeriod = {
      periodId: generateId(),
      name: periodData.name,
      shortName: periodData.shortName,
      startDate: periodData.startDate,
      endDate: periodData.endDate,
      order: periodData.order || project.periods.length + 1,
      items: []
    };

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: [...prev.periods, newPeriod].sort((a, b) => a.order - b.order)
    }));

    console.log('시기 추가 완료:', newPeriod.periodId);
    return newPeriod.periodId;
  }, [project.periods.length]);

  /**
   * 시기 삭제
   */
  const deletePeriod = useCallback((periodId) => {
    console.log('시기 삭제:', periodId);

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      periods: prev.periods.filter(period => period.periodId !== periodId)
    }));

    console.log('시기 삭제 완료');
  }, []);

  /**
   * 새 집단 추가
   */
  const addPopulation = useCallback((populationData) => {
    console.log('집단 추가:', populationData);

    const newPopulation = {
      populationId: generateId(),
      name: populationData.name,
      parentPopulation: populationData.parentPopulation || null,
      currentStatus: populationData.currentStatus || '예정',
      activePeriods: populationData.activePeriods || [],
      notes: populationData.notes || ''
    };

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      populations: [...prev.populations, newPopulation]
    }));

    console.log('집단 추가 완료:', newPopulation.populationId);
    return newPopulation.populationId;
  }, []);

  /**
   * 집단 삭제
   */
  const deletePopulation = useCallback((populationId) => {
    console.log('집단 삭제:', populationId);

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      populations: prev.populations.filter(pop => pop.populationId !== populationId)
    }));

    console.log('집단 삭제 완료');
  }, []);

  /**
   * 집단 업데이트
   */
  const updatePopulation = useCallback((populationId, updates) => {
    console.log('집단 업데이트:', { populationId, updates });

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      populations: prev.populations.map(pop =>
        pop.populationId === populationId
          ? { ...pop, ...updates }
          : pop
      )
    }));

    console.log('집단 업데이트 완료');
  }, []);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback((updates) => {
    console.log('설정 업데이트:', updates);

    setProject(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      settings: {
        ...prev.settings,
        ...updates
      }
    }));

    console.log('설정 업데이트 완료');
  }, []);

  /**
   * 프로젝트 전체 데이터 교체 (Import용)
   */
  const setProjectData = useCallback((data) => {
    console.log('프로젝트 데이터 교체');

    if (!validateProjectData(data)) {
      console.error('유효하지 않은 프로젝트 데이터');
      throw new Error('유효하지 않은 프로젝트 데이터입니다');
    }

    setProject(data);
    console.log('프로젝트 데이터 교체 완료');
  }, []);

  /**
   * 프로젝트 초기화
   */
  const resetProject = useCallback(() => {
    console.log('프로젝트 초기화');
    setProject(INITIAL_PROJECT);
    console.log('프로젝트 초기화 완료');
  }, []);

  return {
    project,
    toggleItem,
    updateMemo,
    addItem,
    deleteItem,
    updateItem,
    addPeriod,
    deletePeriod,
    addPopulation,
    deletePopulation,
    updatePopulation,
    updateSettings,
    setProjectData,
    resetProject
  };
}
