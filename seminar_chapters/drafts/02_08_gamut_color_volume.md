# [Draft] 2회차 Chapter 8. Color Gamut과 Color Volume

## 학습 목표

이 장의 목표는 색역(Color Gamut)과 컬러 볼륨(Color Volume)을 분리해서 이해하는 것이다. 색역(gamut)은 보통 CIE xy 색도도(CIE xy chromaticity diagram) 같은 2차원 평면에서 색도(chromaticity)의 범위를 보여준다. 반면 컬러 볼륨(color volume)은 여기에 밝기(brightness) 또는 휘도(luminance) 축을 더해, 어떤 장치나 시스템이 색을 어느 밝기까지 재현할 수 있는지 설명한다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- 색역(Color Gamut)이 xy 평면에서 무엇을 보여주는가
- 컬러 볼륨(Color Volume)이 색역에 밝기 축을 더한다는 말의 의미는 무엇인가
- 같은 Rec.2020(Recommendation ITU-R BT.2020) 목표를 사용해도 실제 디스플레이(display)의 컬러 볼륨이 달라지는 이유는 무엇인가
- WCG(Wide Color Gamut)와 HDR(High Dynamic Range)이 왜 관련은 있지만 같은 개념은 아닌가

## 핵심 질문

- 색역(gamut)이 넓으면 항상 더 밝고 더 좋은 HDR인가?
- Rec.2020을 지원한다고 말하는 두 디스플레이는 같은 색과 밝기를 낼 수 있는가?
- CIE xy 색도도에서 삼각형이 같으면 실제 화면 재현도 같은가?
- 최대 휘도(peak luminance), 블랙 레벨(black level), 패널(panel) 특성은 컬러 볼륨에 어떤 영향을 주는가?
- WCG와 HDR은 왜 자주 함께 등장하지만 서로 다른 축의 개념인가?
- CIE Lab 3D 그림과 nits 기반 디스플레이 color volume은 왜 같은 것이 아닌가?

## 상세 설명

### 1. 색역(Color Gamut)은 색도 평면의 범위다

1회차에서 다룬 색역(gamut)은 보통 CIE xy 색도도 위의 범위로 설명한다. sRGB, Display P3, Rec.2020 같은 RGB 색공간(RGB color space)은 원색(color primaries)을 갖고, 이 원색을 xy 평면에 찍으면 삼각형이 만들어진다. 이 삼각형은 해당 색공간이 표현할 수 있는 색도(chromaticity)의 대략적인 범위를 보여준다.

예를 들어 Display P3는 sRGB보다 더 넓은 빨강과 초록 방향의 색도를 포함한다. Rec.2020은 그보다 더 넓은 원색을 정의한다. 그래서 xy 색도도 위에서 보면 다음처럼 말할 수 있다.

```text
sRGB gamut < Display P3 gamut < Rec.2020 gamut
```

하지만 이 비교는 색의 위치에 관한 이야기다. xy 색도도는 특정 색이 얼마나 밝게 재현되는지, 어두운 영역에서 채도를 얼마나 유지하는지, 하이라이트(highlight)에서 색이 얼마나 빨리 하얗게 날아가는지는 직접 보여주지 않는다.

따라서 색역을 볼 때는 먼저 이렇게 정리한다.

```text
gamut = 어떤 색도 좌표까지 표현할 수 있는가
```

### 2. 컬러 볼륨(Color Volume)은 밝기 축을 더한 재현 범위다

컬러 볼륨(color volume)은 색역(gamut)에 밝기(brightness) 또는 휘도(luminance) 축을 더해 생각하는 개념이다. 색도 평면의 삼각형을 바닥으로 두고, 위쪽으로 밝기 축을 세우면 3차원 재현 범위를 상상할 수 있다.

단순화하면 다음과 같다.

```text
2D gamut:
xy 평면에서 표현 가능한 색도 범위

3D color volume:
xy 색도 범위 + 각 색을 어느 밝기까지 표현할 수 있는가
```

같은 색도 좌표라도 밝게 표현할 수 있는지, 어둡게 표현할 때 색이 무너지지 않는지, 높은 휘도에서 채도가 유지되는지는 디스플레이의 물리적 성능과 톤매핑(tone mapping) 방식에 따라 달라진다. 그래서 컬러 볼륨은 색 자체의 구성요소라기보다, 특정 장치와 시스템의 재현 가능 범위를 설명하는 도구로 보는 편이 정확하다.

여기서 주의할 점은 CIE Lab(CIELAB)의 3D 그림을 디스플레이 color volume과 혼동하지 않는 것이다. CIE Lab의 `L*`는 기준 흰색(reference white)에 대한 상대 명도(lightness) 축이지 nits 또는 cd/m2 단위의 절대 휘도 축이 아니다. 따라서 Lab 공간은 색차와 지각적 거리 설명에는 유용하지만, 어떤 모니터가 실제로 100 nits, 600 nits, 1000 nits에서 어느 색을 유지할 수 있는지를 직접 보여주지는 못한다.

디스플레이의 color volume을 설명하려면 색도 범위와 함께 절대 휘도 축이 필요하다. 즉 기준이 되는 색공간의 원색, 장치의 실제 패널 gamut, peak luminance, black level, transfer function(PQ/HLG 등), tone mapping 조건을 함께 봐야 한다.

### 3. 같은 Rec.2020 목표라도 실제 볼륨은 달라진다

Rec.2020은 매우 넓은 원색을 정의한다. 하지만 "Rec.2020 신호를 받을 수 있다"는 말과 "Rec.2020 색역을 실제로 모두 표시할 수 있다"는 말은 다르다. 더 나아가 "Rec.2020 색역을 높은 밝기에서도 충분히 유지할 수 있다"는 말은 또 다른 문제다.

예를 들어 두 HDR 디스플레이가 모두 Rec.2020/PQ 신호를 입력으로 받을 수 있다고 가정하자.

```text
Display A: 최대 휘도 600 nits, 높은 블랙 레벨, P3에 가까운 실제 패널 gamut
Display B: 최대 휘도 1500 nits, 낮은 블랙 레벨, 더 넓은 실제 패널 gamut
```

두 장치는 같은 HDR10(High Dynamic Range 10) 신호를 받을 수 있지만 실제 컬러 볼륨은 다르다. Display B는 더 밝은 하이라이트를 낼 수 있고, 어두운 영역의 대비도 더 좋을 수 있으며, 고채도 색을 더 높은 휘도에서 유지할 가능성이 크다. Display A는 같은 신호를 표시하기 위해 더 강한 톤매핑을 적용하거나, 일부 색과 밝기를 압축해야 할 수 있다.

따라서 표준 신호의 목표 색공간과 실제 디스플레이의 재현 능력을 구분해야 한다.

```text
신호 표준: Rec.2020 primaries, PQ transfer, metadata 등
실제 장치: 패널 gamut, peak luminance, black level, tone mapping 성능
```

### 4. 최대 휘도, 블랙 레벨, 패널 특성이 볼륨을 바꾼다

컬러 볼륨을 결정하는 요소는 여러 가지다.

- 최대 휘도(peak luminance): 얼마나 밝은 하이라이트를 낼 수 있는가
- 블랙 레벨(black level): 검정을 얼마나 어둡게 표현할 수 있는가
- 명암비(contrast ratio): 밝은 부분과 어두운 부분의 차이를 얼마나 크게 낼 수 있는가
- 실제 패널 색역(panel gamut): 원색이 sRGB, P3, Rec.2020 중 어디까지 가까운가
- 색상별 휘도 유지 능력: 밝은 빨강, 밝은 초록, 밝은 파랑을 얼마나 채도 있게 낼 수 있는가
- 톤매핑(tone mapping): 장치가 감당할 수 없는 밝기와 색을 어떻게 압축하는가

특히 HDR에서는 단순히 흰색 하이라이트만 밝게 낼 수 있는지보다, 색이 있는 하이라이트를 얼마나 유지하는지도 중요하다. 어떤 디스플레이는 흰색은 매우 밝게 낼 수 있지만, 고채도 색에서는 휘도가 빠르게 줄어들 수 있다. 이 차이가 컬러 볼륨의 차이로 나타난다.

### 5. WCG와 HDR은 관련 있지만 같은 개념은 아니다

WCG(Wide Color Gamut)는 넓은 색역을 뜻한다. 보통 sRGB 또는 Rec.709보다 넓은 Display P3, Rec.2020 같은 색역을 말할 때 사용한다. HDR(High Dynamic Range)은 더 넓은 밝기 범위와 전송 함수(transfer function), 표시 조건을 다루는 개념이다.

둘은 자주 함께 등장한다. HDR 콘텐츠는 흔히 Rec.2020 컨테이너(container) 또는 P3 수준의 실제 색 사용과 함께 제작되고, 넓은 색역과 높은 밝기를 함께 활용하면 더 풍부한 화면을 만들 수 있다. 하지만 WCG와 HDR은 같은 말이 아니다.

```text
WCG: 더 넓은 색도 범위
HDR: 더 넓은 밝기 재현 범위
Color volume: 색도 범위와 밝기 범위를 함께 본 재현 범위
```

예를 들어 Display P3 이미지는 넓은 색역을 가질 수 있지만 SDR(Standard Dynamic Range)일 수 있다. 반대로 HDR 신호라도 실제 사용 색이 Rec.709 안에 머무를 수 있다. 실무에서는 파일이나 디스플레이를 볼 때 "WCG인가?", "HDR인가?", "실제 컬러 볼륨은 어느 정도인가?"를 따로 질문해야 한다.

## 용어 노트

### 색역(Color Gamut)

색역(gamut)은 특정 색공간(color space), 장치(device), 출력 조건이 표현할 수 있는 색의 범위다. 1회차에서는 주로 CIE xy 색도도(CIE xy chromaticity diagram) 위의 2차원 색도 범위로 설명했다.

### 컬러 볼륨(Color Volume)

컬러 볼륨(color volume)은 색역에 밝기 축을 더해, 어떤 색을 어느 밝기까지 재현할 수 있는지 나타내는 3차원 개념이다. 컬러의 구성요소라기보다 장치나 시스템의 재현 능력을 설명하는 개념이다.

### 최대 휘도(Peak Luminance)

최대 휘도(peak luminance)는 디스플레이가 낼 수 있는 가장 밝은 수준을 말한다. HDR에서는 nits 또는 cd/m2 단위로 자주 표현한다.

### 블랙 레벨(Black Level)

블랙 레벨(black level)은 디스플레이가 표현할 수 있는 가장 어두운 검정 수준이다. 블랙 레벨이 낮을수록 어두운 장면의 깊이와 명암 표현에 유리하다.

### WCG(Wide Color Gamut)

WCG(Wide Color Gamut)는 sRGB 또는 Rec.709보다 넓은 색역을 사용하는 것을 뜻한다. WCG는 색도 범위에 관한 개념이고, HDR은 밝기 범위에 관한 개념이다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `2D gamut`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - color gamut은 색도 평면의 범위라는 설명에 사용.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `3D color volume 후보`: [HDR color volume media search](https://commons.wikimedia.org/w/index.php?search=color+volume+HDR&title=Special:MediaSearch&type=image) - 밝기 축까지 포함하는 3D 표현 후보를 찾는 링크.
- `Lab 3D 공간`: [Lab color space](https://commons.wikimedia.org/wiki/File:Lab_color_space.svg) - 3차원 색 표현의 직관을 제공하는 보조 그림으로 사용하되, `L*`가 nits 축이 아니라는 주석을 반드시 함께 둔다.

## 실무 예시와 데모 아이디어

### 예시 1. 같은 Rec.2020 신호, 다른 디스플레이 결과

HDR10 테스트 영상을 두 디스플레이에서 재생한다. 두 장치가 모두 HDR10을 지원하더라도 하이라이트 밝기, 색의 채도 유지, 암부 표현이 다를 수 있음을 비교한다.

### 예시 2. xy 색역 비교와 실제 패널 gamut 비교

sRGB, Display P3, Rec.2020 삼각형을 xy 색도도 위에 겹쳐 보여준다. 그 다음 실제 소비자 디스플레이의 측정 gamut이 Rec.2020 전체가 아니라 P3 근처에 머무를 수 있음을 보여준다.

### 예시 3. 밝은 색 패치 비교

어두운 빨강, 중간 밝기 빨강, 매우 밝은 빨강 패치를 비교한다. 같은 색도 방향이라도 밝기가 올라가면 디스플레이에 따라 채도가 유지되거나 흰색에 가까워질 수 있음을 설명한다.

## 추천 진행 흐름

### 1. 1회차의 색역 개념 복습

CIE xy 색도도 위의 sRGB, Display P3, Rec.2020 삼각형을 다시 떠올리게 한다. 여기서 색역은 "색도 위치의 범위"였다는 점을 확인한다.

### 2. 밝기 축 추가하기

xy 평면에 수직으로 밝기 축을 세우는 그림을 상상하게 한다. 이 순간 2D gamut이 3D color volume으로 확장된다고 설명한다.

### 3. 같은 표준, 다른 실제 장치

Rec.2020 신호를 받을 수 있는 두 디스플레이가 왜 같은 결과를 내지 않는지 설명한다. 최대 휘도, 블랙 레벨, 실제 패널 gamut, 톤매핑 차이를 차례로 연결한다.

### 4. WCG와 HDR 분리하기

WCG는 색도 범위, HDR은 밝기 범위라는 구분을 명확히 한다. 둘이 함께 쓰일 때 컬러 볼륨 관점이 필요해진다고 정리한다.

## 짧은 마무리 요약

색역(Color Gamut)은 xy 평면에서 표현 가능한 색도 범위를 보여준다. 컬러 볼륨(Color Volume)은 여기에 밝기 축을 더해, 색을 어느 밝기까지 재현할 수 있는지 설명한다. 같은 Rec.2020 목표를 사용하더라도 실제 디스플레이의 최대 휘도, 블랙 레벨, 패널 특성, 톤매핑 방식에 따라 컬러 볼륨은 달라진다.

WCG(Wide Color Gamut)와 HDR(High Dynamic Range)은 관련 있지만 같은 개념이 아니다. WCG는 더 넓은 색도 범위이고, HDR은 더 넓은 밝기 재현 범위다. HDR 파이프라인에서는 두 축을 함께 보아야 실제 표시 결과를 이해할 수 있다.
