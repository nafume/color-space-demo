# Review: 2회차 Chapter 10. Scene-referred와 Display-referred

대상 draft: `seminar_chapters/drafts/02_10_scene_display_referred.md`

## 판정

핵심 구분은 잘 잡혀 있다. RAW/log/ACES/OpenEXR 계열의 제작 데이터와 Rec.709/HDR10 같은 표시 전달물을 분리하고, 같은 RGB 값이라도 기준이 다르면 의미가 달라진다는 설명이 명확하다.

보완이 필요한 부분은 HLG와 ACES의 뉘앙스다. HLG를 display-referred 쪽에 놓는 설명은 교육적 분류로는 가능하지만, HLG는 scene-referred/relative signal 성격과 display rendering/OOTF가 결합된 시스템이므로 "HDR10과 같은 의미의 display-referred"로 굳어지지 않게 조심해야 한다. ACES도 모든 ACES 공간을 동일하게 scene-referred라고 말하기보다는 역할별 차이를 약간 열어 두면 좋다.

## 높은 우선순위 수정

- `SDR Rec.709, HDR10, HLG 출력물은 보통 display-referred 결과물`이라는 문장은 HLG에서 단서를 붙이는 편이 좋다. 제안: "Rec.709 SDR과 HDR10 PQ 마스터는 display-referred 전달물로 보기 쉽다. HLG는 방송 전달물로는 표시 렌더링을 전제로 하지만, 신호 자체는 상대/scene-referred 성격과 시스템 OOTF를 포함하므로 PQ HDR10과 같은 방식의 절대 display-referred로 취급하면 안 된다."
- `ACEScg, ACES2065-1, ACEScct 같은 공간은 ... 공통적으로 scene-referred 또는 작업 공간 개념`이라는 설명은 맞지만 압축적이다. ACES2065-1/AP0는 교환용 scene-linear, ACEScg/AP1은 CG/VFX 작업용 scene-linear, ACEScct는 grading 친화적 log-like working space라는 차이를 한 문장으로 넣으면 용어 신뢰도가 올라간다.

## 기술 노트

- `Scene-referred는 장면의 빛을 기준으로 한다`는 설명은 좋다. 다만 카메라 RAW는 완전한 장면 빛 자체라기보다 센서 응답, 카메라 메타데이터, 디모자이크/색변환 전 단계가 포함된 capture-referred 데이터에 가깝다는 단서를 추가하면 더 엄밀하다.
- `tone mapping은 scene과 display 사이의 관계를 정하는 과정`이라는 질문은 좋다. display-referred HDR10에서 SDR로 변환할 때도 tone mapping은 "이미 만들어진 display-referred 결과를 다른 display-referred 조건으로 재매핑"하는 작업이라는 차이를 뒤에서 다시 잡아 주면 좋다.
- `linearize`나 `inverse transfer`가 항상 scene light 복원을 뜻하지는 않는다. PQ inverse는 display luminance 해석이고, log inverse는 카메라 encoding 해석에 가깝다. 이 차이를 한 문장으로 넣으면 다음 실습 장의 오해를 줄인다.
- OpenEXR 예시는 이 장에 잘 맞는다. "색관리 없이 열면 이상해 보인다"는 데모는 실제 청중에게 매우 직관적일 가능성이 높다.

## 용어/스타일 노트

- `장면 기준`, `표시 기준` 번역은 좋다. 단, 첫 정의 후에는 `scene-referred`, `display-referred`를 병기하되 너무 자주 괄호를 반복하지 않아도 된다.
- `output transform`, `tone mapping`, `gamut mapping`, `transfer 적용`의 포함 관계가 장마다 조금씩 다르게 느껴질 수 있다. 이 장에서는 `output transform`을 상위 개념으로 두고, 그 안에 톤/색역/전송 처리가 포함될 수 있다고 고정하면 좋다.
- `룩(look)`은 강의 대상이 영상 후반 작업자라면 자연스럽지만, 일반 개발자 대상이면 "창작적 색/대비 스타일" 정도의 짧은 풀이를 첫 등장에 붙이면 좋다.

## 제안 추가

- 간단한 2x2 표를 제안한다: `RAW/log/OpenEXR/ACES working data`, `Rec.709 master`, `HDR10 PQ master`, `HLG broadcast signal`을 두고 scene/display 성격과 필요한 변환을 비교하면 기억에 잘 남는다.
- "같은 숫자 0.5" 예시를 넣으면 좋다. scene-linear 0.5, log code value 0.5, PQ code value 0.5, sRGB 0.5는 서로 다른 의미라는 식의 예시가 이 장의 목적에 잘 맞는다.
- ACES에서 `IDT -> working space -> Look/grade -> Output Transform` 흐름을 한 줄로 추가하면 11장 파이프라인과 자연스럽게 이어진다.

## 잔여 위험

scene/display-referred 구분은 실제 워크플로에서 중간 단계가 많아 완전히 이분법으로 떨어지지 않는다. 초안은 교육용 분류로 충분하지만, HLG와 tone-mapped intermediate, LUT-baked log 파일 같은 경계 사례를 너무 단정하지 않도록 이후 장에서 "맥락 의존"을 반복하는 것이 좋다.
