# PQ와 HDR 메타데이터 정리

## 문서 목적

이 문서는 PQ(Perceptual Quantizer), HDR10의 정적 메타데이터, Dolby Vision/HDR10+의 동적 메타데이터, 그리고 이런 메타데이터가 실제 TV까지 전달되는 경로를 정리한다.

핵심 질문은 다음과 같다.

- PQ 곡선은 무엇인가?
- PQ로 인코딩된 10-bit 코드값을 디코딩하면 nits가 되는가?
- PQ가 절대 휘도 기반이라면 마스터링 메타데이터는 왜 필요한가?
- 마스터링 메타데이터가 없으면 디스플레이는 어떻게 표시해야 하는가?
- Dolby Vision이나 HDR10+의 동적 메타데이터는 왜 필요한가?
- HDR 메타데이터는 실제로 TV까지 전송되는가?

## 1. PQ란 무엇인가?

PQ는 Perceptual Quantizer의 약자이며, HDR 영상에서 디지털 코드값을 실제 화면 밝기, 즉 휘도(nits, cd/m2)로 연결하기 위한 전송 함수다. 표준 이름으로는 SMPTE ST 2084에 정의된 EOTF(Electro-Optical Transfer Function)다.

```text
PQ
= 사람 눈의 밝기 지각 특성에 맞춰
  디지털 코드값을 절대 휘도 값으로 매핑하는 HDR용 EOTF
```

SDR의 감마 계열 곡선은 대체로 디스플레이 기준의 상대 밝기와 연결된다.

```text
SDR code value
-> 상대적인 밝기
-> 디스플레이의 기준 흰색과 최대 밝기에 맞춰 표시
```

반면 PQ는 코드값이 절대 휘도에 대응한다.

```text
PQ code value 0.0
-> 0 nits

PQ code value 1.0
-> 10000 nits
```

즉 PQ에서는 같은 코드값이면 원칙적으로 같은 목표 휘도를 뜻한다.

## 2. PQ는 EOTF다

PQ/ST 2084는 기본적으로 EOTF다.

```text
EOTF
= Electrical-Optical Transfer Function
= 전기적/디지털 신호값 -> 화면의 실제 빛
```

PQ의 기본 방향은 다음과 같다.

```text
PQ code value
-> display luminance in cd/m2
```

카메라나 그레이딩 시스템이 장면 또는 마스터 영상을 PQ 코드값으로 만드는 과정은 inverse EOTF 또는 인코딩 쪽 과정으로 볼 수 있다. 하지만 PQ 표준의 핵심은 디스플레이 출력 쪽에서 코드값을 절대 휘도로 해석하는 EOTF라는 점이다.

## 3. PQ는 감마 곡선이 아니다

일반적인 감마 곡선은 대략 다음처럼 생각할 수 있다.

```text
L = V^gamma
```

PQ는 단순 거듭제곱 곡선이 아니다. 사람 눈이 어두운 영역에서는 밝기 차이에 민감하고, 밝은 영역에서는 같은 절대 차이에 상대적으로 덜 민감하다는 특성을 반영해 코드값을 배치한다.

```text
어두운 영역
-> 작은 밝기 차이도 잘 보이므로 코드값을 촘촘히 배치

밝은 영역
-> 매우 넓은 휘도 범위를 다루되 지각 특성에 맞게 코드값 배치
```

이런 이유로 PQ는 제한된 비트 수로 HDR의 넓은 밝기 범위를 효율적으로 담을 수 있다. 따라서 PQ는 "HDR용 감마"라기보다, HDR 휘도 범위를 지각적으로 양자화하기 위한 별도의 EOTF로 이해하는 편이 정확하다.

## 4. Barten 모델과 Barten ramp

PQ가 만들어진 배경에는 인간 시각의 밝기 구분 능력을 모델링하려는 연구가 있다. 그중 자주 언급되는 것이 Barten의 contrast sensitivity model이다. Barten 모델은 사람이 어떤 밝기와 관찰 조건에서 얼마나 작은 밝기 차이를 구분할 수 있는지 설명한다.

핵심 개념은 JND(Just Noticeable Difference)다.

```text
JND
= 사람이 겨우 구분할 수 있는 최소 차이
```

어떤 기준 밝기 `L`에서 사람이 구분할 수 있는 최소 밝기 차이를 `Delta L`이라고 하면, 그 근처에서 다음 두 밝기는 겨우 구분 가능한 단계가 된다.

```text
L
L + Delta L
```

Barten ramp는 엄밀한 표준명이라기보다, Barten의 시각 모델과 JND threshold를 바탕으로 계조나 banding의 가시성을 설명하는 ramp 예시로 이해하는 것이 안전하다. 일반적인 물리 밝기 ramp가 밝기를 균등하게 늘린다면, Barten/JND 기반 ramp는 인접 단계가 사람 눈에 비슷한 정도로 구분되도록 만든다.

```text
일반 luminance ramp:
0, 10, 20, 30, 40 ... nits

Barten/JND 기반 ramp:
step 0 -> step 1: 약 1 JND
step 1 -> step 2: 약 1 JND
step 2 -> step 3: 약 1 JND
...
```

즉 물리적 밝기 간격은 균등하지 않지만, 지각상 차이는 비슷하게 배치하려는 ramp다.

## 5. Minimum contrast step %의 의미

Barten ramp 그래프에서 `minimum contrast step %`는 특정 기준 밝기에서 사람이 겨우 구분할 수 있는 최소 상대 밝기 차이를 뜻한다.

```text
minimum contrast step %
= Delta L / L * 100
```

예를 들어 기준 밝기 `L = 100 nits`에서 minimum contrast step이 `1%`라면 다음 정도의 차이가 있어야 단계가 보일 수 있다.

```text
Delta L = 100 * 0.01
        = 1 nit

100 nits와 101 nits가 겨우 구분 가능
```

기준 밝기 `L = 0.001 nits`에서 minimum contrast step이 약 `8..10%`라면 다음처럼 볼 수 있다.

```text
8%:
Delta L = 0.001 * 0.08
        = 0.00008 nits

0.00100 nits -> 0.00108 nits
```

```text
10%:
Delta L = 0.001 * 0.10
        = 0.00010 nits

0.00100 nits -> 0.00110 nits
```

이 값은 관찰 조건, 시야각, 공간 주파수, 주변 밝기, 패턴 크기에 따라 달라질 수 있다. 따라서 `0.001 nits에서는 항상 정확히 10%`라고 외우기보다, 매우 어두운 영역에서는 기준 밝기 대비 꽤 큰 비율 차이가 필요할 수 있다고 이해하는 편이 안전하다.

여기서 헷갈리기 쉬운 점은 절대 밝기 차이와 상대 밝기 차이가 다르게 움직인다는 것이다.

```text
어두운 영역:
L = 0.001 nits
Delta L = 0.0001 nits
Delta L / L = 10%

밝은 영역:
L = 100 nits
Delta L = 1 nit
Delta L / L = 1%
```

절대 밝기 차이만 보면 어두운 영역의 `0.0001 nits`가 밝은 영역의 `1 nit`보다 훨씬 작다. 따라서 “어두운 영역에서는 더 작은 절대 밝기 차이를 구분할 수 있다”는 직관은 틀리지 않는다. 하지만 기준 밝기 `L` 자체가 매우 작기 때문에, 그 작은 절대 차이가 비율로는 크게 나타날 수 있다.

```text
절대 밝기 차이 Delta L:
어두운 영역에서 작을 수 있음

상대 밝기 차이 Delta L / L:
아주 어두운 영역에서는 오히려 커질 수 있음
```

그래서 Barten ramp의 minimum contrast step %는 “몇 nits 차이가 필요한가”가 아니라 “현재 밝기에 비해 몇 % 차이가 나야 보이는가”를 보여주는 그래프다.

## 6. Barten ramp가 PQ로 이어지는 방식

PQ의 핵심 문제는 다음과 같다.

```text
0..10000 nits의 매우 넓은 HDR 밝기 범위를
10-bit 또는 12-bit 코드값으로 표현할 때
어디에 코드를 많이 배치해야 banding이 덜 보이는가?
```

휘도를 선형으로 나누면 10-bit 기준 한 단계가 대략 다음 정도가 된다.

```text
10000 / 1023 = 약 9.8 nits
```

밝은 영역에서는 10 nits 차이가 잘 안 보일 수 있지만, 어두운 영역이나 중간톤에서는 너무 거친 단계가 될 수 있다. 그래서 물리적 휘도에 균등하게 코드를 나누는 것은 HDR에 비효율적이다.

Barten/JND 기반 접근은 다른 질문을 던진다.

```text
물리적으로 같은 간격인가?
```

보다,

```text
사람 눈에 같은 정도의 차이로 보이는가?
```

가 중요하다.

개념적으로는 다음 흐름이다.

```text
1. 각 휘도 L에서 사람이 겨우 구분하는 Delta L을 구한다.
2. 휘도 축을 JND 단위로 다시 나눈다.
3. 코드값을 물리 휘도에 균등하게 주지 않고 JND 축에 균등하게 준다.
4. 지각적으로 더 균일한 HDR 전송 곡선을 만든다.
```

다른 식으로 쓰면 다음과 같다.

```text
physical luminance L
-> visual threshold Delta L(L)
-> 누적 JND 수 P(L)
-> P(L)를 균등하게 코드값으로 배치
```

PQ는 이 방향의 설계를 표준화한 EOTF다.

```text
PQ code value
= 물리적 휘도에 균등한 코드가 아니라
  지각상 차이에 가깝게 균등한 코드
```

그래서 이름이 Perceptual Quantizer다. 즉 “지각적으로 양자화한다”는 뜻이다.

Barten model, Barten ramp, PQ의 관계는 다음처럼 정리할 수 있다.

```text
Barten model:
사람 눈이 밝기 차이를 얼마나 구분하는가?

Barten/JND ramp:
그 구분 임계값에 맞춰 밝기 단계를 배열하면 어떤 ramp가 되는가?

PQ:
그 지각적 밝기 단계를 HDR 코드값으로 쓰기 위한 표준화된 EOTF
```

## 7. PQ의 밝기 범위와 수식

PQ는 최대 10000 nits까지 정의되어 있다.

```text
0 nits
-> black

100 nits
-> SDR reference white 근처

1000 nits
-> 흔한 HDR mastering peak 중 하나

4000 nits
-> 일부 HDR mastering peak

10000 nits
-> PQ 표준의 최대 정의 범위
```

하지만 실제 콘텐츠가 항상 10000 nits까지 쓰는 것은 아니고, 실제 HDR 디스플레이가 모두 10000 nits를 낼 수 있는 것도 아니다.

PQ EOTF의 형태는 다음과 같다.

```text
N = normalized PQ signal, 0..1
L = luminance, cd/m2

L = 10000 * ((max(N^(1/m2) - c1, 0)) / (c2 - c3 * N^(1/m2)))^(1/m1)
```

상수는 다음과 같다.

```text
m1 = 2610 / 16384
m2 = 2523 / 32
c1 = 3424 / 4096
c2 = 2413 / 128
c3 = 2392 / 128
```

이 수식의 의미는 다음과 같다.

```text
0..1 PQ 코드값
-> 0..10000 nits 절대 휘도값
```

## 8. PQ 1.0은 항상 10000 nits인가?

PQ/ST 2084 자체에서는 normalized PQ 신호값 `1.0`이 항상 `10000 nits`를 의미한다. 별도의 파라미터로 `PQ 1.0 = 1000 nits` 또는 `PQ 1.0 = 4000 nits`처럼 재정의하지 않는다.

```text
PQ N = 0.0
-> 0 nits

PQ N = 1.0
-> 10000 nits
```

다만 실제 10-bit 파일에서는 full/limited range 해석을 거쳐 PQ normalized signal을 만든 뒤 ST 2084 EOTF에 넣는다.

```text
10-bit code
-> full/limited range 해석
-> 0..1 PQ normalized signal
-> ST 2084 EOTF
-> nits
```

예를 들어 10-bit narrow range HDR 영상에서는 대략 다음처럼 해석할 수 있다.

```text
code 64
-> PQ 0.0
-> 0 nits

code 940
-> PQ 1.0
-> 10000 nits
```

## 9. 4000..10000 nits 구간은 코드 낭비인가?

콘텐츠가 1000 nits 또는 4000 nits까지만 쓰는 경우가 많다면 `4000..10000 nits` 구간은 낭비처럼 보일 수 있다. 하지만 PQ는 선형 nits 분배가 아니라 지각 기반 분배라서 상단부에 전체 코드의 절반을 쓰는 구조가 아니다.

대표 휘도 지점의 PQ 위치는 다음과 같다.

| 휘도 | PQ normalized | 10-bit full code | 10-bit narrow code |
|---:|---:|---:|---:|
| `100 nits` | `0.508` | `520` | `509` |
| `1000 nits` | `0.752` | `769` | `723` |
| `4000 nits` | `0.903` | `923` | `855` |
| `10000 nits` | `1.000` | `1023` | `940` |

10-bit full range 기준으로 대략 나누면 다음과 같다.

```text
0..1000 nits:
code 0..769 근처 사용
약 770개 코드

1000..4000 nits:
code 769..923 근처 사용
약 154개 코드

4000..10000 nits:
code 923..1023 근처 사용
약 100개 코드
```

10-bit narrow range 기준으로도 `4000..10000 nits`는 대략 `855..940`, 즉 약 85개 코드 정도다.

```text
4000..10000 nits:
narrow code 855..940
약 85개 코드
```

즉 상단부 코드 영역이 완전히 비는 콘텐츠가 있을 수는 있지만, 선형 휘도 분배처럼 큰 낭비가 생기는 구조는 아니다.

PQ가 `1.0 = 10000 nits`를 고정하는 이유는 코드값의 절대 휘도 의미를 유지하기 위해서다. 만약 콘텐츠마다 `PQ 1.0`의 의미가 달라진다면 다음 장점이 사라진다.

```text
PQ 1.0 = 1000 nits
PQ 1.0 = 4000 nits
PQ 1.0 = 10000 nits
```

이렇게 되면 디스플레이는 메타데이터 없이는 코드값을 해석할 수 없고, PQ의 핵심 장점인 절대 휘도 기준이 무너진다.

따라서 1000 nits 콘텐츠에서는 실제 픽셀 값 대부분이 `PQ 0.75` 이하에 머물 수 있다.

```text
1000 nits 콘텐츠:
대부분 PQ 0.0..0.75 범위 사용
0.75..1.0은 거의 비어 있을 수 있음
```

이는 일부 코드 영역을 사용하지 않는 대가로 다음 장점을 얻는 설계다.

```text
1. 코드값이 절대 nits 의미를 유지한다.
2. 1000/4000/10000 nits 콘텐츠를 같은 EOTF로 표현할 수 있다.
3. 디스플레이와 플레이어가 일관된 기준으로 tone mapping할 수 있다.
4. 미래의 더 밝은 디스플레이에도 같은 표준을 유지할 수 있다.
```

## 10. PQ 10-bit 코드값을 디코딩하면 nits인가?

큰 방향으로는 맞다. PQ로 인코딩된 10-bit 코드값을 ST 2084 EOTF로 디코딩하면 절대 휘도 값, 즉 nits(cd/m2)가 나온다고 이해할 수 있다.

```text
10-bit PQ code value
-> 0..1 normalized value
-> ST 2084 EOTF
-> luminance in cd/m2
```

다만 여기서 말하는 nits는 디스플레이가 반드시 그대로 낼 수 있는 실제 출력값이라기보다, 콘텐츠가 목표로 하는 표시 휘도 또는 신호 휘도다.

```text
PQ가 정의하는 것
= 픽셀 코드값의 목표 절대 밝기 의미

PQ가 보장하지 않는 것
= 모든 디스플레이가 그 nits를 그대로 출력할 수 있음
```

따라서 디스플레이가 콘텐츠의 목표 휘도를 낼 수 없으면 tone mapping이 필요하다.

## 11. PQ에서 10-bit가 중요한 이유

PQ는 0부터 10000 nits까지 매우 넓은 휘도 범위를 다룬다. 8-bit는 256단계뿐이므로 HDR 계조를 담기에 부족해 banding이 쉽게 생길 수 있다.

```text
8-bit  = 256 levels
10-bit = 1024 levels
12-bit = 4096 levels
```

PQ는 사람 눈의 밝기 지각에 맞춰 코드값을 배치하지만, HDR 범위가 넓기 때문에 실무에서는 보통 10-bit 이상을 전제로 한다. HDR10이 일반적으로 10-bit를 사용하는 이유도 여기에 있다.

## 12. HDR10에서 PQ가 쓰이는 방식

HDR10은 보통 다음 요소의 조합으로 이해할 수 있다.

```text
Transfer function: PQ / ST 2084
Color primaries: BT.2020 container
Matrix: BT.2020 non-constant luminance
Bit depth: 보통 10-bit
Metadata:
  - mastering display colour volume
  - MaxCLL
  - MaxFALL
```

즉 HDR10에서 "PQ 영상"이라고 하면 보통 다음을 뜻한다.

```text
BT.2020 색공간 컨테이너 안에
PQ transfer로 인코딩된
10-bit HDR 영상
```

HDR10의 메타데이터는 정적 메타데이터(static metadata)다. 즉 영상 전체에 대해 하나의 메타데이터 세트가 붙는다.

## 13. PQ가 절대 휘도라면 마스터링 메타데이터는 왜 필요한가?

PQ 코드값을 보면 각 픽셀이 목표로 하는 절대 휘도는 알 수 있다. 하지만 실제 디스플레이가 그 휘도를 모두 낼 수 없을 때, 어떻게 압축하고 매핑할지는 PQ 값만으로 충분히 알기 어렵다.

예를 들어 다음 두 콘텐츠는 모두 PQ를 쓸 수 있다.

```text
콘텐츠 A:
마스터링 모니터 peak = 1000 nits
실제 MaxCLL = 700 nits

콘텐츠 B:
마스터링 모니터 peak = 4000 nits
실제 MaxCLL = 2500 nits
```

두 콘텐츠 모두 PQ 코드값을 사용하지만, 디스플레이가 두 콘텐츠를 같은 방식으로 tone mapping하면 제작 의도와 멀어질 수 있다.

마스터링 메타데이터는 디스플레이와 플레이어에게 다음 정보를 제공한다.

| 메타데이터 | 의미 |
|---|---|
| mastering display primaries | 마스터링할 때 사용한 모니터의 RGB primary |
| mastering display white point | 마스터링 모니터의 white point |
| mastering display min luminance | 마스터링 모니터가 표현한 최소 휘도 |
| mastering display max luminance | 마스터링 모니터의 최대 휘도 |
| MaxCLL | 콘텐츠 전체에서 가장 밝은 픽셀 또는 sample의 최대 휘도 |
| MaxFALL | 콘텐츠의 프레임 평균 밝기 중 최대값 |

이 정보는 주로 tone mapping과 display adaptation에 쓰인다.

```text
PQ
= 각 픽셀 코드값의 절대 밝기 의미

마스터링 메타데이터
= 콘텐츠가 어떤 밝기/색역 조건에서 만들어졌고
  실제로 어느 밝기 범위를 쓰는지 알려주는 힌트
```

## 14. 마스터링 메타데이터가 없으면 어떻게 되는가?

마스터링 메타데이터가 없어도 디스플레이가 아무것도 못 하는 것은 아니다. PQ 코드값 자체는 여전히 절대 휘도 의미를 갖기 때문이다.

하지만 디스플레이의 최대 밝기를 초과하는 픽셀을 만나면 문제가 생긴다.

```text
콘텐츠 PQ 디코딩 결과:
대부분 0..200 nits
일부 하이라이트 1000 nits
극히 일부 4000 nits

디스플레이 peak:
600 nits
```

이 경우 디스플레이는 `1000 nits`와 `4000 nits`를 그대로 낼 수 없다. 단순한 선택지는 다음 두 가지다.

```text
1. 600 nits 초과를 전부 600 nits로 clipping
2. 전체 밝기 범위를 600 nits 안으로 tone mapping
```

Clipping은 쉽지만 하이라이트 디테일을 잃는다.

```text
1000 nits -> 600 nits
4000 nits -> 600 nits
```

이렇게 되면 구름, 반사광, 불꽃, 금속 하이라이트 같은 디테일이 같은 흰색 덩어리로 뭉개질 수 있다.

Tone mapping은 더 자연스럽지만 판단이 필요하다.

```text
중간톤은 유지할 것인가?
하이라이트만 압축할 것인가?
전체를 어둡게 내릴 것인가?
장면별로 다르게 처리할 것인가?
```

이 판단에는 콘텐츠 전체 또는 장면/프레임 정보가 도움이 된다. 따라서 다음처럼 이해할 수 있다.

```text
마스터링 메타데이터가 없으면
-> 디스플레이는 PQ 코드값의 절대 밝기만 보고 표시를 시도한다.
-> 디스플레이 peak를 넘는 값은 그대로 표현할 수 없다.
-> clipping하거나 자체 tone mapping을 해야 한다.
-> 제작 의도에 가까운 전체 밝기 매핑을 위해서는 콘텐츠 전체 정보가 필요하다.
```

많은 TV와 플레이어는 메타데이터가 없어도 기본 가정이나 자체 분석을 사용해 tone mapping을 한다.

```text
metadata 없음
-> PQ 값 자체를 읽음
-> 디스플레이 peak 초과 영역 감지
-> 기본 tone mapping curve 적용
또는
-> 프레임/장면 분석으로 동적 tone mapping
```

하지만 이 경우 제작자가 의도한 마스터링 조건을 정확히 아는 것이 아니라, 디스플레이나 플레이어가 추정해서 처리하는 것이다.

## 15. 정적 메타데이터와 동적 메타데이터

HDR10의 마스터링 메타데이터는 정적 메타데이터다.

```text
HDR10 static metadata:
이 영화/영상 전체는
- 이런 마스터링 디스플레이에서 만들었고
- 전체 최대 밝기는 대략 얼마고
- 전체 최대 평균 밝기는 얼마다
```

정적 메타데이터는 유용하지만, 영상 안의 모든 장면이 같은 밝기 특성을 갖는 것은 아니다.

```text
장면 A: 어두운 실내, 촛불만 300 nits
장면 B: 대낮 야외, 하늘과 태양 반사광 1500 nits
장면 C: 우주 장면, 대부분 0..20 nits, 별만 1000 nits
장면 D: 눈밭, 프레임 평균 밝기가 매우 높음
```

정적 메타데이터는 이 전체를 하나의 `MaxCLL`, `MaxFALL`, mastering display 정보로 요약한다. 그러면 디스플레이는 서로 다른 장면을 같은 전역 tone mapping 정책 안에서 처리해야 할 수 있다.

동적 메타데이터(dynamic metadata)는 장면별 또는 프레임별로 tone mapping에 필요한 힌트를 제공한다.

```text
dynamic metadata:
이 장면은 어둡고 하이라이트가 조금 있다.
다음 장면은 전체가 매우 밝다.
이 프레임은 평균 밝기가 높다.
이 하이라이트는 이렇게 보존해라.
```

즉 목적은 다음과 같다.

```text
콘텐츠 전체 평균적인 처리
-> 장면별/프레임별 최적화된 처리
```

## 16. Dolby Vision과 HDR10+의 동적 메타데이터가 필요한 이유

Dolby Vision과 HDR10+는 동적 메타데이터를 사용해 HDR10 정적 메타데이터의 한계를 보완한다.

예를 들어 영상 전체에서 딱 한 장면에만 `4000 nits` 하이라이트가 있고, 나머지 대부분 장면은 `0..600 nits` 안에 있다고 하자.

```text
정적 tone mapping:
"이 콘텐츠는 4000 nits까지 쓰는구나"
-> 전체적으로 하이라이트 압축을 강하게 잡음
-> 대부분 장면이 불필요하게 어둡거나 밋밋해질 수 있음
```

동적 메타데이터는 장면별로 다른 정보를 줄 수 있다.

```text
장면 1:
peak 500 nits
-> 거의 그대로 표시

장면 2:
peak 4000 nits
-> 하이라이트만 강하게 압축

장면 3:
peak 1000 nits, average 80 nits
-> 중간톤 유지, 하이라이트 보존
```

동적 메타데이터가 담는 정보의 성격은 대략 다음과 같다.

| 정보 | 역할 |
|---|---|
| 장면/프레임 peak luminance | 이 구간에서 가장 밝은 값이 어느 정도인지 알려준다. |
| 장면/프레임 average luminance | 전체 밝기 수준이 어느 정도인지 알려준다. |
| tone mapping curve 힌트 | 어느 구간을 유지하고 어느 구간을 압축할지 안내한다. |
| knee point / roll-off 정보 | 하이라이트 압축 시작점과 방식을 안내한다. |
| target display 정보 | 특정 밝기 디스플레이에 맞춘 변환 지침을 줄 수 있다. |
| color saturation 조정 힌트 | tone mapping 중 색이 빠지거나 과해지는 문제를 보정하는 데 도움을 준다. |

중요한 점은 동적 메타데이터가 원본 픽셀을 대체하는 데이터가 아니라는 것이다. 원본 PQ 신호를 실제 디스플레이 능력에 맞춰 매핑할 때 쓰는 장면별 안내서에 가깝다.

```text
PQ
= 픽셀의 목표 절대 휘도

static metadata
= 콘텐츠 전체의 제작/밝기 범위

dynamic metadata
= 장면별/프레임별 tone mapping 최적화 힌트
```

## 17. Dolby Vision과 HDR10+ 비교

Dolby Vision과 HDR10+는 둘 다 동적 메타데이터를 사용하지만, 생태계와 방식이 다르다.

| 항목 | Dolby Vision | HDR10+ |
|---|---|---|
| 메타데이터 | 동적 메타데이터 | 동적 메타데이터 |
| 표준/운영 | Dolby 독자/라이선스 생태계 | Samsung/Amazon 등 중심, 개방형 성격 |
| tone mapping | Dolby 알고리즘/타깃 디스플레이 매핑 체계가 강함 | HDR10 기반에 장면별 메타데이터 추가 |
| bit depth | 최대 12-bit 워크플로 가능 | 보통 HDR10과 같은 10-bit 기반 |
| 호환성 | profile/level, base layer 구조에 따라 다름 | HDR10 backward-compatible |
| 목적 | 다양한 디스플레이에서 제작 의도에 가깝게 매핑 | HDR10보다 장면별 tone mapping 개선 |

특히 Dolby Vision은 구현 방식이 여러 가지다.

```text
TV-led Dolby Vision:
플레이어가 Dolby Vision 영상과 메타데이터를 TV로 전달
TV가 자기 패널에 맞게 mapping

Player-led / Low Latency Dolby Vision:
플레이어가 TV 능력 정보를 바탕으로 일부 mapping 수행
TV에는 이미 mapping된 Dolby Vision 신호를 전달
```

## 18. PQ와 HLG의 차이

PQ와 함께 자주 비교되는 HDR 방식이 HLG(Hybrid Log-Gamma)다.

| 항목 | PQ | HLG |
|---|---|---|
| 표준 | SMPTE ST 2084 | ARIB STD-B67, BT.2100 |
| 방식 | 절대 휘도 기반 | 상대 휘도 기반 |
| 최대 밝기 | 10000 nits까지 정의 | 디스플레이 시스템에 상대적 |
| 주 사용처 | HDR10, HDR10+, Dolby Vision | 방송 HDR |
| tone mapping | 디스플레이 peak에 따라 중요 | 방송 호환성에 유리 |
| 메타데이터 | HDR10에서는 mastering metadata와 함께 사용 | 보통 metadata 의존이 적음 |

간단히 말하면 다음과 같다.

```text
PQ:
이 코드값은 몇 nits인가?

HLG:
이 코드값은 디스플레이 시스템에서 어느 정도 밝기인가?
```

PQ는 제작자가 특정 마스터링 디스플레이와 절대 휘도 기준을 두고 화면을 설계하기 좋다. 대신 표시 장치가 콘텐츠보다 낮은 최대 밝기를 가질 때 tone mapping이 중요해진다.

HLG는 라이브 방송과 호환성에 강점이 있다. 정적 또는 동적 메타데이터에 덜 의존하고, 다양한 수신 환경에서 안정적인 표시를 목표로 한다.

## 19. HDR 메타데이터는 실제로 TV까지 전송되는가?

HDR 메타데이터는 실제로 TV까지 전송될 수 있다. 전달 경로는 크게 두 가지다.

```text
1. 영상 파일/스트림 안에서 전달
2. 외부 기기에서 HDMI를 통해 TV로 전달
```

### 14.1 영상 파일/스트림 안에서 전달

HDR 메타데이터는 보통 압축 영상 비트스트림이나 컨테이너 안에 들어 있다.

HDR10 HEVC/H.265 영상에서는 다음과 같은 SEI 메시지가 들어갈 수 있다.

```text
HEVC bitstream
├─ PQ encoded video samples
├─ mastering display colour volume SEI
└─ content light level SEI
   ├─ MaxCLL
   └─ MaxFALL
```

TV 내부 앱에서 재생하는 경우 HDMI를 거치지 않아도 된다.

```text
영상 스트림
-> TV 내부 앱 또는 TV SoC가 디코딩
-> HDR 메타데이터 읽음
-> tone mapping/display mapping에 사용
```

### 14.2 HDMI로 외부 기기에서 TV로 전달

외부 플레이어, 콘솔, 셋톱박스, PC가 TV에 연결되어 있으면 메타데이터는 HDMI를 통해 TV로 전달될 수 있다.

대표적인 전달 채널은 HDMI InfoFrame이다.

```text
외부 플레이어
-> HDMI video signal
-> HDMI InfoFrame / Vendor Specific InfoFrame
-> TV
```

HDR10의 정적 메타데이터는 HDMI의 HDR static metadata InfoFrame, 즉 Dynamic Range and Mastering InfoFrame 계열로 전달될 수 있다.

```text
HDMI
├─ 영상 샘플: RGB 또는 YCbCr
└─ HDR static metadata InfoFrame
   ├─ EOTF = PQ/ST 2084
   ├─ color primaries / white point
   ├─ mastering display min/max luminance
   ├─ MaxCLL
   └─ MaxFALL
```

TV는 HDMI 신호를 받을 때 다음과 같은 정보를 알 수 있다.

```text
이 신호는 PQ HDR이구나.
BT.2020 계열이구나.
마스터링 peak는 얼마구나.
MaxCLL/MaxFALL은 얼마구나.
```

### 14.3 Dolby Vision과 HDR10+의 전달

Dolby Vision과 HDR10+ 동적 메타데이터도 TV까지 전달될 수 있다. 다만 방식은 정적 HDR10보다 복잡하다.

| 포맷 | 전달 방식 |
|---|---|
| HDR10 | 정적 메타데이터. 비트스트림 SEI 또는 HDMI HDR InfoFrame |
| HDR10+ | 동적 메타데이터. 비트스트림 안의 dynamic metadata 또는 HDMI dynamic HDR metadata 경로 |
| Dolby Vision | Dolby 전용 메타데이터. 비트스트림, HDMI Vendor Specific InfoFrame, Dolby Vision 전용 신호 방식 등 |

Dolby Vision은 HDMI에서 Vendor Specific InfoFrame(VSIF) 같은 전용 경로를 사용할 수 있다.

## 20. TV가 받을 수 있는 HDR 형식은 어떻게 결정되는가?

외부 기기는 TV가 어떤 HDR 형식을 지원하는지 알아야 한다. 이 정보는 TV가 HDMI 쪽으로 제공하는 EDID에 들어 있다.

```text
TV EDID
-> HDR10 지원 여부
-> Dolby Vision 지원 여부
-> HDR10+ 지원 여부
-> 가능한 색공간/bit depth/해상도/주사율
```

플레이어는 EDID를 보고 보낼 신호를 결정한다.

```text
TV가 Dolby Vision 지원
-> Dolby Vision 출력 가능

TV가 HDR10만 지원
-> HDR10으로 fallback

TV가 HDR 미지원
-> SDR tone mapping 후 출력
```

## 핵심 요약

PQ는 HDR 영상의 코드값을 0..10000 nits 절대 밝기로 매핑하는 인간 시각 지각 기반의 HDR EOTF다.

```text
10-bit PQ code
-> 0..1 normalized value
-> ST 2084 EOTF
-> 절대 휘도 nits
```

하지만 PQ 값만으로 모든 표시 문제가 해결되는 것은 아니다. 실제 디스플레이가 콘텐츠의 목표 휘도를 낼 수 없으면 tone mapping이 필요하다.

```text
PQ
= 각 픽셀의 목표 절대 휘도

HDR10 static metadata
= 콘텐츠 전체의 마스터링 조건과 밝기 범위 힌트

Dolby Vision/HDR10+ dynamic metadata
= 장면별 또는 프레임별 tone mapping 힌트

HDMI InfoFrame / bitstream metadata
= 이 정보를 실제 TV까지 전달하는 경로
```

한 문장으로 줄이면 다음과 같다.

```text
PQ는 픽셀의 목표 밝기를 정의하고,
HDR 메타데이터는 그 목표 밝기를 실제 디스플레이 한계 안에서
제작 의도에 가깝게 매핑하도록 돕는 안내 정보다.
```
