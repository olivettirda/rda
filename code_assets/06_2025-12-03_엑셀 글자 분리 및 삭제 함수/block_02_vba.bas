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
