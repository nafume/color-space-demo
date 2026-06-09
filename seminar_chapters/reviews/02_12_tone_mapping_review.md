# Review: 2회차 Chapter 12. Tone Mapping

대상 draft: `seminar_chapters/drafts/02_12_tone_mapping.md`

## 판정

기술적으로 좋은 초안이다. 톤매핑을 단순 HDR-to-SDR 축소가 아니라 대상 표시 환경에 맞춘 밝기 관계 재설계로 설명하고, clipping, highlight roll-off, saturation/hue shift, gamut mapping과의 상호작용, metadata의 한계를 모두 짚는다.

보완할 부분은 global/local operator 구분과 "휘도 기반 tone mapping"의 한계다. 초안이 perceptual tone mapping을 다루지만, global curve와 local/adaptive tone mapping의 장단점 및 artifact를 명시하면 알려진 함정을 더 잘 막을 수 있다.

## 높은 우선순위 수정

없음. 다만 `HDR Rec.2020 PQ -> transfer 해석 / linearize -> tone map luminance -> gamut map` 흐름은 도입용 예시임을 더 강하게 표시하는 것이 좋다. 실제 구현에서는 tone mapping과 gamut mapping이 color-volume mapping으로 결합되거나, RGB/ICtCp/Lab 등 다른 공간에서 처리될 수 있다.

## 기술 노트

- `1000 nits를 100 nits SDR에 그대로 넣을 수 없다`는 도입은 명확하다. 단, SDR 기준 휘도는 BT.1886/Rec.709 관행에서 보통 100 cd/m2 reference white를 말한다는 식의 단서를 붙이면 더 정확하다.
- RGB 채널별 clipping이 hue shift를 만든다는 설명은 매우 좋다. 여기에 "luminance만 보존하면 밝은 고채도 색이 target gamut 밖에 남을 수 있다"는 반대 방향의 위험도 추가하면 균형이 좋다.
- `saturation을 무조건 보존하는 것도 정답은 아니다`는 중요한 문장이다. 실제 display color volume 밖의 밝은 색은 자연스러운 desaturation 또는 hue-preserving compression이 필요할 수 있다.
- Metadata 설명은 정확하다. Mastering display metadata는 마스터링 기준 디스플레이 정보이지 소비자 디스플레이 능력이 아니며, MaxCLL/MaxFALL은 장면별 의도나 local contrast를 충분히 설명하지 못한다는 점을 유지하면 좋다.
- Dolby Vision/HDR10+ 같은 dynamic metadata도 "정답"이 아니라 재생 체인의 구현과 target display mapping에 의존한다는 톤이 적절하다.

## 용어/스타일 노트

- `peak brightness`보다 `peak luminance`를 기본 용어로 쓰고, 필요할 때 `밝기`를 교육용 표현으로 병기하면 이전 장과 일관된다.
- `tone map luminance`라는 표현은 luminance-only operator로 오해될 수 있다. "밝기 관계를 중심으로 재배치하되 색상/채도와 결합해서 처리될 수 있다"는 문장을 더하면 좋다.
- `gamut conversion`과 `gamut mapping`은 구분해 쓰는 것을 권장한다. 단순 matrix conversion은 target gamut 밖의 값을 만들 수 있고, gamut mapping은 out-of-gamut 값을 어떻게 안으로 넣을지 정하는 단계다.

## 제안 추가

- Global tone mapping과 local tone mapping을 별도 소절로 추가하면 좋다. Global operator는 일관성과 예측 가능성이 좋지만 장면별 최적화가 약할 수 있고, local/adaptive operator는 국소 대비를 살릴 수 있지만 halo, flicker, temporal inconsistency 같은 artifact가 생길 수 있다.
- 대표 알고리즘 이름을 예시로만 넣으면 좋다: Reinhard, Hable/filmic, Mobius, BT.2390 계열, display-adaptive mapping 등. 단, 특정 알고리즘이 표준 정답이라는 인상은 피해야 한다.
- 동영상에서는 프레임별 peak에만 반응하면 밝기가 출렁일 수 있으므로 temporal smoothing/scene change handling이 필요하다는 실무 함정을 넣으면 좋다.
- 실습 장과 연결해 `ffmpeg tonemap`, `zscale`, `libplacebo`는 알고리즘과 peak/metadata 처리 방식이 다르므로 결과 비교 시 파라미터를 함께 봐야 한다고 예고하면 좋다.

## 잔여 위험

톤매핑은 기술 변환과 창작 판단이 섞이는 영역이라 단일 "정답"을 제시하기 어렵다. 초안은 이 점을 잘 피하고 있지만, 실습에서 특정 ffmpeg 명령 하나를 "올바른 톤매핑"으로 제시하면 이 장의 뉘앙스가 약해질 수 있다. 실습은 여러 실패/성공 후보를 비교하는 방식이 더 안전하다.
