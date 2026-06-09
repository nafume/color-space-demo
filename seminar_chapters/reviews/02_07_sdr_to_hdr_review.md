# Review: 2회차 Chapter 7. SDR에서 HDR로

대상 draft: `seminar_chapters/drafts/02_07_sdr_to_hdr.md`

## Verdict

전반적으로 정확하고 마무리 장으로 흐름이 좋다. HDR을 "무조건 더 밝게"가 아니라 더 넓은 휘도 범위, 하이라이트 보존, 마스터링 디스플레이, 전송 함수, 메타데이터, 톤매핑이 얽힌 파이프라인으로 설명한 점이 안정적이다. wide gamut과 HDR을 분리한 것도 중요하다.

가장 필요한 보완은 제목에 걸맞게 SDR/HDR 변환 위험을 더 직접적으로 다루는 것이다. 현재는 HDR 개념 소개가 중심이고, SDR->HDR 업컨버전이나 HDR->SDR 톤매핑에서 생기는 실패 모드가 상대적으로 적다.

## High-Priority Corrections

### Important: SDR/HDR 변환 위험을 별도 섹션으로 추가하는 것이 좋음

- 위치: draft 1, 29-31, 108-114, 144-146
- 왜 중요한가: 장 제목이 "SDR에서 HDR로"이므로 청중은 실제 변환을 떠올릴 가능성이 크다. SDR을 HDR 컨테이너에 넣거나 단순히 밝기만 늘리면 HDR이 되는 것이 아니다. 잘못된 변환은 중간톤 과상승, 피부톤 변화, 노이즈/밴딩 확대, 하이라이트 가짜 생성, 색역 과포화, 메타데이터 불일치를 만든다.
- 제안: `SDR->HDR 변환의 함정` 섹션을 추가하고, 최소한 `inverse transfer로 선형/표시 기준을 확인`, `톤 확장 정책`, `하이라이트 복원은 원본에 없는 정보를 만들 수 없음`, `gamut mapping`, `metadata tagging`, `QC`를 짚는다. HDR->SDR도 톤매핑과 gamut mapping 없이는 클리핑/색 틀어짐이 생긴다고 함께 언급하면 좋다.

## Technical Notes

- 위치: draft 23
- Rec.709 SDR에서 100 nits 근처의 기준 표시 환경을 이야기하는 것은 맞다. 보강한다면 SDR reference white와 diffuse white, BT.1886 기준 EOTF, 시청 환경이 함께 묶인다는 점을 한 문장 넣으면 앞 Chapter 3과 연결된다.

- 위치: draft 35-39
- mastering display metadata는 힌트라는 설명이 정확하다. 추가로 mastering display의 peak와 실제 콘텐츠 MaxCLL은 다를 수 있고, MaxCLL/MaxFALL이 부정확하거나 없는 파일도 있다는 실무 caveat가 있으면 좋다.

- 위치: draft 43-45
- PQ와 HLG 설명은 Chapter 4와 일관된다. HLG는 상대 밝기와 OOTF/system gamma를 통해 표시 환경에 적응하는 방식이라는 점을 짧게 다시 붙이면 좋다.

- 위치: draft 56
- HDR10은 보통 Rec.2020 container, PQ/ST 2084, 10비트, 정적 메타데이터라는 설명이 맞다. 실제 콘텐츠 색이 P3 범위 안에 머무는 경우가 많다는 caveat를 추가하면 wide gamut 오해를 줄인다.

- 위치: draft 64-66
- Dolby Vision을 동적 메타데이터 중심으로 소개하는 것은 이 장의 수준에 적절하다. 다만 Dolby Vision은 프로파일에 따라 PQ 기반, base layer/enhancement layer, HDR10 호환성 등이 달라질 수 있으므로 "개념 수준"이라는 단서를 유지하는 것이 좋다.

## Terminology/Style Notes

- `peak luminance`는 디스플레이 성능과 콘텐츠 피크 양쪽에 쓰일 수 있으므로, 콘텐츠에는 `MaxCLL` 또는 `콘텐츠 피크`, 장치에는 `디스플레이 peak luminance`처럼 구분하면 더 명확하다.
- `wide gamut`은 한글 본문에서 `넓은 색역(wide color gamut, WCG)`로 한 번 약어를 정하면 뒤에서 `WCG`를 써도 좋다.
- `HDR 전달 방식 또는 생태계`라는 표현은 적절하다. PQ/HLG는 transfer/system 성격이고 HDR10/Dolby Vision은 포맷/생태계 성격이라는 구분을 계속 유지하면 좋다.

## Suggested Additions

- SDR->HDR 변환 예시를 하나 넣는다: "SDR Rec.709 100-nit master를 PQ 1000-nit 컨테이너로 단순 태깅하면 화면이 의도와 다르게 어둡거나 밝게 보일 수 있다."
- HDR->SDR 변환 예시도 하나 넣는다: "PQ 1000-nit 하이라이트를 SDR 100-nit로 내릴 때 clip, knee compression, highlight desaturation 중 어떤 정책을 쓰는지에 따라 결과가 달라진다."
- QC 체크리스트를 추가한다: `primaries/transfer/matrix/range`, mastering metadata, MaxCLL/MaxFALL, waveform false color, skin tone, banding/noise, SDR fallback.

## Residual Risk

현재 초안만으로도 HDR 개념 소개에는 충분하지만, 실제 변환 장으로 읽히면 "SDR을 더 밝게 늘리고 HDR 메타데이터를 붙이면 된다"는 잘못된 결론을 막기에는 조금 약하다. 변환 실패 모드와 QC 절차를 별도 박스로 추가하면 장 제목과 내용의 기대가 잘 맞을 것이다.
