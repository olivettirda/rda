# 여교배 전략 실행
def execute_backcross_analysis(breeding_combinations_df, marker_positions):
    """
    모든 교배조합에 대한 여교배 전략 분석
    """
    
    results = []
    
    for idx, combo in breeding_combinations_df.iterrows():
        # 목표 형질 설정
        target_traits = ['Pb1 gene', 'Pita2 gene', 'SSIIa gene']
        
        # 여교배 시스템 초기화
        bc_system = BackcrossDecisionSystem(marker_positions)
        
        # 평가 수행
        assessment = bc_system.assess_breeding_combination(
            combo['Parent1'], 
            combo['Parent2'], 
            target_traits
        )
        
        # 최적 마커 세트 선택
        optimal_markers = bc_system.optimize_marker_set(target_traits, budget_constraint=100)
        
        # 육종 파이프라인 생성
        pipeline = bc_system.generate_breeding_pipeline({
            'trait_complexity': 'medium',
            'target_traits': target_traits
        })
        
        results.append({
            'Combination': f"{combo['Parent1']} × {combo['Parent2']}",
            'Backcross_Required': assessment['backcross_required'],
            'BC_Generations': assessment.get('bc_generations', 0),
            'Total_Years': pipeline['total_duration_years'],
            'Optimal_Markers': ', '.join(optimal_markers[:5]),
            'Success_Probability': np.random.uniform(0.7, 0.95)  # 시뮬레이션
        })
    
    return pd.DataFrame(results)

# 실행
backcross_results = execute_backcross_analysis(
    breeding_combinations_df, 
    marker_positions
)

print(backcross_results.head())
