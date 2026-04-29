' 시작 시 자동 실행
Private Sub Workbook_Open()
    ' 저작권 표시
    Application.StatusBar = "© 2025 Somyeo - National Seed Service"
    
    ' 숨겨진 검증
    If Not VerifyAuthor() Then
        ThisWorkbook.Close SaveChanges:=False
    End If
End Sub
