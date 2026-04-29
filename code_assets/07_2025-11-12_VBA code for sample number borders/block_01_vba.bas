Option Explicit

Sub UpdateDataSheets_Korean()
    On Error GoTo ErrorHandler
    
    Dim wb As Workbook
    Dim ws_settings As Worksheet, ws_samples As Worksheet
    Dim ws_data As Worksheet, ws_calc As Worksheet, ws_stats As Worksheet
    
    Dim reps As Integer  ' 반복수
    Dim traitCount As Integer  ' 형질 개수
    Dim sampleCount As Long  ' 시료 개수
    Dim i As Long, j As Long, k As Long
    Dim currentRow As Long, currentCol As Long
    Dim startRow As Long, endRow As Long
    
    ' 현재 활성 워크북 사용
    Set wb = ActiveWorkbook
    
    ' 시트 설정 (한글 이름)
    Set ws_settings = wb.Sheets("설정")
    Set ws_samples = wb.Sheets("시료목록")
    Set ws_data = wb.Sheets("데이터입력")
    Set ws_calc = wb.Sheets("계산결과")
    Set ws_stats = wb.Sheets("상세통계")
    
    ' ========== 설정값 읽기 ==========
    ' 반복수 읽기
    reps = ws_settings.Range("B4").Value
    If reps < 1 Or reps > 30 Then
        MsgBox "반복수는 1~30 사이여야 합니다!", vbExclamation
        Exit Sub
    End If
    
    ' 형질 개수 카운트 (빈 행 제외)
    traitCount = 0
    For i = 12 To 31  ' 최대 20개 형질
        If ws_settings.Cells(i, 1).Value <> "" Then
            traitCount = traitCount + 1
        End If
    Next i
    
    If traitCount = 0 Then
        MsgBox "최소 1개 이상의 형질을 설정해주세요!", vbExclamation
        Exit Sub
    End If
    
    ' 시료 개수 카운트
    sampleCount = 0
    For i = 2 To 1000
        If ws_samples.Cells(i, 1).Value <> "" Then
            sampleCount = sampleCount + 1
        Else
            Exit For
        End If
    Next i
    
    If sampleCount = 0 Then
        MsgBox "시료번호를 먼저 입력하세요!", vbExclamation
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    ' ========== 데이터입력 시트 생성 ==========
    ws_data.Cells.Clear
    
    ' 헤더 생성
    ws_data.Cells(1, 1).Value = "시료번호"
    ws_data.Cells(1, 2).Value = "반복"
    
    ' 형질 헤더 추가
    For i = 1 To traitCount
        Dim traitName As String, unit As String, multiplier As Integer
        traitName = ws_settings.Cells(11 + i, 1).Value
        unit = ws_settings.Cells(11 + i, 2).Value
        multiplier = ws_settings.Cells(11 + i, 3).Value
        
        If multiplier > 1 Then
            ws_data.Cells(1, 2 + i).Value = traitName & "(" & unit & "×" & multiplier & ")"
        Else
            ws_data.Cells(1, 2 + i).Value = traitName & "(" & unit & ")"
        End If
    Next i
    
    ' 헤더 서식
    For i = 1 To traitCount + 2
        With ws_data.Cells(1, i)
            .Font.Bold = True
            .Font.Name = "맑은 고딕"
            .HorizontalAlignment = xlCenter
            .Interior.Color = RGB(212, 230, 241)
            .Borders.LineStyle = xlContinuous
        End With
    Next i
    
    ' ========== 데이터 행 생성 (굵은 테두리 추가) ==========
    currentRow = 2
    For i = 2 To sampleCount + 1
        Dim sampleName As String
        sampleName = ws_samples.Cells(i, 1).Value
        
        ' 시료번호 시작 행 저장 ★ 추가된 부분
        Dim sampleStartRow As Long
        sampleStartRow = currentRow
        
        For j = 1 To reps
            ws_data.Cells(currentRow, 1).Value = sampleName
            ws_data.Cells(currentRow, 2).Value = j
            
            ' 서식 적용
            For k = 1 To traitCount + 2
                With ws_data.Cells(currentRow, k)
                    .Font.Name = "맑은 고딕"
                    .HorizontalAlignment = xlCenter
                    .Borders.LineStyle = xlContinuous
                    If k <= 2 Then
                        .Interior.Color = RGB(242, 242, 242)
                    End If
                End With
            Next k
            
            currentRow = currentRow + 1
        Next j
        
        ' ★★★ 시료번호가 바뀌는 경계에 굵은 테두리 적용 ★★★
        ' 마지막 시료가 아닌 경우에만 아래쪽 테두리 적용
        If i <= sampleCount Then
            With ws_data.Range(ws_data.Cells(currentRow - 1, 1), ws_data.Cells(currentRow - 1, traitCount + 2))
                .Borders(xlEdgeBottom).Weight = xlThick
                .Borders(xlEdgeBottom).LineStyle = xlContinuous
            End With
        End If
        
        ' 첫 번째 시료가 아닌 경우 위쪽 테두리도 적용 (선택사항)
        If i > 2 Then
            With ws_data.Range(ws_data.Cells(sampleStartRow, 1), ws_data.Cells(sampleStartRow, traitCount + 2))
                .Borders(xlEdgeTop).Weight = xlThick
                .Borders(xlEdgeTop).LineStyle = xlContinuous
            End With
        End If
    Next i
    
    ' 설명 추가
    ws_data.Cells(1, traitCount + 4).Value = "※ 입력 단위를 확인하세요"
    ws_data.Cells(1, traitCount + 4).Font.Color = RGB(255, 0, 0)
    ws_data.Cells(1, traitCount + 4).Font.Bold = True
    
    ' ========== 계산결과 시트 생성 ==========
    ws_calc.Cells.Clear
    
    ' 헤더
    ws_calc.Cells(1, 1).Value = "시료번호"
    For i = 1 To traitCount
        traitName = ws_settings.Cells(11 + i, 1).Value
        unit = ws_settings.Cells(11 + i, 2).Value
        ws_calc.Cells(1, 1 + i).Value = traitName & "_평균(" & unit & ")"
    Next i
    
    ' 헤더 서식
    For i = 1 To traitCount + 1
        With ws_calc.Cells(1, i)
            .Font.Bold = True
            .Font.Name = "맑은 고딕"
            .HorizontalAlignment = xlCenter
            .Interior.Color = RGB(169, 223, 191)
            .Borders.LineStyle = xlContinuous
        End With
    Next i
    
    ' 계산 수식 입력
    For i = 1 To sampleCount
        ws_calc.Cells(i + 1, 1).Value = ws_samples.Cells(i + 1, 1).Value
        
        For j = 1 To traitCount
            multiplier = ws_settings.Cells(11 + j, 3).Value
            Dim decimalPlaces As Integer
            decimalPlaces = ws_settings.Cells(11 + j, 4).Value
            
            startRow = (i - 1) * reps + 2
            endRow = startRow + reps - 1
            
            Dim formula As String
            Dim colLetter As String
            colLetter = Chr(66 + j)  ' B, C, D, ...
            
            If multiplier > 1 Then
                formula = "=ROUND(AVERAGE(데이터입력!" & colLetter & startRow & ":" & _
                         colLetter & endRow & ")/" & multiplier & "," & decimalPlaces & ")"
            Else
                formula = "=ROUND(AVERAGE(데이터입력!" & colLetter & startRow & ":" & _
                         colLetter & endRow & ")," & decimalPlaces & ")"
            End If
            
            ws_calc.Cells(i + 1, j + 1).formula = formula
        Next j
        
        ' 서식 적용
        For k = 1 To traitCount + 1
            With ws_calc.Cells(i + 1, k)
                .Font.Name = "맑은 고딕"
                .HorizontalAlignment = xlCenter
                .Borders.LineStyle = xlContinuous
                If k = 1 Then
                    .Interior.Color = RGB(242, 242, 242)
                End If
            End With
        Next k
    Next i
    
    ' ========== 상세통계 시트 생성 ==========
    ws_stats.Cells.Clear
    
    ' 헤더
    ws_stats.Cells(1, 1).Value = "시료번호"
    currentCol = 2
    
    For i = 1 To traitCount
        traitName = ws_settings.Cells(11 + i, 1).Value
        unit = ws_settings.Cells(11 + i, 2).Value
        Dim calcStdev As String
        calcStdev = ws_settings.Cells(11 + i, 5).Value
        
        ws_stats.Cells(1, currentCol).Value = traitName & "_평균(" & unit & ")"
        currentCol = currentCol + 1
        
        If calcStdev = "O" Then
            ws_stats.Cells(1, currentCol).Value = traitName & "_표준편차"
            currentCol = currentCol + 1
        End If
    Next i
    
    ' 헤더 서식
    For i = 1 To currentCol - 1
        With ws_stats.Cells(1, i)
            .Font.Bold = True
            .Font.Name = "맑은 고딕"
            .Font.Size = 10
            .HorizontalAlignment = xlCenter
            .Interior.Color = RGB(249, 231, 159)
            .Borders.LineStyle = xlContinuous
        End With
    Next i
    
    ' 통계 계산
    For i = 1 To sampleCount
        ws_stats.Cells(i + 1, 1).Value = ws_samples.Cells(i + 1, 1).Value
        currentCol = 2
        
        For j = 1 To traitCount
            multiplier = ws_settings.Cells(11 + j, 3).Value
            decimalPlaces = ws_settings.Cells(11 + j, 4).Value
            calcStdev = ws_settings.Cells(11 + j, 5).Value
            
            startRow = (i - 1) * reps + 2
            endRow = startRow + reps - 1
            colLetter = Chr(66 + j)
            
            ' 평균
            If multiplier > 1 Then
                formula = "=ROUND(AVERAGE(데이터입력!" & colLetter & startRow & ":" & _
                         colLetter & endRow & ")/" & multiplier & "," & decimalPlaces & ")"
            Else
                formula = "=ROUND(AVERAGE(데이터입력!" & colLetter & startRow & ":" & _
                         colLetter & endRow & ")," & decimalPlaces & ")"
            End If
            ws_stats.Cells(i + 1, currentCol).formula = formula
            currentCol = currentCol + 1
            
            ' 표준편차
            If calcStdev = "O" Then
                If multiplier > 1 Then
                    formula = "=ROUND(STDEV(데이터입력!" & colLetter & startRow & ":" & _
                             colLetter & endRow & ")/" & multiplier & "," & (decimalPlaces + 1) & ")"
                Else
                    formula = "=ROUND(STDEV(데이터입력!" & colLetter & startRow & ":" & _
                             colLetter & endRow & ")," & (decimalPlaces + 1) & ")"
                End If
                ws_stats.Cells(i + 1, currentCol).formula = formula
                currentCol = currentCol + 1
            End If
        Next j
        
        ' 서식 적용
        For k = 1 To currentCol - 1
            With ws_stats.Cells(i + 1, k)
                .Font.Name = "맑은 고딕"
                .HorizontalAlignment = xlCenter
                .Borders.LineStyle = xlContinuous
                If k = 1 Then
                    .Interior.Color = RGB(242, 242, 242)
                End If
            End With
        Next k
    Next i
    
    ' 열 너비 자동 조정
    ws_data.Columns.AutoFit
    ws_calc.Columns.AutoFit
    ws_stats.Columns.AutoFit
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    
    MsgBox "데이터 시트가 성공적으로 생성되었습니다!" & vbCrLf & vbCrLf & _
           "※ 설정 요약" & vbCrLf & _
           "시료 수: " & sampleCount & "개" & vbCrLf & _
           "반복 수: " & reps & "회" & vbCrLf & _
           "형질 수: " & traitCount & "개" & vbCrLf & _
           "총 데이터 행: " & (sampleCount * reps) & "개", vbInformation, "완료"
           
    Exit Sub
    
ErrorHandler:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    
    MsgBox "오류가 발생했습니다!" & vbCrLf & vbCrLf & _
           "오류 내용: " & Err.Description & vbCrLf & _
           "오류 위치: " & Err.Source & vbCrLf & vbCrLf & _
           "시트 이름을 확인해주세요:" & vbCrLf & _
           "- 설정" & vbCrLf & _
           "- 시료목록" & vbCrLf & _
           "- 데이터입력" & vbCrLf & _
           "- 계산결과" & vbCrLf & _
           "- 상세통계", vbCritical, "오류"
End Sub
