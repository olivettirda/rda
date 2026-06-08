# 데모 클립 자리 (assets/)

발표 덱(`../index.html`)의 데모 슬라이드는 이 폴더의 클립을 자동으로 인라인 재생합니다.
**파일이 없으면 "여기에 ○○○ 데모 클립" 플레이스홀더가 표시**되어 덱이 깨지지 않습니다.

## 넣을 파일 (둘 중 아무거나 — mp4 우선)

| 슬라이드 | 권장 파일명 |
|---|---|
| 디지털육종 시뮬레이터 | `demo_breeding.mp4` 또는 `demo_breeding.gif` |
| 농업 조사 통합 도구 | `demo_survey.mp4` 또는 `demo_survey.gif` |
| 배경 선발 분석기 | `demo_bgselection.mp4` 또는 `demo_bgselection.gif` |

- mp4는 `muted`로 자동재생/루프됩니다(소리 없음). 화면 녹화 후 그대로 넣으면 됩니다.
- 완전한 오프라인/단일파일을 원하면 mp4/gif를 base64 data URI로 `<source src>`·`<img src>`에 인라인하세요.

## 현장 실행(라이브 시연)용 — 같은 폴더에 둘 도구 파일

발표 PC에서 "▶ 현장 실행" 버튼이 동작하려면 `index.html`과 **같은 폴더**에 아래 5개를 둡니다.

```
index.html  ← 이 덱
createphenotypingform.html
background_selection_v3.HTML
rice_breeding_v5_0.html
kasp.html
label_printer.html
```

심사단 PC에 도구 파일이 없어도 버튼 클릭은 덱을 깨지 않습니다(안내 토스트만 표시).
단독 열람 시 본 내용은 항상 보이는 데모 클립입니다.
