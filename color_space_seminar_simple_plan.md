# Color Space 세미나 Simple Plan

## 전체 방향

세미나는 2회차로 나누어 진행한다.

```text
1회차: 색채와 색공간 변환
2회차: 밝기, 컬러 볼륨, HDR 파이프라인
```

도입에서는 컬러를 한 번에 설명하지 않고 두 관점으로 나누어 다룬다는 점을 먼저 밝힌다. 1회차에서는 CIE xy 색도도 위에서 색의 위치와 색공간 변환을 다루고, 2회차에서는 밝기 축을 더해 컬러 볼륨, Gamma, HDR, 톤매핑을 다룬다.

주의할 표현:

```text
권장: 컬러를 색도/색공간 관점과 밝기/컬러 볼륨 관점으로 나누어 본다.
주의: 컬러는 색채와 볼륨으로 구성된다.
```

`color volume`은 색 자체의 구성요소라기보다, 디스플레이나 시스템이 색을 어느 밝기까지 재현할 수 있는지를 3차원으로 표현한 개념이다. 따라서 1회차는 "어떤 색인가", 2회차는 "그 색을 얼마나 밝게, 어떤 신호와 장치에서 재현할 수 있는가"를 다룬다고 설명한다.

1회차는 색을 좌표계와 표준으로 이해하고, 실제 색공간 변환까지 다룬다.
2회차는 밝기 재현, Gamma, HDR, 컬러 볼륨, 촬영부터 디스플레이까지의 파이프라인을 다루고, 마지막에 색공간 변환과 톤매핑을 함께 실습한다.

---

## 1회차. 색채와 색공간 변환

### 목표

색을 숫자로 표현하기 위한 좌표계와 표준을 이해하고, 색공간 변환이 어떤 과정으로 이루어지는지 설명할 수 있게 한다.

핵심 메시지:

> 색공간 변환은 RGB 숫자를 단순히 바꾸는 일이 아니라, 색의 의미를 장치 독립 좌표로 해석한 뒤 대상 색공간에 다시 표현하는 과정이다.

### Chapter 1. 왜 Color Space를 알아야 하는가

- 컬러를 두 관점으로 나누어 다룬다는 전체 프레임
  - 1회차: CIE xy 색도도, 색의 위치, 색공간 변환
  - 2회차: 밝기 축, 컬러 볼륨, Gamma, HDR, 톤매핑
- 같은 RGB 값이 왜 다른 색으로 보이는가
- 색값과 색공간의 차이
- 장치 의존 색과 장치 독립 색
- 세미나 전체 지도

### Chapter 2. 인간의 색 인지와 삼색 이론

- 빛의 스펙트럼
- 인간 시각과 원추세포
- 삼색 색채 이론
- 색상 매칭의 기본 아이디어

### Chapter 3. CIE XYZ와 CIE xy 색도도는 어떻게 만들어졌나

- 1924 광효율 함수 `V(lambda)`
- 라이트-길드 색상 매칭 실험
- CIE RGB 색상 일치 함수
- 음수 RGB 문제
- CIE XYZ의 등장
- `Y`와 상대 휘도
- XYZ에서 xy로의 변환

### Chapter 4. CIE xy 색도도에서 CIE Lab까지

- CIE xy 색도도의 장점과 한계
- xy는 색도를 보여주지만 지각적 거리와 밝기 차이를 직접 표현하기 어려움
- CIE XYZ에서 지각적으로 더 균일한 공간이 필요해진 배경
- CIE Lab의 기본 아이디어
  - `L*`: lightness
  - `a*`: green-red 축
  - `b*`: blue-yellow 축
- CIE Lab은 장치 독립 색공간이며 색차 계산과 프로파일 변환에서 중요하게 쓰임
- `Delta E` 개념 소개
- CIE XYZ와 CIE Lab의 관계

### Chapter 5. CIE xy 색도도로 색공간 읽기

- spectral locus
- 비분광색
- gamut triangle
- color primaries
- white point
- sRGB, Rec.709, Display P3, Adobe RGB, Rec.2020 비교
- CIE xy의 한계: 밝기 정보 없음

### Chapter 6. Color Space를 구성하는 요소들

- color primaries
- white point
- transfer characteristics
- matrix coefficients
- color range
  - full range
  - limited range
  - 영상 신호에서 range 해석이 중요한 이유
- ICC Profile
- color volume은 2회차 예고로 가볍게 소개

### Chapter 7. 색공간 변환의 기본 원리

- RGB 값은 바로 변환하지 않는다
- 비선형 RGB를 선형 RGB로 변환
- RGB에서 XYZ로 변환
- white point adaptation
- XYZ에서 target RGB로 변환
- target transfer 적용
- clipping과 gamut mapping

기본 흐름:

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

### Chapter 8. RGB와 CMYK: 디스플레이 색과 인쇄 색의 차이

- RGB는 가산혼합
  - 모니터는 빛을 직접 냄
  - 빛을 더할수록 밝아짐
- CMYK는 감산혼합
  - 인쇄물은 조명을 반사함
  - 잉크가 빛을 흡수하기 때문에 잉크를 더할수록 어두워짐
- CMYK는 RGB의 단순한 반대가 아님
- 같은 CMYK 값도 인쇄 조건에 따라 다른 색이 될 수 있음
  - 인쇄기
  - 잉크
  - 용지
  - 스크리닝/망점
  - 관찰 조명
- RGB gamut과 CMYK gamut의 차이
- 총잉크량 제한
- black generation
- GCR / UCR
- rich black과 registration black
- spot color와 process color
- soft proofing의 의미
- 인쇄용 ICC Profile이 필요한 이유

핵심 정리:

> CMYK 변환은 RGB 값을 단순히 네 개의 잉크 값으로 바꾸는 일이 아니라, 특정 인쇄 조건에서 재현 가능한 색으로 다시 해석하는 과정이다.

### Chapter 9. ICC Profile 기반 변환

- source profile
- destination profile
- PCS: CIE XYZ 또는 CIE Lab
- ICC v2/v4의 PCS는 D50 기준
- “ICC Profile은 CIE Lab을 PCS로 사용한다”는 표현은 일부 경우에는 맞지만, 정확히는 CIE Lab 또는 CIE XYZ를 PCS로 사용할 수 있음
- rendering intent
- relative colorimetric
- perceptual
- absolute colorimetric
- saturation
- 모니터 프로파일과 인쇄 프로파일

### Chapter 10. ICC Profile 상세 스펙 읽기

- ICC profile header
- profile/device class
- data color space
- PCS field: `Lab` 또는 `XYZ`
- profile version
- rendering intent
- illuminant / D50 PCS
- tag table
- 주요 tag
  - `rXYZ`, `gXYZ`, `bXYZ`
  - `rTRC`, `gTRC`, `bTRC`
  - `wtpt`
  - `chad`
  - `A2B0`, `B2A0`
  - `desc`, `cprt`
- matrix/TRC 기반 profile과 LUT 기반 profile의 차이
- display profile, input profile, output profile, device link profile의 차이

### Chapter 11. 1회차 마무리: 표준별 정의 항목 정리

1회차 마지막에는 주요 표준이 어떤 항목들을 정의하는지 표로 정리한다.

정리할 항목:

- color primaries
- white point
- transfer characteristics
- matrix coefficients
- color range
- WCG 여부
- ICC Profile 또는 metadata와의 관계

대상 표준:

- sRGB
- Rec.709
- Display P3
- Adobe RGB
- Rec.2020
- 주요 인쇄용 CMYK profile

핵심 정리:

> 표준을 볼 때는 이름이 아니라 primaries, white point, transfer, matrix, range, WCG 여부를 분리해서 읽는다.

### Chapter 12. 실습: 색공간 변환

실습 목표:

> 같은 색이 색공간과 프로파일에 따라 어떻게 달라지는지 직접 확인한다.

실습 후보:

- sRGB 이미지를 Display P3로 변환
- Display P3 이미지를 sRGB로 변환
- 변환 없이 프로파일만 잘못 지정했을 때 비교
- gamut 밖 색이 clipping되는 예시 확인
- relative colorimetric과 perceptual 비교
- RGB 값은 같지만 색공간이 다른 샘플 비교
- RGB 이미지를 CMYK profile로 변환하고 gamut warning 확인
- soft proofing 전후 비교

도구 후보:

```text
ImageMagick
LittleCMS
Python colour-science
브라우저 Canvas
기존 HTML demo
```

---

## 2회차. 밝기, 컬러 볼륨, HDR 파이프라인

### 목표

밝기 재현과 비선형 신호의 의미를 이해하고, HDR 소스를 SDR 또는 다른 표시 환경으로 변환할 때 색공간 변환과 톤매핑이 왜 함께 필요한지 설명할 수 있게 한다.

핵심 메시지:

> HDR 변환은 색공간 변환만으로 끝나지 않는다. 밝기 재현 범위를 다시 설계하는 tone mapping이 함께 필요하다.

### Chapter 1. 1회차 복습: 색도와 밝기의 분리

- CIE xy는 색도 지도
- XYZ의 `Y`는 상대 휘도에 대응
- gamut은 2D 색역
- HDR을 이해하려면 밝기 축이 필요함

### Chapter 2. 선형광과 비선형 신호

- 물리적 빛의 선형성
- 인간 시각의 비선형 민감도
- 왜 이미지는 선형으로 저장되지 않는가
- linear RGB와 non-linear RGB

### Chapter 3. Gamma, OETF, EOTF

- gamma의 역사적 배경
- 바턴 램프(Barten ramp)와 banding/계조 인지
- 인간 시각의 contrast sensitivity와 perceptual quantization의 연결
- OETF: scene light에서 signal로
- EOTF: signal에서 display light로
- OOTF: scene과 display 사이의 전체 관계
- sRGB curve
- Rec.709 OETF
- BT.1886 EOTF

### Chapter 4. PQ와 HLG 상세

- PQ: Perceptual Quantizer
- ST 2084 EOTF
- 절대 밝기 기반 전송 함수
- 10,000 nits까지의 표현 범위
- 바턴 램프/인간 시각 모델과 PQ의 관계
- HDR10에서 PQ가 사용되는 방식
- HLG: Hybrid Log-Gamma
- 상대 밝기 기반 방송 친화 HDR
- SDR 호환성을 고려한 설계
- PQ와 HLG의 차이
  - absolute vs relative
  - mastering/display metadata 의존도
  - 영화/OTT vs 방송 맥락

### Chapter 5. 영상 신호와 색공간 메타데이터

- RGB와 YCbCr
- matrix coefficients
- Rec.601 / Rec.709 / Rec.2020 matrix
- full range / limited range
- chroma subsampling
- 영상 파일의 color metadata
  - color primaries
  - transfer characteristics
  - matrix coefficients
  - color range

### Chapter 6. Color Range 상세

- color range가 정의하는 것
  - 디지털 코드값 중 어느 범위를 유효한 영상 신호로 볼 것인가
  - 8-bit 기준 full range와 limited range의 차이
- full range
  - RGB 이미지/그래픽에서 흔히 사용
  - 8-bit 기준 `0-255`
  - 검정 `0`, 흰색 `255`
- limited range / video range / legal range
  - 방송/영상 신호에서 흔히 사용
  - 8-bit luma 기준 `16-235`
  - 8-bit chroma 기준 `16-240`
  - headroom과 footroom 개념
- RGB range와 YCbCr range의 차이
- range와 bit depth
  - 8-bit, 10-bit, 12-bit에서 코드값 범위가 어떻게 확장되는가
  - 예: 10-bit limited luma `64-940`
- range와 transfer function은 다른 개념
  - transfer는 코드값과 밝기의 곡선 관계
  - range는 코드값 중 유효 신호 구간
- range와 matrix coefficients도 다른 개념
  - matrix는 RGB와 YCbCr의 변환 계수
  - range는 변환 전후 값의 스케일/오프셋 해석
- 잘못 해석했을 때의 증상
  - limited를 full로 읽음: 검정이 회색처럼 뜨고 콘트라스트가 낮아짐
  - full을 limited로 읽음: 암부가 뭉개지고 하이라이트가 클리핑됨
  - chroma range 오류: 채도와 색상축이 미묘하게 틀어짐
- 파일/도구에서 확인할 항목
  - ffprobe의 `color_range`
  - `pc` / `jpeg` / full range
  - `tv` / `mpeg` / limited range
  - 플레이어, 편집툴, GPU 드라이버 설정
- 실무 체크포인트
  - 입력 소스의 range metadata 확인
  - 디코딩 시 range 확장 여부 확인
  - RGB로 처리할 때 normalized range 확인
  - 인코딩 시 목적 포맷에 맞는 range로 재설정
  - 테스트 패턴으로 black/white level 확인

핵심 정리:

> color range는 색역이나 감마가 아니라, 디지털 코드값을 어떤 신호 범위로 해석할지에 대한 약속이다. range mismatch는 색공간 변환이 맞아도 결과를 망칠 수 있다.

### Chapter 7. SDR에서 HDR로

- SDR의 밝기 한계
- HDR의 목적
- peak luminance
- mastering display
- PQ
- HLG
- HDR10
- Dolby Vision은 개념 수준으로 소개

### Chapter 8. Color Gamut과 Color Volume

- gamut은 xy 평면의 색역
- color volume은 밝기 축까지 포함한 표현 범위
- 같은 Rec.2020이라도 디스플레이 밝기와 패널 특성에 따라 실제 표현 가능 범위가 달라짐
- wide gamut과 HDR은 관련 있지만 같은 개념은 아님

### Chapter 9. HDR 이미지/영상 포맷과 메타데이터

- HDR 포맷은 단순히 "밝은 이미지 파일"이 아님
- 파일이나 스트림을 해석하기 위한 정보
  - color primaries
  - transfer characteristics
  - matrix coefficients
  - color range
  - bit depth
  - mastering display metadata
  - MaxCLL / MaxFALL
- display-referred HDR 포맷
  - HDR10
  - HLG
  - Dolby Vision
  - HDR HEIF / AVIF
- scene-referred / production 포맷
  - camera RAW
  - camera log
  - OpenEXR
  - linear floating-point TIFF
  - ACES workflow
- HDR 이미지 포맷 후보
  - HEIF / HEIC HDR
  - AVIF HDR
  - JPEG XL HDR
  - OpenEXR
  - TIFF / PNG의 high bit depth 또는 linear workflow
- embedded ICC profile과 video color metadata의 차이
- 이미지 포맷의 HDR과 영상 표준의 HDR은 같은 정보를 다른 방식으로 담을 수 있음
- 실제 파일에서 확인할 항목
  - bit depth
  - primaries
  - transfer
  - range
  - metadata 존재 여부
  - ICC profile 존재 여부

핵심 정리:

> HDR 포맷을 볼 때는 확장자만 보지 말고, 그 파일이 어떤 primaries, transfer, range, bit depth, metadata를 전제로 해석되는지 확인해야 한다.

### Chapter 10. Scene-referred와 Display-referred

- scene-referred
  - 카메라가 본 장면의 빛을 기준으로 색과 밝기를 표현
  - 특정 디스플레이의 밝기 한계에 아직 묶이지 않음
  - RAW, log, ACES 같은 제작 워크플로와 연결됨
- display-referred
  - 특정 표시 조건이나 디스플레이 재현을 기준으로 색과 밝기를 표현
  - SDR Rec.709, HDR10, HLG 출력물과 연결됨
- scene-referred에서 display-referred로 가는 과정
  - exposure
  - white balance
  - grading
  - output transform
  - tone mapping
- 왜 이 구분이 중요한가
  - 같은 RGB 값이라도 장면 기준인지 표시 기준인지에 따라 의미가 달라짐
  - HDR/SDR 변환에서 무엇을 보존하고 무엇을 압축할지 결정해야 함
  - tone mapping은 scene/display 관계를 정하는 핵심 단계임

핵심 정리:

> scene-referred는 장면의 빛을 어떻게 기록했는가에 가깝고, display-referred는 특정 표시 환경에서 어떻게 보이게 할 것인가에 가깝다.

### Chapter 11. 촬영부터 디스플레이까지의 파이프라인

- camera capture
- camera raw / camera log
- scene-referred workflow
- scene-referred에서 working space로 변환
- grading
- output transform
- display-referred output
- encoding
- HDR 이미지/영상 포맷에 metadata 기록
- playback
- display rendering
- viewing environment

기본 흐름:

```text
Scene light
-> Camera sensor
-> Camera raw / camera log
-> Grading space
-> Output transform
-> Delivery color space
-> HDR image/video format
-> Player / OS
-> Display EOTF
-> Viewer perception
```

### Chapter 12. Tone Mapping

- 왜 tone mapping이 필요한가
- HDR에서 SDR로 변환
- peak brightness 차이
- highlight roll-off
- saturation 보존
- 색역 변환과 tone mapping의 순서
- 단순 clipping의 문제
- perceptual tone mapping
- scene-referred 데이터를 display-referred 결과로 만드는 과정에서 tone mapping이 어떤 역할을 하는가
- HDR 포맷 metadata가 tone mapping에 주는 힌트와 한계

### Chapter 13. 2회차 마무리: 표준별 정의 항목 정리

2회차 마지막 이론 파트에서는 영상/HDR 표준이 어떤 항목들을 정의하는지 정리한다.

정리할 항목:

- WCG 여부
- HDR 여부
- color primaries
- white point
- transfer characteristics
- matrix coefficients
- color range
- peak luminance / mastering display
- metadata
- scene-referred / display-referred 성격
- 대표 파일/컨테이너 포맷
- tone mapping 필요 여부

대상 표준:

- Rec.709 SDR
- sRGB
- Display P3
- Rec.2020
- HDR10
- HLG
- Dolby Vision은 개념 수준으로 비교
- HDR HEIF / AVIF
- OpenEXR / ACES는 제작 워크플로 관점에서 비교

핵심 정리:

> HDR 표준을 볼 때는 색역만 보지 말고 transfer, peak luminance, metadata, tone mapping 관계까지 함께 읽는다.

### Chapter 14. 실습: 색공간 변환 + 톤매핑

실습 목표:

> HDR 또는 wide-gamut 소스를 SDR 디스플레이/파일로 변환하면서 색공간 변환과 tone mapping이 각각 어떤 역할을 하는지 확인한다.

실습 후보:

- HDR10 / Rec.2020 / PQ 소스 확인
- metadata 읽기
- HDR 이미지 포맷의 ICC profile 또는 color metadata 확인
- scene-referred 소스와 display-referred 소스의 차이 확인
- Rec.2020에서 Rec.709로 색공간 변환
- PQ에서 SDR gamma / BT.1886으로 변환
- tone mapping 적용 전후 비교
- gamut mapping 적용 전후 비교
- full range / limited range 오류를 일부러 만들고 비교
- range mismatch를 보정한 결과와 보정하지 않은 결과 비교
- ffmpeg 또는 zimg로 변환 결과 비교

예시 흐름:

```text
HDR Rec.2020 PQ
-> transfer 해석 / linearize
-> tone map luminance
-> gamut map Rec.2020 to Rec.709
-> apply SDR transfer
-> output Rec.709 SDR
```

---

## 전체 요약

```text
1회차 = 색의 위치를 맞추는 법
2회차 = 색의 밝기와 재현 범위를 맞추는 법
```

실습 흐름:

```text
1회차 실습: SDR 이미지 색공간 변환
2회차 실습: HDR 영상/이미지의 색공간 변환 + 톤매핑
```
