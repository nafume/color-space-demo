# Review: 1회차 Chapter 9. ICC Profile 기반 변환

대상 draft: `seminar_chapters/drafts/01_09_icc_profile_conversion.md`

검토 기준:

- ICC PCS가 CIE XYZ 또는 CIE Lab일 수 있고 v2/v4에서는 D50 기준으로 연결된다는 점
- rendering intent가 단순 clipping 옵션이 아니라 변환/색역 매핑 정책이라는 점
- profile connection space와 device link profile의 차이

## Verdict

큰 기술 오류는 없다. PCS가 항상 Lab이 아니라 CIE XYZ 또는 CIE Lab일 수 있음을 명확히 한 점, v2/v4의 D50 PCS를 별도 섹션으로 둔 점, assign과 convert를 초반에 구분한 점이 좋다.

보완하면 좋은 부분은 두 가지다. 첫째, rendering intent를 "색역 밖 색 처리"로만 좁히면 perceptual/saturation이 색역 안 색까지 재배치할 수 있다는 점이 흐려진다. 둘째, 일반 source/destination profile 연결과 device link profile의 예외를 짧게라도 언급하면 Chapter 10과 더 단단히 이어진다.

## High-Priority Corrections

없음. 개념상 필수 수정이 필요한 오류는 발견되지 않았다.

## Technical Notes

- 위치: draft 35-40, 53-67
- "보통 두 프로파일이 필요하다"와 PCS 연결 도식은 정확한 기본형이다. 다만 device link profile은 특정 소스-목적지 변환을 하나의 프로파일로 고정하며, 일반적인 PCS 연결형 프로파일과 성격이 다르다는 예외를 한 문장 추가하면 좋다.
- 위치: draft 67, 71-75, 114
- ICC PCS가 `XYZ` 또는 `Lab`일 수 있고 v2/v4에서 D50 기준이라는 설명은 정확하다. v5/iccMAX까지 다룰 계획이라면 "iccMAX(v5, ICC.2/ISO 20677)는 D50 고정 PCS를 확장해 custom PCS나 spectral PCS를 지원할 수 있다"는 주석을 별도로 두는 것이 좋다.
- 위치: draft 81-88
- rendering intent 설명은 전반적으로 좋지만, "색역 밖 색을 다루는 정책"만으로 정의하면 약간 좁다. ICC 관점에서는 색 재현 매핑의 의도이며, perceptual/saturation은 색역 차이, 매체, viewing condition 차이를 반영하면서 색역 안 색도 바꿀 수 있다.
- 위치: draft 83
- relative colorimetric의 "색역 밖 색은 경계로 이동"은 교육용으로 무난하지만, ICC 표준이 구체적인 out-of-gamut mapping 알고리즘 자체를 지정한다고 읽히지 않게 "대개/보통" 또는 "CMM/프로파일 구현에 따라"라는 단서를 붙이면 더 정확하다.
- 위치: draft 92-96
- 모니터 프로파일과 인쇄 프로파일의 역할 구분이 좋다. "모니터 프로파일은 이미지 작업 공간이 아니라 현재 표시 장치의 특성"이라는 문장을 유지하면 실무 혼동을 크게 줄인다.

## Terminology/Style Notes

- `상대 색도(relative colorimetric)`는 한국어 색채 분야에서 `상대 색도`, `매체 상대 색도`, `상대 색도계` 등으로 번역이 갈린다. ICC 문맥을 강조하려면 `매체 상대 색도(media-relative colorimetric)`라고 한 번 병기하면 Chapter 10의 헤더 값 설명과 연결된다.
- `절대 색도(absolute colorimetric)`도 ICC 공식 용어에 맞춰 첫 등장 시 `ICC-absolute colorimetric`을 병기하면 좋다.
- `프로파일은 라벨이면서 동시에 변환의 기준`이라는 문장은 좋지만, "라벨"만 강조하면 assign만 떠올릴 수 있다. "라벨이자 변환 테이블/모델"처럼 보완하면 정확하다.

## Suggested Additions

- device link profile 짧은 박스: "일반 프로파일은 장치 <-> PCS를 정의하지만, device link profile은 source <-> destination 변환을 직접 담아 K 보존, total ink limit, 특정 렌더링 의도를 고정할 수 있다."
- rendering intent 예시 표에 "in-gamut 색 영향" 열을 추가하면 좋다. relative colorimetric은 색역 안 색 보존을 목표로 하고, perceptual/saturation은 전체 관계를 위해 색역 안 색도 바꿀 수 있음을 보여준다.
- v2/v4/v5 비교 주석: v2는 구현 해석 차이가 컸고, v4는 PCS/렌더링 모델을 더 명확히 했으며, iccMAX(v5)는 spectral/custom PCS 등 확장 시나리오를 다룬다는 정도면 충분하다.

## Residual Risk

입문 장으로서 수식과 태그 세부를 의도적으로 줄였기 때문에, "PCS를 거치면 모든 변환이 같은 결과"라고 오해할 수 있다. 프로파일 제작 방식, CMM, rendering intent, black point compensation, device link 여부가 결과에 영향을 준다는 점을 실습 장에서 확인시키면 이 위험은 줄어든다.
