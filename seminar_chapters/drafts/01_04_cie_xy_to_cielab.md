# [Draft] 1회차 Chapter 4. CIE xy 색도도에서 CIE Lab까지

## 학습 목표

이 장의 목표는 CIE xy 색도도(CIE xy chromaticity diagram)가 왜 유용한지와 동시에 왜 충분하지 않은지를 이해하고, 그 한계가 CIE Lab(CIELAB) 같은 지각적으로 더 균일한 색공간(perceptually uniform color space)의 필요성으로 이어지는 과정을 설명하는 것이다. 특히 휘도(luminance), 명도(lightness), 밝기(brightness)를 구분하고, CIE Lab의 `L*`, `a*`, `b*`, 색차(Delta E), 그리고 XYZ와 Lab의 관계를 잡는다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- CIE xy 색도도가 색도(chromaticity), 원색(color primaries), 화이트 포인트(white point), 색역(gamut)을 읽는 데 왜 유용한가
- CIE xy 평면에서의 거리가 사람이 느끼는 색 차이와 잘 일치하지 않는 이유는 무엇인가
- CIE Lab의 `L*`, `a*`, `b*`가 각각 어떤 지각적 축을 표현하려는가
- CIE Lab의 `a*`, `b*` 축이 반대색 이론(opponent color theory)과 어떻게 연결되는가
- Delta E(Delta E)가 색차(color difference)를 수치화하는 기본 아이디어라는 점
- CIE Lab이 CIE XYZ와 기준 흰색(reference white)을 바탕으로 계산된다는 점
- luminance, lightness, brightness를 왜 구분해야 하는가
- CIE Lab의 `L*`가 nits 또는 cd/m2 같은 절대 휘도 단위가 아니라는 점

## 핵심 질문

- CIE xy 색도도에서 가까운 두 점은 항상 사람에게 비슷하게 보이는가?
- 색도(chromaticity)만 알면 색의 밝고 어두운 느낌까지 알 수 있는가?
- 휘도(luminance), 명도(lightness), 밝기(brightness)는 같은 말인가?
- CIE Lab의 `L*`는 CIE XYZ의 `Y`와 같은 값인가?
- CIE Lab으로 디스플레이의 HDR dynamic range 또는 nits 기반 밝기 볼륨을 직접 표현할 수 있는가?
- `a*`와 `b*`는 왜 초록-빨강(green-red), 파랑-노랑(blue-yellow) 반대색(opponent color) 축으로 잡혔는가?
- Delta E는 어떤 상황에서 유용하고, 어떤 한계를 갖는가?

## 상세 설명

### 1. CIE xy 색도도의 강점

CIE xy 색도도(CIE xy chromaticity diagram)는 색공간을 처음 이해할 때 매우 강력한 지도다. XYZ에서 밝기 크기를 정규화해 색도(chromaticity)만 평면에 표시하므로, 서로 다른 색공간(color space)의 원색(color primaries), 화이트 포인트(white point), 색역(gamut)을 한눈에 비교할 수 있다.

예를 들어 sRGB, Display P3, Adobe RGB, Rec.2020의 R, G, B 원색을 xy 좌표로 찍으면 삼각형이 만들어진다. 이 삼각형은 해당 RGB 색공간이 색도 평면에서 표현할 수 있는 대략적인 범위를 보여준다. D65 같은 화이트 포인트도 xy 위에 하나의 기준점으로 표시할 수 있다.

그래서 CIE xy는 다음 질문에 답하기 좋다.

```text
이 색공간의 빨강, 초록, 파랑 원색은 어디에 있는가?
화이트 포인트는 어디인가?
이 색공간의 색역은 다른 색공간보다 넓은가, 좁은가?
특정 색도 좌표가 어떤 색역 안에 들어오는가?
```

다만 이 지도는 "색도 지도"다. 색의 모든 지각적 성질을 균일하게 보여주는 지도는 아니다.

### 2. CIE xy 색도도의 한계: 거리와 밝기

CIE xy 색도도에서 가장 조심해야 할 한계는 두 가지다.

첫째, xy 평면에서의 기하학적 거리와 사람이 느끼는 색 차이(perceived color difference)가 일정하게 대응하지 않는다. 어떤 영역에서는 xy 좌표가 조금만 달라져도 큰 색 차이로 느껴지고, 다른 영역에서는 좌표 차이가 상대적으로 커도 비슷하게 느껴질 수 있다. 즉 CIE xy는 지각적으로 균일한 공간(perceptually uniform space)이 아니다.

둘째, xy 좌표만으로는 밝기 정보를 알 수 없다. 같은 xy 좌표를 가진 색도라도 CIE XYZ의 `Y` 값이 다르면 물리적 휘도(luminance)가 다르고, 사람이 느끼는 밝고 어두운 인상도 달라질 수 있다. Chapter 3에서 보았듯 소문자 `y`는 색도 좌표(chromaticity coordinate)이지 휘도(luminance)가 아니다.

따라서 CIE xy는 색역과 원색을 읽는 데 좋지만, "두 색이 사람 눈에 얼마나 다르게 보이는가" 또는 "밝고 어두운 느낌까지 포함한 색차가 얼마인가"를 직접 계산하기에는 부족하다. 이 한계가 CIE Lab 같은 공간의 필요성으로 이어진다.

### 3. 지각적 균일성(Perceptual Uniformity)의 동기

색을 다루는 실무에서는 색공간의 지도만으로 충분하지 않은 경우가 많다. 인쇄물의 색이 기준 색과 얼마나 다른지, 디스플레이 보정(calibration) 후 색 오차가 허용 범위 안에 있는지, 두 색상 샘플이 관찰자에게 구분 가능한지 같은 질문에는 "색차(color difference)"가 필요하다.

이때 이상적인 색공간은 좌표 거리와 지각적 차이가 어느 정도 비슷하게 대응해야 한다. 즉 색공간에서 같은 거리만큼 떨어진 두 색은 사람에게도 비슷한 정도로 달라 보이면 좋다. 이런 성질을 지각적 균일성(perceptual uniformity)이라고 부른다.

CIE Lab(CIELAB)은 이런 필요에서 만들어진 대표적인 장치 독립 색공간(device-independent color space)이다. 완벽하게 균일한 공간은 아니지만, CIE xy나 XYZ의 단순 거리보다 지각적 색차를 다루기 훨씬 좋은 기반을 제공한다.

### 4. CIE Lab의 기본 아이디어: `L*`, `a*`, `b*`

CIE Lab은 색을 세 축으로 표현한다.

- `L*`: 명도(lightness) 축
- `a*`: 초록-빨강(green-red) 축
- `b*`: 파랑-노랑(blue-yellow) 축

`L*`는 색이 얼마나 밝게 느껴지는지에 대한 명도(lightness) 축이다. 여기서 명도는 물리적 휘도(luminance)와 같지 않다. 휘도는 측색적 물리량에 가깝고, 명도는 기준 흰색(reference white)에 대한 상대적 지각 척도다. CIE Lab의 `L*`는 CIE XYZ의 `Y`를 기준 흰색의 `Yn`과 비교하고 비선형 함수로 변환해 계산한다.

따라서 CIE Lab에는 nits 또는 cd/m2 같은 절대 휘도 단위가 직접 들어 있지 않다. 같은 `L* = 50`이라도 기준 흰색이 100 nits인 SDR 표시 조건에서는 약 18 nits 근처의 상대 명도로 해석될 수 있고, 기준 흰색이나 표시 조건이 달라지면 실제 물리 휘도도 달라진다. 즉 `L*`는 "이 관찰 조건의 흰색에 비해 얼마나 밝게 느껴지는가"를 나타내는 값이지, "이 색이 실제로 몇 nits인가"를 말하는 값이 아니다.

이 점 때문에 CIE Lab의 3D 모양을 디스플레이의 HDR color volume처럼 해석하면 안 된다. Lab은 색차와 명도 차이를 설명하기 좋은 지각적 좌표계이고, 모니터가 실제로 어느 색을 몇 nits까지 낼 수 있는지를 보려면 xyY, 절대 휘도 스케일을 가진 XYZ의 `Y`, 또는 HDR 전송 함수(PQ/HLG)와 장치의 peak luminance를 함께 사용해야 한다.

`a*`는 대략 초록에서 빨강 방향의 반대색 축(opponent axis)을 나타낸다. `a*`가 양수이면 빨강 쪽, 음수이면 초록 쪽 성향을 갖는다. `b*`는 파랑에서 노랑 방향의 축이다. `b*`가 양수이면 노랑 쪽, 음수이면 파랑 쪽 성향을 갖는다.

이 두 축이 이렇게 설정된 배경에는 반대색 이론(opponent color theory)이 있다. 인간 시각은 원추세포(cone cells)의 L, M, S 신호를 받은 뒤, 그 신호를 단순한 RGB 채널처럼 따로 유지하지 않고 서로 비교하는 방식으로 색감을 만든다고 볼 수 있다. 밝고 어두운 느낌은 주로 L과 M 신호의 합과 연결되고, 색상 성향은 대략 빨강-초록(red-green), 노랑-파랑(yellow-blue)처럼 서로 반대되는 축으로 정리된다.

그래서 CIE Lab의 `a*`, `b*`는 장치의 빨강, 초록, 파랑 원색을 직접 나타내는 축이 아니라, 사람이 색을 구분할 때 중요한 반대색 방향을 좌표화한 축으로 이해하는 편이 좋다. 직관적으로는 다음처럼 설명할 수 있다.

```text
L*: 밝고 어두운 명도(lightness) 방향
a*: 초록 <-> 빨강 성향
b*: 파랑 <-> 노랑 성향
```

다만 CIE Lab의 `a*`, `b*`가 생리학적 반대색 신경 채널을 그대로 측정한 값이라는 뜻은 아니다. CIE Lab은 CIE XYZ와 기준 흰색(reference white)을 수학적으로 변환해 만든 색공간이며, 그 축 배치가 인간의 반대색 지각 구조와 잘 맞도록 설계된 것이다.

중요한 점은 `a*`, `b*`가 RGB 채널이 아니라는 것이다. CIE Lab은 디스플레이의 R, G, B 발광량을 나타내는 공간이 아니라, 인간 지각에 더 가까운 방식으로 색을 배치하려는 장치 독립 색공간이다.

### 5. CIE XYZ와 CIE Lab의 관계

CIE Lab은 독립적으로 하늘에서 떨어진 좌표계가 아니다. 보통 CIE XYZ 값과 기준 흰색(reference white)을 바탕으로 계산된다. 개념적으로는 다음 흐름이다.

```text
색 자극의 XYZ
기준 흰색의 XYZ, 보통 Xn, Yn, Zn
-> 기준 흰색에 대한 상대값 계산
-> 비선형 함수 적용
-> L*, a*, b*
```

이 때문에 같은 XYZ 값이라도 어떤 기준 흰색을 사용하느냐에 따라 Lab 값이 달라질 수 있다. ICC 프로파일(ICC Profile) 기반 워크플로에서는 PCS(Profile Connection Space)가 D50 기준을 사용하기 때문에, D65 기반 RGB 색공간에서 온 색을 다룰 때 화이트 포인트 적응(chromatic adaptation)이 함께 등장한다.

단순화하면, CIE XYZ는 측색적 기준 좌표이고 CIE Lab은 그 XYZ를 사람의 색차 판단에 더 맞게 변형한 공간이다.

```text
CIE XYZ: 색 계산의 장치 독립 기준
CIE Lab: 색차와 지각적 비교를 더 쉽게 하기 위한 장치 독립 공간
```

### 6. Delta E: 색차를 숫자로 말하기

Delta E(Delta E, `Delta E*`)는 CIE Lab 같은 공간에서 두 색의 차이를 수치화하는 개념이다. 가장 단순한 CIE76 방식은 두 Lab 좌표 사이의 유클리드 거리(Euclidean distance)를 계산한다.

```text
Delta E*ab = sqrt((Delta L*)^2 + (Delta a*)^2 + (Delta b*)^2)
```

이 값이 작을수록 두 색은 비슷하고, 클수록 더 다르게 보인다고 해석한다. 실제 산업 현장에서는 CIE94, CIEDE2000 같은 개선된 색차 공식도 많이 사용한다. CIE Lab 자체가 완벽하게 균일하지 않기 때문에, 사람의 시각 민감도 차이를 더 잘 반영하려고 보정한 공식들이다.

Delta E의 핵심은 "색 차이를 감이 아니라 숫자로 비교할 수 있게 한다"는 점이다. 다만 Delta E 값의 해석은 관찰 조건, 재료, 표준, 허용 오차 기준에 따라 달라질 수 있으므로, 숫자 하나만 절대적으로 해석하면 안 된다.

### 7. luminance, lightness, brightness 구분하기

이 장에서 반드시 구분해야 할 세 단어가 있다.

휘도(luminance)는 물리적/측색적 양이다. 빛이 표준 관찰자에게 얼마나 밝게 기여하는지를 나타내며, CIE XYZ의 `Y`와 연결된다.

명도(lightness)는 기준 흰색에 대한 상대적인 밝고 어두운 지각 척도다. CIE Lab의 `L*`가 대표적이다. `L*`는 `Y`에서 계산되지만 `Y`와 같은 값은 아니다.

밝기(brightness)는 관찰자가 주관적으로 느끼는 밝음의 정도다. 주변 조명, 적응 상태, 화면 크기, 배경, 관찰 조건의 영향을 받는다. 세미나 2회차에서 HDR과 톤매핑(tone mapping)을 다룰 때 더 중요해진다.

## 용어 노트

### 색도(Chromaticity)

색도(chromaticity)는 밝기 크기를 분리하고 색의 성질을 나타낸 좌표다. CIE xy의 `x`, `y`가 대표적인 색도 좌표이며, 소문자 `y`는 휘도(luminance)가 아니다.

### 지각적 균일성(Perceptual Uniformity)

색공간의 좌표 거리와 사람이 느끼는 색 차이가 비슷하게 대응하는 성질이다. CIE Lab은 완벽하지는 않지만 CIE xy보다 색차 계산에 더 적합하도록 설계되었다.

### 휘도(Luminance)

표준 관찰자의 밝기 민감도를 반영한 측색적 물리량이다. CIE XYZ의 `Y`는 상대 휘도(relative luminance)에 대응한다.

### 명도(Lightness)

기준 흰색(reference white)에 대한 상대적 지각 척도다. CIE Lab의 `L*`는 명도 축이며, 물리적 휘도 `Y`와 동일한 값이 아니다.

### 밝기(Brightness)

관찰자가 주관적으로 느끼는 밝음이다. 관찰 환경과 적응 상태에 크게 영향을 받으며, HDR(High Dynamic Range)과 톤매핑(tone mapping)을 이해할 때 중요하다.

### CIE Lab(CIELAB)

CIE XYZ와 기준 흰색을 바탕으로 계산되는 장치 독립 색공간(device-independent color space)이다. `L*`, `a*`, `b*` 축을 사용해 색차(color difference)를 다루기 쉽게 만든다. `L*`는 상대 명도 축이므로, CIE Lab 자체는 nits 기반 절대 휘도나 디스플레이 dynamic range를 직접 표현하지 않는다.

### 반대색 이론(Opponent Color Theory)

인간 시각이 원추세포 신호를 이후 단계에서 서로 비교해 빨강-초록(red-green), 노랑-파랑(yellow-blue), 밝음-어두움(light-dark) 같은 반대 방향의 감각 축으로 처리한다는 이론이다. CIE Lab의 `a*`, `b*` 축은 이 반대색 지각 구조를 반영해 초록-빨강, 파랑-노랑 방향으로 설정되어 있다.

### Delta E

두 색의 차이를 하나의 숫자로 표현하는 색차(color difference) 개념이다. CIE76, CIE94, CIEDE2000 등 여러 공식이 있으며, 용도와 표준에 따라 선택한다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `xy의 한계`: [1931 chromaticity diagram](https://commons.wikimedia.org/wiki/File:1931_chromaticity_diagram.svg) - xy 색도도는 밝기와 지각적 균일성을 직접 보여주지 못한다는 설명의 출발점.
  ![1931 chromaticity diagram](../assets/images/1931_chromaticity_diagram.thumb.png)
- `CIE Lab 구조`: [The principle of the CIELAB colour space](https://commons.wikimedia.org/wiki/File:The_principle_of_the_CIELAB_colour_space.svg) - L*, a*, b* 축과 명도(lightness) 분리를 설명할 때 적합.
  ![The principle of the CIELAB colour space](../assets/images/The_principle_of_the_CIELAB_colour_space.svg)
- `Lab 3D 공간`: [Lab color space](https://commons.wikimedia.org/wiki/File:Lab_color_space.svg) - CIE Lab이 지각적 거리와 색차(color difference)를 다루기 위한 공간임을 보여준다.

## 실무 예시와 데모 아이디어

### 예시 1. xy에서 가까워 보여도 색차가 다르게 느껴지는 샘플

CIE xy 색도도 위에서 같은 거리만큼 떨어진 두 쌍의 색을 보여준다. 영역에 따라 사람이 느끼는 차이가 다르게 나타날 수 있음을 설명하며, CIE xy가 지각적으로 균일하지 않다는 점을 보여준다.

### 예시 2. 같은 색도, 다른 명도

같은 xy 좌표를 가진 색을 서로 다른 `Y` 값으로 표시하고, Lab으로 변환했을 때 `L*`가 달라지는 예를 든다. 이 데모는 색도(chromaticity), 휘도(luminance), 명도(lightness)를 분리하는 데 좋다.

### 예시 3. Lab 색상 슬라이더

`L*`, `a*`, `b*` 슬라이더를 만든다. `L*`를 움직이면 밝고 어두운 인상이 바뀌고, `a*`는 초록-빨강, `b*`는 파랑-노랑 방향으로 색이 이동한다는 점을 시각적으로 보여준다.

### 예시 4. Lab 3D 그림과 HDR color volume 구분하기

CIE Lab 3D 그림을 보여준 뒤, `L*` 축이 nits 축이 아니라는 점을 별도로 표시한다. 같은 Lab 좌표라도 기준 흰색과 표시 조건에 따라 실제 화면 휘도는 달라질 수 있으므로, HDR 밝기 볼륨은 Lab 그림이 아니라 xyY 또는 nits 축을 가진 color volume으로 설명해야 한다.

### 예시 5. Delta E로 품질 기준 설명하기

기준 색과 측정 색의 Lab 값을 보여주고 Delta E를 계산한다. 인쇄 감리, 디스플레이 캘리브레이션(calibration), 제품 색상 관리에서 "얼마나 다르다"를 숫자로 말해야 하는 상황을 연결한다.

## 추천 진행 흐름

### 1. CIE xy의 유용성 먼저 인정하기

CIE xy는 원색, 화이트 포인트, 색역을 설명하는 데 매우 좋다고 시작한다. 이전 장에서 배운 내용을 긍정적으로 이어받는다.

### 2. 거리 문제를 제기하기

그다음 "이 지도에서 1 cm 차이는 어디서나 같은 색 차이인가?"라고 질문한다. 이 질문으로 지각적 균일성(perceptual uniformity)의 필요성을 끌어낸다.

### 3. 밝기 정보의 부재를 다시 짚기

CIE xy는 색도 지도라서 밝기 정보가 없다는 점을 다시 설명한다. 특히 소문자 `y`와 대문자 `Y`를 구분한다.

### 4. CIE Lab의 세 축 소개하기

`L*`, `a*`, `b*`를 각각 명도, 초록-빨강, 파랑-노랑 축으로 설명한다. 이때 `a*`, `b*`가 반대색 이론(opponent color theory)의 빨강-초록, 노랑-파랑 지각 축과 연결된다는 점을 짚는다. RGB 채널이 아니라 지각적 좌표라는 점을 강조한다.

### 5. Delta E로 실무 연결하기

마지막에는 Delta E를 소개하며 Lab이 왜 실무에서 중요한지 보여준다. 색공간 변환뿐 아니라 품질 관리, 프로파일 변환, 인쇄와 디스플레이 검증에 연결한다.

## 짧은 마무리 요약

CIE xy 색도도(CIE xy chromaticity diagram)는 색공간의 원색(color primaries), 화이트 포인트(white point), 색역(gamut)을 읽는 데 매우 좋은 지도다. 그러나 xy 평면의 거리는 사람이 느끼는 색 차이와 균일하게 대응하지 않고, xy 좌표만으로는 밝기 정보도 알 수 없다.

CIE Lab(CIELAB)은 CIE XYZ와 기준 흰색(reference white)을 바탕으로 색을 `L*`, `a*`, `b*` 축에 배치해 색차(color difference)를 더 다루기 쉽게 만든 장치 독립 색공간이다. `a*`와 `b*`는 RGB 채널이 아니라 반대색 이론(opponent color theory)과 연결된 초록-빨강, 파랑-노랑 지각 축이다. 여기서 `L*`는 명도(lightness), `Y`는 상대 휘도(relative luminance), brightness는 주관적 밝기라는 점을 구분해야 한다. 특히 `L*`는 nits 축이 아니므로, CIE Lab만으로 디스플레이의 HDR dynamic range나 실제 color volume을 표현할 수는 없다. Delta E는 이 Lab 기반의 차이를 실무에서 숫자로 말하게 해 주는 핵심 도구다.
