# [Draft] 2회차 Chapter 13. 2회차 마무리: 표준별 정의 항목 정리

## 학습 목표

이 장의 목표는 2회차에서 다룬 WCG(Wide Color Gamut), HDR(High Dynamic Range), 전송 함수(transfer function), 메타데이터(metadata), scene/display-referred 구분, tone mapping 필요성을 표준별로 정리하는 것이다. 표준 이름만 외우는 것이 아니라, 각 표준이 어떤 항목을 정의하고 어떤 항목은 별도 해석이 필요한지 읽는 법을 익힌다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- sRGB, Rec.709, Display P3, Rec.2020, HDR10, HLG, Dolby Vision의 핵심 정의 항목은 무엇인가
- primaries, white point, transfer, matrix, range를 왜 분리해서 읽어야 하는가
- peak/mastering display metadata가 HDR에서 어떤 역할을 하는가
- 어떤 표준이 display-referred 전달물에 가깝고, 어떤 포맷이 scene-referred 제작 워크플로와 연결되는가
- Rec.709 SDR로 변환할 때 tone mapping이 필요한 경우는 언제인가

## 핵심 질문

- Rec.2020이라고 하면 HDR을 의미하는가?
- Display P3는 WCG이지만 항상 HDR인가?
- HDR10과 HLG는 둘 다 HDR인데 왜 metadata와 transfer 해석이 다른가?
- OpenEXR/ACES는 일반 소비자 HDR 포맷과 같은 범주인가?
- Rec.709 SDR로 출력할 때 어떤 source는 tone mapping이 필요하고 어떤 source는 필요하지 않은가?

## 상세 설명

### 1. 표준을 읽을 때의 공통 체크리스트

색공간과 HDR 표준을 볼 때는 이름보다 항목을 먼저 봐야 한다. 특히 영상과 이미지 워크플로에서는 다음 항목을 분리해서 확인한다.

```text
1. WCG 여부
2. HDR 여부
3. color primaries
4. white point
5. transfer characteristics
6. matrix coefficients
7. color range
8. peak luminance / mastering display
9. metadata
10. scene-referred / display-referred 성격
11. 대표 파일/컨테이너 포맷
12. Rec.709 SDR 변환 시 tone mapping 필요 여부
```

이 체크리스트의 목적은 표준 이름에 끌려가지 않는 것이다. Rec.2020은 넓은 원색을 정의하지만, Rec.2020 원색을 쓴다고 자동으로 HDR이 되는 것은 아니다. Display P3는 WCG일 수 있지만 SDR 이미지에도 쓰인다. HDR10은 PQ와 metadata를 함께 봐야 하고, HLG는 상대 밝기 기반 transfer로 이해해야 한다.

### 2. SDR 계열: sRGB, Rec.709, Display P3

sRGB는 웹, 일반 이미지, 그래픽에서 널리 쓰이는 표준 색공간이다. D65 화이트 포인트(white point), sRGB 원색, sRGB transfer curve를 사용한다. 일반적으로 SDR display-referred 이미지와 연결된다. ICC 프로파일(ICC Profile)을 통해 색 해석이 전달되는 경우가 많다.

Rec.709는 HDTV SDR 영상 표준과 연결된다. 원색과 D65 white point는 sRGB와 같거나 매우 유사하게 다뤄지지만, 영상 워크플로에서는 Rec.709 OETF, BT.1886 EOTF, YCbCr matrix, limited range 같은 항목이 중요하다. Rec.709 SDR은 대표적인 display-referred 출력 조건이다.

Display P3는 DCI-P3 계열 원색을 D65 white point와 함께 사용하는 디스플레이 중심 색공간으로 자주 쓰인다. sRGB보다 넓은 WCG 색역을 제공하지만, 그 자체가 HDR을 의미하지는 않는다. Display P3 SDR 이미지도 가능하고, HDR 이미지/영상에서도 P3 수준의 실제 색 사용이 Rec.2020 컨테이너 안에 들어갈 수 있다.

### 3. Rec.2020과 HDR 계열: HDR10, HLG, Dolby Vision

Rec.2020은 매우 넓은 RGB 원색과 UHDTV 관련 정의를 포함한다. 하지만 실무에서 Rec.2020은 종종 HDR10의 색공간 컨테이너처럼 등장한다. 많은 HDR 콘텐츠가 Rec.2020 metadata를 갖지만 실제 색 사용은 P3 범위에 머무를 수 있다.

HDR10은 일반적으로 Rec.2020 primaries, PQ/ST 2084 transfer, 10-bit, YCbCr, limited range, 정적 메타데이터(static metadata)를 사용한다. Mastering display metadata와 MaxCLL/MaxFALL이 tone mapping 힌트로 사용될 수 있다. HDR10은 display-referred 전달물로 이해하는 것이 좋다.

HLG는 Hybrid Log-Gamma transfer를 사용하는 HDR 방식이다. 방송 친화성을 위해 상대 밝기 기반으로 설계되었고, HDR10처럼 mastering metadata에 크게 의존하지 않는다. 같은 HDR이라도 PQ와 HLG는 신호 해석과 표시 렌더링 방식이 다르다.

Dolby Vision은 동적 메타데이터(dynamic metadata)를 활용할 수 있는 HDR 시스템이다. 장면별 또는 샷별 표시 변환 힌트를 제공해 다양한 디스플레이에서 더 세밀한 렌더링을 돕는다. 이 장에서는 개념 수준으로, HDR10보다 metadata 구조와 렌더링 제어가 더 풍부한 시스템으로 소개한다.

### 4. HDR 이미지와 제작 포맷: HEIF/AVIF, OpenEXR/ACES

HDR HEIF/AVIF는 이미지 컨테이너 안에 고비트 심도, 넓은 색역, PQ/HLG 또는 gain map 같은 HDR 정보를 담을 수 있다. 하지만 같은 확장자 안에도 SDR 이미지가 있을 수 있으므로 ICC profile, nclx, bit depth, metadata를 확인해야 한다.

OpenEXR은 high dynamic range 제작과 합성 워크플로에서 많이 쓰인다. 보통 linear light, float 또는 half float 채널, scene-referred 데이터와 연결된다. OpenEXR은 HDR 디스플레이용 완성본이라기보다, 후반 작업과 VFX에서 장면 빛 정보를 보존하는 컨테이너로 보는 편이 정확하다.

ACES는 특정 파일 확장자 하나가 아니라 색 관리와 제작 워크플로 체계다. ACES 데이터는 output transform을 거쳐 Rec.709 SDR, HDR10, P3 등 다양한 display-referred 결과물로 나갈 수 있다.

### 5. 요약 표

| 항목 | WCG/HDR 성격 | 주요 정의/확인 항목 | Scene/Display 성격 | Rec.709 SDR 변환 |
|---|---|---|---|---|
| sRGB | SDR, 일반 gamut | sRGB primaries, D65, sRGB transfer, ICC | display-referred 이미지 | 보통 tone mapping 불필요 |
| Rec.709 SDR | SDR, 일반 gamut | Rec.709 primaries, D65, OETF/BT.1886, matrix, range | display-referred 영상 | 기준 출력 |
| Display P3 | WCG 가능, HDR 아님 | P3 primaries, D65, ICC/플랫폼 profile | 주로 display-referred | gamut mapping 필요 가능 |
| Rec.2020 | WCG 표준/컨테이너 | wide primaries, D65, matrix, transfer는 별도 확인 | 맥락 의존 | HDR이면 tone mapping 필요 |
| HDR10 | HDR + WCG container | Rec.2020, PQ, 10-bit, metadata, MaxCLL/MaxFALL | display-referred | tone mapping 필요 |
| HLG | HDR 방송 | HLG transfer, Rec.2020, metadata 의존도 낮음 | display-referred에 가까움 | tone mapping/OOTF 고려 |
| Dolby Vision | HDR 동적 metadata | base layer, dynamic metadata, target display mapping | display-referred 시스템 | 구현별 tone mapping |
| HDR HEIF/AVIF | 이미지 HDR 가능 | bit depth, ICC/nclx, PQ/HLG/gain map | 파일별로 확인 | source 성격에 따라 다름 |
| OpenEXR/ACES | 제작 HDR/scene data | linear/float, ACES space, metadata | scene-referred/production | output transform 필요 |

### 6. Rec.709 SDR로 보낼 때의 판단

Rec.709 SDR로 출력할 때 tone mapping이 필요한지는 source의 밝기 기준에 달려 있다. sRGB 이미지를 Rec.709 SDR로 비슷하게 표시하는 경우에는 보통 HDR tone mapping이 필요하지 않다. Display P3 SDR 이미지를 Rec.709로 보낼 때는 주로 gamut mapping이 문제가 된다.

반면 HDR10, HLG, scene-referred OpenEXR/ACES 같은 소스를 Rec.709 SDR로 보낼 때는 밝기 범위를 SDR에 맞게 재설계해야 한다. 이때 tone mapping이 필요하다. 특히 HDR10 Rec.2020 PQ를 Rec.709 SDR로 변환하려면 transfer 해석, tone mapping, gamut mapping, SDR transfer 적용을 함께 처리해야 한다.

## 용어 노트

### 원색(Color Primaries)

원색(color primaries)은 RGB 색공간의 R, G, B 기준 색도 위치다. sRGB/Rec.709, Display P3, Rec.2020을 구분하는 핵심 항목이다.

### 전송 특성(Transfer Characteristics)

전송 특성(transfer characteristics)은 코드값과 장면 빛 또는 디스플레이 빛 사이의 관계를 정의한다. sRGB curve, Rec.709 OETF, BT.1886 EOTF, PQ, HLG가 여기에 해당한다.

### 행렬 계수(Matrix Coefficients)

행렬 계수(matrix coefficients)는 RGB와 YCbCr 사이의 변환에 쓰이는 계수다. 영상에서 Rec.709 matrix와 Rec.2020 non-constant luminance matrix를 잘못 해석하면 색이 틀어질 수 있다.

### Scene/Display-referred 성격

Scene-referred는 장면 빛 기준이고 display-referred는 표시 결과 기준이다. OpenEXR/ACES는 제작 워크플로, HDR10/Rec.709 SDR은 표시 전달물로 이해하면 좋다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `표준별 WCG`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - Rec.709, P3, Rec.2020 색역 차이를 마무리 표에 연결.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `PQ vs HLG`: [PQ EOTF (SMPTE2084)](https://commons.wikimedia.org/wiki/File:PQ_EOTF_%28SMPTE2084%29.png), [Hybrid Log-Gamma](https://commons.wikimedia.org/wiki/File:Hybrid_Log-Gamma.svg) - HDR 표준별 transfer 차이를 정리.
- `영상 메타데이터`: [SMPTE color bars](https://commons.wikimedia.org/wiki/File:SMPTE_Color_Bars_16x9.svg) - primaries, transfer, matrix, range를 함께 읽는 마무리 예시에 사용.
  ![SMPTE color bars](../assets/images/SMPTE_Color_Bars_16x9.svg)

## 실무 예시와 데모 아이디어

### 예시 1. 같은 Rec.2020 metadata의 다른 의미

Rec.2020 SDR 테스트 영상과 HDR10 Rec.2020 PQ 영상을 비교한다. 둘 다 Rec.2020 primaries를 가질 수 있지만 transfer와 HDR metadata가 다르면 해석이 완전히 달라진다.

### 예시 2. P3 SDR 이미지와 HDR10 영상 비교

Display P3 이미지는 WCG이지만 SDR일 수 있고, HDR10 영상은 WCG 컨테이너와 HDR transfer를 함께 가진다는 점을 표로 비교한다.

### 예시 3. OpenEXR에서 Rec.709 출력 만들기

linear OpenEXR 또는 ACES 소스가 output transform을 거쳐 Rec.709 SDR 결과물이 되는 과정을 보여준다. 제작 데이터와 표시 결과의 차이를 강조한다.

## 추천 진행 흐름

### 1. 체크리스트 먼저 제시

표준 이름을 외우기 전에 primaries, white point, transfer, matrix, range, metadata를 분리해서 읽는 체크리스트를 보여준다.

### 2. SDR/WCG/HDR 순서로 정리

sRGB와 Rec.709를 SDR 기준으로, Display P3와 Rec.2020을 WCG 관점으로, HDR10/HLG/Dolby Vision을 HDR transfer와 metadata 관점으로 설명한다.

### 3. 제작 포맷 따로 분리

OpenEXR/ACES는 소비자 HDR 표시 포맷이 아니라 scene-referred 제작 워크플로에 가깝다고 정리한다.

### 4. Rec.709 SDR 변환 판단으로 마무리

어떤 source는 gamut mapping만 필요하고, 어떤 source는 tone mapping까지 필요하다는 판단 기준을 제시한다.

## 짧은 마무리 요약

HDR 표준을 볼 때는 색역만 보면 안 된다. WCG/HDR 여부, primaries, white point, transfer, matrix, range, peak/mastering display, metadata, scene/display-referred 성격을 함께 읽어야 한다.

sRGB와 Rec.709는 대표적인 SDR 기준이고, Display P3와 Rec.2020은 WCG 관점에서 중요하다. HDR10, HLG, Dolby Vision은 밝기 해석과 metadata가 핵심이며, OpenEXR/ACES는 display HDR 완성본보다 scene-referred 제작 워크플로로 이해하는 것이 좋다.
