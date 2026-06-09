# [Draft] 2회차 Chapter 5. 영상 신호(Video Signal)와 색공간 메타데이터(Color Metadata)

## 학습 목표

이 장의 목표는 영상 파일의 색이 RGB 값만으로 결정되지 않고, YCbCr, 행렬 계수(matrix coefficients), 전송 특성(transfer characteristics), 원색(color primaries), 색 범위(color range), 크로마 서브샘플링(chroma subsampling) 같은 신호 규칙과 메타데이터(metadata)에 의해 해석된다는 점을 이해하는 것이다.

이 장을 마치면 청중은 Rec.601, Rec.709, Rec.2020 행렬의 역할, full range와 limited range의 차이, 영상 파일에서 확인해야 할 `primaries/transfer/matrix/range` 항목을 설명할 수 있어야 한다.

## 핵심 질문

- 영상은 왜 RGB가 아니라 YCbCr로 저장되는 경우가 많은가?
- 행렬 계수(matrix coefficients)는 무엇을 정의하는가?
- Rec.601, Rec.709, Rec.2020 matrix는 언제 문제가 되는가?
- full range와 limited range는 색역이나 감마와 어떻게 다른가?
- 크로마 서브샘플링(chroma subsampling)은 색 정보에 어떤 영향을 주는가?
- 영상 메타데이터에서 primaries, transfer, matrix, range를 왜 함께 확인해야 하는가?

## 상세 설명

### 1. RGB와 YCbCr은 역할이 다르다

RGB는 디스플레이(display)의 R, G, B 원색(color primaries)과 직관적으로 연결되는 표현이다. 하지만 영상 압축과 방송에서는 RGB 그대로 저장하기보다 YCbCr로 변환해 저장하는 경우가 많다.

YCbCr은 밝기 성분에 가까운 Y 또는 Y'와 색차 성분 Cb, Cr로 신호를 나눈다. 정확히 말하면 디지털 영상에서의 Y'는 보통 비선형 R'G'B'에서 계산되는 루마(luma) 성분이고, 물리적 휘도(luminance) `Y`와 같은 것이 아니다. 이 구분은 매우 중요하다.

인간 시각은 밝기 세부에 더 민감하고 색차 세부에는 상대적으로 덜 민감하다. YCbCr은 이 특성을 이용해 색차 성분을 더 낮은 해상도로 저장하는 크로마 서브샘플링(chroma subsampling)과 잘 맞는다.

### 2. 행렬 계수는 RGB와 YCbCr 사이의 변환 규칙이다

행렬 계수(matrix coefficients)는 R'G'B' 신호와 Y'CbCr 신호 사이를 변환할 때 어떤 계수를 사용할지 정의한다. Rec.601, Rec.709, Rec.2020은 서로 다른 원색과 루마 계수를 사용하므로 YCbCr 변환 행렬도 달라진다.

예를 들어 SD 영상은 Rec.601 matrix를, HD SDR 영상은 Rec.709 matrix를, UHD/WCG 영상은 Rec.2020 matrix를 사용하는 경우가 많다. 하지만 해상도만 보고 matrix를 단정하면 안 된다. 파일 메타데이터와 실제 제작 조건을 확인해야 한다.

matrix가 잘못 해석되면 전체 색이 미묘하게 틀어진다. 특히 피부톤, 빨강/초록 계열, 채도 밸런스가 어색해질 수 있다. 이것은 색역(gamut) 문제와 비슷해 보일 수 있지만, 실제로는 RGB와 YCbCr 사이의 변환 계수를 잘못 적용한 신호 해석 문제다.

### 3. Rec.601, Rec.709, Rec.2020 matrix

Rec.601 matrix는 SDTV 표준에서 쓰이는 YCbCr 변환 계수다. 오래된 SD 소스, DVD, SD 방송 자료에서 중요하다.

Rec.709 matrix는 HDTV 표준에서 널리 쓰인다. 많은 SDR HD 영상의 기본 가정이 Rec.709 primaries와 Rec.709 matrix 조합이다.

Rec.2020 matrix는 UHDTV와 wide color gamut 맥락에서 등장한다. HDR10 콘텐츠는 보통 Rec.2020 계열 color primaries와 Rec.2020 matrix를 함께 표시하는 경우가 많다.

다만 `color_primaries`와 `matrix_coefficients`는 같은 값으로 항상 묶이는 항목이 아니다. 예외적인 파일이나 변환 중간 결과가 있을 수 있으므로 각각 독립적으로 읽어야 한다.

### 4. Full range와 limited range

색 범위(color range)는 디지털 코드값 중 어느 범위를 유효한 영상 신호로 볼 것인지 정의한다. 8비트 기준 full range는 보통 `0-255` 전체를 사용한다. limited range 또는 video/legal range는 luma는 `16-235`, chroma는 `16-240` 범위를 주로 사용한다.

range는 전송 함수(transfer function)가 아니다. 전송 함수는 코드값과 빛 사이의 곡선 관계를 정의하고, range는 그 코드값 중 어느 구간을 유효 신호로 해석할지 정의한다. range 해석이 틀리면 검정이 회색처럼 뜨거나, 암부가 뭉개지고 하이라이트가 잘릴 수 있다.

### 5. 크로마 서브샘플링

크로마 서브샘플링(chroma subsampling)은 Cb/Cr 색차 정보를 luma보다 낮은 공간 해상도로 저장하는 방식이다. 대표적으로 4:4:4, 4:2:2, 4:2:0이 있다.

4:4:4는 색차 해상도를 줄이지 않는다. 4:2:2는 수평 방향 색차 해상도를 줄이고, 4:2:0은 수평과 수직 방향 모두에서 색차 정보를 줄인다. 일반 영상 압축에서는 4:2:0이 흔하지만, 글자, UI, 키잉(keying), 후반 작업에서는 색 경계가 번지거나 깨질 수 있다.

크로마 서브샘플링은 색공간 메타데이터와 별개의 압축/샘플링 구조지만, 색 재현 품질에 큰 영향을 줄 수 있다.

### 6. 영상 파일의 색공간 메타데이터

실무에서 영상 파일을 볼 때는 다음 네 항목을 함께 확인해야 한다.

```text
color_primaries        = 원색과 화이트 포인트 계열
color_transfer         = 전송 특성
matrix_coefficients    = RGB <-> YCbCr 변환 계수
color_range            = full 또는 limited range
```

이 네 항목 중 하나만 맞아도 충분하지 않다. 예를 들어 primaries가 Rec.709라도 transfer가 PQ이면 HDR 신호일 수 있고, matrix가 Rec.709라도 range가 full인지 limited인지에 따라 디코딩 결과가 달라진다.

## 용어 노트

### RGB

RGB는 빨강, 초록, 파랑 원색 조합으로 색을 표현하는 방식이다. 색공간에 따라 원색 위치와 전송 특성이 달라진다.

### YCbCr

YCbCr은 밝기 성분에 가까운 Y'와 색차 성분 Cb, Cr로 영상을 표현하는 방식이다. 압축과 방송에 유리하다.

### 루마(Luma)와 휘도(Luminance)

루마(luma)는 비선형 R'G'B'에서 계산되는 영상 신호 성분이고, 휘도(luminance)는 물리적 측광량이다. 둘을 같은 것으로 말하면 안 된다.

### 행렬 계수(Matrix Coefficients)

행렬 계수(matrix coefficients)는 R'G'B'와 YCbCr 사이의 변환 계수를 정의한다. Rec.601, Rec.709, Rec.2020 matrix가 대표적이다.

### 색 범위(Color Range)

색 범위(color range)는 디지털 코드값 중 유효 신호로 해석할 범위를 정의한다. full range와 limited range가 대표적이다.

### 크로마 서브샘플링(Chroma Subsampling)

크로마 서브샘플링(chroma subsampling)은 색차 정보를 luma보다 낮은 해상도로 저장하는 방식이다. 영상 압축 효율을 높이지만 색 경계 품질에 영향을 줄 수 있다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `YCbCr와 matrix coefficients`: [YCbCr color space](https://commons.wikimedia.org/wiki/File:YCbCrColorSpace_Perspective.png) - RGB와 YCbCr 신호 해석에서 matrix coefficients가 왜 필요한지 설명.
  ![YCbCr color space](../assets/images/YCbCrColorSpace_Perspective.thumb.png)
- `색역 메타데이터`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - color primaries metadata가 실제 어떤 색도 삼각형을 가리키는지 보여준다.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `영상 테스트 패턴`: [SMPTE color bars](https://commons.wikimedia.org/wiki/File:SMPTE_Color_Bars_16x9.svg) - 영상 신호 레벨, range, color bars를 설명할 때 사용할 후보.
  ![SMPTE color bars](../assets/images/SMPTE_Color_Bars_16x9.svg)

## 실무 예시와 데모 아이디어

### 예시 1. ffprobe로 네 가지 색 메타데이터 확인

`ffprobe`로 `color_primaries`, `color_transfer`, `color_space`, `color_range`를 확인한다. 여기서 `color_space`가 많은 도구에서 matrix coefficients를 뜻한다는 점을 설명한다.

### 예시 2. Rec.601과 Rec.709 matrix 오해 비교

같은 YCbCr 데이터를 Rec.601과 Rec.709 matrix로 각각 RGB 변환해 비교한다. 색상축과 채도 밸런스가 미묘하게 달라지는 것을 보여준다.

### 예시 3. 4:4:4와 4:2:0 비교

색이 선명한 텍스트나 UI 이미지를 4:4:4와 4:2:0으로 저장해 색 경계 차이를 보여준다. 일반 자연 영상에서는 잘 보이지 않던 손실이 그래픽에서는 크게 보일 수 있다.

## 추천 진행 흐름

### 1. "영상 파일은 RGB 이미지가 아닐 수 있다"로 시작하기

영상 코덱과 방송에서는 YCbCr이 흔하다는 점을 먼저 말한다. RGB와 YCbCr의 목적 차이를 설명한다.

### 2. Y'와 Cb/Cr 구조 설명하기

루마와 휘도를 구분하고, 왜 색차 성분을 따로 저장하는지 설명한다.

### 3. matrix/range/transfer/primaries를 분리하기

네 항목을 표처럼 보여주고 각각의 역할을 분리한다. 하나가 맞는다고 전체 해석이 맞는 것은 아니라는 점을 강조한다.

### 4. ffprobe 예시로 실무 연결하기

실제 파일에서 어떤 필드명을 확인하는지 보여주고, 다음 장의 Color Range 상세로 연결한다.

## 짧은 마무리 요약

영상 신호(video signal)는 RGB 값만으로 해석되지 않는다. 많은 영상은 YCbCr로 저장되고, 이때 행렬 계수(matrix coefficients), 색 범위(color range), 전송 특성(transfer characteristics), 원색(color primaries)이 함께 필요하다.

실무에서는 `primaries/transfer/matrix/range`를 분리해서 확인해야 한다. 특히 range와 matrix 오류는 색공간 변환이 맞아도 결과를 크게 망칠 수 있다.
