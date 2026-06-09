# [Draft] 00. 세미나 도입: 컬러(Color)를 두 관점으로 나누어 보기

## 학습 목표

이 도입 장의 목표는 세미나 전체의 지도를 먼저 잡는 것이다. 컬러(Color)를 한 번에 모두 설명하려고 하면 색도(chromaticity), 색공간(color space), 감마(Gamma), 밝기(brightness), HDR(High Dynamic Range), 톤매핑(tone mapping)이 뒤섞여 보이기 쉽다. 이 세미나에서는 컬러를 두 관점으로 나누어 본다.

- 1회차: 색도(chromaticity), 색공간(color space), 색공간 변환(color space conversion)
- 2회차: 밝기(brightness), 컬러 볼륨(color volume), 감마(Gamma), HDR(High Dynamic Range), 톤매핑(tone mapping)

여기서 중요한 표현은 "컬러는 색도와 볼륨으로 구성된다"가 아니다. 더 정확하게는, 컬러를 이해하기 위해 먼저 색도(chromaticity)와 색공간(color space) 관점에서 보고, 다음으로 밝기(brightness)와 컬러 볼륨(color volume) 관점에서 본다. 색도와 컬러 볼륨은 컬러의 두 구성 부품이라기보다, 같은 컬러 현상을 서로 다른 질문으로 분석하기 위한 관점이다.

이 장을 마치면 청중은 세미나가 왜 2회차로 나뉘는지, 각 회차가 어떤 질문을 다루는지, 그리고 뒤에서 나올 기술 용어들이 어떤 큰 구조 안에 놓이는지 설명할 수 있어야 한다.

## 핵심 질문

이 세미나를 들은 뒤 청중은 다음 질문에 답할 수 있어야 한다.

- 같은 RGB 값이 항상 같은 색을 의미하지 않는 이유는 무엇인가?
- 색값(color value)과 색공간(color space)은 어떻게 다른가?
- 색도도(chromaticity diagram)에서 말하는 색역(gamut)은 무엇을 보여주고, 무엇을 보여주지 못하는가?
- 색공간 변환(color space conversion)은 RGB 숫자를 단순히 다른 RGB 숫자로 바꾸는 작업인가?
- HDR을 이해할 때 왜 밝기 축이 별도로 필요한가?
- 컬러 볼륨(color volume)은 색 자체의 구성요소인가, 아니면 디스플레이(display)와 시스템의 재현 범위를 설명하는 개념인가?
- 감마(Gamma), OETF(Opto-Electronic Transfer Function), EOTF(Electro-Optical Transfer Function)는 왜 색공간 이야기와 함께 등장하는가?
- HDR을 SDR(Standard Dynamic Range)로 변환할 때 왜 색공간 변환만으로 충분하지 않고 톤매핑(tone mapping)이 필요한가?

## 세미나 전체 프레임

이번 세미나는 컬러를 두 단계로 넓혀 가며 설명한다. 1회차에서는 색의 위치와 좌표계를 중심으로 다룬다. CIE xy 색도도(CIE xy chromaticity diagram) 위에서 색이 어디에 놓이는지, sRGB, Rec.709, Display P3, Rec.2020 같은 표준이 어떤 색역(gamut)을 정의하는지, 그리고 한 색공간(color space)의 RGB 값을 다른 색공간으로 변환하려면 어떤 과정을 거쳐야 하는지 살펴본다.

1회차의 핵심 질문은 "이 색의 색도 위치와 색공간상 의미는 무엇인가?"에 가깝다. 여기서는 원색(color primaries), 화이트 포인트(white point), 색역(gamut), CIE XYZ, CIE xy, CIE Lab, ICC 프로파일(ICC Profile) 같은 개념이 중요해진다. 특히 RGB 값은 그 자체로 완결된 색이 아니라, 어떤 색공간 안에서 해석되어야 의미를 갖는다는 점을 강조한다. 예를 들어 같은 `R=255, G=0, B=0`이라도 sRGB의 빨강인지 Display P3의 빨강인지에 따라 실제 색의 의미는 달라질 수 있다.

2회차에서는 여기에 밝기 축을 더한다. 색도도(chromaticity diagram)는 색의 위치를 설명하는 데 매우 유용하지만, 어떤 색을 얼마나 밝게 재현할 수 있는지까지 직접 보여주지는 않는다. HDR(High Dynamic Range), PQ(Perceptual Quantizer), HLG(Hybrid Log-Gamma), 감마(Gamma), 톤매핑(tone mapping)을 이해하려면 색의 위치뿐 아니라 밝기 재현 범위와 신호 해석 방식까지 함께 보아야 한다.

2회차의 핵심 질문은 "그 색을 얼마나 밝게, 어떤 신호와 장치에서 재현할 수 있는가?"에 가깝다. 이때 컬러 볼륨(color volume)은 색 자체의 별도 구성요소가 아니라, 디스플레이(display)나 영상 시스템이 색을 어느 밝기 범위까지 재현할 수 있는지를 3차원적으로 설명하는 개념이다. 같은 Rec.2020 색역을 목표로 하더라도 실제 디스플레이의 최대 휘도(peak luminance), 블랙 레벨(black level), 패널 특성, 톤매핑(tone mapping) 방식에 따라 재현 가능한 결과는 달라질 수 있다.

따라서 전체 흐름은 다음처럼 이해할 수 있다.

```text
1회차 = 색의 위치를 맞추는 법
2회차 = 색의 밝기와 재현 범위를 맞추는 법
```

또는 실무 변환 관점에서는 다음처럼 볼 수 있다.

```text
1회차 실습: SDR(Standard Dynamic Range) 이미지의 색공간 변환(color space conversion)
2회차 실습: HDR(High Dynamic Range) 이미지/영상의 색공간 변환 + 톤매핑(tone mapping)
```

## 왜 이 순서로 배우는가

색공간(color space)을 처음 공부할 때 흔히 겪는 어려움은 용어들이 서로 다른 층위에 있다는 점이다. sRGB는 색공간 이름처럼 보이고, Rec.709는 방송 표준처럼 보이며, 감마(Gamma)는 밝기 곡선처럼 보이고, HDR은 영상 포맷처럼 보인다. 그런데 실제 파일이나 파이프라인(pipeline)에서는 이들이 동시에 등장한다.

예를 들어 영상 파일을 해석할 때는 원색(color primaries), 전송 특성(transfer characteristics), 행렬 계수(matrix coefficients), 색 범위(color range)를 함께 확인해야 한다. 이미지 파일에서는 ICC 프로파일(ICC Profile)이 색의 의미를 설명할 수 있고, 영상 파일에서는 컨테이너(container)나 스트림 메타데이터(stream metadata)가 색 해석에 관여할 수 있다. HDR 콘텐츠에서는 여기에 비트 심도(bit depth), 마스터링 디스플레이 메타데이터(mastering display metadata), MaxCLL(Maximum Content Light Level), MaxFALL(Maximum Frame-Average Light Level), 톤매핑(tone mapping)까지 추가된다.

이 모든 것을 처음부터 한 덩어리로 설명하면 "색공간 변환"과 "밝기 변환"이 섞여 버린다. 그래서 먼저 1회차에서 색의 좌표와 표준을 다루고, 다음 2회차에서 밝기와 HDR 파이프라인으로 확장한다.

1회차에서 색공간 변환(color space conversion)을 배울 때 기본 흐름은 다음과 같다.

```text
Source RGB
-> inverse transfer
-> linear RGB
-> XYZ
-> chromatic adaptation
-> target linear RGB
-> target transfer
-> Target RGB
```

이 흐름은 "RGB 값을 바로 바꾼다"는 생각을 교정해 준다. 실제로는 입력 RGB 값을 먼저 해당 색공간의 규칙으로 해석하고, 장치 독립(device-independent) 좌표인 CIE XYZ 같은 공간을 거친 뒤, 대상 색공간(target color space)의 규칙에 맞게 다시 표현한다.

2회차에서는 이 흐름만으로는 부족한 경우를 다룬다. HDR Rec.2020 PQ 소스를 SDR Rec.709로 변환한다고 생각해 보자. 색역(gamut)을 Rec.2020에서 Rec.709로 옮기는 것만으로는 충분하지 않다. HDR의 밝기 범위는 SDR 디스플레이가 그대로 재현할 수 없기 때문에, 밝기 정보를 어떻게 압축하고 어떤 하이라이트(highlight)를 살릴지 결정해야 한다. 이 과정이 톤매핑(tone mapping)이다.

따라서 HDR 변환의 단순화한 예시 흐름은 다음처럼 확장된다.

```text
HDR Rec.2020 PQ
-> 전송 함수 해석 / 선형화(linearize)
-> 휘도 톤매핑(tone map luminance)
-> 색역 매핑(gamut map) Rec.2020 to Rec.709
-> SDR 전송 함수 적용(apply SDR transfer)
-> output Rec.709 SDR
```

정리하면, 1회차는 "색을 어디에 놓을 것인가"를 다루고, 2회차는 "그 색을 어떤 밝기와 재현 조건 안에서 보이게 할 것인가"를 다룬다.

## 용어 노트

### 색도(chromaticity)와 색공간(color space)

색도(chromaticity)는 밝기 정보를 분리하고 색의 성질을 좌표로 표현한 것이다. CIE xy 색도도(CIE xy chromaticity diagram)는 색의 위치, 색역(gamut), 화이트 포인트(white point), 원색(color primaries)을 설명하는 데 유용하다. 그러나 xy 좌표만으로는 그 색이 얼마나 밝은지, 특정 디스플레이가 그 색을 어느 밝기까지 낼 수 있는지 알 수 없다.

색공간(color space)은 색을 숫자로 표현하고 해석하기 위한 규칙의 집합이다. RGB 원색(RGB primaries), 화이트 포인트(white point), 전송 특성(transfer characteristics) 같은 요소가 색값(color value)의 의미를 정한다. 특히 영상 신호(video signal)에서는 행렬 계수(matrix coefficients)와 색 범위(color range)까지 함께 색 해석에 관여한다. 따라서 RGB 숫자만 보고 색을 판단하면 안 되고, 그 숫자가 어떤 색공간에 속하는지 함께 보아야 한다.

### 색역(Gamut)과 컬러 볼륨(Color Volume)

색역(gamut)은 보통 CIE xy 평면에서 특정 색공간이나 장치가 표현할 수 있는 색의 범위를 보여준다. sRGB, Display P3, Rec.2020의 삼각형 비교가 대표적인 예다. 그러나 색역은 주로 2차원 색도 범위에 초점을 둔다.

컬러 볼륨(color volume)은 여기에 밝기 축을 더해 표현 범위를 3차원적으로 보는 개념이다. 같은 색도 범위를 갖는다고 해도 디스플레이의 최대 밝기, 최소 검정, 색상별 밝기 재현 능력에 따라 실제 컬러 볼륨은 달라질 수 있다. 따라서 컬러 볼륨은 "색의 구성요소"라기보다 "색과 밝기를 함께 고려한 재현 가능 범위"로 이해하는 편이 정확하다.

### 감마(Gamma), 전송 함수(Transfer Function), HDR, 톤매핑(Tone Mapping)

감마(Gamma)는 흔히 밝기와 코드값(code value) 사이의 비선형 관계를 설명할 때 쓰는 말이다. 더 정확한 영상 파이프라인에서는 OETF(Opto-Electronic Transfer Function), EOTF(Electro-Optical Transfer Function), OOTF(Opto-Optical Transfer Function) 같은 용어로 장면의 빛, 신호, 디스플레이의 빛 사이 관계를 구분한다.

HDR(High Dynamic Range)은 단순히 더 밝은 이미지가 아니다. 더 넓은 밝기 범위와 전송 함수(transfer function)를 중심으로 비트 심도(bit depth), 메타데이터(metadata), 디스플레이 재현 조건 등이 함께 해석되는 경우가 많다. HDR 콘텐츠를 SDR 환경에서 보여주려면 색공간 변환뿐 아니라 톤매핑(tone mapping)이 필요하다. 톤매핑은 재현할 수 없는 밝기 범위를 대상 디스플레이의 범위 안으로 다시 설계하는 과정이다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `세미나 전체 프레임`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - 1회차가 색도(chromaticity)와 색역(gamut)을 다룬다는 첫 인상용 그림.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `색의 위치와 밝기 축 분리`: [The principle of the CIELAB colour space](https://commons.wikimedia.org/wiki/File:The_principle_of_the_CIELAB_colour_space.svg) - 색도/명도 축을 분리해서 생각한다는 도입 설명에 적합.
  ![The principle of the CIELAB colour space](../assets/images/The_principle_of_the_CIELAB_colour_space.svg)
- `2회차 확장`: [HDR color volume concept search result](https://commons.wikimedia.org/w/index.php?search=HDR+color+volume&title=Special:MediaSearch&type=image) - 컬러 볼륨(color volume)은 2D 색역에 밝기 축을 더한 관점이라는 설명의 후보 자료 검색 링크.

## 추천 오프닝 스크립트

안녕하세요. 오늘 세미나는 컬러를 한 번에 모두 설명하기보다, 두 관점으로 나누어 차근차근 보려고 합니다.

첫 번째 관점은 색도(chromaticity)와 색공간(color space)입니다. 같은 RGB 값이라도 어떤 색공간에서 해석하느냐에 따라 실제 의미가 달라질 수 있습니다. 그래서 1회차에서는 CIE xy 색도도(CIE xy chromaticity diagram), CIE XYZ, 원색(color primaries), 화이트 포인트(white point), 색역(gamut), ICC 프로파일(ICC Profile), 그리고 색공간 변환(color space conversion)의 기본 원리를 다룹니다. 이 회차의 질문은 "이 RGB 값은 어떤 색공간에서 어떤 색도/좌표로 해석되는가?"입니다.

두 번째 관점은 밝기(brightness)와 컬러 볼륨(color volume)입니다. 색도도는 색의 위치를 잘 보여주지만, 그 색을 얼마나 밝게 표현할 수 있는지는 별도의 문제입니다. 그래서 2회차에서는 감마(Gamma), OETF, EOTF, PQ, HLG, HDR, 컬러 볼륨, 톤매핑(tone mapping)을 다룹니다. 이 회차의 질문은 "그 색을 얼마나 밝게, 어떤 장치와 신호 조건에서 재현할 수 있는가?"입니다.

여기서 한 가지 표현을 조심하겠습니다. 우리는 "컬러가 색도와 볼륨으로 구성된다"고 말하지 않을 것입니다. 대신 컬러를 이해하기 위해 색도와 색공간 관점, 그리고 밝기와 컬러 볼륨 관점으로 나누어 본다고 말하겠습니다. 컬러 볼륨(color volume)은 색 자체의 구성요소라기보다, 디스플레이나 시스템이 색을 어느 밝기까지 재현할 수 있는지를 설명하는 개념입니다.

오늘부터의 목표는 단순히 용어를 외우는 것이 아닙니다. 파일이나 표준을 보았을 때 이 색값(color value)이 어떤 규칙으로 해석되는지, 색공간 변환이 어떤 단계를 거치는지, HDR 변환에서 왜 톤매핑(tone mapping)이 필요한지 스스로 설명할 수 있게 되는 것입니다.

## 짧은 마무리 요약

이번 세미나는 컬러를 두 관점으로 나누어 다룬다. 1회차에서는 색도(chromaticity), 색공간(color space), 색공간 변환(color space conversion)을 통해 색의 위치와 의미를 이해한다. 2회차에서는 밝기(brightness), 컬러 볼륨(color volume), 감마(Gamma), HDR, 톤매핑(tone mapping)을 통해 색이 실제 장치와 신호 조건에서 어떻게 재현되는지 이해한다.

핵심은 RGB 숫자를 그대로 믿지 않는 것이다. 색값은 색공간 안에서 의미를 갖고, HDR에서는 그 의미에 밝기 재현 조건까지 더해진다. 따라서 좋은 컬러 파이프라인은 색의 위치와 밝기 재현 범위를 함께 다룬다.
