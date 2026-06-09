# 화이트포인트(White Point) 정리

## 문서 목적

이 문서는 컬러 스페이스(color space)를 이해할 때 반복해서 등장하는 화이트포인트(white point), 색순응(chromatic adaptation), ICC PCS(Profile Connection Space), D50/D65 표준 배경을 한 번에 정리한다.

핵심 질문은 다음과 같다.

- 화이트포인트는 무엇인가?
- 디스플레이 표준은 왜 보통 D65를 쓰는가?
- 인쇄와 ICC PCS는 왜 D50을 쓰는가?
- 색공간 변환에서 화이트포인트가 다르면 무엇을 해야 하는가?
- `xy` 좌표를 유지하는 것과 색 외관(color appearance)을 유지하는 것은 어떻게 다른가?
- sRGB 같은 D65 색공간이 ICC 프로파일 안에서는 어떻게 D50 PCS와 연결되는가?

## 1. 화이트포인트란 무엇인가?

화이트포인트(white point)는 어떤 색공간 또는 관찰 조건에서 "흰색"으로 간주하는 기준 색도(chromaticity)다. CIE xy 색도도(CIE xy chromaticity diagram)에서는 하나의 점으로 표시된다.

```text
white point
= 이 색공간에서 R=G=B 또는 중립색이 어디를 향해야 하는가
= 관찰자가 어떤 기준 백색에 적응했다고 볼 것인가
```

대표적인 화이트포인트는 다음과 같다.

| 이름 | 대략적 색온도 | CIE 1931 xy | 주 사용처 |
|---|---:|---|---|
| D50 | 약 5000 K | x≈0.3457, y≈0.3585 | 인쇄, 그래픽아트, ICC PCS |
| D65 | 약 6500 K | x≈0.3127, y≈0.3290 | sRGB, Rec.709, Rec.2020, 일반 디스플레이 |

D50과 D65는 단순한 색온도 값이 아니라 CIE가 정의한 표준 광원(standard illuminant)이다. 특히 D50은 "5000K 전구"와 같은 뜻이 아니다. 같은 5000K처럼 보여도 분광분포(SPD, spectral power distribution)가 다르면 종이, 잉크, 형광증백제(optical brightener)가 다르게 보일 수 있다.

## 2. 디스플레이는 왜 보통 D65인가?

디스플레이는 자체 발광(emissive) 장치다. 그래서 관찰자가 보는 기준 백색은 대개 화면이 내는 peak white 또는 reference white가 된다.

sRGB, Rec.709, Rec.2020 같은 영상/컴퓨터 계열 표준은 대부분 D65를 white point로 사용한다.

```text
sRGB white point  = D65
Rec.709 white     = D65
Rec.2020 white    = D65
Display P3 white  = 보통 D65
```

디스플레이 쪽에서 D65가 자리 잡은 배경은 다음과 같이 볼 수 있다.

- D65는 약 6500K 계열의 평균 주광(daylight)을 나타내는 CIE 표준 광원이다.
- TV, HDTV, 컴퓨터 모니터, 웹 색공간이 D65를 기준으로 정렬되었다.
- 자체 발광 화면에서는 화면의 흰색이 관찰자 적응의 중심이 되기 쉽다.
- sRGB와 Rec.709가 같은 primaries와 D65 white point를 공유하면서 컴퓨터/영상 생태계의 기준이 되었다.

즉 디스플레이에서 D65는 다음 질문에 대한 답이다.

```text
화면이 흰색을 낼 때,
그 흰색을 어떤 색도 좌표로 정의할 것인가?
-> D65
```

## 3. 인쇄는 왜 D50인가?

인쇄물은 자체 발광하지 않는다. 종이와 잉크가 외부 조명을 반사해서 보이는 반사 매체(reflective medium)다.

```text
인쇄물의 보이는 색
= 종이 + 잉크 + 조명 SPD + 관찰자 적응 + 주변 환경
```

그래서 인쇄에서는 "디바이스가 내는 흰색"보다 먼저 "어떤 조명 아래에서 볼 것인가"를 정해야 한다. 그래픽아트(graphic arts)와 사진/인쇄 평가 표준인 ISO 3664 계열은 인쇄물과 proof를 평가하는 표준 조명으로 CIE D50을 사용한다.

인쇄 쪽에서 D50이 사용되는 이유는 물리적으로 D50만이 유일하게 옳아서가 아니다. 더 정확히는 다음과 같은 산업적/관찰 조건의 표준화 결과다.

- proof, press sheet, 원고, swatch를 나란히 비교하기 위한 공통 관찰 조건이 필요했다.
- 너무 따뜻한 tungsten 조명은 색 판단에 부적합했다.
- D65처럼 차가운 daylight보다 5000K 계열 daylight viewing booth가 그래픽아트/프리프레스 관행으로 자리 잡았다.
- ISO 3664의 이후 개정에서도 기존 장비와 워크플로의 연속성을 위해 D50이 유지되었다.
- 목표는 "아무 5000K 형광등"이 아니라 natural daylight를 모사하는 D50 분광분포에 가까운 조명이다.

따라서 D50은 인쇄에서 다음 질문에 대한 답이다.

```text
인쇄물의 색을 평가할 때,
어떤 표준 조명 아래에서 proof와 press sheet를 비교할 것인가?
-> D50
```

D50은 D65보다 조금 따뜻하고 노르스름하게 보일 수 있다. 하지만 인쇄 워크플로에서는 관찰자가 D50 조명에 적응한 상태에서 종이 white와 잉크 색을 판단한다. 즉 "노란 조명 아래에서 색을 왜곡해서 보는 것"이 아니라, D50을 기준 관찰 조건으로 삼고 전체 색관리 시스템을 맞춘 것이다.

## 4. ICC v2/v4 PCS는 왜 D50인가?

일반적인 ICC v2/v4 프로파일은 ICC.1 계열이다. ICC.1의 PCS(Profile Connection Space)는 D50 기준의 CIE XYZ 또는 CIE Lab다.

```text
ICC v2/v4 PCS
= D50 기준 PCSXYZ 또는 PCSLAB
```

이 구조에서는 sRGB처럼 D65를 쓰는 색공간도 ICC 프로파일을 통해 연결될 때 D50 PCS로 변환된다.

```text
sRGB D65
-> chromatic adaptation
-> ICC PCS D50
```

주의할 점은 "디스플레이도 D50으로 봐야 한다"는 뜻이 아니라는 것이다. D50 PCS는 서로 다른 장치와 매체를 연결하기 위한 공통 계산 기준이다.

iccMAX, 즉 ICC.2는 더 유연한 구조를 가진다. colorimetric PCS 외에도 spectral PCS, 임의 illuminant/observer 조건 등을 다룰 수 있으므로 "모든 ICC 계열은 반드시 D50 PCS만 사용한다"고 일반화하면 안 된다.

```text
ICC.1 v2/v4
= D50 PCS 기반

ICC.2 / iccMAX
= 더 유연한 PCS/PCC 구조
```

## 5. 화이트포인트가 다르면 chromatic adaptation이 필요한가?

화이트포인트가 다른 색공간으로 변환할 때는 변환 의도를 먼저 구분해야 한다.

### 5.1 측색값/색 자극을 보존하려는 의도

원래 색의 물리적/측색적 의미를 최대한 유지하려는 접근이다. destination white에 맞춰 "흰색처럼 보이게" 강제로 옮기지 않는다.

ICC에서는 absolute colorimetric intent가 이 의도에 가깝다. 다만 `absolute colorimetric = chromatic adaptation을 전혀 하지 않음`이라고 단순화하면 위험하다. ICC v2/v4 내부에서는 PCS가 D50이므로 프로파일 작성 또는 변환 과정에서 D50 기준 처리와 media white 조정이 들어갈 수 있다.

### 5.2 색 외관을 유지하려는 의도

source white 아래에서 보이던 색이 destination white 아래에서도 비슷하게 보이도록 XYZ 값을 조정하는 접근이다. 이때 chromatic adaptation이 필요하다.

대표적인 chromatic adaptation transform은 다음과 같다.

- Bradford adaptation
- CAT02
- CAT16

정리하면 다음과 같다.

```text
xy 좌표 유지
= 물리적/측색적 색 자극을 보존하는 쪽에 가까움

색 외관 유지
= 새 white point 아래에서도 비슷하게 보이도록 XYZ/xy를 조정함
= chromatic adaptation의 목적
```

## 6. 색 외관 유지와 xy 좌표 유지의 차이

색 외관을 유지한다는 말은 CIE xy 좌표를 고정한다는 뜻이 아니다. 오히려 white point가 바뀌면 비슷한 외관을 유지하기 위해 XYZ와 xy 좌표가 바뀔 수 있다.

예를 들어 D65 기준의 중립 회색은 D65 white point의 xy에 놓인다.

```text
D65 neutral gray
xy ≈ (0.3127, 0.3290)
```

이 색을 D50 기준에서도 중립 회색처럼 보이게 옮기면 D50 white point의 xy 쪽으로 이동한다.

```text
D50 neutral gray
xy ≈ (0.3457, 0.3585)
```

따라서 chromatic adaptation은 다음 과정이 아니다.

```text
잘못된 이해:
xy 좌표를 그대로 둔다
```

정확히는 다음 과정이다.

```text
정확한 이해:
source white 아래에서 보이던 색 외관이
destination white 아래에서도 비슷하게 보이도록
XYZ 값을 바꾼다
```

## 7. Bradford adaptation의 기본 아이디어

Bradford adaptation은 XYZ를 사람의 cone response에 가까운 LMS 공간으로 옮긴 뒤, source white와 destination white의 LMS 비율만큼 색을 스케일링하고 다시 XYZ로 되돌리는 방식이다.

```text
1. XYZ를 Bradford LMS 공간으로 변환
2. source white와 destination white의 LMS 값을 구함
3. L, M, S 채널별 white 비율로 색의 LMS 값을 스케일링
4. 다시 XYZ로 변환
```

수식 형태는 다음과 같이 볼 수 있다.

```text
LMS = M_bradford * XYZ

LMS_adapted =
  [Ld/Ls,   0,    0 ]   [L]
  [  0,   Md/Ms, 0 ] * [M]
  [  0,     0,  Sd/Ss]  [S]

XYZ_adapted = M_bradford^-1 * LMS_adapted
```

예를 들어 sRGB red는 D65 기준 XYZ에서 대략 다음 값이다.

```text
sRGB red, XYZ D65
≈ (0.4124, 0.2126, 0.0193)
xy ≈ (0.640, 0.330)
```

이 색을 Bradford adaptation으로 D50 기준 PCS 쪽에 맞추면 대략 다음처럼 변한다.

```text
sRGB red, XYZ D50 PCS
≈ (0.4361, 0.2225, 0.0139)
xy ≈ (0.649, 0.331)
```

같은 색 외관을 유지하려고 XYZ와 xy가 약간 바뀌는 것을 볼 수 있다.

## 8. inverse TRC 직후의 RGB는 아직 PCS가 아니다

sRGB 이미지의 RGB code value에 inverse TRC를 적용하면 비선형 code value가 linear light RGB로 바뀐다.

```text
sRGB encoded RGB
-> inverse TRC
-> sRGB linear RGB
```

이 시점의 값은 아직 CIE XYZ도 아니고 PCS도 아니다. 더 정확히는 다음 상태다.

```text
D65 white point를 기준으로 정의된 sRGB primaries의 linear RGB
```

예를 들어 sRGB red는 다음처럼 선형화된다.

```text
sRGB encoded RGB = (255, 0, 0)
-> inverse TRC
-> sRGB linear RGB = (1.0, 0.0, 0.0)
```

여기까지는 여전히 sRGB primaries와 D65 white point에 묶인 RGB 값이다. ICC 프로파일의 matrix 또는 LUT를 적용해 PCS로 보낸 뒤에야 D50 기준 PCSXYZ 또는 PCSLAB 값이 된다.

```text
encoded RGB
-> inverse TRC
-> linear RGB, source primaries/source white 기준
-> ICC profile의 matrix 또는 A2B transform
-> PCSXYZ 또는 PCSLAB, ICC v2/v4에서는 D50 기준
```

## 9. ICC matrix profile의 rXYZ/gXYZ/bXYZ

일반적인 RGB matrix/TRC ICC profile에서 `rXYZ`, `gXYZ`, `bXYZ` 태그는 단순히 "원래 색공간의 RGB를 원래 white point의 XYZ로 바꾸는 matrix"가 아니다. ICC v2/v4 관점에서는 RGB linear 값을 PCSXYZ로 보내기 위한 matrix다.

따라서 sRGB 같은 D65 기반 source profile의 `rXYZ`, `gXYZ`, `bXYZ`는 보통 다음 변환이 반영된 값으로 이해할 수 있다.

```text
sRGB linear RGB, D65 기준
-> chromatic adaptation
-> PCSXYZ, D50 기준
```

표준 색공간 정의에서 흔히 보는 sRGB to XYZ matrix는 D65 기준이다.

```text
sRGB linear RGB -> XYZ D65

[ 0.4124  0.3576  0.1805 ]
[ 0.2126  0.7152  0.0722 ]
[ 0.0193  0.1192  0.9505 ]
```

반면 ICC sRGB profile의 matrix/TRC 경로에서 사용하는 PCS matrix는 D50 기준으로 적응된 값이다.

```text
sRGB linear RGB -> PCSXYZ D50

[ 0.4361  0.3851  0.1431 ]
[ 0.2225  0.7169  0.0606 ]
[ 0.0139  0.0971  0.7141 ]
```

이 matrix의 첫 번째 column은 `rXYZ`, 두 번째 column은 `gXYZ`, 세 번째 column은 `bXYZ`에 해당한다고 볼 수 있다.

## 10. sRGB 이미지를 Display P3 모니터에 표시할 때

sRGB 이미지가 Display P3 모니터에 표시될 때의 ICC 기반 개념 흐름은 다음과 같다.

```text
sRGB 이미지 RGB
-> sRGB inverse TRC
-> sRGB linear RGB, D65 기준
-> source profile transform
-> PCSXYZ 또는 PCSLAB, D50 기준
-> destination display profile inverse transform
-> display/native RGB
-> 디스플레이 출력
```

모니터 프로파일이 단순한 Display P3 표준 프로파일이라면 개념적으로 다음처럼 생각할 수 있다.

```text
sRGB D65
-> D50 PCS
-> Display P3 D65
```

하지만 실제 모니터 프로파일은 표준 Display P3가 아니라 그 모니터의 실제 primaries, white point, tone response, calibration 상태를 담을 수 있다. 따라서 최종 RGB는 엄밀히는 Display P3 표준 RGB가 아니라 해당 display device에 보낼 RGB 값이다.

또한 sRGB와 Display P3는 둘 다 nominal white point가 D65다. ICC 모델상으로는 D50 PCS를 사이에 두지만, CMM은 두 변환을 합성해서 중간 D50 값을 명시적으로 만들지 않을 수 있다.

```text
개념 모델:
sRGB D65 -> PCS D50 -> Display P3 D65

최적화된 계산:
sRGB linear RGB -> XYZ D65 -> Display P3 linear RGB
```

예를 들어 sRGB의 순수 빨강을 Display P3 RGB로 같은 외관에 가깝게 표현하면 대략 다음 값이 된다.

```text
sRGB encoded RGB = (255, 0, 0)
Display P3 encoded RGB ≈ (234, 51, 35)
```

즉 sRGB red를 P3 화면에서 제대로 표시하려면 P3 공간에 `(255, 0, 0)`을 그대로 보내는 것이 아니라, 더 넓은 P3 primaries 안에서 sRGB red와 같은 색에 해당하는 RGB 값으로 변환해야 한다.

## 11. D50과 D65를 설명할 때의 주의점

### D50은 "그냥 5000K"가 아니다

D50은 CIE가 정의한 daylight illuminant이며, 색온도뿐 아니라 분광분포가 중요하다. 그냥 5000K로 표시된 LED나 형광등이 D50 표준 관찰 조건을 만족한다는 뜻은 아니다.

```text
5000K
= correlated color temperature

D50
= CIE standard illuminant
= chromaticity + spectral power distribution + viewing condition 요구와 연결
```

### D65가 "진짜 평균 daylight"이라서 모든 곳에 더 좋은 것은 아니다

D65는 디스플레이/영상/컴퓨터 생태계에서 매우 중요하지만, 인쇄물 평가에서는 D50 viewing condition이 표준이다. 어느 쪽이 더 진짜 흰색인가의 문제가 아니라, 어떤 매체와 관찰 조건을 통제하려는가의 문제다.

```text
디스플레이
= 자체 발광 화면의 기준 white
= D65 계열 표준이 생태계 기준

인쇄
= 외부 조명 아래에서 보는 반사 매체
= D50 viewing booth가 proof/press 평가 기준
```

### 모니터를 무조건 D50으로 맞춰야 하는 것은 아니다

인쇄 soft proofing을 할 때는 D50 viewing booth와 맞추기 위해 모니터 white point를 D50 또는 더 낮은 white luminance로 조정하는 워크플로가 있을 수 있다. 하지만 일반 웹/영상/디스플레이 작업에서는 D65가 표준인 경우가 많다.

중요한 것은 다음 세 가지를 함께 맞추는 것이다.

```text
작업 대상 표준
+ 관찰 환경
+ 출력 매체
```

## 12. 세미나용 핵심 요약

화이트포인트를 세미나에서 설명할 때는 다음 문장들이 유용하다.

```text
화이트포인트
= 색공간 또는 관찰 조건에서 흰색으로 간주하는 기준 색도

디스플레이 D65
= 자체 발광 화면을 위한 영상/컴퓨터 생태계의 기준 white point

인쇄 D50
= 반사 매체를 표준 조명 아래에서 평가하기 위한 graphic arts viewing condition

ICC v2/v4 PCS
= D50 기반 PCSXYZ 또는 PCSLAB

inverse TRC 적용 후
= source RGB primaries와 source white point에 묶인 linear RGB
= 아직 PCS 아님

ICC profile의 matrix/LUT 적용 후
= ICC v2/v4에서는 D50 기준 PCS

chromatic adaptation
= xy 좌표를 고정하는 과정이 아니라,
  source white 아래의 색 외관을 destination white 아래에서도 비슷하게 유지하도록
  XYZ 값을 조정하는 과정

D50 vs D65
= 어느 쪽이 더 진짜 흰색인가가 아니라,
  어떤 매체와 관찰 조건을 표준화하느냐의 차이
```

## 참고 자료

- ICC, [Why is the media white point of a display profile always D50?](https://www.color.org/whyd50.xalter)
- ICC, [sRGB Three Component Color Encoding Registry](https://registry.color.org/rgb-registry/srgb)
- ICC, [BT.709 Three Component Color Encoding Registry](https://registry.color.org/rgb-registry/bt709)
- ISO, [ISO 3664:2025 Graphic technology and photography - Viewing conditions](https://www.iso.org/standard/83759.html)
- iTeh, [ISO 3664:2025 excerpt](https://standards.theiteh.com/catalog/standards/iso/729e0092-e64d-4f69-9f73-2b2c7b2920c1/iso-3664-2025)
- GTI Graphic Technology, [The Difference Between 5000K and D50](https://www.gtilite.com/2020/07/the-difference-between-5000k-and-d50/)
