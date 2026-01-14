#!/bin/bash
# portfolio_stats.sh
# 포트폴리오 업데이트를 위한 파일 통계 수집 스크립트

echo "========================================="
echo "   포트폴리오 통계 수집 도구"
echo "========================================="
echo ""

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.." || exit 1

echo "📊 HTML 파일 통계"
echo "-------------------"
find . -name "*.html" \
  -not -path "./node_modules/*" \
  -not -path "./sticky_notes_app/node_modules/*" \
  -not -path "./.git/*" | sort | while read -r file; do
    lines=$(wc -l < "$file" 2>/dev/null || echo "0")
    size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "N/A")
    # 천 단위 구분자 추가
    lines_formatted=$(echo "$lines" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta')
    printf "  %-50s %8s  %10s줄\n" "$file" "$size" "$lines_formatted"
done

echo ""
echo "📦 데스크톱 앱 통계 (sticky_notes_app/)"
echo "-------------------"
if [ -d "sticky_notes_app" ]; then
    total_lines=$(find sticky_notes_app -name "*.html" -o -name "*.js" -o -name "*.css" | \
                  xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    total_files=$(find sticky_notes_app -name "*.html" -o -name "*.js" -o -name "*.css" | wc -l)
    total_size=$(du -sh sticky_notes_app 2>/dev/null | cut -f1)

    echo "  총 파일 수: $total_files개"
    echo "  총 라인 수: $(echo "$total_lines" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta')줄"
    echo "  총 크기: $total_size"
else
    echo "  (디렉토리 없음)"
fi

echo ""
echo "📈 전체 프로젝트 통계"
echo "-------------------"
total_html=$(find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*" | wc -l)
total_html_lines=$(find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*" | \
                   xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

echo "  HTML 파일 개수: $total_html개"
echo "  HTML 총 라인 수: $(echo "$total_html_lines" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta')줄"

echo ""
echo "📅 최근 커밋 (최근 10개)"
echo "-------------------"
git log --oneline -10 --pretty=format:"  %h %ad - %s" --date=short

echo ""
echo ""
echo "========================================="
echo "✅ 통계 수집 완료"
echo "========================================="
