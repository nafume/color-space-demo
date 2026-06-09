# [Draft] 2회차 Chapter 9. HDR 이미지/영상 포맷과 메타데이터

## 학습 목표

이 장의 목표는 HDR(High Dynamic Range) 포맷을 단순한 파일 확장자나 "밝은 이미지"로 보지 않고, 색과 밝기를 해석하기 위한 메타데이터(metadata)와 가정의 묶음으로 이해하는 것이다. HDR 영상과 이미지는 원색(color primaries), 전송 특성(transfer characteristics), 비트 심도(bit depth), 색 범위(color range), 마스터링 디스플레이 메타데이터(mastering display metadata), MaxCLL(Maximum Content Light Level), MaxFALL(Maximum Frame-Average Light Level) 같은 정보를 함께 보아야 한다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- HDR10, HLG, Dolby Vision이 어떤 방식으로 HDR 신호를 해석하게 하는가
- HDR HEIF/AVIF, JPEG XL HDR, OpenEXR 같은 이미지 포맷을 볼 때 무엇을 확인해야 하는가
- 내장 ICC 프로파일(embedded ICC profile)과 영상 색 메타데이터(video color metadata)가 어떻게 다른가
- RAW/log와 display HDR 결과물을 왜 같은 종류의 HDR로 취급하면 안 되는가
- 실제 파일에서 어떤 필드를 먼저 점검해야 하는가

## 핵심 질문

- `.heic`, `.avif`, `.jxl`, `.exr` 확장자만 보면 HDR인지 알 수 있는가?
- HDR10과 HLG는 모두 HDR이지만 왜 해석 방식이 다른가?
- Dolby Vision은 왜 정적 메타데이터(static metadata)만으로 설명하기 어려운가?
- ICC 프로파일이 있으면 영상의 `color_primaries`, `color_trc`, `colorspace` 메타데이터는 필요 없는가?
- RAW 또는 log 소스는 HDR 디스플레이에 바로 보여 주는 HDR 포맷인가?
- HDR 파일을 받았을 때 가장 먼저 확인해야 할 항목은 무엇인가?

## 상세 설명

### 1. HDR 포맷은 확장자가 아니라 해석 규칙이다

HDR 포맷을 다룰 때 가장 위험한 생각은 "확장자가 HDR을 결정한다"는 것이다. 어떤 파일이 `.mp4`, `.mov`, `.heic`, `.avif`, `.png`, `.tif`라고 해서 자동으로 HDR인지 SDR(Standard Dynamic Range)인지 결정되지는 않는다. 같은 컨테이너(container) 안에도 SDR Rec.709 영상이 들어갈 수 있고, HDR Rec.2020 PQ 영상이 들어갈 수 있다.

HDR 여부는 보통 다음 항목을 함께 확인해야 한다.

- 원색(color primaries)
- 전송 특성(transfer characteristics)
- 행렬 계수(matrix coefficients)
- 색 범위(color range)
- 비트 심도(bit depth)
- 마스터링 디스플레이 메타데이터(mastering display metadata)
- MaxCLL(Maximum Content Light Level)
- MaxFALL(Maximum Frame-Average Light Level)
- ICC 프로파일(ICC Profile) 또는 nclx 같은 색 정보

핵심은 파일의 숫자를 어떤 색공간(color space)과 밝기 곡선으로 해석할지다. HDR 포맷은 파일 확장자라기보다 "이 숫자를 어떻게 표시해야 하는가"를 전달하는 규칙과 메타데이터의 조합이다.

### 2. HDR10, HLG, Dolby Vision

HDR10(High Dynamic Range 10)은 가장 널리 쓰이는 HDR 전달 형식 중 하나다. 일반적으로 Rec.2020 원색 컨테이너, PQ(Perceptual Quantizer) 또는 ST 2084 EOTF(Electro-Optical Transfer Function), 10-bit 신호, 정적 메타데이터를 사용한다. 여기서 정적 메타데이터는 콘텐츠 전체에 대해 하나의 마스터링 디스플레이 정보와 MaxCLL/MaxFALL 값을 제공한다.

HLG(Hybrid Log-Gamma)는 방송 친화적인 HDR 방식이다. PQ가 절대 휘도(absolute luminance) 기반에 가깝다면, HLG는 상대 밝기(relative brightness) 기반으로 설계되어 SDR 방송 워크플로와의 호환성을 고려한다. HLG는 HDR10처럼 마스터링 메타데이터 의존도가 높지 않고, 수신 장치와 표시 환경에 따라 렌더링이 달라질 수 있다.

Dolby Vision은 동적 메타데이터(dynamic metadata)를 활용할 수 있는 HDR 시스템이다. 장면(scene) 또는 샷(shot) 단위로 표시 변환 정보를 제공해, 다양한 디스플레이 성능에 맞춘 렌더링을 돕는다. Dolby Vision은 단순히 "더 좋은 HDR10"이라기보다, 인코딩 구조, 메타데이터, 호환 계층, 디스플레이 매핑 방식이 결합된 별도 시스템으로 보는 편이 정확하다.

정리하면 다음과 같다.

```text
HDR10:
Rec.2020 container + PQ + static metadata

HLG:
relative HDR transfer + 방송 친화 설계 + metadata 의존도 낮음

Dolby Vision:
dynamic metadata + 디스플레이별 렌더링 지원
```

### 3. HDR 이미지 포맷: HEIF/AVIF, JPEG XL, OpenEXR, TIFF/PNG

HDR 이미지는 영상보다 더 다양한 방식으로 나타난다. HDR HEIF(High Efficiency Image File Format) 또는 HDR AVIF(AV1 Image File Format)는 고비트 심도와 색 메타데이터를 담을 수 있고, PQ/HLG 또는 넓은 색역 정보를 사용할 수 있다. Apple 생태계의 HEIC HDR 사진처럼 gain map 또는 별도 확장 정보를 사용하는 경우도 있어, 앱과 OS의 해석 방식이 중요하다.

JPEG XL HDR은 넓은 동적 범위, 고비트 심도, 색공간 정보, 부가 정보를 지원할 수 있는 차세대 이미지 포맷이다. 다만 지원 환경과 뷰어의 색관리(color management) 동작을 함께 확인해야 한다.

OpenEXR은 제작 워크플로에서 많이 쓰이는 고동적 범위 이미지 포맷이다. 보통 선형광(linear light), half float 또는 float 채널, scene-referred 성격과 연결된다. OpenEXR은 "HDR 디스플레이에 바로 보이는 완성본"이라기보다 합성, 렌더링, VFX, ACES(Academy Color Encoding System) 같은 제작 파이프라인의 중간/마스터 자료로 자주 쓰인다.

TIFF와 PNG도 16-bit 같은 high bit depth를 지원할 수 있고, ICC 프로파일이나 선형 워크플로(linear workflow)에서 사용될 수 있다. 하지만 16-bit PNG라고 해서 자동으로 HDR display-referred 이미지가 되는 것은 아니다. 고비트 심도는 계조를 더 세밀하게 저장하는 능력이고, HDR 표시는 전송 함수와 표시 해석이 함께 필요하다.

### 4. RAW/log와 display HDR은 다르다

카메라 RAW(camera RAW)와 카메라 log(camera log)는 넓은 장면 밝기 범위를 담을 수 있다. 하지만 이들은 대개 장면 기준(scene-referred) 또는 제작 기준(production-oriented) 데이터다. 특정 HDR TV에서 바로 어떻게 보여야 하는지를 완전히 정의한 display-referred HDR 결과물과는 성격이 다르다.

예를 들어 log 영상은 보기에는 낮은 대비와 낮은 채도로 보일 수 있다. 이는 실패한 HDR이 아니라, 후반 작업에서 노출(exposure), 화이트 밸런스(white balance), 그레이딩(grading), 출력 변환(output transform)을 거쳐 목적 표시 환경에 맞게 만들기 위한 중간 표현이다.

반대로 HDR10 완성본은 특정한 표시 해석을 전제로 한다. Rec.2020 원색, PQ EOTF, 제한 범위(limited range), 마스터링 메타데이터 같은 항목을 통해 디스플레이가 어떻게 렌더링해야 하는지 힌트를 제공한다.

### 5. ICC 프로파일과 영상 메타데이터의 차이

이미지 파일에서는 내장 ICC 프로파일(embedded ICC profile)이 RGB 값의 색 의미를 설명하는 데 자주 쓰인다. ICC 프로파일은 색공간 변환(color space conversion)과 색관리 시스템에서 중요한 역할을 한다.

영상 파일에서는 보통 다음 필드가 더 직접적으로 쓰인다.

```text
color_primaries
color_transfer 또는 color_trc
matrix_coefficients 또는 colorspace
color_range
```

이 필드들은 디코더(decoder), 플레이어(player), OS, GPU, 디스플레이 파이프라인이 영상 신호를 해석하는 데 사용한다. ICC 프로파일과 영상 메타데이터는 모두 색 해석 정보를 담을 수 있지만, 생태계와 적용 위치가 다르다.

실무에서는 둘 중 하나만 맹신하면 안 된다. 이미지 포맷에서는 ICC, nclx, EXIF, gain map 같은 정보를 확인하고, 영상 포맷에서는 스트림 메타데이터와 컨테이너 메타데이터를 함께 확인해야 한다.

### 6. 실제 파일에서 확인할 항목

HDR 파일을 받았을 때는 다음 순서로 확인하면 좋다.

```text
1. bit depth: 8-bit, 10-bit, 12-bit, 16-bit, float
2. primaries: bt709, p3, bt2020 등
3. transfer: gamma, sRGB, bt709, PQ/smpte2084, HLG/arib-std-b67 등
4. matrix: bt709, bt2020nc, rgb 등
5. range: full/pc/jpeg 또는 limited/tv/mpeg
6. mastering display metadata 존재 여부
7. MaxCLL / MaxFALL 존재 여부
8. ICC profile 또는 nclx/profile 정보 존재 여부
9. scene-referred인지 display-referred인지
```

이 중 일부가 비어 있을 수 있다. 메타데이터가 없다고 항상 잘못된 파일은 아니지만, 해석 가정이 필요하다는 뜻이다. 특히 HDR 포맷에서는 "없으면 알아서 잘 보이겠지"가 아니라, 어떤 기본값이 적용되는지 확인해야 한다.

## 용어 노트

### HDR10(High Dynamic Range 10)

HDR10은 보통 10-bit, Rec.2020 원색 컨테이너, PQ 전송 특성, 정적 메타데이터를 사용하는 HDR 전달 형식이다.

### HLG(Hybrid Log-Gamma)

HLG는 방송 워크플로를 고려한 상대 밝기 기반 HDR 전송 방식이다. PQ와 달리 마스터링 디스플레이 메타데이터 의존도가 낮다.

### Dolby Vision

Dolby Vision은 동적 메타데이터(dynamic metadata)를 활용해 장면 또는 샷 단위 표시 변환을 지원할 수 있는 HDR 시스템이다.

### 마스터링 디스플레이 메타데이터(Mastering Display Metadata)

마스터링 디스플레이 메타데이터는 콘텐츠가 만들어질 때 기준이 된 디스플레이의 원색, 화이트 포인트, 최대/최소 휘도 정보를 담는다. 실제 소비자 디스플레이가 이와 같다는 뜻은 아니다.

### MaxCLL(Maximum Content Light Level)과 MaxFALL(Maximum Frame-Average Light Level)

MaxCLL은 콘텐츠 안의 최대 픽셀 밝기 수준을, MaxFALL은 프레임 평균 밝기의 최대값을 나타내는 힌트다. 디스플레이 톤매핑에 도움을 줄 수 있지만, 항상 정확하거나 충분한 정보라고 가정하면 안 된다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `AVIF 포맷 구조`: [AVIF specification](https://aomedia.org/docs/AV1%20Image%20File%20Format%20%28AVIF%29%20v1.2.0.pdf) - 컨테이너/코덱/색 메타데이터가 분리된다는 설명의 공식 참조.
- `PNG HDR/gamut metadata`: [W3C PNG Third Edition](https://www.w3.org/TR/png-3/) - PNG의 색 정보, ICC, HDR 관련 청크를 설명할 때 공식 참조.
- `OpenEXR scene-linear`: [OpenEXR scene linear documentation](https://openexr.com/en/latest/SceneLinear.html) - HDR 이미지 포맷이 display-referred만 있는 것이 아니라는 설명에 사용.
- `HDR 메타데이터와 gamut`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - primaries metadata가 무엇을 가리키는지 연결.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)

## 실무 예시와 데모 아이디어

### 예시 1. ffprobe로 HDR10 메타데이터 읽기

HDR10 샘플 파일에 대해 `ffprobe`로 `color_primaries`, `color_transfer`, `color_space`, `color_range`, `side_data_list`를 확인한다. PQ와 bt2020이 보이더라도 mastering metadata와 MaxCLL/MaxFALL이 있는지 따로 확인한다.

### 예시 2. HDR HEIF/AVIF 이미지 정보 비교

HDR HEIF 또는 AVIF 이미지에서 ICC 프로파일, nclx 색 정보, 비트 심도, gain map 존재 여부를 비교한다. 같은 확장자라도 SDR 이미지와 HDR 이미지가 모두 가능하다는 점을 보여준다.

### 예시 3. OpenEXR과 HDR10의 차이

OpenEXR 파일을 일반 이미지 뷰어에서 열었을 때 기대한 모양과 다르게 보일 수 있음을 보여준다. 이는 OpenEXR이 display-referred 완성본이 아니라 scene-referred 또는 linear production 데이터일 수 있기 때문이다.

## 추천 진행 흐름

### 1. 확장자 오해 깨기

먼저 "이 파일이 `.mp4`라서 HDR인가?", "이 이미지가 16-bit PNG라서 HDR인가?"라는 질문으로 시작한다. 답은 메타데이터와 해석 규칙을 봐야 한다는 쪽으로 이끈다.

### 2. HDR 영상 포맷 비교

HDR10, HLG, Dolby Vision을 transfer와 metadata 관점에서 비교한다. HDR10은 PQ와 정적 메타데이터, HLG는 상대 밝기 기반 방송 친화성, Dolby Vision은 동적 메타데이터를 중심으로 잡는다.

### 3. HDR 이미지 포맷으로 확장

HEIF/AVIF, JPEG XL, OpenEXR, TIFF/PNG를 소개하되, "포맷이 지원한다"와 "이 파일이 그렇게 해석된다"를 구분한다.

### 4. 점검 필드 정리

마지막에는 실제 파일에서 확인할 항목 목록을 제시한다. 이 장의 실무 메시지는 "확장자가 아니라 primaries, transfer, range, bit depth, metadata를 확인하라"로 정리한다.

## 짧은 마무리 요약

HDR 이미지/영상 포맷은 단순한 확장자가 아니다. HDR 파일은 원색(color primaries), 전송 특성(transfer characteristics), 행렬 계수(matrix coefficients), 색 범위(color range), 비트 심도(bit depth), 마스터링 메타데이터(mastering metadata), MaxCLL/MaxFALL 같은 정보와 해석 가정을 함께 보아야 한다.

RAW/log, OpenEXR 같은 제작용 데이터와 HDR10/HLG/Dolby Vision 같은 표시용 HDR 결과물은 성격이 다르다. 실무에서는 파일을 열기 전에 "이 데이터는 scene-referred인가, display-referred인가?", "어떤 metadata가 색과 밝기 해석을 정의하는가?"를 먼저 확인해야 한다.
