def estimate_genetic_distance_from_physical(physical_distance_mb, chromosome=None):
    """
    벼에서 물리적 거리를 유전적 거리로 추정
    
    벼의 평균: 1 Mb ≈ 3-4 cM (염색체별로 다름)
    - 센트로미어 근처: 1 Mb ≈ 0.5-1 cM (재조합 억제)
    - 염색체 말단: 1 Mb ≈ 4-6 cM (재조합 활발)
    - 전체 평균: 1 Mb ≈ 3.5 cM
    """
    
    # 염색체별 변환 비율 (cM/Mb) - 문헌 기반 추정치
    chr_conversion_rates = {
        1: 3.8,   # 염색체 1
        2: 3.5,   # 염색체 2
        3: 3.3,   # 염색체 3
        4: 3.6,   # 염색체 4
        5: 3.4,   # 염색체 5
        6: 3.7,   # 염색체 6 (많은 QTL 존재)
        7: 3.2,   # 염색체 7
        8: 3.5,   # 염색체 8
        9: 3.3,   # 염색체 9
        10: 3.4,  # 염색체 10
        11: 3.9,  # 염색체 11 (도열병 저항성 유전자 많음)
        12: 3.6   # 염색체 12
    }
    
    if chromosome and chromosome in chr_conversion_rates:
        conversion_rate = chr_conversion_rates[chromosome]
    else:
        conversion_rate = 3.5  # 전체 평균
    
    genetic_distance_cm = physical_distance_mb * conversion_rate
    
    return genetic_distance_cm

# 예시
print(f"10 Mb 물리적 거리 ≈ {estimate_genetic_distance_from_physical(10)} cM")
print(f"염색체 6에서 5 Mb ≈ {estimate_genetic_distance_from_physical(5, chromosome=6)} cM")
