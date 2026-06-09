# Review: 1회차 Chapter 5. CIE xy 색도도로 색공간 읽기

대상 draft: `seminar_chapters/drafts/01_05_read_color_spaces_with_cie_xy.md`

## Verdict

큰 기술 오류는 발견되지 않았다. CIE xy를 색공간 표준을 읽는 도구로 설명하는 목적에 잘 맞고, spectral locus, 보라선(line of purples), 비분광색(non-spectral colors), 원색/화이트 포인트/색역 삼각형, sRGB와 Rec.709의 차이를 균형 있게 다룬다.

## High-Priority Corrections

없음.

## Technical Notes

- spectral locus를 단색광(monochromatic light)의 색도 경계로 설명한 것은 정확하다. "특정 파장 하나에 가까운 빛"이라는 표현도 실제 광원의 유한 대역폭을 생각하면 교육적으로 안전하다.
- 보라선(line of purples)이 spectral locus의 짧은 파장 끝과 긴 파장 끝을 잇는 직선이며, 그 위의 보라/자홍 계열이 단일 파장으로 나타나는 스펙트럼 색이 아니라는 설명이 좋다. 이 장의 핵심 함정을 잘 피한다.
- "스펙트럼을 순서대로 펼치면 빨강에서 보라로 이어지는 물리적 파장 순서는 있지만"이라는 문장은 약간 조심스럽다. 가시 스펙트럼의 짧은 파장 끝은 보라/violet, 긴 파장 끝은 빨강/red이지만, 자홍/magenta는 그 사이의 단일 파장 순서에 존재하지 않는다는 식으로 바꾸면 더 명확하다.
- RGB 원색을 이은 삼각형 내부가 양수 조합으로 만들 수 있는 색도 범위라는 설명은 맞다. 단, 이는 선형 RGB 값이 0 이상이고 같은 white point/normalization 안에서 혼합된다는 전제 위의 색도 범위라는 점을 짧게 덧붙이면 좋다.
- sRGB와 Rec.709의 xy 색역은 같지만 전체 표준은 같지 않다는 설명이 정확하다. transfer, matrix, range를 확인해야 한다는 문장은 다음 Chapter 6과 잘 연결된다.
- Rec.2020이 매우 넓은 색역을 정의하지만 실제 디스플레이가 전체를 재현하기 어렵고, xy 2D 색역과 컬러 볼륨은 별도라는 설명도 기술적으로 안전하다.

## Terminology/Style Notes

- `spectral locus`는 `스펙트럼 궤적(spectral locus)`으로, `line of purples`는 `보라선(line of purples)`으로 잘 통일되어 있다.
- `비분광색(non-spectral colors)`은 자홍만이 아니라 보라선 위의 여러 purple/magenta 계열을 포함한다는 식으로 표현하면 특정 색명 하나에 갇히지 않는다.
- `brightness`와 `luminance`가 모두 한계 설명에 나오는데, 이 장에서는 "CIE xy는 휘도 `Y` 또는 실제 밝기 재현 능력을 보여주지 않는다"처럼 `Y`와 연결해 주면 Chapter 3과의 일관성이 더 좋아진다.

## Suggested Additions

- 색역 삼각형 설명에 "삼각형 밖의 색도는 해당 RGB 색공간에서 클리핑 또는 색역 매핑 없이는 표현할 수 없다"는 문장을 넣으면 실무 예시 3과 연결이 좋아진다.
- 화이트 포인트 섹션에 "화이트 포인트는 삼각형 내부의 한 점이며, 보통 `R=G=B` 중립축이 향하는 색도"라는 설명을 넣으면 원색과 흰색 기준의 관계가 더 선명해진다.
- Rec.709/sRGB 비교에서 "같은 primaries와 white point를 공유하지만 OETF/EOTF, 사용 맥락, 영상 메타데이터 해석이 다르다"는 식으로 Chapter 6의 용어를 미리 예고하면 좋다.

## Residual Risk

xy 색도도 그림은 시각적으로 강력해서 청중이 2D 삼각형 면적을 곧바로 "색공간의 전체 성능"으로 받아들일 위험이 있다. 초안이 이미 컬러 볼륨을 언급하므로, 마무리 슬라이드에서 "xy gamut은 색도 범위, color volume은 밝기까지 포함한 재현 범위"를 대비시키면 남은 오해가 줄어든다.
