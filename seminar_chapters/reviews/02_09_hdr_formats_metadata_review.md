# Review: 2회차 Chapter 9. HDR 이미지/영상 포맷과 메타데이터

대상 draft: `seminar_chapters/drafts/02_09_hdr_formats_metadata.md`

## 판정

전반적으로 기술적으로 안전한 초안이다. 확장자만으로 HDR 여부를 판단하지 않고, primaries, transfer, bit depth, range, mastering metadata, MaxCLL/MaxFALL, ICC/nclx를 함께 보아야 한다는 메시지가 명확하다.

주요 보완점은 컨테이너/코덱/색 메타데이터의 층위를 조금 더 분리하는 것이다. 특히 HEIF/AVIF/HEIC, MP4/MOV, PNG HDR, gain map HDR stills는 "지원 가능"과 "실제 파일/뷰어에서 올바르게 표시됨" 사이의 간격이 크므로 과잉 일반화를 피하는 문장이 있으면 좋다.

## 높은 우선순위 수정

- `HDR10은 ... 정적 메타데이터를 사용한다`는 설명은 교육적으로 맞지만, 실무에서는 메타데이터가 누락되거나 부정확한 파일도 많다. "HDR10 전달에서는 SMPTE ST 2086 mastering display metadata와 MaxCLL/MaxFALL 같은 정적 메타데이터가 사용될 수 있으며, 생태계상 기대되는 경우가 많다"처럼 약간 완화하면 더 안전하다.
- HEIF/AVIF 설명에 컨테이너와 코덱 차이를 추가하는 것을 권장한다. HEIF는 컨테이너 계열이고, HEIC는 보통 HEVC-coded HEIF, AVIF는 AV1-coded image를 HEIF/ISO BMFF 계열 구조에 담는 방식이다. 확장자, 컨테이너, 코덱, 색 정보가 각각 다른 층위라는 점을 명확히 해야 한다.
- PNG는 초안처럼 "16-bit PNG가 자동 HDR은 아니다"가 핵심이다. 다만 최신 PNG Third Edition은 cICP를 통해 BT.2100 PQ/HLG 같은 HDR/WCG signaling을 명시적으로 다룰 수 있으므로, "전통적인 PNG 관행에서는 자동 HDR이 아니며, 최신 HDR PNG는 cICP 등 명시적 signaling과 지원 뷰어가 필요하다" 정도의 단서를 넣으면 최신성도 확보된다.

## 기술 노트

- HLG 설명은 대체로 좋다. 단, HLG는 PQ HDR10처럼 절대 휘도 mastering metadata에 강하게 의존하지 않고, 시스템 OOTF와 표시 환경 적응이 중요하다는 점을 한 문장 더 넣으면 PQ/HLG 차이가 더 정확해진다.
- Dolby Vision을 "더 좋은 HDR10"이 아니라 별도 시스템으로 분리한 점은 정확하다. 다만 Dolby Vision에는 profile/level, base layer, enhancement layer 또는 single-layer 구조, RPU metadata 등 변형이 있으므로 이 장에서는 "개념 수준"이라고 명시하는 현재 톤을 유지하는 편이 좋다.
- OpenEXR을 display HDR 완성본이 아니라 scene-referred/linear production data로 소개한 것은 매우 적절하다. 예외적으로 EXR에 display-referred 값을 담을 수도 있으나, 관행과 의도는 초안 설명이 맞다.
- `ICC profile`과 `nclx`를 나란히 둔 것은 좋다. 다만 nclx/CICP는 ICC처럼 임의 프로파일을 담는 방식이 아니라 primaries/transfer/matrix/range를 코드값으로 신호하는 방식임을 간단히 구분하면 더 명확하다.
- `RAW/log`를 display HDR 결과물과 분리한 점은 중요하고 정확하다.

## 용어/스타일 노트

- `color_transfer`, `color_trc`, `transfer characteristics`를 같은 개념으로 설명하되 도구별 필드명이라는 단서를 달면 좋다.
- `colorspace`라는 ffmpeg 필드는 matrix coefficients를 뜻하는 경우가 많아 초급자가 RGB 색공간 전체로 오해할 수 있다. "ffmpeg의 `color_space`는 주로 YCbCr matrix 계수 의미"라고 보완하면 실습 장과도 잘 이어진다.
- `HDR 이미지 포맷`이라는 표현은 "HDR을 담을 수 있는 이미지 포맷"과 "특정 파일이 HDR로 인코딩됨"을 구분해 쓰면 더 안전하다.

## 제안 추가

- 짧은 표를 추가하면 좋다: `container`, `codec/encoding`, `color metadata`, `HDR metadata`, `viewer support`. 예: MP4는 컨테이너, HEVC/AV1은 코덱, bt2020/smpte2084는 색/전송 태그, ST 2086/MaxCLL/MaxFALL은 HDR 힌트.
- HDR stills에서 `gain map` 방식과 `PQ/HLG 직접 인코딩` 방식을 분리해 설명하면 Apple/Android 사진과 AVIF/JXL/PNG HDR을 과도하게 한 범주로 묶는 위험이 줄어든다.
- 메타데이터 점검 목록에 "컨테이너 metadata와 elementary stream/codec metadata가 서로 일치하는가"를 넣으면 실무성이 높아진다.

## 잔여 위험

HDR still image 생태계는 2026년 현재도 앱/OS/브라우저 지원 차이가 크다. 이 장은 원칙 설명으로 충분하지만, 실제 데모에서는 특정 샘플이 어떤 OS와 뷰어에서 HDR로 보이는지 사전 검증이 필요하다. "포맷이 지원한다"와 "강의실 장비에서 보인다"는 별개다.
