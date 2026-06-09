# Appendix. ICC Profile의 종류와 역할

## 이 문서의 목적

이 appendix는 세미나 중 나온 질문인 “이미지에 포함된 ICC profile, 모니터 ICC profile, 프린터 ICC profile은 서로 다른 포맷인가?”를 정리한다.

핵심 결론은 간단하다.

- 이미지용, 모니터용, 프린터용 ICC profile은 **서로 다른 파일 포맷이 아니다**.
- 모두 ICC profile이라는 **하나의 공통 표준 포맷** 안에서 정의된다.
- 차이는 파일 컨테이너가 아니라 **profile class**, **data color space**, **PCS**, **tag 구성**, **색관리 흐름에서의 역할**이다.

즉 ICC profile은 하나의 표준 구조를 공유하고, 그 안에서 “이 프로파일이 무엇을 설명하는가”가 달라진다.

## 1. ICC profile은 하나의 공통 표준 포맷이다

일반적인 ICC profile은 ICC.1 계열, 즉 ICC v2 또는 ICC v4 스펙의 파일 구조를 따른다. 최신 확장 계열로 ICC.2, 즉 iccMAX도 있지만, 일반 이미지/모니터/프린터 색관리에서 흔히 말하는 ICC profile은 대부분 ICC.1 v2/v4를 가리킨다.

공통 구조는 대략 다음과 같다.

```text
ICC profile
-> header
-> tag table
-> tag data
```

header에는 다음과 같은 정보가 들어간다.

- profile version
- profile/device class
- data color space
- PCS, Profile Connection Space
- rendering intent
- PCS illuminant
- profile creator
- profile ID 등

tag table은 프로파일 안에 어떤 태그가 있는지, 각 태그 데이터가 파일의 어느 위치에 있는지를 알려준다. tag data에는 실제 변환에 필요한 matrix, TRC, LUT, white point, chromatic adaptation 정보 등이 들어간다.

따라서 이미지 파일 안에 포함된 ICC profile과 운영체제에 설치된 모니터 profile은 같은 ICC 파일 구조를 쓸 수 있다. 다만 그 프로파일의 class와 태그 의미가 다르다.

## 2. profile class가 용도를 구분한다

ICC profile은 header의 profile class로 용도를 구분한다.

| profile class | 의미 | 대표 예 |
|---|---|---|
| `scnr` | input device profile | 스캐너, 카메라 |
| `mntr` | display device profile | 모니터, 디스플레이 |
| `prtr` | output device profile | 프린터, 인쇄 장치 |
| `spac` | color space profile | sRGB, Display P3, Adobe RGB 같은 표준 색공간 |
| `link` | device link profile | 장치 A에서 장치 B로 직접 변환 |
| `abst` | abstract profile | 색상 효과, 보정 변환 |
| `nmcl` | named color profile | 별색, 이름 있는 색상 |

여기서 중요한 구분은 `spac`, `mntr`, `prtr`이다.

- `spac`: 표준 색공간 자체를 설명한다.
- `mntr`: 특정 모니터가 실제로 색을 어떻게 표시하는지 설명한다.
- `prtr`: 특정 프린터와 인쇄 조건이 색을 어떻게 출력하는지 설명한다.

파일 구조는 같지만, 색관리 시스템이 그 profile을 사용하는 방식은 profile class에 따라 달라진다.

## 3. 이미지에 포함된 ICC profile

이미지에 포함된 ICC profile은 보통 **source profile** 역할을 한다.

예를 들어 이미지 픽셀이 다음과 같다고 하자.

```text
RGB(255, 0, 0)
```

이 숫자만으로는 실제 색이 확정되지 않는다. 이 값이 sRGB의 빨강인지, Display P3의 빨강인지, Adobe RGB의 빨강인지가 필요하다. 이미지 ICC profile은 바로 이 정보를 제공한다.

```text
이미지 RGB 값
+ 이미지 ICC profile
-> 이 RGB 숫자가 의미하는 실제 색
```

이미지에 포함되는 프로파일은 다음과 같은 형태일 수 있다.

- sRGB profile
- Display P3 profile
- Adobe RGB profile
- ProPhoto RGB profile
- 카메라/스캐너 입력 profile

표준 RGB 색공간 프로파일은 보통 `spac` class인 color space profile로 볼 수 있다. 스캐너나 카메라의 profile은 `scnr` class일 수 있다.

중요한 점은 이미지 profile이 “이미지를 어느 모니터에 맞춰 표시할지”를 말하는 것이 아니라, **이미지 RGB 값이 원래 어떤 색공간의 숫자인지**를 말한다는 점이다.

## 4. 모니터 ICC profile

모니터 ICC profile은 보통 **display device profile**이며 profile class는 `mntr`이다.

모니터 profile은 “이 모니터가 실제로 어떤 RGB 원색, white point, tone response를 가지고 있는가”를 설명한다.

예를 들어 같은 `RGB(255, 0, 0)` 값을 모니터에 그대로 보내도, sRGB 모니터와 wide-gamut 모니터에서 실제 발광 색은 다를 수 있다. 모니터 profile은 이 차이를 색관리 시스템에 알려준다.

모니터 profile에는 다음 정보가 들어갈 수 있다.

- 모니터의 red, green, blue primaries
- white point
- 각 채널 TRC 또는 gamma
- matrix/TRC 기반 변환
- 경우에 따라 LUT 기반 보정
- 캘리브레이션 정보와 연동되는 데이터

색관리 흐름에서 모니터 profile은 보통 destination profile 역할을 한다.

```text
이미지 RGB 값
-> 이미지 ICC profile로 source 색 해석
-> PCS, 보통 CIE XYZ 또는 CIE Lab
-> 모니터 ICC profile로 display RGB 계산
-> GPU / OS 출력
-> 모니터 발광
```

즉 모니터 profile은 파일 안의 이미지 색공간을 설명하는 것이 아니라, **현재 출력 장치가 색을 어떻게 재현하는지**를 설명한다.

## 5. 프린터 ICC profile

프린터 ICC profile도 같은 ICC 표준 포맷을 사용한다. 보통 profile class는 `prtr`, 즉 output device profile이다.

프린터 profile은 단순히 “프린터 모델”만 설명하지 않는다. 실제로는 다음 조건의 조합을 설명하는 경우가 많다.

```text
프린터 기종
+ 잉크
+ 용지
+ 해상도/드라이버 설정
+ 인쇄 조건
```

같은 프린터라도 광택지, 무광지, 캔버스지, 다른 잉크, 다른 드라이버 설정을 쓰면 색 재현 특성이 달라진다. 그래서 프린터 profile은 특정 출력 조건에 묶이는 경우가 많다.

프린터 profile의 data color space는 보통 다음 중 하나다.

- CMYK
- RGB
- Gray
- 다채널 잉크 공간

프린터 profile은 모니터 profile보다 LUT 기반인 경우가 많다. 이유는 프린터의 색 재현이 매우 비선형적이고, 잉크와 종이의 상호작용, 총잉크량 제한, 블랙 생성, gamut mapping이 중요하기 때문이다.

대표적인 변환 태그는 다음과 같다.

| 태그 | 방향 | 예 |
|---|---|---|
| `A2B*` | device -> PCS | CMYK -> Lab |
| `B2A*` | PCS -> device | Lab -> CMYK |

프린터로 출력할 때의 큰 흐름은 다음과 같다.

```text
이미지 RGB 값
-> 이미지 ICC profile로 source 색 해석
-> PCS, 보통 CIE Lab 또는 CIE XYZ
-> 프린터 ICC profile로 CMYK 또는 잉크값 계산
-> 프린터 드라이버 / RIP
-> 잉크가 종이에 놓임
-> 조명 아래에서 반사색으로 관찰
```

모니터는 빛을 직접 내는 emissive device이고, 프린터는 종이에 잉크를 올려 주변 조명을 반사하는 reflective device다. 이 차이 때문에 프린터 profile은 white point, media white, rendering intent, black generation, gamut mapping의 영향이 더 크게 나타난다.

## 6. source profile과 destination profile

ICC profile을 이해할 때 “이미지용”, “모니터용”, “프린터용”이라는 이름보다 더 중요한 것은 변환 흐름에서의 역할이다.

대부분의 색관리 변환은 다음 구조를 가진다.

```text
Source device/color space
-> source profile
-> PCS
-> destination profile
-> Destination device/color space
```

예를 들어 sRGB 이미지를 모니터에 표시하면 다음과 같다.

```text
sRGB image RGB
-> sRGB profile
-> PCS
-> monitor profile
-> monitor RGB
```

sRGB 이미지를 프린터로 출력하면 다음과 같다.

```text
sRGB image RGB
-> sRGB profile
-> PCS
-> printer profile
-> CMYK / ink values
```

여기서 같은 sRGB profile도 상황에 따라 source profile로 쓰인다. 반대로 모니터 profile이나 프린터 profile은 보통 destination profile로 쓰이지만, 측정/soft proofing/변환 검증 과정에서는 device 값에서 PCS로 가는 source 역할을 할 수도 있다.

즉 profile class와 변환 방향은 관련이 있지만 완전히 같은 말은 아니다. CMM은 profile class, rendering intent, 변환 방향을 보고 적절한 태그를 선택한다.

## 7. PCS의 역할

PCS는 Profile Connection Space의 약자다. ICC 색관리에서 서로 다른 장치나 색공간을 직접 모두 연결하지 않고, 공통 연결 공간을 거치기 위한 기준 좌표계다.

ICC.1 v2/v4에서 PCS는 보통 다음 중 하나다.

- CIE XYZ
- CIE Lab

개념적으로는 다음과 같다.

```text
RGB / CMYK / Gray / device values
-> PCS
-> RGB / CMYK / Gray / device values
```

PCS를 사용하면 모든 색공간 쌍에 대해 직접 변환을 만들 필요가 없다.

예를 들어 5개의 입력 색공간과 5개의 출력 장치가 있을 때, 모든 조합의 직접 변환을 만들지 않고 각 프로파일이 PCS와의 연결만 정의하면 된다.

## 8. 이미지 profile과 모니터 profile을 혼동하면 생기는 문제

wide-gamut 모니터에서 sRGB 이미지가 너무 진하게 보이는 현상은 이 구분을 이해하는 좋은 예다.

정상적인 color-managed 흐름은 다음과 같다.

```text
sRGB 이미지
-> sRGB profile로 원래 색 해석
-> PCS
-> wide-gamut 모니터 profile
-> 모니터용 RGB로 변환
```

이 경우 sRGB 빨강은 wide-gamut 모니터에서도 sRGB 빨강으로 보이도록 조정된다.

하지만 컬러 관리가 생략되면 다음처럼 된다.

```text
sRGB 이미지 RGB 값
-> 변환 없이 모니터 RGB로 그대로 출력
```

wide-gamut 모니터의 빨강 primary가 sRGB 빨강보다 더 바깥쪽에 있으면, `RGB(255, 0, 0)`은 의도보다 더 강한 빨강으로 보인다.

이 문제는 이미지 ICC profile 자체가 틀렸다기보다, source profile에서 display profile로 가는 변환이 생략되었거나 잘못 적용되었기 때문에 발생한다.

## 9. 요약

정리하면 다음과 같다.

- ICC profile은 하나의 공통 표준 포맷이다.
- 이미지, 모니터, 프린터 profile은 파일 구조가 아니라 profile class와 내용이 다르다.
- 이미지에 포함된 profile은 보통 source RGB 값의 의미를 설명한다.
- 모니터 profile은 실제 디스플레이 장치의 색 재현 특성을 설명한다.
- 프린터 profile은 특정 프린터, 잉크, 종이, 인쇄 조건의 색 재현 특성을 설명한다.
- CMM은 source profile과 destination profile을 PCS를 통해 연결한다.
- 프린터 profile은 비선형성과 gamut mapping 때문에 LUT 기반 `A2B*`, `B2A*` 태그가 중요하다.

한 문장으로 말하면:

> ICC profile은 “색 숫자를 실제 색 의미로 연결하는 공통 파일 포맷”이고, 이미지/모니터/프린터의 차이는 그 공통 포맷 안에서 무엇을 설명하느냐의 차이다.
