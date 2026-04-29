Option Explicit

' =====================================================
' 함수명: SplitText
' 설명: 지정된 글자수만큼 텍스트를 분리
' 매개변수:
'   - text: 원본 텍스트
'   - charCount: 분리할 글자수 (영문 기준)
'   - direction: 방향 ("왼쪽"/"LEFT" 또는 "오른쪽"/"RIGHT")
' 반환값: 분리된 텍스트 (2글자 분리 시 배열로 반환)
' =====================================================
Function SplitText(text As String, charCount As Integer, direction As String) As Variant
    Dim result As String
    Dim upperDir As String
    Dim byteLength As Integer
    Dim leftPart As String
    Dim rightPart As String
    
    ' 입력값 검증
    If text = "" Then
        SplitText = CVErr(xlErrValue)
        Exit Function
    End If
    
    If charCount <= 0 Then
        SplitText = CVErr(xlErrValue)
        Exit Function
    End If
    
    ' 방향 문자열 정규화
    upperDir = UCase(Trim(direction))
    
    ' 영문 기준 바이트 길이 계산 (한글=2바이트, 영문=1바이트)
    byteLength = LenB(StrConv(text, vbFromUnicode))
    
    ' 분리할 글자수가 전체 길이보다 크면 원본 반환
    If charCount >= byteLength Then
        If upperDir = "왼쪽" Or upperDir = "LEFT" Then
            SplitText = Array(text, "")
        Else
            SplitText = Array("", text)
        End If
        Exit Function
    End If
    
    ' 방향에 따라 분리
    Select Case upperDir
        Case "왼쪽", "LEFT"
            leftPart = LeftB(StrConv(text, vbFromUnicode), charCount)
            leftPart = StrConv(leftPart, vbUnicode)
            rightPart = Mid(text, Len(leftPart) + 1)
            SplitText = Array(leftPart, rightPart)
            
        Case "오른쪽", "RIGHT"
            rightPart = RightB(StrConv(text, vbFromUnicode), charCount)
            rightPart = StrConv(rightPart, vbUnicode)
            leftPart = Left(text, Len(text) - Len(rightPart))
            SplitText = Array(leftPart, rightPart)
            
        Case Else
            SplitText = CVErr(xlErrValue)
    End Select
End Function

' =====================================================
' 함수명: DeleteText
' 설명: 지정된 글자수만큼 텍스트를 삭제
' 매개변수:
'   - text: 원본 텍스트
'   - charCount: 삭제할 글자수 (영문 기준)
'   - direction: 방향 ("왼쪽"/"LEFT" 또는 "오른쪽"/"RIGHT")
' 반환값: 삭제 후 남은 텍스트
' =====================================================
Function DeleteText(text As String, charCount As Integer, direction As String) As String
    Dim result As String
    Dim upperDir As String
    Dim byteLength As Integer
    Dim tempPart As String
    
    ' 입력값 검증
    If text = "" Then
        DeleteText = ""
        Exit Function
    End If
    
    If charCount <= 0 Then
        DeleteText = text
        Exit Function
    End If
    
    ' 방향 문자열 정규화
    upperDir = UCase(Trim(direction))
    
    ' 영문 기준 바이트 길이 계산
    byteLength = LenB(StrConv(text, vbFromUnicode))
    
    ' 삭제할 글자수가 전체 길이보다 크면 빈 문자열 반환
    If charCount >= byteLength Then
        DeleteText = ""
        Exit Function
    End If
    
    ' 방향에 따라 삭제
    Select Case upperDir
        Case "왼쪽", "LEFT"
            ' 왼쪽에서 charCount만큼 삭제
            tempPart = LeftB(StrConv(text, vbFromUnicode), charCount)
            tempPart = StrConv(tempPart, vbUnicode)
            result = Mid(text, Len(tempPart) + 1)
            
        Case "오른쪽", "RIGHT"
            ' 오른쪽에서 charCount만큼 삭제
            tempPart = RightB(StrConv(text, vbFromUnicode), charCount)
            tempPart = StrConv(tempPart, vbUnicode)
            result = Left(text, Len(text) - Len(tempPart))
            
        Case Else
            result = CVErr(xlErrValue)
    End Select
    
    DeleteText = result
End Function

' =====================================================
' 함수명: SplitTextLeft
' 설명: 왼쪽에서 지정된 글자수만큼 분리 (단일 결과 반환)
' =====================================================
Function SplitTextLeft(text As String, charCount As Integer) As String
    Dim parts As Variant
    parts = SplitText(text, charCount, "왼쪽")
    If IsArray(parts) Then
        SplitTextLeft = parts(0)
    Else
        SplitTextLeft = CVErr(xlErrValue)
    End If
End Function

' =====================================================
' 함수명: SplitTextRight
' 설명: 오른쪽에서 지정된 글자수만큼 분리 (단일 결과 반환)
' =====================================================
Function SplitTextRight(text As String, charCount As Integer) As String
    Dim parts As Variant
    parts = SplitText(text, charCount, "오른쪽")
    If IsArray(parts) Then
        SplitTextRight = parts(1)
    Else
        SplitTextRight = CVErr(xlErrValue)
    End If
End Function

' =====================================================
' 함수명: ByteLength
' 설명: 텍스트의 영문 기준 바이트 길이 반환 (한글=2, 영문=1)
' =====================================================
Function ByteLength(text As String) As Integer
    ByteLength = LenB(StrConv(text, vbFromUnicode))
End Function

' =====================================================
' 함수명: ReverseText
' 설명: 문자열을 역순으로 변환
' =====================================================
Function ReverseText(text As String) As String
    Dim i As Integer
    Dim result As String
    result = ""
    For i = Len(text) To 1 Step -1
        result = result & Mid(text, i, 1)
    Next i
    ReverseText = result
End Function

' =====================================================
' 함수명: ReverseSortKey
' 설명: 뒤에서부터 정렬하기 위한 정렬 키 생성
' 사용법: 이 함수를 보조열에 넣고 해당 열로 정렬하세요
' =====================================================
Function ReverseSortKey(text As String) As String
    ReverseSortKey = ReverseText(text)
End Function

' =====================================================
' 서브루틴: SortByReverse
' 설명: 선택한 범위를 뒤에서부터 정렬
' 사용법: 
'   1. 정렬할 데이터 범위 선택
'   2. Alt+F8 눌러서 매크로 실행
'   3. "SortByReverse" 선택하여 실행
' =====================================================
Sub SortByReverse()
    Dim ws As Worksheet
    Dim rng As Range
    Dim lastCol As Long
    Dim lastRow As Long
    Dim helperCol As Long
    Dim sortCol As Long
    Dim i As Long
    Dim sortRange As Range
    
    ' 현재 시트와 선택 영역 확인
    Set ws = ActiveSheet
    Set rng = Selection
    
    If rng.Columns.Count > 1 Then
        MsgBox "한 열만 선택해주세요!", vbExclamation
        Exit Sub
    End If
    
    If rng.Rows.Count < 2 Then
        MsgBox "최소 2개 이상의 셀을 선택해주세요!", vbExclamation
        Exit Sub
    End If
    
    ' 정렬할 열 번호 저장
    sortCol = rng.Column
    lastRow = rng.Row + rng.Rows.Count - 1
    
    ' 보조 열 위치 찾기 (마지막 열 + 1)
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    helperCol = lastCol + 1
    
    ' 보조 열에 역순 키 생성
    For i = rng.Row To lastRow
        ws.Cells(i, helperCol).Value = ReverseText(ws.Cells(i, sortCol).Value)
    Next i
    
    ' 보조 열 기준으로 정렬
    Set sortRange = ws.Range(ws.Cells(rng.Row, sortCol), ws.Cells(lastRow, helperCol))
    sortRange.Sort Key1:=ws.Cells(rng.Row, helperCol), _
                     Order1:=xlAscending, _
                     Header:=xlNo
    
    ' 보조 열 삭제
    ws.Columns(helperCol).Delete
    
    MsgBox "역순 정렬 완료!", vbInformation
End Sub

' =====================================================
' 서브루틴: SortByReverseDescending
' 설명: 선택한 범위를 뒤에서부터 내림차순 정렬
' =====================================================
Sub SortByReverseDescending()
    Dim ws As Worksheet
    Dim rng As Range
    Dim lastCol As Long
    Dim lastRow As Long
    Dim helperCol As Long
    Dim sortCol As Long
    Dim i As Long
    Dim sortRange As Range
    
    Set ws = ActiveSheet
    Set rng = Selection
    
    If rng.Columns.Count > 1 Then
        MsgBox "한 열만 선택해주세요!", vbExclamation
        Exit Sub
    End If
    
    If rng.Rows.Count < 2 Then
        MsgBox "최소 2개 이상의 셀을 선택해주세요!", vbExclamation
        Exit Sub
    End If
    
    sortCol = rng.Column
    lastRow = rng.Row + rng.Rows.Count - 1
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    helperCol = lastCol + 1
    
    For i = rng.Row To lastRow
        ws.Cells(i, helperCol).Value = ReverseText(ws.Cells(i, sortCol).Value)
    Next i
    
    Set sortRange = ws.Range(ws.Cells(rng.Row, sortCol), ws.Cells(lastRow, helperCol))
    sortRange.Sort Key1:=ws.Cells(rng.Row, helperCol), _
                     Order1:=xlDescending, _
                     Header:=xlNo
    
    ws.Columns(helperCol).Delete
    
    MsgBox "역순 내림차순 정렬 완료!", vbInformation
End Sub
