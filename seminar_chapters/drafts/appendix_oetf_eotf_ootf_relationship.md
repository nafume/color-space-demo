# [Draft] Appendix. OETF, EOTF, and OOTF Relationship

## 이 appendix의 목적

이 appendix는 `Transfer Characteristic` 탭을 보면서 이어진 OETF, EOTF, OOTF 관계에 대한 질문과 답변을 하나의 흐름으로 정리한다.

핵심은 다음 문장이다.

```text
OETF와 EOTF는 일반적으로 완벽한 역함수 관계가 아니다.
```

이 사실이 처음에는 직관적이지 않다. `OETF = light → code`, `EOTF = code → light`라고 배우면 둘이 당연히 역함수처럼 보이기 때문이다. 하지만 실제 영상 시스템에서 OETF가 다루는 light와 EOTF가 만들어내는 light는 같은 대상이 아니다.

```text
OETF가 보는 light      scene light
EOTF가 만들어내는 light display light
```

`scene light`와 `display light`를 구분하지 않으면 BT.709, BT.1886, HLG, PQ, tone mapping, output transform의 역할이 모두 뒤섞여 보인다.

## 기본 용어

### OETF

OETF는 `Opto-Electronic Transfer Function`이다.

```text
optical light → electronic/video signal
```

전통적인 방송 표준 문맥에서는 카메라가 보는 장면의 빛을 비선형 영상 신호로 만드는 함수에 가깝다.

```text
scene light
    ↓ OETF
video signal / code value
```

BT.709의 OETF는 이 역사적 의미에 가깝다.

### EOTF

EOTF는 `Electro-Optical Transfer Function`이다.

```text
electronic/video signal → display light
```

디스플레이가 입력 code value를 실제 화면 밝기로 바꾸는 함수다.

```text
video signal / code value
    ↓ EOTF
display light
```

SDR 표시에서는 BT.1886이 대표적이고, HDR PQ에서는 SMPTE ST 2084 EOTF가 대표적이다.

### OOTF

OOTF는 `Opto-Optical Transfer Function`이다.

```text
scene light → display light
```

즉 카메라가 본 장면의 빛이 최종 디스플레이의 빛으로 어떻게 재현되는지를 나타내는 전체 시스템 관계다.

```text
scene light
    ↓ OETF
signal
    ↓ EOTF
display light
```

위 전체를 하나로 보면 OOTF다.

## OETF와 EOTF는 왜 완벽한 역함수가 아닌가

OETF와 EOTF가 완벽한 역함수라면 다음 관계가 된다.

```text
scene light
    ↓ OETF
signal
    ↓ inverse OETF
scene light 그대로 복원
```

하지만 영상 시스템의 실제 목적은 이것과 다르다.

```text
scene light를 물리적으로 그대로 복원하는 것
```

이 아니라,

```text
제한된 디스플레이와 특정 시청 환경에서 자연스럽고 의도한 모습으로 재현하는 것
```

에 가깝다.

장면의 빛과 디스플레이의 빛은 같은 조건에 있지 않다.

- 실제 장면은 매우 넓은 dynamic range를 가진다.
- 디스플레이는 출력 가능한 밝기 범위가 제한되어 있다.
- 실제 장면을 볼 때 눈은 그 장소의 주변 밝기에 적응한다.
- TV나 모니터를 볼 때는 작은 화면과 다른 주변 조명 환경에서 본다.
- 사람이 자연스럽다고 느끼는 것은 절대 nits 자체보다 톤 관계, 대비, 피부톤, 하이라이트 느낌에 더 크게 좌우된다.

따라서 영상 시스템은 scene light를 display light로 그대로 복제하지 않고, 시청 환경에 맞게 재렌더링한다.

## 왜 scene light를 display light로 물리적으로 그대로 복원하면 안 되는가

현실의 밝기 범위는 디스플레이보다 훨씬 넓다.

```text
어두운 실내 그림자       매우 낮은 밝기
조명 아래 흰 종이        수십~수백 nits 수준
밝은 하늘                수천 nits 이상
전조등 / 태양 반사        수만 nits 이상
태양 자체                그보다 훨씬 큼
```

이 장면을 물리적으로 그대로 재현하려면 디스플레이도 태양 반사와 하늘을 같은 실제 밝기로 내야 한다.

```text
현실의 30,000 nits 하이라이트
    ↓ 그대로 복원
화면의 30,000 nits 하이라이트
```

대부분의 디스플레이는 이를 낼 수 없다. 설령 가능하더라도 거실이나 작업실에서 작은 화면으로 보기에는 너무 눈부시거나 위험할 수 있다.

그래서 영상은 현실의 빛을 복사하는 것이 아니라, 현실의 인상을 제한된 화면 안에 재구성한다.

```text
넓은 scene light range
    ↓ rendering / tone mapping / system gamma
제한된 display light range
```

이 과정에서 하이라이트는 눌러 담고, 중간톤은 보기 좋은 위치에 두고, 그림자는 너무 뭉개지지 않도록 조정한다.

## 사람은 절대 밝기보다 관계를 많이 본다

우리가 화면을 보고 자연스럽다고 느낄 때 중요한 것은 절대 nits만이 아니다.

- 밝은 영역과 어두운 영역의 관계
- 중간톤의 위치
- 피부톤의 밝기
- 하이라이트가 얼마나 반짝이는지
- 그림자가 얼마나 깊게 보이는지
- 전체 장면 대비

현실의 10,000 nits 하이라이트를 화면에서 반드시 10,000 nits로 내야만 밝게 느끼는 것은 아니다. 주변 톤과의 관계가 잘 잡혀 있으면 600 nits나 1,000 nits에서도 충분히 밝고 자연스럽게 느껴질 수 있다.

이 때문에 scene light와 display light 사이에는 단순한 역함수가 아니라 의도적인 rendering transform이 필요하다.

## BT.709에서 정의하는 OETF는 무엇인가

BT.709의 OETF는 표준상 다음 역할에 가깝다.

```text
camera scene light → Rec.709 video signal
```

BT.709 OETF는 다음 형태다.

```text
V = 4.5L                         for 0 ≤ L < 0.018
V = 1.099L^0.45 - 0.099           for 0.018 ≤ L ≤ 1
```

여기서 `L`은 scene-linear light이고, `V`는 비선형 영상 신호다.

역함수는 다음처럼 쓸 수 있다.

```text
L = V / 4.5                       for 0 ≤ V < 0.081
L = ((V + 0.099) / 1.099)^(1/0.45) for 0.081 ≤ V ≤ 1
```

하지만 실제 SDR 디스플레이 표시에서는 보통 이 단순 역함수보다 BT.1886 EOTF를 기준으로 보는 것이 자연스럽다.

```text
display light ≈ V^2.4
```

따라서 BT.709 OETF와 BT.1886 EOTF는 완벽한 역함수가 아니다.

## BT.709 OETF는 최종 display light → delivery code 용인가

엄밀히 말하면 아니다.

BT.709 OETF의 표준적 의미는 다음에 가깝다.

```text
scene light → video signal
```

전통적인 방송 시스템에서는 카메라와 방송 신호가 더 직접적으로 연결되어 있었다.

```text
camera scene light
    ↓ BT.709 OETF
Rec.709 video signal
    ↓ transmission / recording
display EOTF
display light
```

그래서 BT.709 표준에서 OETF라고 부르는 함수는 역사적으로 카메라 쪽 함수로 이해하는 것이 맞다.

하지만 현대 후반 작업에서는 카메라가 바로 BT.709로 찍지 않는 경우가 많다.

```text
Camera RAW / Log
    ↓ input transform
scene-linear / working space
    ↓ grading
    ↓ tone mapping
Rec.709 display-referred image
    ↓ output encoding
Rec.709 delivery file
```

이 마지막 단계에서도 결과적으로 Rec.709 시스템이 기대하는 비선형 code value를 만들어야 한다. 그래서 실무적으로는 BT.709 OETF와 유사한 곡선 또는 Rec.709/BT.1886 시스템에 맞는 output transform이 적용된다.

그러나 이 경우를 개념적으로는 `OETF`라고 부르기보다 다음처럼 부르는 편이 덜 헷갈린다.

```text
output transform
display encoding
inverse EOTF
rendering transform
```

즉 같은 Rec.709 delivery code를 만들더라도, 그것이 항상 카메라에 직접 적용된 BT.709 OETF라는 뜻은 아니다.

## 최종 display light를 delivery code로 바꾸는 과정

이미 color grading과 tone mapping이 끝나서 "이렇게 표시되면 좋겠다"는 display-referred light가 있다면, 그것을 delivery code로 만드는 과정은 다음에 가깝다.

```text
desired display light
    ↓ inverse EOTF / output encoding
delivery code
```

이것은 넓은 의미에서는 `light → code` 변환이므로 OETF처럼 보일 수 있다. 하지만 표준 용어를 엄밀하게 쓰면 `inverse EOTF` 또는 `output transform`이라고 부르는 편이 더 정확하다.

특히 PQ에서는 이 구분이 중요하다.

```text
desired display nits
    ↓ inverse PQ EOTF
PQ code
    ↓ PQ EOTF
display nits
```

PQ는 카메라 scene light를 직접 code로 바꾸는 OETF라기보다, 표시하고 싶은 절대 display luminance를 code value로 인코딩하는 display-referred 체계에 가깝다.

## BT.709 OETF와 BT.1886 EOTF를 합치면 무엇이 남는가

BT.709 OETF와 BT.1886 EOTF를 단순화하면 다음처럼 볼 수 있다.

```text
BT.709 OETF   ≈ L^0.45
BT.1886 EOTF  ≈ V^2.4
```

둘을 합치면:

```text
display light ≈ (scene light^0.45)^2.4
              ≈ scene light^1.08
```

즉 완벽히 `scene light^1.0`으로 돌아가지 않고, 약간의 system gamma가 남는다.

이 system gamma는 실수로 생긴 오차라기보다 시청 환경에서 자연스러운 대비를 만들기 위한 시스템 설계에 가깝다. 특히 어두운 방이나 제한된 화면 밝기에서는 장면의 물리적 밝기를 그대로 복원하는 것보다 약간의 대비 shaping이 더 자연스럽게 느껴질 수 있다.

## HLG에서 OETF와 EOTF의 관계

HLG도 OETF와 EOTF가 단순 역함수 관계가 아니다.

HLG OETF는 다음 형태다.

```text
E' = sqrt(3E)                     for 0 ≤ E ≤ 1/12
E' = a ln(12E - b) + c             for 1/12 < E ≤ 1
```

상수는 다음과 같다.

```text
a = 0.17883277
b = 0.28466892
c = 0.55991073
```

HLG OETF의 순수 역함수는 다음과 같다.

```text
E = E'^2 / 3                       for 0 ≤ E' ≤ 0.5
E = (exp((E' - c) / a) + b) / 12    for 0.5 < E' ≤ 1
```

하지만 실제 HLG 표시에는 여기서 끝나지 않고 system gamma가 들어간다.

```text
HLG signal
    ↓ inverse HLG OETF
relative scene light
    ↓ system gamma / OOTF
display light
```

1000 nits 기준 HLG reference display에서는 system gamma를 대략 `1.2`로 볼 수 있다.

```text
display light ∝ E^1.2
```

따라서 HLG EOTF는 단순히 HLG OETF의 역함수만이 아니라, inverse OETF와 OOTF가 결합된 표시 시스템으로 이해해야 한다.

## PQ에서는 왜 역함수처럼 보이는가

PQ는 BT.709나 HLG와 성격이 다르다.

PQ는 기본적으로 display-referred EOTF다.

```text
PQ code → absolute display luminance in nits
```

그리고 inverse PQ는 다음 역할을 한다.

```text
display luminance in nits → PQ code
```

따라서 같은 display luminance 기준 안에서는 PQ EOTF와 inverse PQ EOTF가 수학적으로 거의 완벽한 역함수 쌍이다.

하지만 이것은 카메라 OETF와 EOTF가 역함수라는 뜻이 아니다. PQ는 애초에 scene light를 직접 code로 만드는 카메라 OETF라기보다, 표시하고 싶은 display nits를 code value로 표현하는 HDR display-referred transfer에 가깝다.

## Transfer 그래프를 읽을 때 주의할 점

`Transfer Characteristic` 탭에서 그래프를 볼 때는 축 모드와 함수 모드를 구분해야 한다.

### X=input, Y=output 모드

이 모드는 함수 자체를 직접 읽기 쉽다.

```text
EOTF / Decode: code → light
OETF / Encode: light → code
```

다만 두 곡선이 같은 축에 함께 올라오므로, 서로 역함수인지 바로 판단하기에는 조심해야 한다.

### X=Light, Y=Code 모드

이 모드는 "같은 light에 대해 어떤 code가 대응되는가"를 보기 좋다.

```text
X축: light
Y축: code
```

이 모드에서 수학적으로 완벽한 역함수 쌍이라면 encode와 decode가 같은 곡선 위에 겹쳐야 한다.

하지만 다음 표준들은 의도적으로 완벽히 겹치지 않을 수 있다.

- BT.709 OETF와 BT.1886 EOTF
- BT.601 OETF와 BT.1886 EOTF
- BT.2020 OETF와 BT.1886 EOTF
- HLG OETF와 HLG system gamma 포함 EOTF

이는 버그가 아니라 OETF, EOTF, OOTF를 분리해서 봐야 하는 구조 때문이다.

반면 다음은 같은 기준에서는 거의 역함수처럼 겹칠 수 있다.

- sRGB encode와 sRGB EOTF
- Adobe RGB gamma encode와 decode
- ProPhoto RGB encode와 decode
- PQ EOTF와 inverse PQ EOTF

## 질문별 빠른 결론

### EOTF와 OETF는 완벽한 역함수인가

일반적으로 아니다. OETF는 scene light를 signal로 만들고, EOTF는 signal을 display light로 만든다. scene light와 display light가 같은 것이 아니기 때문에 둘은 완벽한 역함수일 필요가 없다.

### OETF는 카메라에서 촬영한 영상을 신호로 압축할 때 적용되는가

표준/방송 시스템 문맥에서는 그렇다. BT.709 OETF는 기본적으로 camera scene light를 Rec.709 video signal로 만드는 함수로 이해하는 것이 맞다.

### OETF는 grading과 tone mapping이 끝난 빛을 delivery code로 바꾸는 함수인가

엄밀히는 그렇게 부르지 않는 편이 좋다. 그 경우는 `inverse EOTF`, `output transform`, `display encoding`이라고 부르는 편이 더 정확하다. 다만 결과적으로 `light → code` 형태라서 실무 대화에서는 OETF처럼 이야기될 수 있다.

### BT.709 표준에서 정의하는 OETF는 최종 display light → delivery code 용인가

원래 의미는 아니다. BT.709 OETF는 camera/scene light → video signal 함수다. 현대 후반 작업에서 Rec.709 delivery를 만들 때 유사한 output encoding이 쓰일 수 있지만, 그것은 개념적으로 output transform에 가깝다.

### scene light를 display light로 물리적으로 그대로 복원하면 왜 안 되는가

현실 장면의 밝기 범위는 디스플레이보다 훨씬 넓고, 시청 환경도 다르다. 사람이 자연스럽다고 느끼는 것은 절대 밝기 복사가 아니라 톤 관계와 대비 재현에 더 가깝다. 그래서 tone mapping, system gamma, rendering transform이 필요하다.

### OOTF는 왜 필요한가

OOTF는 scene light가 display light로 어떻게 재현되는지 나타내는 전체 관계다. OETF와 EOTF가 완벽한 역함수가 아니라면, 둘 사이에 남는 의도적 변환이 바로 OOTF의 핵심이다.

## 핵심 정리

- OETF는 전통적으로 scene light를 video signal로 만드는 함수다.
- EOTF는 video signal을 display light로 만드는 함수다.
- OETF와 EOTF는 일반적으로 완벽한 역함수가 아니다.
- 둘을 합친 scene light → display light 관계가 OOTF다.
- BT.709 OETF와 BT.1886 EOTF는 역함수가 아니며 system gamma가 남는다.
- HLG도 inverse OETF 뒤에 system gamma/OOTF가 들어가므로 단순 역함수가 아니다.
- PQ EOTF와 inverse PQ는 display luminance 기준에서는 역함수에 가깝지만, 카메라 OETF와의 관계는 아니다.
- 최종 display light를 delivery code로 바꾸는 단계는 OETF라기보다 inverse EOTF 또는 output transform으로 부르는 것이 명확하다.
- 영상 시스템의 목적은 현실 빛을 물리적으로 복사하는 것이 아니라, 제한된 디스플레이와 시청 환경에서 자연스럽고 의도한 모습으로 재현하는 것이다.

## 참고 자료

- ITU-R BT.709, "Parameter values for the HDTV standards for production and international programme exchange": https://www.itu.int/rec/R-REC-BT.709
- ITU-R BT.1886, "Reference electro-optical transfer function for flat panel displays used in HDTV studio production": https://www.itu.int/rec/R-REC-BT.1886
- ITU-R BT.2100, "Image parameter values for high dynamic range television for use in production and international programme exchange": https://www.itu.int/rec/R-REC-BT.2100
- ITU-R BT.2390, "High dynamic range television for production and international programme exchange": https://www.itu.int/rec/R-REC-BT.2390
