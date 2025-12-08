# Skywork 슬라이드 제작 요청서

## 프레젠테이션 개요

| 항목 | 내용 |
|------|------|
| 제목 | AI 기반 벼 육종 시뮬레이터 - 작동 원리와 흐름 |
| 대상 | 육종 원리에 관심 있는 일반인, 농업 관계자 |
| 슬라이드 수 | 18장 |

---

## 디자인 가이드 (DMRT 컬러칩)

**배경:** #FFFFFF (흰색)

**컬러칩:**
| 변수명 | 컬러코드 | 용도 |
|--------|----------|------|
| Primary | #0c3026 | 제목, 강조 텍스트, 사이드바 |
| Primary Light | #0d4a3a | 호버, 서브 강조 |
| Secondary | #017f97 | 버튼, 링크, 아이콘 |
| Accent | #00a1b8 | 뱃지, 하이라이트 |
| BG Light | #f8faf9 | 코드블록 배경 |
| BG Section | #e8f0ed | 섹션 배경 |
| Border | #d4e5df | 테두리, 구분선 |
| Text | #0c3026 | 본문 텍스트 |
| Text Light | #5a6b65 | 보조 텍스트 |
| Text Muted | #8a9a94 | 비활성 텍스트 |
| Gradient | #0c3026 → #017f97 | 헤더, 카드 배경 |

---

## 슬라이드 구성

### 슬라이드 1: 표지
- **배경:** #FFFFFF
- **제목:** AI가 찾아주는 최적의 벼 품종 조합 (#0c3026)
- **부제:** 육종 시뮬레이터의 작동 원리 (#017f97)
- **하단 라인:** gradient (#0c3026 → #017f97)

---

### 슬라이드 2: 문제 제기
- **제목:** 왜 새 품종 개발이 어려울까? (#0c3026)
- **내용:**
  - 전통 육종: 10~15년 소요
  - 수천 개의 교배 조합
  - 후대 결과 예측 불가
- **시각화:** 타임라인 (아이콘: #017f97, 선: #d4e5df)
- **키 메시지 박스:** 배경 #e8f0ed, 테두리 #017f97

---

### 슬라이드 3: 솔루션 소개
- **제목:** AI 육종 시뮬레이터란? (#0c3026)
- **내용:**
  - 교배 전 결과 예측
  - 수천 개 조합 분석
  - 육종 기간 3~5년 단축 (#00a1b8 뱃지)
- **시각화:** Before/After (Before: #5a6b65, After: #017f97)

---

### 슬라이드 4: 전체 흐름도
- **제목:** 시뮬레이터 11단계 (#0c3026)
- **다이어그램:**
  - 박스 배경: #FFFFFF
  - 박스 테두리: #017f97
  - 화살표: #0c3026
  - 현재 단계: gradient 배경

```
[데이터 입력] → [데이터 정리] → [AI 학습] → [시각화]
      ↓
[최적 조합 탐색] → [교배 추천] → [후대 예측]
      ↓
[유전자 위치] → [상호작용] → [세대별 시뮬레이션] → [리포트]
```

---

### 슬라이드 5: 데이터 업로드
- **제목:** 1단계 - 품종 정보 입력 (#0c3026)
- **테이블:**
  - 헤더 배경: #0c3026, 텍스트: #FFFFFF
  - 행 배경: #FFFFFF / #f8faf9 교대
  - 테두리: #d4e5df

| 입력 데이터 | 예시 |
|------------|------|
| 품종명 | 일품, 추청, 삼광 |
| 유전자 보유 | Pi-ta, Wx |
| 형질 수치 | 수량, 밥맛 |

---

### 슬라이드 6: AI 학습
- **제목:** 2~3단계 - AI 패턴 학습 (#0c3026)
- **막대그래프:**
  - 최고 모델: #017f97
  - 나머지: #d4e5df
  - 선택 체크: #00a1b8

---

### 슬라이드 7: 히트맵 시각화
- **제목:** 4단계 - 유전자 지도 (#0c3026)
- **히트맵 색상:**
  - 보유(R): #017f97
  - 미보유(S): #e8f0ed
  - 테두리: #0c3026
  - 품종명: #0c3026

---

### 슬라이드 8: 최적 유전자 조합
- **제목:** 5단계 - 이상적인 조합 찾기 (#0c3026)
- **삼각형 다이어그램:**
  - 꼭짓점: #017f97
  - 선: #0c3026
  - 최적점: #00a1b8

---

### 슬라이드 9: NSGA-II 알고리즘
- **제목:** 진화를 모방한 최적화 (#0c3026)
- **단계 원형:**
  - 번호 원: #017f97 배경, #FFFFFF 텍스트
  - 연결선: #0c3026
- **진화 그래프:**
  - 선: gradient (#0c3026 → #017f97)
  - 포인트: #0c3026

---

### 슬라이드 10: 교배 조합 추천
- **제목:** 6단계 - 부모 조합 추천 (#0c3026)
- **순위 막대:**
  - 1위: #017f97 (강조)
  - 2위 이하: #d4e5df
  - 퍼센트 텍스트: #0c3026

---

### 슬라이드 11: 후대 예측
- **제목:** 7단계 - 자손 특성 예측 (#0c3026)
- **레이더 차트:**
  - 채우기: #017f97 (20% 투명)
  - 선: #017f97
  - 축: #d4e5df
  - 라벨: #0c3026

---

### 슬라이드 12: 유전자 상호작용
- **제목:** 8~9단계 - 유전자 관계 (#0c3026)
- **시너지:** #017f97 (↑ 화살표)
- **길항:** #8a9a94 (↓ 화살표)
- **염색체:** #0c3026
- **유전자 마커:** #00a1b8

---

### 슬라이드 13: 감수분열 원리 (핵심 코드 1)
- **제목:** 10단계 - 유전자 재조합 (#0c3026)
- **염색체 다이어그램:**
  - 아버지: #0c3026 (●)
  - 어머니: #017f97 (○)
  - 재조합 화살표: #00a1b8
- **코드 블록:**
  - 배경: #f8faf9
  - 테두리: #d4e5df
  - 키워드: #017f97
  - 주석: #8a9a94

```javascript
// Kosambi 함수
let recombRate = 0.5 * Math.tanh(2 * distance_cM / 100);

// 동원체 통과 시 50% 감소
if (crossesCentromere) recombRate *= 0.5;
```

---

### 슬라이드 14: 세대별 시뮬레이션 (핵심 코드 2)
- **제목:** F1~F7 시뮬레이션 (#0c3026)
- **흐름도:**
  - 박스: #FFFFFF, 테두리 #017f97
  - 화살표: #0c3026
  - 함수명: #017f97

```javascript
// F1 집단 생성
for (let i = 0; i < 500; i++)
    population.push(createF1(p1Haps, p2Haps));

// 세대 진전
for (let gen = 2; gen <= 7; gen++) {
    population = population.map(ind => selfFertilize(ind));
}
```

---

### 슬라이드 15: 세대별 변화 그래프
- **제목:** 세대별 변화 추이 (#0c3026)
- **이중 축 그래프:**
  - 고정률 (상승): #017f97
  - 연관블록 유지율 (하락): #0d4a3a
  - 배경 그리드: #e8f0ed
  - 축 라벨: #5a6b65

| 세대 | 고정률 | 연관블록 |
|------|--------|----------|
| F1 | 0% | 100% |
| F3 | 50% | 70% |
| F7 | 95% | 40% |

---

### 슬라이드 16: 종합 리포트
- **제목:** 결과 보고서 (#0c3026)
- **체크리스트:**
  - 아이콘: #017f97
  - 텍스트: #0c3026
- **다운로드 버튼:** gradient 배경

---

### 슬라이드 17: 기술 & 효과
- **제목:** 기술적 특징 (#0c3026)
- **기술 스택 아이콘:** #017f97
- **효과 비교 테이블:**
  - 개선 수치: #00a1b8 뱃지
  - 헤더: #0c3026

---

### 슬라이드 18: 마무리
- **제목:** AI와 육종의 만남 (#0c3026)
- **인용문 박스:**
  - 배경: gradient (#0c3026 → #017f97)
  - 텍스트: #FFFFFF
  - > "좋은 품종은 우연이 아닌 과학으로"
- **하단:** #0c3026 라인

---

## 컬러칩 시각 요약

```
Primary:       #0c3026  진한 녹색 (제목, 강조)
Primary Light: #0d4a3a  녹색 (호버)
Secondary:     #017f97  청록색 (버튼, 아이콘)
Accent:        #00a1b8  밝은 청록 (뱃지)
Background:    #ffffff  흰색 (배경)
BG Light:      #f8faf9  연한 회색 (코드블록)
BG Section:    #e8f0ed  연한 민트 (섹션)
Border:        #d4e5df  연한 녹색 (테두리)
Text Light:    #5a6b65  회녹색 (보조텍스트)
Text Muted:    #8a9a94  회색 (비활성)

Gradient: linear-gradient(135deg, #0c3026 → #017f97)
```

---

## 부록: 핵심 코드

### A. 부모 Haplotype 생성
```javascript
function createParentHaplotypes(genoArray) {
    const hap1 = [], hap2 = [];
    genoArray.forEach(g => {
        const val = ['R', '1'].includes(g) ? 1 : 0;
        if (val === 0) { hap1.push(0); hap2.push(0); }
        else { hap1.push(Math.random()<0.5?1:0); hap2.push(1); }
    });
    return [hap1, hap2];
}
```

### B. F1 생성
```javascript
function createF1(p1Haps, p2Haps) {
    const fromP1 = Math.random() < 0.5 ? p1Haps[0] : p1Haps[1];
    const fromP2 = Math.random() < 0.5 ? p2Haps[0] : p2Haps[1];
    return [fromP1.slice(), fromP2.slice()];
}
```

### C. 감수분열 (재조합)
```javascript
function meiosis(haplotypes) {
    const [hap1, hap2] = haplotypes;
    const gamete = new Array(hap1.length);

    for (const [chr, markers] of Object.entries(chrGroups)) {
        let currentHap = Math.random() < 0.5 ? 0 : 1;

        for (let i = 1; i < markers.length; i++) {
            const distance = markers[i].position_cM - markers[i-1].position_cM;
            let recombRate = 0.5 * Math.tanh(2 * distance / 100);
            if (crossesCentromere) recombRate *= 0.5;
            if (Math.random() < recombRate) currentHap = 1 - currentHap;
            gamete[markers[i].idx] = currentHap === 0 ? hap1[i] : hap2[i];
        }
    }
    return gamete;
}
```

### D. 자가수정 & Genotype 변환
```javascript
function selfFertilize(haps) {
    return [meiosis(haps), meiosis(haps)];
}

function hapsToGeno(haps) {
    return haps[0].map((h1, i) => h1 + haps[1][i]);
}
```

### E. 연관 블록 유지율
```javascript
function calcLinkageRetention(population) {
    let total = 0, retained = 0;
    population.forEach(ind => {
        if (ind[0][i] === ind[0][i+1]) retained++;
        total++;
    });
    return retained / total;
}
```

---

## 발표 시간 배분 (10분)

| 섹션 | 슬라이드 | 시간 |
|------|---------|------|
| 도입 (문제-솔루션) | 1~3 | 1분 |
| 전체 흐름 | 4 | 30초 |
| 데이터~AI 학습 | 5~7 | 1분 |
| 최적화 알고리즘 | 8~9 | 1분 30초 |
| 교배 추천~후대 예측 | 10~11 | 1분 |
| 유전자 상호작용 | 12 | 30초 |
| **핵심 코드 (감수분열~시뮬레이션)** | **13~15** | **2분 30초** |
| 마무리 | 16~18 | 2분 |

**빠르게 넘길 슬라이드:** 5, 6, 7, 12 (각 15~20초)

**집중 설명 슬라이드:** 9(NSGA-II), 13~14(핵심 코드)
