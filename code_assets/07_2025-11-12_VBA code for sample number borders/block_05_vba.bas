Private Function VerifyAuthor() As Boolean
    ' 숨겨진 시트에 저작권 정보 저장
    Dim hiddenSheet As Worksheet
    On Error Resume Next
    Set hiddenSheet = ThisWorkbook.Sheets("__META__")
    
    If hiddenSheet Is Nothing Then
        ' 숨겨진 시트 생성
        Set hiddenSheet = ThisWorkbook.Sheets.Add
        hiddenSheet.Name = "__META__"
        hiddenSheet.Range("A1").Value = "AUTHOR:Somyeo"
        hiddenSheet.Range("A2").Value = "DATE:" & Now
        hiddenSheet.Range("A3").Value = "HASH:" & GenerateHash()
        hiddenSheet.Visible = xlSheetVeryHidden  ' 매우 숨김
    End If
    
    ' 검증
    If hiddenSheet.Range("A1").Value <> "AUTHOR:Somyeo" Then
        MsgBox "저작권 정보가 변조되었습니다!", vbCritical
        Return False
    End If
    Return True
End Function
