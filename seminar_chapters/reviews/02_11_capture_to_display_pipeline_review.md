# Review: 2회차 Chapter 11. 촬영부터 디스플레이까지의 파이프라인

대상 draft: `seminar_chapters/drafts/02_11_capture_to_display_pipeline.md`

## 판정

파이프라인 관점의 연결성이 좋고, 앞 장들의 용어를 하나의 흐름으로 묶는 역할을 잘 한다. `Scene light -> Camera sensor -> raw/log -> working space -> grading -> output transform -> encoding + metadata -> playback -> display rendering -> viewer perception` 구조는 강의용으로 명확하다.

큰 오류는 없지만, 실제 파이프라인은 항상 선형 순서로 한 번만 지나가지 않으므로 "단순화한 흐름"임을 반복하는 것이 좋다. 특히 모니터링 LUT, color management, output transform, display tone mapping이 중복 적용될 수 있는 위험을 실무 노트로 추가하면 장의 완성도가 올라간다.

## 높은 우선순위 수정

없음. 다만 다음 두 문장은 보완 권장이다.

- `raw/log는 보통 scene-referred 또는 제작 중간 데이터`는 맞지만 RAW는 센서/capture-referred 성격도 있으므로 "장면 기준으로 해석될 여지를 가진 capture/scene-referred 제작 데이터"처럼 다듬으면 더 안전하다.
- `HDR10이라면 ... mastering display metadata, MaxCLL/MaxFALL 같은 정보가 중요하다`는 맞다. 단, 실제 파일에는 없거나 틀릴 수 있으므로 "존재와 정확성을 확인해야 한다"는 표현을 넣으면 좋다.

## 기술 노트

- `output transform`을 matrix 변환이 아니라 tone/gamut/transfer/range까지 포함할 수 있는 단계로 설명한 점이 매우 좋다.
- `Encoding, Metadata, Playback`에서 YCbCr 변환, chroma subsampling, bit depth, range를 언급한 것은 중요하다. 여기에 "컨테이너 태그와 코덱/비트스트림 태그가 다를 수 있다"를 추가하면 실무 오류 대응력이 커진다.
- `Display EOTF and tone mapping`이라는 단계는 정확하지만, HDR TV의 tone mapping은 콘텐츠가 이미 display-referred HDR10이어도 실제 display capability에 맞춰 다시 일어날 수 있다는 점을 한 문장으로 강조하면 좋다.
- `Viewing environment`를 마지막에 둔 것은 교육적으로 훌륭하다. HDR/SDR 표준은 단순 파일 규칙이 아니라 기준 시청 환경과도 연결된다는 메시지가 잘 살아난다.
- OS/browser/player 색관리를 언급한 점이 좋다. 특히 macOS/iOS/Windows/브라우저에서 HDR still/video 지원 경로가 다르므로 데모 전 사전 검증이 필요하다.

## 용어/스타일 노트

- `raw`와 `RAW`가 섞일 수 있다. 일반 명사로는 `RAW`, 형용사처럼 쓸 때는 `raw/log` 중 하나로 통일하면 좋다.
- `metadata를 기록하면 모든 디스플레이에서 같은 화면이 보장되는가?`라는 질문은 아주 좋다. 답변 쪽에서 "같은 화면을 보장"이 아니라 "올바른 해석과 적응을 위한 힌트"라고 반복하면 메시지가 강해진다.
- `reference display`와 `consumer display`를 구분하는 용어를 추가하면 mastering metadata와 실제 표시 능력의 차이를 설명하기 쉬워진다.

## 제안 추가

- 파이프라인 다이어그램에 `Monitoring path`를 별도 가지로 추가하는 것을 추천한다. 작업자는 grading 중 최종 출력에 가까운 모습을 reference display/LUT로 보지만, 실제 저장 데이터는 working space에 남아 있을 수 있다.
- 실패 사례를 하나 넣으면 좋다: `PQ 영상이 metadata 없이 업로드됨 -> 플랫폼이 SDR/잘못된 transfer로 해석 -> 어둡거나 washed-out`, 또는 `P3 이미지를 sRGB로 태그 -> 색이 과포화/저채도`.
- `metadata는 목적지 표시를 직접 강제하지 않는다`는 문장을 추가하면 mastering display metadata와 실제 display capability를 혼동하는 위험이 줄어든다.

## 잔여 위험

실제 도구별 파이프라인은 Resolve, ffmpeg, 브라우저, OS 색관리, GPU 출력 설정에 따라 크게 달라진다. 이 장은 개념 지도 역할로 충분하지만, 실습에서는 특정 도구의 자동 색관리와 수동 필터 설정이 충돌하지 않도록 환경을 고정해야 한다.
