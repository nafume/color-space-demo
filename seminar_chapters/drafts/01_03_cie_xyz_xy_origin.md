# [Draft] 1회차 Chapter 3. CIE XYZ와 CIE xy 색도도는 어떻게 만들어졌나

## 학습 목표

이 장의 목표는 CIE XYZ와 CIE xy 색도도(CIE xy chromaticity diagram)를 갑자기 등장한 추상 좌표계가 아니라, 인간 관찰자의 색상 매칭(color matching) 데이터를 표준화한 결과로 이해하는 것이다. 특히 1924 광효율 함수(luminous efficiency function) `V(lambda)`, 라이트-길드(Wright-Guild) 색상 매칭 실험, CIE RGB 색상 일치 함수(CIE RGB color matching functions), 음수 RGB 값 문제, CIE XYZ의 도입, 그리고 XYZ에서 xy로 색도(chromaticity)를 분리하는 흐름을 연결한다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- CIE 표준 관찰자(standard observer)가 왜 색상 매칭 실험에서 출발하는가
- CIE RGB 색상 일치 함수에서 음수 값이 왜 나타나는가
- CIE XYZ가 CIE RGB를 대체한다기보다 계산하기 좋은 표준 좌표로 재정의한 이유는 무엇인가
- CIE XYZ의 `Y`가 초록 채널(green channel)이 아니라 상대 휘도(relative luminance)에 대응한다는 점
- CIE xy의 소문자 `y`가 휘도(luminance)가 아니라 색도 좌표(chromaticity coordinate)라는 점
- XYZ 값에서 xy 좌표를 어떻게 계산하고, 이 과정에서 무엇이 사라지는가

## 핵심 질문

- 1924 광효율 함수 `V(lambda)`는 색상(color)을 정의한 함수인가, 밝기 민감도를 정의한 함수인가?
- 라이트-길드 색상 매칭 실험은 무엇을 측정했는가?
- 왜 어떤 색은 선택한 RGB 기본 빛(primary lights)의 양을 모두 양수로 더해서 맞출 수 없었는가?
- 음수 RGB 값은 물리적으로 "음의 빛"을 뜻하는가, 아니면 색상 매칭 방정식의 표현인가?
- CIE XYZ에서 `Y`는 왜 상대 휘도(relative luminance)와 연결되도록 설계되었는가?
- CIE xy 색도도는 색의 어떤 정보를 보여주고, 어떤 정보를 버리는가?

## 상세 설명

### 1. 1924 광효율 함수 `V(lambda)`: 밝기 민감도의 표준화

CIE XYZ로 가기 전에 먼저 1924년에 정의된 광효율 함수(luminous efficiency function) `V(lambda)`를 봐야 한다. `V(lambda)`는 인간 눈이 밝은 환경, 즉 명소시(photopic vision) 조건에서 파장별 빛을 얼마나 밝게 느끼는지 나타내는 표준 함수다. 대략 555 nm 근처에서 가장 민감하고, 그보다 짧거나 긴 파장에서는 같은 물리적 에너지라도 덜 밝게 느껴진다.

여기서 중요한 점은 `V(lambda)`가 색상(hue)을 직접 정의하는 함수가 아니라는 것이다. 이 함수는 파장별 밝기 민감도, 더 정확히는 휘도(luminance)를 계산하기 위한 시각적 가중치에 가깝다. 뒤에서 CIE XYZ의 `Y`가 상대 휘도(relative luminance)에 대응하도록 설계될 때 이 `V(lambda)`와의 연결이 중요해진다.

즉 출발점은 다음처럼 볼 수 있다.

```text
파장별 빛의 에너지
-> 인간 눈의 밝기 민감도로 가중
-> 휘도(luminance) 계산의 표준 기반
```

이 기반 위에 색상 매칭(color matching) 실험 결과를 더하면, 밝기뿐 아니라 색도(chromaticity)를 표준 좌표로 다룰 수 있는 길이 열린다.

### 2. 라이트-길드 색상 매칭 실험

1920년대 말 William David Wright와 John Guild는 독립적으로 색상 매칭 실험을 수행했다. 이 실험의 기본 장면은 Chapter 2에서 본 색상 매칭 아이디어와 같다. 관찰자에게 기준 색(test color)을 보여 주고, 세 기본 빛(primary lights)의 양을 조절해 같은 색으로 보이게 맞춘다.

실험에서 관찰자는 스펙트럼(spectrum)의 각 파장에 해당하는 단색광(monochromatic light)을 세 기본 빛의 조합으로 맞추었다. 그 결과 특정 파장의 빛을 맞추기 위해 빨강, 초록, 파랑 기본 빛이 각각 얼마나 필요한지에 대한 데이터가 얻어졌다.

이 데이터는 개인의 생리적 원추세포(cone cells) 반응을 직접 측정한 것이 아니라, 실제 관찰자가 색을 같다고 판단한 매칭 행동을 표준화하기 위한 자료다. 따라서 뒤에서 나오는 색상 일치 함수(color matching functions)는 원추세포 응답 곡선 그 자체가 아니라, 표준 관찰자(standard observer)의 색상 매칭 특성을 나타내는 함수로 이해해야 한다.

### 3. CIE RGB 색상 일치 함수와 음수 RGB 문제

라이트-길드 실험 결과는 1931년 CIE 표준 관찰자(CIE 1931 standard observer)를 만드는 데 중요한 기반이 되었고, 먼저 CIE RGB 색상 일치 함수(CIE RGB color matching functions)로 정리되었다. 각 파장의 빛을 CIE가 정한 세 기본 빛의 조합으로 맞추려면 R, G, B가 얼마나 필요한지를 함수로 나타낸 것이다.

문제는 모든 파장색을 세 기본 빛의 양수 조합만으로 맞출 수 없었다는 점이다. 어떤 기준 색은 비교 쪽에 R, G, B를 아무리 더해도 맞지 않고, 기준 색 쪽에 기본 빛 하나를 더해야 균형이 맞았다. 수학적으로는 이 상황을 해당 기본 빛의 값이 음수인 것처럼 기록할 수 있다.

예를 들어 다음 두 표현은 색상 매칭 관점에서 같은 의미를 가질 수 있다.

```text
기준 색 = R + G + B 조합
기준 색 + R 일부 = G + B 조합
```

두 번째 식을 정리하면 기준 색을 표현하는 R 값이 음수가 된다. 여기서 음수 RGB는 실제로 음의 빛을 만든다는 뜻이 아니다. 선택한 기본 빛으로 색상 매칭 방정식을 세웠을 때, 어떤 색이 그 세 원색의 양수 혼합 범위 밖에 있음을 나타내는 수학적 표현이다.

이 음수 값은 계산과 직관 모두에서 불편했다. 색을 표준화하려면 가능한 한 모든 가시 색을 양수 좌표로 표현하고 싶고, 밝기 계산과도 잘 연결되는 좌표계가 필요했다.

#### 참고사항: CIE RGB의 파란 원색은 왜 435.8 nm였는가

CIE RGB에서 사용하는 세 기본 빛은 현대 디스플레이의 R, G, B 서브픽셀을 정한 것이 아니라, 색상 매칭 실험과 표준 관찰자 계산을 위한 기준광이었다. 대표적으로 CIE RGB 원색은 대략 `700.0 nm`, `546.1 nm`, `435.8 nm`의 단색광으로 설명된다.

여기서 `435.8 nm`는 이름상 파란 원색(blue primary)으로 부르지만, 스펙트럼상으로는 우리가 일상적으로 떠올리는 순수 파랑보다 보라/청자색(violet-blue)에 가까워 보일 수 있다. 이 파장이 쓰인 이유는 현대 디스플레이의 이상적인 파랑을 정하려는 목적이 아니라, 당시 실험에서 안정적으로 만들 수 있는 수은 방전선 계열의 단색 기준광을 사용했기 때문이다.

따라서 CIE RGB의 "RGB 원색"은 역사적 측정 좌표계의 기준광이고, sRGB나 Display P3 같은 현대 RGB 색공간의 원색은 디스플레이와 이미지 재현을 위해 정의된 장치/시스템 원색이다. 두 경우 모두 RGB라는 이름을 쓰지만 목적과 의미가 다르다.

### 4. CIE XYZ의 등장: 계산하기 좋은 가상 원색 좌표

CIE XYZ는 이런 문제를 해결하기 위해 CIE RGB 색상 일치 함수를 선형 변환(linear transformation)해 만든 장치 독립 색공간(device-independent color space)이다. 여기서 X, Y, Z는 실제 디스플레이의 빨강, 초록, 파랑 원색이 아니다. 색 계산을 편하게 만들기 위해 정의한 가상 원색(imaginary primaries)에 기반한 좌표다.

CIE XYZ의 중요한 설계 의도는 다음과 같다.

- 대부분의 가시 색을 양수 X, Y, Z 값으로 표현할 수 있게 한다
- `Y` 값이 1924 광효율 함수 `V(lambda)`와 연결되어 상대 휘도(relative luminance)에 대응하게 한다
- 장치와 무관한 공통 좌표로 색공간 변환(color space conversion)에 사용할 수 있게 한다

특히 `Y`에 대한 오해를 조심해야 한다. CIE XYZ의 `Y`는 RGB의 G 채널, 즉 초록 채널(green channel)이 아니다. 물론 인간 눈이 중간 파장 영역에 밝기 민감도가 높기 때문에 `Y` 함수가 초록 영역과 강하게 관련되어 보이지만, 의미상 `Y`는 상대 휘도(relative luminance)를 담는 축이다.

따라서 다음처럼 말하는 것이 정확하다.

```text
부정확: XYZ의 Y는 초록 성분이다.
정확: XYZ의 Y는 표준 관찰자의 상대 휘도에 대응하도록 설계된 값이다.
```

### 5. XYZ에서 xy로: 밝기 정보를 분리한 색도 좌표

CIE XYZ는 색을 세 값으로 표현한다. 그런데 색의 밝기와 무관하게 "어떤 색도 위치인가"를 보고 싶을 때가 있다. 이때 XYZ를 정규화(normalize)해서 CIE xy 색도 좌표(chromaticity coordinates)를 만든다.

계산식은 다음과 같다.

```text
x = X / (X + Y + Z)
y = Y / (X + Y + Z)
z = Z / (X + Y + Z)

x + y + z = 1
```

세 값의 합이 1이므로 보통 `x`와 `y`만 표시하면 `z`는 `1 - x - y`로 알 수 있다. 이렇게 만든 평면이 CIE xy 색도도(CIE xy chromaticity diagram)다.

여기서도 용어를 조심해야 한다. 소문자 `y`는 CIE xy 색도도의 세로 좌표이며 색도 좌표(chromaticity coordinate)다. 대문자 `Y`처럼 상대 휘도(relative luminance)를 의미하지 않는다. `x`, `y`를 계산하는 과정에서 전체 크기 정보가 정규화되기 때문에, 동일한 xy 좌표를 가진 색도라도 `Y` 값이 다르면 더 밝거나 어두운 색 자극이 될 수 있다.

정리하면 다음과 같다.

```text
XYZ: 색도와 상대 휘도 정보를 함께 가진 3값 표현
xy: XYZ를 정규화해 밝기 크기를 제거한 색도 좌표
Y: 상대 휘도(relative luminance)에 대응
y: CIE xy 색도도의 세로 색도 좌표
```

## 용어 노트

### 광효율 함수(Luminous Efficiency Function) `V(lambda)`

명소시(photopic vision) 조건에서 인간 눈의 파장별 밝기 민감도를 나타내는 표준 함수다. 색상(hue)을 직접 정의하는 함수가 아니라 휘도(luminance) 계산의 기반이 된다.

### 색상 매칭(Color Matching)

기준 색과 비교 색이 관찰자에게 같아 보이도록 기본 빛(primary lights)의 양을 조절하는 실험이다. CIE 표준 관찰자(standard observer)와 색상 일치 함수(color matching functions)의 출발점이다.

### CIE RGB 색상 일치 함수(CIE RGB Color Matching Functions)

각 파장의 빛을 CIE RGB 기본 빛의 조합으로 맞추기 위해 필요한 R, G, B 양을 나타내는 함수다. 선택한 기본 빛의 한계 때문에 일부 구간에서 음수 값이 나타난다.

### CIE XYZ

CIE RGB를 선형 변환해 만든 장치 독립 색공간(device-independent color space)이다. X, Y, Z는 실제 물리적 RGB 원색이 아니라 색 계산을 위한 가상 축이며, `Y`는 상대 휘도(relative luminance)에 대응하도록 설계되었다.

### 상대 휘도(Relative Luminance)

기준 흰색에 대해 상대적인 휘도(luminance)를 나타내는 값이다. CIE XYZ의 `Y`는 색공간 변환과 표시 계산에서 상대 휘도 역할을 한다. 단, 이것은 RGB의 초록 채널(green channel)이 아니다.

### 색도 좌표(Chromaticity Coordinate)

XYZ의 전체 크기를 정규화해 색의 밝기 크기를 제거한 좌표다. CIE xy에서 `x`와 `y`는 색도 좌표이며, 소문자 `y`는 휘도(luminance)가 아니다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `1924 광효율 함수`: [CIE 1931 luminosity function](https://commons.wikimedia.org/wiki/File:CIE_1931_Luminosity.svg) - V(lambda)가 색상(hue)이 아니라 밝기 민감도 기반이라는 설명에 사용.
  ![CIE 1931 luminosity function](../assets/images/CIE_1931_Luminosity.svg)
- `CIE RGB 색상 일치 함수`: [CIE 1931 RGB colour matching functions](https://commons.wikimedia.org/wiki/File:CIE_1931_RGB_colour_matching_functions.svg) - 음수 RGB 값이 나타나는 이유를 설명할 때 핵심 그림.
- `CIE XYZ 색상 일치 함수`: [CIE 1931 XYZ color matching functions](https://commons.wikimedia.org/wiki/File:CIE_1931_XYZ_Color_Matching_Functions.svg) - XYZ가 계산하기 좋은 양수 기반 좌표로 재정의되는 흐름에 사용.
- `CIE xy 색도도`: [1931 chromaticity diagram](https://commons.wikimedia.org/wiki/File:1931_chromaticity_diagram.svg) - XYZ에서 xy로 정규화한 결과와 spectral locus를 설명할 때 사용.
  ![1931 chromaticity diagram](../assets/images/1931_chromaticity_diagram.thumb.png)

## 실무 예시와 데모 아이디어

### 예시 1. 같은 xy, 다른 Y

같은 CIE xy 좌표를 가진 두 색 패치를 만들고 하나는 `Y=0.2`, 다른 하나는 `Y=0.8`로 둔다. 두 패치는 같은 색도(chromaticity)를 갖지만 밝기는 다르다. 이 예시는 "CIE xy는 밝기 정보를 직접 보여주지 않는다"는 점을 설명하기 좋다.

### 예시 2. XYZ에서 xy 계산하기

간단한 XYZ 값 하나를 골라 직접 계산한다.

```text
X = 0.4124, Y = 0.2126, Z = 0.0193
sum = X + Y + Z
x = X / sum
y = Y / sum
```

이때 대문자 `Y`는 상대 휘도이고, 계산 결과의 소문자 `y`는 색도 좌표라는 점을 다시 강조한다.

### 예시 3. 음수 RGB의 직관

CIE RGB 색상 일치 함수 그래프에서 일부 함수가 0 아래로 내려가는 구간을 보여준다. "음의 빛"을 쏜 것이 아니라 기준 색 쪽에 기본 빛을 더해 매칭한 결과를 방정식으로 옮긴 것이라고 설명한다.

### 예시 4. CIE xy 말발굽 모양 보기

CIE xy 색도도의 spectral locus를 보여주고, 바깥 경계가 단색광(monochromatic light)의 색도 위치를 나타낸다고 설명한다. 이 장에서는 아직 색공간 삼각형 비교보다 "XYZ를 정규화해 만든 지도"라는 출생 과정을 강조한다.

## 추천 진행 흐름

### 1. 밝기 민감도에서 시작하기

먼저 1924 `V(lambda)`를 소개한다. 색상 전체가 아니라 인간이 파장별 빛을 얼마나 밝게 느끼는지 표준화한 함수라고 설명한다.

### 2. 색상 매칭 실험으로 넘어가기

라이트-길드 실험의 장면을 그린다. 기준 파장색을 세 기본 빛의 조합으로 맞추고, 그 결과가 색상 일치 함수(color matching functions)가 된다는 흐름을 잡는다.

### 3. 음수 RGB 문제를 직관적으로 설명하기

일부 색은 선택한 RGB 기본 빛의 양수 혼합만으로 맞출 수 없어서 음수 값이 등장한다고 설명한다. 이때 음수 값은 물리적 음의 빛이 아니라 방정식 정리의 결과라고 명확히 말한다.

### 4. CIE XYZ의 설계 의도 제시하기

CIE XYZ는 실제 RGB 장치가 아니라 가상 원색 좌표이며, 계산상 양수 좌표와 상대 휘도 `Y`를 얻기 위해 만들어졌다고 설명한다.

### 5. XYZ에서 xy로 정규화하기

마지막으로 `x = X/(X+Y+Z)`, `y = Y/(X+Y+Z)`를 보여준다. `Y`와 `y`를 칠판이나 슬라이드에서 대문자/소문자로 크게 구분해, 상대 휘도와 색도 좌표가 다르다는 점을 각인시킨다.

## 짧은 마무리 요약

CIE XYZ와 CIE xy 색도도(CIE xy chromaticity diagram)는 인간 시각을 임의로 단순화한 그림이 아니라, 색상 매칭(color matching) 실험과 밝기 민감도 표준을 바탕으로 만들어진 측색(colorimetry) 체계다. CIE RGB 색상 일치 함수에는 선택한 기본 빛의 한계 때문에 음수 값이 나타났고, CIE XYZ는 이를 계산하기 좋은 장치 독립 좌표로 바꾸었다.

가장 중요한 구분은 대문자 `Y`와 소문자 `y`다. CIE XYZ의 `Y`는 상대 휘도(relative luminance)에 대응하지만, CIE xy의 `y`는 색도 좌표(chromaticity coordinate)일 뿐 휘도가 아니다. CIE xy 색도도는 색의 위치를 보여주는 강력한 지도이지만, 밝기 정보는 별도로 보아야 한다.
