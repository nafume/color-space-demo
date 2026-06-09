# [Draft] 1회차 Chapter 7. 색공간 변환의 기본 원리

## 학습 목표

이 장의 목표는 색공간 변환(color space conversion)을 "RGB 숫자를 다른 RGB 숫자로 바로 바꾸는 일"이 아니라, 입력 색공간(source color space)의 RGB 값을 실제 색의 의미로 해석한 뒤 대상 색공간(target color space)에서 다시 표현하는 과정으로 이해하는 것이다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- 비선형 RGB(non-linear RGB)를 왜 먼저 선형 RGB(linear RGB)로 풀어야 하는가
- RGB에서 CIE XYZ로 변환할 때 원색(color primaries)과 화이트 포인트(white point)가 어떤 역할을 하는가
- 화이트 포인트가 다를 때 색순응 변환(chromatic adaptation)이 왜 필요한가
- 대상 RGB 색공간으로 돌아갈 때 어떤 단계를 거치는가
- 색역(gamut) 밖 색이 생겼을 때 클리핑(clipping)과 색역 매핑(gamut mapping)이 왜 문제가 되는가

## 핵심 질문

- sRGB의 `R=128`은 빛의 세기가 절반이라는 뜻인가?
- RGB 값을 바로 행렬에 넣어 다른 RGB 값으로 바꾸면 왜 위험한가?
- 색공간 변환에서 CIE XYZ는 어떤 중간 기준점 역할을 하는가?
- D65 기반 RGB 색공간과 D50 기반 PCS(Profile Connection Space)를 연결하려면 무엇이 필요한가?
- 변환 결과가 대상 색공간 밖으로 나가면 어떤 선택을 해야 하는가?
- 모든 색공간 변환이 항상 같은 순서로만 진행되는가?

## 상세 설명

### 1. 색공간 변환은 숫자의 번역이 아니라 색 의미의 재표현이다

색공간 변환(color space conversion)의 핵심은 입력 RGB 값을 대상 RGB 값으로 기계적으로 바꾸는 것이 아니다. 먼저 입력 값이 어떤 색공간(color space) 안에서 어떤 측색적 색(colorimetric color)을 의미하는지 해석하고, 그 색을 대상 색공간의 규칙으로 다시 표현한다.

가장 단순화한 흐름은 다음과 같다.

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

이 흐름은 교육용 기본형이다. 실제 컬러 관리(color management) 시스템에서는 ICC 프로파일(ICC Profile)의 LUT, 디바이스 링크 프로파일(device link profile), 영상 파이프라인의 YCbCr 변환, HDR 톤매핑(tone mapping), 색역 매핑(gamut mapping)이 끼어들 수 있다. 따라서 중요한 것은 "항상 이 한 가지 순서만 있다"가 아니라, 각 단계가 어떤 문제를 해결하는지 이해하는 것이다.

### 2. 비선형 RGB(Non-linear RGB)를 선형 RGB(Linear RGB)로 푼다

대부분의 일반 이미지 파일에 저장된 RGB 값은 선형광(linear light)이 아니다. sRGB, Rec.709, Display P3 같은 워크플로에서는 사람의 밝기 지각과 신호 효율을 고려해 코드값(code value)에 전송 함수(transfer function)를 적용한다. 그래서 파일의 `R=128`은 물리적으로 `R=255`의 절반 밝기라는 뜻이 아니다.

행렬 기반 RGB to XYZ 변환은 보통 선형 RGB(linear RGB)를 전제로 한다. 따라서 먼저 입력 색공간의 역전송 함수(inverse transfer function)를 적용해 비선형 RGB(non-linear RGB)를 선형 RGB로 풀어야 한다.

```text
encoded RGB = 파일에 저장된 비선형 코드값
linear RGB  = 빛의 선형 조합 계산에 쓰는 값
```

이 단계를 생략하면 색의 혼합과 행렬 변환이 물리적 의미를 잃는다. 특히 중간 톤과 채도가 의도와 다르게 변할 수 있다.

### 3. RGB에서 CIE XYZ로 변환한다

선형 RGB를 얻은 뒤에는 입력 색공간의 원색(color primaries)과 화이트 포인트(white point)를 바탕으로 CIE XYZ로 변환한다. RGB 색공간은 R, G, B 원색이 CIE xy 색도도(CIE xy chromaticity diagram)에서 어디에 있는지, 그리고 흰색 기준이 무엇인지 정의한다. 이 정보로 RGB와 XYZ 사이의 변환 행렬(matrix)을 만들 수 있다.

예를 들어 sRGB와 Display P3는 둘 다 보통 D65 화이트 포인트(D65 white point)를 사용하지만, 원색 위치가 다르다. 따라서 같은 선형 RGB 값이라도 XYZ로 변환하면 다른 색을 가리킬 수 있다. 반대로 어떤 XYZ 색을 각 색공간의 RGB로 표현하면 서로 다른 RGB 숫자가 나올 수 있다.

CIE XYZ는 여기서 장치 독립(device-independent)에 가까운 중간 좌표 역할을 한다. 입력 장치나 출력 장치의 RGB 숫자를 직접 비교하는 대신, 색의 측색적 의미를 공통 좌표로 옮겨 놓는 것이다.

### 4. 화이트 포인트(White Point)가 다르면 색순응 변환(Chromatic Adaptation)을 고려한다

입력 색공간과 대상 색공간의 화이트 포인트가 같다면 RGB to XYZ와 XYZ to RGB를 비교적 직접 연결할 수 있다. 그러나 화이트 포인트가 다르면 문제가 생긴다. 예를 들어 D65 기준 RGB 색공간에서 D50 기준 ICC PCS(Profile Connection Space)로 들어가거나, D50 기반 인쇄 프로파일로 변환할 때는 흰색 기준이 달라진다.

이때 색순응 변환(chromatic adaptation)을 사용한다. 대표적으로 Bradford 변환(Bradford transform) 같은 방법이 쓰인다. 목적은 관찰자가 서로 다른 조명 조건에 적응한다는 사실을 반영해, 한 화이트 포인트 기준의 XYZ 값을 다른 화이트 포인트 기준으로 옮기는 것이다.

단, 색순응 변환은 "색을 예쁘게 보정하는 필터"가 아니다. 기준 백색(reference white)이 다른 두 색공간 사이에서 측색적 의미를 연결하기 위한 단계다.

### 5. XYZ에서 대상 RGB로 변환한다

화이트 포인트 기준이 맞춰졌다면 대상 색공간의 원색과 화이트 포인트 정의를 사용해 XYZ를 대상 선형 RGB(target linear RGB)로 변환한다. 이 단계는 앞의 RGB to XYZ 변환의 반대 방향이라고 볼 수 있다.

하지만 여기서 항상 모든 값이 `0.0`에서 `1.0` 사이에 들어오지는 않는다. 대상 색공간이 표현할 수 없는 색은 음수 RGB나 1보다 큰 RGB로 나타날 수 있다. 예를 들어 Display P3의 강한 빨강이나 초록 일부는 sRGB로 변환할 때 sRGB 색역 밖에 있을 수 있다.

이 지점에서 색공간 변환은 단순 계산을 넘어 선택의 문제가 된다. 대상 색공간 밖 색을 어떻게 다룰지 결정해야 한다.

### 6. 대상 전송 함수(Target Transfer)를 적용한다

대상 선형 RGB를 얻었다고 해서 파일에 바로 저장할 준비가 끝난 것은 아니다. 일반적인 이미지와 영상 파일은 선형 RGB 그대로 저장되지 않고, 대상 색공간의 전송 함수(transfer function)를 거친 코드값(code value)으로 저장된다.

따라서 마지막에는 대상 색공간의 전송 함수를 적용한다. 예를 들어 sRGB로 저장하려면 sRGB의 opto-electronic 성격을 가진 인코딩 곡선을 적용해 선형 RGB를 sRGB 코드값으로 만든다. 이 결과가 최종 Target RGB가 된다.

### 7. 클리핑(Clipping)과 색역 매핑(Gamut Mapping)

대상 RGB로 변환한 값이 범위를 벗어나면 가장 단순한 처리는 클리핑(clipping)이다.

```text
R < 0이면 0으로
R > 1이면 1로
G, B도 같은 방식으로 제한
```

클리핑은 단순하고 예측 가능하지만, 색상(hue)이나 디테일(detail)을 망가뜨릴 수 있다. 넓은 색역(wide color gamut)에서 좁은 색역으로 변환할 때 채도 높은 색들이 한쪽 경계에 달라붙어 뭉개질 수 있다.

색역 매핑(gamut mapping)은 색역 밖 색을 대상 색역 안으로 더 의도적으로 옮기는 방법이다. 예를 들어 전체 색 관계를 압축하거나, 색상은 최대한 유지하면서 채도를 낮추거나, 특정 색 영역의 디테일을 살리는 방식이 있다. ICC 기반 변환에서는 렌더링 의도(rendering intent)가 이 선택과 연결된다.

## 용어 노트

### 비선형 RGB(Non-linear RGB)

파일이나 신호에 저장된 RGB 코드값처럼 전송 함수(transfer function)가 적용된 RGB 값이다. 일반적인 sRGB 이미지의 RGB 값은 선형광 값이 아니다.

### 선형 RGB(Linear RGB)

빛의 선형 조합 계산에 쓰는 RGB 값이다. RGB to XYZ 행렬 변환과 물리적 색 혼합 계산은 보통 선형 RGB를 전제로 한다.

### 전송 함수(Transfer Function)

선형광(linear light)과 코드값(code value) 사이의 관계를 정의하는 함수다. 색공간 변환에서는 입력 쪽 역전송 함수(inverse transfer function)와 출력 쪽 대상 전송 함수(target transfer function)를 구분해야 한다.

### CIE XYZ

색공간 변환에서 공통 기준으로 자주 쓰이는 장치 독립(device-independent) 색공간이다. RGB 원색과 화이트 포인트 정의를 바탕으로 RGB와 XYZ 사이를 오갈 수 있다.

### 색순응 변환(Chromatic Adaptation)

서로 다른 화이트 포인트(white point) 기준 사이에서 색의 측색적 의미를 연결하기 위한 변환이다. ICC 워크플로에서는 D50 PCS와 연결될 때 자주 등장한다.

### 클리핑(Clipping)

변환 결과가 대상 RGB 범위를 벗어났을 때 값을 최소/최대 범위로 잘라내는 처리다. 단순하지만 색상과 디테일 손실이 생길 수 있다.

### 색역 매핑(Gamut Mapping)

대상 색공간이 표현할 수 없는 색을 색역(gamut) 안으로 옮기는 전략이다. 렌더링 의도(rendering intent), 작업 목적, 이미지 내용에 따라 선택이 달라진다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `RGB에서 XYZ로`: [CIE 1931 XYZ color matching functions](https://commons.wikimedia.org/wiki/File:CIE_1931_XYZ_Color_Matching_Functions.svg) - 장치 의존 RGB를 장치 독립 CIE XYZ로 옮긴다는 설명에 사용.
- `gamut 차이와 clipping`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - 넓은 색역에서 좁은 색역으로 변환할 때 gamut mapping이 필요한 이유를 보여준다.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `감마 해제와 재적용`: [Linear distribution versus gamma corrected distribution](https://commons.wikimedia.org/wiki/File:Linear_Distribution_versus_Gamma_Corrected_Distribution.svg) - inverse transfer와 target transfer의 의미를 시각화할 때 적합.

## 실무 예시와 데모 아이디어

### 예시 1. sRGB 빨강과 Display P3 빨강 비교

같은 `RGB = (255, 0, 0)`을 sRGB와 Display P3로 각각 해석해 CIE xy 좌표가 다르다는 점을 보여준다. RGB 숫자가 같아도 원색(primary)이 다르면 측색적 색이 달라진다는 메시지를 전달하기 좋다.

### 예시 2. 감마 공간에서 평균낸 색과 선형 공간에서 평균낸 색

검정과 흰색을 50%로 섞는 예시를 든다. 코드값을 단순 평균하면 중간 회색처럼 보이지만, 선형광에서 평균한 뒤 다시 인코딩하면 다른 값이 나온다. 이 데모는 "계산은 선형광에서 해야 한다"는 원칙을 직관적으로 보여준다.

### 예시 3. Display P3 이미지를 sRGB로 변환할 때의 클리핑

Display P3의 고채도 초록이나 빨강 패치를 sRGB로 변환한다. 클리핑 처리와 색역 매핑 처리를 비교해 색상 변화, 채도 손실, 디테일 손실을 관찰한다.

### 예시 4. D65와 D50 화이트 포인트 연결

sRGB(D65) 이미지를 인쇄용 ICC 프로파일(D50 PCS 기반)로 변환하는 과정을 보여준다. 이때 색순응 변환(chromatic adaptation)이 왜 숨어 있는지 설명한다.

## 추천 진행 흐름

### 1. "RGB를 바로 바꾸지 않는다"로 시작하기

처음에는 색공간 변환의 핵심 메시지를 한 문장으로 제시한다. "RGB 숫자를 바로 다른 RGB 숫자로 바꾸는 것이 아니라, 색의 의미를 해석한 뒤 다시 표현한다"는 문장을 장 전체의 기준으로 삼는다.

### 2. 기본 파이프라인을 그림처럼 보여주기

`Source RGB -> inverse transfer -> linear RGB -> XYZ -> chromatic adaptation -> target linear RGB -> target transfer -> Target RGB` 흐름을 보여준다. 단, 이 순서가 모든 상황의 유일한 정답은 아니며 교육용 단순화임을 함께 말한다.

### 3. 선형화의 필요성을 강조하기

sRGB 코드값이 선형 밝기가 아니라는 점을 예시로 설명한다. 행렬 변환과 색 혼합은 선형 RGB에서 수행해야 한다는 원칙을 잡아 준다.

### 4. XYZ와 화이트 포인트를 연결하기

RGB 원색과 화이트 포인트가 RGB to XYZ 행렬을 만든다는 점을 설명한다. 그 다음 D65와 D50 예시로 색순응 변환(chromatic adaptation)을 소개한다.

### 5. 마지막에 색역 밖 문제를 다루기

대상 RGB 값이 범위를 벗어나는 순간부터는 단순 수학이 아니라 표현 전략이 필요하다고 설명한다. 클리핑(clipping), 색역 매핑(gamut mapping), 렌더링 의도(rendering intent)를 다음 장과 연결한다.

## 짧은 마무리 요약

색공간 변환(color space conversion)은 입력 RGB 값을 선형화하고, CIE XYZ 같은 공통 좌표로 해석한 뒤, 필요하면 화이트 포인트를 맞추고, 대상 색공간의 RGB와 전송 함수로 다시 표현하는 과정이다. 이 흐름은 색의 의미를 보존하기 위한 기본 구조다.

다만 실제 변환은 항상 하나의 고정된 순서로만 이루어지지 않는다. ICC 프로파일, LUT, 영상 메타데이터, HDR 톤매핑, 색역 매핑이 개입할 수 있다. 중요한 것은 각 단계가 해결하는 질문을 아는 것이다. "이 값은 어떤 색을 뜻하는가?", "대상 색공간은 그 색을 표현할 수 있는가?", "표현할 수 없다면 어떻게 옮길 것인가?"가 색공간 변환의 핵심 질문이다.
