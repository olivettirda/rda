# 포트폴리오 관리 스크립트

이 디렉토리에는 프로젝트 포트폴리오를 관리하기 위한 유틸리티 스크립트들이 포함되어 있습니다.

## 📊 portfolio_stats.sh

프로젝트의 파일 통계를 수집하여 포트폴리오 업데이트에 필요한 정보를 제공합니다.

### 사용 방법

```bash
# 프로젝트 루트에서 실행
./scripts/portfolio_stats.sh

# 또는 어느 디렉토리에서든
cd /path/to/rda
bash scripts/portfolio_stats.sh
```

### 출력 정보

1. **HTML 파일 통계**: 각 HTML 파일의 크기 및 라인 수
2. **데스크톱 앱 통계**: sticky_notes_app의 총 파일 수, 라인 수, 크기
3. **전체 프로젝트 통계**: HTML 파일 개수 및 총 라인 수
4. **최근 커밋**: 최근 10개 커밋 내역

### 활용 예시

포트폴리오 업데이트 시:

```bash
# 1. 통계 수집
./scripts/portfolio_stats.sh > stats.txt

# 2. 특정 파일만 확인
./scripts/portfolio_stats.sh | grep "sticky"

# 3. 라인 수만 추출
./scripts/portfolio_stats.sh | grep "총 라인 수"
```

## 포트폴리오 업데이트 워크플로우

자세한 포트폴리오 업데이트 지침은 `CLAUDE.md` 파일의 "포트폴리오 업데이트 규칙" 섹션을 참조하세요.

### 빠른 체크리스트

- [ ] `./scripts/portfolio_stats.sh` 실행
- [ ] 새 도구/기능을 `PORTFOLIO.md` 섹션 3에 추가
- [ ] 상세 설명을 `PORTFOLIO.md` 섹션 4에 추가
- [ ] 마일스톤을 `PORTFOLIO.md` 섹션 7.3에 추가
- [ ] 최근 업데이트를 `PORTFOLIO.md` 섹션 9에 작성
- [ ] 날짜 업데이트 (문서 하단)
- [ ] 커밋 및 푸시

```bash
git add PORTFOLIO.md
git commit -m "Update portfolio with recent developments"
git push
```
