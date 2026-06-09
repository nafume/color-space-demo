# Review: 2회차 Chapter 14. 실습: 색공간 변환 + 톤매핑

대상 draft: `seminar_chapters/drafts/02_14_practice_conversion_tonemapping.md`

## 판정

실습 설계는 좋다. source inspection을 먼저 하고, Rec.2020 to Rec.709 색역 문제와 PQ to SDR 밝기 문제를 분리하며, metadata만 바꾸기/range mismatch/tone mapping 생략 같은 실패 사례를 일부러 보여 주는 구성이 교육적으로 강하다.

가장 큰 리스크는 실습 가능성이다. HDR 샘플, HDR 이미지, OpenEXR/ACES 소스, ffmpeg/zimg 비교까지 모두 하려면 장비와 파일, 빌드 옵션, 뷰어 지원에 따라 시간이 크게 늘어날 수 있다. 세미나 시간 안에서 반드시 보여줄 core path와 선택 demo를 분리하는 것을 권장한다.

## 높은 우선순위 수정

- `ffmpeg와 zimg 기반 변환 결과를 비교`는 실습 목표로 좋지만, zimg를 독립 도구처럼 들리게 할 수 있다. 실제 강의에서는 ffmpeg의 `zscale` 필터가 zimg/libzimg를 사용하는 경로인지, 별도 zimg/zimg test tool을 쓰는지 명확히 해야 한다.
- 실습 flow의 `transfer 해석 / linearize`는 HDR10 PQ에서는 "inverse PQ로 display luminance에 해당하는 값으로 해석"에 가깝다. 이것이 scene light 복원처럼 들리지 않도록 "linearize"라는 말을 보충 설명하는 것이 좋다.
- `color_range metadata와 실제 픽셀 범위를 함께 확인`은 중요하지만 난도가 있다. 실제 픽셀 범위 확인 방법을 제시하지 않으면 실습자가 metadata만 보고 끝낼 수 있다. 테스트 패턴 또는 히스토그램/파형 모니터 확인을 구체화하면 좋다.

## 기술 노트

- 예상 HDR10 필드값 `bt2020`, `smpte2084`, `bt2020nc`, `tv`, `yuv420p10le`는 실무적으로 적절하다. 다만 HDR10 파일이라고 해서 항상 mastering metadata/MaxCLL/MaxFALL이 채워져 있지는 않으므로 "기대값"과 "검증값"을 분리하는 표현이 좋다.
- `metadata만 바꾸고 실제 변환하지 않은 결과`를 실패 사례 A로 둔 것은 매우 좋다. 이 데모는 초급자에게 가장 큰 효과가 있을 가능성이 높다.
- `B. Rec.2020 -> Rec.709 색공간 변환만 한 결과`, `C. PQ -> SDR tone mapping만 한 결과`는 실제 필터에서 완전히 독립적으로 만들기 어렵거나 도구마다 내부 처리 순서가 다를 수 있다. "개념적으로 분리한 비교"라고 명시하면 좋다.
- `gamut mapping을 하지 않으면 고채도 색이 어떻게 되는가`는 좋은 질문이다. 다만 단순 matrix 변환 후 out-of-gamut 값이 clip되는지, soft-map되는지, negative/over-1 값으로 남는지는 pixel format과 필터 체인에 따라 달라진다.
- HDR 이미지 포맷 실습은 영상 실습과 지원 경로가 다르다. 같은 시간에 모두 다루려면 `metadata inspection only`로 제한하는 편이 안정적이다.

## 용어/스타일 노트

- `BT.1886 or gamma`는 교육용으로 이해 가능하지만, Rec.709 OETF와 BT.1886 EOTF, sRGB transfer가 혼동되지 않도록 "출력 파일 태그와 표시 EOTF는 도구/목적에 맞게 선택"이라는 단서를 넣으면 좋다.
- `colorspace`라는 필드가 ffmpeg에서는 matrix coefficients 의미로 쓰이는 경우가 많으므로 실습 명령/출력 해석에서 `color_space=bt2020nc`를 "색공간 전체"로 부르지 않게 주의해야 한다.
- `limited/full 오류` 증상 설명은 좋다. 단, limited를 full로 잘못 해석했을 때와 full을 limited로 잘못 해석했을 때의 증상은 도구의 스케일링 방향에 따라 표현이 헷갈릴 수 있으므로 테스트 패턴으로 확인하는 편이 안전하다.

## 제안 추가

- 실습을 필수와 선택으로 나누는 것을 권장한다.
  - 필수: `ffprobe metadata 확인`, `metadata-only 실패`, `HDR10 PQ -> Rec.709 SDR tone mapping`, `range mismatch 테스트 패턴`.
  - 선택: `HDR still metadata`, `OpenEXR scene-referred 비교`, `ffmpeg 필터별 tone mapping 비교`.
- 샘플 파일 요구사항을 명시하면 좋다: 10-bit HEVC/AV1 HDR10 샘플, mastering metadata가 있는 샘플과 없는 샘플, Rec.709/P3/Rec.2020 테스트 패턴, limited/full range 패턴.
- 명령 예시는 자동 추론보다 명시적 파라미터를 쓰도록 설계해야 한다. 입력 primaries/transfer/matrix/range와 출력 primaries/transfer/matrix/range를 모두 명시한 버전이 필요하다.
- 시각 비교뿐 아니라 `ffprobe`로 출력 metadata가 실제 변환 결과와 일치하는지 확인하는 단계를 마지막에 넣으면 좋다.

## 잔여 위험

실습은 로컬 ffmpeg 빌드 옵션, libzimg/libplacebo 지원 여부, HDR 표시 장치, OS 색관리, 샘플 파일 metadata 상태에 영향을 크게 받는다. 강의 전에 같은 장비에서 전체 명령을 리허설하고, HDR 디스플레이가 없어도 SDR 캡처/스크린샷으로 비교 가능한 fallback 자료를 준비해야 한다.
