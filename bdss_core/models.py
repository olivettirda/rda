"""
BDSS Core Domain Models
벼 육종 시뮬레이터 핵심 도메인 모델 정의

Step 0 - Critical Gap Analysis에서 식별된 리스크:
1. CMS 불안정성: 환경 스트레스(고온, 저온)에 따른 임성 회복 변동
2. Rf 유전자 용량 효과: RR vs Rr의 화분 임성 차이
3. 분리비 왜곡: S 세포질 내 Rf 유전자 편향 분리
4. 모계 효과 지연: 종자 형질의 세대 간 표현형 지연

이 모듈은 이러한 리스크를 방어적으로 처리하는 로직을 포함합니다.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple, Set, Any
from datetime import datetime
import uuid
import numpy as np


class CMSType(Enum):
    """세포질 웅성 불임 유형 - 벼의 주요 CMS 시스템"""
    WA = "WA"       # Wild Abortive (야생 불임형) - 가장 널리 사용
    BT = "BT"       # Boro-II Type
    HL = "HL"       # Honglian Type
    GA = "GA"       # Gambiaca Type
    NONE = "NONE"   # CMS가 아닌 정상 세포질


class CytoplasmType(Enum):
    """세포질 유형 (미토콘드리아 기반)"""
    STERILE = "S"   # 불임 유발 세포질
    NORMAL = "N"    # 정상 세포질


class FertilityStatus(Enum):
    """임성 상태"""
    FERTILE = auto()          # 정상 임성 (화분 생산)
    STERILE = auto()          # 완전 불임
    PARTIAL_FERTILE = auto()  # 부분 임성 (Rf 용량 효과)


class BreedingMethod(Enum):
    """육종 방법"""
    PEDIGREE = "Pedigree"     # 계통육종법
    BULK = "Bulk"             # 집단육종법
    SSD = "SSD"               # 1개체 1립법 (Single Seed Descent)
    DH = "DH"                 # 약배양/반수체 배가 (Doubled Haploid)
    MABC = "MABC"             # 표지인자 이용 여교배


class TraitType(Enum):
    """형질 유형"""
    QUALITATIVE = auto()      # 질적 형질 (1-3 유전자)
    QUANTITATIVE = auto()     # 양적 형질 (다인자)


class ApprovalMode(Enum):
    """승인 모드"""
    AUTO = "auto"             # 자동 승인
    MANUAL = "manual"         # 수동 승인 필요


@dataclass
class SNPMarker:
    """SNP 마커 정보"""
    marker_id: str
    chromosome: int
    position_cm: float          # cM 단위 유전적 위치
    position_bp: Optional[int]  # bp 단위 물리적 위치
    ref_allele: str
    alt_allele: str
    gene_name: Optional[str] = None
    is_functional: bool = False  # 기능성 마커 여부

    def __post_init__(self):
        """마커 ID 검증"""
        if not self.marker_id:
            raise ValueError("마커 ID는 필수입니다")
        if self.chromosome < 1 or self.chromosome > 12:
            raise ValueError(f"벼의 염색체 번호는 1-12 범위여야 합니다: {self.chromosome}")


@dataclass
class RfGene:
    """임성 회복 유전자 (Restorer of fertility)

    Rf 유전자의 용량 효과(Dosage Effect)를 모델링합니다.
    최신 연구에 따르면 RR > Rr의 회복력 차이가 존재합니다.
    """
    gene_name: str              # e.g., "Rf4", "Rf1"
    chromosome: int
    position_cm: float
    cms_types: List[CMSType]    # 회복 가능한 CMS 유형들

    # 용량 효과 파라미터 (0-1 범위, 1=완전 회복)
    homozygous_restoration: float = 1.0   # RR의 회복력
    heterozygous_restoration: float = 0.85  # Rr의 회복력 (용량 효과)

    # 환경 민감도 (고온/저온 스트레스에 의한 불안정성)
    temperature_sensitivity: float = 0.0  # 0=안정, 1=매우 민감

    def get_restoration_level(
        self,
        genotype: str,
        temperature_stress: float = 0.0
    ) -> float:
        """
        주어진 유전자형과 환경 조건에서의 임성 회복 수준 계산

        Args:
            genotype: "RR", "Rr", "rr" 중 하나
            temperature_stress: 0-1 범위의 온도 스트레스 수준

        Returns:
            0-1 범위의 회복 수준
        """
        base_restoration = {
            "RR": self.homozygous_restoration,
            "Rr": self.heterozygous_restoration,
            "rr": 0.0
        }.get(genotype, 0.0)

        # 환경 스트레스에 의한 감소 (방어적 프로그래밍)
        stress_reduction = temperature_stress * self.temperature_sensitivity
        final_restoration = max(0.0, base_restoration - stress_reduction)

        return final_restoration


@dataclass
class Genotype:
    """유전자형 정보를 저장하는 클래스

    핵 유전자형과 세포질 유전자형을 모두 관리합니다.
    """
    nuclear_genotype: Dict[str, str] = field(default_factory=dict)  # {gene: "AA"/"Aa"/"aa"}
    cytoplasm: CytoplasmType = CytoplasmType.NORMAL
    cms_type: CMSType = CMSType.NONE
    rf_genotypes: Dict[str, str] = field(default_factory=dict)  # {rf_gene: "RR"/"Rr"/"rr"}

    # SNP 마커 유전자형
    snp_genotypes: Dict[str, str] = field(default_factory=dict)  # {marker_id: "A"/"B"/"H"}

    def __post_init__(self):
        """유전자형 검증"""
        valid_nuclear = {"AA", "Aa", "aA", "aa", "A", "B", "H", "-"}
        for gene, gt in self.nuclear_genotype.items():
            if gt not in valid_nuclear:
                print(f"[경고] 비표준 유전자형 발견: {gene}={gt}")

    def has_rf_gene(self, rf_gene_name: str) -> bool:
        """특정 Rf 유전자의 유효한 allele 보유 여부"""
        gt = self.rf_genotypes.get(rf_gene_name, "rr")
        return gt in ["RR", "Rr"]

    def get_marker_allele(self, marker_id: str) -> Optional[str]:
        """특정 마커의 allele 반환"""
        return self.snp_genotypes.get(marker_id)


@dataclass
class Phenotype:
    """표현형 정보"""
    traits: Dict[str, float] = field(default_factory=dict)  # {형질명: 값}
    fertility_status: FertilityStatus = FertilityStatus.FERTILE
    pollen_fertility_rate: float = 1.0  # 0-1 범위

    # 모계 효과 관련 형질들
    seed_traits: Dict[str, float] = field(default_factory=dict)
    maternal_contribution: Dict[str, float] = field(default_factory=dict)

    # 환경 x 유전 상호작용 값
    gxe_values: Dict[str, Dict[str, float]] = field(default_factory=dict)  # {환경: {형질: 값}}


@dataclass
class MaternalEffectGene:
    """모계 효과 유전자

    종자 발달에 모체 유전자형이 영향을 미치는 경우를 모델링합니다.
    예: OsPHO1;2 - 배유로의 인(P) 수송
    """
    gene_name: str
    affected_traits: List[str]  # 영향받는 형질들
    effect_magnitude: float = 1.0  # 효과 크기 (0-1)

    # 지연 발현 - 어느 세대에서 표현형이 나타나는지
    phenotype_delay_generations: int = 1  # 1 = 다음 세대에서 발현

    def calculate_maternal_contribution(
        self,
        maternal_genotype: str,
        trait_name: str
    ) -> float:
        """
        모계 유전자형에 따른 형질 기여도 계산

        Args:
            maternal_genotype: "WT/WT", "WT/mut", "mut/mut"
            trait_name: 형질명

        Returns:
            0-1 범위의 기여도 (1=정상, 0=완전 결손)
        """
        if trait_name not in self.affected_traits:
            return 1.0

        contribution = {
            "WT/WT": 1.0,
            "WT/mut": 0.7,  # 반수체 부족 효과
            "mut/mut": 0.0  # 완전 결손
        }.get(maternal_genotype, 1.0)

        return contribution * self.effect_magnitude


@dataclass
class RicePlant:
    """벼 개체를 나타내는 핵심 클래스

    CMS, 모계 효과, 혈통 정보를 모두 통합 관리합니다.
    """
    plant_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    variety_name: str = ""
    genotype: Genotype = field(default_factory=Genotype)
    phenotype: Phenotype = field(default_factory=Phenotype)

    # 혈통 정보
    maternal_parent_id: Optional[str] = None  # 모본 (암술)
    paternal_parent_id: Optional[str] = None  # 부본 (화분)
    generation: str = "P"  # P, F1, F2, BC1, BC2, ...

    # 육종 프로그램 메타데이터
    breeding_line_code: Optional[str] = None
    selection_status: str = "candidate"  # candidate, selected, elite, released
    created_at: datetime = field(default_factory=datetime.now)

    # 계통 유형 (3계통법)
    line_type: Optional[str] = None  # "A-line", "B-line", "R-line", "F1-hybrid"

    def __post_init__(self):
        """개체 초기화 후 검증"""
        self._validate_cms_configuration()
        self._determine_line_type()

    def _validate_cms_configuration(self):
        """CMS 설정 검증 - 생물학적 일관성 체크"""
        gt = self.genotype

        # 정상 세포질에서는 CMS 유형이 NONE이어야 함
        if gt.cytoplasm == CytoplasmType.NORMAL and gt.cms_type != CMSType.NONE:
            print(f"[경고] {self.plant_id}: 정상 세포질에서 CMS 유형 설정됨. 자동 교정.")
            gt.cms_type = CMSType.NONE

    def _determine_line_type(self):
        """계통 유형 자동 결정"""
        gt = self.genotype

        if gt.cytoplasm == CytoplasmType.STERILE:
            if not any(gt.has_rf_gene(rf) for rf in gt.rf_genotypes.keys()):
                # S 세포질 + Rf 없음 = A-line (불임계)
                self.line_type = "A-line"
            else:
                # S 세포질 + Rf 있음 = F1 hybrid
                self.line_type = "F1-hybrid"
        elif gt.cytoplasm == CytoplasmType.NORMAL:
            if any(gt.rf_genotypes.get(rf) == "RR" for rf in gt.rf_genotypes.keys()):
                # N 세포질 + RR = R-line (회복친)
                self.line_type = "R-line"
            else:
                # N 세포질 + rr = B-line (유지친) 또는 일반 품종
                self.line_type = "B-line"

    def calculate_fertility(
        self,
        rf_genes: Dict[str, RfGene],
        temperature_stress: float = 0.0
    ) -> Tuple[FertilityStatus, float]:
        """
        개체의 임성 상태 계산

        CMS 세포질과 Rf 유전자의 상호작용을 고려하여
        임성 상태와 화분 임성률을 계산합니다.

        Args:
            rf_genes: 시스템에 등록된 Rf 유전자들
            temperature_stress: 환경 스트레스 수준 (0-1)

        Returns:
            (FertilityStatus, 화분 임성률)
        """
        gt = self.genotype

        # 정상 세포질은 항상 임성
        if gt.cytoplasm == CytoplasmType.NORMAL:
            return FertilityStatus.FERTILE, 1.0

        # S 세포질의 경우 Rf 유전자 체크
        max_restoration = 0.0

        for rf_name, rf_gene in rf_genes.items():
            # 해당 Rf 유전자가 현재 CMS 유형을 회복할 수 있는지 확인
            if gt.cms_type not in rf_gene.cms_types:
                continue

            rf_genotype = gt.rf_genotypes.get(rf_name, "rr")
            restoration = rf_gene.get_restoration_level(rf_genotype, temperature_stress)
            max_restoration = max(max_restoration, restoration)

        # 임성 상태 결정
        if max_restoration >= 0.95:
            return FertilityStatus.FERTILE, max_restoration
        elif max_restoration >= 0.5:
            return FertilityStatus.PARTIAL_FERTILE, max_restoration
        else:
            return FertilityStatus.STERILE, max_restoration

    def is_suitable_as_female(self) -> bool:
        """모본(암술)으로 적합한지 확인"""
        # CMS A-line은 반드시 모본으로만 사용
        if self.line_type == "A-line":
            return True
        # 일반 품종도 모본 사용 가능
        return True

    def is_suitable_as_male(self) -> bool:
        """부본(화분)으로 적합한지 확인"""
        # 불임 개체는 부본 사용 불가
        status, rate = self.phenotype.fertility_status, self.phenotype.pollen_fertility_rate
        return status == FertilityStatus.FERTILE and rate > 0.5


@dataclass
class CrossingResult:
    """교배 결과"""
    cross_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    female_parent: RicePlant = None
    male_parent: RicePlant = None
    offspring_genotypes: List[Genotype] = field(default_factory=list)
    expected_phenotypes: Dict[str, List[float]] = field(default_factory=dict)

    # 경고 및 추천사항
    warnings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    # 교배 유형 분류
    cross_type: Optional[str] = None  # "hybrid_production", "maintainer_propagation", "dead_end"

    # 분리비 정보 (F2 이상)
    segregation_ratios: Dict[str, Dict[str, float]] = field(default_factory=dict)


@dataclass
class BreedingProgramConfig:
    """육종 프로그램 설정"""
    program_id: str
    program_name: str
    target_traits: List[str]
    budget_limit: float  # 원 단위
    time_limit_years: float

    # 시설 정보
    has_speed_breeding: bool = False
    has_dh_facility: bool = False
    field_capacity: int = 10000  # 최대 재배 가능 개체수

    # 목표 유전자형
    target_genotypes: Dict[str, str] = field(default_factory=dict)

    # 육종 방법 비용 (개체당, 원)
    method_costs: Dict[BreedingMethod, float] = field(default_factory=lambda: {
        BreedingMethod.PEDIGREE: 5000,
        BreedingMethod.BULK: 2000,
        BreedingMethod.SSD: 3000,
        BreedingMethod.DH: 50000,
        BreedingMethod.MABC: 30000,
    })


@dataclass
class MarkerSelectionResult:
    """마커 선정 결과"""
    foreground_markers: List[SNPMarker]  # 목적 유전자 추적용
    background_markers: List[SNPMarker]  # 배경 회복용
    carrier_chromosome_markers: List[SNPMarker]  # 링키지 드래그 모니터링용

    total_markers: int = 0
    estimated_cost: float = 0.0
    genome_coverage: float = 0.0  # 0-1 범위

    # 필요 집단 크기
    minimum_population_size: int = 0
    confidence_level: float = 0.99  # 99% 확신


@dataclass
class EliteEvaluationResult:
    """엘리트 모본 평가 결과"""
    plant_id: str
    variety_name: str

    # BLUP 값들
    gca_values: Dict[str, float] = field(default_factory=dict)  # 형질별 GCA
    breeding_values: Dict[str, float] = field(default_factory=dict)  # 육종가

    # 안정성 지수
    waasb: float = 0.0
    waasby: float = 0.0  # 생산성 + 안정성 결합
    mtsi: float = 0.0    # 다형질 안정성 지수

    # 최종 순위
    overall_rank: int = 0
    recommendation: str = ""  # "Core Elite", "Elite", "Candidate", "Remove"
