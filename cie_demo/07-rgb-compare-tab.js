// --------------------------------------------------------
// 8.4 RGB Color Space Compare 탭
// --------------------------------------------------------
const rgbCompareUI = {
    mainMeta: document.getElementById('rgb-compare-main-meta'),
    note: document.getElementById('rgb-compare-note'),
    cardGrid: document.getElementById('rgb-compare-card-grid'),
    codeValue: document.getElementById('rgb-compare-code-value'),
    r: document.getElementById('rgb-compare-r'),
    g: document.getElementById('rgb-compare-g'),
    b: document.getElementById('rgb-compare-b'),
    rValue: document.getElementById('rgb-compare-r-value'),
    gValue: document.getElementById('rgb-compare-g-value'),
    bValue: document.getElementById('rgb-compare-b-value'),
    pipelineCode: document.getElementById('rgb-pipeline-code'),
    pipelineTerminalCode: document.getElementById('rgb-pipeline-terminal-code'),
    spaceToggles: Array.from(document.querySelectorAll('.rgb-compare-space-toggle'))
};

const RGB_COMPARE_D50_TO_D65 = [
    [0.9555766, -0.0230393, 0.0631636],
    [-0.0282895, 1.0099416, 0.0210077],
    [0.0122982, -0.0204830, 1.3299098]
];

const rgbCompareSpaces = [
    {
        key: 'srgb',
        label: 'sRGB',
        group: 'RGB / SDR',
        cssSpace: 'srgb',
        note: 'sRGB primaries + sRGB transfer. rgb()와 #hex의 기본 해석입니다.',
        toXYZ: sRGB_to_XYZ
    },
    {
        key: 'srgb-linear',
        label: 'sRGB Linear',
        group: 'RGB / SDR',
        cssSpace: 'srgb-linear',
        note: 'sRGB primaries를 쓰되 코드값을 이미 선형광으로 해석합니다.',
        toXYZ: (r, g, b) => {
            const xyz = linearSrgbToXYZ(r, g, b);
            return { X: xyz.X * 100, Y: xyz.Y * 100, Z: xyz.Z * 100, lr: r, lg: g, lb: b };
        }
    },
    {
        key: 'display-p3',
        label: 'Display P3',
        group: 'RGB / SDR',
        cssSpace: 'display-p3',
        note: 'DCI-P3 계열 primaries + D65 white + sRGB transfer 조합입니다.',
        toXYZ: DisplayP3_to_XYZ
    },
    {
        key: 'display-p3-linear',
        label: 'Display P3 Linear',
        group: 'RGB / SDR',
        cssSpace: 'display-p3-linear',
        note: 'Display P3 primaries를 쓰되 코드값을 선형광으로 해석합니다.',
        toXYZ: (r, g, b) => ({
            X: (r * 0.4865709 + g * 0.2656677 + b * 0.1982173) * 100,
            Y: (r * 0.2289746 + g * 0.6917385 + b * 0.0792869) * 100,
            Z: (r * 0.0000000 + g * 0.0451134 + b * 1.0439444) * 100,
            lr: r,
            lg: g,
            lb: b
        })
    },
    {
        key: 'a98-rgb',
        label: 'Adobe RGB (1998)',
        group: 'RGB / SDR',
        cssSpace: 'a98-rgb',
        note: '사진/인쇄 편집에서 쓰이는 넓은 녹색-청록 영역의 RGB 표준입니다.',
        toXYZ: (r, g, b) => {
            const gamma = 563 / 256;
            const lr = Math.pow(r, gamma);
            const lg = Math.pow(g, gamma);
            const lb = Math.pow(b, gamma);
            return {
                X: (lr * 0.5767309 + lg * 0.1855540 + lb * 0.1881852) * 100,
                Y: (lr * 0.2973769 + lg * 0.6273491 + lb * 0.0752741) * 100,
                Z: (lr * 0.0270343 + lg * 0.0706872 + lb * 0.9911085) * 100,
                lr,
                lg,
                lb
            };
        }
    },
    {
        key: 'prophoto-rgb',
        label: 'ProPhoto RGB',
        group: 'RGB / SDR',
        cssSpace: 'prophoto-rgb',
        note: 'D50 white 기반의 매우 넓은 사진 작업용 RGB. 수치는 D65 XYZ로 적응해 표시합니다.',
        toXYZ: (r, g, b) => {
            const decode = (v) => v <= 16 / 512 ? v / 16 : Math.pow(v, 1.8);
            const lr = decode(r);
            const lg = decode(g);
            const lb = decode(b);
            const d50X = (lr * 0.7976749 + lg * 0.1351917 + lb * 0.0313534) * 100;
            const d50Y = (lr * 0.2880402 + lg * 0.7118741 + lb * 0.0000857) * 100;
            const d50Z = (lr * 0.0000000 + lg * 0.0000000 + lb * 0.8252100) * 100;
            const d65 = mat3MulVec3(RGB_COMPARE_D50_TO_D65, [d50X, d50Y, d50Z]);
            return { X: d65[0], Y: d65[1], Z: d65[2], lr, lg, lb };
        }
    },
    {
        key: 'rec2020',
        label: 'Rec.2020',
        group: 'RGB / SDR',
        cssSpace: 'rec2020',
        note: 'BT.2020 primaries + BT.2020 SDR transfer. 매우 넓은 RGB 컨테이너입니다.',
        toXYZ: Rec2020_to_XYZ
    },
    {
        key: 'rec2100-pq',
        label: 'Rec.2100 PQ',
        group: 'HDR / Draft',
        cssSpace: null,
        note: 'BT.2020 primaries + PQ(ST 2084). 같은 코드값이 절대 nits 신호에 가깝게 해석됩니다.',
        toXYZ: PQ_to_XYZ
    },
    {
        key: 'rec2100-hlg',
        label: 'Rec.2100 HLG',
        group: 'HDR / Draft',
        cssSpace: null,
        note: 'BT.2020 primaries + HLG. 방송 호환성을 고려한 상대적 HDR 신호입니다.',
        toXYZ: HLG_to_XYZ
    }
];

function formatRgbCompareNumber(value, digits = 4) {
    if (!Number.isFinite(value)) return '-';
    return value.toFixed(digits).replace(/\.?0+$/, '');
}

function normalizedRgbCompareValues() {
    return [
        Number(rgbCompareUI.r.value) / 255,
        Number(rgbCompareUI.g.value) / 255,
        Number(rgbCompareUI.b.value) / 255
    ];
}

function rgbCompareCssChannel(value) {
    return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function rgbCompareCssColor(space, values) {
    if (!space.cssSpace) return null;
    const cssColor = `color(${space.cssSpace} ${values.map(rgbCompareCssChannel).join(' ')})`;
    return CSS.supports?.('color', cssColor) ? cssColor : null;
}

function rgbComparePreviewFromXYZ(xyz) {
    const normalizedX = xyz.X / 100;
    const normalizedY = xyz.Y / 100;
    const normalizedZ = xyz.Z / 100;
    const linear = xyzToLinearSrgb(normalizedX, normalizedY, normalizedZ);
    const color = linearToDisplaySrgbColor(linear.r, linear.g, linear.b);
    return {
        css: `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`,
        clipped: !isInsideLinearSrgbGamut(linear.r, linear.g, linear.b)
    };
}

function rgbCompareCreateCard(space, values) {
    const xyz = space.toXYZ(values[0], values[1], values[2]);
    const sum = xyz.X + xyz.Y + xyz.Z;
    const chromaX = sum > 1e-9 ? xyz.X / sum : 0;
    const chromaY = sum > 1e-9 ? xyz.Y / sum : 0;
    const cssColor = rgbCompareCssColor(space, values);
    const preview = rgbComparePreviewFromXYZ(xyz);
    const displayCss = cssColor || preview.css;
    const displayNote = cssColor
        ? '브라우저 color() 표시'
        : preview.clipped ? 'SDR sRGB 프리뷰 · 클리핑' : 'SDR sRGB 프리뷰';
    const cssCode = cssColor || `${space.label}: RGB(${values.map(v => Math.round(v * 255)).join(', ')}) → SDR preview`;

    const card = document.createElement('div');
    card.className = 'rgb-compare-card';
    card.innerHTML = `
        <div class="rgb-compare-swatch"></div>
        <div class="rgb-compare-card-body">
            <div class="rgb-compare-title-row">
                <div class="rgb-compare-title"></div>
                <div class="rgb-compare-badge"></div>
            </div>
            <div class="rgb-compare-metrics">
                <div class="rgb-compare-xyz"></div>
                <div class="rgb-compare-xy"></div>
                <div class="rgb-compare-linear"></div>
                <div class="rgb-compare-note-text"></div>
            </div>
            <div class="rgb-compare-css-code"></div>
        </div>
    `;
    card.querySelector('.rgb-compare-swatch').style.background = displayCss;
    card.querySelector('.rgb-compare-title').textContent = space.label;
    card.querySelector('.rgb-compare-badge').textContent = space.group;
    card.querySelector('.rgb-compare-xyz').textContent =
        `XYZ = ${formatRgbCompareNumber(xyz.X, 2)}, ${formatRgbCompareNumber(xyz.Y, 2)}, ${formatRgbCompareNumber(xyz.Z, 2)}`;
    card.querySelector('.rgb-compare-xy').textContent =
        `xy = ${formatRgbCompareNumber(chromaX, 4)}, ${formatRgbCompareNumber(chromaY, 4)} · Y=${formatRgbCompareNumber(xyz.Y, 2)} nits`;
    card.querySelector('.rgb-compare-linear').textContent =
        `linear RGB = ${formatRgbCompareNumber(xyz.lr, 4)}, ${formatRgbCompareNumber(xyz.lg, 4)}, ${formatRgbCompareNumber(xyz.lb, 4)}`;
    card.querySelector('.rgb-compare-note-text').textContent = `${displayNote} · ${space.note}`;
    card.querySelector('.rgb-compare-css-code').textContent = cssCode;
    return card;
}

function renderRgbCompare() {
    if (!rgbCompareUI.cardGrid) return;
    const rgb8 = [
        Number(rgbCompareUI.r.value),
        Number(rgbCompareUI.g.value),
        Number(rgbCompareUI.b.value)
    ];
    const values = normalizedRgbCompareValues();
    rgbCompareUI.rValue.textContent = String(rgb8[0]);
    rgbCompareUI.gValue.textContent = String(rgb8[1]);
    rgbCompareUI.bValue.textContent = String(rgb8[2]);
    rgbCompareUI.codeValue.textContent = rgb8.join(', ');
    if (rgbCompareUI.pipelineCode) {
        rgbCompareUI.pipelineCode.textContent = `RGB(${rgb8.join(', ')})`;
    }
    if (rgbCompareUI.pipelineTerminalCode) {
        rgbCompareUI.pipelineTerminalCode.textContent = `[${rgb8.join(',')}]`;
    }

    const selectedKeys = new Set(
        rgbCompareUI.spaceToggles
            .filter((toggle) => toggle.checked)
            .map((toggle) => toggle.value)
    );
    const selectedSpaces = rgbCompareSpaces.filter((space) => selectedKeys.has(space.key));
    rgbCompareUI.cardGrid.innerHTML = '';
    if (selectedSpaces.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'rgb-compare-empty';
        empty.textContent = '비교할 컬러스페이스를 하나 이상 선택하세요.';
        rgbCompareUI.cardGrid.appendChild(empty);
    } else {
        selectedSpaces.forEach((space) => {
            rgbCompareUI.cardGrid.appendChild(rgbCompareCreateCard(space, values));
        });
    }

    const gamut = window.matchMedia('(color-gamut: rec2020)').matches
        ? 'Rec.2020'
        : window.matchMedia('(color-gamut: p3)').matches ? 'Display P3' : 'sRGB';
    const supportedCount = rgbCompareSpaces.filter((space) => space.cssSpace && CSS.supports?.('color', `color(${space.cssSpace} 1 0 0)`)).length;
    rgbCompareUI.mainMeta.textContent = `RGB(${rgb8.join(', ')}) · display gamut ≈ ${gamut}`;
    rgbCompareUI.note.textContent =
        `체크된 ${selectedSpaces.length}개 표준을 비교 중입니다. CSS color()로 직접 표시 가능한 SDR 항목은 브라우저 컬러 관리에 맡기고, ` +
        `Rec.2100 PQ/HLG처럼 CSS 표시가 없는 HDR 항목은 XYZ/nits 해석값을 보존한 뒤 SDR 프리뷰로 클리핑해 보여줍니다. ` +
        `현재 브라우저가 직접 파싱하는 CSS 색공간은 ${supportedCount}개입니다.`;
}

rgbCompareUI.spaceToggles.forEach((toggle) => {
    const space = rgbCompareSpaces.find((item) => item.key === toggle.value);
    if (space?.cssSpace && !CSS.supports?.('color', `color(${space.cssSpace} 1 0 0)`)) {
        toggle.parentElement.title = '이 브라우저가 color() 표시를 직접 지원하지 않아 SDR 프리뷰로 표시됩니다.';
    }
});

[rgbCompareUI.r, rgbCompareUI.g, rgbCompareUI.b, ...rgbCompareUI.spaceToggles].forEach((element) => {
    element.addEventListener('input', renderRgbCompare);
    element.addEventListener('change', renderRgbCompare);
});

renderRgbCompare();
