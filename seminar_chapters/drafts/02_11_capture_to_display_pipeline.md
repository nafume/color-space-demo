# [Draft] 2회차 Chapter 11. 촬영부터 디스플레이까지의 파이프라인

## 학습 목표

이 장의 목표는 촬영(Camera Capture)부터 디스플레이(Display Rendering)까지 색과 밝기가 어떤 단계를 거쳐 이동하는지 전체 파이프라인(pipeline)으로 이해하는 것이다. 개별 용어인 RAW, log, working space, grading, output transform, metadata, playback, display EOTF가 서로 떨어진 개념이 아니라 하나의 흐름 안에서 연결된다는 점을 잡는다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- 카메라 센서(camera sensor)가 장면의 빛을 어떻게 데이터로 기록하는가
- raw/log 데이터가 왜 scene-referred 제작 단계와 연결되는가
- working space, grading, output transform이 어떤 역할을 하는가
- display-referred output이 어떻게 인코딩(encoding)되고 메타데이터(metadata)와 함께 전달되는가
- 플레이어(player), OS, 디스플레이, 시청 환경(viewing environment)이 최종 지각에 어떤 영향을 주는가

## 핵심 질문

- 카메라가 찍은 빛은 바로 Rec.709나 HDR10이 되는가?
- working color space는 왜 필요한가?
- output transform은 색공간 변환만 하는 단계인가?
- HDR 파일에 metadata를 기록하면 모든 디스플레이에서 같은 화면이 보장되는가?
- 플레이어와 OS의 색관리(color management)는 최종 결과에 어떤 영향을 주는가?
- 같은 파일도 시청 환경이 다르면 왜 다르게 느껴지는가?

## 상세 설명

### 1. 전체 흐름 먼저 보기

촬영부터 디스플레이까지의 흐름은 다음처럼 단순화할 수 있다.

```text
Scene light
-> Camera sensor
-> Camera raw / camera log
-> Scene-referred working space
-> Grading
-> Output transform
-> Display-referred delivery color space
-> Encoding + metadata
-> Player / OS / color management
-> Display EOTF and tone mapping
-> Viewing environment
-> Viewer perception
```

이 흐름의 핵심은 색과 밝기가 한 번에 결정되지 않는다는 것이다. 카메라는 장면의 빛을 기록하고, 후반 작업은 그 데이터를 해석하고, 출력 변환은 목표 표시 조건에 맞게 재구성하며, 재생 장치와 디스플레이는 다시 자신의 능력에 맞게 렌더링한다.

### 2. 카메라 캡처(Camera Capture)와 raw/log

카메라 센서(camera sensor)는 장면(scene)에서 들어온 빛을 전기 신호로 바꾼다. 센서의 컬러 필터 배열(color filter array), 감도, 노이즈, 다이내믹 레인지(dynamic range), 렌즈와 조명 조건이 기록 데이터에 영향을 준다.

카메라 RAW(camera RAW)는 센서 데이터에 가까운 형태와 촬영 메타데이터를 담아, 후반에서 디베이어(demosaic), 화이트 밸런스(white balance), 노출(exposure), 색 변환을 적용할 여지를 준다. 카메라 log(camera log)는 넓은 장면 밝기 범위를 제한된 비트 심도 안에 효율적으로 담기 위해 비선형 로그 곡선을 사용한다.

raw/log는 보통 특정 디스플레이에서 바로 완성된 모습으로 보라고 만든 데이터가 아니다. 이것은 scene-referred 또는 제작 중간 데이터로 이해하는 편이 좋다.

### 3. Working Space와 Grading

촬영 데이터는 보통 작업용 색공간(working color space)으로 옮겨진다. working space는 여러 카메라, VFX, 합성, 색보정 작업을 일관되게 처리하기 위한 공간이다. ACES(Academy Color Encoding System), ACEScct, DaVinci Wide Gamut, linear scene-referred space 등이 예가 될 수 있다.

그레이딩(grading)은 단순히 "예쁘게 보정"하는 단계가 아니다. 장면의 노출 관계, 피부색, 하이라이트, 암부, 채도, 장면 간 일관성, 창작 의도를 정하는 과정이다. 이때 작업자는 모니터링 LUT(Look-Up Table), color management, reference display를 사용해 최종 출력에 가까운 모습을 보면서 조정할 수 있다.

### 4. Output Transform과 Display-referred Output

출력 변환(output transform)은 working space의 데이터를 목표 배포 표준으로 보내는 단계다. 목표가 SDR Rec.709인지, HDR10 Rec.2020 PQ인지, HLG 방송인지, Display P3 이미지인지에 따라 출력 변환은 달라진다.

출력 변환에는 보통 다음 요소가 함께 들어간다.

- 색공간 변환(color space conversion)
- 화이트 포인트 처리(white point handling)
- gamut mapping
- tone mapping 또는 highlight roll-off
- transfer function 적용
- range와 matrix 설정

따라서 output transform은 단순한 matrix 변환만이 아니다. 특히 HDR에서 SDR로, 또는 scene-referred에서 display-referred로 갈 때는 밝기와 색역을 함께 재설계해야 한다.

### 5. Encoding, Metadata, Playback

display-referred 출력물이 만들어지면 배포를 위해 인코딩(encoding)된다. 영상에서는 코덱(codec)과 컨테이너(container)에 따라 YCbCr 변환, chroma subsampling, bit depth, range, metadata 기록 방식이 달라진다.

HDR10이라면 Rec.2020 원색, PQ transfer, matrix coefficients, limited range, mastering display metadata, MaxCLL/MaxFALL 같은 정보가 중요하다. HLG라면 transfer가 HLG인지 확인해야 하고, 이미지 포맷에서는 ICC profile, nclx, gain map, bit depth 같은 정보를 볼 수 있다.

재생 단계에서는 플레이어(player), OS, GPU 드라이버, 브라우저, 앱 프레임워크가 색관리(color management)에 관여한다. 같은 파일이라도 어떤 소프트웨어가 메타데이터를 읽고, 어떤 출력 경로로 디스플레이에 보내는지에 따라 결과가 달라질 수 있다.

### 6. Display Rendering과 Viewing Environment

디스플레이는 전달받은 신호를 자신의 물리적 능력 안에서 렌더링한다. 여기에는 EOTF(Electro-Optical Transfer Function), peak luminance, black level, panel gamut, local dimming, tone mapping, 색온도 설정 등이 관여한다.

HDR 콘텐츠는 특히 디스플레이 성능에 따라 결과 차이가 크다. 1000 nits로 마스터링된 콘텐츠를 400 nits 디스플레이에서 보면 하이라이트를 압축해야 한다. Rec.2020 컨테이너를 사용하더라도 실제 패널이 P3 수준이면 gamut mapping이 필요하다.

마지막으로 시청 환경(viewing environment)도 중요하다. 주변 조명이 밝으면 암부가 덜 보이고, 어두운 방에서는 작은 밝기 차이도 크게 느껴질 수 있다. SDR과 HDR 표준은 단순 파일 규칙만이 아니라 권장 시청 조건과도 연결된다.

## 용어 노트

### 파이프라인(Pipeline)

파이프라인(pipeline)은 촬영, 처리, 변환, 인코딩, 재생, 표시가 이어지는 전체 흐름을 말한다. 색과 밝기는 이 과정의 여러 지점에서 해석되고 변환된다.

### 작업용 색공간(Working Color Space)

작업용 색공간(working color space)은 후반 작업에서 색과 밝기를 안정적으로 조정하기 위한 공간이다. 입력 카메라 공간이나 최종 출력 공간과 다를 수 있다.

### 출력 변환(Output Transform)

출력 변환(output transform)은 작업 데이터에서 목표 배포 색공간과 표시 조건으로 가는 단계다. 색공간 변환, 톤매핑, gamut mapping, transfer 적용이 포함될 수 있다.

### 표시 렌더링(Display Rendering)

표시 렌더링(display rendering)은 디스플레이가 입력 신호를 실제 빛으로 바꾸는 과정이다. EOTF, 패널 특성, 톤매핑, 사용자 설정이 결과에 영향을 준다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `카메라에서 디스플레이까지`: [OpenColorIO documentation](https://opencolorio.readthedocs.io/) - 입력 변환, 작업 공간, 디스플레이 변환을 나누어 설명하는 공식 참조.
- `Scene-linear 중간 단계`: [OpenEXR scene linear documentation](https://openexr.com/en/latest/SceneLinear.html) - 촬영/CG/합성 단계에서 scene-linear가 왜 등장하는지 설명.
- `최종 표시 EOTF`: [PQ EOTF (SMPTE2084)](https://commons.wikimedia.org/wiki/File:PQ_EOTF_%28SMPTE2084%29.png) - display transform 이후 디스플레이가 신호를 빛으로 바꾸는 단계를 연결.
- `gamut 변환`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - 파이프라인 중 색역 변환 위치를 설명할 때 사용.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)

## 실무 예시와 데모 아이디어

### 예시 1. 동일 log 소스에서 SDR과 HDR 출력 만들기

하나의 log 소스를 사용해 Rec.709 SDR 버전과 HDR10 버전을 각각 출력한다. 같은 입력이라도 output transform이 달라지면 contrast, highlight, saturation 설계가 달라진다는 점을 보여준다.

### 예시 2. metadata 없는 HDR 파일 문제

PQ로 인코딩된 영상에서 color metadata가 빠진 경우를 비교한다. 플레이어가 SDR처럼 해석하거나 잘못된 transfer를 적용하면 화면이 어둡거나 이상하게 보일 수 있음을 설명한다.

### 예시 3. 시청 환경 비교

같은 HDR 장면을 밝은 회의실과 어두운 환경에서 비교한다. 파일은 같아도 관찰 조건에 따라 암부와 하이라이트 인상이 달라진다는 점을 보여준다.

## 추천 진행 흐름

### 1. 전체 흐름 다이어그램 제시

처음에는 Scene light에서 Viewer perception까지 이어지는 단순 흐름을 보여준다. 청중이 각 용어를 위치로 기억하게 만드는 것이 목표다.

### 2. 입력과 제작 단계 설명

camera sensor, RAW, log, working space, grading을 scene-referred 제작 단계로 묶어 설명한다.

### 3. 출력과 배포 단계 설명

output transform, delivery color space, encoding, metadata를 display-referred 출력 단계로 묶어 설명한다.

### 4. 재생과 표시 단계로 마무리

player, OS, display rendering, viewing environment가 마지막 결과를 바꿀 수 있음을 설명한다. 이 장의 메시지는 "파일을 만들었다고 표시가 끝난 것이 아니다"로 정리한다.

## 짧은 마무리 요약

촬영부터 디스플레이까지의 파이프라인은 장면의 빛을 기록하고, 작업 공간에서 해석하고, 출력 변환으로 목표 표시 조건에 맞추고, 인코딩과 메타데이터를 통해 전달한 뒤, 플레이어와 디스플레이가 다시 렌더링하는 흐름이다.

HDR에서는 이 흐름의 각 단계가 특히 중요하다. raw/log, working space, output transform, metadata, display tone mapping, viewing environment 중 어느 하나를 잘못 해석해도 최종 색과 밝기는 의도와 달라질 수 있다.
