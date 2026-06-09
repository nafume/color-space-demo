# Review: 2회차 Chapter 3. 감마, OETF, EOTF

대상 draft: `seminar_chapters/drafts/02_03_gamma_oetf_eotf.md`

## Verdict

핵심 구조는 좋다. 감마를 막연한 밝기 보정으로 두지 않고, scene light, signal, display light 사이의 관계로 나누어 OETF/EOTF/OOTF를 설명한 점이 정확하다. Rec.709 OETF와 BT.1886 EOTF를 같은 "709 감마"로 뭉개지 않도록 잡은 점도 중요하다.

주요 보완점은 Barten/JND 설명이다. 현재 `바턴 램프(Barten ramp)`라는 표현이 반복되는데, 표준적으로 더 안전한 설명은 Barten의 contrast sensitivity/JND 모델 또는 JND threshold 기반 램프다. "Barton"으로 오타가 나기 쉬운 용어이기도 하므로, 이름과 개념을 명확히 정의하는 것이 좋다.

## High-Priority Corrections

### Important: `Barten ramp`라는 표현은 정의를 보강해야 함

- 위치: draft 7, 12, 27-33, 111-113
- 왜 중요한가: PQ로 이어지는 지각 기반 양자화 설명에서 Barten은 핵심 배경이지만, `Barten ramp` 자체가 보편 표준명처럼 받아들여지면 청중이 용어를 잘못 기억할 수 있다. 보통은 Barten의 contrast sensitivity function, threshold-versus-luminance, JND(Just Noticeable Difference) 기반 계조/밴딩 모델을 설명하는 편이 안전하다.
- 제안: "Barten ramp"를 유지한다면 첫 등장에 "Barten의 시각 모델을 바탕으로 JND 간격이나 밴딩 가시성을 설명하는 램프 예시"라고 풀어 쓴다. 가능하면 `바턴`보다 `바르턴`/`바텐` 등 발음 표기는 하나로 정하고, 영어 `Barten`을 병기해 오타 `Barton`과 혼동되지 않게 한다.

## Technical Notes

- 위치: draft 37-41
- OETF/EOTF/OOTF 정의는 정확하다. 다만 OOTF는 단순히 카메라 OETF와 디스플레이 EOTF의 곱으로 끝나는 것이 아니라, 기준 시청 환경과 시스템 감마, 제작 의도를 포함하는 system-level 관계라는 점을 현재 문장처럼 유지하는 것이 좋다.

- 위치: draft 57
- sRGB 곡선 설명은 대체로 맞지만, `감마 2.4에 가까운 형태`라고만 말하면 sRGB의 전체 유효 감마를 2.4로 기억할 수 있다. 더 안전한 표현은 "낮은 값에는 선형 구간이 있고, 디코딩 곡선의 거듭제곱 구간은 지수 2.4를 쓰지만 전체적인 표시 인상은 흔히 약 2.2 감마로 설명된다" 정도다.

- 위치: draft 59-61
- Rec.709 OETF와 BT.1886 EOTF 분리는 좋다. BT.1886은 기준 SDR 플랫패널 디스플레이 EOTF로, 이상적인 검정에서는 대략 감마 2.4에 가까워지고 실제 블랙 레벨을 반영한다는 설명을 넣으면 더 정확해진다.

- 위치: draft 101-103
- `ffprobe color_transfer`는 비트스트림의 transfer characteristics 태그를 보여준다. 이것이 실제 재생 파이프라인의 모든 OETF/EOTF 적용을 보장하지는 않으므로, "태그는 신호 해석의 힌트이며 플레이어/OS/디스플레이 관리까지 확인해야 한다"는 단서가 좋다.

## Terminology/Style Notes

- `감마(Gamma)`는 넓은 관습어로 두되, 표준명에서는 `transfer characteristics`, `OETF`, `EOTF`, `OOTF`를 우선 사용하는 현재 방향이 좋다.
- `밴딩(banding)`과 `계조(gradation)`는 잘 구분되어 있다. `그라데이션`과 `계조`가 섞이므로, 강의 슬라이드에서는 `계조(gradation)`로 통일하고 현상 설명에서만 `그라데이션`을 써도 된다.
- `display light`는 `표시광` 또는 `디스플레이 출력광`으로 한 번만 풀어 주면 청중이 `scene light`와 더 쉽게 대비할 수 있다.

## Suggested Additions

- 작은 표를 추가하면 좋다: `Rec.709 OETF = 카메라/신호 인코딩`, `BT.1886 EOTF = SDR 기준 표시`, `sRGB transfer = 웹/컴퓨터 RGB 인코딩/디코딩`.
- Barten/JND 설명에는 "JND 간격으로 충분히 촘촘하면 밴딩이 덜 보이고, 간격이 커지면 램프에서 단계가 보인다"는 한 문장짜리 시각 예시를 넣으면 PQ 장으로 자연스럽게 이어진다.
- Rec.709 OETF와 BT.1886 EOTF를 연결했을 때 시스템 OOTF가 완전한 1:1 선형 재현이 아니라 viewing surround까지 고려한 톤 재현이라는 점을 짧게 언급하면 좋다.

## Residual Risk

`Barten ramp` 용어만 정리하면 큰 위험은 낮다. 남은 위험은 sRGB, Rec.709, BT.1886이 모두 "비슷한 감마 곡선"으로 기억되는 것이다. 표준별 위치를 계속 파이프라인 그림 위에 붙여서 설명하면 해소 가능하다.
