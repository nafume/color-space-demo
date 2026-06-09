# Color Space 세미나 계획서

## 1. 세미나 개요

이 세미나는 color space를 단순히 `sRGB`, `Display P3`, `Rec.2020` 같은 표준 이름으로 외우는 것이 아니라, 색을 숫자로 표현하고 장치 사이에서 일관되게 재현하기 위한 약속의 체계로 이해하는 것을 목표로 한다.

핵심 흐름은 인간의 색 인지와 CIE 표준에서 출발해, RGB/YCbCr 영상 신호, 모니터 컬러 관리, ICC Profile 기반 변환, 인쇄 워크플로까지 연결하는 것이다. 세미나가 끝나면 참석자는 색공간을 구성하는 요소를 분해해서 읽고, 실제 이미지나 영상에서 색이 어긋나는 원인을 체계적으로 추적할 수 있어야 한다.

## 2. 대상 청중

- 이미지, 영상, 그래픽, 디스플레이, 인쇄 워크플로에서 색 문제를 다루는 개발자
- sRGB, Rec.709, Display P3, Rec.2020, ICC Profile 같은 용어를 들어봤지만 관계를 명확히 정리하고 싶은 사람
- ffmpeg, zimg, 이미지 처리 라이브러리, 브라우저, OS 컬러 관리 등에서 색 변환 문제를 분석해야 하는 사람
- 모니터와 인쇄 결과가 다르게 보이는 이유를 기술적으로 이해하고 싶은 사람

## 3. 세미나에서 이해할 수 있는 것

- `color primaries`, `white point`, `transfer characteristics`, `matrix coefficients`, `color range`의 의미
- CIE xy 색도도와 여러 컬러 표준의 관계
- CIE XYZ와 CIE xy 색도도가 만들어진 배경
- sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020의 차이
- SDR과 HDR에서 gamut과 color volume을 구분해야 하는 이유
- 모니터 ICC Profile이 OS와 애플리케이션에서 사용되는 방식
- ICC Profile 기반 컬러 프로파일 변환 과정
- 인쇄용 ICC Profile과 soft proofing의 의미
- 실무에서 색이 물 빠지거나 과포화되거나 명암이 틀어지는 대표 원인

## 4. 전체 구성

```text
인간의 색 인지
-> CIE RGB / CIE XYZ / CIE xy 색도도
-> RGB 색공간 표준
-> 영상 신호 체계와 HDR
-> 모니터와 ICC Profile
-> 컬러 프로파일 변환
-> 인쇄와 soft proofing
-> 실무 문제 진단 체크리스트
```

## 5. 챕터별 상세 계획

### Chapter 1. 세미나 목표

주요 키워드: 구성 요소로 읽기, 색역 삼각형, 표준 해석, 변환 손실, 문제 추적

첫 장에서는 세미나의 목적과 전체 관점을 정리한다. Color space는 색역 삼각형 하나로 끝나는 개념이 아니라, 색을 정의하고 전달하고 재현하기 위한 여러 규칙의 묶음이라는 점을 먼저 강조한다.

참석자가 세미나를 듣고 나면 다음 질문에 답할 수 있어야 한다.

- 색공간을 정의하려면 왜 primaries, white point, transfer function이 필요한가?
- CIE xy 색도도는 왜 거의 모든 컬러 표준 설명에 등장하는가?
- sRGB, Rec.709, Display P3, Rec.2020은 무엇이 같고 무엇이 다른가?
- 모니터, 영상, 이미지, 인쇄에서 ICC Profile은 어떤 역할을 하는가?
- 색 변환 과정에서 왜 색이 틀어지거나 손실되는가?

이 장의 핵심 메시지는 색공간을 이름으로 외우는 대신 구성 요소로 분해해서 읽자는 것이다.

### Chapter 2. 색을 다룰 때 등장하는 기본 개념

주요 키워드: 빛의 스펙트럼, 인간 시각, 원추세포, 색 지각, RGB 값, 장치 의존 색

이 장에서는 색공간에 들어가기 전, 색이 물리 현상인 동시에 인간 시각의 해석 결과라는 점을 설명한다. 물리적으로 색은 빛의 스펙트럼과 관련되어 있지만, 우리가 느끼는 색은 눈과 뇌의 반응을 거친 지각 결과다.

먼저 빛의 파장, 스펙트럼, 인간의 원추세포 반응을 간단히 소개한다. 인간은 대략 세 종류의 원추세포 반응을 이용해 색을 구분하기 때문에, 세 개의 기본 자극을 조합해 많은 색을 표현할 수 있다. 이 설명은 뒤에서 RGB 색공간과 삼색 색채 이론으로 자연스럽게 이어진다.

이 장에서는 특히 `RGB(255, 0, 0)` 같은 숫자가 그 자체로 절대적인 색을 의미하지 않는다는 점을 강조한다. 같은 RGB 값이라도 sRGB에서 해석하는지, Display P3에서 해석하는지에 따라 실제 색은 달라진다. 따라서 색값은 반드시 색공간과 함께 해석되어야 한다.

### Chapter 3. CIE xy 색도도는 어떻게 만들어졌나

주요 키워드: 삼색 색채 이론, V(lambda), 라이트-길드 실험, RGB 색상 일치 함수, 음수 좌표, CIE XYZ, xy 변환

이 장은 세미나의 이론적 중심이다. CIE xy 색도도가 임의로 그린 그림이 아니라, 인간의 색상 매칭 실험과 수학적 변환을 통해 만들어진 표준 좌표계라는 점을 설명한다.

먼저 삼색 색채 이론을 소개한다. 인간이 대략 세 종류의 원추세포 반응으로 색을 구분한다는 점에서, 세 개의 기본 자극을 조합하면 많은 색을 맞출 수 있다는 생각이 출발한다.

그다음 1924년 광효율 함수 `V(lambda)`를 설명한다. 이 함수는 인간 눈이 파장별 밝기를 얼마나 민감하게 느끼는지를 나타내며, 색공간에서 luminance 개념이 왜 중요한지 이해하는 데 도움을 준다.

이어서 1931 RGB 색상 일치 함수와 라이트-길드 색상 매칭 실험을 다룬다. 실험 참가자들은 특정 테스트 색을 세 가지 기준광의 조합으로 맞췄고, 이 결과가 색상 일치 함수의 기반이 되었다. 하지만 일부 색은 세 기준광을 모두 양수로만 조합해서는 맞출 수 없었고, 기준광을 테스트 색 쪽에 더해야 하는 경우가 생겼다. 이 현상이 RGB 색상 일치 함수의 음수 값으로 나타난다.

음수 값은 계산과 표준화에 불편했기 때문에, 모든 가시 색을 양수 좌표로 표현할 수 있는 CIE XYZ 색공간이 도입되었다. XYZ는 실제 물리적 primary가 아니라 계산을 위해 정의된 가상의 색공간이며, Y가 luminance에 대응되도록 설계되었다.

마지막으로 XYZ에서 xy 색도도로 변환하는 과정을 설명한다.

```text
x = X / (X + Y + Z)
y = Y / (X + Y + Z)
```

이 변환은 밝기 정보를 제거하고 색도만 2차원으로 표현한다. 따라서 CIE xy 색도도는 색공간 비교에 유용하지만, 밝기나 HDR 특성을 직접 보여주지는 못한다.

### Chapter 4. CIE xy 색도도와 다양한 컬러 표준의 관계

주요 키워드: CIE xy, spectral locus, 비분광색, gamut triangle, sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020

이 장에서는 CIE xy 색도도가 컬러 표준을 비교하는 공통 지도처럼 사용되는 이유를 설명한다. CIE xy 색도도는 인간이 볼 수 있는 색의 범위를 2차원 좌표로 표현한 것으로, 여러 RGB 색공간의 primaries를 이 위에 배치하면 색역 차이를 직관적으로 비교할 수 있다.

말발굽 모양의 외곽은 spectral locus, 즉 단색광의 위치를 나타낸다. 아래쪽 직선 경계는 실제 단일 파장의 빛으로는 만들 수 없는 비분광색, 특히 보라색 계열을 표현한다. RGB 색공간은 이 색도도 위에서 세 primary를 잇는 삼각형으로 표시된다.

이 장에서는 sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020을 비교한다. sRGB와 Rec.709는 primaries와 white point가 거의 같은 계열이지만 사용 맥락과 transfer, range, matrix가 다를 수 있다. Display P3는 sRGB보다 넓은 색역을 가지며, 특히 빨강과 초록 방향의 표현 범위가 넓다. Adobe RGB는 인쇄와 사진 편집 워크플로에서 중요한 녹색/청록 영역을 더 넓게 가진다. Rec.2020은 매우 넓은 색역을 정의하지만, 실제 디스플레이가 이를 완전히 재현하기는 어렵다.

마지막에는 CIE xy 색도도의 한계도 짚는다. 이 도표는 밝기 정보를 직접 보여주지 않기 때문에 HDR 표현 능력이나 실제 디스플레이의 color volume을 설명하기에는 부족하다.

### Chapter 5. Color Space를 구성하는 요소들

주요 키워드: color primaries, white point, transfer characteristics, matrix coefficients, color range, color volume, ICC Profile

이 장은 세미나 전체의 용어 기반을 만드는 파트다. 색공간을 구성하는 요소를 하나씩 분리해서 설명하고, 뒤에서 나오는 영상, 모니터, 인쇄 문제를 이 요소들로 다시 해석할 수 있게 한다.

`Color primaries`는 RGB의 빨강, 초록, 파랑 기준점이 CIE xy 색도도 위에서 어디에 위치하는지를 정의한다. 세 primary를 연결하면 해당 RGB 색공간이 표현할 수 있는 색역의 삼각형이 된다.

`White point`는 해당 색공간에서 흰색을 어디로 볼 것인지 정하는 기준이다. 대표적으로 D65와 D50이 있으며, 모니터와 인쇄 워크플로에서는 white point 차이가 색 적응과 프로파일 변환에 영향을 준다.

`Transfer characteristics`는 디지털 코드값과 실제 밝기 사이의 관계를 정의한다. SDR에서는 gamma나 sRGB curve가 사용되고, HDR에서는 PQ나 HLG가 사용된다. 같은 숫자라도 transfer function이 다르면 밝기 해석이 달라진다.

`Matrix coefficients`는 RGB와 YCbCr 사이를 변환할 때 사용하는 계수다. 영상에서는 Rec.601, Rec.709, Rec.2020의 matrix를 잘못 적용하면 색상축과 피부톤이 어긋날 수 있다.

`Color range`는 full range와 limited range의 차이를 다룬다. range 해석이 틀리면 검정이 회색처럼 뜨거나, 어두운 영역이 뭉개지거나, 하이라이트가 날아갈 수 있다.

`Color volume`은 2차원 색역뿐 아니라 밝기 축까지 포함한 개념이다. HDR을 설명할 때는 CIE xy 위의 삼각형만으로는 부족하며, 얼마나 밝은 색을 어느 채도까지 표현할 수 있는지가 중요해진다.

마지막으로 `ICC Profile`을 장치나 색공간의 색 재현 특성을 설명하는 데이터로 소개한다. 이 개념은 모니터와 인쇄, 프로파일 변환 장에서 다시 자세히 다룬다.

### Chapter 6. 실제 색공간과 표준 컬러 시스템

주요 키워드: RGB, YCbCr, chroma subsampling, OETF, EOTF, gamma, sRGB curve, BT.1886, PQ, HLG, full range, limited range

이 장에서는 이론적 색공간이 실제 이미지, 영상, 디스플레이 표준으로 어떻게 내려오는지 설명한다. RGB, YCbCr, transfer function, range 같은 실무 용어를 하나의 처리 흐름으로 묶는다.

먼저 RGB 색공간을 설명한다. RGB는 디스플레이의 물리 구조와 잘 맞는다. 모니터는 빨강, 초록, 파랑 서브픽셀의 밝기를 조합해 색을 만들기 때문이다. 하지만 영상 압축과 전송에서는 RGB보다 YCbCr이 자주 사용된다.

YCbCr에서는 Y가 밝기 성분, Cb/Cr이 색차 성분을 나타낸다. 인간 시각은 색상 해상도보다 밝기 해상도에 더 민감하므로, 영상 압축에서는 색차 성분의 해상도를 줄이는 chroma subsampling이 가능하다. RGB와 YCbCr 사이의 변환에는 표준별 matrix coefficients가 필요하다.

그다음 transfer function을 설명한다. 디지털 코드값은 실제 빛의 밝기와 선형 관계가 아니다. SDR에서는 gamma, sRGB curve, BT.1886 같은 체계가 사용되고, HDR에서는 PQ와 HLG가 사용된다. PQ는 절대 밝기 기준에 가까운 HDR 시스템이고, HLG는 방송 호환성을 고려한 HDR 시스템이다.

마지막으로 full range와 limited range를 다룬다. 이미지 파일은 보통 full range RGB로 다뤄지는 경우가 많고, 방송/영상 신호는 limited range를 사용하는 경우가 많다. 이 해석이 어긋나면 콘트라스트와 블랙 레벨 문제가 발생한다.

### Chapter 7. 모니터와 컬러 프로파일

주요 키워드: 디스플레이 gamut, 모니터 white point, tone response, calibration, profiling, display ICC Profile, color managed app, wide gamut 과포화

이 장에서는 색공간이 실제 디스플레이 장치와 만나는 지점을 설명한다. 모니터는 각각 다른 물리적 특성을 가진다. 같은 RGB 값을 입력해도 패널, 백라이트, 공장 보정, 사용 기간, 설정값에 따라 실제 표시 색은 달라질 수 있다.

먼저 모니터가 RGB 서브픽셀의 밝기를 조합해 색을 만든다는 점을 설명한다. 각 모니터는 고유한 primaries, white point, tone response를 가지며, 이 특성을 알아야 정확한 색 표시가 가능하다.

그다음 캘리브레이션과 프로파일링을 구분한다. 캘리브레이션은 모니터를 목표 상태에 맞게 조정하는 과정이고, 프로파일링은 조정된 모니터가 실제로 어떤 색을 내는지 측정해 ICC Profile로 기록하는 과정이다.

OS와 애플리케이션의 컬러 관리 흐름도 설명한다. 이미지에 source profile이 있고, 운영체제가 display profile을 알고 있다면, color managed 애플리케이션은 source profile에서 display profile로 색을 변환해 표시한다. 반대로 unmanaged 애플리케이션은 RGB 값을 그대로 보내므로, wide gamut 모니터에서 sRGB 콘텐츠가 과포화되어 보일 수 있다.

대표 예시는 다음과 같다.

```text
sRGB 이미지 -> Display P3 모니터
```

컬러 관리가 제대로 동작하면 sRGB 이미지의 빨강은 sRGB 기준 빨강으로 보인다. 컬러 관리가 없으면 같은 `RGB(255, 0, 0)` 값이 P3 모니터의 더 강한 빨강으로 표시되어 색이 지나치게 진해질 수 있다.

### Chapter 8. ICC Profile과 컬러 변환 과정

주요 키워드: source profile, destination profile, PCS, CIE XYZ, CIE Lab, rendering intent, gamut mapping, 변환 손실

이 장에서는 ICC Profile이 실제로 색을 어떻게 변환하는지 설명한다. 핵심은 RGB 값을 다른 RGB 값으로 단순 치환하는 것이 아니라, 보통 장치 독립 색공간을 중간 경유지로 사용한다는 점이다.

기본 흐름은 다음과 같다.

```text
Source RGB
-> Source ICC Profile 해석
-> PCS(Profile Connection Space)
-> Destination ICC Profile 변환
-> Destination RGB 또는 CMYK
```

PCS는 보통 CIE XYZ 또는 CIE Lab이다. 즉, sRGB 이미지의 RGB 값은 먼저 그 값이 실제로 어떤 색을 의미하는지로 해석되고, 그 색을 대상 장치에서 가장 가깝게 표현할 수 있는 값으로 다시 변환된다.

이 장에서는 rendering intent도 다룬다. `Relative colorimetric`은 대상 색공간 안에 들어오는 색은 최대한 정확히 유지하고, 벗어나는 색은 경계로 클리핑한다. `Perceptual`은 전체 색 관계를 유지하기 위해 색을 압축하며 사진 이미지에 자주 적합하다. `Absolute colorimetric`은 원본 white point까지 보존하려고 하므로 proofing에서 사용될 수 있다. `Saturation`은 정확도보다 선명도나 채도를 우선하며 차트나 프레젠테이션 그래픽에 쓰일 수 있다.

또한 gamut mapping을 설명한다. source 색공간에는 있지만 destination 색공간에는 없는 색은 그대로 재현할 수 없다. 이때 색을 자르거나, 압축하거나, 주변 색과의 관계를 유지하는 방식으로 변환한다.

이 장의 핵심 메시지는 ICC Profile 변환이 색의 의미를 보존하려는 과정이지만, 대상 장치의 한계 때문에 항상 완전할 수는 없다는 것이다.

### Chapter 9. 인쇄와 ICC Profile

주요 키워드: RGB, CMYK, 가산혼합, 감산혼합, 잉크, 용지, 도트 게인, 총잉크량, soft proofing, black point compensation

이 장에서는 디스플레이 중심의 RGB 색관리와 인쇄 중심의 CMYK 색관리가 어떻게 다른지 설명한다. 모니터는 빛을 내는 장치이고, 인쇄물은 빛을 반사하는 물체다. 따라서 같은 색을 표현하는 방식부터 다르다.

RGB는 가산혼합이다. 빛을 더할수록 밝아진다. CMYK는 감산혼합이다. 잉크가 빛을 흡수하기 때문에 잉크가 더해질수록 어두워진다. 그래서 모니터에서 밝고 선명한 색이 인쇄에서는 재현되지 않을 수 있다.

인쇄용 ICC Profile은 단순히 CMYK 프로파일이라는 이름만으로 설명되지 않는다. 실제로는 프린터 또는 인쇄기, 잉크, 용지, 인쇄 방식, 총잉크량 제한, 도트 게인, 관찰 조명 조건 같은 정보를 포함한 특정 출력 조건의 프로파일이다. 같은 CMYK 값이라도 어떤 인쇄 조건인지에 따라 결과가 달라질 수 있다.

이 장에서는 soft proofing도 다룬다. Soft proofing은 모니터에서 인쇄 결과를 미리 시뮬레이션하는 과정이다. 이때 모니터 캘리브레이션, 인쇄 ICC Profile, rendering intent, black point compensation 등이 중요하다.

대표 흐름은 다음과 같다.

```text
Display P3 이미지
-> 작업용 RGB 색공간
-> 인쇄용 CMYK ICC Profile
-> Soft proof
-> 최종 출력
```

이 장의 결론은 인쇄 색관리가 RGB를 CMYK로 단순 변환하는 일이 아니라, 특정 인쇄 조건에서 가능한 색으로 재해석하는 과정이라는 것이다.

### Chapter 10. 실무에서 자주 생기는 문제들

주요 키워드: 물 빠진 색, 과포화, black level, range mismatch, gamma mismatch, matrix mismatch, 프로파일 누락, 앱별 컬러 관리 차이

이 장은 앞에서 배운 개념을 실제 문제 해결에 연결하는 파트다. 세미나 청중이 가장 직접적으로 체감할 수 있는 장이므로, 가능한 한 실제 사례 중심으로 구성한다.

색이 물 빠져 보이는 문제는 HDR/SDR 해석 오류, range 오류, 잘못된 transfer function, 잘못된 프로파일 변환에서 발생할 수 있다. 색이 너무 진하게 보이는 문제는 sRGB 콘텐츠를 wide gamut 디스플레이에서 unmanaged 상태로 볼 때 자주 발생한다.

검정이 회색처럼 뜨는 문제는 limited range를 full range처럼 읽거나, 반대로 full range를 limited range처럼 처리하는 range mismatch를 의심할 수 있다. 어두운 부분이 뭉개지는 문제도 range mismatch, gamma mismatch, display calibration 문제와 연결된다.

Rec.709와 sRGB를 혼동하는 사례도 다룬다. 두 표준은 primaries와 white point가 거의 같지만, transfer function, 사용 맥락, YCbCr matrix, signal range까지 포함하면 동일하게 취급할 수 없다.

프로파일이 없는 이미지가 앱마다 다르게 보이는 이유도 설명한다. 어떤 프로그램은 프로파일이 없는 이미지를 sRGB로 가정하고, 어떤 프로그램은 디스플레이 RGB처럼 처리할 수 있다. 브라우저, 영상 플레이어, 편집툴의 컬러 관리 지원 수준도 결과 차이에 영향을 준다.

이 장은 최종적으로 문제 진단 방식으로 정리한다. 색 문제가 생겼을 때 색공간 이름만 볼 것이 아니라 primaries, transfer, matrix, range, profile, display 상태를 차례로 확인해야 한다.

### Chapter 11. 정리: Color Space를 읽는 체크리스트

주요 키워드: source color space, metadata, primaries, transfer, matrix, range, target device, rendering intent, 출력 목적

이 장에서는 전체 내용을 하나의 실무 체크리스트로 압축한다. 새로운 이미지, 영상, 모니터, 출력물을 만났을 때 어떤 순서로 확인해야 하는지를 정리한다.

확인할 질문은 다음과 같다.

- 이 콘텐츠의 source color space는 무엇인가?
- Primaries는 무엇인가?
- White point는 무엇인가?
- Transfer characteristic은 무엇인가?
- RGB인가, YCbCr인가?
- YCbCr이라면 matrix coefficients는 무엇인가?
- Full range인가, limited range인가?
- ICC Profile 또는 metadata가 포함되어 있는가?
- 대상 디스플레이나 출력 장치의 gamut은 무엇인가?
- 최종 목적은 화면 표시인가, 영상 납품인가, 인쇄인가?
- 변환 과정에서 gamut 밖 색은 어떻게 처리되는가?

이 장의 목적은 참석자가 세미나 이후에도 스스로 문제를 분석할 수 있게 만드는 것이다.

### Chapter 12. Q&A / 실습 또는 데모

주요 키워드: gamut overlay, profile mismatch, wide gamut, range mismatch, SDR/HDR tone mapping, CMYK 변환, soft proofing

마지막 장은 가능하면 데모 중심으로 구성한다. 색공간은 말로만 설명하면 추상적이기 때문에, 직접 비교 이미지와 변환 결과를 보여주는 편이 효과적이다.

가능한 데모는 다음과 같다.

- CIE xy 색도도 위에 sRGB, Display P3, Rec.2020 삼각형 겹쳐보기
- 같은 RGB 값을 sRGB와 Display P3에서 비교하기
- ICC Profile을 의도적으로 잘못 지정했을 때 색이 어떻게 변하는지 보기
- sRGB 이미지를 wide gamut 환경에서 unmanaged로 볼 때의 과포화 예시
- full range / limited range mismatch 예시
- SDR과 HDR 톤 매핑 차이 보기
- RGB 이미지를 CMYK로 변환하고 gamut warning 확인하기
- soft proofing 전후 비교하기

이 장의 마무리는 색이 틀어졌다는 문제를 감으로만 판단하지 않고, 어느 단계에서 해석이 어긋났는지 추적하는 법으로 연결한다.

## 6. 발표 구성 제안

### 60분 구성

- 0-5분: 세미나 목표와 전체 지도
- 5-15분: 색 인지, CIE XYZ, CIE xy의 생성 배경
- 15-30분: 주요 표준 비교와 color space 구성 요소
- 30-40분: 영상 신호, transfer, matrix, range
- 40-50분: 모니터, ICC Profile, 컬러 변환
- 50-55분: 인쇄와 soft proofing
- 55-60분: 실무 문제 체크리스트와 Q&A

### 90분 구성

- 0-10분: 세미나 목표와 기본 개념
- 10-30분: CIE xy 색도도의 생성 배경
- 30-45분: 주요 컬러 표준 비교와 color space 구성 요소
- 45-60분: 영상 색공간, HDR, range, matrix
- 60-75분: 모니터 컬러 관리와 ICC Profile 변환
- 75-85분: 인쇄 ICC Profile과 soft proofing
- 85-90분: 체크리스트, 데모 요약, Q&A

## 7. 준비하면 좋은 시각 자료

- CIE xy 색도도 기본 이미지
- sRGB, Display P3, Adobe RGB, Rec.2020 gamut 비교 그래프
- CIE RGB 색상 일치 함수와 CIE XYZ 색상 일치 함수 그래프
- RGB에서 XYZ, XYZ에서 xy로 가는 변환 다이어그램
- RGB와 YCbCr 변환 흐름도
- full range / limited range mismatch 예시 이미지
- SDR gamma, PQ, HLG 곡선 비교
- sRGB 콘텐츠를 wide gamut 모니터에서 잘못 표시한 예시
- ICC Profile 변환 파이프라인 다이어그램
- RGB gamut과 CMYK gamut 비교 이미지
- soft proofing 전후 비교 화면

## 8. 최종 메시지

Color space는 특정 표준 이름 하나가 아니라 색을 정의하는 여러 약속의 조합이다. 색 문제가 발생했을 때는 `primaries`, `white point`, `transfer`, `matrix`, `range`, `profile`, `target device`를 분리해서 확인해야 한다.

세미나의 최종 목표는 참석자가 색공간을 시각 자료로만 이해하는 데서 멈추지 않고, 실제 영상 처리, 모니터 표시, 이미지 편집, 인쇄 워크플로에서 색이 어떻게 해석되고 변환되는지를 설명할 수 있게 만드는 것이다.
