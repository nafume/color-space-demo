# [Draft] Appendix. Camera Log Curves

## 이 appendix의 목적

이 appendix는 `Camera Log` 탭에서 다루는 질문들을 하나의 흐름으로 정리한다. 핵심은 카메라 로그를 "최종 화면을 위한 감마"가 아니라, 촬영 현장의 넓은 scene exposure를 제한된 code value 안에 배치하는 acquisition curve로 이해하는 것이다.

```text
Camera Log = scene-linear exposure를 후반 작업용 code value로 압축하는 촬영/저장용 곡선
```

따라서 카메라 로그는 sRGB, Rec.709, PQ, HLG 같은 표시용 transfer characteristic과 같은 그래프에 놓으면 오해가 생기기 쉽다. 표시용 transfer는 code value를 디스플레이 빛으로 바꾸는 목적이 강하고, 카메라 로그는 촬영 장면의 상대 노출 범위를 후반 작업에 유리하게 보존하는 목적이 강하다.

## 왜 카메라는 Log로 저장하는가

카메라가 보는 실제 장면은 어두운 그림자부터 강한 하이라이트까지 매우 넓은 밝기 범위를 가진다. 그러나 영상 파일은 보통 10-bit 또는 12-bit처럼 저장 가능한 code value 수가 제한되어 있다.

scene-linear 값을 그대로 저장하면 밝은 영역이 많은 code value를 차지하고, 그림자와 중간톤은 상대적으로 부족한 code value에 몰릴 수 있다. 그 결과 후반 색보정에서 banding, 톤 손실, 하이라이트 clipping이 더 쉽게 나타난다.

Log encoding은 밝기가 배수로 증가하는 것을 완만하게 압축한다.

```text
scene-linear exposure
    ↓ log encoding
camera log code value
```

이렇게 하면 다음 이점이 있다.

- 하이라이트를 무작정 잘라내지 않고 code value 안에 눌러 담을 수 있다.
- 중간톤과 피부톤에 충분한 code value를 배치할 수 있다.
- 후반 작업에서 노출, 대비, 색감, highlight roll-off를 더 유연하게 조정할 수 있다.
- 같은 원본을 Rec.709 SDR, HDR PQ, HLG, 극장용 룩 등 여러 출력으로 변환하기 쉽다.

즉 Log는 "보기 좋은 최종 화면"이 아니라 "후처리하기 좋은 중간 저장 신호"에 가깝다.

## 왜 Log 그대로 최종 결과물이 되기 어려운가

Log는 정보를 보존하기 좋은 신호지만, 사람이 보기 좋은 최종 표시 신호는 아니다.

첫째, 디스플레이가 기대하는 신호가 아니다. TV와 모니터는 보통 sRGB, Rec.709, PQ, HLG 같은 표시용 transfer를 전제로 동작한다. Log 신호를 그대로 보내면 디스플레이는 그 숫자를 어떤 빛으로 해석해야 하는지 알 수 없다.

둘째, Log 이미지는 낮은 대비와 낮은 채도처럼 보인다. 넓은 scene dynamic range를 좁은 code value 안에 넣기 위해 중간톤과 하이라이트가 눌려 있기 때문이다. 그래서 Log 원본은 보통 물 빠진 듯한 회색 이미지처럼 보인다.

셋째, 최종 화면은 창작적 선택을 필요로 한다. 같은 Log 원본이라도 SDR로 만들지 HDR로 만들지, 하이라이트를 얼마나 살릴지, 피부톤을 어디에 놓을지, 그림자를 얼마나 눌러 검정으로 만들지에 따라 결과가 달라진다.

```text
Log 원본 = 재료를 넓게 보존한 상태
최종 영상 = 출력 환경과 의도에 맞게 조리한 결과
```

## 18% gray의 의미

카메라 로그를 stop 축으로 읽을 때 기준점으로 자주 쓰는 값이 `18% gray`다. 이것은 모니터의 18 nits를 의미하지 않는다. 18% gray는 입사한 빛의 약 18%를 반사하는 중간 회색 표면을 뜻한다.

이 문서와 데모에서는 다음 기준을 사용한다.

```text
scene-linear 0.18 = 18% gray = 0 stop
```

따라서 stop은 절대 밝기 단위가 아니라 기준값에 대한 상대 배율이다.

```text
+1 stop = 기준보다 빛 2배
-1 stop = 기준보다 빛 1/2배
+2 stops = 기준보다 빛 4배
```

수식으로 쓰면 다음과 같다.

```text
stops = log2(sceneLinear / 0.18)
```

예를 들어 scene-linear 값이 `0.36`이면 `+1 stop`, `0.09`이면 `-1 stop`이다. 이 기준을 쓰면 각 로그 곡선이 같은 장면 노출을 code value 안에 어떻게 배치하는지 비교할 수 있다.

## Code value와 scene-linear는 다른 축이다

카메라 로그에서 `code value 0.6`은 "빛 0.6"이 아니다. 그것은 로그로 인코딩된 신호값이다. 이 값을 decode하면 scene-linear 값이 `1.0`을 넘을 수 있다.

예를 들어 LogC3, S-Log3, V-Log 같은 곡선에서는 code value 0.6 근처가 이미 18% gray보다 훨씬 밝은 highlight 영역일 수 있다. 그래서 code value 그래프를 단순히 `0~1` light 그래프로 그리면 1.0을 넘는 scene-linear 값이 잘리거나, 전부 1.0에 붙어 보이는 문제가 생긴다.

그래서 Camera Log 탭에서는 code value와 scene stops를 분리해서 본다.

```text
Encode: scene stops → camera log code value
Decode: camera log code value → scene stops
```

이 방식이 "로그가 노출 범위를 어떻게 코드값에 배치하는지"를 이해하기에 더 직접적이다.

## Stop은 절대 밝기인가

아니다. Stop은 절대적인 빛의 세기가 아니라 상대적인 배율이다. 반드시 기준점이 필요하다. 이 문서에서는 18% gray를 기준점으로 사용한다.

따라서 `+10 stops`라는 말은 "절대 몇 nits"가 아니라 "18% gray보다 2^10배 높은 scene-linear 노출"이라는 뜻이다.

```text
+10 stops = 18% gray의 1024배
```

디스플레이 nits로 바꾸려면 별도의 display transform, tone mapping, 출력 기준이 필요하다.

## 로그 함수만으로 알 수 있는 것과 알 수 없는 것

로그 함수만으로 알 수 있는 값이 있다.

- `black code`: `encode(sceneLinear = 0)`으로 계산할 수 있다.
- `middle gray code`: `encode(sceneLinear = 0.18)`로 계산할 수 있다.
- `upper headroom`: `decode(codeValue = 1.0)`을 stop으로 환산해 계산할 수 있다.
- code value가 shadow, midtone, highlight에 어떻게 배분되는지 알 수 있다.

하지만 로그 함수만으로 알 수 없는 것도 있다.

- `sensor noise floor`
- shadow 쪽에서 어디까지 유효한 정보가 남는지
- 실제 카메라 RAW/ISO/EI 설정에서의 usable dynamic range
- 카메라 모델별 highlight clipping 또는 noise 처리
- legal range / full range mapping
- codec, bit depth, monitoring LUT, metadata 정책

예를 들어 수식상으로 아주 낮은 scene-linear 값이 code value 안에 들어가더라도, 센서 노이즈가 그보다 크면 실제로 유효한 정보가 아닐 수 있다. 따라서 Camera Log 탭은 로그 곡선의 배치 특성을 보여주는 것이지, 특정 카메라 센서의 실제 usable dynamic range를 직접 보증하는 그래프는 아니다.

## 로그별로 무엇을 비교해야 하나

카메라 로그 비교에서 의미 있는 기준점은 보통 다음 세 가지다.

### 1. Black code

`sceneLinear = 0`이 어느 code value에 놓이는지 보는 값이다. 이것은 로그 곡선의 수식만으로 계산 가능하다.

```text
black code = encode(0)
```

단, black code가 곧 sensor noise floor는 아니다. noise floor는 카메라와 촬영 조건에 따라 달라진다.

### 2. 18% gray code

기준 중간 회색이 어느 code value에 놓이는지 보는 값이다.

```text
middle gray code = encode(0.18)
```

예를 들어 현재 데모 수식 기준으로는 대략 다음처럼 배치된다.

```text
RED Log3G10:  약 0.333
ARRI LogC3:   약 0.391
Sony S-Log3:  약 0.411
Panasonic V-Log: 약 0.423
```

이 값이 낮을수록 18% gray 위쪽 highlight에 더 많은 code value 공간을 남기는 경향이 있다.

### 3. Upper headroom

`code value = 1.0`이 18% gray 기준 몇 stops 위인지 보는 값이다.

```text
upper stops = log2(decode(1.0) / 0.18)
```

현재 데모 수식 기준으로는 대략 다음처럼 보인다.

```text
RED Log3G10:      약 +10 stops
ARRI LogC3 EI800: 약 +8.3 stops
Panasonic V-Log:  약 +8 stops
Sony S-Log3:      약 +7.7 stops
```

이것은 센서 성능 순위가 아니다. 각 로그 곡선이 18% gray 위쪽 highlight headroom을 code value 안에 어떻게 배치하는지 보여주는 값이다.

## RED Log3G10을 어떻게 읽어야 하나

RED Log3G10은 이름처럼 18% gray 위쪽으로 약 10 stops를 code value 1.0 근처까지 담도록 설계된 로그 곡선이다. 그래서 그래프에서는 RED Log3G10이 다른 예시 로그보다 위쪽 highlight headroom을 더 넓게 배치하는 것처럼 보인다.

하지만 이것을 "RED 카메라가 무조건 다른 카메라보다 더 넓은 dynamic range를 촬영한다"로 읽으면 안 된다. 여기서 비교하는 것은 로그 곡선의 code value 배치다. 실제 촬영 가능한 dynamic range는 카메라 센서, ISO/EI, RAW 처리, 노이즈 기준, codec, 카메라 설정에 의해 결정된다.

정확한 표현은 다음에 가깝다.

```text
RED Log3G10은 18% gray 기준 위쪽 highlight headroom을 약 +10 stops까지 code value 안에 배치한다.
```

## Grading, Tone Mapping, Display Transform

Log를 최종 영상으로 만들 때 자주 등장하는 세 단어가 있다.

### Grading

창작자가 원하는 룩을 만드는 색보정 작업이다. 노출, 대비, 채도, 피부톤, 장면 간 일관성, 특정 색감 등을 조정한다. 기술 변환이라기보다 미학적 결정에 가깝다.

예를 들어 그림자를 차갑게 만들거나, 피부톤을 따뜻하게 만들거나, 밤 장면을 더 어둡고 대비 있게 만드는 작업이 grading이다.

### Tone Mapping

넓은 밝기 범위를 더 좁은 표시 범위에 맞게 압축하는 과정이다. 특히 HDR 또는 Log처럼 큰 dynamic range를 SDR이나 특정 디스플레이 밝기에 맞출 때 필요하다.

목표는 하이라이트를 단순히 자르지 않고, 보기 좋은 방식으로 눌러 담는 것이다.

```text
1000 nits HDR highlight → 100 nits SDR 화면에서도 디테일이 보이도록 압축
```

### Display Transform

작업 중인 색과 밝기 표현을 실제 출력 표준으로 변환하는 기술적 단계다. Log, scene-linear, ACES 같은 작업공간을 Rec.709, sRGB, PQ, HLG 같은 표시용 신호로 바꾼다.

Display transform에는 transfer function, color primaries, white point, gamut mapping, tone mapping이 포함될 수 있다.

실무 흐름은 대략 다음처럼 이해할 수 있다.

```text
Camera Log / RAW
    ↓ input transform 또는 log decode
scene-linear / working space
    ↓ grading
graded working image
    ↓ output display transform + tone mapping
Rec.709 SDR / PQ HDR / HLG HDR
```

## 데모 그래프를 읽을 때 주의할 점

Camera Log 탭은 로그 곡선 자체를 이해하기 위한 교육용 그래프다.

- X축 또는 Y축의 stops는 18% gray 기준 상대 노출이다.
- code value는 저장/전송되는 정규화된 신호값이다.
- `+n stops`는 nits가 아니다.
- black code는 수식으로 알 수 있지만 sensor noise floor는 알 수 없다.
- upper headroom은 로그 곡선의 배치 특성이지 센서 dynamic range 그 자체가 아니다.
- legal range/full range가 적용되면 실제 파일의 정수 코드값 위치는 달라질 수 있다.

즉 이 그래프는 다음 질문에 답한다.

```text
이 로그 곡선은 장면의 상대 노출을 code value 안에 어떻게 배치하는가?
```

하지만 다음 질문에는 별도 카메라/촬영/코덱 데이터가 필요하다.

```text
이 카메라는 실제로 몇 stops까지 깨끗하게 촬영할 수 있는가?
```

## 참고 자료

- ARRI, "ALEXA Log C Curve - Usage in VFX": https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf
- Sony, "Technical Summary for S-Gamut/S-Log3": https://pro.sony/s3/cms-static-content/uploadfile/06/1237494271406.pdf
- Panasonic, "V-Log/V-Gamut Reference Manual": https://pro-av.panasonic.net/en/cinema_camera_varicam_eva/support/pdf/VARICAM_V-Log_V-Gamut.pdf
- RED Digital Cinema, "White Paper on REDWideGamutRGB and Log3G10": https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf
- Sony USA, "What is S-Log?": https://www.sony.com/electronics/support/e-mount-body-ilce-7-series/ilce-7rm3/articles/00145908
