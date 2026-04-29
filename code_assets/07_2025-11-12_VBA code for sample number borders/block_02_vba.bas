   If i <= sampleCount Then
       With ws_data.Range(ws_data.Cells(currentRow - 1, 1), ws_data.Cells(currentRow - 1, traitCount + 2))
           .Borders(xlEdgeBottom).Weight = xlThick
           .Borders(xlEdgeBottom).LineStyle = xlContinuous
       End With
   End If
   