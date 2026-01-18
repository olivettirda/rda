// LocalStorage 유틸리티 함수

const STORAGE_KEY = 'experiment-timeline-data';

/**
 * LocalStorage에서 프로젝트 데이터 로드
 * @returns {Object|null} 저장된 프로젝트 데이터 또는 null
 */
export const loadFromStorage = () => {
  try {
    console.log('LocalStorage에서 데이터 로드 시도');
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      console.log('저장된 데이터 없음');
      return null;
    }

    const data = JSON.parse(saved);
    console.log('데이터 로드 성공:', {
      projectId: data.projectId,
      periodsCount: data.periods?.length,
      populationsCount: data.populations?.length
    });

    return data;
  } catch (error) {
    console.error('LocalStorage 로드 오류:', JSON.stringify(error, null, 2));
    return null;
  }
};

/**
 * LocalStorage에 프로젝트 데이터 저장
 * @param {Object} data - 저장할 프로젝트 데이터
 */
export const saveToStorage = (data) => {
  try {
    console.log('LocalStorage에 데이터 저장:', {
      projectId: data.projectId,
      periodsCount: data.periods?.length,
      populationsCount: data.populations?.length,
      timestamp: new Date().toISOString()
    });

    const jsonString = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonString);

    console.log('저장 완료');
  } catch (error) {
    console.error('LocalStorage 저장 오류:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * LocalStorage 데이터 삭제
 */
export const clearStorage = () => {
  try {
    console.log('LocalStorage 데이터 삭제');
    localStorage.removeItem(STORAGE_KEY);
    console.log('삭제 완료');
  } catch (error) {
    console.error('LocalStorage 삭제 오류:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * JSON 파일로 export
 * @param {Object} data - export할 데이터
 * @param {string} filename - 파일명 (기본값: 프로젝트명_날짜.json)
 */
export const exportToJSON = (data, filename = null) => {
  try {
    console.log('JSON 파일로 export 시작:', { projectId: data.projectId });

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `${data.projectName}_${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('JSON export 완료:', finalFilename);
  } catch (error) {
    console.error('JSON export 오류:', JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * JSON 파일에서 import
 * @param {File} file - import할 JSON 파일
 * @returns {Promise<Object>} 파싱된 데이터
 */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    console.log('JSON 파일 import 시작:', { filename: file.name, size: file.size });

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        console.log('JSON import 성공:', {
          projectId: data.projectId,
          periodsCount: data.periods?.length,
          populationsCount: data.populations?.length
        });
        resolve(data);
      } catch (error) {
        console.error('JSON 파싱 오류:', JSON.stringify(error, null, 2));
        reject(new Error('JSON 파일 형식이 올바르지 않습니다'));
      }
    };

    reader.onerror = () => {
      console.error('파일 읽기 오류:', reader.error);
      reject(new Error('파일을 읽을 수 없습니다'));
    };

    reader.readAsText(file);
  });
};

/**
 * 데이터 유효성 검사
 * @param {Object} data - 검사할 데이터
 * @returns {boolean} 유효성 여부
 */
export const validateProjectData = (data) => {
  console.log('프로젝트 데이터 유효성 검사 시작');

  const requiredFields = ['projectId', 'projectName', 'periods', 'populations', 'settings'];
  const isValid = requiredFields.every(field => field in data);

  if (!isValid) {
    console.error('필수 필드 누락:', {
      required: requiredFields,
      actual: Object.keys(data)
    });
    return false;
  }

  if (!Array.isArray(data.periods) || !Array.isArray(data.populations)) {
    console.error('periods 또는 populations가 배열이 아님');
    return false;
  }

  console.log('데이터 유효성 검사 통과');
  return true;
};
