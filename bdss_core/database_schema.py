"""
BDSS Database Schema Design - 데이터베이스 스키마 설계

PostgreSQL + Neo4j 하이브리드 아키텍처

PostgreSQL:
- 정형 데이터 (표현형, SNP, 마커 등)
- ACID 트랜잭션 보장
- 복잡한 쿼리 및 집계

Neo4j:
- 혈통 그래프 (Pedigree)
- A 행렬 계산 최적화
- 교배 관계 추적
"""

from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
from datetime import datetime


# ============================================================================
# PostgreSQL Schema Definition (SQLAlchemy 스타일)
# ============================================================================

POSTGRESQL_SCHEMA = """
-- ============================================================================
-- BDSS PostgreSQL Schema
-- 벼 육종 의사결정 지원 시스템 데이터베이스 스키마
-- ============================================================================

-- 1. 품종/계통 정보 테이블
CREATE TABLE IF NOT EXISTS rice_variety (
    variety_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_code VARCHAR(50) UNIQUE NOT NULL,
    variety_name VARCHAR(100) NOT NULL,
    variety_name_en VARCHAR(100),

    -- 계통 분류
    subspecies VARCHAR(20) CHECK (subspecies IN ('indica', 'japonica', 'aus', 'aromatic')),
    ecotype VARCHAR(30),  -- temperate, tropical 등

    -- 3계통법 분류
    line_type VARCHAR(20) CHECK (line_type IN ('A-line', 'B-line', 'R-line', 'F1-hybrid', 'breeding-line', 'landrace')),

    -- CMS 정보
    cytoplasm_type VARCHAR(10) DEFAULT 'N' CHECK (cytoplasm_type IN ('S', 'N')),
    cms_type VARCHAR(10) CHECK (cms_type IN ('WA', 'BT', 'HL', 'GA', 'NONE')),

    -- 메타데이터
    origin_country VARCHAR(50),
    year_released INTEGER,
    breeder_institute VARCHAR(100),
    selection_status VARCHAR(20) DEFAULT 'candidate',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_variety_code ON rice_variety(variety_code);
CREATE INDEX idx_variety_line_type ON rice_variety(line_type);
CREATE INDEX idx_variety_cms ON rice_variety(cytoplasm_type, cms_type);


-- 2. SNP 마커 정보 테이블
CREATE TABLE IF NOT EXISTS snp_marker (
    marker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marker_code VARCHAR(50) UNIQUE NOT NULL,
    marker_name VARCHAR(100),

    -- 위치 정보
    chromosome INTEGER NOT NULL CHECK (chromosome BETWEEN 1 AND 12),
    position_cm DECIMAL(10, 4),  -- cM 단위
    position_bp BIGINT,          -- bp 단위

    -- Allele 정보
    ref_allele VARCHAR(50) NOT NULL,
    alt_allele VARCHAR(50) NOT NULL,

    -- 유전자 연관
    gene_name VARCHAR(50),
    gene_id VARCHAR(50),
    is_functional BOOLEAN DEFAULT FALSE,  -- 기능성 마커 여부

    -- MAF (Minor Allele Frequency)
    maf DECIMAL(5, 4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_marker_chromosome ON snp_marker(chromosome, position_cm);
CREATE INDEX idx_marker_gene ON snp_marker(gene_name);
CREATE INDEX idx_marker_functional ON snp_marker(is_functional) WHERE is_functional = TRUE;


-- 3. 유전자형 데이터 테이블 (Wide format 최적화)
CREATE TABLE IF NOT EXISTS genotype_data (
    genotype_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_id UUID NOT NULL REFERENCES rice_variety(variety_id) ON DELETE CASCADE,
    marker_id UUID NOT NULL REFERENCES snp_marker(marker_id) ON DELETE CASCADE,

    -- Allele call
    allele_call VARCHAR(5) CHECK (allele_call IN ('A', 'B', 'H', '-', 'AA', 'AB', 'BB')),

    -- 품질 정보
    call_quality DECIMAL(5, 2),  -- 0-100 품질 점수

    UNIQUE (variety_id, marker_id)
);

-- 파티셔닝 (대용량 데이터 처리)
-- CREATE TABLE genotype_data_chr1 PARTITION OF genotype_data FOR VALUES FROM (1) TO (2);
-- ... (염색체별 파티션)

-- 인덱스
CREATE INDEX idx_genotype_variety ON genotype_data(variety_id);
CREATE INDEX idx_genotype_marker ON genotype_data(marker_id);


-- 4. Rf 유전자형 테이블
CREATE TABLE IF NOT EXISTS rf_genotype (
    rf_genotype_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_id UUID NOT NULL REFERENCES rice_variety(variety_id) ON DELETE CASCADE,
    rf_gene_name VARCHAR(20) NOT NULL,  -- Rf1, Rf3, Rf4 등

    genotype VARCHAR(5) NOT NULL CHECK (genotype IN ('RR', 'Rr', 'rr')),

    -- 회복 대상 CMS 유형
    target_cms_type VARCHAR(10) CHECK (target_cms_type IN ('WA', 'BT', 'HL', 'GA')),

    UNIQUE (variety_id, rf_gene_name)
);

CREATE INDEX idx_rf_variety ON rf_genotype(variety_id);
CREATE INDEX idx_rf_gene ON rf_genotype(rf_gene_name);


-- 5. 표현형 데이터 테이블
CREATE TABLE IF NOT EXISTS phenotype_data (
    phenotype_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_id UUID NOT NULL REFERENCES rice_variety(variety_id) ON DELETE CASCADE,

    -- 환경 정보
    environment_id UUID REFERENCES environment(environment_id),
    trial_year INTEGER NOT NULL,
    trial_location VARCHAR(100),
    replication INTEGER DEFAULT 1,

    -- 형질 값
    trait_name VARCHAR(100) NOT NULL,
    trait_value DECIMAL(15, 5),
    trait_unit VARCHAR(30),

    -- 데이터 품질
    is_outlier BOOLEAN DEFAULT FALSE,
    data_quality VARCHAR(10) DEFAULT 'good',

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_phenotype_variety ON phenotype_data(variety_id);
CREATE INDEX idx_phenotype_trait ON phenotype_data(trait_name);
CREATE INDEX idx_phenotype_env ON phenotype_data(environment_id, trial_year);


-- 6. 환경 테이블
CREATE TABLE IF NOT EXISTS environment (
    environment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_code VARCHAR(50) UNIQUE NOT NULL,
    environment_name VARCHAR(100),

    location_name VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    trial_year INTEGER,
    season VARCHAR(20),  -- 봄, 여름, 가을

    -- 기상 데이터 요약
    avg_temperature DECIMAL(5, 2),
    total_precipitation DECIMAL(8, 2),
    sunshine_hours DECIMAL(8, 2),

    soil_type VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 7. 교배 기록 테이블
CREATE TABLE IF NOT EXISTS cross_record (
    cross_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cross_code VARCHAR(50) UNIQUE NOT NULL,

    -- 양친 정보
    female_parent_id UUID NOT NULL REFERENCES rice_variety(variety_id),
    male_parent_id UUID NOT NULL REFERENCES rice_variety(variety_id),

    -- 교배 유형
    cross_type VARCHAR(30) CHECK (cross_type IN (
        'hybrid_production', 'maintainer_propagation', 'backcross',
        'normal_cross', 'dead_end', 'three_way'
    )),

    -- 교배 결과
    cross_date DATE,
    success_rate DECIMAL(5, 2),  -- 결실률
    seed_count INTEGER,

    -- 경고 및 메모
    warnings TEXT[],
    recommendations TEXT[],
    notes TEXT,

    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_cross_female ON cross_record(female_parent_id);
CREATE INDEX idx_cross_male ON cross_record(male_parent_id);
CREATE INDEX idx_cross_type ON cross_record(cross_type);


-- 8. 육종 프로그램 테이블
CREATE TABLE IF NOT EXISTS breeding_program (
    program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_code VARCHAR(50) UNIQUE NOT NULL,
    program_name VARCHAR(200) NOT NULL,

    -- 목표
    target_traits TEXT[],
    target_genotypes JSONB,

    -- 자원
    budget_limit DECIMAL(15, 2),
    time_limit_years DECIMAL(4, 1),
    field_capacity INTEGER,

    -- 시설
    has_speed_breeding BOOLEAN DEFAULT FALSE,
    has_dh_facility BOOLEAN DEFAULT FALSE,
    has_marker_lab BOOLEAN DEFAULT FALSE,

    -- 상태
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 9. 엘리트 평가 결과 테이블
CREATE TABLE IF NOT EXISTS elite_evaluation (
    evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_id UUID NOT NULL REFERENCES rice_variety(variety_id),
    program_id UUID REFERENCES breeding_program(program_id),

    -- 통계 지표
    blup_value DECIMAL(15, 5),
    gca_value DECIMAL(15, 5),
    waasb DECIMAL(15, 5),
    waasby DECIMAL(15, 5),
    mtsi DECIMAL(15, 5),

    -- 순위
    overall_rank INTEGER,
    yield_rank INTEGER,
    stability_rank INTEGER,

    -- 추천
    recommendation VARCHAR(30) CHECK (recommendation IN (
        'Core Elite', 'Elite', 'Candidate', 'Remove'
    )),

    -- 분석 설정
    yield_weight DECIMAL(3, 2),
    stability_weight DECIMAL(3, 2),
    analysis_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_elite_variety ON elite_evaluation(variety_id);
CREATE INDEX idx_elite_rank ON elite_evaluation(overall_rank);


-- 10. MAS 마커 선정 결과 테이블
CREATE TABLE IF NOT EXISTS marker_selection_result (
    selection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES breeding_program(program_id),

    -- 선정 결과
    foreground_markers UUID[],  -- marker_id 배열
    background_markers UUID[],
    linkage_markers UUID[],

    total_markers INTEGER,
    estimated_cost DECIMAL(15, 2),
    genome_coverage DECIMAL(5, 4),

    -- 필요 집단 크기
    minimum_population INTEGER,
    confidence_level DECIMAL(4, 3),

    -- 대상 유전자
    target_genes JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- 품종별 CMS/Rf 상태 뷰
CREATE OR REPLACE VIEW v_variety_fertility AS
SELECT
    v.variety_id,
    v.variety_code,
    v.variety_name,
    v.cytoplasm_type,
    v.cms_type,
    v.line_type,
    COALESCE(
        (SELECT STRING_AGG(rf_gene_name || ':' || genotype, ', ')
         FROM rf_genotype r WHERE r.variety_id = v.variety_id),
        'No Rf'
    ) AS rf_status,
    CASE
        WHEN v.cytoplasm_type = 'N' THEN 'Fertile'
        WHEN EXISTS (SELECT 1 FROM rf_genotype r
                     WHERE r.variety_id = v.variety_id
                     AND r.genotype IN ('RR', 'Rr'))
        THEN 'Restored'
        ELSE 'Sterile'
    END AS fertility_status
FROM rice_variety v;


-- 형질별 평균값 뷰
CREATE OR REPLACE VIEW v_trait_summary AS
SELECT
    variety_id,
    trait_name,
    COUNT(*) AS n_observations,
    AVG(trait_value) AS mean_value,
    STDDEV(trait_value) AS std_value,
    MIN(trait_value) AS min_value,
    MAX(trait_value) AS max_value
FROM phenotype_data
WHERE is_outlier = FALSE
GROUP BY variety_id, trait_name;

"""


# ============================================================================
# Neo4j Cypher Schema (Graph Database for Pedigree)
# ============================================================================

NEO4J_SCHEMA = """
// ============================================================================
// BDSS Neo4j Graph Schema
// 벼 혈통 및 교배 관계 그래프 데이터베이스
// ============================================================================

// 1. 노드 생성 - 품종
CREATE CONSTRAINT variety_id IF NOT EXISTS FOR (v:Variety) REQUIRE v.variety_id IS UNIQUE;

// 품종 노드 속성:
// - variety_id: UUID (PostgreSQL과 동기화)
// - variety_code: String
// - variety_name: String
// - line_type: String
// - cytoplasm_type: String ('S' or 'N')
// - cms_type: String
// - generation: String ('P', 'F1', 'F2', 'BC1', etc.)


// 2. 관계 생성
// PARENT_OF: 양친 관계 (방향성 있음)
// - type: 'maternal' 또는 'paternal'
// - cross_id: 교배 기록 ID
// - cross_date: 교배 날짜

// SIBLING_OF: 형매 관계
// - cross_id: 동일 교배에서 유래

// DERIVED_FROM: 여교배 관계
// - bc_generation: 여교배 세대 (1, 2, 3, ...)
// - recurrent_parent: Boolean


// 3. 예시 쿼리

// 3.1. 특정 품종의 혈통 추적 (3세대)
// MATCH path = (v:Variety {variety_code: 'IR64'})<-[:PARENT_OF*1..3]-(ancestor)
// RETURN path

// 3.2. 모계 혈통만 추적
// MATCH path = (v:Variety {variety_code: 'IR64'})<-[:PARENT_OF {type: 'maternal'}*1..5]-(ancestor)
// RETURN path

// 3.3. A 행렬 계산을 위한 친연 계수
// MATCH (v1:Variety), (v2:Variety)
// WHERE v1.variety_id IN $variety_ids AND v2.variety_id IN $variety_ids
// MATCH path = shortestPath((v1)-[:PARENT_OF*]-(v2))
// RETURN v1.variety_id, v2.variety_id, length(path) as distance

// 3.4. CMS 세포질 유래 추적 (모계만)
// MATCH (cms:Variety {cytoplasm_type: 'S'})
// MATCH path = (v:Variety)-[:PARENT_OF {type: 'maternal'}*]->(cms)
// RETURN v, path

// 3.5. 공통 조상 찾기
// MATCH (v1:Variety {variety_code: 'IR64'})<-[:PARENT_OF*]-(ancestor)
// MATCH (v2:Variety {variety_code: 'Kasalath'})<-[:PARENT_OF*]-(ancestor)
// RETURN DISTINCT ancestor.variety_name as common_ancestor


// 4. 인덱스 생성
CREATE INDEX variety_code_index IF NOT EXISTS FOR (v:Variety) ON (v.variety_code);
CREATE INDEX variety_line_type_index IF NOT EXISTS FOR (v:Variety) ON (v.line_type);
CREATE INDEX variety_generation_index IF NOT EXISTS FOR (v:Variety) ON (v.generation);

"""


# ============================================================================
# Data Access Objects (DAO)
# ============================================================================

@dataclass
class VarietyDAO:
    """품종 데이터 접근 객체"""

    @staticmethod
    def get_insert_query() -> str:
        return """
        INSERT INTO rice_variety (
            variety_code, variety_name, variety_name_en,
            subspecies, line_type, cytoplasm_type, cms_type,
            origin_country, year_released, breeder_institute
        ) VALUES (
            %(variety_code)s, %(variety_name)s, %(variety_name_en)s,
            %(subspecies)s, %(line_type)s, %(cytoplasm_type)s, %(cms_type)s,
            %(origin_country)s, %(year_released)s, %(breeder_institute)s
        ) RETURNING variety_id;
        """

    @staticmethod
    def get_by_code_query() -> str:
        return """
        SELECT * FROM v_variety_fertility
        WHERE variety_code = %(variety_code)s;
        """

    @staticmethod
    def get_cms_compatible_crosses_query() -> str:
        """CMS A-line과 교배 가능한 R-line 조회"""
        return """
        SELECT
            a.variety_code as a_line,
            a.cms_type,
            r.variety_code as r_line,
            STRING_AGG(rf.rf_gene_name || '(' || rf.genotype || ')', ', ') as rf_genes
        FROM rice_variety a
        JOIN rice_variety r ON r.line_type = 'R-line'
        JOIN rf_genotype rf ON rf.variety_id = r.variety_id
        WHERE a.cytoplasm_type = 'S'
          AND a.line_type = 'A-line'
          AND rf.target_cms_type = a.cms_type
          AND rf.genotype IN ('RR', 'Rr')
        GROUP BY a.variety_code, a.cms_type, r.variety_code;
        """


@dataclass
class GenotypeDAO:
    """유전자형 데이터 접근 객체"""

    @staticmethod
    def get_bulk_insert_query() -> str:
        return """
        INSERT INTO genotype_data (variety_id, marker_id, allele_call, call_quality)
        VALUES (%(variety_id)s, %(marker_id)s, %(allele_call)s, %(call_quality)s)
        ON CONFLICT (variety_id, marker_id)
        DO UPDATE SET allele_call = EXCLUDED.allele_call, call_quality = EXCLUDED.call_quality;
        """

    @staticmethod
    def get_marker_matrix_query() -> str:
        """유전자형 행렬 조회 (Wide format)"""
        return """
        SELECT
            v.variety_code,
            m.marker_code,
            g.allele_call
        FROM genotype_data g
        JOIN rice_variety v ON v.variety_id = g.variety_id
        JOIN snp_marker m ON m.marker_id = g.marker_id
        WHERE v.variety_id = ANY(%(variety_ids)s)
          AND m.chromosome = %(chromosome)s
        ORDER BY v.variety_code, m.position_cm;
        """


@dataclass
class PedigreeGraphDAO:
    """혈통 그래프 데이터 접근 객체 (Neo4j)"""

    @staticmethod
    def get_create_variety_cypher() -> str:
        return """
        MERGE (v:Variety {variety_id: $variety_id})
        SET v.variety_code = $variety_code,
            v.variety_name = $variety_name,
            v.line_type = $line_type,
            v.cytoplasm_type = $cytoplasm_type,
            v.generation = $generation
        RETURN v;
        """

    @staticmethod
    def get_create_cross_cypher() -> str:
        return """
        MATCH (female:Variety {variety_id: $female_id})
        MATCH (male:Variety {variety_id: $male_id})
        MERGE (offspring:Variety {variety_id: $offspring_id})
        SET offspring.variety_code = $offspring_code,
            offspring.generation = $generation
        CREATE (female)-[:PARENT_OF {type: 'maternal', cross_id: $cross_id}]->(offspring)
        CREATE (male)-[:PARENT_OF {type: 'paternal', cross_id: $cross_id}]->(offspring)
        RETURN offspring;
        """

    @staticmethod
    def get_pedigree_trace_cypher() -> str:
        """혈통 추적"""
        return """
        MATCH path = (v:Variety {variety_id: $variety_id})<-[:PARENT_OF*1..$depth]-(ancestor)
        RETURN
            ancestor.variety_id as ancestor_id,
            ancestor.variety_name as ancestor_name,
            length(path) as generation_distance,
            [rel in relationships(path) | rel.type] as relationship_types
        ORDER BY generation_distance;
        """

    @staticmethod
    def get_kinship_coefficient_cypher() -> str:
        """친연 계수 계산을 위한 경로 찾기"""
        return """
        MATCH (v1:Variety {variety_id: $variety_id_1})
        MATCH (v2:Variety {variety_id: $variety_id_2})
        MATCH path = shortestPath((v1)-[:PARENT_OF*]-(v2))
        WITH v1, v2, path, length(path) as distance
        RETURN
            v1.variety_id as id1,
            v2.variety_id as id2,
            distance,
            // 친연 계수 근사: 2^(-distance/2)
            power(0.5, distance/2.0) as kinship_coefficient;
        """


# ============================================================================
# Schema Export Functions
# ============================================================================

def export_postgresql_schema(filepath: str = None) -> str:
    """PostgreSQL 스키마를 파일로 내보내기"""
    if filepath:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(POSTGRESQL_SCHEMA)
    return POSTGRESQL_SCHEMA


def export_neo4j_schema(filepath: str = None) -> str:
    """Neo4j 스키마를 파일로 내보내기"""
    if filepath:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(NEO4J_SCHEMA)
    return NEO4J_SCHEMA


def generate_erd_mermaid() -> str:
    """ERD를 Mermaid 코드로 생성"""
    return """
```mermaid
erDiagram
    RICE_VARIETY ||--o{ GENOTYPE_DATA : has
    RICE_VARIETY ||--o{ RF_GENOTYPE : has
    RICE_VARIETY ||--o{ PHENOTYPE_DATA : has
    RICE_VARIETY ||--o{ ELITE_EVALUATION : evaluated_in
    RICE_VARIETY ||--o{ CROSS_RECORD : female_parent
    RICE_VARIETY ||--o{ CROSS_RECORD : male_parent

    SNP_MARKER ||--o{ GENOTYPE_DATA : typed_at

    ENVIRONMENT ||--o{ PHENOTYPE_DATA : collected_in

    BREEDING_PROGRAM ||--o{ ELITE_EVALUATION : produces
    BREEDING_PROGRAM ||--o{ MARKER_SELECTION_RESULT : generates

    RICE_VARIETY {
        uuid variety_id PK
        string variety_code UK
        string variety_name
        string subspecies
        string line_type
        string cytoplasm_type
        string cms_type
    }

    SNP_MARKER {
        uuid marker_id PK
        string marker_code UK
        int chromosome
        decimal position_cm
        bigint position_bp
        string ref_allele
        string alt_allele
        string gene_name
        boolean is_functional
    }

    GENOTYPE_DATA {
        uuid genotype_id PK
        uuid variety_id FK
        uuid marker_id FK
        string allele_call
    }

    RF_GENOTYPE {
        uuid rf_genotype_id PK
        uuid variety_id FK
        string rf_gene_name
        string genotype
        string target_cms_type
    }

    PHENOTYPE_DATA {
        uuid phenotype_id PK
        uuid variety_id FK
        uuid environment_id FK
        string trait_name
        decimal trait_value
    }

    ENVIRONMENT {
        uuid environment_id PK
        string environment_code UK
        string location_name
        int trial_year
    }

    CROSS_RECORD {
        uuid cross_id PK
        string cross_code UK
        uuid female_parent_id FK
        uuid male_parent_id FK
        string cross_type
    }

    BREEDING_PROGRAM {
        uuid program_id PK
        string program_name
        decimal budget_limit
    }

    ELITE_EVALUATION {
        uuid evaluation_id PK
        uuid variety_id FK
        decimal blup_value
        decimal waasb
        decimal waasby
        int overall_rank
    }
```
"""


if __name__ == "__main__":
    print("=" * 70)
    print("BDSS Database Schema")
    print("=" * 70)

    print("\n[PostgreSQL Schema]")
    print("-" * 70)
    print(POSTGRESQL_SCHEMA[:2000] + "\n... (truncated)")

    print("\n[Neo4j Graph Schema]")
    print("-" * 70)
    print(NEO4J_SCHEMA[:1000] + "\n... (truncated)")

    print("\n[ERD (Mermaid)]")
    print("-" * 70)
    print(generate_erd_mermaid())
