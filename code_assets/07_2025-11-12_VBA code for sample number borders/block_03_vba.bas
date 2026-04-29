   If i > 2 Then
       With ws_data.Range(ws_data.Cells(sampleStartRow, 1), ws_data.Cells(sampleStartRow, traitCount + 2))
           .Borders(xlEdgeTop).Weight = xlThick
           .Borders(xlEdgeTop).LineStyle = xlContinuous
       End With
   End If
   