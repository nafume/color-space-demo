# Review: 1회차 Chapter 10. ICC Profile 상세 스펙 읽기

대상 draft: `seminar_chapters/drafts/01_10_icc_profile_spec.md`

검토 기준:

- ICC 헤더의 profile class, data color space, PCS, rendering intent, PCS illuminant 설명
- `A2B`/`B2A` 태그 방향과 rendering intent suffix의 정확성
- v2/v4/v5 및 device link profile의 차이

## Verdict

전반적으로 정확하고 교육 흐름도 좋다. 헤더와 태그 테이블을 먼저 읽게 하는 구성, data color space와 PCS의 층위를 분리한 설명, matrix/TRC와 LUT 프로파일의 대비가 강점이다.

주요 보완점은 `A2B0/B2A0` 설명이 "0번 태그"에 집중되어 있어 relative colorimetric용 `A2B1/B2A1`, saturation용 `A2B2/B2A2`, ICC-absolute 처리와의 관계가 흐려질 수 있다는 점이다. v5/iccMAX nuance도 한 문단 정도 추가하면 좋다.

## High-Priority Corrections

### Important: `A2B0/B2A0`만 강조하면 rendering intent별 태그 구성이 오해될 수 있음

- 위치: draft 115-122, 141, 151, 203-205, 223
- 왜 중요한가: `A2B0/B2A0`는 대부분의 profile class에서 perceptual intent용 LUT로 이해된다. ICC v2/v4 출력 프로파일에서는 `A2B1/B2A1`이 media-relative colorimetric, `A2B2/B2A2`가 saturation과 연결된다. ICC-absolute colorimetric은 헤더 값으로는 3번 intent이지만, 기존 `AToB`/`BToA` 계열에서 단순히 `A2B3/B2A3`을 찾는 방식으로 설명하면 안 된다. 최신 ICC.1:2022의 float 기반 `DToB3/BToD3`처럼 absolute intent를 직접 인코딩할 수 있는 확장도 있으므로, 태그 계열별 차이를 구분해야 한다.
- 제안: 주요 태그 목록을 `A2B0/1/2`, `B2A0/1/2`로 확장하고, "0=perceptual, 1=media-relative colorimetric, 2=saturation이며 ICC-absolute colorimetric은 일반적으로 colorimetric 변환과 media white point/PCS 처리로 다루거나, 지원 프로파일에서는 `DToB3/BToD3` 같은 별도 float 태그로 직접 인코딩될 수 있다"는 단서를 추가한다.

## Technical Notes

- 위치: draft 53, 84-86, 165-167
- PCS 필드가 `XYZ` 또는 `Lab`일 수 있다는 설명은 정확하다. 다만 v2/v4의 PCS가 D50 기준임을 용어 노트에도 넣으면 Chapter 9와 일관된다.
- 위치: draft 60, 101
- 헤더의 PCS illuminant가 일반적으로 D50을 나타낸다는 설명은 맞다. 가능하면 수치 `X=0.9642, Y=1.0, Z=0.8249`를 덤프 예시에서 보여주면 실제 파일 읽기 훈련에 도움이 된다.
- 위치: draft 95
- v2/v4 차이를 "태그 해석과 PCS 연결 방식"이라고 한 점은 맞지만 추상적이다. v4가 v2의 모호성을 줄이고 PCS 정의를 더 명확히 했다는 역사적 이유를 한 문장 넣으면 왜 버전을 보는지 설득력이 커진다.
- 위치: draft 103, 113-114, 181-187
- `wtpt`와 `chad` 설명은 대체로 맞다. `wtpt`는 media white point이며 ICC-absolute colorimetric intent 계산과도 관련된다. `chad`는 원래 백색에서 D50 PCS로의 chromatic adaptation matrix 맥락으로 설명하면 좋다.
- 위치: draft 153
- device link profile 설명은 정확하다. 여기에 device link는 일반적으로 PCS 필드가 `Lab` 또는 `XYZ`가 아니라 목적지 data color space를 가리키는 등 일반 device/profile 연결형과 헤더 해석이 다르다는 점을 추가하면 "PCS vs device link" 함정을 피할 수 있다.
- 위치: draft 115-122
- device link profile에서는 단일 `A2B0` 태그가 헤더의 rendering intent에 따라 네 가지 의도 중 하나의 직접 device-to-device 변환을 담을 수 있다는 예외도 있다. 이 점을 "대부분의 일반 profile class" 설명과 분리하면 태그 suffix 설명이 더 정확해진다.
- 위치: draft 147
- display profile은 보통 matrix/TRC지만 LUT를 포함할 수 있다는 단서가 좋다. 고급 디스플레이/캘리브레이션 프로파일의 현실을 반영한다.

## Terminology/Style Notes

- `profile/device class`, `profile class`, `프로파일 클래스`가 섞인다. 헤더 필드명은 `profile/device class`로 소개하고 이후 본문은 `프로파일 클래스(profile class)`로 통일하면 좋다.
- `Data Color Space`는 `데이터 색공간`보다 `장치/데이터 색공간`처럼 부르면 PCS와의 대비가 더 선명하다.
- `A2B0`의 A/B 설명은 교육용으로 좋다. 다만 ICC 문서에서는 `AToB0Tag`, `BToA0Tag`처럼 쓰이는 경우도 있으므로 도구 출력에서 이름이 달라 보여도 같은 계열임을 알려주면 좋다.

## Suggested Additions

- v2/v4/v5 비교 박스:
  - v2: legacy 워크플로에서 널리 쓰이며 구현 해석 차이가 남아 있을 수 있음
  - v4: D50 PCS와 렌더링 모델 정의가 더 명확해져 상호운용성 개선
  - v5/iccMAX: ICC.2/ISO 20677 계열, D50 고정 PCS를 넘어 custom colorimetric PCS와 spectral PCS 등을 지원 가능
- 헤더 덤프 예시를 하나 넣으면 좋다. `class=mntr`, `data color space=RGB`, `PCS=XYZ`, `PCS illuminant=D50`처럼 실제 `iccDump` 출력과 연결하면 학습 효과가 크다.
- 필수 태그와 선택 태그를 구분하는 짧은 표를 추가하면 좋다. `desc`, `cprt`, `wtpt`는 단순 설명용만이 아니라 프로파일 유효성과 CMM 처리에 영향을 줄 수 있다.

## Residual Risk

ICC 스펙 장은 세부가 빠르게 깊어진다. 현재 초안은 입문 강의로 적절하지만, 실제 프로파일 파서를 구현할 수준의 엄밀성은 아니다. 특히 태그 필수성, tag type, PCS 인코딩 범위, mAB/mBA 계열 태그, black point compensation은 후속 자료나 부록으로 분리하는 편이 안전하다.
