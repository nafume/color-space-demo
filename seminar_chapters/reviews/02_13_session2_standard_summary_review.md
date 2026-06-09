# Review: 2회차 Chapter 13. 2회차 마무리: 표준별 정의 항목 정리

대상 draft: `seminar_chapters/drafts/02_13_session2_standard_summary.md`

## 판정

요약 장으로서 완성도가 높다. 표준 이름을 외우는 대신 primaries, white point, transfer, matrix, range, metadata, scene/display-referred 성격을 분리해 읽도록 유도하는 구성이 좋다. WCG와 HDR을 분리하고, OpenEXR/ACES를 소비자 HDR 포맷과 다른 제작 워크플로로 둔 점도 정확하다.

주요 보완점은 표의 단순화가 만들어낼 오해를 줄이는 것이다. 특히 HLG의 scene/display 성격, Display P3의 여러 변형, Rec.2020과 Rec.2100의 관계, HDR still 포맷의 지원 상태를 조금 더 조건부로 표현하면 좋다.

## 높은 우선순위 수정

- 표에서 `HLG | display-referred에 가까움`은 보완을 권장한다. HLG는 배포/방송 전달물로는 표시 렌더링을 전제로 하지만, PQ HDR10처럼 절대 display luminance를 직접 지시하는 방식은 아니다. `상대/scene-referred 신호 + display OOTF, 전달물 관점에서는 표시 렌더링 전제`처럼 표현하면 더 정확하다.
- `Display P3 | P3 primaries, D65, ICC/플랫폼 profile`은 좋지만 Display P3 이미지의 transfer는 보통 sRGB 계열인 경우가 많고, DCI-P3 cinema와 Display P3가 다르다는 단서를 추가하면 좋다.
- `HDR HEIF/AVIF | 이미지 HDR 가능`은 맞지만, gain map 방식, PQ/HLG 직접 signaling, ICC/nclx, OS/뷰어 지원이 모두 다르므로 "가능"과 "호환 표시"를 분리해야 한다.

## 기술 노트

- `Rec.2020은 WCG 표준/컨테이너`라는 표현은 실무적으로 좋다. 다만 HDR TV 맥락에서는 Rec.2100이 BT.2020 primaries와 PQ/HLG transfer를 조합해 HDR TV 시스템을 정의한다는 연결을 한 문장 추가하면 표준 계층이 더 명확해진다.
- `HDR10은 display-referred`는 대체로 맞다. 더 엄밀하게는 PQ가 absolute display luminance에 연결되고 mastering metadata가 표시 적응 힌트를 제공한다고 설명하면 좋다.
- `Rec.709 SDR 변환` 열은 유용하다. 다만 `Display P3 -> Rec.709`는 SDR P3라면 주로 gamut mapping이고, HDR P3/PQ 이미지라면 tone mapping도 필요할 수 있다는 조건을 넣으면 더 안전하다.
- `sRGB`와 `Rec.709`의 primaries는 같지만 transfer/OETF/EOTF와 viewing assumptions는 다르다는 설명이 이미 있어 좋다. 이 차이는 요약 표 아래에 한 번 더 강조해도 좋다.
- `OpenEXR/ACES`를 하나의 행으로 묶는 것은 요약 목적상 가능하지만, ACES는 파일 포맷이 아니라 색관리 체계라는 문장이 반드시 유지되어야 한다.

## 용어/스타일 노트

- `HDR 여부`와 `WCG 여부`를 체크리스트 맨 앞에 둔 점은 좋다. 다만 이것도 primaries/transfer/metadata를 보고 판단하는 결과라는 점을 강조하면 "HDR=yes/no" 라벨만 찾는 습관을 막을 수 있다.
- `대표 파일/컨테이너 포맷`은 표준 자체와 혼동될 수 있다. 예를 들어 HDR10은 MP4/MKV/TS 등 여러 컨테이너에 담길 수 있고, AVIF는 포맷 자체가 색 정보 signaling을 포함할 수 있다. 열 이름을 `대표 전달/저장 형태` 정도로 완화해도 좋다.
- `matrix coefficients`는 RGB 이미지보다 YCbCr 영상에서 특히 중요하다는 스타일 가이드를 이전 장들과 맞추면 좋다.

## 제안 추가

- `Rec.2020 SDR`이라는 중간 사례를 표나 예시에 넣으면 `Rec.2020 = HDR` 오해를 강하게 막을 수 있다.
- `P3-in-Rec.2020` 사례를 추가하면 HDR 콘텐츠가 Rec.2020 metadata를 갖더라도 실제 사용 색은 P3 범위에 머무를 수 있다는 메시지가 더 선명해진다.
- `mastering display metadata != actual display capability`를 요약 장에서도 한 줄로 재확인하면 8-12장의 메시지가 잘 닫힌다.
- 마지막에 "표준 이름을 봤을 때 던질 질문 5개"를 넣으면 실무 체크리스트로 쓰기 좋다: primaries, transfer, matrix/range, metadata, source 기준(scene/display).

## 잔여 위험

요약 표는 학습에는 강력하지만 경계 사례를 압축한다. 특히 HLG, HDR stills, ACES, Display P3는 실제 생태계에서 변형이 많다. 표 제목이나 주석에 "대표적 관행 기준이며 파일별 metadata와 워크플로를 확인해야 한다"는 단서를 넣으면 잔여 위험이 줄어든다.
