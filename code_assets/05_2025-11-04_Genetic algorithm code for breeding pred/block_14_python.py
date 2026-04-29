def create_simple_breeding_template():
    """
    BLAST 결과만으로 채울 수 있는 간단한 템플릿
    """
    
    output_file = '/mnt/user-data/outputs/simple_marker_template.xlsx'
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        
        # Sheet 1: 마커 정보 (BLAST로 채울 수 있는 부분)
        marker_template = pd.DataFrame({
            'Marker_Name': [''] * 30,
            'Gene_Symbol': [''] * 30,
            'Primer_F': [''] * 30,
            'Primer_R': [''] * 30,
            'Chromosome': [''] * 30,
            'Physical_Position_Mb': ['BLAST 결과 입력'] * 30,
            'Estimated_cM': ['자동 계산됨'] * 30,
            'Marker_Type': ['KASP/SSR/SNP 선택'] * 30,
            'Notes': [''] * 30
        })
        marker_template.to_excel(writer, sheet_name='Marker_Input', index=False)
        
        # Sheet 2: 간단한 연관 계산
        linkage_calc = pd.DataFrame({
            'Marker1': [''] * 20,
            'Chr1': [''] * 20,
            'Position1_Mb': [''] * 20,
            'Marker2': [''] * 20,
            'Chr2': [''] * 20,
            'Position2_Mb': [''] * 20,
            'Physical_Distance_Mb': ['=ABS(C2-F2)'] * 20,
            'Same_Chromosome': ['=IF(B2=E2,"Yes","No")'] * 20,
            'Estimated_Genetic_Distance_cM': ['=IF(H2="Yes",G2*3.5,"독립")'] * 20,
            'Linkage_Status': ['=IF(I2<50,"연관","독립")'] * 20,
            'Backcross_Risk': ['=IF(I2<10,"High",IF(I2<20,"Medium","Low"))'] * 20
        })
        linkage_calc.to_excel(writer, sheet_name='Linkage_Calculator', index=False)
        
        # Sheet 3: 여교배 의사결정
        decision_template = pd.DataFrame({
            'Target_Gene': [''] * 10,
            'Chromosome': [''] * 10,
            'Position_Mb': [''] * 10,
            'Linked_Undesirable_Genes': ['10cM 이내 유전자 목록'] * 10,
            'Linkage_Drag_Score': ['연관 유전자 수 / 10'] * 10,
            'Backcross_Needed': ['=IF(E2>0.3,"Yes","No")'] * 10,
            'Recommended_BC_Generations': ['=IF(F2="Yes",IF(E2>0.5,4,3),0)'] * 10,
            'MAS_Markers': ['Foreground 마커 목록'] * 10,
            'Background_Markers': ['각 염색체당 2-3개'] * 10,
            'Estimated_Time_Years': ['=G2*0.5+2'] * 10
        })
        decision_template.to_excel(writer, sheet_name='Backcross_Decision', index=False)
        
        # Sheet 4: 사용 설명
        instructions = pd.DataFrame({
            'Step': [1, 2, 3, 4, 5],
            'Action': [
                'BLAST로 마커의 물리적 위치(Mb) 확인',
                'Marker_Input 시트에 위치 정보 입력',
                'Linkage_Calculator로 마커 간 연관 확인',
                'Backcross_Decision에서 여교배 필요성 판단',
                'linkage가 강한 경우(< 10cM) BC3-4 권장'
            ],
            'Notes': [
                'NCBI, RAP-DB, Gramene 등 활용',
                '염색체 번호와 Mb 단위 위치',
                '같은 염색체 내 50cM 이하면 연관',
                'Linkage drag 점수 0.3 이상이면 여교배',
                '독립적 분리 원할 시 20cM 이상 필요'
            ]
        })
        instructions.to_excel(writer, sheet_name='Instructions', index=False)
    
    print(f"✅ 간단한 템플릿 생성 완료: {output_file}")
    return output_file

# 실행
template_file = create_simple_breeding_template()
