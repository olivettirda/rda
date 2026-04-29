class BackcrossDecisionSystem:
    """
    여교배 의사결정 통합 시스템
    """
    
    def __init__(self, marker_positions, genetic_map=None):
        self.marker_positions = marker_positions
        self.genetic_map = genetic_map
        self.genetic_distances = self.calculate_genetic_distance()
        
    def calculate_genetic_distance(self):
        """마커간 유전적 거리 계산"""
        # 위의 함수 구현
        pass
    
    def assess_breeding_combination(self, parent1, parent2, target_traits):
        """
        특정 교배조합에 대한 여교배 필요성 평가
        """
        assessment = {
            'direct_selection_possible': False,
            'backcross_required': False,
            'marker_assisted_backcross': False,
            'genomic_selection_recommended': False,
            'estimated_time_years': 0,
            'estimated_cost_index': 0
        }
        
        # 1. Direct selection 가능성 평가
        linkage_analysis = self.analyze_linkage(target_traits)
        
        if linkage_analysis['max_linkage_distance'] > 50:
            assessment['direct_selection_possible'] = True
            assessment['estimated_time_years'] = 3
            assessment['estimated_cost_index'] = 1.0
        
        # 2. 여교배 필요성 평가
        elif linkage_analysis['linkage_drag_score'] > 0.3:
            assessment['backcross_required'] = True
            assessment['marker_assisted_backcross'] = True
            
            # 필요한 세대 수 계산
            bc_generations = self.calculate_bc_generations(linkage_analysis)
            assessment['estimated_time_years'] = bc_generations + 2
            assessment['estimated_cost_index'] = bc_generations * 0.5
        
        # 3. Genomic selection 권장 여부
        if len(target_traits) > 5 or linkage_analysis['complexity_score'] > 0.7:
            assessment['genomic_selection_recommended'] = True
            assessment['estimated_cost_index'] *= 1.5
        
        return assessment
    
    def optimize_marker_set(self, target_traits, budget_constraint=100):
        """
        예산 제약 하에서 최적 마커 세트 선택
        """
        # 마커별 비용-효과 분석
        marker_efficiency = []
        
        for marker in self.marker_positions['Gene']:
            efficiency = {
                'marker': marker,
                'chromosome': self.get_chromosome(marker),
                'effect_size': self.get_effect_size(marker),
                'genotyping_cost': self.estimate_genotyping_cost(marker),
                'information_content': self.calculate_pic(marker),  # Polymorphism Information Content
                'cost_effectiveness': 0
            }
            
            # 비용 대비 효과 계산
            efficiency['cost_effectiveness'] = (
                efficiency['effect_size'] * efficiency['information_content'] / 
                efficiency['genotyping_cost']
            )
            
            marker_efficiency.append(efficiency)
        
        # 예산 내에서 최적 마커 조합 선택 (Knapsack problem)
        selected_markers = self.solve_knapsack(
            marker_efficiency, 
            budget_constraint
        )
        
        return selected_markers
    
    def generate_breeding_pipeline(self, breeding_goal):
        """
        전체 육종 파이프라인 생성
        """
        pipeline = {
            'phase1_crossing': {
                'method': 'Single cross',
                'duration_months': 4,
                'population_size': 200
            },
            'phase2_selection': {
                'method': 'MAS',
                'markers': [],
                'duration_months': 4,
                'population_size': 50
            },
            'phase3_backcross': {
                'required': False,
                'generations': 0,
                'duration_months': 0,
                'population_size': 0
            },
            'phase4_fixation': {
                'method': 'SSD/DH',
                'duration_months': 12,
                'final_lines': 20
            },
            'phase5_evaluation': {
                'trials': ['Preliminary', 'Advanced', 'Multi-location'],
                'duration_months': 36,
                'locations': 3
            }
        }
        
        # 육종 목표에 따른 파이프라인 조정
        if breeding_goal['trait_complexity'] == 'high':
            pipeline['phase3_backcross']['required'] = True
            pipeline['phase3_backcross']['generations'] = 3
            pipeline['phase3_backcross']['duration_months'] = 18
        
        # 총 소요 시간 계산
        total_duration = sum([
            phase['duration_months'] 
            for phase in pipeline.values() 
            if 'duration_months' in phase
        ])
        
        pipeline['total_duration_months'] = total_duration
        pipeline['total_duration_years'] = total_duration / 12
        
        return pipeline
