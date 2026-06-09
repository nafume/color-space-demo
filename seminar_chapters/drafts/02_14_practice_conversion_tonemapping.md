# [Draft] 2회차 Chapter 14. 실습: 색공간 변환 + 톤매핑

## 학습 목표

이 장의 목표는 HDR(High Dynamic Range) 또는 WCG(Wide Color Gamut) 소스를 SDR(Standard Dynamic Range) Rec.709로 변환하면서 색공간 변환(color space conversion), 전송 함수 해석(transfer interpretation), 톤매핑(tone mapping), 색역 매핑(gamut mapping), range 보정이 각각 어떤 역할을 하는지 직접 확인하는 것이다.

이 장을 마치면 청중은 다음을 수행할 수 있어야 한다.

- HDR10/Rec.2020/PQ 소스의 metadata를 읽고 해석한다
- HDR 이미지 포맷의 ICC profile 또는 color metadata를 확인한다
- scene-referred 소스와 display-referred 소스를 구분한다
- Rec.2020에서 Rec.709로 변환할 때 tone mapping이 왜 필요한지 확인한다
- PQ에서 SDR gamma 또는 BT.1886으로 갈 때 밝기 해석이 어떻게 바뀌는지 설명한다
- range mismatch를 만들고, 증상과 보정 방법을 비교한다
- ffmpeg와 zimg 기반 변환 결과를 비교한다

## 핵심 질문

- HDR10 소스에서 가장 먼저 확인해야 할 metadata는 무엇인가?
- Rec.2020 to Rec.709 변환과 PQ to SDR 변환은 같은 작업인가?
- tone mapping 없이 색공간만 바꾸면 어떤 문제가 생기는가?
- gamut mapping을 하지 않으면 고채도 색은 어떻게 되는가?
- limited range를 full range로 잘못 해석하면 화면은 어떻게 보이는가?
- ffmpeg와 zimg의 결과가 다르면 무엇을 비교해야 하는가?

## 상세 설명

### 1. 실습의 기본 흐름

이번 실습은 다음 단순 흐름을 기준으로 한다.

```text
HDR Rec.2020 PQ source
-> metadata inspection
-> transfer 해석 / linearize
-> tone map luminance
-> gamut map Rec.2020 to Rec.709
-> apply SDR transfer / BT.1886 or gamma
-> encode output Rec.709 SDR
-> compare result and metadata
```

이 흐름은 실제 도구의 내부 구현과 완전히 일치하지 않을 수 있다. 어떤 필터는 tone mapping과 gamut mapping을 결합하고, 어떤 파이프라인은 중간 색공간을 다르게 잡는다. 하지만 교육 목적에서는 "색공간 변환"과 "밝기 재배치"가 별도 문제라는 점을 확인하기에 충분하다.

### 2. HDR10/Rec.2020/PQ 소스 검사

먼저 HDR10 샘플 파일을 준비한다. 실습에서는 파일을 열기 전에 metadata를 확인한다.

확인할 항목은 다음과 같다.

```text
bit depth
color_primaries
color_transfer / color_trc
matrix_coefficients / colorspace
color_range
mastering display metadata
MaxCLL / MaxFALL
codec and pixel format
```

예상되는 HDR10 계열 값은 대략 다음과 같다.

```text
color_primaries = bt2020
color_transfer = smpte2084 또는 pq
matrix_coefficients = bt2020nc
color_range = tv 또는 limited
pixel format = yuv420p10le 등 10-bit 계열
```

여기서 중요한 점은 `bt2020`만 보고 HDR이라고 결론 내리지 않는 것이다. HDR10인지 판단하려면 PQ transfer, bit depth, metadata를 함께 봐야 한다.

### 3. HDR 이미지 포맷 metadata 확인

영상이 아니라 이미지 포맷도 확인한다. HDR HEIF/AVIF, JPEG XL HDR, OpenEXR, 16-bit TIFF/PNG는 서로 다른 방식으로 색과 밝기 정보를 담을 수 있다.

이미지 파일에서는 다음을 확인한다.

```text
ICC profile 존재 여부
nclx 또는 color profile 정보
bit depth
linear / gamma / PQ / HLG 여부
gain map 존재 여부
alpha/channel 구성
scene-referred 또는 display-referred 성격
```

16-bit PNG나 TIFF는 high bit depth를 가질 수 있지만, 자동으로 HDR display-referred 이미지가 되는 것은 아니다. OpenEXR은 보통 linear floating-point scene-referred 제작 데이터일 수 있다. 따라서 이미지 실습에서도 확장자보다 metadata와 workflow context를 먼저 본다.

### 4. Scene-referred와 Display-referred 소스 비교

실습 소스를 두 종류로 나누면 이해가 쉽다.

```text
Display-referred source:
HDR10 Rec.2020 PQ 완성본

Scene-referred source:
camera log, RAW-derived linear image, OpenEXR, ACES source
```

HDR10 display-referred 소스는 이미 특정 HDR 표시 조건을 기준으로 만들어진 결과다. 이를 SDR로 변환할 때는 HDR 표시 기준에서 SDR 표시 기준으로 다시 매핑한다.

반면 scene-referred 소스는 아직 최종 표시 조건이 확정되지 않은 제작 데이터다. 이 경우에는 Rec.709 SDR용 output transform을 설계하는 접근이 더 적절하다. 두 경우를 같은 명령으로 처리해도 결과의 의미는 다를 수 있다.

### 5. Rec.2020 to Rec.709, PQ to SDR

HDR10에서 SDR Rec.709로 갈 때는 최소 두 문제가 있다.

```text
색역 변환:
Rec.2020 primaries -> Rec.709 primaries

밝기 변환:
PQ HDR luminance -> SDR gamma/BT.1886 display range
```

Rec.2020 to Rec.709는 색도 범위를 줄이는 문제다. Rec.709 밖의 색은 clipping되거나 gamut mapping으로 안쪽에 배치되어야 한다.

PQ to SDR gamma/BT.1886은 밝기 해석 문제다. PQ는 절대 휘도 기반 HDR transfer이고, SDR은 훨씬 낮은 표시 밝기 범위를 전제로 한다. 따라서 inverse PQ로 밝기를 해석하고, tone mapping을 거친 뒤 SDR transfer를 적용해야 한다.

### 6. Tone Mapping과 Gamut Mapping 전후 비교

실습에서는 다음 결과를 나란히 비교하면 좋다.

```text
A. metadata만 바꾸고 실제 변환하지 않은 결과
B. Rec.2020 -> Rec.709 색공간 변환만 한 결과
C. PQ -> SDR tone mapping만 한 결과
D. tone mapping + gamut mapping을 함께 적용한 결과
E. range를 잘못 해석한 결과
F. range를 올바르게 보정한 결과
```

A는 가장 위험한 예시다. metadata만 바꾸면 플레이어가 다른 규칙으로 같은 숫자를 해석할 뿐, 색과 밝기가 올바르게 변환된 것은 아니다.

B는 색역은 줄였지만 밝기 범위가 여전히 맞지 않을 수 있다. C는 밝기 인상은 맞아도 Rec.709 밖의 색이 남아 있을 수 있다. D는 가장 목적에 가까운 변환이다. E와 F는 range mismatch의 영향이 색공간 변환과 별개로 얼마나 큰지 보여준다.

### 7. Range mismatch 만들기와 보정

영상에서는 full range와 limited range 해석이 매우 중요하다. HDR10 소스는 보통 limited range YCbCr이다. 이를 full range로 잘못 해석하면 검정이 뜨거나 대비가 낮아질 수 있다. 반대로 full range를 limited로 잘못 해석하면 암부와 하이라이트가 잘릴 수 있다.

실습에서는 test pattern 또는 간단한 샘플로 다음을 비교한다.

```text
limited source를 full로 잘못 해석
full source를 limited로 잘못 해석
metadata와 실제 range가 일치하도록 보정
```

range mismatch는 색역이나 transfer가 맞아도 결과를 망칠 수 있다. 따라서 변환 전후에는 `color_range` metadata와 실제 픽셀 범위를 함께 확인해야 한다.

### 8. ffmpeg와 zimg 비교

ffmpeg는 HDR/SDR 변환 실습에 접근하기 좋은 도구다. `ffprobe`로 metadata를 읽고, `zscale`, `tonemap`, `colorspace` 같은 필터로 변환을 구성할 수 있다. zimg는 고품질 scaling과 colorspace conversion에 쓰이는 라이브러리이며, ffmpeg의 `zscale` 필터를 통해 자주 접한다.

비교할 때는 다음을 본다.

- 입력 metadata를 도구가 어떻게 해석했는가
- transfer와 primaries를 명시했는가, 자동 추론에 맡겼는가
- tone mapping 알고리즘을 무엇으로 선택했는가
- nominal peak 또는 target peak를 어떻게 설정했는가
- range 변환이 의도대로 되었는가
- 출력 metadata가 실제 결과와 일치하는가

도구의 결과가 다르면 "어느 쪽이 예쁘다"보다 먼저 파라미터와 해석 가정을 비교해야 한다.

## 용어 노트

### 색공간 변환(Color Space Conversion)

색공간 변환(color space conversion)은 source 색공간의 값을 해석해 target 색공간에서 다시 표현하는 과정이다. Rec.2020 to Rec.709는 색도 범위를 바꾸는 대표 예다.

### 톤매핑(Tone Mapping)

톤매핑(tone mapping)은 HDR 또는 scene-referred 밝기 범위를 target display 범위에 맞게 재배치하는 과정이다. HDR10 to SDR 변환에서는 필수에 가깝다.

### 색역 매핑(Gamut Mapping)

색역 매핑(gamut mapping)은 target gamut 밖의 색을 target gamut 안으로 옮기는 처리다. 단순 clipping보다 색상과 채도 보존을 고려할 수 있다.

### Range Mismatch

Range mismatch는 full range와 limited range 해석이 실제 데이터와 맞지 않는 문제다. 검정이 뜨거나 암부/하이라이트가 잘리는 대표 원인이다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `입력 HDR 해석`: [PQ EOTF (SMPTE2084)](https://commons.wikimedia.org/wiki/File:PQ_EOTF_%28SMPTE2084%29.png) - HDR PQ 소스를 먼저 올바른 휘도 의미로 해석해야 한다는 설명에 사용.
- `출력 SDR 색역`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - Rec.2020/P3에서 Rec.709로 옮길 때 gamut mapping이 필요함을 설명.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `톤매핑 전후 후보`: [Tone mapping media search](https://commons.wikimedia.org/w/index.php?search=tone+mapping+HDR&title=Special:MediaSearch&type=image) - 실습 결과 비교 슬라이드에 넣을 전후 이미지 후보.
- `검증 패턴`: [SMPTE color bars](https://commons.wikimedia.org/wiki/File:SMPTE_Color_Bars_16x9.svg) - range와 clipping 확인용 테스트 패턴으로 사용.
  ![SMPTE color bars](../assets/images/SMPTE_Color_Bars_16x9.svg)

## 실무 예시와 데모 아이디어

### 예시 1. ffprobe 검사 화면

HDR10 샘플에 대해 `ffprobe` 출력에서 `color_primaries=bt2020`, `color_transfer=smpte2084`, `color_space=bt2020nc`, `color_range=tv`를 찾아 표시한다. mastering display metadata와 MaxCLL/MaxFALL도 확인한다.

### 예시 2. 네 가지 변환 결과 비교

원본 HDR, metadata만 변경한 결과, 색공간만 변환한 결과, tone mapping과 gamut mapping을 적용한 결과를 2x2로 비교한다. 어떤 단계가 어떤 문제를 해결하는지 시각적으로 보여준다.

### 예시 3. Range 오류 패턴

black level과 white level이 표시된 test pattern을 사용해 limited/full 오류를 만든다. 검정이 회색으로 뜨거나 하이라이트가 잘리는 증상을 명확히 보여준다.

### 예시 4. ffmpeg/zimg 파라미터 비교

같은 소스를 `zscale` 기반 변환과 다른 ffmpeg 필터 조합으로 처리하고, 출력 metadata와 시각 결과를 비교한다. 자동 추론보다 명시적 파라미터 설정이 왜 중요한지 설명한다.

## 추천 진행 흐름

### 1. Source inspection부터 시작

파일을 바로 변환하지 않고 metadata를 먼저 읽는다. 이 단계에서 HDR 포맷은 확장자가 아니라 해석 정보라는 이전 장의 메시지를 다시 확인한다.

### 2. 변환 문제를 둘로 나누기

Rec.2020 to Rec.709는 색역 문제, PQ to SDR은 밝기 문제라고 분리한다. 청중이 색공간 변환과 tone mapping을 혼동하지 않게 한다.

### 3. 실패 사례를 일부러 만들기

metadata만 바꾸기, tone mapping 없이 변환하기, range를 잘못 해석하기 같은 실패 사례를 만든다. 잘못된 결과를 봐야 올바른 변환의 필요성이 선명해진다.

### 4. 올바른 단순 흐름으로 정리

마지막에는 simplified flow를 다시 보여 준다.

```text
HDR Rec.2020 PQ
-> inspect metadata
-> inverse transfer / linearize
-> tone map luminance
-> gamut map to Rec.709
-> apply SDR transfer
-> set correct range and metadata
-> Rec.709 SDR output
```

## 짧은 마무리 요약

HDR10/Rec.2020/PQ 소스를 Rec.709 SDR로 변환하는 작업은 색공간 변환만으로 끝나지 않는다. source metadata를 읽고, PQ 밝기를 해석하고, tone mapping으로 밝기 범위를 재배치하고, gamut mapping으로 Rec.709 밖의 색을 처리하고, range와 출력 metadata를 맞춰야 한다.

실습의 핵심은 실패 사례를 보는 것이다. metadata만 바꾸기, tone mapping 생략, gamut mapping 생략, range mismatch는 모두 다른 종류의 오류를 만든다. ffmpeg와 zimg를 비교할 때도 결과만 보지 말고 각 도구가 어떤 primaries, transfer, range, tone mapping 가정을 사용했는지 확인해야 한다.
