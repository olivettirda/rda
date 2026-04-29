Sub 목록생성()
    Dim wsInput As Worksheet
    Dim wsOutput As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim j As Long
    Dim varietyName As String
    Dim repeatCount As Long
    Dim outputRow As Long
    
    Set wsInput = ThisWorkbook.Sheets("입력")
    Set wsOutput = ThisWorkbook.Sheets("목록")
    
    wsOutput.Rows("3:" & wsOutput.Rows.Count).ClearContents
    
    lastRow = wsInput.Cells(wsInput.Rows.Count, "A").End(xlUp).Row
    
    outputRow = 3
    
    For i = 4 To lastRow
        varietyName = Trim(wsInput.Cells(i, 1).Value)
        
        On Error Resume Next
        repeatCount = CLng(wsInput.Cells(i, 2).Value)
        If Err.Number <> 0 Then
            repeatCount = 0
            Err.Clear
        End If
        On Error GoTo 0
        
        If varietyName <> "" And repeatCount > 0 Then
            For j = 1 To repeatCount
                wsOutput.Cells(outputRow, 1).Value = varietyName & "-" & j
                outputRow = outputRow + 1
            Next j
        End If
    Next i
    
    If outputRow > 3 Then
        MsgBox "목록이 생성되었습니다!" & vbCrLf & _
               "총 " & (outputRow - 3) & "개 항목이 생성되었습니다.", _
               vbInformation, "완료"
        
        wsOutput.Activate
        wsOutput.Range("A3").Select
    Else
        MsgBox "생성할 데이터가 없습니다." & vbCrLf & _
               "품종명과 반복수를 확인해주세요.", _
               vbExclamation, "알림"
    End If
End Sub
