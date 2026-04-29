# 조건부 서식 추가
worksheet = writer.sheets['Progeny Prediction']
format_r = workbook.add_format({'bg_color': '#90EE90'})  # 연녹색
format_s = workbook.add_format({'bg_color': '#FFB6C1'})  # 연분홍

# R/S 컬럼에 조건부 서식 적용
worksheet.conditional_format('D2:E100', {
    'type': 'text',
    'criteria': 'containing',
    'value': 'R',
    'format': format_r
})
