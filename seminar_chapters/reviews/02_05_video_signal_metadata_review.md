# Review: 2회차 Chapter 5. 영상 신호와 색공간 메타데이터

대상 draft: `seminar_chapters/drafts/02_05_video_signal_metadata.md`

## Verdict

전체적으로 매우 실무적인 장이다. RGB와 YCbCr의 역할 차이, Y' luma와 물리적 luminance의 구분, `primaries/transfer/matrix/range`를 함께 확인해야 한다는 메시지가 정확하다.

가장 중요한 보완점은 Rec.2020 matrix 설명에 NCL(non-constant luminance)과 CL(constant luminance) caveat를 넣는 것이다. HDR/WCG에서 `BT.2020 matrix`라고만 말하면 실제 비트스트림의 `bt2020nc`와 `bt2020c` 차이가 흐려질 수 있다.

## High-Priority Corrections

### Important: Rec.2020 matrix는 NCL/CL 구분을 추가해야 함

- 위치: draft 30, 42, 67, 89, 103
- 왜 중요한가: Rec.2020에는 non-constant luminance(NCL)와 constant luminance(CL) YCbCr 계열이 구분된다. 실무 영상과 HDR10에서는 보통 `BT.2020 non-constant luminance` matrix, 즉 FFmpeg/ffprobe의 `bt2020nc`가 흔하다. `bt2020c`는 다른 신호 해석을 의미하므로 둘을 모두 "Rec.2020 matrix"로 뭉뚱그리면 변환 오류가 생길 수 있다.
- 제안: Rec.2020 matrix 설명에 "대부분의 일반 HDR10/HEVC 파일은 `bt2020nc`로 표시되는 NCL을 사용하며, `bt2020c` constant luminance는 별도로 구분해야 한다"는 문장을 추가한다.

## Technical Notes

- 위치: draft 24, 81, 85
- Y'가 비선형 R'G'B'에서 계산되는 luma이고 CIE XYZ의 `Y`나 물리적 휘도와 다르다는 설명은 매우 중요하고 정확하다. 이 장의 핵심 강점이다.

- 위치: draft 30-44
- matrix coefficients가 R'G'B'와 Y'CbCr 사이의 변환 규칙이라는 설명은 맞다. 다만 `color_primaries`와 `matrix_coefficients`는 독립 태그라는 draft 44의 문장이 중요하므로, 앞쪽 draft 30의 "서로 다른 원색과 루마 계수를 사용하므로"는 "표준별 luma 계수와 관습적 조합이 다르므로"처럼 조금 완화하면 더 안전하다.

- 위치: draft 32
- SD=601, HD=709, UHD/WCG=2020은 좋은 경험칙이다. 이미 해상도만 보고 단정하지 말라고 되어 있어 안전하다. 가능하면 "업스케일 SD, 다운스케일 HD, 잘못 태깅된 파일" 사례를 붙이면 좋다.

- 위치: draft 48-50
- range가 transfer나 gamut과 다르다는 설명은 정확하다. 이 장에서는 개요로 충분하고, 다음 Chapter 6의 상세 설명과 잘 이어진다.

- 위치: draft 54-58
- 크로마 서브샘플링 설명은 적절하다. 추가로 4:2:0의 chroma sample location/사이트 차이가 색 경계와 리사이즈에서 문제가 될 수 있다는 caveat를 넣으면 고급 실무자에게도 도움이 된다.

## Terminology/Style Notes

- `Y 또는 Y'`라고 시작한 뒤 바로 Y' 중심으로 정리하는 방식은 좋다. 이후 문서에서는 디지털 영상 신호를 말할 때 가능한 한 `Y'CbCr` 표기를 우선하면 luminance `Y`와 덜 헷갈린다.
- `matrix`, `transfer`, `primaries`, `range`를 영어 약칭으로 쓰는 부분은 실무 도구 필드명과 맞아 좋다. 한글 본문에서는 `행렬 계수`, `전송 특성`, `원색`, `색 범위`를 첫 등장에 병기하면 충분하다.
- `color_space`가 ffprobe에서 matrix coefficients를 뜻하는 경우가 많다는 설명은 꼭 유지하는 편이 좋다. 많은 실무 오류가 여기서 생긴다.

## Suggested Additions

- `ffprobe` 예시 표에 `color_space=bt2020nc`, `color_transfer=smpte2084`, `color_primaries=bt2020`, `color_range=tv` 같은 HDR10 예시 한 줄을 추가한다.
- NCL/CL 비교를 한 줄로 넣는다: "NCL은 비선형 R'G'B'에서 luma를 만들고 색차를 계산하는 일반적 방식, CL은 휘도 보존을 의도한 별도 방식이라 matrix tag가 다르다."
- `unspecified/unknown` 메타데이터 처리 방침을 추가한다. 태그가 없으면 플레이어가 해상도나 코덱으로 추정할 수 있고, 그 추정이 틀릴 수 있다는 점을 알려주면 좋다.

## Residual Risk

NCL/CL caveat만 보완하면 큰 기술 위험은 낮다. 남은 위험은 청중이 `primaries=bt2020`이면 실제 색이 항상 Rec.2020 전체를 쓴다고 오해하는 것이다. HDR10 콘텐츠가 Rec.2020 container 안에 P3 수준 색을 담는 경우가 많다는 점을 Chapter 4/7과 함께 반복하면 좋다.
