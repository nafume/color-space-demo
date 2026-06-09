# Review: 2회차 Chapter 6. 색 범위 상세

대상 draft: `seminar_chapters/drafts/02_06_color_range_details.md`

## Verdict

큰 방향은 정확하다. full range와 limited/video/legal range를 transfer, matrix, gamut과 분리하고, 8비트/10비트 대표 코드 범위와 range mismatch 증상을 설명한 점이 실무적으로 좋다.

고우선 보완점은 legal range와 extended range의 관계를 더 명확히 하는 것이다. 현재 headroom/footroom과 super-white를 언급하지만, "limited의 nominal/legal 범위 밖 값이 항상 버려야 할 불법 값"이라는 오해가 생기지 않도록 extended range를 별도 개념으로 정리하면 좋다.

## High-Priority Corrections

### Important: legal/limited range와 extended range의 차이를 명시해야 함

- 위치: draft 27, 55-57, 83-85, 171
- 왜 중요한가: limited range의 nominal black/white는 8비트 luma `16-235`지만, `1-15` footroom과 `236-254` headroom 쪽에 undershoot/overshoot, super-black/super-white 정보가 존재할 수 있다. 이를 무조건 잘라야 하는 "불법 값"으로 설명하면 보존해야 할 신호가 클리핑될 수 있다.
- 제안: "legal range는 기준 검정/흰색의 nominal 범위이고, 일부 워크플로에서는 그 밖의 headroom/footroom을 extended range 신호로 보존할 수 있다. 단 최종 표시나 인코딩 목적에 따라 클리핑/압축 정책을 정해야 한다"는 문장을 추가한다.

## Technical Notes

- 위치: draft 49-51
- 10비트 limited luma `64-940`, chroma `64-960` 설명은 정확하다. 8비트 값을 단순히 4배 스케일한 대표 범위라는 설명도 좋다. 더 엄밀히는 bit depth가 올라갈 때 nominal range가 동일한 비율로 확장된다는 관점으로 설명하면 된다.

- 위치: draft 61-65
- RGB range와 YCbCr range를 같은 감각으로 다루면 안 된다는 지적은 매우 중요하다. 보강한다면 full-range YCbCr도 chroma는 중심값을 기준으로 한 색차 신호라는 점을 넣어, RGB full `0-255`와 의미가 같지 않음을 분리하면 좋다.

- 위치: draft 65, 83-85
- mismatch 증상 설명은 정확하다. limited를 full로 읽으면 black lift/washed-out, full을 limited로 읽으면 crushed blacks/clipped whites가 나타난다. 이 구분은 실무 디버깅에 바로 도움이 된다.

- 위치: draft 91-99
- `ffprobe`의 `pc/jpeg`와 `tv/mpeg` 설명은 맞다. 추가로 `yuvj*` 픽셀 포맷의 `jpeg` 표기는 FFmpeg 역사적 표기와도 연결되므로, 최신 워크플로에서는 픽셀 포맷명보다 `color_range`와 필터 로그를 함께 확인하라고 하면 좋다.

## Terminology/Style Notes

- `limited`, `video`, `legal`을 동의어처럼 소개하되, `legal`은 nominal broadcast range라는 뉘앙스가 있어 extended 값과 함께 설명하는 것이 좋다.
- `luma Y'` 표기는 잘 되어 있다. 색 범위 장에서도 CIE `Y`와 헷갈리지 않도록 계속 `Y'`를 쓰는 편이 좋다.
- `콘트라스트(contrast)`와 `대비` 중 하나를 주 용어로 정하면 문체가 더 안정된다. 기존 장들처럼 한글 중심이면 `대비(contrast)`가 자연스럽다.

## Suggested Additions

- 8비트 limited range 도표에 다음을 추가하면 좋다: `0/255 reserved`, `1-15 footroom`, `16 black`, `235 white`, `236-254 headroom`, `128 chroma center`.
- 10비트 도표에도 `64 black`, `940 white`, `960 chroma upper`, `512 chroma center`를 넣으면 숫자 감각이 더 명확하다.
- 변환 예시로 `scale=in_range=tv:out_range=pc`처럼 도구별 range 명시가 왜 필요한지 보여주면 실무 연결이 강해진다.

## Residual Risk

이 장은 숫자가 많아서 청중이 "16-235만 정상, 나머지는 모두 삭제"로 기억할 수 있다. headroom/footroom을 extended signal로 보존할 수 있다는 점과, 최종 납품 규격에서는 다시 nominal/legal 범위 관리가 필요하다는 두 문장을 함께 넣으면 위험이 줄어든다.
