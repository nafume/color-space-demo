# Review: 1회차 Chapter 4. CIE xy 색도도에서 CIE Lab까지

대상 draft: `seminar_chapters/drafts/01_04_cie_xy_to_cielab.md`

## Verdict

큰 기술 오류는 발견되지 않았다. CIE xy의 유용성과 한계, 휘도(luminance)/명도(lightness)/밝기(brightness) 구분, CIE Lab의 기준 흰색 의존성, Delta E의 한계를 균형 있게 설명한다.

## High-Priority Corrections

없음.

## Technical Notes

- CIE Lab이 XYZ와 기준 흰색(reference white)을 바탕으로 계산된다는 설명이 정확하다. 특히 같은 XYZ라도 기준 흰색이 달라지면 Lab 값이 달라질 수 있다는 문장은 반드시 유지해야 한다.
- `L*`가 `Y`와 같은 값이 아니라 `Y/Yn`을 비선형 변환한 명도 축이라는 설명이 좋다. 가능하면 `L* = 116 f(Y/Yn) - 16` 형태를 간단히 보여주면 "같지 않다"는 메시지가 더 선명해진다.
- ICC 프로파일 워크플로 설명은 방향이 맞다. 다만 PCS(Profile Connection Space)는 CIE XYZ 또는 CIE Lab을 사용할 수 있고, ICC 색관리에서는 D50 PCS/PCS adopted white가 핵심이라는 점을 조금 더 명시하면 좋다.
- "D65 기반 RGB 색공간에서 온 색을 다룰 때 화이트 포인트 적응이 함께 등장한다"는 설명은 정확하다. 단, 모든 변환에서 사용자가 직접 적응을 수행한다기보다 CMM(color management module)이나 프로파일 변환 과정에 포함되는 경우가 많다고 덧붙이면 실무 감각이 좋아진다.
- Delta E 설명은 교육 목적에 적절하다. CIE76은 가장 단순하지만 Lab의 비균일성이 남아 있어 CIEDE2000 같은 공식이 필요한 흐름도 잘 잡고 있다.
- CIE Lab은 지각적으로 더 균일한 색공간이지만 완전한 색외관 모델(color appearance model)은 아니다. 주변 조건, 순응, HDR 장면의 밝기 지각까지 설명하려면 CIECAM 계열이나 다른 모델이 필요할 수 있다는 단서를 residual risk에 남기면 좋다.

## Terminology/Style Notes

- `Delta E(Delta E)`는 반복 표기처럼 보인다. `Delta E(색차, ΔE)` 또는 `Delta E(Delta E, ΔE*)`처럼 한 번만 정리하면 더 자연스럽다.
- `perceptually uniform color space`는 `지각적으로 균일한 색공간`으로 잘 옮겨져 있다. 다만 "균일한"이 절대적 보장처럼 들리지 않도록 "더 균일한", "근사적으로 더 적합한"이라는 표현을 유지하면 좋다.
- `brightness`를 `밝기`, `lightness`를 `명도`, `luminance`를 `휘도`로 나눈 용어 체계가 안정적이다. 이후 장에서도 이 대응을 흔들지 않는 것이 중요하다.

## Suggested Additions

- CIE xy의 거리 왜곡을 설명할 때 MacAdam ellipse를 이름만 언급하면 "xy에서 같은 거리라도 지각 차이가 다르다"는 메시지가 시각적으로 강해진다.
- Lab 변환 설명 뒤에 "Lab 값은 반드시 기준 흰색과 관찰 조건 또는 프로파일 맥락과 함께 해석해야 한다"는 경고문을 넣으면 실무 오해를 줄일 수 있다.
- Delta E 값의 임계값은 산업, 재료, 관찰 조건마다 달라진다는 설명이 이미 있으므로, 예시를 넣는다면 "인쇄/디스플레이 QC에서는 허용 기준을 별도로 정한다" 정도로만 제한하는 편이 안전하다.

## Residual Risk

청중이 Lab을 "사람이 보는 색을 완벽하게 예측하는 공간"으로 과대해석할 위험이 남아 있다. CIE Lab은 색차와 비교에 유용한 근사적 도구이며, white point와 관찰 조건에 의존한다는 점을 마무리에서 한 번 더 강조하면 좋다.
