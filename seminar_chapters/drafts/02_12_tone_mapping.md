# [Draft] 2회차 Chapter 12. Tone Mapping

## 학습 목표

이 장의 목표는 톤매핑(Tone Mapping)을 HDR(High Dynamic Range)에서 SDR(Standard Dynamic Range)로 줄이는 단순 밝기 압축이 아니라, 대상 표시 환경에 맞게 밝기 관계를 재설계하는 과정으로 이해하는 것이다. 특히 peak brightness 차이, highlight roll-off, saturation 보존, gamut conversion과의 관계, clipping의 문제를 함께 본다.

이 장을 마치면 청중은 다음을 설명할 수 있어야 한다.

- HDR을 SDR로 변환할 때 왜 tone mapping이 필요한가
- 최대 휘도(peak brightness) 차이가 변환 결과에 어떤 영향을 주는가
- highlight roll-off와 단순 clipping의 차이는 무엇인가
- tone mapping과 gamut mapping의 순서는 왜 상황에 따라 신중히 정해야 하는가
- metadata가 tone mapping에 어떤 힌트를 주고, 어떤 한계를 갖는가

## 핵심 질문

- HDR Rec.2020 PQ 영상을 Rec.709로 색공간 변환하면 SDR 변환이 끝나는가?
- 1000 nits 하이라이트를 100 nits SDR에 그대로 넣으면 무슨 일이 생기는가?
- 단순 clipping은 왜 하이라이트 디테일과 색을 망가뜨리는가?
- tone mapping을 먼저 해야 할까, gamut mapping을 먼저 해야 할까?
- 메타데이터가 있으면 tone mapping 결과가 자동으로 정답이 되는가?

## 상세 설명

### 1. Tone Mapping이 필요한 이유

HDR 콘텐츠는 SDR보다 훨씬 넓은 밝기 범위를 표현할 수 있다. 예를 들어 HDR10은 PQ(Perceptual Quantizer)를 사용해 매우 높은 절대 휘도 범위까지 코드값(code value)을 배치할 수 있다. 반면 전통적인 SDR Rec.709/BT.1886 환경은 대략 100 nits 기준의 표시를 전제로 한다.

HDR을 SDR로 변환할 때 이 밝기 차이를 무시하면 문제가 생긴다. 1000 nits 하이라이트를 100 nits 출력에 그대로 넣을 수 없기 때문이다. 단순히 100 nits를 넘는 값을 잘라 버리면 하늘, 조명, 반사광, 금속 하이라이트의 디테일이 사라진다.

톤매핑(tone mapping)은 이 넓은 밝기 범위를 대상 디스플레이가 표현할 수 있는 범위 안으로 다시 배치하는 과정이다.

```text
HDR luminance range
-> target display range에 맞게 압축/재배치
-> perceptually acceptable SDR or lower-peak HDR output
```

### 2. Peak Brightness와 Highlight Roll-off

최대 밝기(peak brightness)는 tone mapping에서 가장 중요한 제약 중 하나다. 대상 디스플레이가 100 nits SDR인지, 400 nits HDR 모니터인지, 1000 nits HDR TV인지에 따라 같은 HDR 소스도 다르게 매핑해야 한다.

highlight roll-off는 밝은 영역을 갑자기 잘라내지 않고 부드럽게 압축하는 방식이다. 예를 들어 햇빛 반사나 조명 주변의 매우 밝은 값은 전체적으로 압축하되, 하이라이트 내부의 차이는 최대한 남긴다.

단순 clipping은 다음과 같은 문제를 만든다.

- 밝은 영역의 질감과 디테일이 사라짐
- 서로 다른 밝기가 모두 같은 흰색으로 뭉침
- 색이 있는 하이라이트가 갑자기 흰색 또는 이상한 채도로 변함
- 장면의 의도된 대비 관계가 깨짐

반면 좋은 roll-off는 하이라이트가 대상 범위 안으로 들어오면서도 장면의 인상을 유지하도록 돕는다.

### 3. Saturation 보존과 색 변화

Tone mapping은 밝기만 바꾸는 것처럼 보이지만 실제로는 색에도 영향을 준다. RGB 각 채널을 독립적으로 압축하면 hue가 틀어지거나 saturation이 비정상적으로 변할 수 있다. 예를 들어 밝은 빨강 하이라이트에서 R 채널만 먼저 clipping되면 색상이 노랑이나 흰색 쪽으로 밀릴 수 있다.

그래서 tone mapping에서는 휘도(luminance)와 색도(chromaticity)를 분리해 처리하거나, 색상과 채도를 보존하는 알고리즘을 사용하기도 한다. 단순한 채널별 곡선보다 지각 기반(perceptual) 또는 색공간 기반 접근이 더 안정적인 결과를 줄 수 있다.

다만 saturation을 무조건 보존하는 것도 정답은 아니다. 실제 디스플레이가 높은 밝기의 고채도 색을 낼 수 없다면 어느 정도 desaturation이 자연스러울 수 있다. 중요한 것은 장면의 의도와 대상 장치의 한계를 고려해 균형을 잡는 것이다.

### 4. Tone Mapping과 Gamut Mapping의 관계

HDR Rec.2020 PQ를 SDR Rec.709로 변환할 때는 밝기 범위와 색역 범위를 모두 줄여야 한다.

```text
밝기 문제: HDR luminance -> SDR luminance
색역 문제: Rec.2020 gamut -> Rec.709 gamut
```

문제는 두 과정이 서로 독립적이지 않다는 것이다. 밝기를 먼저 압축하면 어떤 색은 더 이상 Rec.709 밖이 아닐 수 있고, 반대로 색역을 먼저 강하게 clip하면 tone mapping 전에 이미 색 정보가 사라질 수 있다.

일반적인 설명 흐름은 다음처럼 단순화할 수 있다.

```text
HDR Rec.2020 PQ
-> transfer 해석 / linearize
-> tone map luminance
-> gamut map Rec.2020 to Rec.709
-> apply SDR transfer
-> output Rec.709 SDR
```

하지만 실제 구현에서는 알고리즘에 따라 순서가 다르거나, tone mapping과 gamut mapping이 결합되어 있을 수 있다. 중요한 것은 두 문제를 모두 해결해야 한다는 점이다. 색공간 변환만 하고 tone mapping을 하지 않거나, tone mapping만 하고 gamut을 무시하면 결과가 깨질 수 있다.

### 5. Perceptual Tone Mapping

지각적 톤매핑(perceptual tone mapping)은 사람이 밝기와 대비를 어떻게 느끼는지 고려한다. 인간 시각은 물리적 휘도에 선형으로 반응하지 않는다. 어두운 영역과 밝은 영역에서 민감도가 다르고, 주변 밝기와 국소 대비(local contrast)에 따라 인상이 달라진다.

따라서 tone mapping 알고리즘은 단순한 선형 스케일보다 다음을 고려할 수 있다.

- 중간톤(midtones)을 자연스럽게 유지
- 하이라이트(highlights)를 부드럽게 압축
- 암부(shadows)의 디테일을 보존
- 국소 대비(local contrast)를 적절히 유지
- 채도(saturation)와 hue shift를 제어

좋은 tone mapping은 기술적으로 모든 값을 범위 안에 넣는 것을 넘어, 관찰자가 장면의 의도를 자연스럽게 느끼도록 만드는 과정이다.

### 6. Metadata의 힌트와 한계

HDR10의 mastering display metadata, MaxCLL, MaxFALL은 tone mapping에 힌트를 준다. 예를 들어 콘텐츠가 어떤 디스플레이에서 마스터링되었는지, 가장 밝은 픽셀과 프레임 평균 밝기가 어느 정도인지 알 수 있다.

하지만 metadata는 정답이 아니다. MaxCLL/MaxFALL이 없거나 부정확할 수 있고, 콘텐츠 전체에 대한 정적 정보만으로는 장면별 의도를 충분히 알 수 없다. Dolby Vision 같은 동적 메타데이터(dynamic metadata)는 장면별 표시 변환에 더 많은 힌트를 줄 수 있지만, 최종 결과는 여전히 디스플레이와 재생 체인의 구현에 의존한다.

따라서 tone mapping은 metadata를 참고하되, 대상 디스플레이 성능과 콘텐츠 특성을 함께 고려해야 한다.

## 용어 노트

### 톤매핑(Tone Mapping)

톤매핑(tone mapping)은 넓은 밝기 범위를 더 좁은 표시 범위로 재배치하는 과정이다. HDR에서 SDR로 변환하거나, 높은 peak HDR을 낮은 peak HDR 디스플레이에 맞출 때 필요하다.

### 하이라이트 롤오프(Highlight Roll-off)

하이라이트 롤오프(highlight roll-off)는 밝은 영역을 갑자기 자르지 않고 부드럽게 압축하는 방식이다. clipping보다 자연스러운 하이라이트 표현에 유리하다.

### 색역 매핑(Gamut Mapping)

색역 매핑(gamut mapping)은 source gamut 밖의 색을 target gamut 안으로 옮기는 과정이다. tone mapping과 독립된 문제가 아니며, 둘은 서로 영향을 줄 수 있다.

### 클리핑(Clipping)

클리핑(clipping)은 범위를 넘는 값을 최대값 또는 최소값으로 잘라내는 처리다. 구현은 쉽지만 디테일 손실과 색 왜곡을 만들기 쉽다.

## 그림 후보

> 아래 그림은 슬라이드 제작 시 후보로 검토할 자료다. 최종 사용 전에는 각 출처 페이지에서 라이선스와 저작자 표기를 확인한다.

- `HDR 휘도 곡선`: [PQ EOTF (SMPTE2084)](https://commons.wikimedia.org/wiki/File:PQ_EOTF_%28SMPTE2084%29.png) - HDR의 넓은 휘도 범위를 SDR로 압축해야 하는 이유를 설명.
- `톤매핑 후보 이미지`: [Tone mapping media search](https://commons.wikimedia.org/w/index.php?search=tone+mapping+HDR&title=Special:MediaSearch&type=image) - global/local tone mapping 전후 비교 이미지를 찾기 위한 후보 링크.
- `gamut mapping 병행`: [CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](https://commons.wikimedia.org/wiki/File:CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg) - tone mapping과 gamut mapping이 다른 문제지만 함께 고려된다는 설명에 사용.
  ![CIE1931xy gamut comparison of sRGB, Display P3, Rec.2020](../assets/images/CIE1931xy_gamut_comparison_of_sRGB_P3_Rec2020.svg)

## 실무 예시와 데모 아이디어

### 예시 1. HDR 하이라이트 clipping 비교

HDR 장면을 SDR로 변환할 때 tone mapping 없이 clipping한 결과와 highlight roll-off를 적용한 결과를 비교한다. 구름, 조명, 반사광의 디테일 차이를 보여준다.

### 예시 2. 채널별 curve와 luminance 기반 tone mapping 비교

RGB 채널별로 같은 곡선을 적용한 결과와 luminance 중심으로 처리한 결과를 비교한다. hue shift와 saturation 변화가 어떻게 달라지는지 설명한다.

### 예시 3. Rec.2020 to Rec.709에서 순서 비교

tone mapping 후 gamut mapping, gamut clipping 후 tone mapping 결과를 비교한다. 어느 쪽이 항상 정답이라고 말하기보다, 색과 밝기가 연결되어 있어 순서와 알고리즘이 중요하다는 점을 보여준다.

## 추천 진행 흐름

### 1. HDR에서 SDR로 줄이는 문제 제시

1000 nits 값을 100 nits SDR에 넣어야 한다는 간단한 상황으로 시작한다. 이때 단순 clipping이 왜 부족한지 질문한다.

### 2. Roll-off와 saturation 설명

highlight roll-off를 clipping과 비교하고, tone mapping이 색에도 영향을 준다는 점을 채도 보존 문제로 확장한다.

### 3. Gamut mapping과 연결

HDR 변환에서는 밝기 범위와 색역 범위를 모두 줄여야 한다고 설명한다. tone mapping과 gamut mapping의 순서가 알고리즘 설계 문제임을 짚는다.

### 4. Metadata의 역할로 마무리

mastering metadata와 MaxCLL/MaxFALL은 힌트이지 정답이 아니라고 정리한다. 최종 tone mapping은 콘텐츠, 대상 디스플레이, 구현의 결합 결과다.

## 짧은 마무리 요약

톤매핑(Tone Mapping)은 HDR의 밝기 범위를 대상 표시 환경에 맞게 다시 배치하는 과정이다. HDR을 SDR로 변환할 때 색공간 변환만으로는 부족하고, peak brightness 차이, highlight roll-off, saturation 보존, clipping 방지까지 함께 고려해야 한다.

Tone mapping과 gamut mapping은 서로 영향을 준다. HDR Rec.2020 PQ를 Rec.709 SDR로 변환하려면 밝기와 색역을 모두 다루어야 하며, metadata는 유용한 힌트를 제공하지만 최종 결과를 자동으로 보장하지는 않는다.
