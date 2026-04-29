def simulate_backcross_generations(initial_cross, num_generations, marker_positions):
    """
    여교배 세대별 유전체 회복률 및 목표 형질 고정 시뮬레이션
    """
    
    generations = []
    
    for gen in range(1, num_generations + 1):
        # 이론적 배경 유전체 회복률
        background_recovery = 1 - (0.5 ** (gen + 1))
        
        # 각 마커별 고정 확률 계산
        marker_fixation = {}
        
        for _, marker in marker_positions.iterrows():
            if marker['Gene'] in initial_cross['target_traits']:
                # Foreground selection - 항상 선발
                fixation_prob = 1.0
            else:
                # Background recovery
                if marker['Effect_Type'] == 'minor':
                    # Minor gene은 빠르게 회복
                    fixation_prob = background_recovery
                else:
                    # Major gene은 느리게 회복
                    fixation_prob = background_recovery * 0.9
            
            marker_fixation[marker['Gene']] = fixation_prob
        
        # 필요한 개체 수 계산 (95% 신뢰도)
        # n = log(1-P) / log(1-p) where P=0.95, p=고정확률
        min_fixation = min(marker_fixation.values())
        population_size = int(np.log(0.05) / np.log(1 - min_fixation)) if min_fixation < 1 else 20
        
        generations.append({
            'Generation': f'BC{gen}F1',
            'Background_Recovery': background_recovery,
            'Target_Trait_Fixation': {k: v for k, v in marker_fixation.items() 
                                     if k in initial_cross['target_traits']},
            'Required_Population': min(population_size, 200),  # 최대 200개체
            'Selection_Intensity': 1 - (20 / population_size) if population_size > 20 else 0.5
        })
    
    return pd.DataFrame(generations)

# 그래픽 기반 여교배 계획 시각화
def visualize_backcross_scheme(strategy, generations_df, marker_positions):
    """
    여교배 계획 시각화
    """
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. 염색체별 마커 분포
    ax = axes[0, 0]
    for chr in marker_positions['Chromosome'].unique():
        chr_markers = marker_positions[marker_positions['Chromosome'] == chr]
        ax.scatter([chr] * len(chr_markers), chr_markers['Position_Mb'], 
                  s=100, alpha=0.6, label=f'Chr {chr}')
        
        for _, marker in chr_markers.iterrows():
            if marker['Gene'] in strategy['foreground_selection']:
                ax.scatter(chr, marker['Position_Mb'], s=200, c='red', 
                         marker='*', zorder=5)
                ax.text(chr + 0.1, marker['Position_Mb'], 
                       marker['Gene'][:5], fontsize=8)
    
    ax.set_xlabel('Chromosome')
    ax.set_ylabel('Position (Mb)')
    ax.set_title('Marker Distribution and Target Genes')
    ax.grid(True, alpha=0.3)
    
    # 2. 세대별 배경 회복률
    ax = axes[0, 1]
    ax.plot(range(1, len(generations_df) + 1), 
           generations_df['Background_Recovery'] * 100, 
           marker='o', linewidth=2)
    ax.axhline(y=93.75, color='r', linestyle='--', alpha=0.5, label='BC3 level')
    ax.axhline(y=96.88, color='g', linestyle='--', alpha=0.5, label='BC4 level')
    ax.set_xlabel('Backcross Generation')
    ax.set_ylabel('Background Recovery (%)')
    ax.set_title('Genomic Background Recovery')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # 3. Linkage drag 위험도 히트맵
    ax = axes[1, 0]
    if len(strategy.get('linkage_drag_risks', [])) > 0:
        risk_matrix = pd.pivot_table(
            pd.DataFrame(strategy['linkage_drag_risks']),
            values='Distance_cM',
            index='Target',
            columns='Linked_Gene',
            fill_value=0
        )
        sns.heatmap(risk_matrix, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax)
        ax.set_title('Linkage Drag Risk Matrix (cM)')
    
    # 4. 선발 강도와 집단 크기
    ax = axes[1, 1]
    ax2 = ax.twinx()
    
    x_pos = range(len(generations_df))
    ax.bar(x_pos, generations_df['Required_Population'], 
          alpha=0.7, color='blue', label='Population Size')
    ax2.plot(x_pos, generations_df['Selection_Intensity'] * 100, 
            'r-', marker='o', label='Selection Intensity')
    
    ax.set_xlabel('Generation')
    ax.set_ylabel('Population Size', color='blue')
    ax2.set_ylabel('Selection Intensity (%)', color='red')
    ax.set_title('Population Size and Selection Requirements')
    
    plt.tight_layout()
    return fig
