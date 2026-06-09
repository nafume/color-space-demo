# [Draft] Appendix. Gamma, Transfer Functions, and HDR Pipeline

## 이 appendix의 목적

이 appendix는 gamma 함수, transfer characteristic, HDR 촬영과 표시, HDR 메타데이터에 대해 이어진 질문들을 하나의 흐름으로 정리한다. 핵심은 다음 구분이다.

```text
scene light        카메라가 보는 장면의 상대적인 빛
camera signal      촬영/저장/후반 작업을 위한 신호
display luminance  최종 디스플레이가 실제로 내는 빛, 보통 nits 단위
```

이 셋을 섞으면 PQ의 10,000 nits, 카메라 Log, HDR metadata, tone mapping의 역할이 헷갈리기 쉽다.

이 문서는 `Transfer Characteristic` 탭과 `Camera Log` 탭을 보면서 나온 질문들을 이어 붙인다. 특히 다음 질문을 한 흐름으로 정리한다.

- 왜 gamma/log 같은 비선형 함수가 필요한가
- Transfer Function, OETF, EOTF는 어떻게 다른가
- PQ와 HLG는 어떤 의미에서 HDR인가
- PQ의 `1.0 = 10,000 nits`는 실제 촬영과 어떤 관계가 있는가
- 카메라 Log는 왜 회색으로 보이고, 왜 최종 결과물이 될 수 없는가
- HDR 촬영과 HDR 디스플레이는 각각 어떤 조건을 가져야 하는가
- HDR metadata는 왜 필요하고, 동적 metadata에는 무엇이 들어가는가

## 왜 linear light 그대로 저장하지 않는가

선형광(linear light)은 물리적으로 자연스러운 표현이다. 빛이 두 배 밝으면 값도 두 배가 된다. 합성, 조명 계산, 색공간 변환에는 linear light가 매우 중요하다.

하지만 저장 신호로는 항상 최적이 아니다. 이유는 code value 수가 제한되어 있기 때문이다.

예를 들어 8-bit라면 256단계, 10-bit라면 1024단계만 있다. 이 단계를 linear light에 균등하게 배분하면 밝은 영역까지 똑같은 간격으로 나뉜다. 그런데 사람 눈은 낮은 밝기와 중간톤의 변화에 더 민감하다. 그래서 linear 저장은 같은 bit depth에서 shadow와 midtone에 충분한 단계감을 주기 어렵다.

비선형 transfer function은 제한된 code value를 사람이 더 민감하게 느끼는 영역에 더 효율적으로 배치한다.

```text
linear light
    ↓ OETF 또는 encoding curve
nonlinear code value
```

이것은 밝기를 "왜곡"하려는 것이 아니라, 제한된 신호 단계를 지각적으로 더 유용한 위치에 배분하려는 방법이다.

## Linear 저장과 Gamma/Log 저장의 차이

linear light 그대로 저장하면 값의 간격은 물리적으로 균등하다.

```text
0.0, 0.1, 0.2, 0.3, ... 1.0
```

하지만 사람 눈이 체감하는 밝기 차이는 물리적 값과 동일한 간격으로 느껴지지 않는다. 어두운 영역과 중간톤에서 더 작은 변화도 눈에 잘 띄고, 매우 밝은 영역에서는 같은 절대 차이가 상대적으로 덜 민감하게 느껴진다.

Gamma나 Log 형태의 저장은 이 특성을 이용한다.

```text
어두운 영역 / 중간톤  → 더 많은 code value 배치
밝은 영역 / 하이라이트 → 상대적으로 압축
```

따라서 같은 10-bit라도 linear 저장보다 gamma/log 저장이 그림자, 피부톤, 중간톤의 banding을 줄이는 데 유리하다. 이것이 데모의 `linear light 그대로 저장했을 때`와 `gamma/log 형태로 저장했을 때` 비교가 보여주려는 핵심이다.

## Gamma, OETF, EOTF

전달함수(transfer function)를 이야기할 때 자주 나오는 용어는 다음과 같다.

### Gamma

Gamma는 비선형 power curve를 넓게 부르는 말이다. 과거 CRT 디스플레이의 자연스러운 응답 특성에서 출발했고, 지금은 영상 신호의 비선형 인코딩/디코딩을 설명하는 일반어처럼 쓰인다.

하지만 엄밀히는 모든 transfer function이 단순한 `x^gamma`는 아니다. sRGB, Rec.709, PQ, HLG는 모두 piecewise curve나 복잡한 함수 형태를 가진다.

### OETF

OETF는 opto-electronic transfer function이다. 장면의 빛 또는 선형광 값을 전기적/디지털 신호로 인코딩하는 함수다.

```text
light → code value
```

카메라/촬영 쪽, 또는 파일에 저장하기 전의 encoding curve를 설명할 때 자주 등장한다.

### EOTF

EOTF는 electro-optical transfer function이다. 디지털 code value를 디스플레이의 실제 빛으로 바꾸는 함수다.

```text
code value → display light
```

sRGB 디스플레이, Rec.709/BT.1886 표시, PQ HDR 표시 등을 설명할 때 중요하다.

### OOTF

OOTF는 opto-optical transfer function이다. 장면의 빛이 최종 디스플레이 빛으로 어떻게 대응되는지를 나타내는 전체 시스템 변환에 가깝다.

```text
scene light → display light
```

카메라 OETF와 디스플레이 EOTF만 곱하면 항상 끝나는 것이 아니라, 시청 환경, system gamma, creative intent, tone mapping 같은 요소가 여기에 들어간다.

## sRGB, Rec.709, PQ, HLG의 역할 차이

### sRGB

sRGB는 PC, 웹, 일반 이미지 표시에서 기본처럼 쓰이는 색공간과 transfer curve다. sRGB curve는 어두운 영역의 선형 구간과 power curve를 함께 가진다. 일반적인 디스플레이 표시와 웹 컬러 관리에서 중요하다.

### Rec.709

Rec.709는 HDTV SDR 시스템의 표준이다. 원색과 white point는 sRGB와 거의 같지만, 방송 체계에서는 OETF, BT.1886 EOTF, limited range, YCbCr matrix 같은 요소가 함께 얽힌다.

따라서 "sRGB와 Rec.709는 삼각형이 비슷하다"와 "신호 체계가 완전히 같다"는 같은 말이 아니다.

### PQ / ST 2084

PQ는 HDR을 위한 EOTF다. normalized code value를 절대 display luminance에 대응시킨다. 표준 정의에서 `code 1.0`은 10,000 cd/m2, 즉 10,000 nits에 대응한다.

```text
PQ code 1.0 = 표준상 10,000 nits
```

하지만 이것이 실제 TV가 10,000 nits를 낸다는 뜻은 아니다. 실제 출력은 콘텐츠의 mastering peak, MaxCLL/MaxFALL, TV의 peak brightness, tone mapping 알고리즘에 따라 달라진다.

정확히 말하면 PQ는 카메라가 장면의 빛을 저장하기 위한 OETF라기보다, 최종 표시 밝기를 다루기 위한 display-referred EOTF다. HDR 마스터링에서 PQ code를 만들 때는 `표시하려는 display luminance`를 inverse EOTF로 code value에 넣는다고 이해하는 편이 안전하다.

```text
display luminance in nits
    ↓ PQ inverse EOTF
PQ code value
    ↓ PQ EOTF
display luminance in nits
```

그래서 `PQ OETF`라는 표현을 볼 수는 있지만, 일반적인 카메라 Log OETF처럼 `scene light 1.0`을 바로 저장한다는 뜻으로 이해하면 혼동이 생긴다.

### HLG

HLG는 방송과 라이브 제작을 위해 설계된 HDR 방식이다. PQ처럼 절대 nits를 직접 지정하는 성격보다, display-referred와 scene-referred 성격을 절충한 상대적인 HDR 신호에 가깝다. 기존 SDR 계열과의 호환성도 고려한다.

HLG는 보통 콘텐츠 전체에 "이 픽셀은 반드시 몇 nits"라고 말하지 않는다. 대신 시스템 감마와 디스플레이 특성을 통해 최종 밝기가 결정된다. 이 때문에 PQ보다 라이브 방송과 다양한 수신 환경에 유연하지만, 마스터링 기준 밝기를 절대 nits로 강하게 고정하려는 워크플로우에서는 PQ가 더 명확하다.

## PQ 자세히 이해하기

PQ는 `Perceptual Quantizer`의 약자이고, 표준 이름으로는 `SMPTE ST 2084`다. HDR 영상에서 디지털 code value를 실제 디스플레이 밝기, 즉 `cd/m2` 또는 `nits`로 바꾸기 위해 만들어졌다.

```text
PQ code value
    ↓ SMPTE ST 2084 EOTF
display luminance in nits
```

PQ의 가장 큰 특징은 display-referred absolute luminance다. 즉 code value가 단순한 상대 밝기가 아니라 표준상 특정 display luminance에 대응한다.

```text
PQ 0.0 → 0 nits 근처
PQ 1.0 → 10,000 nits
```

이때 `PQ 0.5`는 선형 밝기의 50%가 아니다. PQ code value는 인간의 밝기 구분 능력에 맞춰 비선형으로 배치되어 있다. 그래서 code value 절반이 luminance 절반을 의미하지 않는다.

### PQ가 해결하려는 문제

HDR은 SDR보다 훨씬 넓은 display luminance 범위를 다룬다.

```text
SDR reference white      보통 100 nits 부근
HDR highlight            1,000 nits, 4,000 nits 이상 가능
PQ 표준 상한             10,000 nits
```

이 넓은 범위를 linear하게 code value에 배분하면 어두운 영역과 중간톤의 단계가 부족해질 수 있다. 사람 눈은 어두운 영역과 중간톤의 밝기 변화에 민감하고, 매우 밝은 영역에서는 같은 절대 밝기 차이에 상대적으로 덜 민감하다.

PQ는 이 특성을 이용해 code value를 지각적으로 더 효율적으로 배치한다.

```text
어두운 영역        세밀한 code value 간격
중간 밝기          부드러운 계조 유지
매우 밝은 영역     넓은 luminance 범위를 압축
```

따라서 PQ는 단순한 `x^gamma` 형태가 아니라, HDR display luminance 전체를 인간 시각에 맞게 양자화하기 위한 복잡한 transfer function이다.

### PQ는 카메라 Log가 아니다

PQ를 카메라 Log와 혼동하면 안 된다. 카메라 Log는 촬영 장면의 상대 노출을 후반 작업용 code value로 압축하는 acquisition curve다. 반면 PQ는 최종 표시 밝기와 강하게 연결된 display-referred EOTF다.

```text
Camera Log
scene exposure → camera log code value

PQ
PQ code value → display luminance
```

HDR 마스터링에서 PQ code를 만들 때는 보통 다음처럼 생각하는 편이 좋다.

```text
표시하고 싶은 밝기(nits)
    ↓ inverse PQ EOTF
PQ code value
    ↓ PQ EOTF
디스플레이 밝기(nits)
```

물론 실제 제작 파이프라인에는 scene-linear, grading space, output transform, tone mapping이 끼어들기 때문에 항상 이처럼 단순하지는 않다. 하지만 PQ 자체의 기본 성격은 `최종 display luminance를 표현하는 함수`에 가깝다.

### PQ와 HDR10

HDR10은 PQ를 사용하는 대표적인 HDR 배포 형식이다.

```text
HDR10
color primaries: Rec.2020 container
transfer:        PQ / SMPTE ST 2084
bit depth:       보통 10-bit
metadata:        static metadata
```

HDR10 metadata에는 mastering display color volume, mastering display minimum/maximum luminance, MaxCLL, MaxFALL 같은 정보가 들어간다. 이 정보는 TV가 자기 peak brightness와 black level에 맞게 tone mapping할 때 참고한다.

예를 들어 1,000 nits 기준으로 마스터링된 콘텐츠를 600 nits TV에서 보면, TV는 모든 하이라이트를 그대로 낼 수 없다. 이때 PQ code를 해석한 뒤 하이라이트를 눌러 담는 tone mapping이 필요하다.

```text
PQ HDR content
    ↓ PQ EOTF
target display luminance intent
    ↓ display tone mapping
actual display output
```

### PQ를 SDR에서 잘못 보면 왜 이상한가

PQ 영상은 PQ EOTF로 해석해야 한다. 그런데 SDR 경로에서 sRGB나 Rec.709처럼 잘못 해석하면 밝기 관계가 틀어진다.

```text
PQ code value
    ↓ 잘못된 SDR gamma 해석
의도와 다른 어둡거나 이상한 화면
```

그래서 HDR PQ를 SDR로 보여주려면 다음 과정이 필요하다.

```text
PQ HDR
    ↓ PQ decode
HDR luminance
    ↓ tone mapping
SDR luminance range
    ↓ Rec.709 / sRGB encoding
SDR signal
```

## HLG 자세히 이해하기

HLG는 `Hybrid Log-Gamma`의 약자다. BBC와 NHK가 방송 HDR을 위해 개발했고, PQ와 함께 ITU-R BT.2100의 HDR transfer 방식으로 정의되어 있다.

HLG를 한 문장으로 정리하면 다음과 같다.

```text
방송/라이브 환경에서 metadata 의존도를 낮추고,
다양한 디스플레이가 자기 성능에 맞춰 HDR을 표시하도록 만든 상대 밝기 기반 HDR 방식
```

### 왜 Hybrid Log-Gamma인가

HLG 곡선은 이름처럼 두 성격을 섞는다.

```text
어두운 영역 ~ 중간톤: gamma 성격
밝은 영역 / 하이라이트: log 성격
```

낮은~중간 밝기에서는 기존 SDR 감마 계열과 비슷한 톤 재현을 유지하고, 밝은 하이라이트에서는 log 형태로 더 넓은 범위를 압축한다.

```text
Gamma part → 중간톤과 SDR 계열 호환성 고려
Log part   → HDR highlight를 제한된 code value 안에 압축
```

그래서 HLG는 PQ보다 방송 제작과 실시간 송출에 더 잘 맞는다.

### HLG의 신호 흐름

HLG는 PQ처럼 `code value = 특정 nits`라고 강하게 고정하지 않는다. 개념적 흐름은 다음과 같다.

```text
scene light
    ↓ HLG OETF
HLG signal
    ↓ broadcast / distribution
HLG display
    ↓ HLG EOTF + system gamma
display light
```

여기서 중요한 것은 system gamma다. HLG는 디스플레이 peak brightness와 시청 환경에 따라 전체 장면 대비를 조정하는 시스템 감마 개념을 포함한다.

```text
더 밝은 HDR 디스플레이 → 더 넓은 highlight 표현
덜 밝은 HDR 디스플레이 → 자기 성능에 맞게 압축
```

따라서 같은 HLG code value라도 600 nits TV와 1,000 nits TV에서 실제 출력 nits가 달라질 수 있다.

### HLG가 방송에 유리한 이유

영화나 OTT는 후반 작업에서 장면별로 정교하게 grading하고 metadata를 붙일 수 있다. 반면 방송은 라이브 카메라, 실시간 스위칭, 실시간 송출, 다양한 수신 환경을 다뤄야 한다.

```text
live camera
    ↓ real-time production
    ↓ broadcast
    ↓ many different TVs
```

HLG는 이 환경에서 다음 장점을 가진다.

- 정적/동적 HDR metadata 의존도가 낮다.
- 라이브 제작에서 signal flow가 단순하다.
- 다양한 peak brightness의 TV에서 비교적 유연하게 표시된다.
- 기존 SDR 계열 장비와의 공존을 어느 정도 고려한다.

다만 HLG가 SDR과 완전히 동일하게 호환된다는 뜻은 아니다. HLG를 제대로 보려면 HLG transfer를 이해하는 HDR 디스플레이와 올바른 신호 해석이 필요하다.

### HLG의 밝기는 몇 nits인가

HLG에서는 이 질문에 PQ처럼 단순하게 답할 수 없다.

```text
PQ:  code value → 표준상 특정 nits
HLG: code value → 상대 신호 → display/system gamma에 따라 nits 결정
```

그래서 HLG는 제작자가 특정 픽셀을 "반드시 1,000 nits로 보여라"라고 지정하는 데는 PQ보다 덜 직접적이다. 대신 방송 환경에서는 metadata 없이도 여러 디스플레이가 자기 능력에 맞춰 자연스럽게 표시할 수 있다는 장점이 있다.

### HLG와 카메라 Log는 다른가

HLG에는 `Log`라는 단어가 들어가지만, S-Log, LogC, V-Log 같은 카메라 Log와 목적이 다르다.

```text
Camera Log
- 촬영 원본 저장용
- 후반 grading을 위한 acquisition curve
- scene exposure를 code value에 압축

HLG
- HDR 방송/표시용 신호 체계
- 최종 display adaptation까지 고려
- Rec.2100 HDR 표준의 일부
```

카메라가 HLG로 바로 녹화할 수는 있다. 그러나 이때의 HLG는 일반적인 후반 작업용 Log 원본이라기보다, 바로 HDR TV에서 볼 수 있는 표시/송출 신호에 더 가깝다.

## PQ와 HLG 비교

PQ와 HLG는 모두 HDR을 위한 transfer 방식이지만, 철학이 다르다.

```text
PQ
- 절대 display luminance 기반
- code value가 nits와 직접 연결
- 영화, OTT, HDR10, Dolby Vision, HDR10+에 적합
- mastering metadata와 tone mapping이 중요

HLG
- 상대 밝기 기반에 가까움
- display peak와 system gamma에 따라 실제 nits 결정
- 방송, 라이브, 실시간 송출에 적합
- metadata 의존도가 낮음
```

둘 중 어느 쪽이 더 우월하다기보다 목적이 다르다.

```text
정교한 마스터링과 절대 밝기 의도 전달 → PQ
라이브 방송과 다양한 수신 환경 대응       → HLG
```

## PQ 10,000 nits의 의미

PQ에서 10,000 nits는 최종 디스플레이 신호의 상한 기준이다. 실제 세상의 빛이 10,000 nits를 넘으면 촬영할 수 없다는 뜻이 아니다.

구분해야 할 것은 다음 두 축이다.

```text
scene exposure      카메라가 노출을 통해 받아들이는 장면의 상대적인 빛
display luminance   최종 디스플레이가 내는 절대 밝기, nits
```

PQ의 10,000 nits는 두 번째 축이다. 카메라가 태양 반사, 전조등, 불꽃 같은 매우 밝은 장면을 촬영할 수 있는지는 PQ의 상한이 아니라 센서 포화, 노출 설정, RAW/Log 보존, 후반 tone mapping에 의해 결정된다.

또한 `PQ code 1.0`이 표준상 10,000 nits라는 말은, 모든 HDR 콘텐츠의 가장 밝은 픽셀이 반드시 10,000 nits라는 뜻도 아니다.

예를 들어 1000 nits 기준으로 마스터링한 콘텐츠는 PQ code range의 일부만 사용할 수 있다. 4000 nits 기준 마스터는 더 높은 code value까지 사용할 수 있고, 10,000 nits는 PQ 체계가 정의한 이론적 상한이다.

```text
PQ 표준 상한         10,000 nits
콘텐츠 mastering peak  예: 1,000 / 4,000 nits
시청 디스플레이 peak   예: 600 / 1,000 / 2,000 nits
실제 표시 결과         tone mapping과 디스플레이 성능에 따라 결정
```

## 카메라가 세상의 모든 빛을 한 장면에 담을 수 있는가

아니다. 아무리 좋은 카메라도 세상의 모든 밝기 단계를 한 장면에 전부 담을 수는 없다.

```text
너무 적은 빛  → 노이즈에 묻힘
적절한 빛    → 정보로 기록됨
너무 많은 빛 → 센서 포화, clipping
```

그래서 촬영자는 조리개, 셔터스피드, ISO/EI, ND 필터, 조명을 조절해서 장면의 빛을 센서가 기록 가능한 범위 안으로 옮긴다.

```text
실제 세계의 넓은 빛 범위
    ↓ 노출 설정
센서가 기록 가능한 신호 범위
    ↓ RAW / Log / scene-linear
상대적인 촬영 신호
```

일반적인 카메라 촬영값은 절대 nits가 아니다. 기준 노출에 대한 상대적인 장면 신호에 가깝다. 절대 luminance 측정값으로 쓰려면 별도의 캘리브레이션, 촬영 조건, 측광 모델이 필요하다.

## 카메라 code value는 1.0을 넘는가

파일이나 신호로 저장되는 normalized camera code value는 보통 `0.0~1.0` 범위 안에 있다. 10-bit full range라면 실제 디지털 code는 `0~1023`이고, 이것을 정규화하면 `0.0~1.0`으로 볼 수 있다.

하지만 decode한 scene-linear 값은 `1.0`을 넘을 수 있다. 여기서 `1.0`은 물리적 최대 밝기가 아니라 기준 노출에 대한 상대값이기 때문이다.

```text
camera log code value: 0.0~1.0
decode된 scene-linear: 0.18보다 훨씬 클 수 있음
stop 값: 18% gray 기준으로 +몇 stop인지 표현
```

예를 들어 `18% gray = scene-linear 0.18 = 0 stop`으로 잡으면, `scene-linear 1.44`는 `+3 stops`다. 이미 1.0보다 크지만, 이것은 "잘못된 값"이 아니라 기준 회색보다 8배 밝은 장면 신호라는 뜻이다.

## Stop은 절대 밝기가 아니다

Stop은 빛의 배율을 나타내는 상대 단위다.

```text
+1 stop = 빛 2배
-1 stop = 빛 1/2배
+2 stops = 빛 4배
```

따라서 stop만 보고 "몇 nits"라고 말할 수 없다. 기준이 되는 조명, 노출, 반사율, 카메라 설정을 알아야 한다. 영상 제작에서 stop은 장면의 상대 노출을 비교하기 위한 언어이고, nits는 디스플레이가 실제로 내는 빛을 말하는 표시 장치 쪽 언어다.

## Log 영상이 회색으로 보이는 이유

보통 촬영/Log가 담으려는 scene dynamic range는 최종 디스플레이가 보기 좋게 표현할 수 있는 display dynamic range보다 넓다. 특히 SDR Rec.709는 표시 범위가 훨씬 좁다.

Log 영상을 display transform 없이 그대로 보면 회색/저대비로 보이는 이유는 다음과 같다.

1. 넓은 scene exposure range를 제한된 code value 안에 압축해 저장했다.
2. display EOTF나 tone curve로 대비를 펼치지 않았다.
3. 디스플레이가 Log code를 일반 영상 신호처럼 해석한다.

즉 Log가 회색으로 보이는 것은 "정보가 부족해서"가 아니라, 아직 최종 표시용 변환을 거치지 않았기 때문이다.

## 촬영 원본은 왜 최종 디스플레이보다 여유가 있어야 하나

좋은 최종 영상을 만들려면 촬영 원본과 중간 작업 데이터가 최종 디스플레이보다 넓은 dynamic range와 충분한 bit depth를 가지는 것이 유리하다.

### Dynamic range 여유

촬영 원본이 더 넓은 밝기 범위를 담고 있으면 후반에서 선택지가 생긴다.

- 하이라이트를 살릴 수 있다.
- 하이라이트를 부드럽게 눌러 담을 수 있다.
- 그림자 디테일을 어느 정도 살릴 수 있다.
- SDR과 HDR을 각각 다른 방식으로 만들 수 있다.

반대로 촬영 단계에서 이미 clipping된 정보는 나중에 복구할 수 없다.

### Bit depth 여유

넓은 범위를 낮은 bit depth에 억지로 넣으면 단계가 거칠어져 banding이 생긴다. 그래서 Log/RAW는 보통 10-bit, 12-bit, 16-bit float 같은 높은 bit depth로 다루는 것이 좋다.

```text
촬영 / 중간 원본
넓은 dynamic range + 높은 bit depth
        ↓ grading / tone mapping / display transform
최종 디스플레이용 영상
목표 display range + 배포 bit depth
```

## HDR 촬영에 필요한 조건

HDR 촬영에서 중요한 것은 단순히 "HDR 모드"가 아니라 넓은 scene exposure를 깨끗하게 보존할 수 있는 파이프라인이다.

촬영 쪽에서는 다음 요소가 중요하다.

- 충분한 센서 dynamic range
- 10-bit Log 이상, 가능하면 12-bit RAW/Log 또는 16-bit float 워크플로우
- RAW, ProRes RAW, BRAW, ARRIRAW, REDCODE RAW, X-OCN, 고품질 10/12-bit Log codec
- wide gamut camera color space
- ND 필터, false color, waveform, zebra, highlight warning을 이용한 노출 관리
- 정확한 ISO/EI, white balance, log curve, gamut, range metadata

카메라가 표현할 수 있는 실제 usable dynamic range는 센서, ISO/EI, 노이즈 기준, 노출 조건, codec에 따라 달라진다.

## HDR 디스플레이에 필요한 조건

HDR 표시 쪽에서는 다음 요소가 중요하다.

- 충분한 peak brightness
- 낮은 black level과 높은 contrast
- 10-bit 이상 신호 처리
- PQ/ST 2084 또는 HLG 지원
- 넓은 color gamut, 보통 Rec.2020 container와 높은 P3 커버리지
- D65 white point와 정확한 EOTF tracking
- tone mapping 동작의 품질
- HDR10, HDR10+, Dolby Vision 등 metadata 처리

현실적인 기준으로는 600 nits급 이상이면 HDR 효과를 확인할 수 있고, 1000 nits 이상이면 HDR mastering/검수에 더 유리하다. 전문 마스터링에서는 더 엄격한 레퍼런스 모니터와 캘리브레이션이 필요하다.

## 웹 브라우저에서 RGB를 nits로 표시할 수 있는가

일반적인 웹의 `rgb(255, 0, 0)`이나 CSS color 값은 "이 색을 몇 nits로 내라"는 명령이 아니다. 웹 컬러는 주로 color space, transfer curve, 상대적인 channel value를 정의한다.

실제 화면 밝기는 다음 요소에 의해 결정된다.

- 운영체제 color management
- 브라우저의 color management
- 디스플레이 ICC profile 또는 HDR 표시 모드
- 화면 밝기 설정
- 패널 peak brightness
- 주변 밝기와 자동 밝기 조정
- SDR/HDR compositing 방식

따라서 RGB Compare 탭에서 색공간별 RGB 값을 비교할 수는 있지만, 일반적인 SDR 웹 렌더링만으로 "이 카드는 정확히 100 nits로 보여야 한다"처럼 강제하기는 어렵다. HDR 지원 디스플레이와 HDR canvas/video 파이프라인을 사용하면 더 가까운 실험은 가능하지만, 여전히 브라우저/OS/디스플레이 경로 전체의 제약을 받는다.

## HDR 메타데이터의 목적

HDR 메타데이터는 최종 시청 디스플레이가 그 영상을 어떻게 해석하고 tone mapping해야 하는지 알려주는 힌트 또는 가이드 정보다.

```text
HDR metadata =
이 콘텐츠가 어떤 기준 디스플레이와 밝기 범위를 전제로 마스터링되었는지 알려주는 정보
```

HDR10의 정적 메타데이터에는 보통 다음 정보가 포함된다.

- Mastering Display Color Volume
  - mastering display primaries
  - white point
  - minimum luminance
  - maximum luminance
- MaxCLL
  - 콘텐츠 안에서 가장 밝은 픽셀의 최대 밝기
- MaxFALL
  - 프레임 평균 밝기의 최대값 중 최대값

이 정보는 디스플레이가 자신의 성능에 맞게 tone mapping을 수행하는 데 도움을 준다.

예를 들어 콘텐츠가 1000 nits 기준으로 마스터링되었고 TV가 600 nits까지만 낼 수 있다면, TV는 하이라이트를 어떻게 눌러 담을지 결정해야 한다.

## 정적 메타데이터와 동적 메타데이터

### 정적 메타데이터

정적 메타데이터는 작품 전체에 하나의 기준 정보를 제공한다. HDR10이 대표적이다.

장점은 단순하고 호환성이 높다는 것이다. 단점은 장면마다 밝기 특성이 크게 달라도 같은 기준 정보만 제공한다는 것이다.

### 동적 메타데이터

동적 메타데이터는 장면별 또는 프레임별로 tone mapping 힌트를 제공한다. HDR10+와 Dolby Vision이 대표적이다.

포함될 수 있는 정보는 다음과 같다.

- 장면/프레임의 최대 밝기
- 평균 밝기
- MaxRGB 분포 또는 percentile 정보
- 밝은 픽셀의 비율
- tone mapping knee point
- Bezier curve anchor 같은 tone curve 파라미터
- target display별 trim 정보
- saturation, chroma, lift, gamma, gain, tone detail 같은 보정 힌트
- colorist의 creative intent를 반영한 scene-by-scene 조정값

이 정보는 같은 HDR 영상을 1000 nits TV, 600 nits TV, SDR 변환 등 다양한 표시 환경에서 창작 의도에 가깝게 보이도록 돕는다.

동적 metadata는 크게 두 부류로 이해하면 좋다.

```text
측정/분석 정보  → 이 장면이 실제로 얼마나 밝고 어떤 분포를 가지는가
변환 지시/힌트 → 목표 디스플레이에서 어떻게 눌러 담을 것인가
```

HDR10+는 SMPTE ST 2094-40 계열의 dynamic metadata를 사용해 장면별 tone mapping 힌트를 제공한다. Dolby Vision은 여기에 더해 여러 target display에 대한 trim과 creative intent를 더 풍부하게 전달할 수 있다. 구현 세부 필드는 규격과 버전에 따라 다르지만, 공통 목적은 "디스플레이가 혼자 추측하지 않고, 제작자가 의도한 밝기/색 변환에 더 가깝게 가도록 돕는 것"이다.

## Grading, Tone Mapping, Display Transform

### Grading

Grading은 창작자가 원하는 룩을 만드는 색보정 작업이다. 노출, 대비, 채도, 피부톤, 장면 간 일관성, 색감 등을 조정한다.

### Tone Mapping

Tone mapping은 넓은 밝기 범위를 더 좁은 표시 범위에 맞게 압축하는 과정이다. HDR을 SDR로 만들거나, 1000 nits 마스터를 600 nits TV에 표시할 때 필요하다.

### Display Transform

Display transform은 작업 중인 색과 밝기 표현을 실제 출력 표준으로 변환하는 기술적 단계다. Log, scene-linear, ACES 같은 작업공간을 Rec.709, sRGB, PQ, HLG 같은 표시용 신호로 바꾼다.

전체 흐름은 다음처럼 볼 수 있다.

```text
Camera Log / RAW / scene-linear
    ↓ grading
graded working image
    ↓ display transform
    ↓ tone mapping
Rec.709 SDR / PQ HDR / HLG HDR
```

실제 파이프라인에서는 input transform, working color space, output transform의 순서가 더 세밀하게 나뉠 수 있다.

## HDR 최종 영상에 metadata를 넣는 이유

HDR metadata는 최종 시청 디스플레이가 다음 질문에 답하도록 돕는다.

```text
이 콘텐츠는 어떤 기준 모니터에서 만들어졌는가?
콘텐츠 안에서 가장 밝은 하이라이트는 어느 정도인가?
프레임 평균 밝기는 어느 정도인가?
내 디스플레이가 그 밝기를 못 내면 어떻게 줄여야 하는가?
```

따라서 metadata는 픽셀 값을 직접 바꾸는 영상 데이터가 아니라, color management와 tone mapping을 위한 설명서에 가깝다.

다만 metadata가 있다고 해서 모든 디스플레이가 같은 결과를 내는 것은 아니다. 같은 metadata를 받아도 제조사별 tone mapping, 패널 성능, 사용자의 화면 모드, 주변광 보정에 따라 결과가 달라질 수 있다.

## Transfer Characteristic 탭을 읽는 법

Transfer Characteristic 탭의 그래프는 기본적으로 `0~1 code value`와 `0~1 normalized light`를 비교한다. 일반 SDR transfer curve의 모양을 비교하기에는 좋지만, PQ의 절대 nits 의미를 완전히 보여주지는 않는다.

PQ의 경우 표준상 normalized luminance `1.0`은 10,000 nits에 대응한다. 그러나 실제 콘텐츠가 그 값을 사용한다는 뜻도 아니고, 실제 디스플레이가 그대로 출력한다는 뜻도 아니다. 콘텐츠 metadata, mastering peak, display peak, tone mapping에 따라 실제 출력은 달라진다.

따라서 이 탭에서 PQ 곡선을 볼 때는 다음처럼 이해하면 안전하다.

```text
그래프의 0~1 축: transfer curve 비교를 위한 normalized 축
PQ의 표준 의미: 1.0은 10,000 nits 기준
실제 표시 결과: 디스플레이와 tone mapping에 따라 달라짐
```

## 질문별 빠른 결론

### Gamma 함수는 왜 필요한가

제한된 code value를 인간 시각에 더 유리하게 배분하기 위해 필요하다. linear light는 계산에는 좋지만, 저장/전송에는 shadow와 midtone을 낭비 없이 표현하기 어렵다.

### 카메라 Log와 디스플레이 감마는 같은가

목적이 다르다. 카메라 Log는 촬영 장면의 scene exposure를 후반 작업용으로 압축 저장하는 곡선이고, 디스플레이 감마/EOTF는 code value를 실제 화면 빛으로 바꾸는 곡선이다.

### Log 영상이 회색인 이유는 무엇인가

넓은 scene dynamic range를 좁은 code range 안에 눌러 담았기 때문이다. 아직 display transform과 tone mapping을 거치지 않았기 때문에 대비와 채도가 낮아 보인다.

### PQ에서 1.0은 무조건 실제 10,000 nits인가

표준 정의상 `PQ code 1.0`은 10,000 nits에 대응한다. 그러나 실제 콘텐츠의 mastering peak와 실제 디스플레이 peak는 그보다 낮을 수 있다. 그래서 실제 출력은 tone mapping 결과다.

### HLG에서 같은 code value는 항상 같은 nits인가

아니다. HLG는 PQ처럼 절대 nits를 직접 지정하지 않는다. 같은 HLG signal도 디스플레이 peak brightness와 system gamma에 따라 실제 출력 nits가 달라질 수 있다.

### HLG는 SDR과 완전히 호환되는가

완전한 호환은 아니다. HLG는 SDR 계열과의 공존을 고려했기 때문에 PQ보다 덜 망가져 보일 수 있지만, 정확한 표시는 HLG를 이해하는 HDR 디스플레이와 올바른 color management가 필요하다.

### 실제 세상에 10,000 nits를 넘는 빛은 어떻게 되는가

카메라 촬영에서는 센서 포화와 노출 설정의 문제다. 최종 HDR 표시에서는 mastering과 tone mapping의 문제다. PQ의 10,000 nits는 디스플레이 신호 체계의 상한이지, 현실 세계 밝기의 상한이 아니다.

### HDR 촬영값은 절대 nits인가

일반적으로 아니다. 카메라 촬영값은 기준 노출에 대한 상대 신호다. 절대 nits로 해석하려면 캘리브레이션과 측광 조건이 필요하다.

### 촬영 원본이 최종 디스플레이보다 더 넓은 DR과 bit depth를 가져야 하는가

그렇다. 그래야 grading, tone mapping, SDR/HDR 변환 과정에서 하이라이트와 그림자를 더 자유롭게 조절하고 banding을 줄일 수 있다.

### HDR metadata는 왜 필요한가

레퍼런스 디스플레이, mastering brightness, 콘텐츠 밝기 분포, creative intent를 전달해 최종 디스플레이가 더 적절하게 tone mapping하도록 돕기 위해 필요하다.

## 핵심 정리

- Gamma/log 형태의 transfer는 제한된 code value를 더 유용하게 배분하기 위한 비선형 인코딩이다.
- Linear light는 계산에는 중요하지만, 저장/전송에는 항상 효율적인 표현이 아니다.
- PQ는 최종 디스플레이 luminance를 절대 nits 기준으로 정의하는 HDR EOTF다.
- PQ 10,000 nits는 디스플레이 신호 기준이지 카메라 촬영 한계가 아니다.
- HLG는 절대 nits 고정보다 방송/라이브 환경의 유연한 HDR 표시를 목표로 한다.
- 카메라 촬영값은 보통 절대 nits가 아니라 노출 기준의 상대 신호다.
- Log 영상은 display transform 없이 보면 회색/저대비로 보인다.
- HDR 제작에는 넓은 촬영 dynamic range, 충분한 bit depth, 정확한 color management, HDR display transform이 필요하다.
- HDR metadata는 디스플레이 tone mapping을 돕는 힌트이며, 동적 metadata는 장면별/프레임별로 더 세밀한 정보를 제공한다.

## 참고 자료

- ITU-R BT.2100, "Image parameter values for high dynamic range television for use in production and international programme exchange": https://www.itu.int/rec/r-rec-bt.2100
- SMPTE ST 2084:2014, "High Dynamic Range Electro-Optical Transfer Function of Mastering Reference Displays": https://pub.smpte.org/latest/st2084/st2084-2014.pdf
- ITU-R BT.2100-3 PDF: https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.2100-3-202502-I!!PDF-E.pdf
- Android NDK, `AHdrMetadata_smpte2086` reference: https://developer.android.com/ndk/reference/struct/a-hdr-metadata-smpte2086
- Dolby, "Best Practices: How to Calculate HDR10 Metadata (MaxFALL, MaxCLL)": https://professionalsupport.dolby.com/s/article/Calculation-of-MaxFALL-and-MaxCLL-metadata
- SMPTE ST 2094-40:2020, "Dynamic Metadata for Color Volume Transform": https://pub.smpte.org/pub/st2094-40/st2094-40-2020.pdf
- Dolby, "Dolby Vision Metadata Levels": https://professionalsupport.dolby.com/s/article/Dolby-Vision-Metadata-Levels
- Dolby, "The Dolby Vision Trim Controls": https://professionalsupport.dolby.com/s/article/The-Dolby-Vision-Trim-Controls
