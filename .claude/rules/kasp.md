---
applyTo: "**/{kasp,marker,molecular_marker}*.{html,py,js}"
---

# KASP 마커 설계 규칙 (KASP/마커 파일 자동 로드)

이 파일은 KASP·마커 관련 파일 작업 시 자동으로 로드됩니다.

---

## KASP 마커 설계 표준

### Tail 서열 (LGC 표준)

```
FAM tail: 5'-GAAGGTGACCAAGTTCATGCT-3' (21bp)
HEX tail: 5'-GAAGGTCGGAGTCAACGGATT-3' (21bp)
```

### 프라이머 구조

```
ASP1 (FAM): [FAM tail]-[allele1-specific seq]-[SNP at 3' end]
ASP2 (HEX): [HEX tail]-[allele2-specific seq]-[SNP at 3' end]
Common:     [reverse primer sequence]
```

### 설계 사양

| 항목 | 권장값 |
|------|--------|
| ASP 길이 (tail 제외) | 18-25bp |
| Common 길이 | 18-25bp |
| GC 함량 | 40-60% |
| Amplicon 크기 | 50-150bp (권장), 최대 300bp |
| SNP 위치 | 반드시 ASP 3' 말단 |

### Tm 계산 (바이오니어 기준)

| 서열 길이 | 방법 |
|-----------|------|
| 15bp 미만 | Wallace rule: `Tm = 2×(A+T) + 4×(G+C)` |
| 15bp 이상 | Nearest-neighbor (SantaLucia 1998) |

#### Nearest-neighbor 파라미터 (50mM Na+, 250nM primer)

```python
nn_params = {
    'AA': (-7.9, -22.2), 'TT': (-7.9, -22.2),
    'AT': (-7.2, -20.4), 'TA': (-7.2, -21.3),
    'CA': (-8.5, -22.7), 'TG': (-8.5, -22.7),
    'GT': (-8.4, -22.4), 'AC': (-8.4, -22.4),
    'CT': (-7.8, -21.0), 'AG': (-7.8, -21.0),
    'GA': (-8.2, -22.2), 'TC': (-8.2, -22.2),
    'CG': (-10.6, -27.2), 'GC': (-9.8, -24.4),
    'GG': (-8.0, -19.9), 'CC': (-8.0, -19.9)
}
```

#### Tm 목표

- ASP primers (tail 제외): **57-62°C**
- Common primer: **57-62°C**
- ASP↔Common Tm 차: ±3°C 이내
- **반드시 tail 서열 제거 후 Tm 계산**

### 절대 금지

1. Tm 계산 시 tail 포함 → 반드시 제거 후 계산
2. 추정값 사용 → 반드시 확인
3. 원본 논문 없이 마커 설계 → SNP 위치·서열 확인 필수
4. dCAPS 프라이머 그대로 사용 → 미스매치 확인 필수

### 모든 결과물에 포함

- 풀 시퀀스 (tail 포함)
- BLAST용 core 서열 (tail 제외)

---

## 마커 변환 가이드

### dCAPS/CAPS → KASP

1. 원본 프라이머 미스매치 위치 확인
2. 유전체 서열과 정렬
3. 제한효소 인식부위 내 정확한 SNP 위치 특정
4. SNP가 3' 말단에 오도록 KASP 재설계
5. 바이오니어 규칙으로 Tm 검증

### STS → KASP

- **Option A (Dominant KASP)**: Forward에 FAM tail만 추가, 증폭 유무로 판별
- **Option B (Co-dominant KASP)**: STS 증폭 영역 ±500bp에서 품종 간 SNP 검색 → SNP로 새 KASP 설계

### SNP vs InDel KASP

- **SNP KASP**: ASP1/ASP2의 3' 말단 1bp만 다름 (Co-dominant)
- **InDel KASP**: 작은 InDel(1-10bp)은 ASP에 포함, 큰 InDel(>10bp)은 Dominant KASP 또는 일반 PCR 권장

---

## 출력 형식

### 엑셀
열 구성: 마커명 / 프라이머 서열(tail 포함) / Tm(tail 제외) / 위치(Chr:bp) / 변환 전략 / 비고

### 주문용 표
열 구성: Primer Name / Sequence (5'→3') / Direction / Length / Purpose / Scale

---

## 바이오니어 올리고 주문 양식

- 파일: `.xls` (4열)
- 열: `Oligo NAME`, `Scale`, `Purification`, `SEQUENCE 5'→3'`
- 기본값: Scale **25 nmole**, Purification **BioRP**
- 프라이머명: `마커이름_F` / `마커이름_R`
- 서열: 대문자 통일, 공백 없음
- NAME 금지 기호: `#`, `|`
- Modification 예시: `[FAM]서열[BHQ1]`
- 주문 페이지: https://www.bioneer.co.kr/oligo-dna-customorder.html
- 로그인 ID: `nyaes00@bioneer.co.kr`

---

## PCR 표준 (KASP)

### Master Mix (10μL)
```
KASP V4.0:        5.00 μL
ASP1 (12μM):      0.14 μL
ASP2 (12μM):      0.14 μL
Common (30μM):    0.20 μL
DNA (10ng/μL):    1.00 μL
ddH₂O:            3.52 μL
```

### Program
```
94°C 15min
→ (94°C 20s, 61°C→55°C 60s) × 10 touchdown
→ (94°C 20s, 55°C 60s) × 26
→ 30°C 읽기
```

---

## 참조 게놈

- 벼: IRGSP-1.0
- 밀: IWGSC RefSeq v2.1

---

## 한국 품종 마커 검증 주의

- 한국 품종(화영벼 등)은 3K RGP 데이터셋에 미포함된 경우가 많음.
- 직접 PCR 검증 필수.
