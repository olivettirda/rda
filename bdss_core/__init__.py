"""
BDSS Core - Breeding Decision Support System
차세대 AI 벼 육종 시뮬레이터 핵심 모듈

This module provides the core functionality for:
- CMS (Cytoplasmic Male Sterility) modeling
- Maternal effect simulation
- Breeding method recommendation
- MAS marker selection optimization
- Elite parent identification using BLUP/WAASB/MTSI

Author: RDA Digital Breeding Team
Version: 1.0.0
"""

from .models import (
    RicePlant,
    Genotype,
    Phenotype,
    CMSType,
    CytoplasmType,
    FertilityStatus,
    BreedingMethod,
)
from .crossing_engine import CrossingEngine
from .breeding_recommender import BreedingMethodRecommender
from .marker_selector import MASMarkerSelector
from .elite_identifier import EliteParentIdentifier
from .statistical_engine import StatisticalEngine

__version__ = "1.0.0"
__all__ = [
    "RicePlant",
    "Genotype",
    "Phenotype",
    "CMSType",
    "CytoplasmType",
    "FertilityStatus",
    "BreedingMethod",
    "CrossingEngine",
    "BreedingMethodRecommender",
    "MASMarkerSelector",
    "EliteParentIdentifier",
    "StatisticalEngine",
]
