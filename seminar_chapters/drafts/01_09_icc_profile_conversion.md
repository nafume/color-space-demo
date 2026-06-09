# [Draft] 1회차 Chapter 9. ICC Profile 기반 변환

## 학습 목표

이 장의 목표는 ICC 프로파일(ICC Profile)이 색공간 변환(color space conversion)에서 어떤 역할을 하는지 이해하는 것이다. 특히 소스 프로파일(source profile), 목적지 프로파일(destination profile), PCS(Profile Connection Space), 렌더링 의도(rendering intent)의 관계를 설명하고, ICC PCS가 CIE Lab만이 아니라 CIE XYZ 또는 CIE Lab일 수 있다는 점을 정확히 구분한다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- 소스 프로파일(source profile)과 목적지 프로파일(destination profile)의 역할
- ICC 기반 변환이 PCS(Profile Connection Space)를 중심으로 연결되는 방식
- ICC PCS가 CIE XYZ 또는 CIE Lab일 수 있다는 사실
- ICC v2/v4 워크플로에서 D50 PCS가 왜 중요한가
- 상대 색도(relative colorimetric), 지각적(perceptual), 절대 색도(absolute colorimetric), 채도(saturation) 렌더링 의도의 차이
- 모니터 프로파일(monitor profile)과 인쇄 프로파일(print profile)이 어떻게 쓰이는가

## 핵심 질문

- 이미지에 ICC 프로파일이 없으면 RGB 값은 어떻게 해석되는가?
- "프로파일을 할당(assign)"하는 것과 "프로파일로 변환(convert)"하는 것은 어떻게 다른가?
- ICC 변환은 왜 장치 RGB에서 장치 CMYK로 바로 이어지지 않고 PCS를 거치는가?
- PCS는 항상 CIE Lab인가?
- ICC 워크플로에서 D50 기준이 자주 등장하는 이유는 무엇인가?
- 렌더링 의도(rendering intent)를 바꾸면 왜 변환 결과가 달라질 수 있는가?

## 상세 설명

### 1. ICC Profile은 색값의 의미를 설명한다

ICC 프로파일(ICC Profile)은 어떤 색값(color value)이 실제로 어떤 색을 의미하는지 설명하는 데이터다. RGB 이미지에서 `R=200, G=40, B=30`이라는 숫자만 있으면 그 값이 sRGB인지, Display P3인지, 특정 카메라 공간인지 알 수 없다. ICC 프로파일은 이 숫자를 해석하기 위한 색공간 정보를 제공한다.

인쇄에서도 마찬가지다. `C=70, M=20, Y=0, K=0`이라는 CMYK 값은 특정 인쇄 조건(print condition)에 묶여 있다. 어떤 잉크와 종이, 어떤 인쇄기 조건을 기준으로 한 값인지 알아야 실제 색을 예측할 수 있다. 인쇄용 ICC 프로파일(print ICC profile)은 그 조건을 색관리 시스템에 알려준다.

### 2. Source Profile과 Destination Profile

ICC 기반 변환에는 보통 두 프로파일이 필요하다.

- 소스 프로파일(source profile): 입력 색값을 해석하는 프로파일
- 목적지 프로파일(destination profile): 출력 색값을 만들기 위한 프로파일

예를 들어 sRGB 이미지를 Display P3 이미지로 변환한다면 소스 프로파일은 sRGB, 목적지 프로파일은 Display P3다. RGB 이미지를 인쇄용 CMYK로 변환한다면 소스 프로파일은 해당 RGB 프로파일이고, 목적지 프로파일은 선택한 인쇄 조건의 CMYK 프로파일이다.

여기서 중요한 구분이 있다.

```text
Assign profile = 숫자는 그대로 두고, 그 숫자의 의미만 바꾼다.
Convert to profile = 색의 의미를 유지하려고 숫자를 바꾼다.
```

프로파일 할당(assign profile)은 "이 RGB 숫자를 어떤 색공간의 숫자로 볼 것인가"를 지정하는 작업이다. 프로파일 변환(convert to profile)은 입력 색이 가능한 한 같은 색으로 보이도록 대상 색공간의 새 숫자를 계산하는 작업이다.

### 3. PCS(Profile Connection Space): 공통 연결 공간

ICC 색관리의 핵심 아이디어는 각 장치 프로파일을 공통 연결 공간인 PCS(Profile Connection Space)에 연결하는 것이다.

단순화하면 다음과 같다.

```text
Source color values
-> Source profile
-> PCS
-> Destination profile
-> Destination color values
```

PCS는 장치 독립(device-independent) 색 표현을 위한 중간 공간이다. 이 구조 덕분에 모든 장치 프로파일이 서로 직접 변환 테이블을 가질 필요가 없다. 각 프로파일은 자기 장치 색값과 PCS 사이의 관계를 정의하면 된다.

정확히 말하면 ICC PCS는 CIE XYZ 또는 CIE Lab일 수 있다. "ICC 프로파일은 Lab을 PCS로 사용한다"는 표현은 일부 상황에서는 맞지만 전체적으로는 부정확하다. ICC 프로파일의 PCS 필드는 `XYZ` 또는 `Lab`을 가질 수 있으며, 프로파일 구조와 태그에 따라 변환 방식이 달라진다.

### 4. D50 PCS의 의미

ICC v2와 v4 프로파일의 PCS는 기준 백색(reference white)으로 D50을 사용한다. 그래서 D65 기반 RGB 색공간인 sRGB나 Display P3를 ICC 워크플로로 다룰 때도, 프로파일 내부에서는 D50 PCS와 연결되는 정보가 필요하다.

이때 색순응 변환(chromatic adaptation)이 등장한다. 예를 들어 D65 기준의 RGB 원색과 화이트 포인트를 D50 PCS에 맞춰 표현하려면, D65에서 D50으로 기준 백색을 맞추는 과정이 필요하다. ICC 프로파일에서는 `chad` 태그(chromatic adaptation tag)나 D50으로 적응된 색도 정보가 이 맥락과 관련된다.

D50 PCS는 "모든 장치가 D50 조명 아래에서만 쓰인다"는 뜻이 아니다. 서로 다른 장치와 색공간을 연결하기 위해 ICC가 정한 공통 기준이라고 이해하는 편이 좋다.

### 5. Rendering Intent는 색역 밖 색을 다루는 정책이다

소스 색공간의 색이 목적지 색공간에서 모두 표현될 수 있다면 변환은 비교적 단순하다. 하지만 넓은 색역(wide gamut) RGB 이미지를 좁은 색역의 프린터나 모니터로 보낼 때는 대상 장치가 표현할 수 없는 색이 생긴다.

렌더링 의도(rendering intent)는 이런 상황에서 색을 어떻게 옮길지 정하는 정책이다. ICC에서 주로 다루는 렌더링 의도는 다음 네 가지다.

- 상대 색도(relative colorimetric): 대상 색역 안 색은 최대한 정확히 유지하고, 색역 밖 색은 경계로 이동한다. 소스 백색을 대상 백색에 맞춘다.
- 지각적(perceptual): 전체 색 관계가 자연스럽게 보이도록 색역 전체를 압축하거나 재배치한다. 사진 이미지에 자주 사용된다.
- 절대 색도(absolute colorimetric): 소스의 백색과 색을 측색적으로 유지하려고 한다. 종이 색 시뮬레이션 같은 프루핑(proofing)에 중요하다.
- 채도(saturation): 측색 정확도보다 선명도와 채도를 우선한다. 차트, 그래픽, 프레젠테이션에 쓰일 수 있다.

실제 결과는 프로파일 제작 방식과 CMM(Color Management Module)에 따라 달라질 수 있다. 특히 perceptual과 saturation은 프로파일 내부 LUT에 의존하는 경우가 많아, 프로파일마다 결과가 크게 다를 수 있다.

### 6. 모니터 프로파일(Monitor Profile)과 인쇄 프로파일(Print Profile)

모니터 프로파일(monitor profile)은 현재 디스플레이가 색을 어떻게 재현하는지 설명한다. 색관리된 애플리케이션은 이미지의 소스 프로파일을 읽고, 그 색을 현재 모니터 프로파일에 맞게 변환해 화면에 표시한다. 이 과정이 있어야 sRGB 이미지와 Display P3 이미지가 의도한 색에 가깝게 보일 수 있다.

인쇄 프로파일(print profile)은 특정 인쇄 조건에서 CMYK 값이 어떤 색을 내는지 설명한다. RGB 이미지를 인쇄용 CMYK로 변환하거나, 소프트 프루핑(soft proofing)을 할 때 사용된다.

중요한 점은 모니터 프로파일이 이미지를 "Display P3로 만든다"는 뜻이 아니고, 인쇄 프로파일이 "아무 프린터에서나 같은 CMYK를 보장한다"는 뜻도 아니라는 것이다. 프로파일은 특정 장치나 조건의 색 재현 특성을 설명하고, 색관리 시스템이 변환을 계산할 수 있게 하는 데이터다.

## 용어 노트

### ICC Profile

색값(color value)과 실제 색의 관계를 설명하는 표준화된 프로파일 데이터다. RGB, CMYK, 회색조, 입력 장치, 출력 장치, 디스플레이 장치 등 다양한 장치와 색공간에 사용된다.

### 소스 프로파일(Source Profile)

입력 색값을 해석하는 프로파일이다. 프로파일이 잘못 지정되면 같은 숫자가 다른 색으로 해석된다.

### 목적지 프로파일(Destination Profile)

출력 색값을 만들기 위해 사용하는 프로파일이다. 모니터 표시, 인쇄 변환, 파일 변환의 대상 조건을 설명한다.

### PCS(Profile Connection Space)

ICC 변환에서 장치 프로파일들을 연결하는 공통 색공간이다. ICC PCS는 CIE XYZ 또는 CIE Lab일 수 있으며, ICC v2/v4에서는 D50 기준으로 연결된다.

### 렌더링 의도(Rendering Intent)

소스 색을 대상 색공간이나 장치 색역 안으로 옮길 때 어떤 기준을 우선할지 정하는 정책이다. relative colorimetric, perceptual, absolute colorimetric, saturation이 대표적이다.

### CMM(Color Management Module)

ICC 프로파일과 렌더링 의도를 사용해 실제 변환을 수행하는 색관리 엔진이다. 운영체제나 애플리케이션, 라이브러리에 따라 결과가 조금씩 다를 수 있다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `ICC Profile 개요`: [ICC profile overview](https://www.color.org/iccprofile.xalter) - 프로파일이 장치 색값과 PCS(Profile Connection Space)를 연결한다는 공식 설명 링크.
- `Profile Connection Space`: [iccMAX profile connection space guidance](https://www.color.org/iccmax/connection1.xalter) - PCS가 변환의 공통 연결 공간 역할을 한다는 설명에 사용.
- `Lab/XYZ 연결`: [The principle of the CIELAB colour space](https://commons.wikimedia.org/wiki/File:The_principle_of_the_CIELAB_colour_space.svg) - ICC PCS에서 CIE Lab 또는 CIE XYZ가 쓰일 수 있다는 설명의 보조 그림.
  ![The principle of the CIELAB colour space](../assets/images/The_principle_of_the_CIELAB_colour_space.svg)

## 실무 예시와 데모 아이디어

### 예시 1. 프로파일 할당과 변환 비교

같은 RGB 이미지에 sRGB와 Display P3 프로파일을 각각 할당(assign)해 본다. 숫자는 그대로인데 색이 다르게 해석되는 모습을 보여준다. 그 다음 sRGB에서 Display P3로 변환(convert)하면 색을 유지하기 위해 RGB 숫자가 바뀐다는 점을 비교한다.

### 예시 2. sRGB에서 인쇄용 CMYK로 변환

sRGB 이미지를 특정 CMYK 인쇄 프로파일로 변환한다. 목적지 프로파일을 바꾸면 CMYK 숫자와 결과 예측이 달라진다는 점을 보여준다.

### 예시 3. 렌더링 의도 비교

채도 높은 RGB 이미지를 좁은 색역의 출력 프로파일로 변환하면서 relative colorimetric과 perceptual을 비교한다. 색역 밖 색의 처리와 전체 대비/채도 관계가 어떻게 달라지는지 관찰한다.

### 예시 4. 모니터 프로파일의 역할

색관리된 이미지 뷰어와 색관리되지 않은 뷰어에서 Display P3 이미지를 비교한다. 같은 파일도 표시 파이프라인이 프로파일을 해석하는지에 따라 결과가 달라질 수 있음을 설명한다.

## 추천 진행 흐름

### 1. 프로파일은 "색값의 문맥"이라고 시작하기

RGB나 CMYK 숫자는 혼자서는 완전한 색이 아니다. ICC 프로파일은 그 숫자가 어떤 색을 의미하는지 설명하는 문맥이라고 소개한다.

### 2. Assign과 Convert를 분리하기

실무에서 가장 많이 혼동하는 부분이므로 초반에 구분한다. assign은 숫자를 유지하고 의미를 바꾸며, convert는 색의 의미를 유지하려고 숫자를 바꾼다.

### 3. PCS 구조를 그림처럼 설명하기

Source profile -> PCS -> Destination profile 구조를 보여준다. 여기서 PCS가 CIE XYZ 또는 CIE Lab일 수 있다는 점을 명확히 말한다.

### 4. D50과 색순응을 연결하기

D65 기반 RGB와 D50 PCS가 만날 때 색순응 변환(chromatic adaptation)이 필요할 수 있음을 설명한다. 너무 깊은 수식보다 기준 백색이 다르다는 직관을 우선한다.

### 5. 렌더링 의도로 색역 밖 문제를 다루기

마지막에는 대상 색역 밖 색을 어떻게 처리할지의 문제로 넘어간다. 네 가지 렌더링 의도를 비교하고, 실제 결과는 프로파일과 CMM에 따라 달라질 수 있다고 정리한다.

## 짧은 마무리 요약

ICC 프로파일(ICC Profile)은 색값의 의미를 설명하고, 서로 다른 장치와 색공간을 PCS(Profile Connection Space)를 통해 연결한다. 변환은 소스 프로파일로 입력 색을 해석하고, PCS를 거친 뒤, 목적지 프로파일로 출력 색값을 만드는 구조로 이해할 수 있다.

정확히 말하면 ICC PCS는 CIE XYZ 또는 CIE Lab일 수 있으며, ICC v2/v4 워크플로에서는 D50 기준 PCS가 중요하다. 색역이 서로 다를 때는 렌더링 의도(rendering intent)가 결과에 영향을 준다. 따라서 ICC 기반 변환을 이해하려면 프로파일, PCS, D50, 렌더링 의도를 함께 보아야 한다.
