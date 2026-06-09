# Review: 00_intro.md

## Overall Assessment

The draft follows the source plan well and correctly avoids the most important framing error: it does not say that color is composed of chromaticity and volume. It consistently presents chromaticity/color-space and brightness/color-volume as two analytical perspectives, which is technically safer and pedagogically clearer.

No Critical issues found.

## Issues

### Important: "이 색은 어떤 색인가?" can blur chromaticity with full color appearance

- Location: `00_intro.md` lines 31, 87, 113
- Why it matters: The phrase is useful as a teaching shorthand, but in this chapter the seminar is deliberately separating chromaticity/color-space questions from brightness/color-volume questions. Saying that 1회차 answers "이 색은 어떤 색인가?" may imply that chromaticity and RGB color-space interpretation fully define the color experience, while luminance, viewing condition, transfer function, and display rendering are deferred to 2회차.
- Suggested correction: Keep the approachable wording, but qualify it. For example: "1회차의 핵심 질문은 '이 색의 색도 위치와 색공간상 의미는 무엇인가?'에 가깝다." In the opening script, consider "이 RGB 값은 어떤 색공간에서 어떤 색도/좌표로 해석되는가?" This preserves the teaching frame without implying that color is exhausted by chromaticity.

### Important: HDR conversion flow may read as a fixed canonical order

- Location: `00_intro.md` lines 76-85
- Why it matters: The flow is reasonable as an introductory simplified pipeline and matches the source plan, but presented as "기본 흐름" it can sound canonical. In practice, tone mapping and gamut mapping are often coupled or ordered differently depending on whether the transform is scene-referred or display-referred, whether the operation is luminance-only or color-volume aware, and what appearance model or creative intent is used. "tone map luminance" may also imply that luminance-only compression is always sufficient, even though highlight roll-off can affect saturation and hue preservation.
- Suggested correction: Introduce the block as "단순화한 예시 흐름" rather than "기본 흐름." Add one sentence such as: "실제 구현에서는 tone mapping과 gamut mapping의 순서나 결합 방식이 달라질 수 있으며, 밝기 압축이 채도와 색상 보존에도 영향을 준다."

### Minor: HDR description could imply metadata and higher bit depth are universal requirements

- Location: `00_intro.md` line 107
- Why it matters: The sentence says HDR involves wider brightness range, higher bit depth, transfer function, metadata, and display conditions. This is broadly useful, but some HDR systems do not depend on static mastering metadata in the same way, and high-bit-depth or scene-referred files can participate in HDR workflows without matching consumer HDR metadata structures.
- Suggested correction: Soften the list from required ingredients to common/related interpretation factors. For example: "HDR은 단순히 더 밝은 이미지가 아니라, 더 넓은 밝기 범위와 transfer function을 중심으로 bit depth, 메타데이터, 표시 조건 등이 함께 해석되는 경우가 많다."

### Minor: "색공간" 요소 list mixes still-image RGB spaces and video signal metadata

- Location: `00_intro.md` line 95
- Why it matters: The source plan intentionally includes `primaries`, `white point`, `transfer characteristics`, `matrix coefficients`, and `range`, so the draft is aligned with the plan. Still, introductory readers may infer that every RGB color space necessarily has matrix coefficients and range in the same sense as video metadata. For still-image/profile-based workflows, ICC profiles and RGB primaries/TRCs are the central interpretation mechanism; matrix coefficients and legal/full range are especially important in YCbCr/video signal handling.
- Suggested correction: Add a small qualifier: "특히 영상 신호에서는 matrix coefficients와 range까지 함께 색값 해석에 관여한다." This keeps the plan's combined file/video framing while preventing overgeneralization.

## Teaching Clarity Notes

- The opening framing is strong: the draft repeatedly says color volume is a reproduction-range concept, not a component of color itself.
- The line distinguishing chromaticity diagrams from brightness reproduction is clear and should remain.
- The draft does not make strong scene-referred/display-referred claims yet, so there is little risk of overreach in this chapter. Residual risk: when later chapters introduce scene-referred workflows, connect them back carefully so "transfer 해석 / linearize" is not mistaken for a complete scene-light reconstruction step in all formats.
