# 마커의 염색체 위치 정보 (예시)
marker_positions = pd.DataFrame({
    'Gene': ['Pb1 gene', 'Pi-a gene', 'Pib gene', 'Pi-i/Pi3 gene', 
             'Pi-k gene', 'Pita2 gene', 'Piz gene', 'SSIIa gene', 
             'Waxy gene', 'Alk_TT/GC gene'],
    'Chromosome': [11, 11, 2, 9, 11, 12, 6, 6, 6, 6],
    'Position_Mb': [23.5, 25.2, 35.8, 15.3, 27.8, 10.5, 8.2, 4.5, 1.7, 4.8],
    'Effect_Type': ['major', 'minor', 'major', 'minor', 'minor', 
                    'major', 'major', 'major', 'major', 'major']
})
