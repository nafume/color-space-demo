# Review: 1회차 Chapter 11. 1회차 마무리: 표준별 정의 항목 정리

대상 draft: `seminar_chapters/drafts/01_11_session1_standard_summary.md`

검토 기준:

- sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020, CMYK profile 비교의 정확성
- ICC profile과 영상 metadata의 역할 구분
- 표준 이름보다 primaries/white/transfer/matrix/range를 분리해 읽는 교육 목표

## Verdict

큰 기술 오류는 없다. 표준 이름을 외우지 말고 정의 항목을 분리해 읽으라는 메시지가 매우 좋고, sRGB/Rec.709, Display P3/Adobe RGB, Rec.2020, CMYK profile의 대비도 세미나 마무리 장에 적합하다.

다만 표가 많은 정보를 압축하고 있어 몇몇 셀은 조건부 표현을 조금 더 분명히 하면 좋다. 특히 Display P3, Rec.2020, CMYK profile 행은 "흔한 워크플로"와 "표준 자체"가 섞여 보일 수 있다.

## High-Priority Corrections

없음. 필수 수정이 필요한 중대한 기술 오류는 확인되지 않았다.

## Technical Notes

- 위치: draft 48-49, 57-61
- sRGB와 Rec.709가 같은 xy primaries와 D65 white를 공유하지만 전송 특성, 영상 신호 해석, range/matrix 맥락이 다르다는 설명은 정확하고 중요하다.
- 위치: draft 50, 67
- Display P3 설명은 대체로 맞다. "DCI-P3 계열 원색"보다 "DCI-P3와 같은 primaries를 쓰되 white point는 D65이고, 흔한 이미지 프로파일은 sRGB transfer curve를 쓴다"처럼 쓰면 DCI-P3 theatrical profile과 Display P3를 더 명확히 구분할 수 있다.
- 위치: draft 51, 69
- Adobe RGB의 "대략 gamma 2.2 계열"은 입문용으로 무난하다. 엄밀하게는 Adobe RGB (1998)의 encoding gamma가 563/256, 즉 약 2.199로 정의된다는 보충을 부록이나 주석으로 넣을 수 있다.
- 위치: draft 52, 73-77
- Rec.2020 행에서 transfer가 SDR/HLG/PQ 맥락에 따라 달라진다는 점을 잘 짚었다. "Rec.2020 primaries"와 "BT.2100 HDR transfer(PQ/HLG)"가 함께 쓰일 수 있지만 같은 개념은 아니라는 단서를 유지하면 좋다.
- 위치: draft 53, 81-83
- CMYK profile 행은 정확하다. 단, "PCS는 D50 기준"은 ICC v2/v4 output profile 기준이라는 점을 표시하면 v5/iccMAX 예외와 충돌하지 않는다.
- 위치: draft 87-91
- ICC profile과 영상 metadata의 목적은 비슷하지만 구조와 파이프라인이 다르다는 설명은 매우 적절하다.

## Terminology/Style Notes

- 표 제목의 `ICC/Profile/Metadata 관계`는 `ICC 프로파일/영상 메타데이터 관계`처럼 한국어로 풀면 초급 청중이 더 빨리 읽는다.
- `Matrix` 열은 RGB 이미지 행에서는 "해당 없음"처럼 보일 수 있다. 현재 "핵심은 아님"이라고 잘 피했지만, 열 이름을 `영상 YCbCr Matrix`로 바꾸면 오해가 줄어든다.
- `WCG 여부`의 `아님/WCG` 표현은 단순해서 좋다. 다만 Adobe RGB는 sRGB보다 넓지만 현대 영상 HDR의 WCG와 사용 맥락이 다르다는 단서를 본문에서 이미 보완하고 있어 충분하다.

## Suggested Additions

- 표 아래에 "이 표는 실무 확인 순서이지 모든 표준의 완전한 스펙 표가 아니다"라는 문장을 넣으면 압축표의 한계를 방어할 수 있다.
- Rec.2020 섹션에 "Rec.2020 컨테이너 안의 실제 mastered gamut이 P3에 머무를 수 있다"는 현재 문장이 좋다. 가능하면 `container gamut`과 `actual content gamut` 용어를 병기하면 2회차 HDR 장과 연결된다.
- CMYK profile 섹션에 `FOGRA`, `GRACoL`, `SWOP`, `Japan Color`가 지역/인쇄 조건별 예시라는 점을 한 문장 더 설명하면 "대표 표준 중 하나를 고르면 끝"이라는 오해가 줄어든다.

## Residual Risk

표가 중심인 장이라 세부 조건이 생략될 수밖에 없다. 청중이 "Display P3는 항상 sRGB transfer", "Rec.2020은 항상 HDR", "CMYK는 항상 D50 PCS"처럼 외우지 않도록, 강의 중에는 각 셀을 "흔한 경우/확인해야 할 항목"으로 읽게 안내하는 것이 중요하다.
