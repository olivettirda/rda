def calculate_progeny_genotype_probabilistic(parent1, parent2, num_progeny=100):
    """확률적 분리 시뮬레이션"""
    progeny_population = []
    for _ in range(num_progeny):
        progeny = []
        for g1, g2 in zip(parent1, parent2):
            # 멘델 분리 시뮬레이션
            if g1 == 1 and g2 == 1:
                progeny.append(1)
            elif g1 == 0 and g2 == 0:
                progeny.append(0)
            else:
                progeny.append(np.random.choice([0, 1], p=[0.25, 0.75]))
        progeny_population.append(progeny)
    return np.array(progeny_population)
