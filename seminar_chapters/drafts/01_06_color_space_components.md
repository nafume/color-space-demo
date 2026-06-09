# [Draft] 1회차 Chapter 6. Color Space를 구성하는 요소들

## 학습 목표

이 장의 목표는 색공간(Color Space)을 이름 하나로 외우지 않고, 실제로 어떤 정의 항목들이 색값(color value)의 의미를 결정하는지 분해해서 읽는 것이다. 원색(color primaries), 화이트 포인트(white point), 전송 특성(transfer characteristics), ICC 프로파일(ICC Profile)을 기본으로 이해하고, 영상 신호(video signal) 워크플로에서 행렬 계수(matrix coefficients)와 색 범위(color range)가 왜 특히 중요한지 설명한다. 마지막으로 컬러 볼륨(color volume)은 2회차로 이어지는 예고 개념으로 가볍게 연결한다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- RGB 색공간에서 원색(color primaries)과 화이트 포인트(white point)가 어떤 역할을 하는가
- 전송 특성(transfer characteristics)이 코드값(code value)과 선형광(linear light)의 관계를 정의한다는 점
- 행렬 계수(matrix coefficients)와 색 범위(color range)는 모든 RGB 색공간의 보편 구성요소라기보다 영상 신호 해석에서 특히 중요하다는 점
- ICC 프로파일(ICC Profile)이 파일과 장치의 색 해석 정보를 전달하는 방식
- 컬러 볼륨(color volume)이 2D 색역(gamut)에 밝기 축을 더한 재현 범위 개념이라는 점

## 핵심 질문

- sRGB라는 이름만 알면 RGB 값의 의미를 모두 안다고 말할 수 있는가?
- 원색(color primaries)과 화이트 포인트(white point)는 각각 무엇을 정하는가?
- transfer는 왜 "감마(Gamma)"라는 한 단어로만 설명하면 부족한가?
- 영상 파일에서 matrix coefficients와 color range가 잘못 해석되면 어떤 문제가 생기는가?
- ICC 프로파일(ICC Profile)은 색공간 자체인가, 색 해석 정보를 담은 프로파일인가?
- 색역(gamut)과 컬러 볼륨(color volume)은 어떻게 다른가?

## 상세 설명

### 1. 색공간은 이름이 아니라 규칙의 묶음이다

실무에서 "이 이미지는 sRGB다", "이 영상은 Rec.709다", "이 디스플레이는 Display P3를 지원한다"처럼 색공간 이름을 말하는 경우가 많다. 하지만 이름만으로는 어떤 RGB 숫자가 실제로 어떤 색을 의미하는지 충분히 설명하기 어렵다.

RGB 색공간(color space)을 읽을 때는 최소한 다음 항목들을 분리해서 보는 습관이 필요하다.

```text
원색(color primaries)
화이트 포인트(white point)
전송 특성(transfer characteristics)
색 해석 정보 전달 방식: ICC Profile 또는 metadata
```

영상 신호(video signal)에서는 여기에 다음 항목들이 특히 중요하게 추가된다.

```text
행렬 계수(matrix coefficients)
색 범위(color range): full range / limited range
```

여기서 주의할 점은 matrix coefficients와 color range를 모든 RGB 색공간의 보편적 구성요소라고 과도하게 일반화하지 않는 것이다. 이들은 RGB 자체의 원색 정의라기보다, 영상이 YCbCr 같은 신호 형식으로 저장/전송되고 다시 RGB로 해석될 때 매우 중요한 메타데이터(metadata)이자 신호 규칙이다.

### 2. 원색(Color Primaries)

원색(color primaries)은 RGB 색공간에서 R, G, B 기본색의 기준 위치를 정의한다. 보통 CIE xy 색도 좌표(chromaticity coordinates)로 표현한다. 원색이 다르면 같은 RGB 값이라도 실제 색도 위치가 달라질 수 있다.

예를 들어 sRGB의 `R=1, G=0, B=0`과 Display P3의 `R=1, G=0, B=0`은 같은 숫자지만 같은 측색적 색(colorimetric color)이 아니다. 두 색공간의 빨강 원색 위치가 다르기 때문이다.

원색은 색역(gamut)의 형태를 결정한다. CIE xy 색도도(CIE xy chromaticity diagram)에서 세 원색을 연결한 삼각형이 해당 RGB 색공간의 색역 삼각형(gamut triangle)이 된다. 따라서 원색을 읽는다는 것은 "이 RGB 시스템이 어떤 색도 범위를 표현할 수 있는가"를 읽는 것이다.

#### 참고사항: CIE RGB 원색과 현대 디스플레이 원색은 같은 뜻이 아니다

Chapter 3에서 다룬 CIE RGB의 원색 `700.0 nm`, `546.1 nm`, `435.8 nm`는 색상 매칭 실험과 CIE XYZ 도출을 위한 역사적 기준광이다. 특히 `435.8 nm`는 "blue primary"라고 부르지만 실제 지각상으로는 보라/청자색(violet-blue)에 가깝게 보일 수 있다.

현대 디스플레이의 원색은 보통 단일 파장의 레이저 같은 빛이 아니라 LED, 형광체, 컬러 필터가 만든 넓은 분광 분포(SPD)를 가진다. sRGB, Display P3, Rec.2020 같은 색공간에서 말하는 원색은 이 분광 분포 자체가 아니라, 그 원색이 표준 관찰자에게 만들어 내는 CIE xy 색도 좌표다.

따라서 "CIE RGB의 blue가 435.8 nm였으니 현대 디스플레이의 blue도 violet-blue여야 한다"라고 이해하면 안 된다. CIE RGB의 원색은 측색 표준을 만들기 위한 실험용 기준이고, 현대 RGB 색공간의 원색은 실제 표시 시스템의 색역, 효율, 밝기, 제조 가능성을 고려해 정의된 재현 기준이다.

### 3. 화이트 포인트(White Point)

화이트 포인트(white point)는 해당 색공간에서 흰색으로 간주하는 기준이다. RGB 값으로는 보통 `R=G=B`일 때 중립색(neutral color)을 만들고, 그중 최대값이 기준 흰색에 해당한다. 이 흰색이 CIE xy에서 어디에 놓이는지가 화이트 포인트다.

sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020은 일반적으로 D65 화이트 포인트(D65 white point)를 사용한다. 반면 ICC 프로파일(ICC Profile) 기반 색관리에서는 PCS(Profile Connection Space)가 D50 기준을 사용하기 때문에, 프로파일 변환 과정에서 화이트 포인트 적응(chromatic adaptation)이 중요해질 수 있다.

화이트 포인트는 색의 중립 기준을 정한다. 같은 원색을 사용하더라도 흰색 기준이 달라지면 회색 축과 색공간 변환 결과가 달라질 수 있다.

### 4. 전송 특성(Transfer Characteristics)

전송 특성(transfer characteristics)은 코드값(code value)과 선형광(linear light) 사이의 관계를 정의한다. 우리가 이미지나 영상 파일에서 보는 RGB 값은 대개 물리적 빛의 세기와 선형으로 대응하지 않는다. 저장, 전송, 지각 효율, 표시 장치 특성 때문에 비선형 인코딩(non-linear encoding)을 사용한다.

흔히 이를 감마(Gamma)라고 부르지만, 실무에서는 더 정확한 용어가 필요하다. 영상 파이프라인에서는 OETF(Opto-Electronic Transfer Function), EOTF(Electro-Optical Transfer Function), OOTF(Opto-Optical Transfer Function)처럼 장면의 빛, 신호, 디스플레이의 빛 사이 관계를 구분한다. SDR에서는 sRGB transfer나 Rec.709 transfer가 등장하고, HDR에서는 PQ(Perceptual Quantizer), HLG(Hybrid Log-Gamma) 같은 전송 함수가 등장한다.

색공간 변환(color space conversion)에서 transfer가 중요한 이유는 RGB 행렬 변환이 보통 선형광(linear light) 값에 적용되어야 하기 때문이다. 따라서 기본 흐름은 다음처럼 된다.

```text
비선형 RGB 코드값
-> inverse transfer
-> 선형 RGB
-> RGB to XYZ matrix
```

전송 특성을 무시하고 코드값에 바로 행렬을 적용하면 색과 밝기 재현이 틀어질 수 있다.

### 5. 행렬 계수(Matrix Coefficients): 영상 신호에서 특히 중요

행렬 계수(matrix coefficients)는 영상 신호에서 RGB와 YCbCr 사이를 변환할 때 사용하는 계수다. 예를 들어 Rec.709와 Rec.2020은 YCbCr 변환에 사용하는 계수가 다르다. 같은 YCbCr 숫자라도 어떤 matrix coefficients로 해석하느냐에 따라 RGB 결과가 달라질 수 있다.

이 항목은 특히 코덱(codec), 컨테이너(container), 방송 표준, FFmpeg 같은 미디어 파이프라인에서 중요하다. 영상 파일의 metadata에는 color primaries, transfer characteristics, matrix coefficients가 따로 기록될 수 있다.

다만 matrix coefficients는 RGB 색공간의 원색 자체를 정의하는 항목과는 구분해야 한다. RGB 이미지 파일을 ICC 프로파일로 관리하는 상황에서는 matrix coefficients라는 메타데이터를 따로 다루지 않는 경우도 많다. 반대로 YCbCr 영상 신호에서는 이 값을 잘못 해석하면 색상과 휘도(luminance)가 눈에 띄게 달라질 수 있다.

### 6. 색 범위(Color Range): Full Range와 Limited Range

색 범위(color range)는 코드값의 어느 범위를 실제 신호 범위로 사용할지 정의한다. 대표적으로 전체 범위(full range)와 제한 범위(limited range)가 있다.

8비트 영상에서 단순화하면 다음처럼 설명할 수 있다.

```text
full range: 0-255 전체를 신호 범위로 사용
limited range: 대략 16-235를 유효 밝기 범위로 사용
```

limited range는 방송/영상 신호 워크플로에서 역사적, 기술적 이유로 널리 쓰였다. 이 범위를 잘못 해석하면 검정이 회색처럼 뜨거나, 그림자가 뭉개지거나, 하이라이트가 잘릴 수 있다.

색 범위 역시 모든 RGB 색공간의 보편 구성요소라기보다 영상 신호 해석에서 특히 중요한 항목으로 보는 편이 정확하다. 이미지 편집 소프트웨어의 RGB 색공간 정의와 영상 디코딩 파이프라인의 range metadata는 서로 다른 층위일 수 있다.

### 7. ICC 프로파일(ICC Profile)

ICC 프로파일(ICC Profile)은 장치나 파일의 색 해석 정보를 담는 표준화된 프로파일이다. 이미지 파일에 ICC 프로파일이 포함되어 있으면, 색관리(color management) 시스템은 그 프로파일을 이용해 RGB 값이 어떤 색을 의미하는지 해석하고, 모니터나 프린터 같은 대상 장치에 맞게 변환할 수 있다.

ICC 기반 변환의 핵심에는 PCS(Profile Connection Space)가 있다. PCS는 CIE XYZ 또는 CIE Lab을 사용할 수 있으며, ICC v2/v4에서는 D50 기준이 중요하게 등장한다. 그래서 sRGB나 Display P3처럼 D65 기준의 RGB 색공간을 인쇄용 D50 기반 프로파일과 연결할 때 화이트 포인트 적응(chromatic adaptation)이 필요할 수 있다.

ICC 프로파일은 색공간과 밀접하지만, "색공간 이름"과 완전히 같은 말은 아니다. 어떤 프로파일은 표준 색공간을 기술할 수 있고, 어떤 프로파일은 특정 모니터, 카메라, 프린터, 인쇄 조건처럼 장치나 조건의 색 특성을 기술할 수 있다.

### 8. 컬러 볼륨(Color Volume) 미리 보기

지금까지 CIE xy 위의 색역(gamut)은 주로 2D 색도 범위를 보여주었다. 하지만 실제 디스플레이가 색을 재현할 때는 "어떤 색도인가"뿐 아니라 "그 색을 얼마나 밝게 낼 수 있는가"도 중요하다. 여기에 밝기 축을 더한 개념이 컬러 볼륨(color volume)이다.

컬러 볼륨은 색 자체의 별도 구성요소라기보다, 디스플레이나 시스템이 색을 어느 밝기 범위까지 재현할 수 있는지를 3차원으로 표현한 개념이다. 예를 들어 두 디스플레이가 같은 Display P3 색역을 지원한다고 해도, 최대 휘도(peak luminance), 블랙 레벨(black level), 색상별 밝기 유지 능력이 다르면 실제 컬러 볼륨은 달라질 수 있다.

이 장에서는 컬러 볼륨을 맛보기로만 소개한다. 2회차에서는 밝기(brightness), 휘도(luminance), HDR(High Dynamic Range), 톤매핑(tone mapping)과 함께 이 개념을 더 자세히 다룬다.

## 용어 노트

### 원색(Color Primaries)

RGB 색공간에서 R, G, B 기본색의 CIE xy 위치다. 원색은 색역(gamut)의 기본 형태를 결정한다.

### 화이트 포인트(White Point)

흰색으로 간주하는 기준 색도다. RGB의 중립축(neutral axis)과 색공간 변환의 기준이 된다.

### 전송 특성(Transfer Characteristics)

코드값(code value)과 선형광(linear light) 또는 표시광(display light)의 관계를 정의하는 비선형 함수 또는 규칙이다. 감마(Gamma), sRGB transfer, Rec.709 transfer, PQ, HLG 등이 이 주제와 연결된다.

### 행렬 계수(Matrix Coefficients)

영상 신호에서 RGB와 YCbCr 사이를 변환할 때 사용하는 계수다. 모든 RGB 색공간의 보편 구성요소라기보다 비디오 저장, 전송, 디코딩 워크플로에서 특히 중요한 신호 해석 항목이다.

### 색 범위(Color Range)

코드값의 어느 범위를 유효 신호로 볼지 정하는 규칙이다. full range와 limited range가 대표적이며, 영상에서 잘못 해석하면 대비와 밝기 재현이 크게 달라진다.

### ICC 프로파일(ICC Profile)

파일, 장치, 출력 조건의 색 특성을 기술하는 표준 프로파일이다. 색관리(color management) 시스템은 ICC 프로파일을 이용해 소스 색을 PCS(Profile Connection Space)를 거쳐 대상 장치 색으로 변환한다.

### 컬러 볼륨(Color Volume)

2D 색역(gamut)에 밝기 축을 더해, 디스플레이나 시스템이 어떤 색을 어느 밝기까지 재현할 수 있는지 표현한 3D 개념이다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `원색과 색역`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - color primaries와 gamut의 관계를 설명한다.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `화이트 포인트`: [Planckian locus](https://commons.wikimedia.org/wiki/File:PlanckianLocus.png) - white point가 단순한 흰색 이름이 아니라 색도 좌표라는 점을 보여준다.
  ![Planckian locus](../assets/images/PlanckianLocus.png)
- `전송 특성`: [sRGB gamma curve](https://commons.wikimedia.org/wiki/File:SRGB_gamma.svg) - transfer characteristics가 RGB 코드값과 선형광(linear light)의 관계를 정한다는 설명에 사용.
  ![sRGB gamma curve](../assets/images/SRGB_gamma.thumb.png)
- `영상 신호 요소`: [YCbCr color space](https://commons.wikimedia.org/wiki/File:YCbCrColorSpace_Perspective.png) - matrix coefficients가 RGB와 YCbCr 계열 신호 해석에 관여한다는 설명의 후보.
  ![YCbCr color space](../assets/images/YCbCrColorSpace_Perspective.thumb.png)

## 실무 예시와 데모 아이디어

### 예시 1. 같은 RGB 값, 다른 primaries

`RGB = (1, 0, 0)`을 sRGB와 Display P3에서 비교한다. 원색(color primaries)이 다르기 때문에 같은 숫자가 다른 빨강을 의미한다는 점을 보여준다.

### 예시 2. Transfer를 무시한 변환

비선형 sRGB 값을 선형화(linearize)하지 않고 바로 행렬 변환한 결과와, inverse transfer 후 선형 RGB에서 변환한 결과를 비교한다. 색공간 변환에서 transfer가 왜 중요한지 체감시키기 좋다.

### 예시 3. Matrix coefficients 오류

Rec.709 YCbCr 영상을 Rec.2020 matrix coefficients로 잘못 해석하거나 반대로 해석한 예시를 보여준다. 피부색과 채도가 미묘하게 또는 크게 달라질 수 있음을 설명한다.

### 예시 4. Full range와 limited range 오류

limited range 영상을 full range로 잘못 읽었을 때 검정이 뜨는 예, full range 영상을 limited range로 잘못 읽었을 때 그림자가 눌리는 예를 비교한다.

### 예시 5. ICC 프로파일 제거 실험

Display P3 이미지에서 ICC 프로파일(ICC Profile)을 제거하거나 sRGB로 잘못 태그(tag)했을 때 색이 어떻게 달라지는지 비교한다. 색값(color value)과 색 해석 정보가 함께 있어야 한다는 메시지를 전달한다.

## 추천 진행 흐름

### 1. 색공간 이름을 분해하기

"sRGB라고 하면 무엇을 아는 것인가?"라는 질문으로 시작한다. 이름 하나가 아니라 원색, 화이트 포인트, transfer, 프로파일/메타데이터를 분리해야 한다고 설명한다.

### 2. Primaries와 white point로 색도 기준 잡기

CIE xy 색도도 위에서 원색과 화이트 포인트를 보여준다. 이 두 항목이 색역과 흰색 기준을 만든다는 점을 연결한다.

### 3. Transfer로 코드값 해석하기

RGB 숫자는 대개 선형광이 아니라는 점을 설명한다. 색공간 변환 전에 inverse transfer가 필요한 이유를 간단한 흐름도로 보여준다.

### 4. Video signal 항목을 별도 층위로 설명하기

matrix coefficients와 color range는 특히 YCbCr 영상 신호에서 중요하다고 구분한다. 모든 RGB 색공간의 보편 구성요소처럼 말하지 않고, 비디오 파이프라인의 신호 해석 항목으로 설명한다.

### 5. ICC 프로파일과 컬러 볼륨으로 확장하기

ICC 프로파일은 색 해석 정보를 전달하는 실무 도구로 소개한다. 마지막에는 2D 색역만으로는 밝기 재현 능력을 설명할 수 없으므로 컬러 볼륨(color volume)이 필요하다고 예고한다.

## 짧은 마무리 요약

Color Space는 이름 하나가 아니라 색값(color value)을 해석하는 규칙의 묶음이다. RGB 색공간에서는 원색(color primaries), 화이트 포인트(white point), 전송 특성(transfer characteristics)이 핵심이며, ICC 프로파일(ICC Profile)은 파일과 장치의 색 해석 정보를 전달하는 중요한 도구다.

영상 신호(video signal)에서는 행렬 계수(matrix coefficients)와 색 범위(color range)가 특히 중요하다. 다만 이 둘을 모든 RGB 색공간의 보편 구성요소로 과도하게 일반화하지 말고, YCbCr 변환과 디코딩 파이프라인에서 중요한 신호 해석 항목으로 구분해야 한다. 마지막으로 CIE xy의 2D 색역은 밝기 재현 능력을 보여주지 않으므로, 다음 회차에서는 밝기 축을 더한 컬러 볼륨(color volume)으로 확장한다.
