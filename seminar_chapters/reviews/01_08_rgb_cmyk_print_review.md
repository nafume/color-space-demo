# Review: 1회차 Chapter 8. RGB와 CMYK: 디스플레이 색과 인쇄 색의 차이

대상 draft: `seminar_chapters/drafts/01_08_rgb_cmyk_print.md`

검토 기준:

- CMYK가 RGB의 단순 inverse가 아니라 특정 인쇄 조건의 장치 의존 인코딩이라는 점
- black generation, GCR/UCR, total ink limit, rich black/registration black 설명의 정확성
- 소프트 프루핑과 인쇄용 ICC 프로파일의 역할

## Verdict

큰 기술 오류는 없다. 초안은 RGB/CMYK를 "화면용/인쇄용" 암기에서 벗어나 물리 매체, 인쇄 조건, 잉크 제약, ICC 프로파일로 연결한다. 특히 CMYK가 `C=1-R` 같은 단순 반전이 아니라는 설명과 GCR/UCR, total ink limit, registration black 경고는 실무적으로 유용하다.

## High-Priority Corrections

없음. 다만 실습이나 실제 인쇄 지침으로 쓰일 가능성이 있다면 rich black 예시는 "프로파일/인쇄소별 확인 필요"라는 단서를 현재보다 더 앞에 배치하는 편이 안전하다.

## Technical Notes

- 위치: draft 48-56
- CMY 감산혼합 설명은 입문용으로 적절하다. 실제 오프셋/잉크젯 인쇄는 이상적 필터의 중첩이 아니라 잉크 스펙트럼, 용지, 하프톤, dot gain, 건조 상태가 얽힌 재현 시스템이라는 점을 이미 뒤에서 보완하고 있어 안전하다.
- 위치: draft 60-68
- CMYK가 RGB inverse가 아니라는 세 가지 이유가 정확하다. 여기에 "같은 Lab/XYZ 색을 여러 CMYK 조합으로 만들 수 있다"는 문장을 넣으면 black generation과 바로 이어져 더 선명하다.
- 위치: draft 96-100
- UCR/GCR 설명은 대체로 맞다. UCR은 주로 어두운 중성/그림자 영역의 CMY를 줄이는 방식, GCR은 더 넓은 색 영역에서 CMY가 이루는 gray component를 K로 대체하는 방식으로 구분한 점이 좋다. "중성 성분"이 꼭 완전한 무채색만 뜻하는 것은 아니라는 보충이 있으면 더 정확하다.
- 위치: draft 104-108, 174-180
- rich black 예시 `C 40 M 30 Y 30 K 100`은 총잉크량 200%라 교육용으로 무난하지만, 실제 권장값처럼 보이지 않도록 "예시값" 단서를 코드 블록 앞에도 붙이면 좋다. 작은 텍스트는 K 단색을 권장한 점은 매우 중요하다.
- 위치: draft 118-120
- soft proofing 설명은 정확하다. 가능하면 모니터 캘리브레이션과 하드 프루프의 차이를 한 문장 추가하면 "화면에서 본 대로 반드시 인쇄된다"는 오해를 줄일 수 있다.

## Terminology/Style Notes

- `print profile`, `print ICC profile`, `인쇄용 ICC 프로파일`이 섞인다. 문서 전체에서는 `인쇄용 ICC 프로파일(print ICC profile)`로 첫 등장 후 한국어 중심으로 통일하면 좋다.
- `total ink limit`과 `total ink coverage`는 같은 맥락으로 쓰일 수 있지만, 이 장에서는 `총잉크량 제한(total ink limit)`으로 고정하는 편이 명확하다.
- `registration black`은 "C/M/Y/K 100% 검정"보다 "모든 분판에 출력되는 등록용 색상"이라는 성격을 먼저 말하면 layout 앱의 `[Registration]` swatch와 연결하기 쉽다.

## Suggested Additions

- "CMYK 값은 출력 의도(output condition)와 함께 의미를 갖는다"는 메시지를 초반 요약에 추가하면 ICC 프로파일 장과 연결이 강해진다.
- black generation 예시에 같은 어두운 회색을 `CMY 중심`과 `K 중심`으로 만드는 간단한 비교를 넣으면 GCR/UCR의 필요성이 더 직관적으로 보인다.
- 인쇄 색 평가 조건으로 D50 조명뿐 아니라 주변 조명/광택/형광증백제(OBA)가 결과를 바꿀 수 있다는 간단한 주석을 넣으면 고급 질문에 대비할 수 있다.

## Residual Risk

인쇄 분야는 장비와 현장 조건의 편차가 크다. 초안이 개념 설명으로는 충분하지만, 실제 납품 지침으로 쓰이면 인쇄소의 PDF/X 조건, 출력 프로파일, total ink limit, rich black 권장값을 별도로 확인해야 한다.
