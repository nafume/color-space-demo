# [Draft] 1회차 Chapter 12. 실습: 색공간 변환

## 학습 목표

이 장의 목표는 1회차에서 배운 색공간(color space), ICC 프로파일(ICC Profile), 렌더링 의도(rendering intent), 색역(gamut), CMYK 변환을 실제 도구로 확인하는 것이다. 실습의 핵심은 "같은 RGB 값이 항상 같은 색이 아니다"와 "프로파일을 할당(assign)하는 것과 변환(convert)하는 것은 다르다"를 눈으로 확인하는 데 있다.

이 장을 마치면 청중은 다음을 수행할 수 있어야 한다.

- sRGB와 Display P3 사이의 변환 결과를 비교한다
- assign profile과 convert to profile의 차이를 설명한다
- 색역 밖 색의 클리핑(clipping)과 색역 매핑(gamut mapping)을 관찰한다
- 렌더링 의도(rendering intent)에 따른 결과 차이를 비교한다
- 같은 RGB 값이 다른 색공간에서 다른 색으로 해석되는 것을 확인한다
- RGB 이미지를 CMYK 프로파일로 변환하고 gamut warning과 soft proofing을 확인한다
- ImageMagick, LittleCMS, Python colour-science, browser Canvas 같은 도구의 역할을 구분한다

## 핵심 질문

- sRGB 이미지를 Display P3로 변환하면 RGB 숫자는 왜 바뀔 수 있는가?
- Display P3 이미지를 sRGB로 변환할 때 어떤 색이 잘릴 수 있는가?
- 프로파일을 잘못 할당하면 색이 왜 갑자기 달라지는가?
- 같은 `RGB=(255,0,0)`을 sRGB와 Display P3로 해석하면 어떤 차이가 있는가?
- RGB에서 CMYK로 변환할 때 목적지 프로파일을 바꾸면 왜 CMYK 값이 달라지는가?
- gamut warning과 soft proofing은 각각 무엇을 알려주는가?

## 상세 설명

### 1. 실습의 목적

이번 실습은 색공간 변환(color space conversion)의 수식을 외우는 시간이 아니다. 목적은 색값(color value), 프로파일(profile), 색공간(color space), 출력 조건(output condition)이 결과 색에 어떤 영향을 주는지 직접 관찰하는 것이다.

실습에서 반복해서 확인할 메시지는 다음 세 가지다.

```text
1. RGB 숫자는 색공간 안에서 의미를 갖는다.
2. Assign profile과 Convert to profile은 완전히 다른 작업이다.
3. 대상 색공간이 표현할 수 없는 색은 clipping 또는 gamut mapping이 필요하다.
```

가능하면 하나의 샘플 이미지를 여러 도구에서 반복해서 다룬다. 같은 현상을 다른 도구로 확인하면 개념이 더 잘 고정된다.

### 2. 후보 워크플로 1: sRGB <-> Display P3 변환

첫 번째 실습은 sRGB 이미지를 Display P3로 변환하고, 다시 Display P3 이미지를 sRGB로 변환하는 것이다.

관찰 포인트는 다음과 같다.

- 변환 후 RGB 숫자가 바뀌는가
- 색관리된 뷰어에서 겉보기 색이 최대한 유지되는가
- 프로파일이 포함되어 있는가
- Display P3에서 sRGB로 갈 때 색역 밖 색이 생기는가

단순한 색 패치 이미지를 쓰면 차이를 이해하기 쉽다. 예를 들어 sRGB 빨강, 초록, 파랑과 Display P3의 고채도 빨강/초록 패치를 함께 준비한다.

### 3. 후보 워크플로 2: Assign vs Convert

프로파일 할당(assign profile)과 프로파일 변환(convert to profile)은 실무에서 가장 많이 혼동하는 작업이다.

실습은 다음처럼 구성할 수 있다.

```text
원본: sRGB 프로파일이 붙은 이미지
실험 A: RGB 숫자는 그대로 두고 Display P3 프로파일을 assign
실험 B: sRGB에서 Display P3로 convert
```

실험 A에서는 숫자가 그대로인데 색의 의미가 바뀐다. 그래서 화면에서 색이 달라져 보일 수 있다. 실험 B에서는 색의 의미를 유지하려고 RGB 숫자가 바뀐다. 색관리된 환경에서는 겉보기 색이 크게 유지되어야 한다.

이 실습 하나로 "프로파일은 라벨이면서 동시에 변환의 기준"이라는 점을 설명할 수 있다. 라벨을 잘못 붙이면 같은 숫자가 다른 색으로 읽힌다.

### 4. 후보 워크플로 3: RGB Same Value, Different Spaces

같은 RGB 값을 서로 다른 색공간에서 해석하는 실습이다. 예를 들어 다음 패치를 만든다.

```text
Patch A: RGB=(255, 0, 0), profile=sRGB
Patch B: RGB=(255, 0, 0), profile=Display P3
```

두 패치는 RGB 숫자가 같지만, 원색(color primaries)이 다르기 때문에 같은 측색적 색(colorimetric color)이 아니다. 색관리된 환경에서는 Display P3 빨강이 sRGB 빨강보다 더 넓은 색역의 빨강으로 보일 수 있다. 단, 실제 차이는 사용하는 디스플레이가 P3 색역을 얼마나 지원하는지에 따라 달라진다.

### 5. 후보 워크플로 4: Gamut Clipping 확인

Display P3나 Rec.2020 쪽의 채도 높은 색을 sRGB로 변환한다. 대상 sRGB가 표현할 수 없는 색은 색역 밖(out of gamut)이 된다.

가장 단순한 처리는 클리핑(clipping)이다. RGB 값이 0보다 작거나 1보다 크면 범위 안으로 잘라낸다. 이 경우 여러 다른 색이 같은 경계 색으로 붙어 디테일이 사라질 수 있다.

실습에서는 색 패치나 그라데이션을 사용하면 좋다. 넓은 색역에서 좁은 색역으로 갈 때, 특정 구간이 갑자기 평평해지거나 채도 변화가 사라지는지 관찰한다.

### 6. 후보 워크플로 5: Rendering Intent 비교

ICC 변환에서 렌더링 의도(rendering intent)를 바꿔 결과를 비교한다.

비교 후보는 다음과 같다.

- relative colorimetric
- perceptual
- absolute colorimetric
- saturation

사진 이미지에서는 perceptual이 전체 인상을 더 자연스럽게 유지할 수 있고, relative colorimetric은 색역 안 색을 더 정확히 유지하면서 색역 밖 색을 경계로 보낼 수 있다. 하지만 실제 결과는 프로파일과 CMM(Color Management Module)에 의존한다. 따라서 실습에서는 "항상 perceptual이 더 좋다"가 아니라 "렌더링 의도는 색역 밖 색을 다루는 정책이며 결과는 프로파일에 따라 달라진다"로 정리해야 한다.

### 7. 후보 워크플로 6: RGB -> CMYK Profile 변환

RGB 이미지를 특정 CMYK 인쇄 프로파일(print ICC profile)로 변환한다. 가능하면 코팅지(coated)와 비코팅지(uncoated) 프로파일을 비교한다.

관찰 포인트는 다음과 같다.

- CMYK 숫자가 목적지 프로파일에 따라 달라지는가
- 채도 높은 RGB 색이 CMYK에서 어떻게 줄어드는가
- 총잉크량(total ink coverage)이 제한되는가
- K 채널이 어떻게 생성되는가

이 실습은 CMYK가 RGB의 단순 inverse가 아니라는 점을 확인하는 데 좋다.

### 8. 후보 워크플로 7: Gamut Warning과 Soft Proofing

gamut warning은 현재 목적지 색공간이나 출력 프로파일에서 표현할 수 없는 색을 표시해 준다. 예를 들어 RGB 이미지에서 인쇄용 CMYK 프로파일을 대상으로 gamut warning을 켜면, 인쇄에서 재현하기 어려운 고채도 색 영역이 표시될 수 있다.

소프트 프루핑(soft proofing)은 선택한 출력 조건을 화면에서 시뮬레이션하는 것이다. 인쇄 프로파일을 선택하고 paper color, black ink, rendering intent를 반영하면 화면의 이미지가 더 낮은 대비와 낮은 채도로 보일 수 있다. 이것은 문제가 아니라 인쇄물의 물리적 한계를 미리 보여주는 것이다.

## 도구 후보

### ImageMagick

ImageMagick은 이미지 변환과 프로파일 적용을 빠르게 실험하기 좋다. `magick` 명령으로 프로파일을 붙이거나 변환하고, 결과 파일의 프로파일 정보를 확인할 수 있다.

예시 흐름:

```text
이미지 프로파일 확인
sRGB -> Display P3 변환
Display P3 -> sRGB 변환
RGB -> CMYK 프로파일 변환
```

명령어는 사용 환경의 ICC 프로파일 경로에 따라 달라지므로, 세미나 자료에는 경로를 변수처럼 표기하는 편이 안전하다.

### LittleCMS

LittleCMS는 ICC 변환을 직접 다루는 데 적합한 라이브러리와 도구를 제공한다. `transicc`, `tificc`, `jpgicc` 같은 도구를 사용하면 소스 프로파일, 목적지 프로파일, 렌더링 의도를 명시해 변환을 실험할 수 있다.

LittleCMS는 "ICC 프로파일 기반 변환이 실제로 어떤 입력을 받는가"를 보여주기 좋다.

### Python colour-science

Python의 colour-science 라이브러리는 색공간 변환 수식과 CIE 좌표를 직접 확인하기 좋다. sRGB와 Display P3의 primaries, RGB to XYZ matrix, chromatic adaptation 같은 계산을 노트북에서 단계별로 보여줄 수 있다.

이 도구는 시각적 파일 변환보다 "왜 이런 숫자가 나오는가"를 설명하는 데 적합하다.

### Browser Canvas

브라우저 Canvas는 웹에서 sRGB와 Display P3 표시 차이를 보여주는 데 사용할 수 있다. 최신 브라우저는 CSS Color와 canvas color space 옵션을 일부 지원하므로, 같은 RGB 값이 어떤 색공간에서 해석되는지 데모할 수 있다.

다만 브라우저와 디스플레이의 wide-gamut 지원 여부에 따라 결과가 달라질 수 있다. 따라서 실습 전에 사용 환경을 확인해야 한다.

## 용어 노트

### Assign Profile

RGB 또는 CMYK 숫자는 그대로 두고, 그 숫자를 어떤 색공간으로 해석할지 지정하는 작업이다. 잘못 assign하면 색이 의도와 다르게 보인다.

### Convert to Profile

입력 색의 의미를 가능한 한 유지하면서 대상 색공간의 새 숫자를 계산하는 작업이다. 변환 후 RGB/CMYK 숫자는 바뀔 수 있다.

### Gamut Warning

목적지 색공간이나 출력 프로파일에서 재현할 수 없는 색을 표시해 주는 기능이다. 인쇄 전 프루핑이나 wide-gamut to sRGB 변환에서 유용하다.

### Soft Proofing

선택한 출력 조건을 화면에서 미리 시뮬레이션하는 작업이다. 모니터 프로파일과 출력 ICC 프로파일이 모두 중요하다.

### Rendering Intent

색역 밖 색을 대상 색공간 안으로 옮길 때 어떤 기준을 우선할지 정하는 정책이다. relative colorimetric, perceptual, absolute colorimetric, saturation이 대표적이다.

### Clipping

변환 결과가 대상 RGB 범위를 벗어났을 때 값을 잘라내는 처리다. 단순하지만 색 디테일을 잃을 수 있다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `실습 목표 시각화`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - 입력/출력 색공간의 gamut 차이를 실습 전에 보여준다.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)
- `감마/선형 변환`: [sRGB gamma curve](https://commons.wikimedia.org/wiki/File:SRGB_gamma.svg) - inverse transfer를 빼먹으면 결과가 달라지는 이유를 설명한다.
  ![sRGB gamma curve](../assets/images/SRGB_gamma.thumb.png)
- `색공간 변환 참조`: [ICC profile overview](https://www.color.org/iccprofile.xalter) - 수동 행렬 변환과 ICC 기반 변환의 관점을 비교할 때 사용.

## 실무 예시와 데모 아이디어

### 데모 1. 색 패치 세트 만들기

sRGB 기본색, Display P3 고채도 색, 회색 그라데이션, 피부톤에 가까운 색을 포함한 작은 테스트 이미지를 만든다. 여러 변환에서 같은 샘플을 반복 사용하면 비교가 쉬워진다.

### 데모 2. 프로파일 제거 후 다시 할당하기

이미지에서 ICC 프로파일을 제거한 버전, sRGB로 assign한 버전, Display P3로 assign한 버전을 비교한다. 프로파일이 없는 RGB 파일이 왜 위험한지 보여준다.

### 데모 3. 변환 전후 RGB 숫자 샘플링

같은 픽셀 위치의 RGB 값을 변환 전후로 기록한다. 겉보기 색을 유지하려고 숫자가 바뀐다는 점을 명확히 보여준다.

### 데모 4. CMYK 총잉크량 확인

RGB에서 CMYK로 변환한 뒤 어두운 영역의 C+M+Y+K 합을 확인한다. 프로파일이 total ink limit을 어떻게 반영하는지 관찰한다.

## 추천 진행 흐름

### 1. 실습 목표를 세 문장으로 고정하기

RGB 숫자는 색공간 안에서 의미를 갖고, assign과 convert는 다르며, 색역 밖 색은 정책이 필요하다고 먼저 말한다. 이후 모든 실습을 이 세 문장에 연결한다.

### 2. 같은 RGB 값, 다른 색공간부터 보여주기

가장 직관적인 예시로 시작한다. `RGB=(255,0,0)`이 sRGB와 Display P3에서 다른 색이라는 점을 보여주면 이후 변환의 필요성이 자연스럽게 생긴다.

### 3. Assign vs Convert를 실습의 중심에 놓기

청중이 실무에서 바로 써먹을 수 있는 차이다. 숫자는 그대로인데 의미가 바뀌는 assign, 의미를 유지하려고 숫자가 바뀌는 convert를 나란히 보여준다.

### 4. Gamut 문제로 확장하기

Display P3에서 sRGB로 갈 때 색역 밖 색이 생기는 예시를 보여준다. 클리핑과 렌더링 의도 비교를 연결한다.

### 5. RGB to CMYK와 soft proof로 마무리하기

마지막에는 출력 조건이 들어오는 순간 변환이 더 복잡해진다는 점을 보여준다. CMYK 프로파일, gamut warning, soft proofing을 통해 다음 실무 단계로 이어진다.

## 짧은 마무리 요약

이번 실습의 핵심은 RGB 숫자와 색의 의미를 분리해서 보는 것이다. 같은 RGB 값도 sRGB와 Display P3에서 다른 색을 의미할 수 있고, 색을 유지하려면 단순히 프로파일을 붙이는 것이 아니라 올바른 프로파일 변환(convert to profile)이 필요하다.

넓은 색역에서 좁은 색역으로 변환하면 대상이 표현할 수 없는 색이 생길 수 있다. 이때 클리핑(clipping), 색역 매핑(gamut mapping), 렌더링 의도(rendering intent), gamut warning, soft proofing이 중요해진다. RGB에서 CMYK로 갈 때는 특히 인쇄용 ICC 프로파일(print ICC profile)과 출력 조건을 반드시 확인해야 한다.
