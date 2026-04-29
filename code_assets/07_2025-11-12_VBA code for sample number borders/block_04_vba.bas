Sub ProtectWorkbook()
    ' 워크북 구조 보호
    ActiveWorkbook.Protect Password:="your_password", Structure:=True
    
    ' 각 시트 보호
    Dim ws As Worksheet
    For Each ws In ActiveWorkbook.Worksheets
        ws.Protect Password:="your_password", _
                   DrawingObjects:=True, _
                   Contents:=True, _
                   Scenarios:=True
    Next ws
End Sub
