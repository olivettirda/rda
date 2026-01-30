"""
FAMD (Factor Analysis of Mixed Data) 모듈

벼 육종 시스템에서 질적(SNP 마커) + 양적(형질) 데이터를 통합 분석합니다.

주요 클래스:
- FAMDEngine: FAMD 분석 엔진
- FAMDResult: 분석 결과 객체
- QualitativeTraitType: 질적 형질 유형 (순서형/명목형)

사용 예시:
```python
from bdss_core.famd import FAMDEngine

engine = FAMDEngine(balance_variables=True)
result = engine.fit_transform(
    quantitative, qualitative,
    quant_names=['수량', '등숙률'],
    qual_names=['도열병저항성', 'Rf4']
)
```
"""

from .famd_engine import (
    FAMDEngine,
    FAMDResult,
    FAMDDistance,
    LatentSpaceBounds,
    QualitativeTraitType,
    create_test_dataset,
    ORDINAL_TRAIT_MAPPINGS,
    TRAIT_TYPE_RULES,
)

__all__ = [
    "FAMDEngine",
    "FAMDResult",
    "FAMDDistance",
    "LatentSpaceBounds",
    "QualitativeTraitType",
    "create_test_dataset",
    "ORDINAL_TRAIT_MAPPINGS",
    "TRAIT_TYPE_RULES",
]
