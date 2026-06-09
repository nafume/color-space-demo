# Review: 1회차 Chapter 7. 색공간 변환의 기본 원리

대상 draft: `seminar_chapters/drafts/01_07_color_space_conversion_principles.md`

검토 기준:

- ICC v2/v4 PCS는 CIE XYZ 또는 CIE Lab 인코딩이며 D50 기준으로 연결된다는 점
- 선형화, RGB 원색/화이트 포인트, 색순응, 색역 밖 처리의 교육적 정확성
- 변환 순서를 보편 규칙처럼 오해시키지 않는지 여부

## Verdict

큰 기술 오류는 없다. 초안은 "RGB 숫자 직접 치환"이 아니라 "색 의미 해석 후 재표현"이라는 핵심을 잘 잡고 있으며, 선형화, XYZ, 화이트 포인트, 색순응, 클리핑/색역 매핑의 역할을 입문 장 수준에서 안전하게 설명한다.

다만 몇몇 표현은 실제 ICC/CMM 구현에서 단계가 프로파일 LUT 안에 흡수될 수 있다는 점을 조금 더 명확히 하면 좋다. 현재도 "교육용 기본형"이라고 단서를 달고 있어 심각한 문제는 아니다.

## High-Priority Corrections

없음. 필수 수정이 필요한 중대한 기술 오류는 확인되지 않았다.

## Technical Notes

- 위치: draft 32-43, 156-158
- 기본 파이프라인은 교육용으로 적절하다. 다만 ICC LUT 기반 변환에서는 `inverse transfer -> matrix -> chromatic adaptation`이 사용자가 볼 수 있는 독립 단계로 드러나지 않을 수 있다. 특히 입력/출력 프로파일의 `A2B`/`B2A` LUT나 device link profile은 PCS 연결 또는 색역 매핑을 내부적으로 고정할 수 있다.
- 위치: draft 68-73, 146-148
- D65 RGB에서 D50 PCS로 갈 때 색순응 변환을 언급한 점은 정확하다. 단, 모든 D50 기반 인쇄 프로파일 변환에서 사용자가 별도로 Bradford 변환을 수행한다는 뜻은 아니며, 프로파일 제작 과정 또는 CMM의 PCS 연결 과정에 포함될 수 있다는 단서를 추가하면 더 안전하다.
- 위치: draft 86
- "sRGB의 opto-electronic 성격을 가진 인코딩 곡선"은 교육적으로 무난하지만, 영상 표준의 엄밀한 OETF/EOTF 용어와 혼동될 수 있다. 정지 이미지 문맥에서는 "sRGB 인코딩 전송 곡선" 정도로 부르면 더 넓게 통한다.
- 위치: draft 98-100
- 클리핑과 색역 매핑의 대비는 좋다. 렌더링 의도와 연결할 때는 relative colorimetric이 보통 색역 밖 색을 경계 쪽으로 보내는 반면, perceptual은 색역 안 색까지 함께 재배치할 수 있다는 점을 한 문장 더 넣으면 Chapter 9와 더 잘 이어진다.

## Terminology/Style Notes

- `색 의미`, `측색적 색`, `색의 의미`가 모두 쓰인다. 모두 이해 가능하지만, 강의 키워드는 `측색적 의미(colorimetric meaning)` 또는 `측색적 색(colorimetric color)` 중 하나로 고정하면 좋다.
- `Target RGB`, `target linear RGB`, `target transfer`처럼 영어/소문자 스타일이 섞인다. 도식 안에서는 영어를 유지하되 본문에서는 `대상 RGB`, `대상 선형 RGB`, `대상 전송 함수`로 통일하면 읽기 쉽다.
- `색역 밖(out of gamut)` 표현을 Chapter 7에서 한 번 도입하면 이후 장의 gamut warning, rendering intent 설명과 연결이 더 부드럽다.

## Suggested Additions

- "실제 변환 순서는 프로파일 종류, CMM, 애플리케이션 설정, HDR/영상 파이프라인에 따라 달라진다"는 현재 단서를 유지하되, 예시로 `matrix/TRC RGB 프로파일`, `LUT 출력 프로파일`, `device link profile`을 한 줄씩 나눠 보여주면 학습자가 어디까지가 기본형인지 더 잘 구분한다.
- 색역 밖 예시에 작은 표를 추가하면 좋다. 예: `Display P3 red -> sRGB`에서 계산 결과가 음수/1 초과 채널을 만들 수 있고, 이때 clipping과 perceptual mapping의 목표가 다르다는 식이다.
- 색순응 변환은 "예쁘게 보정"이 아니라 "기준 백색의 측색 연결"이라는 문장이 좋다. 여기에 "사용자 작업으로 노출되지 않을 수 있음"을 덧붙이면 실무 혼동을 줄일 수 있다.

## Residual Risk

수식과 실제 행렬 값을 생략한 직관 중심 장이므로, 청중이 "XYZ를 거치면 항상 색이 보존된다"라고 받아들일 수 있다. 다음 장들에서 대상 색역, 렌더링 의도, CMM/프로파일 LUT가 결과를 바꾼다는 점을 반복해 주면 이 위험은 작다.
