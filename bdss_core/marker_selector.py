"""
BDSS MAS Marker Selector - 마커 선정 자동화

MAS(Marker-Assisted Selection)를 위한 최소 마커 세트 선정 알고리즘

주요 기능:
1. Foreground Selection: 목적 유전자 추적 마커 선정
2. Background Selection: 배경 회복용 마커 선정 (그리디 알고리즘)
3. 링키지 드래그 모니터링 마커 배치
4. 필요 집단 크기 계산
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set
import numpy as np
import logging
from heapq import heappush, heappop

from .models import (
    SNPMarker, MarkerSelectionResult, RicePlant, Genotype
)

logger = logging.getLogger(__name__)


@dataclass
class GenomeBin:
    """게놈 구간 (bin)"""
    chromosome: int
    start_cm: float
    end_cm: float
    is_covered: bool = False
    markers: List[SNPMarker] = field(default_factory=list)

    @property
    def center_cm(self) -> float:
        return (self.start_cm + self.end_cm) / 2

    @property
    def size_cm(self) -> float:
        return self.end_cm - self.start_cm


@dataclass
class TargetGene:
    """목적 유전자 정보"""
    gene_name: str
    chromosome: int
    position_cm: float
    position_bp: Optional[int] = None
    functional_marker: Optional[SNPMarker] = None
    flanking_markers: List[SNPMarker] = field(default_factory=list)


@dataclass
class MarkerDatabase:
    """마커 데이터베이스"""
    markers: Dict[str, SNPMarker] = field(default_factory=dict)  # marker_id -> SNPMarker

    # 염색체별 마커 인덱스
    markers_by_chromosome: Dict[int, List[SNPMarker]] = field(default_factory=dict)

    # 유전자별 연관 마커
    gene_markers: Dict[str, List[SNPMarker]] = field(default_factory=dict)

    def add_marker(self, marker: SNPMarker):
        """마커 추가"""
        self.markers[marker.marker_id] = marker

        if marker.chromosome not in self.markers_by_chromosome:
            self.markers_by_chromosome[marker.chromosome] = []
        self.markers_by_chromosome[marker.chromosome].append(marker)

        # 위치순 정렬 유지
        self.markers_by_chromosome[marker.chromosome].sort(key=lambda m: m.position_cm)

        if marker.gene_name:
            if marker.gene_name not in self.gene_markers:
                self.gene_markers[marker.gene_name] = []
            self.gene_markers[marker.gene_name].append(marker)

    def get_markers_in_range(
        self,
        chromosome: int,
        start_cm: float,
        end_cm: float
    ) -> List[SNPMarker]:
        """특정 범위 내 마커 조회"""
        chr_markers = self.markers_by_chromosome.get(chromosome, [])
        return [m for m in chr_markers if start_cm <= m.position_cm <= end_cm]


class MASMarkerSelector:
    """
    MAS 마커 선정 엔진

    Foreground Selection (목적 유전자)과 Background Selection (배경 회복)을
    위한 최적 마커 세트를 선정합니다.
    """

    # 벼 염색체 정보 (cM 단위 대략적 길이)
    RICE_CHROMOSOME_LENGTHS = {
        1: 180, 2: 160, 3: 165, 4: 145, 5: 125,
        6: 135, 7: 130, 8: 125, 9: 105, 10: 100,
        11: 120, 12: 115
    }

    def __init__(
        self,
        marker_db: MarkerDatabase = None,
        bin_size_cm: float = 15.0,  # 기본 bin 크기 15cM
        foreground_distance_cm: float = 1.0,  # 목적 유전자로부터 최대 거리
        linkage_drag_distances: List[float] = None  # 링키지 드래그 모니터링 거리
    ):
        self.marker_db = marker_db or self._create_default_marker_db()
        self.bin_size_cm = bin_size_cm
        self.foreground_distance_cm = foreground_distance_cm
        self.linkage_drag_distances = linkage_drag_distances or [5.0, 10.0, 20.0]

        logger.info(f"MASMarkerSelector 초기화 - bin 크기: {bin_size_cm}cM")

    def _create_default_marker_db(self) -> MarkerDatabase:
        """기본 마커 데이터베이스 생성"""
        db = MarkerDatabase()

        # 예시 마커 추가 (실제로는 외부 DB에서 로드)
        example_markers = [
            # Sub1A 관련 마커
            SNPMarker("Sub1A_SNP1", 9, 35.2, 6750000, "A", "G", "Sub1A", True),
            SNPMarker("Sub1A_flank_L", 9, 34.0, 6700000, "T", "C", "Sub1A", False),
            SNPMarker("Sub1A_flank_R", 9, 36.5, 6800000, "G", "A", "Sub1A", False),

            # Pi-ta 관련 마커
            SNPMarker("Pita_SNP1", 12, 85.3, 10600000, "G", "A", "Pi-ta", True),
            SNPMarker("Pita_flank_L", 12, 84.0, 10550000, "C", "T", "Pi-ta", False),
            SNPMarker("Pita_flank_R", 12, 86.8, 10650000, "A", "G", "Pi-ta", False),

            # Wx 관련 마커
            SNPMarker("Wx_SNP1", 6, 28.5, 1765000, "G", "T", "Wx", True),

            # Rf4 관련 마커
            SNPMarker("Rf4_SNP1", 10, 65.2, 18500000, "C", "G", "Rf4", True),
            SNPMarker("Rf4_flank_L", 10, 64.0, 18400000, "A", "T", "Rf4", False),
            SNPMarker("Rf4_flank_R", 10, 66.5, 18600000, "T", "C", "Rf4", False),
        ]

        for marker in example_markers:
            db.add_marker(marker)

        # 배경 선발용 균등 분포 마커 생성
        for chrom in range(1, 13):
            length = self.RICE_CHROMOSOME_LENGTHS[chrom]
            for pos in range(10, int(length), 20):  # 20cM 간격
                marker_id = f"BG_chr{chrom}_{pos}"
                marker = SNPMarker(
                    marker_id=marker_id,
                    chromosome=chrom,
                    position_cm=float(pos),
                    position_bp=pos * 50000,  # 대략적 bp 변환
                    ref_allele="A",
                    alt_allele="G",
                    is_functional=False
                )
                db.add_marker(marker)

        return db

    def select_foreground_markers(
        self,
        target_genes: List[TargetGene],
        parent1: RicePlant,
        parent2: RicePlant
    ) -> List[SNPMarker]:
        """
        Foreground Selection 마커 선정

        목적 유전자를 정확히 추적하기 위한 마커를 선정합니다.
        기능성 마커 > 플랭킹 마커 순으로 우선순위를 적용합니다.

        Args:
            target_genes: 목적 유전자 리스트
            parent1: 교배 모본 1
            parent2: 교배 모본 2

        Returns:
            선정된 foreground 마커 리스트
        """
        selected_markers = []

        for gene in target_genes:
            gene_markers = []

            # 1순위: 기능성 마커 (Gene-based marker)
            functional_markers = self._find_functional_markers(gene)

            for marker in functional_markers:
                if self._is_polymorphic(marker, parent1, parent2):
                    gene_markers.append(marker)
                    logger.info(f"기능성 마커 선정: {marker.marker_id} for {gene.gene_name}")
                    break

            # 기능성 마커가 없으면 플랭킹 마커 선정
            if not gene_markers:
                flanking = self._find_flanking_markers(gene)
                polymorphic_flanking = [
                    m for m in flanking
                    if self._is_polymorphic(m, parent1, parent2)
                ]

                if len(polymorphic_flanking) >= 2:
                    # 유전자 양쪽의 마커 선정
                    left_markers = [m for m in polymorphic_flanking if m.position_cm < gene.position_cm]
                    right_markers = [m for m in polymorphic_flanking if m.position_cm > gene.position_cm]

                    if left_markers:
                        # 가장 가까운 왼쪽 마커
                        closest_left = max(left_markers, key=lambda m: m.position_cm)
                        gene_markers.append(closest_left)

                    if right_markers:
                        # 가장 가까운 오른쪽 마커
                        closest_right = min(right_markers, key=lambda m: m.position_cm)
                        gene_markers.append(closest_right)

                    logger.info(f"플랭킹 마커 선정: {[m.marker_id for m in gene_markers]} for {gene.gene_name}")

                elif polymorphic_flanking:
                    # 최소 1개라도 선정
                    gene_markers.append(polymorphic_flanking[0])
                    logger.warning(f"플랭킹 마커 1개만 선정됨: {polymorphic_flanking[0].marker_id}")

            selected_markers.extend(gene_markers)

        return selected_markers

    def _find_functional_markers(self, gene: TargetGene) -> List[SNPMarker]:
        """유전자 내부의 기능성 마커 검색"""
        gene_markers = self.marker_db.gene_markers.get(gene.gene_name, [])
        return [m for m in gene_markers if m.is_functional]

    def _find_flanking_markers(self, gene: TargetGene) -> List[SNPMarker]:
        """유전자 주변의 플랭킹 마커 검색"""
        return self.marker_db.get_markers_in_range(
            gene.chromosome,
            gene.position_cm - self.foreground_distance_cm,
            gene.position_cm + self.foreground_distance_cm
        )

    def _is_polymorphic(
        self,
        marker: SNPMarker,
        parent1: RicePlant,
        parent2: RicePlant
    ) -> bool:
        """마커가 양친 간 다형성을 보이는지 확인"""
        p1_allele = parent1.genotype.get_marker_allele(marker.marker_id)
        p2_allele = parent2.genotype.get_marker_allele(marker.marker_id)

        # 둘 다 유전자형이 없으면 다형성 불명 -> True 반환 (보수적 접근)
        if p1_allele is None or p2_allele is None:
            return True

        # A vs B 또는 다른 allele이면 다형성
        return p1_allele != p2_allele

    def select_background_markers_greedy(
        self,
        carrier_chromosome: int,
        target_gene_position_cm: float,
        max_markers: int = 50,
        target_coverage: float = 0.9
    ) -> List[SNPMarker]:
        """
        배경 회복용 마커 선정 (그리디 알고리즘)

        세트 커버 문제(Set Cover Problem)를 그리디 알고리즘으로 해결합니다.
        각 단계에서 가장 넓은 미커버 영역의 중심에 마커를 배치합니다.

        Args:
            carrier_chromosome: 목적 유전자가 있는 염색체 번호
            target_gene_position_cm: 목적 유전자 위치 (cM)
            max_markers: 최대 마커 수 (예산 제약)
            target_coverage: 목표 게놈 커버리지 (0-1)

        Returns:
            선정된 background 마커 리스트
        """
        logger.info(f"Background 마커 선정 시작 - 최대 {max_markers}개, 목표 커버리지 {target_coverage:.0%}")

        selected_markers = []

        # Step 1: 게놈을 bin으로 분할
        bins = self._create_genome_bins(carrier_chromosome)

        # Step 2: 링키지 드래그 모니터링 마커 먼저 배치 (carrier chromosome)
        linkage_markers = self._select_linkage_drag_markers(
            carrier_chromosome, target_gene_position_cm
        )
        selected_markers.extend(linkage_markers)

        # 링키지 마커가 커버하는 bin 표시
        for marker in linkage_markers:
            self._mark_covered_bins(bins, marker)

        # Step 3: 비목적 염색체에 대해 그리디 선택
        uncovered_bins = [b for b in bins if not b.is_covered and b.chromosome != carrier_chromosome]

        while len(selected_markers) < max_markers:
            if not uncovered_bins:
                break

            # 가장 큰 미커버 영역 찾기
            uncovered_bins.sort(key=lambda b: b.size_cm, reverse=True)
            target_bin = uncovered_bins[0]

            # 해당 영역 중심에서 가장 가까운 마커 선택
            candidate_markers = self.marker_db.get_markers_in_range(
                target_bin.chromosome,
                target_bin.start_cm - 5,
                target_bin.end_cm + 5
            )

            if candidate_markers:
                # 중심에 가장 가까운 마커 선택
                best_marker = min(
                    candidate_markers,
                    key=lambda m: abs(m.position_cm - target_bin.center_cm)
                )

                # 이미 선택된 마커가 아닌 경우에만 추가
                if best_marker not in selected_markers:
                    selected_markers.append(best_marker)
                    self._mark_covered_bins(bins, best_marker)

            # 미커버 bin 리스트 갱신
            uncovered_bins = [b for b in bins if not b.is_covered and b.chromosome != carrier_chromosome]

            # 커버리지 체크
            current_coverage = self._calculate_coverage(bins, carrier_chromosome)
            if current_coverage >= target_coverage:
                logger.info(f"목표 커버리지 달성: {current_coverage:.1%}")
                break

        final_coverage = self._calculate_coverage(bins, carrier_chromosome)
        logger.info(f"Background 마커 선정 완료: {len(selected_markers)}개, 커버리지 {final_coverage:.1%}")

        return selected_markers

    def _create_genome_bins(self, exclude_chromosome: int = None) -> List[GenomeBin]:
        """게놈을 bin으로 분할"""
        bins = []

        for chrom, length in self.RICE_CHROMOSOME_LENGTHS.items():
            start = 0.0
            while start < length:
                end = min(start + self.bin_size_cm, length)
                bins.append(GenomeBin(
                    chromosome=chrom,
                    start_cm=start,
                    end_cm=end,
                    is_covered=False
                ))
                start = end

        return bins

    def _select_linkage_drag_markers(
        self,
        chromosome: int,
        gene_position_cm: float
    ) -> List[SNPMarker]:
        """링키지 드래그 모니터링용 마커 선정"""
        markers = []

        for distance in self.linkage_drag_distances:
            # 왼쪽 마커
            left_candidates = self.marker_db.get_markers_in_range(
                chromosome,
                gene_position_cm - distance - 2,
                gene_position_cm - distance + 2
            )
            if left_candidates:
                markers.append(left_candidates[0])

            # 오른쪽 마커
            right_candidates = self.marker_db.get_markers_in_range(
                chromosome,
                gene_position_cm + distance - 2,
                gene_position_cm + distance + 2
            )
            if right_candidates:
                markers.append(right_candidates[0])

        return markers

    def _mark_covered_bins(self, bins: List[GenomeBin], marker: SNPMarker):
        """마커가 커버하는 bin 표시"""
        coverage_range = self.bin_size_cm  # 마커가 커버하는 범위

        for bin in bins:
            if bin.chromosome == marker.chromosome:
                # 마커 위치가 bin 범위 내이거나 인접한 경우
                if (bin.start_cm - coverage_range / 2 <= marker.position_cm <=
                    bin.end_cm + coverage_range / 2):
                    bin.is_covered = True
                    bin.markers.append(marker)

    def _calculate_coverage(self, bins: List[GenomeBin], exclude_chromosome: int) -> float:
        """커버리지 계산 (carrier chromosome 제외)"""
        non_carrier_bins = [b for b in bins if b.chromosome != exclude_chromosome]
        if not non_carrier_bins:
            return 1.0

        covered = sum(1 for b in non_carrier_bins if b.is_covered)
        return covered / len(non_carrier_bins)

    def calculate_minimum_population_size(
        self,
        target_genotype_frequency: float,
        confidence_level: float = 0.99
    ) -> int:
        """
        목표 유전자형 획득을 위한 최소 집단 크기 계산

        공식: N = ln(1 - P) / ln(1 - p)
        여기서 P는 신뢰 수준, p는 목표 유전자형 빈도

        Args:
            target_genotype_frequency: 목표 유전자형 출현 빈도 (0-1)
            confidence_level: 신뢰 수준 (기본 99%)

        Returns:
            필요한 최소 개체 수
        """
        if target_genotype_frequency <= 0 or target_genotype_frequency >= 1:
            raise ValueError("유전자형 빈도는 0과 1 사이여야 합니다")

        if confidence_level <= 0 or confidence_level >= 1:
            raise ValueError("신뢰 수준은 0과 1 사이여야 합니다")

        n = np.log(1 - confidence_level) / np.log(1 - target_genotype_frequency)
        return int(np.ceil(n))

    def select_optimal_markers(
        self,
        target_genes: List[TargetGene],
        parent1: RicePlant,
        parent2: RicePlant,
        max_total_markers: int = 80,
        marker_cost: float = 10000  # 마커당 비용 (원)
    ) -> MarkerSelectionResult:
        """
        최적 마커 세트 선정 (통합)

        Foreground + Background + Linkage Drag 마커를 통합 선정합니다.

        Args:
            target_genes: 목적 유전자 리스트
            parent1, parent2: 교배 모본
            max_total_markers: 최대 총 마커 수
            marker_cost: 마커당 비용

        Returns:
            MarkerSelectionResult: 선정 결과
        """
        logger.info(f"최적 마커 세트 선정 시작 - 목적 유전자: {[g.gene_name for g in target_genes]}")

        # 1. Foreground 마커 선정
        foreground_markers = self.select_foreground_markers(
            target_genes, parent1, parent2
        )

        # 2. 남은 마커 수로 Background 선정
        remaining = max_total_markers - len(foreground_markers)

        # 첫 번째 목적 유전자의 위치 사용 (다중 유전자의 경우 개선 필요)
        carrier_chrom = target_genes[0].chromosome if target_genes else 1
        target_pos = target_genes[0].position_cm if target_genes else 50.0

        background_markers = self.select_background_markers_greedy(
            carrier_chrom, target_pos,
            max_markers=remaining,
            target_coverage=0.9
        )

        # 링키지 드래그 마커 (background에서 이미 선정됨)
        linkage_markers = [
            m for m in background_markers
            if m.chromosome == carrier_chrom
        ]

        # 3. 총 비용 계산
        total_markers = len(foreground_markers) + len(background_markers)
        total_cost = total_markers * marker_cost

        # 4. 커버리지 계산
        bins = self._create_genome_bins()
        for m in foreground_markers + background_markers:
            self._mark_covered_bins(bins, m)
        coverage = self._calculate_coverage(bins, carrier_chrom)

        # 5. 필요 집단 크기 계산
        # BC1F1에서 목적 유전자(Rr) + 양쪽 재조합 확률 추정
        # 예: 목적 유전자 50% × 재조합 확률 약 5% = 2.5%
        target_frequency = 0.025
        min_population = self.calculate_minimum_population_size(target_frequency, 0.99)

        result = MarkerSelectionResult(
            foreground_markers=foreground_markers,
            background_markers=background_markers,
            carrier_chromosome_markers=linkage_markers,
            total_markers=total_markers,
            estimated_cost=total_cost,
            genome_coverage=coverage,
            minimum_population_size=min_population,
            confidence_level=0.99
        )

        logger.info(
            f"마커 선정 완료 - "
            f"Foreground: {len(foreground_markers)}, "
            f"Background: {len(background_markers)}, "
            f"커버리지: {coverage:.1%}, "
            f"필요 집단: {min_population}개체"
        )

        return result


def example_marker_selection():
    """마커 선정 예제"""
    selector = MASMarkerSelector()

    # 목적 유전자 정의
    target_genes = [
        TargetGene(
            gene_name="Sub1A",
            chromosome=9,
            position_cm=35.2,
            position_bp=6750000
        ),
        TargetGene(
            gene_name="Pi-ta",
            chromosome=12,
            position_cm=85.3,
            position_bp=10600000
        )
    ]

    # 가상의 교배 모본
    donor = RicePlant(
        variety_name="FR13A",
        genotype=Genotype(
            snp_genotypes={"Sub1A_SNP1": "A", "Pita_SNP1": "G"}
        )
    )

    recurrent = RicePlant(
        variety_name="IR64",
        genotype=Genotype(
            snp_genotypes={"Sub1A_SNP1": "G", "Pita_SNP1": "A"}
        )
    )

    # 마커 선정
    result = selector.select_optimal_markers(
        target_genes, donor, recurrent,
        max_total_markers=60
    )

    print("=" * 60)
    print("MAS 마커 선정 결과")
    print("=" * 60)
    print(f"\nForeground 마커 ({len(result.foreground_markers)}개):")
    for m in result.foreground_markers:
        print(f"  - {m.marker_id} (Chr{m.chromosome}, {m.position_cm}cM)")

    print(f"\nBackground 마커 ({len(result.background_markers)}개):")
    bg_by_chrom = {}
    for m in result.background_markers:
        if m.chromosome not in bg_by_chrom:
            bg_by_chrom[m.chromosome] = []
        bg_by_chrom[m.chromosome].append(m)

    for chrom in sorted(bg_by_chrom.keys()):
        print(f"  Chr{chrom}: {len(bg_by_chrom[chrom])}개")

    print(f"\n링키지 드래그 모니터링 마커 ({len(result.carrier_chromosome_markers)}개)")

    print(f"\n요약:")
    print(f"  총 마커 수: {result.total_markers}")
    print(f"  예상 비용: {result.estimated_cost:,.0f}원")
    print(f"  게놈 커버리지: {result.genome_coverage:.1%}")
    print(f"  필요 집단 크기: {result.minimum_population_size}개체 (99% 신뢰)")

    return result


if __name__ == "__main__":
    example_marker_selection()
