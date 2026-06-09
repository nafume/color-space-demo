# [Draft] 1회차 Chapter 1. 왜 색공간(Color Space)을 알아야 하는가

## 학습 목표

이 장의 목표는 색공간(Color Space)을 "색을 다루는 사람만 알아야 하는 전문 용어"가 아니라, 이미지와 영상의 RGB 값을 올바르게 해석하기 위한 기본 조건으로 이해하는 것이다. 같은 숫자라도 어떤 색공간에서 해석하느냐에 따라 실제 색의 의미가 달라질 수 있고, 색공간을 모르면 변환, 표시, 보정, 압축, 출력 과정에서 색이 의도와 다르게 보일 수 있다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- 왜 컬러(Color)를 색도(chromaticity)/색공간(color space) 관점과 밝기(brightness)/컬러 볼륨(color volume) 관점으로 나누어 공부하는가
- 같은 RGB 값이 항상 같은 색을 의미하지 않는 이유는 무엇인가
- 색값(color value)과 색공간(color space)은 어떻게 다른가
- 장치 의존 색(device-dependent color)과 장치 독립 색(device-independent color)은 왜 구분해야 하는가
- 1회차와 2회차가 세미나 전체에서 어떤 역할을 맡는가

## 핵심 질문

- `R=255, G=0, B=0`은 언제나 같은 빨강인가?
- RGB 값만 있으면 색을 완전히 알 수 있는가?
- sRGB, Display P3, Rec.709, Rec.2020은 단순히 "색이 더 많고 적은" 이름인가?
- 색공간 변환(color space conversion)은 RGB 숫자를 다른 RGB 숫자로 직접 바꾸는 작업인가?
- CIE XYZ나 CIE xy 같은 장치 독립 좌표(device-independent coordinate)가 왜 필요한가?
- 밝기(brightness), 감마(Gamma), HDR(High Dynamic Range), 톤매핑(tone mapping)은 왜 2회차에서 따로 다루는가?

## 상세 설명

### 1. 색공간(Color Space)을 모르면 RGB 숫자를 해석할 수 없다

컴퓨터에서 색은 자주 RGB 값으로 표현된다. 예를 들어 웹에서 빨강을 `#FF0000`으로 쓰거나, 이미지 픽셀을 `R=255, G=0, B=0`으로 읽는 식이다. 그래서 처음에는 RGB 값 자체가 색이라고 느끼기 쉽다.

하지만 RGB 값은 혼자서는 완전한 색의 의미를 갖지 않는다. `255, 0, 0`은 "빨강 채널을 최대로 켜고, 초록과 파랑 채널은 끈다"는 신호에 가깝다. 이 신호가 실제로 어떤 빨강을 의미하는지는 그 RGB 값이 속한 색공간이 정한다.

예를 들어 같은 `R=255, G=0, B=0`이라도 sRGB에서의 빨강과 Display P3에서의 빨강은 같은 색도 좌표(chromaticity coordinate)를 가리키지 않는다. Display P3의 빨강 원색(red primary)은 sRGB의 빨강 원색보다 더 바깥쪽에 있기 때문에, 같은 RGB 숫자라도 기준 색공간이 달라지면 실제 색의 위치가 달라진다.

따라서 실무에서 중요한 질문은 "RGB 값이 얼마인가?"에서 끝나지 않는다. 항상 다음 질문이 붙어야 한다.

```text
이 RGB 값은 어떤 색공간의 RGB 값인가?
```

이 질문을 생략하면 색이 과하게 선명해지거나, 반대로 물 빠진 듯 보이거나, 서로 다른 프로그램과 장치에서 결과가 달라지는 문제를 만나기 쉽다.

### 2. 색값(Color Value)과 색공간(Color Space)은 다르다

색값(color value)은 숫자다. RGB 이미지라면 각 픽셀의 `R`, `G`, `B` 값이고, CMYK 인쇄 데이터라면 `C`, `M`, `Y`, `K` 값이다. 영상에서는 YCbCr 값으로 저장되어 있을 수도 있다.

색공간(color space)은 그 숫자를 색으로 해석하기 위한 규칙이다. RGB 색공간을 예로 들면 보통 다음 항목들이 중요하다.

- 원색(color primaries): R, G, B 기본색이 CIE 좌표계에서 어디에 있는가
- 화이트 포인트(white point): 흰색 기준이 무엇인가
- 전송 특성(transfer characteristics): 코드값(code value)과 선형광(linear light) 사이의 관계를 어떻게 정의하는가
- ICC 프로파일(ICC Profile) 또는 메타데이터(metadata): 파일과 시스템이 색 해석 정보를 어떻게 전달하는가

영상 신호 워크플로(video signal workflow)에서는 여기에 행렬 계수(matrix coefficients)와 색 범위(color range) 해석도 특히 중요해진다. RGB와 YCbCr 사이를 오가거나, 제한 범위(limited range)와 전체 범위(full range)를 구분해야 하는 경우가 많기 때문이다. 다만 matrix와 range를 모든 RGB 색공간의 보편적인 구성요소라고 단정하기보다는, 영상 저장과 전송, 디코딩(decoding), 색 변환 과정에서 매우 중요한 신호 해석 항목으로 보는 편이 정확하다.

정리하면 색값은 "숫자"이고, 색공간은 그 숫자의 "의미를 정하는 문맥"이다. 숫자와 문맥이 함께 있어야 색이 결정된다.

### 3. 같은 RGB 값이 다른 색을 의미하는 이유

다음 두 데이터가 있다고 가정하자.

```text
Sample A: RGB = (255, 0, 0), color space = sRGB
Sample B: RGB = (255, 0, 0), color space = Display P3
```

두 샘플은 RGB 숫자가 같다. 하지만 같은 측색적 색(colorimetric color)이라고 말할 수는 없다. sRGB와 Display P3는 R, G, B 기본색의 위치가 다르기 때문이다. RGB 값은 각 색공간의 원색(primary)을 어느 비율로 섞을지 나타내므로, 원색 자체가 다르면 결과 색도 달라진다.

반대로 다음처럼 RGB 값은 다르지만 같은 색을 가리키는 경우도 있다.

```text
Sample C: 어떤 색을 sRGB 값으로 표현
Sample D: 같은 색을 Display P3 값으로 표현
```

이 경우 두 RGB 숫자는 서로 다를 수 있다. 그러나 두 값이 CIE XYZ 같은 장치 독립 좌표(device-independent coordinate)에서 같은 색을 가리키도록 변환되어 있다면, 의도한 색은 같다고 볼 수 있다.

이 지점이 색공간 변환(color space conversion)의 핵심이다. 색공간 변환은 RGB 숫자를 겉보기 좋게 다시 배치하는 작업이 아니다. 입력 색공간(source color space) 안의 RGB 값을 먼저 실제 색의 의미로 해석하고, 그 색을 대상 색공간(target color space)에서 다시 표현하는 작업이다.

기본 흐름은 다음처럼 이해할 수 있다.

```text
Source RGB
-> source color space 규칙으로 해석
-> 장치 독립 색 좌표(device-independent color coordinate)로 변환
-> target color space에서 다시 표현
-> Target RGB
```

뒤의 장에서는 이 흐름을 더 구체적으로 다룬다. 비선형 RGB(non-linear RGB)를 선형 RGB(linear RGB)로 풀고, RGB에서 CIE XYZ로 변환하고, 필요하면 화이트 포인트 적응(white point adaptation 또는 chromatic adaptation)을 거친 뒤, 대상 RGB 색공간으로 다시 보내는 과정이 등장한다.

### 4. 장치 의존 색(Device-Dependent Color)과 장치 독립 색(Device-Independent Color)

RGB는 본질적으로 장치와 가까운 표현이다. 모니터는 R, G, B 발광 요소를 사용하고, 카메라는 센서의 응답으로 빛을 측정하며, 각 장치의 물리적 특성은 서로 다르다. 그래서 아무 기준 없이 "RGB 255, 0, 0"이라고만 말하면 어떤 장치의 빨강인지 알 수 없다.

이런 표현을 장치 의존 색(device-dependent color)이라고 볼 수 있다. 장치 의존 색은 특정 장치나 특정 표준의 규칙 안에서는 유용하지만, 장치가 바뀌면 같은 숫자가 같은 색을 보장하지 않는다.

반대로 CIE XYZ, CIE xy, CIE Lab 같은 공간은 장치 독립 색(device-independent color)을 다루기 위해 사용된다. 여기서 "장치 독립"이라는 말은 실제 세상의 모든 관찰 조건을 완벽하게 제거한다는 뜻이 아니다. 특정 표준 관찰자(standard observer)와 기준 조건을 세우고, 장치가 아니라 색의 지각적 또는 측색적(colorimetric) 의미를 중심으로 표현한다는 뜻에 가깝다.

색공간 변환에서 장치 독립 좌표가 중요한 이유는 중간 기준점이 필요하기 때문이다. sRGB에서 Display P3로 직접 숫자를 감으로 바꾸는 것이 아니라, sRGB 값이 의미하는 색을 CIE XYZ 같은 공통 좌표로 해석한 뒤 Display P3의 RGB 값으로 다시 표현할 수 있다.

### 5. 세미나는 왜 두 관점으로 나누는가

컬러를 한 번에 설명하려고 하면 여러 층위가 섞인다. CIE xy 색도도(CIE xy chromaticity diagram), 색역(gamut), RGB 원색(RGB primary), 화이트 포인트(white point)는 색의 위치를 설명하는 데 가깝다. 감마(Gamma), EOTF(Electro-Optical Transfer Function), HDR, 최대 휘도(peak luminance), 톤매핑(tone mapping)은 밝기와 신호 재현을 설명하는 데 가깝다. 둘은 서로 연결되어 있지만 같은 질문은 아니다.

그래서 이 세미나는 컬러를 두 관점으로 나누어 본다.

```text
1회차: 색도와 색공간 관점
2회차: 밝기와 컬러 볼륨 관점
```

1회차에서는 "이 색의 색도 위치와 색공간상 의미는 무엇인가?"를 다룬다. CIE xy 색도도 위에서 색의 위치를 보고, sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020 같은 표준이 어떤 색역과 기준점을 갖는지 살핀다. 그리고 한 색공간의 RGB 값을 다른 색공간의 RGB 값으로 바꾸는 변환 원리를 배운다.

2회차에서는 "그 색을 얼마나 밝게, 어떤 신호와 장치에서 재현할 수 있는가?"를 다룬다. 여기에 밝기 축이 추가되면 컬러 볼륨(color volume), 감마(Gamma), HDR, PQ(Perceptual Quantizer), HLG(Hybrid Log-Gamma), 톤매핑(tone mapping)이 필요해진다. 컬러 볼륨은 색 자체의 구성요소라기보다, 디스플레이나 시스템이 색을 어느 밝기 범위까지 재현할 수 있는지를 3차원으로 표현한 개념이다.

즉 1회차는 색의 위치를 맞추는 법을 배우고, 2회차는 색의 밝기와 재현 범위를 맞추는 법으로 확장한다.

## 용어 노트

### 색값(Color Value)

색값은 픽셀이나 신호에 저장된 숫자다. RGB, YCbCr, CMYK, Lab 값이 모두 색값이 될 수 있다. 하지만 색값은 항상 해석 규칙과 함께 읽어야 한다.

### 색공간(Color Space)

색공간은 색값을 의미 있는 색으로 해석하기 위한 좌표계와 규칙의 집합이다. sRGB, Display P3, Rec.709, Rec.2020, CIE XYZ, CIE Lab은 서로 다른 목적과 정의를 가진 색공간 또는 색 관련 표준이다.

### 원색(Color Primaries)

RGB 색공간에서 R, G, B 기본색의 기준 위치를 말한다. CIE xy 색도도에서는 보통 세 primary를 삼각형의 꼭짓점으로 표시한다.

### 화이트 포인트(White Point)

흰색으로 간주하는 기준점이다. sRGB와 Rec.709는 보통 D65 화이트 포인트(D65 white point)를 사용한다. ICC 기반 인쇄 워크플로에서는 PCS(Profile Connection Space) 기준으로 D50이 중요하게 등장한다.

### 장치 의존 색(Device-Dependent Color)

특정 장치나 특정 표준의 물리적, 신호적 정의에 의존하는 색 표현이다. RGB와 CMYK는 많은 경우 장치 의존적 맥락을 갖는다.

### 장치 독립 색(Device-Independent Color)

특정 디스플레이나 프린터의 RGB, CMYK 값이 아니라, 표준 관찰자와 측색 기준을 바탕으로 색의 의미를 표현하려는 방식이다. CIE XYZ와 CIE Lab이 대표적이다.

### 행렬 계수(Matrix Coefficients)와 색 범위(Color Range)

영상 신호에서는 RGB와 YCbCr 사이의 변환 행렬, 제한 범위(limited range)와 전체 범위(full range) 같은 범위 해석이 결과 색과 밝기에 큰 영향을 준다. 이들은 모든 RGB 색공간을 설명할 때 항상 같은 방식으로 필요한 항목이라기보다, 비디오 코덱(video codec), 컨테이너(container), 방송/영상 표준, 디코딩 파이프라인(decoding pipeline)에서 특히 중요하게 확인해야 하는 항목이다.

## 실무 예시

### 예시 1. 프로파일(Profile) 없는 이미지

어떤 이미지 파일에 RGB 값은 들어 있지만 ICC 프로파일(ICC Profile)이 없다고 해 보자. 많은 프로그램은 이를 sRGB로 가정할 수 있다. 만약 실제 제작 의도가 Display P3였다면, 프로그램은 더 넓은 색역의 값을 sRGB 값처럼 해석할 수 있고 색이 의도와 다르게 보일 수 있다.

실무 포인트는 간단하다.

```text
RGB 파일을 전달할 때는 RGB 값만이 아니라 색공간 정보도 함께 전달해야 한다.
```

### 예시 2. Display P3 이미지를 sRGB 환경에 그대로 표시

Display P3 이미지에는 sRGB보다 더 채도 높은 색이 들어갈 수 있다. 이 이미지를 색관리(color management) 없이 sRGB처럼 표시하면, 원래 의도한 색보다 다르게 보일 수 있다. 반대로 제대로 색관리된 환경에서는 Display P3 값을 해석한 뒤 현재 디스플레이(display)가 표현할 수 있는 방식으로 변환한다.

여기서 핵심은 "넓은 색공간 이미지가 항상 더 좋다"가 아니다. 중요한 것은 이미지의 색공간을 정확히 알고, 표시 장치와 목적에 맞게 올바르게 변환하는 것이다.

### 예시 3. 영상의 색 범위(Color Range) 해석 오류

영상에서는 전체 범위(full range)와 제한 범위(limited range) 해석이 어긋나면 검정이 뜨거나, 그림자가 뭉개지거나, 하이라이트가 잘릴 수 있다. 이 문제는 단순한 색역 차이와는 다른 층위의 신호 해석 문제다.

예를 들어 제한 범위(limited range) 영상을 전체 범위(full range)로 잘못 해석하면 대비가 낮아져 흐릿하게 보일 수 있고, 반대로 전체 범위 영상을 제한 범위로 잘못 해석하면 어두운 영역과 밝은 영역이 과하게 눌릴 수 있다.

따라서 영상 워크플로에서는 원색(color primaries), 전송 특성(transfer characteristics)과 함께 행렬 계수(matrix coefficients), 색 범위(color range) 메타데이터도 확인해야 한다.

### 예시 4. HDR을 SDR로 변환할 때

HDR Rec.2020 PQ 영상을 SDR Rec.709로 변환한다고 해 보자. 이때 색공간 변환만 수행하면 충분하지 않다. HDR의 밝기 범위는 SDR 디스플레이가 그대로 표현할 수 없기 때문에, 밝기 정보를 어떻게 압축할지 결정해야 한다.

이 과정이 톤매핑(tone mapping)이다. 1회차에서 배운 색공간 변환이 색의 위치를 옮기는 문제라면, 2회차의 톤매핑은 재현 가능한 밝기 범위 안에서 장면의 인상을 다시 설계하는 문제다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `같은 RGB 값, 다른 의미`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - sRGB와 Display P3의 빨강이 같은 RGB 숫자라도 다른 색도 위치를 가질 수 있음을 보여준다.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `RGB 숫자와 실제 색의 차이`: [RGB color cube](https://commons.wikimedia.org/wiki/File:RGBCube_a.svg) - RGB는 좌표값이고, 좌표를 해석하는 색공간(color space)이 필요하다는 설명에 적합.
  ![RGB color cube](../assets/images/RGBCube_a.svg)
- `실무 파일 해석`: [ICC profile overview](https://www.color.org/iccprofile.xalter) - 이미지 파일의 ICC Profile이 색값 해석에 관여한다는 공식 설명 링크로 사용.

## 추천 진행 흐름

### 1. 문제 제기: RGB 값만 믿을 수 있는가

처음에는 `RGB = (255, 0, 0)` 같은 단순한 예시로 시작한다. 청중에게 "이 값은 무슨 색인가?"라고 물은 뒤, "어떤 색공간에서의 값인가?"라는 질문을 추가한다. 이 질문 하나로 장 전체의 방향이 잡힌다.

### 2. 색값(Color Value)과 색공간(Color Space) 분리하기

색값은 숫자이고 색공간은 문맥이라는 점을 설명한다. 이때 "숫자만으로는 부족하고, 그 숫자를 해석하는 규칙이 필요하다"는 표현을 반복해서 잡아 준다.

### 3. 같은 RGB, 다른 색도 의미 예시

sRGB의 빨강과 Display P3의 빨강을 비교하는 방식으로 같은 RGB 값이 다른 측색적 색을 가리킬 수 있음을 설명한다. 여기서는 아직 수식보다 직관을 우선한다. 원색(primary) 위치가 다르면 같은 채널 조합도 다른 색을 만든다는 정도로 충분하다.

### 4. 장치 의존(Device-Dependent)과 장치 독립(Device-Independent) 연결하기

RGB는 특정 장치나 표준에 의존하는 표현이고, CIE XYZ 같은 공간은 색공간 변환의 공통 기준점으로 쓰인다고 설명한다. 이 부분에서 "RGB를 바로 RGB로 바꾸는 것이 아니라, 색의 의미를 해석한 뒤 다시 표현한다"는 핵심 메시지를 제시한다.

### 5. 세미나 지도 제시하기

마지막으로 1회차와 2회차의 역할을 나눈다. 1회차는 CIE xy, 색의 위치, 색공간 변환이고, 2회차는 밝기 축, 컬러 볼륨(color volume), 감마(Gamma), HDR, 톤매핑(tone mapping)이다. 이때 컬러 볼륨을 색의 구성요소처럼 말하지 않고, 재현 가능한 색과 밝기의 범위를 설명하는 개념으로 정리한다.

## 짧은 마무리 요약

색공간(Color Space)을 알아야 하는 이유는 RGB 숫자가 혼자서는 색을 완전히 말해 주지 않기 때문이다. 색값(color value)은 숫자이고, 색공간은 그 숫자를 색으로 해석하는 규칙이다. 같은 RGB 값이라도 sRGB, Display P3, Rec.2020 같은 기준에 따라 실제 색의 의미가 달라질 수 있다.

1회차에서는 CIE xy 색도도(CIE xy chromaticity diagram), 색의 위치, 색공간 변환(color space conversion)을 통해 "이 색의 색도 위치와 색공간상 의미는 무엇인가?"를 다룬다. 2회차에서는 밝기(brightness), 컬러 볼륨(color volume), 감마(Gamma), HDR, 톤매핑(tone mapping)을 통해 "그 색을 얼마나 밝게, 어떤 재현 조건에서 보여줄 수 있는가?"로 확장한다.

따라서 좋은 컬러 워크플로의 출발점은 단순히 RGB 값을 보는 것이 아니라, 그 값이 어떤 색공간과 신호 규칙 안에서 만들어졌는지 확인하는 것이다.
