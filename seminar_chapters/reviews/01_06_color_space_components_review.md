# Review: 1회차 Chapter 6. Color Space를 구성하는 요소들

대상 draft: `seminar_chapters/drafts/01_06_color_space_components.md`

## Verdict

큰 기술 오류는 발견되지 않았다. 색공간을 원색, 화이트 포인트, 전송 특성, 프로파일/메타데이터로 분해하고, matrix coefficients와 color range를 모든 RGB 색공간의 보편 구성요소가 아니라 영상 신호 해석 개념으로 분리한 점이 특히 좋다.

## High-Priority Corrections

없음.

## Technical Notes

- 원색(color primaries)이 RGB 기본색의 CIE xy 위치를 정의하고 색역의 형태를 결정한다는 설명은 정확하다. 같은 `RGB = (1, 0, 0)`이라도 sRGB와 Display P3에서 다른 측색적 색이 된다는 예시도 좋다.
- 화이트 포인트 설명은 안정적이다. `R=G=B`가 중립축을 만들고 최대값이 기준 흰색에 해당한다는 설명은 RGB working space 맥락에서 유용하다.
- transfer를 단순한 "감마"로 뭉개지 않고 OETF/EOTF/OOTF, PQ, HLG까지 구분한 점이 좋다. 색공간 변환 행렬을 선형광에 적용해야 한다는 흐름도 정확하다.
- matrix coefficients를 RGB와 YCbCr 사이의 변환 계수로 설명하고, color primaries와 구분한 것은 중요한 기술적 안전장치다. 이 항목은 Chapter 5의 sRGB/Rec.709 비교와 잘 맞물린다.
- color range를 full/limited 영상 신호 해석 문제로 설명한 것도 정확하다. 모든 RGB 색공간 자체의 정의 항목처럼 일반화하지 않은 점을 유지해야 한다.
- ICC PCS 설명은 전반적으로 맞다. PCS는 CIE XYZ 또는 CIE Lab을 사용할 수 있으며, ICC 색관리에서는 D50 기준/PCS adopted white가 핵심이라는 표현을 조금 더 명확히 하면 좋다.
- ICC 프로파일은 "색공간 자체"라기보다 색 해석과 변환을 위한 프로파일이라는 설명이 좋다. 다만 matrix/TRC 기반 RGB 프로파일과 LUT 기반 장치 프로파일이 모두 있을 수 있다는 점은 강사 노트로만 추가해도 충분하다.

## Terminology/Style Notes

- 제목의 `Color Space`와 본문의 `색공간(color space)` 표기를 하나의 원칙으로 맞추면 좋다. 세미나 제목상 영어를 살리고 싶다면 제목은 유지하되 본문 첫 등장 뒤에는 `색공간` 중심으로 가는 편이 자연스럽다.
- `color value`, `code value`, `linear light`는 각각 `색값`, `코드값`, `선형광`으로 잘 대응되어 있다. 이후 장에서도 같은 한국어 대응을 유지하면 혼란이 줄어든다.
- `matrix coefficients`는 `행렬 계수`, `color range`는 `색 범위`로 잘 옮겨져 있다. 다만 `range`는 "색역(gamut)"과 혼동되기 쉬우므로 "코드 범위"라는 보조 표현을 한 번 넣는 것도 좋다.

## Suggested Additions

- 첫 번째 규칙 묶음에 "RGB-to-XYZ 변환 행렬은 보통 primaries와 white point에서 유도된다"는 문장을 넣으면 원색/화이트 포인트/행렬의 관계가 더 잘 보인다.
- ICC 프로파일 섹션에서 "이미지 파일의 ICC 프로파일"과 "영상 파일의 color metadata"가 서로 다른 생태계의 전달 방식이라는 대비를 한 문장으로 넣으면 실무 구분이 더 명확하다.
- color range 예시에는 10비트 영상의 limited range가 흔히 64-940 근처라는 점을 각주로만 넣어도 좋다. 본문 8비트 예시는 초급 설명으로 충분하다.
- 컬러 볼륨 미리보기에서는 "같은 P3 coverage라도 밝은 고채도 색을 유지하는 능력은 다를 수 있다"는 예시가 이미 좋으므로, 가능하면 작은 3D 도식이나 밝기별 단면 그림을 추가하면 다음 회차 예고가 강해진다.

## Residual Risk

이 장은 실제 표준과 미디어 파이프라인을 연결하기 때문에 용어 층위가 많다. 남은 위험은 `primaries/transfer/matrix/range/ICC profile`을 모두 같은 종류의 "색공간 구성요소"로 뭉뚱그려 기억하는 것이다. 강의에서는 RGB working space의 정의 항목과 비디오 신호 해석 메타데이터를 표로 분리해 보여주면 가장 안전하다.
