# Color Range 정리

## 문서 목적

이 문서는 이미지와 영상에서 반복해서 등장하는 color range, full range, limited range, video range를 정리한다. 핵심은 color range가 색역(gamut), transfer function, matrix coefficients와 다른 개념이며, 픽셀 코드값을 실제 검정과 흰색 기준으로 해석하기 위한 규칙이라는 점이다.

핵심 질문은 다음과 같다.

- color range는 무엇을 정의하는가?
- full range와 limited range는 무엇이 다른가?
- limited range는 실제 dynamic range가 더 좁다는 뜻인가?
- full range를 limited range로 표현하려면 어떻게 스케일링해야 하는가?
- limited range는 왜 필요했는가?
- range를 잘못 해석하면 어떤 화면 문제가 생기는가?
- ICC 프로파일과 color range는 어떤 관계인가?

## 1. Color range란 무엇인가?

Color range는 디지털 코드값 중 어느 범위를 유효한 영상 또는 이미지 신호로 볼 것인지 정의하는 약속이다.

8-bit RGB 값은 숫자로만 보면 `0..255` 범위를 가질 수 있다. 하지만 같은 `RGB = (16, 16, 16)`이라도 full range로 해석하는지 limited range로 해석하는지에 따라 의미가 달라진다.

```text
full range에서 RGB 16
= 검정보다 조금 밝은 어두운 회색

limited range에서 RGB 16
= 기준 검정
```

즉 color range는 다음 질문에 답한다.

```text
픽셀 값 0, 16, 235, 255를
각각 얼마나 어둡고 밝은 값으로 해석할 것인가?
```

## 2. Full range와 limited range

8-bit 기준으로 대표적인 범위는 다음과 같다.

| Range | Black | White | 유효 범위 | 주 사용처 |
|---|---:|---:|---:|---|
| Full range RGB | `0` | `255` | `0..255` | 컴퓨터 그래픽, 일반 RGB 이미지, 스크린샷 |
| Limited/video range RGB | `16` | `235` | `16..235` | 영상/TV 계열 RGB 신호 |
| Limited/video range Y' | `16` | `235` | `16..235` | YCbCr의 luma 성분 |
| Limited/video range Cb/Cr | 중심 `128` | - | `16..240` | YCbCr의 chroma 성분 |

Full range는 가능한 코드값 전체를 검정부터 흰색까지의 유효 범위로 사용한다.

```text
8-bit full range:
0   = black
255 = white
```

Limited range는 검정과 흰색을 코드값 양끝에 붙이지 않고 중앙 구간에 배치한다.

```text
8-bit limited range:
16  = nominal black
235 = nominal white
```

여기서 `0..15`는 검정 아래쪽 여유 구간이고, `236..255`는 흰색 위쪽 여유 구간이다.

```text
0..15
= footroom
= super-black
= below black

236..255
= headroom
= super-white
= above white
```

## 3. Limited range는 실제 dynamic range가 더 좁다는 뜻인가?

Limited range는 디스플레이가 표현하는 실제 명암비나 장면의 물리적 dynamic range가 반드시 더 좁다는 뜻이 아니다. 더 정확히는 nominal black부터 nominal white까지 표현하는 데 사용하는 디지털 코드값 범위가 더 좁다는 뜻이다.

올바르게 해석하면 limited range에서도 화면상 검정과 흰색은 여전히 검정과 흰색이다.

```text
limited 16  -> display black
limited 235 -> display white
```

다만 같은 bit depth에서는 full range보다 nominal black-white 사이의 코드 단계 수가 줄어든다.

```text
8-bit full range:
0..255 = 256 levels

8-bit limited luma/RGB range:
16..235 = 220 levels
```

따라서 limited range는 실제 dynamic range를 의도적으로 낮추는 개념이라기보다, 코드값 양끝에 처리/전송/호환성용 여유 공간을 남기는 인코딩 규칙이다.

## 4. Full range와 limited range 변환

Full range RGB 값을 limited range RGB 값으로 표현하려면 `0..255`를 `16..235`로 스케일링한다.

8-bit 채널 하나에 대해 다음 식을 사용할 수 있다.

```text
limited = 16 + full * (235 - 16) / 255
        = 16 + full * 219 / 255
```

예를 들면 다음과 같다.

| Full range 값 | Limited range 값 |
|---:|---:|
| `0` | `16` |
| `128` | 약 `126` |
| `255` | `235` |

반대로 limited range를 full range로 되돌릴 때는 다음처럼 계산한다.

```text
full = (limited - 16) * 255 / 219
```

실제 구현에서는 반올림, 클램핑, bit depth, RGB인지 YCbCr인지에 따라 세부 처리가 달라질 수 있다.

## 5. YCbCr에서는 luma와 chroma 범위가 다르다

영상에서는 RGB보다 YCbCr로 저장하거나 전송하는 경우가 많다.

```text
Y'    = luma, 밝기 성분에 가까운 신호
Cb/Cr = chroma, 색차 성분
```

8-bit limited YCbCr에서는 보통 다음 범위를 사용한다.

```text
Y'    = 16..235
Cb/Cr = 16..240
```

YCbCr의 chroma 중심값은 보통 `128`이다.

```text
Cb = 128, Cr = 128
= 색차가 없는 중립 상태
```

따라서 RGB range와 YCbCr range를 완전히 같은 방식으로 생각하면 안 된다. RGB limited라면 R/G/B 각각을 대체로 `16..235`로 보지만, YCbCr limited에서는 luma와 chroma의 유효 범위가 다르다.

RGB와 YCbCr 사이를 변환할 때는 range scaling과 matrix coefficients가 함께 적용된다. 이때 range를 잘못 해석하면 밝기뿐 아니라 색과 채도도 틀어질 수 있다.

## 6. Limited range가 필요했던 이유

Limited range가 사용된 배경은 영상 신호를 안전하게 전송하고 처리하기 위한 여유 구간에 있다. 역사적으로 아날로그 방송/비디오 관습에서 이어진 면이 크고, 디지털 영상에서도 호환성과 처리 안정성 때문에 계속 쓰인다.

### 6.1 아날로그 영상 시절의 여유 구간

아날로그 신호는 전송, 녹화, 증폭, 필터링 과정에서 약간 튀거나 넘칠 수 있다. 기준 검정을 코드값 `0`에 두면 신호가 조금만 아래로 내려가도 바로 잘린다.

limited range는 기준 검정을 `16`에 둔다.

```text
0..15 = footroom
16    = nominal black
```

흰색도 마찬가지로 `255`가 아니라 `235`에 둔다.

```text
235      = nominal white
236..255 = headroom
```

이렇게 하면 신호가 기준 검정 아래나 기준 흰색 위로 조금 움직여도 곧바로 clipping되지 않는다.

### 6.2 필터링과 변환 과정의 overshoot/undershoot

영상은 저장과 표시 사이에 여러 처리를 거친다.

```text
YCbCr 변환
-> chroma subsampling
-> 리사이즈
-> 샤프닝
-> 압축/복원
-> 색공간 변환
```

이 과정에서 필터 계산 때문에 값이 잠시 튈 수 있다.

```text
원래 흰색 근처 값: 235
필터 처리 후: 238, 241 같은 값 발생 가능
```

limited range에서는 `236..255`의 headroom이 이런 overshoot를 어느 정도 담을 수 있다. full range에서 흰색이 이미 `255`에 붙어 있으면 위로 튀는 값은 곧바로 잘릴 수 있다.

### 6.3 방송/비디오 장비 간 호환성

방송 장비, 비디오 테이프, 캡처 카드, TV, 셋톱박스, 카메라, 편집기 등은 오랫동안 limited/video range를 전제로 동작해 왔다.

```text
black = 16
white = 235
```

이 규칙을 지키면 여러 장비를 거쳐도 기준 밝기를 안정적으로 유지하기 쉽다. 그래서 영상 표준과 방송/TV 워크플로에서는 limited range가 매우 흔하다.

### 6.4 YCbCr의 luma/chroma 범위 분리

영상 신호에서는 밝기 성분과 색차 성분을 분리해서 다루는 YCbCr이 널리 쓰인다. limited range는 luma와 chroma를 표준화된 범위 안에서 다루고, 동기/여유/필터링 문제를 피하기 쉽게 만들었다.

```text
Y'    = 16..235
Cb/Cr = 16..240
```

## 7. Range mismatch가 만드는 문제

Range mismatch는 소스의 range와 디코더, 플레이어, 편집툴, 인코더, 디스플레이 파이프라인의 range 해석이 서로 어긋나는 문제다.

| 데이터 | 잘못된 해석 | 결과 |
|---|---|---|
| Limited 데이터를 full로 해석 | `16`을 검정이 아니라 어두운 회색으로 봄 | 검정이 뜨고, 흰색이 덜 밝아지며, 대비가 낮아진다. |
| Full 데이터를 limited로 해석 | `0..15`, `236..255`를 범위 밖으로 압축/클리핑함 | 암부가 뭉개지고 하이라이트가 잘린다. |
| YCbCr/RGB 변환에서 range 불일치 | luma/chroma scaling이 잘못 적용됨 | 밝기, 색, 채도가 함께 틀어질 수 있다. |
| Range metadata 불일치 | 변환이 두 번 되거나 아예 적용되지 않음 | 전체 화면이 뿌옇거나 과도하게 대비가 강해질 수 있다. |

대표 증상은 다음과 같다.

```text
limited를 full로 잘못 읽음
-> black level이 뜸
-> white가 덜 밝음
-> 전체 대비가 낮음
-> 화면이 뿌옇거나 물 빠진 것처럼 보임
```

```text
full을 limited로 잘못 읽음
-> shadow clipping
-> highlight clipping
-> 검정이 너무 검고 흰색이 쉽게 날아감
-> 대비가 강해 보이지만 정보가 사라짐
```

## 8. Range는 transfer나 matrix가 아니다

Color range는 transfer function이나 matrix coefficients와 다르다.

| 개념 | 무엇을 정하는가 | 예 |
|---|---|---|
| Color range | 코드값 중 어느 범위를 유효 신호로 볼지 | full, limited, video/legal range |
| Transfer function | 코드값과 빛 사이의 곡선 관계 | sRGB, Rec.709, BT.1886, PQ, HLG |
| Matrix coefficients | RGB와 YCbCr 사이의 색차 변환 계수 | BT.601, BT.709, BT.2020 |
| Gamut | 표현 가능한 색의 영역 | sRGB, Display P3, Rec.2020 |

따라서 다음 오류들은 서로 다른 문제다.

```text
range가 틀렸다
= 코드값 스케일/오프셋 해석이 틀렸다

transfer가 틀렸다
= 밝기 곡선 해석이 틀렸다

matrix가 틀렸다
= RGB/YCbCr 색차 변환이 틀렸다

gamut이 틀렸다
= RGB primaries 또는 색역 해석이 틀렸다
```

## 9. ICC 프로파일과 color range의 관계

ICC 프로파일은 주로 색공간과 색 변환을 설명한다. 반면 color range는 픽셀 코드값을 ICC/CMM 변환에 넣기 전에 숫자의 의미를 정하는 단계에 가깝다.

일반적인 처리 순서는 다음처럼 볼 수 있다.

```text
pixel code value
-> color range에 따라 0..1 또는 유효 신호 범위로 정규화
-> transfer function/TRC 적용
-> RGB/YCbCr 변환
-> ICC profile 또는 CMM 변환
```

즉 color range 해석이 틀리면 ICC 프로파일이 맞아도 CMM에 들어가는 입력값 자체가 잘못된다.

예를 들어 limited RGB 값을 full range로 잘못 정규화하면 `16`이 검정이 아니라 약 `0.063`의 어두운 회색으로 들어간다.

```text
limited black 16을 full로 해석:
16 / 255 = 0.0627...
```

하지만 limited range로 올바르게 해석하면 `16`은 기준 검정이다.

```text
(16 - 16) / 219 = 0
```

따라서 color range는 ICC 프로파일 자체의 색 변환 모델이라기보다, 픽셀 숫자의 의미를 정하는 입력 해석 규칙이다. 이 단계가 맞아야 그 다음 ICC 변환도 올바르게 동작한다.

## 10. 실무 확인 방법

영상 도구에서는 range가 metadata로 표시될 수 있다. 예를 들어 `ffprobe`에서는 `color_range` 필드를 확인할 수 있다.

```text
pc 또는 jpeg = full range
tv 또는 mpeg = limited range
unknown      = 명시되지 않음
```

`unknown`이면 안전하게 추정하기보다 소스 맥락, 코덱, 컨테이너, 해상도, 제작 워크플로, 테스트 패턴을 함께 확인해야 한다.

실무 체크리스트는 다음과 같다.

- 입력 소스의 color range metadata를 확인한다.
- `unknown`이면 소스 맥락과 테스트 패턴으로 실제 range를 추정한다.
- 디코딩 시 limited가 RGB full로 확장되는지 확인한다.
- RGB로 처리할 때 normalized 값이 `0..1`인지, limited 범위를 유지하는지 확인한다.
- YCbCr로 다시 인코딩할 때 목적 포맷에 맞는 range를 명시한다.
- range, transfer, matrix, gamut을 서로 다른 항목으로 기록하고 검증한다.
- 최종 결과는 black/white level 테스트 패턴으로 확인한다.

## 핵심 요약

Color range는 색역이나 감마가 아니라, 디지털 코드값을 어떤 유효 신호 범위로 해석할지에 대한 약속이다.

```text
full range
= 0..255 전체를 black..white로 사용

limited range
= 16..235를 nominal black..nominal white로 사용
= 0..15와 236..255는 여유 구간으로 남김
```

Limited range는 실제 dynamic range가 더 좁다는 뜻이 아니다. 올바르게 해석하면 `16`은 검정이고 `235`는 흰색이다. 다만 코드값 양끝에 footroom과 headroom을 남기기 때문에, 같은 bit depth에서는 nominal black-white 사이의 단계 수가 full range보다 조금 줄어든다.

한 문장으로 줄이면 다음과 같다.

```text
color range는 픽셀 숫자를 색관리 입력값으로 넣기 전에
그 숫자의 검정/흰색 기준과 스케일을 정하는 규칙이다.
```
