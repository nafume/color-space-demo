# ICC Profile v2, v4, iccMAX 처리 방식 비교

## 문서 목적

이 문서는 ICC Profile을 실제 색관리 엔진(CMM, Color Management Module)이 처리한다고 가정하고, ICC v2, ICC v4, iccMAX가 어떤 점에서 같은 구조를 공유하고 어떤 점에서 다르게 해석되는지 정리한다.

핵심은 다음 세 가지다.

- v2와 v4는 모두 `ICC.1` 계열이며, 기본적으로 장치 색공간과 PCS(Profile Connection Space)를 연결한다.
- v4는 v2의 모호했던 부분을 줄이고, PCS와 렌더링 의도, 색순응, 태그 우선순위를 더 명확하게 만든 버전이다.
- iccMAX는 `ICC.2` 계열이며, v4를 대체하는 일반용 후속판이라기보다 spectral PCS, 임의 관찰자/광원, HDR 확장 범위, 복잡한 함수형 변환 같은 요구를 처리하기 위한 확장 아키텍처다.

## 용어 설명

- `CMM`(Color Management Module): ICC 프로파일을 읽고 소스 색공간에서 목적지 색공간으로 변환을 수행하는 색관리 엔진이다.
- `PCS`(Profile Connection Space): 서로 다른 장치 색공간을 연결하기 위한 중간 색공간이다. ICC v2/v4에서는 보통 D50 기반 `XYZ` 또는 `Lab`를 사용한다.
- `LUT`(Look-Up Table): 입력 색값을 미리 정의된 표를 통해 출력 색값으로 매핑하는 변환 방식이다.
- `TRC`(Tone Reproduction Curve): RGB나 Gray 채널의 톤 응답을 보정하거나 선형화하는 곡선이다.
- `A2B*`/`B2A*`: ICC 프로파일에서 장치 색공간과 PCS 사이의 변환 방향을 나타내는 태그 계열이다. `A2B*`는 보통 장치에서 PCS로, `B2A*`는 PCS에서 장치로 가는 변환이다.
- `D2B*`/`B2D*`: ICC v4에서 추가된 더 확장된 변환 태그 계열이며, MPE 기반 처리를 사용할 수 있다.
- `MPE`(Multi-Process Element): 여러 처리 요소를 순서대로 연결해 색 변환을 표현하는 구조다. iccMAX에서 특히 중요하다.
- `PCC`(Profile Connection Conditions): iccMAX에서 변환에 사용할 관찰자, 광원, 관찰 조건 등을 정하는 조건 묶음이다.
- `MCS`(Multiplex Connection Space): iccMAX에서 여러 채널 또는 연결 조건을 더 유연하게 다루기 위한 추가 연결 공간 개념이다.
- `MCC`(Multiplex Connection Conditions): MCS 기반 연결에서 여러 조건이나 채널 구성을 다루기 위한 iccMAX 쪽 조건 개념이다.
- `HDR`(High Dynamic Range): 일반 범위보다 더 넓은 밝기와 색 표현 범위를 다루는 워크플로우를 뜻한다.

## 화이트포인트와 PCS 처리

ICC 프로파일을 이해할 때 가장 헷갈리기 쉬운 부분은 `white point`, `chromatic adaptation`, `PCS`, `rendering intent`의 관계다. 특히 sRGB나 Display P3처럼 색공간 정의 자체는 D65 white point를 사용하지만, 일반 ICC v2/v4 프로파일의 연결 공간은 D50 PCS를 사용한다는 점을 분리해서 봐야 한다.

### ICC.1에서 PCS는 D50인가?

일반적인 ICC v2/v4 프로파일은 `ICC.1` 계열이다. 이 계열에서 PCS(Profile Connection Space)는 D50 기준의 CIE XYZ 또는 CIE Lab로 정의된다.

```text
ICC v2/v4, ICC.1
= PCS는 D50 기준 PCSXYZ 또는 PCSLAB

iccMAX, ICC.2
= colorimetric PCS 외에도 spectral PCS, 임의 illuminant/observer 조건 등을 다룰 수 있음
```

따라서 “ICC profile은 무조건 D50 PCS인가?”라는 질문에는 다음처럼 답하는 것이 안전하다.

- 일반적인 ICC v2/v4 프로파일 변환에서는 D50 PCS가 표준이다.
- 실제 CMM은 계산 최적화를 위해 중간 D50 값을 명시적으로 만들지 않고 source transform과 destination transform을 합성할 수 있다.
- DeviceLink profile은 특정 source device에서 destination device로 가는 직접 변환을 담을 수 있으므로, 일반적인 두 프로파일 연결 모델과 다르다.
- iccMAX/ICC.2는 더 유연하므로 모든 ICC 계열이 반드시 D50 PCS만 사용한다고 일반화하면 안 된다.

### Chromatic adaptation이 필요한 경우

화이트포인트가 다른 색공간으로 변환할 때는 크게 두 가지 의도를 구분해야 한다.

1. 측색값/색 자극을 보존하려는 의도

   원래 색의 물리적/측색적 의미를 최대한 유지하려는 접근이다. destination white에 맞춰 “흰색처럼 보이게” 강제로 옮기지 않는다. ICC에서는 `absolute colorimetric` intent가 이 의도에 가깝다.

   다만 `absolute colorimetric = chromatic adaptation을 전혀 하지 않음`이라고 말하면 부정확하다. ICC v2/v4 내부에서는 PCS가 D50이므로 프로파일 작성 또는 변환 과정에서 D50 기준 처리와 media white 조정이 들어갈 수 있다. 즉 rendering intent는 “white를 어떻게 매핑할 것인가”에 대한 정책에 더 가깝다.

2. 색 외관을 유지하려는 의도

   source white 아래에서 보이던 색이 destination white 아래에서도 비슷하게 보이도록 XYZ 값을 조정하는 접근이다. 이때 `chromatic adaptation`이 필요하다. 대표적인 방법으로 Bradford adaptation, CAT02, CAT16 같은 CAT(Chromatic Adaptation Transform)가 있다.

중요한 점은 `chromatic adaptation`이 `xy` 좌표를 고정하는 과정이 아니라는 것이다. 오히려 white point가 바뀌면 비슷한 외관을 유지하기 위해 XYZ와 xy 좌표가 바뀔 수 있다.

```text
xy 좌표 유지
= 물리적/측색적 색 자극을 보존하는 쪽에 가까움

색 외관 유지
= 새 white point 아래에서도 비슷하게 보이도록 XYZ/xy를 조정함
= chromatic adaptation의 목적
```

예를 들어 D65 기준의 중립 회색은 D65 white point의 xy에 놓인다.

```text
D65 neutral gray
xy ≈ (0.3127, 0.3290)
```

이 색을 D50 기준에서도 중립 회색처럼 보이게 옮기면 D50 white point의 xy 쪽으로 이동한다.

```text
D50 neutral gray
xy ≈ (0.3457, 0.3585)
```

즉 `xy` 좌표는 유지되지 않지만, 각각의 관찰 white point 아래에서 중립적인 회색/흰색 계열로 보이도록 조정된다.

### Bradford adaptation의 기본 아이디어

Bradford adaptation은 XYZ를 사람의 cone response에 가까운 LMS 공간으로 옮긴 뒤, source white와 destination white의 LMS 비율만큼 색을 스케일링하고 다시 XYZ로 되돌리는 방식이다.

```text
1. XYZ를 Bradford LMS 공간으로 변환
2. source white와 destination white의 LMS 값을 구함
3. L, M, S 채널별 white 비율로 색의 LMS 값을 스케일링
4. 다시 XYZ로 변환
```

수식 형태는 다음과 같이 볼 수 있다.

```text
LMS = M_bradford * XYZ

LMS_adapted =
  [Ld/Ls,   0,    0 ]   [L]
  [  0,   Md/Ms, 0 ] * [M]
  [  0,     0,  Sd/Ss]  [S]

XYZ_adapted = M_bradford^-1 * LMS_adapted
```

예를 들어 sRGB red는 D65 기준 XYZ에서 대략 다음 값이다.

```text
sRGB red, XYZ D65
≈ (0.4124, 0.2126, 0.0193)
xy ≈ (0.640, 0.330)
```

이 색을 Bradford adaptation으로 D50 기준 PCS 쪽에 맞추면 대략 다음처럼 변한다.

```text
sRGB red, XYZ D50 PCS
≈ (0.4361, 0.2225, 0.0139)
xy ≈ (0.649, 0.331)
```

같은 색 외관을 유지하려고 `XYZ`와 `xy`가 약간 바뀌는 것을 볼 수 있다.

### inverse TRC 직후의 값은 아직 PCS가 아니다

sRGB 이미지의 RGB code value에 inverse TRC를 적용하면 비선형 code value가 linear light RGB로 바뀐다.

```text
sRGB encoded RGB
-> inverse TRC
-> sRGB linear RGB
```

이 시점의 값은 아직 CIE XYZ도 아니고 PCS도 아니다. 더 정확히는 다음 상태다.

```text
D65 white point를 기준으로 정의된 sRGB primaries의 linear RGB
```

예를 들어 sRGB red는 다음처럼 선형화된다.

```text
sRGB encoded RGB = (255, 0, 0)
-> inverse TRC
-> sRGB linear RGB = (1.0, 0.0, 0.0)
```

여기까지는 여전히 sRGB primaries와 D65 white point에 묶인 RGB 값이다. ICC 프로파일의 matrix 또는 LUT를 적용해 PCS로 보낸 뒤에야 D50 기준 PCSXYZ 또는 PCSLAB 값이 된다.

```text
encoded RGB
-> inverse TRC
-> linear RGB, source primaries/source white 기준
-> ICC profile의 matrix 또는 A2B transform
-> PCSXYZ 또는 PCSLAB, ICC v2/v4에서는 D50 기준
```

### ICC matrix profile의 `rXYZ`, `gXYZ`, `bXYZ`

일반적인 RGB matrix/TRC ICC profile에서 `rXYZ`, `gXYZ`, `bXYZ` 태그는 단순히 “원래 색공간의 RGB를 원래 white point의 XYZ로 바꾸는 matrix”가 아니다. ICC v2/v4 관점에서는 RGB linear 값을 PCSXYZ로 보내기 위한 matrix다.

따라서 sRGB 같은 D65 기반 source profile의 `rXYZ`, `gXYZ`, `bXYZ`는 보통 다음 변환이 반영된 값으로 이해할 수 있다.

```text
sRGB linear RGB, D65 기준
-> chromatic adaptation
-> PCSXYZ, D50 기준
```

표준 색공간 정의에서 흔히 보는 sRGB to XYZ matrix는 D65 기준이다.

```text
sRGB linear RGB -> XYZ D65

[ 0.4124  0.3576  0.1805 ]
[ 0.2126  0.7152  0.0722 ]
[ 0.0193  0.1192  0.9505 ]
```

반면 ICC sRGB profile의 matrix/TRC 경로에서 사용하는 PCS matrix는 D50 기준으로 적응된 값이다.

```text
sRGB linear RGB -> PCSXYZ D50

[ 0.4361  0.3851  0.1431 ]
[ 0.2225  0.7169  0.0606 ]
[ 0.0139  0.0971  0.7141 ]
```

이 matrix의 첫 번째 column은 `rXYZ`, 두 번째 column은 `gXYZ`, 세 번째 column은 `bXYZ`에 해당한다고 볼 수 있다.

### sRGB 이미지를 Display P3 모니터에 표시할 때

sRGB 이미지가 Display P3 모니터에 표시될 때의 ICC 기반 개념 흐름은 다음과 같다.

```text
sRGB 이미지 RGB
-> sRGB inverse TRC
-> sRGB linear RGB, D65 기준
-> source profile transform
-> PCSXYZ 또는 PCSLAB, D50 기준
-> destination display profile inverse transform
-> display/native RGB
-> 디스플레이 출력
```

모니터 프로파일이 단순한 Display P3 표준 프로파일이라면 개념적으로 다음처럼 생각할 수 있다.

```text
sRGB D65
-> D50 PCS
-> Display P3 D65
```

하지만 실제 모니터 프로파일은 “표준 Display P3”가 아니라 그 모니터의 실제 primaries, white point, tone response, calibration 상태를 담을 수 있다. 따라서 최종 RGB는 엄밀히는 Display P3 표준 RGB가 아니라 해당 display device에 보낼 RGB 값이다.

또한 sRGB와 Display P3는 둘 다 nominal white point가 D65다. ICC 모델상으로는 D50 PCS를 사이에 두지만, CMM은 두 변환을 합성해서 중간 D50 값을 명시적으로 만들지 않을 수 있다.

```text
개념 모델:
sRGB D65 -> PCS D50 -> Display P3 D65

최적화된 계산:
sRGB linear RGB -> XYZ D65 -> Display P3 linear RGB
```

예를 들어 sRGB의 순수 빨강을 Display P3 RGB로 같은 외관에 가깝게 표현하면 대략 다음 값이 된다.

```text
sRGB encoded RGB = (255, 0, 0)
Display P3 encoded RGB ≈ (234, 51, 35)
```

즉 sRGB red를 P3 화면에서 제대로 표시하려면 P3 공간에 `(255, 0, 0)`을 그대로 보내는 것이 아니라, 더 넓은 P3 primaries 안에서 sRGB red와 같은 색에 해당하는 RGB 값으로 변환해야 한다.

### 세미나용 핵심 정리

화이트포인트와 ICC PCS는 다음 문장으로 요약할 수 있다.

```text
inverse TRC 적용 후
= source RGB primaries와 source white point에 묶인 linear RGB
= 아직 PCS 아님

ICC profile의 matrix/LUT 적용 후
= ICC v2/v4에서는 D50 기준 PCSXYZ 또는 PCSLAB

chromatic adaptation
= xy 좌표를 고정하는 과정이 아니라,
  source white 아래의 색 외관을 destination white 아래에서도 비슷하게 유지하도록
  XYZ 값을 조정하는 과정

ICC v2/v4 PCS
= D50 기반으로 고정

iccMAX
= D50 PCS로만 제한되지 않는 확장 구조
```

## 파일 구조

ICC.1 v2, ICC.1 v4, ICC.2/iccMAX 프로파일은 모두 큰 틀에서 128바이트 헤더, 태그 테이블, 태그 데이터 블록으로 구성된다. 모든 다중 바이트 값은 big-endian으로 저장되며, 태그 데이터는 4바이트 경계에 정렬된다.

```text
ICC profile binary layout

0x0000
┌──────────────────────────────────────────────┐
│ Profile header                               │ 128 bytes
├──────────────────────────────────────────────┤
│ Tag table                                    │ 4 + 12n bytes
│ - tag count                                  │ 4 bytes
│ - tag record[0]                              │ 12 bytes
│ - tag record[1]                              │ 12 bytes
│ - ...                                        │
├──────────────────────────────────────────────┤
│ Tagged element data                          │ variable
│ - each tag data starts on 4-byte boundary    │
│ - each tag data usually begins with:          │
│   type signature                             │ 4 bytes
│   reserved                                   │ 4 bytes
└──────────────────────────────────────────────┘
```

### ICC.1 v2 헤더

```text
ICC.1 v2 header, 128 bytes

byte offset   size   field
0..3          4      profile size
4..7          4      preferred CMM type
8..11         4      profile version, e.g. 02xx0000h
12..15        4      profile/device class
16..19        4      data color space
20..23        4      PCS, usually 'XYZ ' or 'Lab '
24..35        12     creation date/time
36..39        4      profile file signature, 'acsp'
40..43        4      primary platform
44..47        4      profile flags
48..51        4      device manufacturer
52..55        4      device model
56..63        8      device attributes
64..67        4      rendering intent
68..79        12     PCS illuminant, XYZNumber
80..83        4      profile creator
84..127       44     reserved, usually zero
```

v2에서는 84..127 바이트 영역이 통째로 예약 영역으로 취급된다. 따라서 v2 파서는 이 영역을 의미 있는 profile ID로 해석하지 않는 것이 일반적이다.

주요 필드의 의미는 다음과 같다.

| 필드 | 설명 | 가능한 값/예시 |
|---|---|---|
| `profile size` | 헤더, 태그 테이블, 태그 데이터, 패딩을 포함한 전체 프로파일 크기다. | 32-bit unsigned integer. 파일 전체 길이와 일치해야 한다. |
| `preferred CMM type` | 이 프로파일에 선호되는 CMM 식별자다. | ICC에 등록된 4바이트 CMM signature, 또는 미지정 시 `00000000h` |
| `profile version` | 프로파일이 따르는 ICC 규격 버전이다. | v2는 `02xx0000h` 계열. 예: `02000000h`, `02400000h` |
| `profile/device class` | 프로파일 종류를 나타낸다. | `scnr` input, `mntr` display, `prtr` output, `link` DeviceLink, `spac` ColorSpace, `abst` Abstract, `nmcl` NamedColor |
| `data color space` | 프로파일의 장치 쪽 또는 입력 쪽 색공간이다. | `RGB `, `CMYK`, `GRAY`, `Lab `, `XYZ `, `2CLR`..`FCLR` 등 |
| `PCS` | 프로파일이 연결되는 Profile Connection Space다. | v2/v4에서는 보통 `XYZ ` 또는 `Lab `. DeviceLink에서는 목적지 data color space가 들어갈 수 있다. |
| `creation date/time` | 프로파일 생성 시각이다. | `dateTimeNumber`: year, month, day, hour, minute, second가 각각 2바이트 |
| `profile file signature` | ICC 프로파일임을 나타내는 고정 signature다. | 항상 `acsp` |
| `primary platform` | 주로 어떤 플랫폼을 위해 만들어졌는지 나타낸다. | `APPL`, `MSFT`, `SGI `, `SUNW`, 또는 미지정 시 `00000000h` |
| `profile flags` | 임베디드 프로파일 여부, 독립 사용 가능 여부 같은 플래그를 담는다. | bit 0: embedded, bit 1: cannot be used independently. 나머지는 버전별 예약/확장 |
| `device manufacturer` | 장치 제조사 식별자다. | ICC에 등록된 4바이트 manufacturer signature, 또는 `00000000h` |
| `device model` | 장치 모델 식별자다. | 제조사별 4바이트 model signature, 또는 `00000000h` |
| `device attributes` | 장치 또는 매체 속성을 나타낸다. | reflective/transparency, glossy/matte, positive/negative, color/black-and-white 플래그 등 |
| `rendering intent` | 기본 렌더링 의도다. | `0` perceptual, `1` relative colorimetric, `2` saturation, `3` absolute colorimetric |
| `PCS illuminant` | PCS 기준 광원이다. | ICC.1에서는 보통 D50 기반 `XYZNumber` |
| `profile creator` | 프로파일 생성 소프트웨어나 기관의 signature다. | 4바이트 creator signature, 또는 `00000000h` |
| `reserved` | 향후 확장을 위한 예약 영역이다. | 일반적으로 모두 `00h` |

### ICC.1 v4 헤더

```text
ICC.1 v4 header, 128 bytes

byte offset   size   field
0..3          4      profile size
4..7          4      preferred CMM type
8..11         4      profile version, e.g. 04xx0000h
12..15        4      profile/device class
16..19        4      data color space
20..23        4      PCS, usually 'XYZ ' or 'Lab '
24..35        12     creation date/time
36..39        4      profile file signature, 'acsp'
40..43        4      primary platform
44..47        4      profile flags
48..51        4      device manufacturer
52..55        4      device model
56..63        8      device attributes
64..67        4      rendering intent
68..79        12     PCS illuminant, XYZNumber
80..83        4      profile creator
84..99        16     profile ID, MD5-based fingerprint
100..127      28     reserved, zero
```

v4는 v2와 같은 128바이트 헤더 형태를 유지하지만, 84..99 바이트의 profile ID 필드를 명확히 사용한다. PCS 자체도 여전히 `XYZ` 또는 `Lab` 중심이지만, D50 PCS와 media white, 색순응 관계의 해석이 더 엄격하다.

v4의 대부분 필드는 v2와 같은 의미를 가진다. 차이가 큰 필드는 다음과 같다.

| 필드 | 설명 | 가능한 값/예시 |
|---|---|---|
| `profile version` | v4의 더 엄격한 PCS, 렌더링 의도, 태그 우선순위 규칙을 적용해야 함을 나타낸다. | `04xx0000h` 계열. 예: `04300000h`, `04400000h` |
| `profile ID` | 프로파일 내용으로부터 계산한 MD5 기반 식별자다. 프로파일 동일성 확인, 캐싱, 참조에 사용할 수 있다. | 16바이트 MD5 fingerprint, 또는 미계산 시 16바이트 모두 `00h` |
| `reserved` | v4에서 남아 있는 예약 영역이다. | 100..127 바이트 모두 `00h` |

### ICC.2/iccMAX 헤더

```text
ICC.2 iccMAX header, 128 bytes

byte offset   size   field
0..3          4      profile size
4..7          4      preferred CMM type
8..11         4      profile version/sub-version, e.g. 05000000h
12..15        4      profile/device class
16..19        4      data color space
20..23        4      colorimetric PCS, or 0 if spectral-only
24..35        12     creation date/time
36..39        4      profile file signature, 'acsp'
40..43        4      primary platform
44..47        4      profile flags
48..51        4      device manufacturer
52..55        4      device model
56..63        8      device attributes
64..67        4      rendering intent
68..79        12     PCS illuminant, XYZNumber
80..83        4      profile creator
84..99        16     profile ID
100..103      4      spectral PCS signature
104..109      6      spectral PCS wavelength range
110..115      6      bi-spectral PCS wavelength range
116..119      4      MCS signature
120..123      4      profile/device sub-class
124..127      4      reserved, zero
```

iccMAX도 헤더 크기는 128바이트지만, v4에서 예약 영역이던 100..123 바이트를 spectral PCS, wavelength range, MCS, sub-class 정보로 확장한다. 그래서 iccMAX 파서는 단순히 `PCS = XYZ/Lab`인지 확인하는 것뿐 아니라 spectral PCS와 MCS 필드까지 함께 봐야 한다.

iccMAX의 0..99 바이트 필드는 대체로 v4와 같은 역할을 하지만, PCS와 class 해석이 더 넓다. 확장 필드의 의미는 다음과 같다.

| 필드 | 설명 | 가능한 값/예시 |
|---|---|---|
| `profile version/sub-version` | iccMAX 5.x 계열임을 나타낸다. 하위 2바이트는 profile sub-class 버전 표현에도 쓰일 수 있다. | 보통 `05000000h` 이상 |
| `profile/device class` | ICC.1의 기본 class 외에 iccMAX 확장 class를 포함할 수 있다. | `scnr`, `mntr`, `prtr`, `link`, `spac`, `abst`, `nmcl`, `cenc`, `mid `, `mlnk`, `mvis` 등 |
| `data color space` | 장치 색공간뿐 아니라 확장된 N-channel 또는 파생 색공간을 나타낼 수 있다. | `RGB `, `CMYK`, `GRAY`, `XYZ `, `Lab `, `nc0001`..`ncFFFF`, 또는 class에 따라 `00000000h` |
| `colorimetric PCS` | 색도 기반 PCS다. spectral-only 프로파일에서는 0으로 둘 수 있다. | `XYZ `, `Lab `, 또는 spectral-only일 때 `00000000h` |
| `spectral PCS signature` | 스펙트럴 PCS를 사용할 때 그 PCS의 채널 구성 또는 표현 방식을 나타낸다. | spectral PCS signature, 또는 미사용 시 `00000000h` |
| `spectral PCS wavelength range` | spectral PCS가 다루는 파장 범위와 샘플링 조건을 나타낸다. | 6바이트 `spectralRange`. 미사용 시 보통 0 |
| `bi-spectral PCS wavelength range` | BRDF, 형광, 양방향 스펙트럼처럼 두 축의 스펙트럴 관계가 필요한 경우의 파장 범위를 나타낸다. | 6바이트 `spectralRange`. 미사용 시 보통 0 |
| `MCS signature` | Material Connection Space를 사용할 때 재료 또는 물질 채널 구성을 나타낸다. | `mc0001`..`mcFFFF`, 또는 MCS 미사용 시 `00000000h` |
| `profile/device sub-class` | profile class를 더 세분화하는 iccMAX 확장 분류다. | 등록된 4바이트 sub-class signature, 또는 미사용 시 `00000000h` |
| `reserved` | iccMAX에서 남아 있는 예약 영역이다. | 124..127 바이트 모두 `00h` |

### 태그 테이블과 태그 데이터

태그 테이블은 헤더 바로 뒤, 즉 파일 시작 기준 128바이트 위치에서 시작한다. 태그 테이블 안의 offset은 태그 테이블 기준이 아니라 파일 또는 프로파일 데이터 스트림의 시작점을 기준으로 한다.

```text
Tag table, starts at byte 128

relative offset   size   field
0..3              4      tag count = n
4..15             12     tag record 0
16..27            12     tag record 1
...

Each tag record

relative offset   size   field
0..3              4      tag signature, e.g. 'A2B0', 'wtpt'
4..7              4      offset to tag data from start of profile
8..11             4      tag data size in bytes, excluding padding
```

태그 테이블 필드의 의미는 다음과 같다.

| 필드 | 설명 | 가능한 값/예시 |
|---|---|---|
| `tag count` | 프로파일 안에 들어 있는 태그 레코드 수다. | 32-bit unsigned integer `n` |
| `tag signature` | 태그의 종류를 나타내는 4바이트 signature다. | `desc`, `mluc`, `wtpt`, `chad`, `A2B0`, `B2A0`, `D2B0`, `B2D0`, private tag signature 등 |
| `offset to tag data` | 파일 시작점으로부터 해당 태그 데이터가 시작되는 위치다. 태그 테이블 시작점 기준이 아니다. | 4바이트 경계에 정렬된 32-bit unsigned integer |
| `tag data size` | 해당 태그 데이터의 실제 바이트 수다. 4바이트 정렬을 위해 뒤에 붙는 패딩 바이트는 이 크기에 포함하지 않는다. | 32-bit unsigned integer. tag payload 실제 길이 |

개별 태그 데이터는 태그 타입별로 구조가 다르지만, 보통 앞 8바이트가 타입 식별자와 예약 영역으로 시작한다.

```text
Tag data element

offset +0      4      tag type signature
offset +4      4      reserved, zero
offset +8      ...    type-specific payload
padding        0..3   zero bytes, for 4-byte alignment
```

태그 데이터 필드의 의미는 다음과 같다.

| 필드 | 설명 | 가능한 값/예시 |
|---|---|---|
| `tag type signature` | 태그 데이터의 내부 구조를 나타낸다. 태그 signature가 “무슨 정보인가”를 말한다면, type signature는 “그 정보가 어떤 바이너리 형식으로 저장되는가”를 말한다. | `XYZ `, `curv`, `para`, `mft1`, `mft2`, `mAB `, `mBA `, `mpet`, `mluc` 등 |
| `reserved` | 태그 타입 구조 안의 예약 영역이다. | 일반적으로 4바이트 모두 `00h` |
| `type-specific payload` | 실제 데이터 영역이다. 타입마다 구조가 다르다. | `XYZNumber`, curve samples, LUT grid/table, MPE element sequence 등 |
| `padding` | 다음 태그 데이터가 4바이트 경계에서 시작하도록 붙는 0바이트다. | 0..3 bytes, 모두 `00h` |

### Profile class

Profile class는 헤더의 `profile/device class` 필드에 들어가는 4바이트 signature로, 프로파일이 어떤 역할을 하는지 나타낸다. 이 값에 따라 필수 태그, 변환 방향, PCS 사용 방식, CMM의 연결 방식이 달라진다.

| Signature | Hex | Profile class | 의미 | 처리 관점 |
|---|---:|---|---|---|
| `scnr` | `73636E72` | Input profile | 스캐너, 카메라 같은 입력 장치 프로파일 | 보통 Device/Encoding -> PCS 변환을 위해 `A2B*` 또는 matrix/TRC 경로를 사용한다. |
| `mntr` | `6D6E7472` | Display profile | 모니터, RGB 디스플레이 프로파일 | RGB matrix/TRC가 흔하며, 표시/역변환 필요에 따라 Device <-> PCS 양방향 경로를 본다. |
| `prtr` | `70727472` | Output profile | 프린터, 인쇄 장치 프로파일 | CMYK 또는 N-channel LUT가 흔하며, rendering intent별 `A2B*`/`B2A*` 또는 `D2B*`/`B2D*` 선택이 중요하다. |
| `link` | `6C696E6B` | DeviceLink profile | 두 장치 색공간을 직접 연결하는 프로파일 | PCS를 중간에 다시 연결하지 않고, source device -> destination device 변환을 그대로 사용한다. |
| `spac` | `73706163` | ColorSpace profile | sRGB, Adobe RGB 같은 작업/표준 색공간 프로파일 | 장치보다는 색공간 정의에 가깝고, matrix/TRC 또는 LUT로 PCS와 연결된다. |
| `abst` | `61627374` | Abstract profile | PCS 위에서 색보정, 룩, 효과를 적용하는 프로파일 | Device가 아니라 PCS -> PCS 변환으로 처리한다. |
| `nmcl` | `6E6D636C` | NamedColor profile | 이름 있는 별색 또는 스폿 컬러 프로파일 | 일반 픽셀 LUT보다 named color table과 대체 PCS/장치 값을 해석하는 것이 중요하다. |
| `cenc` | `63656E63` | ColorEncodingSpace profile | iccMAX의 색 인코딩 공간 프로파일 | ICC.2에서 확장된 색 인코딩과 PCS/PCC 조건을 함께 본다. |
| `mid ` | `6D696420` | MaterialIdentification profile | iccMAX의 재료 식별 프로파일 | 색값보다 material channel 또는 MCS 해석이 중요하다. |
| `mlnk` | `6D6C6E6B` | MaterialLink profile | iccMAX의 재료 연결 프로파일 | material/MCS 기반 source -> destination 연결을 처리한다. |
| `mvis` | `6D766973` | MaterialVisualization profile | iccMAX의 재료 시각화 프로파일 | material 정보를 관찰 조건 아래에서 색 또는 시각 표현으로 변환한다. |

### 출력/디스플레이 프로파일이 담는 조건

ICC 프로파일은 단순히 `RGB` 또는 `CMYK`라는 색공간 이름만 담는 파일이 아니다. 특히 `prtr` output profile과 `mntr` display profile은 특정 장치 또는 조건에서 색값이 실제로 어떤 색으로 보이는지를 설명한다.

모니터 프로파일은 특정 디스플레이 상태에서 RGB 값이 어떤 실제 색으로 보이는지를 설명한다.

| 조건 | 관련 태그/개념 | 의미 |
|---|---|---|
| RGB primaries | `rXYZ`, `gXYZ`, `bXYZ` | R/G/B 원색이 PCSXYZ에서 어디에 위치하는지 나타낸다. |
| 화이트포인트 | `wtpt` | 모니터 흰색이 어떤 색인지 나타낸다. 예를 들어 D65 근처, D50 보정 상태 등이 될 수 있다. |
| 톤 응답/감마 | `rTRC`, `gTRC`, `bTRC` | 각 채널의 입력 코드값이 실제 밝기 또는 선형 RGB 값으로 어떻게 변하는지 나타낸다. |
| 색순응 | `chad` | 모니터 white와 ICC D50 PCS 사이의 chromatic adaptation 관계를 설명한다. |
| 블랙포인트 | `bkpt` | 모니터가 표현하는 검정 수준을 나타낼 수 있다. v2에서 더 자주 등장한다. |
| 색역 | primaries + TRC, 또는 LUT | 디스플레이가 표현 가능한 색 범위를 나타낸다. |
| 측정 조건 | `meas` | 측정에 사용한 광원, geometry, flare 같은 조건을 설명한다. |
| 관찰 조건 | `view` | 주변광, viewing illuminant, surround 같은 관찰 환경을 설명한다. |
| 프로파일 설명 | `desc`, `mluc` | 예: `sRGB`, `Display P3`, 캘리브레이션된 모니터 이름 |
| 제조사/모델 | header manufacturer/model | 장치 식별자다. 항상 의미 있게 채워지는 것은 아니다. |

일반적인 모니터 프로파일은 matrix/TRC 기반이다.

```text
RGB code value
-> rTRC/gTRC/bTRC로 linear RGB
-> rXYZ/gXYZ/bXYZ matrix로 PCSXYZ
```

고급 모니터나 실제 측정 기반 프로파일은 LUT 기반일 수도 있다. 이 경우 채널 간 상호작용, 비선형 색상 오차, 넓은 색역 디스플레이의 보정 결과, 특정 밝기/화이트포인트 설정에서의 출력 특성을 더 자세히 표현할 수 있다.

```text
밝기 설정
+ 화이트포인트 설정
+ 감마/EOTF 설정
+ 색역 모드
+ 캘리브레이션 LUT 상태
+ 측정 당시 주변 조건
= 하나의 display ICC profile
```

즉 모니터 ICC 프로파일은 “RGB 값이 이 특정 디스플레이 상태에서 어떤 PCS 색으로 보이는가”를 정의한다. 같은 모니터라도 밝기, 화이트포인트, 감마, 색역 모드, HDR/SDR 모드, 하드웨어 캘리브레이션 상태가 바뀌면 별도의 프로파일이 필요할 수 있다.

OS에 모니터 프로파일을 설치하면, 색관리 시스템은 그 프로파일을 목적지 프로파일로 사용해 이미지, 문서, 앱 색을 모니터 RGB 값으로 변환할 수 있다. 큰 흐름은 다음과 같다.

```text
이미지 픽셀값
+ 이미지 ICC profile
-> 소스 RGB/CMYK를 PCS로 변환
-> 모니터 ICC profile을 사용해 PCS를 모니터 RGB로 변환
-> GPU framebuffer / compositor
-> GPU 출력 인코딩
-> HDMI/DisplayPort 디지털 신호
-> 모니터
```

예를 들어 sRGB 이미지가 넓은 색역 모니터에 표시될 때는 다음과 같은 연결이 일어난다.

```text
sRGB RGB
-> sRGB profile로 PCSXYZ 또는 PCSLab
-> monitor profile로 monitor RGB
-> HDMI/DisplayPort로 RGB 또는 YCbCr 디지털 신호 전송
```

matrix/TRC 기반 모니터 프로파일이라면 CMM은 대략 다음 역방향 변환을 계산한다.

```text
PCSXYZ
-> inverse 3x3 matrix
-> linear monitor RGB
-> inverse TRC 또는 encoding TRC
-> monitor RGB code value
```

단, 이것은 “OS가 항상 모든 화면 픽셀을 PCS로 바꾼 뒤 HDMI 신호로 내보낸다”는 뜻은 아니다. 색관리되는 앱이나 OS compositor가 필요할 때 소스 색공간 -> PCS -> 모니터 RGB 변환을 수행하고, 그 결과 RGB 값이 그래픽 파이프라인으로 들어간다고 보는 것이 정확하다.

주의할 점은 다음과 같다.

| 항목 | 설명 |
|---|---|
| 색관리되지 않는 앱 | 앱이 단순히 sRGB 값을 framebuffer에 쓰고, OS가 자동 보정을 하지 않는 환경도 있다. |
| OS와 API 차이 | macOS는 시스템 색관리가 강한 편이고, Windows/Linux는 앱, API, compositor, HDR/SDR 모드에 따라 차이가 크다. |
| HDMI/DP 신호 | ICC 프로파일이 HDMI 신호 포맷 자체를 바꾸는 것은 아니다. 최종적으로는 RGB 또는 YCbCr 디지털 샘플이 전송된다. |
| calibration LUT | OS가 GPU gamma table/video LUT에 캘리브레이션 곡선을 로드할 수 있다. 이는 ICC 기반 색역 변환과 관련은 있지만 같은 개념은 아니다. |

CMYK 출력 프로파일은 잉크와 종이를 분리해서 추상적으로 설명하기보다, 특정 인쇄 조건 전체를 하나의 색 재현 모델로 표현한다.

| 조건 | 관련 태그/개념 | 의미 |
|---|---|---|
| 종이 백색점 | `wtpt`, media white point | `C=0 M=0 Y=0 K=0`이 이상적인 흰색이 아니라 해당 종이의 흰색임을 나타낸다. |
| 매체 블랙 포인트 | `bkpt`, black point | 종이와 잉크 조건에서 가장 어두운 검정 특성을 나타낸다. v2 프로파일에서 더 자주 등장한다. |
| CMYK -> PCS 변환 | `A2B*`, `D2B*` | 특정 종이, 잉크, 프린터, 인쇄 조건에서 CMYK 값이 어떤 PCS 색으로 보이는지 설명한다. |
| PCS -> CMYK 변환 | `B2A*`, `B2D*` | 원하는 PCS 색을 해당 인쇄 조건에서 어떤 CMYK 조합으로 만들지 설명한다. |
| 색역 | `gamt` | 해당 인쇄 조건에서 표현 가능한 색 범위를 나타낸다. |
| 잉크/색재 정보 | `clrt`, colorant table | 잉크 또는 색재 이름과 대략적인 PCS 값을 담을 수 있다. |
| 측정 조건 | `meas` | 측정 방식, 광원, geometry, backing 같은 조건을 설명한다. |
| 관찰 조건 | `view` | 주변광, viewing illuminant, surround 같은 관찰 환경을 설명한다. |
| UCR/BG | `bfd `, UCR/BG | Under Color Removal, Black Generation 같은 인쇄 분판 관련 정보를 담을 수 있다. |

따라서 CMYK 프로파일은 보통 다음 조건의 묶음으로 이해하는 것이 좋다.

```text
프린터/RIP
+ 잉크 세트
+ 종이/매체
+ 스크리닝/하프톤
+ 총잉크량 제한
+ 측정 조건
+ 관찰 조건
= 하나의 CMYK output ICC profile
```

종이 이름이 항상 명시적으로 들어가는 것은 아니지만, 종이의 흰색, 잉크 흡수, dot gain, 최대 농도, 색역 제한은 `wtpt`, `A2B*`/`B2A*`, `gamt`, 측정/관찰 조건에 강하게 반영된다. 그래서 같은 CMYK 값이라도 프로파일이 다르면 PCS로 변환한 색이 달라질 수 있다.

### 이미지에 포함된 프로파일이 담는 정보

이미지에 포함된 ICC 프로파일은 “이 이미지의 숫자 픽셀값을 어떤 실제 색으로 해석해야 하는가”를 설명한다. 픽셀 데이터를 직접 바꾸는 데이터라기보다, 픽셀값을 올바른 색으로 해석하고 다른 장치로 변환하기 위한 색 해석 설명서에 가깝다.

| 정보 | 관련 태그/개념 | 의미 |
|---|---|---|
| 프로파일 종류 | header `profile/device class` | 이 프로파일이 display, input, output, color space 중 무엇인지 나타낸다. |
| 색공간 | header `data color space` | 이미지 픽셀이 `RGB`, `CMYK`, `Gray`, `Lab` 중 무엇인지 나타낸다. |
| PCS | header `PCS`, `A2B*`, `B2A*` | 변환 중간 공간이다. 보통 D50 기준 `XYZ` 또는 `Lab`이다. |
| 화이트포인트 | `wtpt`, media white point | 흰색이 어떤 색으로 정의되는지 나타낸다. |
| 톤 커브/TRC | `rTRC`, `gTRC`, `bTRC`, `kTRC` | RGB 또는 Gray 값이 밝기로 어떻게 변하는지 나타낸다. 감마나 sRGB curve 같은 정보다. |
| RGB primaries | `rXYZ`, `gXYZ`, `bXYZ`, `chrm` | RGB 이미지라면 R/G/B 원색의 색도 또는 PCS 좌표를 나타낸다. |
| LUT 변환 | `A2B*`, `B2A*`, `D2B*`, `B2D*`, `mft1`, `mft2`, `mAB `, `mBA ` | CMYK나 복잡한 RGB 프로파일에서 픽셀값을 PCS로 바꾸는 테이블이다. |
| 렌더링 의도 | header `rendering intent`, `A2B0/1/2`, `B2A0/1/2` | 색역을 넘는 색을 어떻게 처리할지에 대한 기본 의도다. |
| 측정/관찰 조건 | `meas`, `view`, `chad` | 프로파일을 만들 때 사용한 광원, 관찰 환경, 측정 조건 등을 나타낸다. |
| 설명 문자열 | `desc`, `mluc` | `sRGB IEC61966-2.1`, `Display P3`, 특정 프린터/종이 프로파일 이름 같은 설명이다. |
| 제조사/생성자 정보 | header `device manufacturer`, `device model`, `profile creator` | 프로파일 생성 소프트웨어, 장치 제조사/모델 등을 나타낸다. |

RGB 이미지에서는 보통 다음 정보가 핵심이다.

```text
RGB pixel value
+ rTRC/gTRC/bTRC
+ rXYZ/gXYZ/bXYZ
+ white point
= 이 RGB 값이 실제로 어떤 PCS 색인지
```

CMYK 이미지에서는 보통 다음 정보가 핵심이다.

```text
CMYK pixel value
+ output profile LUT
+ paper white
+ ink/printing condition behavior
= 이 CMYK 값이 특정 인쇄 조건에서 어떤 PCS 색인지
```

CMYK 이미지에 포함된 ICC 프로파일은 “이 이미지는 CMYK다”라는 채널 이름만 알려주는 것이 아니라, 그 CMYK 값이 특정 인쇄 조건에서 실제로 어떤 색으로 보이는지를 설명한다.

| 정보 | 관련 태그/개념 | 의미 |
|---|---|---|
| 프로파일 종류 | header `profile/device class` | 보통 `prtr` output profile이다. 이미지의 CMYK 값을 특정 출력 조건의 색으로 해석한다. |
| 색공간 | header `data color space` | 보통 `CMYK`다. C, M, Y, K 네 채널의 device value를 뜻한다. |
| PCS | header `PCS`, `A2B*`, `B2A*` | CMYK 값을 연결할 기준 색공간이다. 보통 D50 기준 `Lab ` 또는 `XYZ `다. |
| 종이 백색점 | `wtpt`, media white point | `C=0 M=0 Y=0 K=0`이 어떤 종이 흰색인지 나타낸다. |
| CMYK -> PCS 변환 | `A2B0`, `A2B1`, `A2B2`, `D2B*` | 특정 C/M/Y/K 값이 실제 측정 색상으로 어떻게 보이는지 나타낸다. |
| PCS -> CMYK 변환 | `B2A0`, `B2A1`, `B2A2`, `B2D*` | 원하는 PCS 색을 해당 인쇄 조건에서 만들기 위한 CMYK 조합을 나타낸다. |
| 렌더링 의도별 변환 | `A2B0/1/2`, `B2A0/1/2`, header `rendering intent` | perceptual, relative colorimetric, saturation 같은 의도별 변환 경로를 제공한다. |
| 색역 | `gamt` | 해당 인쇄 조건에서 표현 가능한 색 범위를 나타낸다. |
| 잉크/색재 정보 | `clrt`, colorant table | C, M, Y, K 잉크나 추가 색재의 이름과 대략적인 PCS 값을 담을 수 있다. |
| 측정 조건 | `meas` | 측정 광원, 측정 geometry, backing 같은 조건을 설명한다. |
| 관찰 조건 | `view` | 주변광, viewing illuminant, surround 같은 관찰 환경을 설명한다. |
| 프로파일 설명 | `desc`, `mluc` | 인쇄 조건, 종이, 프레스, 표준 프로파일 이름 같은 설명이다. |

예를 들어 `C=0 M=0 Y=0 K=0`은 이상적인 빛의 흰색이 아니라 그 종이의 흰색이고, `C=100 M=0 Y=0 K=0`도 이론적인 cyan이 아니라 해당 잉크가 해당 종이에 찍혔을 때 측정되는 cyan 색이다. 그래서 같은 CMYK 값이라도 `Japan Color Coated`, `FOGRA`, `US Web Coated SWOP`, uncoated, newsprint 같은 프로파일에 따라 PCS 색이 달라질 수 있다.

### Tag type signature

`tag signature`는 `A2B0`, `wtpt`, `desc`처럼 “이 태그가 어떤 의미의 데이터인가”를 나타내고, `tag type signature`는 `mft2`, `XYZ `, `curv`, `mluc`처럼 “그 태그 데이터가 어떤 바이너리 구조인가”를 나타낸다.

tag type 자체가 profile class에 직접 고정되는 것은 아니다. 실제 허용 여부는 “어떤 tag signature가 어떤 profile class에서 필수/선택 태그인가”와 “그 tag signature에 허용되는 tag type이 무엇인가”의 조합으로 판단한다. 아래의 `관련 profile class`는 실무에서 주로 만나는 대표적 연결 관계다.

| Signature | Hex | Type 이름 | 용도 | 관련 profile class |
|---|---:|---|---|---|
| `XYZ ` | `58595A20` | `XYZType` | 하나 이상의 `XYZNumber` 저장 | 공통. 특히 `mntr`, `scnr`, `prtr`, `spac`의 white point, colorant 태그 |
| `chrm` | `6368726D` | `chromaticityType` | 색도 좌표, 색재/형광체 정보 | 주로 `mntr`, `spac` |
| `curv` | `63757276` | `curveType` | 1D tone curve | 주로 `mntr`, `scnr`, `spac`, 일부 `prtr` |
| `data` | `64617461` | `dataType` | 임의 binary/text 데이터 | 공통. metadata 또는 private tag |
| `desc` | `64657363` | `textDescriptionType` | v2식 프로파일 설명 문자열 | 공통 |
| `dtim` | `6474696D` | `dateTimeType` | 날짜/시간 | 공통 |
| `mAB ` | `6D414220` | `lutAToBType` | Device/Encoding에서 PCS로 가는 LUT 구조 | 주로 `scnr`, `mntr`, `prtr`, `spac` |
| `mBA ` | `6D424120` | `lutBToAType` | PCS에서 Device/Encoding으로 가는 LUT 구조 | 주로 `mntr`, `prtr`, `spac` |
| `meas` | `6D656173` | `measurementType` | 측정 조건 정보 | 공통. 특히 측정 기반 `mntr`, `scnr`, `prtr` |
| `mft1` | `6D667431` | `lut8Type` | 8-bit LUT 구조 | v2 중심. 주로 `scnr`, `mntr`, `prtr`, `spac`, `link`, `abst` |
| `mft2` | `6D667432` | `lut16Type` | 16-bit LUT 구조 | v2 중심. 주로 `scnr`, `mntr`, `prtr`, `spac`, `link`, `abst` |
| `mluc` | `6D6C7563` | `multiLocalizedUnicodeType` | v4식 다국어 Unicode 문자열 | 공통 |
| `ncol` | `6E636F6C` | `namedColorType` | v2 구형 named color 구조 | `nmcl` |
| `ncl2` | `6E636C32` | `namedColor2Type` | named color v2 구조 | `nmcl` |
| `para` | `70617261` | `parametricCurveType` | 수식 기반 parametric curve | 주로 `mntr`, `scnr`, `spac`, 일부 `prtr` |
| `pseq` | `70736571` | `profileSequenceDescType` | 프로파일 시퀀스 설명 | 주로 `link`, 또는 profile sequence metadata |
| `rcs2` | `72637332` | `responseCurveSet16Type` | 장치 응답 곡선 세트 | 주로 `prtr`, 측정 기반 output profile |
| `scrn` | `7363726E` | `screeningType` | 인쇄 screening 정보 | 주로 `prtr` |
| `sf32` | `73663332` | `s15Fixed16ArrayType` | signed fixed-point 배열 | 공통. matrix, adaptation, numeric array 태그 |
| `sig ` | `73696720` | `signatureType` | 4바이트 signature 값 | 공통 |
| `text` | `74657874` | `textType` | ASCII 텍스트 | 공통. v2 metadata/private tag에서 자주 등장 |
| `uf32` | `75663332` | `u16Fixed16ArrayType` | unsigned fixed-point 배열 | 공통 |
| `ui08` | `75693038` | `uInt8ArrayType` | 8-bit unsigned integer 배열 | 공통 |
| `ui16` | `75693136` | `uInt16ArrayType` | 16-bit unsigned integer 배열 | 공통 |
| `ui32` | `75693332` | `uInt32ArrayType` | 32-bit unsigned integer 배열 | 공통 |
| `ui64` | `75693634` | `uInt64ArrayType` | 64-bit unsigned integer 배열 | 공통 |
| `view` | `76696577` | `viewingConditionsType` | 관찰 조건 정보 | 공통. 특히 `mntr`, `prtr`, `spac` |
| `bfd ` | `62666420` | UCR/BG type | Under Color Removal / Black Generation 정보 | 주로 v2 `prtr` |
| `crdi` | `63726469` | `crdInfoType` | PostScript CRD 관련 정보 | 주로 v2 `prtr` |

등록되어 있지만 vendor/특수 목적 성격이 강한 type signature도 있다.

| Signature | Hex | 소유자/계열 | 용도 | 관련 profile class |
|---|---:|---|---|---|
| `FF  ` | `46462020` | Fujifilm | vendor type | private/vendor tag. class 의존적 |
| `ICCp` | `49434370` | ICC | ICC profile 관련 type | 공통 또는 embedded profile 관련 private/metadata tag |
| `POLa` | `504F4C61` | Polaroid | vendor type | private/vendor tag. class 의존적 |
| `POLz` | `504F4C7A` | Polaroid | vendor type | private/vendor tag. class 의존적 |
| `XML ` | `584D4C20` | X-Rite | XML 데이터 | 공통. 측정/metadata tag |
| `ZXML` | `5A584D4C` | X-Rite | 압축 XML 데이터 | 공통. 측정/metadata tag |
| `efi0`..`efi9` | `65666930`..`65666939` | EFI | vendor type range | 주로 `prtr` 또는 vendor output workflow |
| `fx00`..`fx99` | `66783030`..`66783939` | Fujifilm BI | vendor type range | private/vendor tag. class 의존적 |
| `hctl` | `6863746C` | Kothari | vendor type | private/vendor tag. class 의존적 |
| `gbd ` | `67626420` | X-Rite | vendor type | 공통. 측정/metadata tag |
| `ncpi` | `6E637069` | Apple | vendor type | 주로 Apple ColorSync metadata/private tag |
| `ndin` | `6E64696E` | Apple | vendor type | 주로 Apple ColorSync metadata/private tag |
| `mmod` | `6D6D6F64` | Apple | vendor type | 주로 Apple ColorSync metadata/private tag |

iccMAX에서는 MPE, spectral, observer, material, 구조화 데이터 표현을 위해 더 많은 type signature가 추가된다.

| Signature | Hex | Type/용도 | 관련 profile class |
|---|---:|---|---|
| `JtoX` | `4A746F58` | Jab/Jz 계열 등에서 `XYZ` 쪽 변환 관련 | iccMAX colorimetric/spectral workflow. 주로 `scnr`, `mntr`, `prtr`, `spac`, `link` |
| `XtoJ` | `58746F4A` | `XYZ`에서 Jab/Jz 계열 변환 관련 | iccMAX colorimetric/spectral workflow. 주로 `scnr`, `mntr`, `prtr`, `spac`, `link` |
| `calc` | `63616C63` | 계산식/계산 구조 | iccMAX 공통. MPE/function 기반 transform |
| `clro` | `636C726F` | colorant order type | 주로 `prtr`, N-channel profile |
| `clut` | `636C7574` | CLUT 구조 | 주로 `scnr`, `mntr`, `prtr`, `spac`, `link`, `abst` |
| `curf` | `63757266` | curve set/function 계열 | iccMAX 공통 transform |
| `cvst` | `63767374` | curve set 구조 | iccMAX 공통 transform |
| `eclt` | `65636C74` | extended colorant table 계열 | 주로 `prtr`, `nmcl`, material/profile extension |
| `ehim` | `6568696D` | 확장 illuminant/measurement 계열 | spectral workflow. 주로 `scnr`, `mntr`, `prtr`, `spac` |
| `emtx` | `656D7478` | 확장 matrix 구조 | iccMAX 공통 transform |
| `enim` | `656E696D` | enum 구조 | iccMAX 공통 structure/tag |
| `eobs` | `656F6273` | observer 관련 구조 | spectral/observer workflow |
| `fl16` | `666C3136` | 16-bit float 배열 | iccMAX 공통 numeric data |
| `fl32` | `666C3332` | 32-bit float 배열 | iccMAX 공통 numeric data |
| `fl64` | `666C3634` | 64-bit float 배열 | iccMAX 공통 numeric data |
| `func` | `66756E63` | function 구조 | iccMAX function/MPE transform |
| `matf` | `6D617466` | matrix function 구조 | iccMAX function/MPE transform |
| `parf` | `70617266` | parametric function 구조 | iccMAX function/MPE transform |
| `rclt` | `72636C74` | reflectance colorant table 계열 | spectral/material workflow. 주로 `prtr`, `nmcl`, `mid ` |
| `robs` | `726F6273` | observer 관련 구조 | spectral/observer workflow |
| `samf` | `73616D66` | sampled function 구조 | iccMAX function/MPE transform |
| `smat` | `736D6174` | sparse matrix 계열 | iccMAX transform |
| `smet` | `736D6574` | spectral measurement 계열 | spectral workflow. 주로 `scnr`, `mntr`, `prtr` |
| `sngf` | `736E6766` | single function 계열 | iccMAX function/MPE transform |
| `svcn` | `7376636E` | spectral viewing conditions 계열 | spectral/observer workflow |
| `tary` | `74617279` | tag array type | iccMAX 공통 structured data |
| `tint` | `74696E74` | tint 구조 | 주로 `prtr`, `nmcl`, material workflow |
| `tstr` | `74737472` | tag structure type | iccMAX 공통 structured data |
| `utf8` | `75746638` | UTF-8 string | iccMAX 공통 metadata |
| `ut16` | `75743136` | UTF-16 string | iccMAX 공통 metadata |
| `xclt` | `78636C74` | expanded colorant table 계열 | 주로 `prtr`, `nmcl`, material/profile extension |
| `zut8` | `7A757438` | compressed UTF-8 계열 | iccMAX 공통 metadata |
| `zxml` | `7A786D6C` | compressed XML 계열 | iccMAX 공통 metadata |

파서 관점에서는 모르는 tag type이 나온다고 파일 전체를 실패 처리하지 말고, 해당 태그가 필수 변환 태그인지 여부를 먼저 봐야 한다. 설명/메타데이터 태그의 unknown type은 건너뛸 수 있지만, 색 변환에 필요한 `A2B0` 같은 태그가 모르는 type이면 그 변환 경로는 사용할 수 없다.

예를 들어 `XYZType` 태그는 다음처럼 하나 이상의 `XYZNumber`를 담는다.

```text
XYZType

0..3      4      type signature = 'XYZ '
4..7      4      reserved
8..19     12     XYZNumber #0
20..31    12     XYZNumber #1, optional
...
```

정리하면 v2는 오래된 matrix/TRC 또는 `mft1`/`mft2` LUT 태그가 중심이고, v4는 profile ID와 더 명확한 PCS 해석 위에 `lutAtoBType`, `lutBtoAType`, MPE 가능 태그를 얹는다. iccMAX는 같은 외형을 유지하면서 헤더의 확장 필드와 MPE, PCC, spectral, MCS 관련 태그 데이터로 표현 범위를 크게 넓힌다.

## 빠른 비교

| 구분 | ICC v2 | ICC v4 | iccMAX |
|---|---|---|---|
| 규격 계열 | ICC.1 v2 | ICC.1 v4 | ICC.2, profile version 5 |
| 대표 용도 | 레거시 호환, 오래된 이미지/인쇄 워크플로 | 현재 일반 색관리의 기본 선택지 | v4로 부족한 전문/산업/연구 워크플로 |
| 기본 파일 구조 | 헤더 + 태그 테이블 + 태그 데이터 | 헤더 + 태그 테이블 + 태그 데이터 | v2/v4와 비슷한 큰 구조, 단 헤더/클래스/태그 확장 |
| PCS | `XYZ` 또는 `Lab`, D50 기반 | `XYZ` 또는 `Lab`, D50 기반을 더 명확히 정의 | colorimetric PCS 외 spectral PCS, 임의 illuminant/observer 가능 |
| 변환 태그 | matrix/TRC, `A2B*`, `B2A*`, `mft1`, `mft2` LUT 중심 | matrix/TRC, `A2B*`, `B2A*`, `lutAtoBType`, `lutBtoAType`, `D2B*`, `B2D*`, MPE 가능 | 확장된 MPE 중심, spectral/colorimetric transform, PCC, MCS 등 |
| 렌더링 의도 | 네 의도가 있으나 일부 해석이 구현/프로파일 제작자에 더 의존 | relative/absolute/perceptual/saturation 정의와 PCS 조건이 더 명확 | spectral 조건까지 고려해 media-relative, ICC-absolute 개념 확장 |
| CMM 부담 | 레거시 예외와 모호성 대응 필요 | 태그 우선순위와 PCS 처리가 더 예측 가능 | transform type, PCS configuration, PCC, ICS 지원 여부 판단 필요 |
| 호환성 | v4/iccMAX CMM에서 대체로 읽어야 하는 레거시 | 가장 넓은 일반 지원 | iccMAX CMM은 v2/v4를 읽을 수 있지만, v4 CMM은 iccMAX를 기대하면 안 됨 |

여기서 `ICC.1` 계열은 기존 ICC 프로파일 규격인 v2와 v4를 뜻하고, `ICC.2` 계열은 확장 규격인 iccMAX를 뜻한다. 즉 일반적인 색관리 워크플로우는 주로 ICC.1 기반이고, ICC.2/iccMAX는 스펙트럴 데이터, 임의 관찰자/광원, 더 복잡한 변환이 필요한 전문 워크플로우를 위한 계열이다.

## 공통 처리 흐름

v2, v4, iccMAX 모두 색관리의 큰 틀은 비슷하다. 하나의 소스 프로파일과 하나의 목적지 프로파일을 연결할 때 CMM은 보통 다음 순서로 움직인다.

```text
입력 색값
-> 소스 프로파일의 Device/Encoding -> PCS 변환
-> PCS 조정 또는 PCS 간 변환
-> 목적지 프로파일의 PCS -> Device/Encoding 변환
-> 출력 색값
```

프로파일 파일을 읽는 낮은 수준의 순서도 대체로 비슷하다.

```text
1. 파일 헤더를 읽는다.
2. profile version, profile class, data color space, PCS signature를 확인한다.
3. 태그 테이블을 읽는다.
4. 렌더링 의도와 변환 방향에 맞는 태그를 고른다.
5. 태그 타입에 맞게 matrix/TRC, LUT, MPE 등을 해석한다.
6. 필요한 경우 PCS white, media white, chromatic adaptation, absolute/relative 조정을 수행한다.
7. 소스 transform과 목적지 transform을 연결해 최종 변환을 만든다.
```

여기까지는 셋이 같은 큰 그림을 가진다. 차이는 4~6단계에서 커진다. 즉 “어떤 태그를 우선 선택할 것인가”, “PCS가 무엇이라고 가정되는가”, “PCS 사이의 조정을 CMM이 어디까지 해야 하는가”, “프로파일 안의 transform이 단순 LUT인가, float 기반 MPE인가, spectral transform인가”가 버전별로 달라진다.

## 1. ICC v2 처리 방식

### 1.1 v2의 위치

ICC v2는 v4 이전의 ICC.1 계열이다. ICC는 v2가 v4로 대체되었지만 여전히 v2 프로파일의 유효성을 인정한다. 실무적으로도 오래된 이미지 파일, OS 프로파일, 프린터 프로파일, PDF/인쇄 워크플로에서 v2가 계속 등장한다.

따라서 CMM 입장에서 v2 지원은 “구식이라 무시해도 되는 기능”이 아니라, 레거시 색관리 호환성의 필수 부분에 가깝다.

### 1.2 v2 파일을 읽는 기본 절차

v2 프로파일도 헤더와 태그 테이블을 먼저 읽는다.

```text
v2 ICC profile
-> header
   -> version = 2.x
   -> profile/device class
   -> data color space
   -> PCS signature: XYZ 또는 Lab
   -> rendering intent
   -> PCS illuminant
-> tag table
-> tag data
```

v2에서 흔히 만나는 실제 변환 표현은 두 부류다.

- matrix/TRC 기반 RGB/Gray 프로파일
- `A2B0`, `A2B1`, `A2B2`, `B2A0`, `B2A1`, `B2A2` 같은 LUT 기반 프로파일

matrix/TRC 프로파일은 `rXYZ`, `gXYZ`, `bXYZ`, `rTRC`, `gTRC`, `bTRC` 같은 태그를 사용한다. RGB 값을 TRC로 선형화한 뒤 3x3 행렬로 PCSXYZ에 연결한다.

```text
RGB code values
-> TRC inverse / linearization
-> 3x3 matrix
-> PCSXYZ
```

LUT 기반 프로파일은 `lut8Type` 또는 `lut16Type`이 흔하다. 이들은 각각 `mft1`, `mft2` 타입으로 보이며, 보통 다음과 같은 순서를 가진다.

```text
입력 테이블
-> 3x3 matrix, 해당 타입에서 쓰이는 경우
-> CLUT
-> 출력 테이블
```

프린터/CMYK 프로파일은 단순 행렬로 표현하기 어렵기 때문에 LUT 기반인 경우가 많다.

### 1.3 v2에서 transform 선택하기

v2 CMM은 profile class와 변환 방향, rendering intent를 보고 태그를 고른다.

대표적으로 출력 프로파일을 목적지로 사용할 때는 PCS에서 장치 색공간으로 가야 하므로 `B2A*` 태그를 본다. 입력/디스플레이/색공간 프로파일을 소스로 사용할 때는 장치 색공간에서 PCS로 가야 하므로 `A2B*` 또는 matrix/TRC 구조를 본다.

숫자 suffix는 일반적으로 다음 렌더링 의도와 대응한다.

| 태그 suffix | 일반적 의미 |
|---|---|
| `0` | perceptual |
| `1` | media-relative colorimetric |
| `2` | saturation |

absolute colorimetric은 별도의 `A2B3`/`B2A3`가 아니라, 보통 relative colorimetric transform과 media white point를 이용한 PCS 조정으로 처리된다.

### 1.4 v2의 중요한 특징: 동작하지만 모호성이 있다

v2는 널리 쓰였고 지금도 실무에서 중요하지만, v4에 비해 다음 부분이 덜 엄격했다.

- relative colorimetric 데이터가 측정 기반인지, 프로파일 제작자가 어느 정도 수정한 데이터인지 모호할 수 있다.
- perceptual intent에서 PCS의 동적 범위와 기준 매체/시청 조건이 충분히 명확하지 않았다.
- 색순응 정보를 어디까지 명시해야 하는지, CMM이 이를 어떻게 반영해야 하는지에 구현 차이가 생길 수 있었다.
- 같은 v2 프로파일 쌍을 사용해도 CMM마다 약간 다른 결과가 나올 여지가 있었다.

이 말은 “v2가 틀렸다”는 뜻이 아니다. v2는 실제 사용에서 매우 성공적이었지만, 프로파일 제작자와 CMM 구현자가 해석할 수 있는 여지가 컸고, 그 여지가 상호운용성 차이로 이어질 수 있었다는 뜻이다.

### 1.5 v2를 처리할 때의 CMM 관점

v2를 처리하는 CMM은 보수적으로 움직여야 한다.

- 먼저 v2 태그 타입을 정확히 지원해야 한다.
- matrix/TRC와 LUT 태그 중 어떤 경로를 쓸지 profile class와 태그 존재 여부로 판단한다.
- `chad` 같은 chromatic adaptation 정보가 없거나 한쪽 프로파일에만 있을 수 있으므로 예외 처리가 필요하다.
- Lab PCS의 8-bit/16-bit 인코딩 차이, `lut8Type`/`lut16Type`의 PCS 쪽 인코딩 같은 오래된 타입 규칙을 지켜야 한다.
- legacy 프로파일은 스펙상 허용되지만 색관리 결과가 최신 v4 프로파일보다 CMM에 더 의존할 수 있음을 감안해야 한다.

정리하면 v2 처리는 “고정된 D50 PCS를 쓰는 ICC 구조”이긴 하지만, 색순응, perceptual 기준, media white 해석 등에서 CMM이 레거시 관용성과 구현 판단을 더 많이 가져야 한다.

## 2. ICC v4 처리 방식

### 2.1 v4의 목표

ICC v4는 v2의 구조를 버린 것이 아니라, 같은 ICC.1 아키텍처를 더 명확하게 다듬은 버전이다. 가장 중요한 목표는 상호운용성이다. 같은 프로파일 쌍을 사용하면 CMM이 달라도 결과가 크게 갈리지 않도록 PCS와 렌더링 의도, 태그 사용 규칙을 더 분명히 했다.

v4에서도 기본 연결 구조는 같다.

```text
Source device values
-> Source profile transform
-> PCSXYZ 또는 PCSLAB
-> Destination profile transform
-> Destination device values
```

하지만 v4는 이 PCS가 어떤 조건의 색도값인지 더 엄격하게 정의한다.

### 2.2 v4 PCS 처리

v4의 PCS adopted white는 ISO 3664의 D50 illuminant chromaticity를 기준으로 한다. PCS는 `PCSXYZ` 또는 `PCSLAB`로 인코딩될 수 있고, 헤더의 PCS signature로 구분한다.

색도 기반 렌더링 의도에서는 측정 기반 colorimetry를 PCS adopted white에 맞게 색순응한 값으로 다룬다. 측정값이 D50 adopted white 기준이 아니라면, 프로파일은 이 변환을 설명하기 위한 chromatic adaptation 정보를 제공해야 한다.

즉 v4 처리 흐름에서는 `mediaWhitePointTag`와 `chromaticAdaptationTag`의 의미가 v2보다 더 분명하다.

```text
측정/장치 기준 색도
-> 필요하면 chromatic adaptation
-> PCS adopted white(D50)에 맞춘 PCSXYZ/PCSLAB
```

RGB display나 RGB working space가 D65 기반이라도, v4 ICC 프로파일 안에서는 PCS로 연결될 때 D50 PCS와의 관계가 명확해야 한다. 그래서 v4 RGB matrix/TRC 프로파일에서는 실제 장치 white와 PCS white의 관계를 `chad`와 D50 기준 media white 해석으로 분명히 잡는 것이 중요하다.

### 2.3 v4 transform 선택 우선순위

v4는 같은 프로파일 안에 여러 변환 표현이 있을 때 어떤 것을 먼저 쓸지 우선순위를 정의한다.

입력, 디스플레이, 출력, 색공간 프로파일에서는 지정된 rendering intent에 대해 대략 다음 순서로 본다.

```text
1. D2B* 또는 B2D* MPE 태그가 있고 CMM이 지원하면 사용
2. A2B* 또는 B2A* LUT 태그가 있으면 사용
3. 필요한 의도 태그가 없으면 A2B0 또는 B2A0로 fallback
4. 그래도 없으면 matrix/TRC 태그 사용
```

DeviceLink나 Abstract profile은 조금 다르게, `D2B0`가 있으면 그것을 우선하고, 없으면 `A2B0`를 사용한다.

이 우선순위는 구현에서 매우 중요하다. 예를 들어 v4.3 이후 MPE 기반 `D2B*`/`B2D*` 태그가 들어 있는 프로파일은 더 높은 정밀도와 유연성을 제공할 수 있다. 하지만 CMM이 해당 MPE processing element를 지원하지 않으면 그 태그는 사용할 수 없고, fallback 경로를 찾아야 한다.

### 2.4 v4의 LUT와 MPE 처리

v4는 v2의 `lut8Type`, `lut16Type`도 다루지만, 더 구조화된 `lutAToBType`, `lutBToAType`을 제공한다. 이 타입들은 변환 단계를 더 명확하게 표현한다.

개념적으로는 다음과 같은 블록 조합이다.

```text
곡선
-> 행렬
-> CLUT
-> 곡선
```

여기에 `multiProcessElementsType`이 추가되면, float32 기반의 처리 요소들을 순서대로 적용할 수 있다.

```text
MPE transform
-> one-dimensional curve set
-> matrix with offsets
-> CLUT
-> future processing element, 지원되는 경우
```

MPE 태그는 처리 요소의 순서를 프로파일 안에 명시하고, 각 요소의 출력이 다음 요소의 입력으로 넘어간다. 단, CMM이 모르는 processing element가 있으면 해당 MPE 태그는 사용하지 않고 fallback해야 한다.

### 2.5 v4가 v2와 실제로 다르게 처리되는 지점

v4 CMM 또는 v4-aware CMM은 v2와 비교해 다음을 더 엄격하게 적용한다.

- relative colorimetric intent는 측정 기반 colorimetry라는 전제로 다룬다.
- media white point와 ICC-absolute/relative 변환 관계를 명확히 계산한다.
- perceptual intent는 reference medium과 viewing environment 개념을 전제로 다룬다.
- chromatic adaptation 정보가 필요한 경우 더 명시적으로 사용한다.
- 같은 프로파일 안에 여러 변환 태그가 있을 때 표준화된 우선순위를 따른다.
- profile ID, 다국어 description, metadata, CICP/HDR 관련 태그 등 최신 태그를 추가로 읽을 수 있다.

정리하면 v4 처리는 “v2보다 더 좋은 색을 자동으로 만든다”기보다는, 같은 조건에서 더 예측 가능한 색관리 결과를 만들도록 처리 규칙을 조여 둔 방식이다.

## 3. iccMAX 처리 방식

### 3.1 iccMAX의 위치

iccMAX는 ICC.2 계열이다. 헤더에서는 v5 프로파일로 구분된다. 중요한 점은 iccMAX가 일반 v4 워크플로를 무조건 대체하는 규격이 아니라는 것이다. ICC도 일반적인 사진, 그래픽, 디스플레이, 프린터 워크플로에는 v4를 첫 선택지로 본다.

iccMAX는 다음과 같은 요구 때문에 만들어졌다.

- D50/2도 관찰자 기반 PCS만으로는 부족한 경우
- spectral data를 연결해야 하는 경우
- 다른 illuminant와 observer를 명시적으로 다뤄야 하는 경우
- HDR 확장 범위 PCS가 필요한 경우
- spot color, 형광/금속 잉크, 포장재, 재질/광택/질감 같은 물리적 속성을 더 잘 다뤄야 하는 경우
- 단순 matrix, curve, LUT보다 복잡한 함수형 transform을 프로파일 안에 담고 싶은 경우

### 3.2 iccMAX의 큰 처리 흐름

iccMAX도 “프로파일을 연결한다”는 큰 개념은 유지한다.

```text
Source encoding/device values
-> source transform
-> PCS 또는 spectral PCS 또는 MCS
-> PCS/PCC 조정
-> destination transform
-> destination encoding/device values
```

하지만 v2/v4와 달리 CMM이 먼저 판단해야 할 것이 많아진다.

```text
1. v5/iccMAX 프로파일인지 확인한다.
2. profile class뿐 아니라 sub-class와 transform type을 본다.
3. colorimetric PCS인지 spectral PCS인지 확인한다.
4. PCS configuration을 읽는다.
   - colour space encoding
   - illuminant
   - observer
   - spectral range
   - extended range/HDR 여부
5. Profile Connection Conditions(PCC)을 결정한다.
6. source와 destination PCS configuration이 일치하는지 본다.
7. 필요하면 PCS conversion 또는 observing condition conversion을 삽입한다.
8. MPE 기반 transform을 적용한다.
```

즉 iccMAX에서는 단순히 “PCS가 Lab인지 XYZ인지”만 보는 것으로 충분하지 않다. “어떤 관찰자와 광원 아래의 PCS인가”, “spectral PCS인가”, “HDR 확장 범위인가”, “PCC를 프로파일에서 가져오는가 아니면 CMM 제어 옵션으로 받는가”까지 봐야 한다.

### 3.3 PCS가 고정되지 않는다

v2/v4의 가장 큰 안정성은 PCS가 고정되어 있다는 점이다.

```text
v2/v4:
PCS = D50 기반, CIE 1931 2-degree observer 기반 XYZ/Lab
```

iccMAX는 이 부분을 확장한다.

```text
iccMAX:
PCS = colorimetric PCS일 수도 있고,
      spectral PCS일 수도 있고,
      observer/illuminant가 profile/PCC에 따라 달라질 수도 있음
```

예를 들어 source가 spectral PCS를 내보내고 destination이 colorimetric PCS를 받는다면, CMM은 spectral reflectance/transmittance/emission 정보를 지정된 illuminant와 observer의 colour matching function으로 적분해 XYZ/Lab 쪽 colorimetry로 바꾸어야 한다.

이때 illuminant와 observer는 프로파일 안의 조건에서 오거나, CMM 제어 옵션으로 외부에서 주어질 수 있다.

### 3.4 PCC와 observing condition conversion

iccMAX에서는 Profile Connection Conditions(PCC)가 매우 중요하다. PCC는 “이 프로파일 연결에서 어떤 관찰 조건을 사용할 것인가”를 정하는 조건 묶음이라고 볼 수 있다.

v2/v4에서는 대부분 다음과 같이 생각할 수 있다.

```text
프로파일 transform 결과는 D50 PCS로 온다.
CMM은 필요하면 absolute/relative 조정을 한다.
```

iccMAX에서는 다음처럼 된다.

```text
프로파일 transform 결과가 어떤 PCS configuration을 갖는지 확인한다.
source PCS와 destination PCS가 다르면 변환한다.
illuminant/observer가 다르면 observing condition conversion을 수행한다.
spectral PCS면 필요 시 colorimetric PCS로 변환한다.
```

그래서 iccMAX CMM은 단순 LUT 적용기보다 “PCS 구성 협상기”에 가깝다. transform을 고르는 일과 PCS 조건을 맞추는 일이 함께 일어난다.

### 3.5 iccMAX의 MPE와 프로그래머블 변환

v4에도 MPE가 있지만, iccMAX에서는 MPE의 역할이 더 중심적이다. iccMAX의 MPE는 float 기반 처리, spectral/colorimetric 처리, late-binding observer/illuminant 처리, 더 복잡한 계산 요소를 지원하도록 확장된다.

일반 LUT 기반 처리와 비교하면 차이가 크다.

```text
전통적 LUT:
입력값 -> 고정된 테이블 보간 -> 출력값

iccMAX MPE:
입력값
-> 곡선/행렬/CLUT/계산 요소
-> 필요하면 PCC 기반 observer/illuminant 적용
-> spectral <-> colorimetric 변환
-> 출력값
```

특히 “프로파일 안에 변환을 거의 프로그램처럼 담을 수 있다”는 점이 iccMAX의 큰 특징이다. 이것은 고정된 이미지 RGB/CMYK 변환보다, 재질/표면/특수 잉크/측정 조건이 중요한 영역에서 의미가 커진다.

### 3.6 HDR 확장 범위 PCS 처리

iccMAX는 HDR 워크플로도 더 직접적으로 고려한다. HDR profile이 extended-range colorimetric PCS를 사용하고, 이것이 non-extended-range PCS 프로파일과 연결되면 clipping이나 원치 않는 결과가 생길 수 있다.

iccMAX는 이를 위해 프로파일 헤더의 flag와 rendering-intent-specific tag를 사용해 HDR-to-SDR 같은 PCS range conversion을 선택하고 삽입할 수 있게 한다.

중요한 점은 CMM이 임의로 HDR-to-SDR 톤매핑을 invent하는 구조가 아니라는 것이다. 변환은 프로파일 태그로 제공되고, CMM은 조건에 맞게 선택하고 적용한다.

### 3.7 MCS와 multiplex channel 처리

iccMAX에는 Multiplex Connection Space(MCS)라는 추가 연결 개념도 있다. v2/v4의 PCS 연결은 장치 채널끼리 직접 이어 붙이는 구조가 아니다. 보통 장치 채널은 PCS로 변환되어 연결된다.

하지만 일부 워크플로에서는 “이름 있는 장치 유사 채널”을 유연하게 연결해야 한다. 예를 들어 여러 특수 잉크, 재료 채널, 공정 채널을 순서와 존재 여부까지 고려해서 연결해야 할 수 있다.

MCS는 이런 경우 채널 이름, 순서, subset 요구사항, 누락 채널 기본값 등을 이용해 채널 연결을 정의할 수 있게 한다.

### 3.8 iccMAX 호환성 처리

호환성 방향은 비대칭이다.

```text
iccMAX CMM:
v2, v4, iccMAX 프로파일을 인식하고 처리할 수 있어야 함

v4 CMM:
일반적으로 iccMAX 프로파일을 처리한다고 기대하면 안 됨
```

따라서 iccMAX를 사용하는 워크플로에서는 다음을 확인해야 한다.

- 사용 CMM이 iccMAX/v5 프로파일을 지원하는가
- 필요한 ICS(Interoperability Conformance Specification)가 있는가
- 프로파일이 사용하는 spectral PCS, MPE element, transform type을 CMM이 지원하는가
- v2/v4 프로파일과 연결할 때 PCS conversion이 어떻게 일어나는가
- v4-only 워크플로를 위해 iccMAX 프로파일을 v4 private tag에 포함하는 fallback 설계가 필요한가

## 4. 같은 변환을 세 버전에서 비교하기

예를 들어 sRGB 이미지를 CMYK 출력 프로파일로 변환한다고 하자.

### 4.1 v2 프로파일끼리 연결

```text
sRGB v2 profile
-> matrix/TRC 또는 A2B0
-> PCSXYZ 또는 PCSLAB, D50 기준
-> 필요하면 PCS 조정
-> CMYK v2 output profile의 B2A0/B2A1/B2A2
-> CMYK 값
```

CMM은 오래된 LUT 타입과 v2 PCS 해석을 지원해야 한다. 프로파일에 따라 색순응 정보가 부족하거나 perceptual intent 해석이 프로파일 제작자/CMM에 더 의존할 수 있다.

### 4.2 v4 프로파일끼리 연결

```text
sRGB v4 profile
-> 우선순위에 따라 D2B*, A2B*, matrix/TRC 선택
-> 명확한 D50 PCSXYZ/PCSLAB
-> relative/absolute/perceptual 규칙에 따른 PCS 조정
-> CMYK v4 output profile의 B2D* 또는 B2A*
-> CMYK 값
```

CMM은 태그 우선순위를 더 명확히 따른다. chromatic adaptation, media white, perceptual reference 조건이 v2보다 잘 정의되어 있어 예측 가능성이 높다.

### 4.3 iccMAX 프로파일을 포함한 연결

```text
sRGB v4 또는 iccMAX profile
-> source transform type 선택
-> PCS configuration 결정
-> 필요하면 v4 D50 PCS와 iccMAX custom/spectral PCS 사이 변환
-> PCC 기반 illuminant/observer 처리
-> destination iccMAX transform 적용
-> 출력 encoding/device 값
```

여기서는 “RGB에서 CMYK로 바꾼다”는 표면적 작업은 같아도, 내부적으로는 PCS 조건 협상과 transform type 선택이 훨씬 중요해진다. 특히 spectral PCS나 HDR range가 끼면 v2/v4식 단순 연결 모델로는 충분하지 않다.

## 5. 구현 관점 체크리스트

라이브러리나 도구에서 세 버전을 지원하려면 다음 순서로 판단하면 좋다.

### 5.1 프로파일 식별

```text
header.version < 4.0  -> v2 계열로 처리
header.version 4.x    -> v4 계열로 처리
header.version 5.x    -> iccMAX/v5 계열로 처리
```

단, 실제 구현에서는 version 숫자만 보지 말고 tag type, profile class, 필수 태그 존재 여부, profile size와 tag table 정합성도 함께 검증해야 한다.

### 5.2 transform 선택

```text
입력값을 PCS로 보낼 때:
  v2: A2B* 또는 matrix/TRC
  v4: D2B* 우선, 그다음 A2B*, fallback으로 matrix/TRC
  iccMAX: transform type + PCS configuration + MPE 지원 여부 확인

PCS를 출력값으로 보낼 때:
  v2: B2A*
  v4: B2D* 우선, 그다음 B2A*
  iccMAX: colorimetric/spectral transform type과 PCC 확인
```

### 5.3 PCS 처리

```text
v2:
  D50 기반 PCS를 전제로 하되, legacy ambiguity와 누락 태그에 주의

v4:
  D50 PCS, media white, chromatic adaptation, intent별 의미를 명확히 적용

iccMAX:
  PCS가 고정 D50 XYZ/Lab이라는 가정을 버리고,
  illuminant, observer, spectral range, extended range를 확인
```

### 5.4 실패와 fallback

```text
지원하지 않는 태그 타입:
  -> 다음 우선순위 태그로 fallback

지원하지 않는 MPE element:
  -> 해당 MPE transform은 사용하지 않음

iccMAX 프로파일을 v4 CMM에서 만남:
  -> 일반적으로 처리 불가
  -> v4 wrapper/private tag fallback 여부 확인

필수 태그 누락:
  -> 프로파일 불량으로 처리하거나 제한된 fallback만 허용
```

## 6. 실무적 판단 기준

### v2를 써야 하거나 만나게 되는 경우

- 오래된 OS, 프린터 드라이버, RIP, PDF 워크플로와 호환해야 한다.
- 기존 파일에 포함된 프로파일이 v2다.
- 특정 인쇄소나 장비가 v2 프로파일을 요구한다.

이 경우 색이 “틀린다”고 단정하지 말고, v2 프로파일의 품질과 CMM 호환성을 확인해야 한다.

### v4를 우선 선택하는 경우

- 일반 이미지, 그래픽, 디스플레이, 프린트 색관리다.
- 새 프로파일을 만들 수 있고, 대상 소프트웨어가 v4를 지원한다.
- CMM 간 결과 차이를 줄이고 싶다.
- PCS와 rendering intent 해석을 더 명확히 가져가고 싶다.

현재 일반 워크플로에서는 v4가 가장 합리적인 기본 선택지다.

### iccMAX를 고려하는 경우

- spectral data가 필요하다.
- D50/2도 관찰자만으로는 부족하다.
- 광원/관찰자/시청 조건을 프로파일 연결 단계에서 다뤄야 한다.
- HDR 확장 범위 PCS가 필요하다.
- 형광, 금속, 특수 잉크, 포장재, 재질, 광택, 방향성 반사 같은 물리 속성을 다뤄야 한다.
- 단순 matrix/LUT로 표현하기 어려운 장치 모델이나 함수형 변환이 필요하다.

iccMAX는 강력하지만, 그만큼 CMM 지원과 워크플로 합의가 중요하다.

## 7. 핵심 요약

v2, v4, iccMAX의 차이는 파일 확장자 차이가 아니라 “PCS와 transform을 얼마나 엄격하고 유연하게 정의하는가”의 차이다.

- v2는 지금도 읽어야 하는 레거시 ICC 구조다. 동작 범위는 넓지만, PCS/렌더링 의도/색순응 해석에서 모호성이 남아 CMM 차이가 생길 수 있다.
- v4는 일반 색관리의 현재 기본형이다. v2와 같은 큰 구조를 유지하면서 PCS, media white, chromatic adaptation, rendering intent, transform 우선순위를 더 명확히 한다.
- iccMAX는 v4의 확장 또는 대안이다. D50 고정 PCS를 넘어 spectral PCS, 임의 illuminant/observer, HDR range, MCS, 확장 MPE를 처리한다.

한 문장으로 줄이면 다음과 같다.

```text
v2는 legacy ICC를 관용적으로 처리하는 모델,
v4는 D50 PCS 기반 ICC를 예측 가능하게 처리하는 모델,
iccMAX는 PCS 자체를 더 유연하게 협상하고 확장 transform을 처리하는 모델이다.
```

## 8. 이미지에 포함될 수 있는 ICC 프로파일 예제

JPEG, TIFF, PNG 같은 이미지 파일은 픽셀 데이터와 별도로 ICC 프로파일을 포함할 수 있다. JPEG에서는 보통 APP2 marker에 `ICC_PROFILE` 조각으로 저장되고, 큰 프로파일은 여러 조각으로 나뉘어 들어갈 수 있다. 이미지 디코더는 조각을 합쳐 하나의 ICC 프로파일 바이트 스트림을 복원한 뒤, 위에서 설명한 128바이트 헤더와 태그 테이블을 파싱한다.

### 일반적인 RGB JPEG 예제

일반 카메라 사진, 웹 이미지, 스크린샷 JPEG에는 보통 sRGB 계열 또는 Display/ColorSpace 계열 RGB ICC 프로파일이 포함된다.

```text
JPEG image
├─ compressed image data
│  └─ pixel encoding: 8-bit YCbCr 또는 RGB로 저장된 RGB 이미지
└─ embedded ICC profile
   ├─ profile version: ICC.1 v2 또는 v4
   ├─ profile class: `mntr` display 또는 `spac` color space
   ├─ data color space: `RGB `
   ├─ PCS: `XYZ ` 또는 `Lab `
   └─ common tags
      ├─ `desc` 또는 `mluc`: 프로파일 설명, 예: "sRGB IEC61966-2.1"
      ├─ `wtpt`: media white point
      ├─ `rXYZ`, `gXYZ`, `bXYZ`: RGB primaries의 PCSXYZ 좌표
      ├─ `rTRC`, `gTRC`, `bTRC`: RGB tone response curve
      └─ `chad`: chromatic adaptation, v4에서 중요
```

이런 프로파일은 대체로 matrix/TRC 기반이다. 처리 흐름은 다음처럼 단순하다.

```text
JPEG RGB sample
-> TRC inverse 또는 parametric curve 적용
-> RGB primary matrix로 PCSXYZ 변환
-> 목적지 display/printer profile로 연결
```

예상되는 헤더 값은 다음과 같다.

| 필드 | 예시 값 | 의미 |
|---|---|---|
| `profile/device class` | `mntr` 또는 `spac` | 디스플레이 프로파일 또는 RGB 작업 색공간 프로파일 |
| `data color space` | `RGB ` | 이미지 픽셀의 색 인코딩이 RGB 계열임 |
| `PCS` | `XYZ ` | RGB 값을 PCSXYZ로 연결 |
| `rendering intent` | 보통 `0` 또는 `1` | perceptual 또는 relative colorimetric |
| 주요 tag type | `XYZ `, `curv`, `para`, `mluc` | primary, tone curve, 설명 문자열 등 |

### CMYK JPEG 또는 인쇄용 이미지 예제

인쇄 워크플로에서 쓰이는 CMYK JPEG, TIFF, PDF 내 이미지에는 CMYK output profile이 포함될 수 있다. 대표적으로 인쇄 조건을 나타내는 프로파일이 들어가며, 단순 matrix/TRC보다 LUT 기반 태그가 중요하다.

```text
CMYK image
├─ compressed image data
│  └─ pixel encoding: C, M, Y, K device values
└─ embedded ICC profile
   ├─ profile version: ICC.1 v2 또는 v4
   ├─ profile class: `prtr` output
   ├─ data color space: `CMYK`
   ├─ PCS: `XYZ ` 또는 `Lab `
   └─ common tags
      ├─ `desc` 또는 `mluc`: 프로파일 설명, 예: 인쇄 조건 이름
      ├─ `wtpt`: media white point
      ├─ `A2B0`, `A2B1`, `A2B2`: CMYK -> PCS 변환
      ├─ `B2A0`, `B2A1`, `B2A2`: PCS -> CMYK 변환
      ├─ `gamt`: gamut 정보, 선택적
      ├─ `clrt`: colorant table, 선택적
      └─ `chad`: chromatic adaptation, v4에서 중요
```

이런 프로파일은 보통 `mft1`/`mft2`, `mAB `, `mBA ` 같은 LUT 기반 tag type을 사용한다.

```text
CMYK source image를 display로 보기

CMYK sample
-> source CMYK profile의 `A2B*`
-> PCS
-> display RGB profile의 `B2A*` 또는 matrix/TRC inverse
-> monitor RGB
```

```text
RGB image를 CMYK 프린터로 출력

RGB sample
-> source RGB profile의 matrix/TRC 또는 `A2B*`
-> PCS
-> destination CMYK profile의 `B2A*`
-> CMYK device values
```

예상되는 헤더 값은 다음과 같다.

| 필드 | 예시 값 | 의미 |
|---|---|---|
| `profile/device class` | `prtr` | 출력 장치 또는 인쇄 조건 프로파일 |
| `data color space` | `CMYK` | 이미지 픽셀 또는 출력 장치 값이 CMYK |
| `PCS` | `Lab ` 또는 `XYZ ` | CMYK 값을 PCS로 연결 |
| `rendering intent` | `0`, `1`, `2`, `3` | perceptual, relative, saturation, absolute 중 하나 |
| 주요 tag type | `mft1`, `mft2`, `mAB `, `mBA `, `mluc` | LUT 변환과 설명 문자열 |

주의할 점은 CMYK 이미지에 포함된 ICC 프로파일이 “CMYK라는 이름”만 알려주는 것이 아니라, 특정 인쇄 조건에서 C/M/Y/K 값이 어떤 색으로 보이는지를 정의한다는 점이다. 그래서 같은 CMYK 값이라도 프로파일이 다르면 PCS로 변환한 색이 달라질 수 있다.

## 참고 자료

- ICC, [Current ICC specifications](https://www.color.org/specifications/)
- ICC, [ICC Specifications](https://www.color.org/icc_specs2.xalter)
- ICC, [ICC.1 v2 Specification](https://www.color.org/v2spec.xalter)
- ICC, [ICC.1 v4 Specification](https://www.color.org/v4spec.xalter)
- ICC, [ICC.1:2022 Profile version 4.4.0.0 PDF](https://www.color.org/specifications/ICC.1-2022-05.pdf)
- ICC, [ICC.1:2001-04 v2 PDF](https://www.color.org/specifications/ICC.1-2001-04.pdf)
- ICC, [The reasons for changing to the v4 ICC profile format](https://www.color.org/advantagesV4.pdf)
- ICC, [iccMAX overview](https://www.color.org/iccmax/index.xalter)
- ICC, [Why use iccMAX profiles?](https://www.color.org/iccmax/whyiccmax.xalter)
- ICC, [Making connections with iccMAX: Connecting using iccMAX / V5 ICC profiles](https://www.color.org/iccmax/connection5.xalter)
- ICC, [Making connections with iccMAX: PCS Conversion and/or Adjustment](https://www.color.org/iccmax/connection6.xalter)
- ICC, [ICC.2:2023 iccMAX PDF](https://www.color.org/specification/ICC.2-2023.pdf)
