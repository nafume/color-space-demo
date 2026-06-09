# Review: 1회차 Chapter 12. 실습: 색공간 변환

대상 draft: `seminar_chapters/drafts/01_12_practice_color_space_conversion.md`

검토 기준:

- 실습이 실제 도구와 환경에서 재현 가능한지
- assign/convert, clipping/gamut mapping, rendering intent, RGB->CMYK 변환의 관찰 포인트가 정확한지
- 브라우저, ImageMagick, LittleCMS, colour-science 사용 시 알려진 함정

## Verdict

개념 목표는 좋고 실습 후보도 적절하다. "같은 RGB 값이 항상 같은 색이 아니다", "assign과 convert는 다르다", "색역 밖 색은 정책이 필요하다"는 세 문장이 실습 장의 축으로 잘 작동한다.

다만 현재 상태는 "실습 후보 목록"에 가깝고, 그대로 진행하면 환경 차이 때문에 결과가 눈에 잘 안 보일 수 있다. 특히 rendering intent 비교, Browser Canvas, RGB->CMYK 실습은 사용할 프로파일/도구/디스플레이 조건을 더 구체화해야 한다.

## High-Priority Corrections

### Important: rendering intent 비교는 sRGB/P3 matrix 프로파일만으로는 차이가 거의 안 보일 수 있음

- 위치: draft 90-101
- 왜 중요한가: sRGB, Display P3 같은 matrix/TRC RGB 프로파일끼리 변환하면 perceptual/saturation LUT가 없거나 CMM이 사실상 colorimetric 경로로 처리해 rendering intent 차이가 미미할 수 있다. 청중이 "렌더링 의도는 별 차이 없는 옵션"이라고 오해할 위험이 있다.
- 제안: rendering intent 비교는 CMYK 출력 프로파일 또는 out-of-gamut 색이 많은 wide-gamut 이미지와 LUT 기반 출력 프로파일을 사용하도록 명시한다. `relative colorimetric`과 `perceptual`의 차이를 보여줄 샘플 이미지도 미리 고정하는 편이 좋다.

### Important: Browser Canvas 실습은 wide-gamut 디스플레이와 브라우저 지원에 크게 의존함

- 위치: draft 151-155
- 왜 중요한가: CSS Color/Canvas color space 지원 여부, OS 컬러 관리, 모니터 gamut, 스크린샷 경로에 따라 P3/sRGB 차이가 보이지 않거나 잘못 보일 수 있다.
- 제안: 실습 전 체크리스트를 추가한다. 예: P3 지원 디스플레이 여부, 브라우저의 `display-p3` 지원, 색관리된 뷰어 사용 여부, 스크린샷으로 비교하지 않기, 지원이 없을 때는 CIE xy/XYZ 숫자 비교로 대체하기.

## Technical Notes

- 위치: draft 42-53
- sRGB <-> Display P3 변환 관찰 포인트는 좋다. 다만 sRGB 색만 Display P3로 변환하면 색관리된 환경에서는 외관이 거의 유지되고 "차이가 없다"고 느낄 수 있다. P3-only 색 패치와 sRGB 경계 밖 색을 함께 준비해야 한다.
- 위치: draft 61-68
- assign vs convert 설명은 정확하다. ImageMagick에서는 `-profile` 사용 순서가 assign/convert 의미를 바꾸므로, 명령 예시를 넣을 때 "프로파일 없는 이미지에 첫 `-profile`은 assign, 두 번째 `-profile`은 convert" 같은 주의가 필요하다.
- 위치: draft 82-88
- clipping 실습은 가능하지만, 대부분의 ICC 변환 도구는 단순 채널 clipping만 보여주지 않고 CMM의 변환 결과를 낸다. 순수 clipping을 보여주려면 Python/colour-science로 선형 변환 후 RGB 범위를 직접 잘라내는 별도 데모가 더 명확하다.
- 위치: draft 103-114, 197-199
- RGB->CMYK와 total ink coverage 확인은 좋은 실습이다. 단, 코팅/비코팅 CMYK 프로파일을 어디서 얻는지, 라이선스/설치 여부, Photoshop/GIMP/LCMS 중 어떤 도구로 값을 샘플링할지 정해야 재현성이 생긴다.
- 위치: draft 116-120
- gamut warning과 soft proofing은 대개 GUI 편집 도구의 기능이다. ImageMagick/LittleCMS 실습과 같은 흐름에 넣기보다 "Photoshop/Affinity/GIMP 등 색관리 GUI에서 확인"처럼 도구군을 분리하면 좋다.
- 위치: draft 141
- LittleCMS 도구 목록은 적절하다. `transicc`는 주로 색값 변환 확인에 좋고, 파일 변환은 `tificc`/`jpgicc`가 더 직관적이라는 식으로 역할을 나누면 실습성이 올라간다.

## Terminology/Style Notes

- `gamut warning`, `soft proofing`, `paper color`, `black ink`는 GUI 메뉴명과 개념명이 섞인다. 메뉴명은 도구별로 달라질 수 있으므로 개념 설명 뒤에 "도구별 메뉴명은 다를 수 있음"을 붙이면 좋다.
- `Browser Canvas`는 `브라우저 Canvas` 또는 `웹 Canvas`로 통일하면 한국어 문서 흐름이 매끄럽다.
- `total ink coverage`는 Chapter 8의 `total ink limit`과 구분해 설명하는 편이 좋다. 전자는 특정 픽셀/영역의 실제 합계, 후자는 프로파일/인쇄 조건의 허용 최대치로 정리할 수 있다.

## Suggested Additions

- 최소 실습 세트를 정하면 좋다.
  1. 색 패치 PNG/TIFF 1개: sRGB 기본색, P3-only 색, 회색 그라데이션, 피부톤 포함
  2. 프로파일 4개: sRGB, Display P3, 코팅 CMYK, 비코팅 CMYK
  3. 확인 도구 3개: `identify`/`exiftool`로 프로파일 확인, LittleCMS 또는 ImageMagick으로 변환, GUI 앱으로 soft proof/gamut warning
- 각 실습마다 "예상 관찰 결과"를 추가하면 진행자가 실패를 빨리 진단할 수 있다. 예: assign은 숫자 유지/외관 변화, convert는 숫자 변화/색관리 환경에서 외관 유지.
- 렌더링 의도 실습에는 "차이가 안 보이면 실패가 아니라 프로파일/샘플이 차이를 만들지 못한 것일 수 있다"는 트러블슈팅 문장을 넣는 것이 좋다.
- 실습 환경 확인 체크리스트: OS 컬러 관리, 모니터 프로파일, wide-gamut 지원, ICC 프로파일 경로, CMYK 프로파일 라이선스, 사용 앱의 color management 활성화 여부.

## Residual Risk

실습은 환경 의존성이 높다. 특히 wide-gamut 표시와 CMYK 프로파일은 참가자 PC마다 결과가 달라질 수 있다. 세미나용으로는 진행자 환경에서 미리 생성한 결과 이미지와 숫자표를 준비하고, 참가자 실습은 관찰 포인트 중심으로 제한하는 편이 안정적이다.
