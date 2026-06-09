const additiveSubtractiveUI = {
    mainMeta: document.getElementById('addsub-main-meta'),
    canvas: document.getElementById('addsub-canvas'),
    reset: document.getElementById('addsub-reset-btn'),
    leftProfile: document.getElementById('addsub-left-profile'),
    rightProfile: document.getElementById('addsub-right-profile'),
    sliders: {
        red: document.getElementById('addsub-r'),
        green: document.getElementById('addsub-g'),
        blue: document.getElementById('addsub-b'),
        cyan: document.getElementById('addsub-c'),
        magenta: document.getElementById('addsub-m'),
        yellow: document.getElementById('addsub-y')
    },
    readouts: {
        red: document.getElementById('addsub-r-value'),
        green: document.getElementById('addsub-g-value'),
        blue: document.getElementById('addsub-b-value'),
        cyan: document.getElementById('addsub-c-value'),
        magenta: document.getElementById('addsub-m-value'),
        yellow: document.getElementById('addsub-y-value')
    }
};

const additiveSubtractiveDefaults = {
    red: 1,
    green: 1,
    blue: 1,
    cyan: 1,
    magenta: 1,
    yellow: 1
};

const addsubD50ToD65 = [
    [0.9555766, -0.0230393, 0.0631636],
    [-0.0282895, 1.0099416, 0.0210077],
    [0.0122982, -0.0204830, 1.3299098]
];

const addsubMixSpaces = {
    srgb: {
        type: 'rgb',
        label: 'sRGB / Rec.709',
        cssColorSpace: 'srgb',
        matrix: [
            [0.4124, 0.3576, 0.1805],
            [0.2126, 0.7152, 0.0722],
            [0.0193, 0.1192, 0.9505]
        ],
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    },
    'display-p3': {
        type: 'rgb',
        label: 'Display P3',
        cssColorSpace: 'display-p3',
        matrix: [
            [0.4865709, 0.2656677, 0.1982173],
            [0.2289746, 0.6917385, 0.0792869],
            [0.0000000, 0.0451134, 1.0439444]
        ],
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    },
    'adobe-rgb': {
        type: 'rgb',
        label: 'Adobe RGB',
        cssColorSpace: 'a98-rgb',
        matrix: [
            [0.5767309, 0.1855540, 0.1881852],
            [0.2973769, 0.6273491, 0.0752741],
            [0.0270343, 0.0706872, 0.9911085]
        ],
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    },
    'prophoto-rgb': {
        type: 'rgb',
        label: 'ProPhoto RGB',
        cssColorSpace: 'prophoto-rgb',
        matrix: [
            [0.7976749, 0.1351917, 0.0313534],
            [0.2880402, 0.7118741, 0.0000857],
            [0.0000000, 0.0000000, 0.8252100]
        ],
        adaptD50ToD65: true,
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    },
    rec601: {
        type: 'rgb',
        label: 'Rec.601',
        matrix: [
            [0.3935, 0.3653, 0.1916],
            [0.2124, 0.7011, 0.0866],
            [0.0187, 0.1119, 0.9582]
        ],
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    },
    rec2020: {
        type: 'rgb',
        label: 'Rec.2020 / Rec.2100',
        cssColorSpace: 'rec2020',
        matrix: [
            [0.636958, 0.144617, 0.168881],
            [0.262700, 0.677998, 0.059302],
            [0.000000, 0.028073, 1.060985]
        ],
        primaries: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
    }
};

const addsubPrintProfileLabels = {
    fogra39: 'ISO Coated v2 (FOGRA39)',
    swopv2: 'US Web Coated (SWOP v2)',
    japan2001: 'Japan Color 2001 Coated'
};

const addsubPrintProfileFallbacks = {
    fogra39: {
        color: 0xff66cc,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.183, y: 0.112 }, { x: 0.370, y: 0.205 }, { x: 0.503, y: 0.335 },
            { x: 0.438, y: 0.499 }, { x: 0.285, y: 0.445 }, { x: 0.190, y: 0.180 }
        ]
    },
    swopv2: {
        color: 0xff99cc,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.180, y: 0.102 }, { x: 0.362, y: 0.190 }, { x: 0.492, y: 0.325 },
            { x: 0.433, y: 0.487 }, { x: 0.277, y: 0.430 }, { x: 0.188, y: 0.168 }
        ]
    },
    japan2001: {
        color: 0xcc66ff,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.186, y: 0.116 }, { x: 0.378, y: 0.214 }, { x: 0.511, y: 0.343 },
            { x: 0.446, y: 0.506 }, { x: 0.292, y: 0.452 }, { x: 0.196, y: 0.184 }
        ]
    }
};

function addsubBuildPrintProfiles() {
    const source = typeof cmykStandards !== 'undefined' ? cmykStandards : addsubPrintProfileFallbacks;
    return Object.fromEntries(Object.entries(addsubPrintProfileLabels).map(([key, label]) => {
        const standard = source[key] || addsubPrintProfileFallbacks[key];
        return [key, {
            type: 'cmy',
            label,
            color: standard.color,
            white: standard.white,
            hull: standard.hull
        }];
    }));
}

const addsubPrintProfiles = addsubBuildPrintProfiles();
const addsubAllProfiles = { ...addsubMixSpaces, ...addsubPrintProfiles };

function addsubClamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function addsubGetMixSpace(key) {
    return addsubMixSpaces[key] || addsubMixSpaces.srgb;
}

function addsubGetProfile(key) {
    return addsubAllProfiles[key] || addsubAllProfiles.srgb;
}

function addsubMat3MulVec3(matrix, vector) {
    return [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
        matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
    ];
}

function addsubLinearRgbToXyz(linearRgb, space) {
    const xyz = addsubMat3MulVec3(space.matrix, linearRgb);
    if (!space.adaptD50ToD65) return { X: xyz[0], Y: xyz[1], Z: xyz[2] };
    const adapted = addsubMat3MulVec3(addsubD50ToD65, xyz);
    return { X: adapted[0], Y: adapted[1], Z: adapted[2] };
}

function addsubReadState() {
    return Object.fromEntries(Object.entries(additiveSubtractiveUI.sliders).map(([key, slider]) => [
        key,
        addsubClamp01(Number(slider?.value || additiveSubtractiveDefaults[key] || 0))
    ]));
}

function addsubSetState(nextState) {
    for (const [key, value] of Object.entries(nextState)) {
        if (additiveSubtractiveUI.sliders[key]) additiveSubtractiveUI.sliders[key].value = String(value);
    }
}

function addsubSyncReadouts(state) {
    for (const [key, value] of Object.entries(state)) {
        if (additiveSubtractiveUI.readouts[key]) additiveSubtractiveUI.readouts[key].textContent = value.toFixed(2);
    }
}

function addsubLinearToSrgb(linearValue) {
    const value = addsubClamp01(linearValue);
    return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function addsubLinearRgbToCss(linearRgb, space = addsubMixSpaces.srgb) {
    const xyz = addsubLinearRgbToXyz(linearRgb, space);
    const linear = xyzToLinearSrgb(xyz.X, xyz.Y, xyz.Z);
    const color = linearToDisplaySrgbColor(linear.r, linear.g, linear.b);
    return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

function addsubCanvasSupportsCssColor(cssColor) {
    if (typeof document === 'undefined') return false;
    if (!addsubCanvasSupportsCssColor.ctx) {
        const probe = document.createElement('canvas');
        addsubCanvasSupportsCssColor.ctx = probe.getContext('2d', { colorSpace: 'display-p3' }) || probe.getContext('2d');
    }
    const ctx = addsubCanvasSupportsCssColor.ctx;
    if (!ctx) return false;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = cssColor;
    return ctx.fillStyle !== '#000000';
}

function addsubGetCanvas2DContext(canvas) {
    try {
        return canvas.getContext('2d', { colorSpace: 'display-p3' }) || canvas.getContext('2d');
    } catch (error) {
        return canvas.getContext('2d');
    }
}

function addsubRgbColorSpaceToCss(rgb, space, useNativeProfile = false) {
    if (useNativeProfile && space.cssColorSpace) {
        const cssColor = `color(${space.cssColorSpace} ${addsubClamp01(rgb[0]).toFixed(5)} ${addsubClamp01(rgb[1]).toFixed(5)} ${addsubClamp01(rgb[2]).toFixed(5)})`;
        if (addsubCanvasSupportsCssColor(cssColor)) return cssColor;
    }
    return addsubLinearRgbToCss(rgb, space);
}

function addsubPrimaryToCss(primaryIndex, space) {
    const rgb = [0, 0, 0];
    rgb[primaryIndex] = 1;
    return addsubRgbColorSpaceToCss(rgb, space, true);
}

function addsubXyToCss(point, relativeY = 1) {
    if (!point || point.y <= 1e-8 || relativeY <= 1e-8) return 'rgb(0, 0, 0)';
    const Y = addsubClamp01(relativeY);
    const X = point.x * Y / point.y;
    const Z = (1 - point.x - point.y) * Y / point.y;
    const linear = xyzToLinearSrgb(X, Y, Z);
    const color = linearToDisplaySrgbColor(linear.r, linear.g, linear.b);
    return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

function addsubLinearRgbToXy(linearRgb, space = addsubMixSpaces.srgb) {
    const xyz = addsubLinearRgbToXyz(linearRgb, space);
    const sum = xyz.X + xyz.Y + xyz.Z;
    if (sum <= 1e-8) return null;
    return { x: xyz.X / sum, y: xyz.Y / sum };
}

function addsubDrawRoundedRect(ctx, rect, radius) {
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(rect.left, rect.top, rect.width, rect.height, radius);
        return;
    }
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;
    ctx.moveTo(rect.left + radius, rect.top);
    ctx.lineTo(right - radius, rect.top);
    ctx.quadraticCurveTo(right, rect.top, right, rect.top + radius);
    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    ctx.lineTo(rect.left + radius, bottom);
    ctx.quadraticCurveTo(rect.left, bottom, rect.left, bottom - radius);
    ctx.lineTo(rect.left, rect.top + radius);
    ctx.quadraticCurveTo(rect.left, rect.top, rect.left + radius, rect.top);
}

function addsubFillPanel(ctx, rect, theme, fillStyle = theme.panel) {
    ctx.save();
    ctx.beginPath();
    addsubDrawRoundedRect(ctx, rect, 18);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function addsubDrawLabel(ctx, text, left, top, theme, size = 15, weight = 800) {
    ctx.fillStyle = theme.text;
    ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, left, top);
}

function addsubDrawColorSwatch(ctx, label, fillStyle, left, top, width, theme) {
    ctx.save();
    ctx.beginPath();
    addsubDrawRoundedRect(ctx, { left, top, width, height: 42 }, 12);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = theme.borderStrong;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = theme.textOnColor;
    ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, left + width / 2, top + 21);
    ctx.restore();
}

function addsubDrawSwatch(ctx, label, linearRgb, left, top, width, theme, space = addsubMixSpaces.srgb) {
    addsubDrawColorSwatch(ctx, label, addsubLinearRgbToCss(linearRgb, space), left, top, width, theme);
}

function addsubGetMixCircleLayout(rect) {
    const innerLeft = rect.left + 14;
    const innerTop = rect.top + 42;
    const innerWidth = Math.max(120, rect.width - 28);
    const innerHeight = Math.max(120, rect.height - 104);
    const boxSize = Math.min(innerWidth, innerHeight);
    const boxLeft = innerLeft + (innerWidth - boxSize) / 2;
    const boxTop = innerTop + (innerHeight - boxSize) / 2;
    const centerX = boxLeft + boxSize * 0.5;
    const centerY = boxTop + boxSize * 0.5;
    const radius = boxSize * 0.31;
    return {
        radius,
        circles: [
            { left: centerX - radius * 0.62, top: centerY - radius * 0.45 },
            { left: centerX + radius * 0.62, top: centerY - radius * 0.45 },
            { left: centerX, top: centerY + radius * 0.58 }
        ]
    };
}

function addsubDrawAdditivePanel(ctx, rect, state, theme, space, sideLabel) {
    const linearRgb = [state.red, state.green, state.blue];
    const xyz = addsubLinearRgbToXyz(linearRgb, space);
    addsubFillPanel(ctx, rect, theme, '#08090d');
    addsubDrawLabel(ctx, `${sideLabel} · RGB Additive Light · ${space.label}`, rect.left + 18, rect.top + 16, theme);

    const layout = addsubGetMixCircleLayout(rect);
    const radius = layout.radius;
    const circles = [
        { color: addsubPrimaryToCss(0, space), alpha: state.red, ...layout.circles[0] },
        { color: addsubPrimaryToCss(1, space), alpha: state.green, ...layout.circles[1] },
        { color: addsubPrimaryToCss(2, space), alpha: state.blue, ...layout.circles[2] }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const circle of circles) {
        if (circle.alpha <= 0) continue;
        ctx.globalAlpha = circle.alpha;
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(circle.left, circle.top, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    addsubDrawSwatch(ctx, 'Result Light', linearRgb, rect.left + 18, rect.top + rect.height - 62, 142, theme, space);
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('black + R/G/B light → brighter color', rect.left + rect.width - 18, rect.top + rect.height - 22);
    return { mode: 'RGB Additive', xy: addsubLinearRgbToXy(linearRgb, space), relativeY: addsubClamp01(xyz.Y), profile: space };
}

function addsubGetPrintAnchors(profile) {
    const [blue, magenta, red, yellow, green, cyan] = profile.hull;
    return {
        white: profile.white,
        cyan,
        magenta,
        yellow,
        red,
        green,
        blue,
        black: profile.white
    };
}

function addsubCmyToPrintXy(cmy, profile) {
    const [cyan, magenta, yellow] = cmy;
    const reflected = (1 - cyan) + (1 - magenta) + (1 - yellow);
    if (reflected <= 1e-8) return null;
    const anchors = addsubGetPrintAnchors(profile);
    const weightedAnchors = [
        [anchors.white, (1 - cyan) * (1 - magenta) * (1 - yellow)],
        [anchors.cyan, cyan * (1 - magenta) * (1 - yellow)],
        [anchors.magenta, (1 - cyan) * magenta * (1 - yellow)],
        [anchors.yellow, (1 - cyan) * (1 - magenta) * yellow],
        [anchors.blue, cyan * magenta * (1 - yellow)],
        [anchors.green, cyan * (1 - magenta) * yellow],
        [anchors.red, (1 - cyan) * magenta * yellow],
        [anchors.black, cyan * magenta * yellow]
    ];
    let sum = 0;
    let x = 0;
    let y = 0;
    for (const [point, weight] of weightedAnchors) {
        if (!point || weight <= 0) continue;
        sum += weight;
        x += point.x * weight;
        y += point.y * weight;
    }
    return sum > 1e-8 ? { x: x / sum, y: y / sum } : null;
}

function addsubCmyPreviewCss(cmy, profile) {
    const xy = addsubCmyToPrintXy(cmy, profile);
    return addsubXyToCss(xy, addsubCmyRelativeY(cmy));
}

function addsubCmyRelativeY(cmy) {
    return addsubClamp01(((1 - cmy[0]) + (1 - cmy[1]) + (1 - cmy[2])) / 3);
}

function addsubDrawSubtractivePanel(ctx, rect, state, theme, profile, sideLabel) {
    const cmy = [state.cyan, state.magenta, state.yellow];
    const anchors = addsubGetPrintAnchors(profile);
    addsubFillPanel(ctx, rect, theme, '#f4efe2');
    addsubDrawLabel(ctx, `${sideLabel} · CMY Subtractive Ink · ${profile.label}`, rect.left + 18, rect.top + 16, { ...theme, text: '#1b1b1b' });

    const layout = addsubGetMixCircleLayout(rect);
    const radius = layout.radius;
    const circles = [
        { color: addsubXyToCss(anchors.cyan, 0.72), alpha: state.cyan, ...layout.circles[0] },
        { color: addsubXyToCss(anchors.magenta, 0.72), alpha: state.magenta, ...layout.circles[1] },
        { color: addsubXyToCss(anchors.yellow, 0.86), alpha: state.yellow, ...layout.circles[2] }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (const circle of circles) {
        if (circle.alpha <= 0) continue;
        ctx.globalAlpha = circle.alpha;
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(circle.left, circle.top, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    addsubDrawColorSwatch(ctx, 'Reflected Ink', addsubCmyPreviewCss(cmy, profile), rect.left + 18, rect.top + rect.height - 62, 154, theme);
    ctx.fillStyle = 'rgba(20,20,20,0.72)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('paper white − absorbed R/G/B → darker color', rect.left + rect.width - 18, rect.top + rect.height - 22);
    return { mode: 'CMY Subtractive', xy: addsubCmyToPrintXy(cmy, profile), relativeY: addsubCmyRelativeY(cmy), profile };
}

function addsubDrawProfilePanel(ctx, rect, state, theme, profile, sideLabel) {
    return profile.type === 'cmy'
        ? addsubDrawSubtractivePanel(ctx, rect, state, theme, profile, sideLabel)
        : addsubDrawAdditivePanel(ctx, rect, state, theme, profile, sideLabel);
}

function addsubDrawXyDiagram(ctx, rect, leftResult, rightResult, theme) {
    addsubFillPanel(ctx, rect, theme);
    addsubDrawLabel(ctx, 'CIE xy chromaticity link', rect.left + 18, rect.top + 16, theme);

    const xAxisMax = 0.8;
    const yAxisMax = 0.9;
    const chartDomainMax = 0.9;
    const labelLeft = 42;
    const labelRight = 92;
    const labelTop = 42;
    const labelBottom = 28;
    const availableWidth = Math.max(120, rect.width - labelLeft - labelRight);
    const availableHeight = Math.max(120, rect.height - labelTop - labelBottom);
    const chartSize = Math.min(availableWidth, availableHeight);
    const chart = {
        left: rect.left + labelLeft + (availableWidth - chartSize) / 2,
        top: rect.top + labelTop + (availableHeight - chartSize) / 2,
        width: chartSize,
        height: chartSize
    };
    const mapX = (value) => chart.left + addsubClamp01(value / chartDomainMax) * chart.width;
    const mapY = (value) => chart.top + chart.height - addsubClamp01(value / chartDomainMax) * chart.height;

    ctx.save();
    if (typeof chromaCanvas !== 'undefined' && chromaCanvas) {
        ctx.drawImage(
            chromaCanvas,
            0,
            chromaCanvas.height * (1 - chartDomainMax),
            chromaCanvas.width * chartDomainMax,
            chromaCanvas.height * chartDomainMax,
            chart.left,
            chart.top,
            chart.width,
            chart.height
        );
    }

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.muted;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let step = 0; step <= 9; step++) {
        const xValue = step / 10;
        const xPosition = mapX(xValue);
        ctx.beginPath();
        ctx.moveTo(xPosition, chart.top);
        ctx.lineTo(xPosition, chart.top + chart.height);
        ctx.stroke();
        if (step % 2 === 0 && xValue <= xAxisMax) ctx.fillText(xValue.toFixed(1), xPosition, chart.top + chart.height + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let step = 0; step <= 9; step++) {
        const yValue = step / 10;
        const yPosition = mapY(yValue);
        ctx.beginPath();
        ctx.moveTo(chart.left, yPosition);
        ctx.lineTo(chart.left + chart.width, yPosition);
        ctx.stroke();
        if (step % 2 === 0 && yValue <= yAxisMax) ctx.fillText(yValue.toFixed(1), chart.left - 8, yPosition);
    }

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(chart.left, chart.top, chart.width, chart.height);

    const locus = typeof xyyBaseChromaticityPoints !== 'undefined' && xyyBaseChromaticityPoints.length
        ? xyyBaseChromaticityPoints.map((point) => ({ x: point.x, y: point.z }))
        : [
            { x: 0.174, y: 0.005 }, { x: 0.08, y: 0.04 }, { x: 0.04, y: 0.25 },
            { x: 0.05, y: 0.55 }, { x: 0.16, y: 0.83 }, { x: 0.42, y: 0.68 },
            { x: 0.64, y: 0.33 }, { x: 0.735, y: 0.265 }
        ];
    ctx.beginPath();
    locus.forEach((point, index) => {
        const pointX = mapX(point.x);
        const pointY = mapY(point.y);
        if (index === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
    });
    if (locus.length > 1) ctx.lineTo(mapX(locus[0].x), mapY(locus[0].y));
    ctx.strokeStyle = theme.locus;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    function drawSpaceTriangle(space, color, dash = [5, 5]) {
        const primaries = [
            addsubLinearRgbToXy([1, 0, 0], space),
            addsubLinearRgbToXy([0, 1, 0], space),
            addsubLinearRgbToXy([0, 0, 1], space)
        ].filter(Boolean);
        if (primaries.length !== 3) return;
        ctx.beginPath();
        primaries.forEach((point, index) => {
            const pointX = mapX(point.x);
            const pointY = mapY(point.y);
            if (index === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
        });
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawPrintProfile(profile, color, dash = [2, 5]) {
        if (!profile.hull || profile.hull.length < 3) return;
        ctx.beginPath();
        profile.hull.forEach((point, index) => {
            const pointX = mapX(point.x);
            const pointY = mapY(point.y);
            if (index === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
        });
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawProfileBoundary(result, color, dash) {
        if (result.profile.type === 'cmy') drawPrintProfile(result.profile, color, dash);
        else drawSpaceTriangle(result.profile, color, dash);
    }

    drawProfileBoundary(leftResult, 'rgba(255,255,255,0.72)', [5, 5]);
    if (leftResult.profile !== rightResult.profile) {
        drawProfileBoundary(rightResult, 'rgba(255,216,102,0.78)', [2, 5]);
    }

    function drawMarker(point, color, label, offsetY) {
        if (!point) return;
        const markerX = mapX(point.x);
        const markerY = mapY(point.y);
        ctx.beginPath();
        ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = theme.markerStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} (${point.x.toFixed(3)}, ${point.y.toFixed(3)})`, markerX + 10, markerY + offsetY);
    }

    function drawLuminanceScale() {
        const barLeft = chart.left + chart.width + 30;
        const barTop = chart.top;
        const barWidth = 12;
        const barHeight = chart.height;
        const gradient = ctx.createLinearGradient(0, barTop + barHeight, 0, barTop);
        gradient.addColorStop(0, '#080808');
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(barLeft, barTop, barWidth, barHeight);
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(barLeft, barTop, barWidth, barHeight);
        ctx.fillStyle = theme.text;
        ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Y', barLeft + barWidth / 2, barTop - 7);

        [
            { result: leftResult, color: '#ffffff', side: -1 },
            { result: rightResult, color: '#ffd866', side: 1 }
        ].forEach(({ result, color, side }) => {
            const y = barTop + barHeight * (1 - addsubClamp01(result.relativeY));
            ctx.beginPath();
            ctx.moveTo(barLeft + barWidth / 2, y);
            ctx.lineTo(barLeft + barWidth / 2 + side * 18, y - 7);
            ctx.lineTo(barLeft + barWidth / 2 + side * 18, y + 7);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = theme.markerStroke;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        });
    }

    drawMarker(leftResult.xy, '#ffffff', `Left ${leftResult.profile.label}`, -10);
    drawMarker(rightResult.xy, '#ffd866', `Right ${rightResult.profile.label}`, 12);
    drawLuminanceScale();
    ctx.restore();
}

function renderAdditiveSubtractive() {
    const canvas = additiveSubtractiveUI.canvas;
    if (!canvas) return;
    const state = addsubReadState();
    const leftProfile = addsubGetProfile(additiveSubtractiveUI.leftProfile?.value);
    const rightProfile = addsubGetProfile(additiveSubtractiveUI.rightProfile?.value);
    addsubSyncReadouts(state);

    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 980));
    const cssHeight = Math.max(1, Math.floor(rect.height || canvas.clientHeight || 620));
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssWidth * pixelRatio);
    canvas.height = Math.floor(cssHeight * pixelRatio);

    const ctx = addsubGetCanvas2DContext(canvas);
    if (!ctx) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const style = getComputedStyle(document.body);
    const theme = {
        panel: document.body.classList.contains('theme-day') ? 'rgba(255,255,255,0.72)' : 'rgba(16,16,20,0.78)',
        border: style.getPropertyValue('--panel-border').trim() || 'rgba(255,255,255,0.14)',
        borderStrong: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.64)',
        text: style.getPropertyValue('--text-main').trim() || '#ffffff',
        muted: style.getPropertyValue('--text-muted').trim() || '#b8b8b8',
        grid: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
        axis: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)',
        locus: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.76)',
        markerStroke: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.95)',
        textOnColor: 'rgba(255,255,255,0.96)'
    };
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = document.body.classList.contains('theme-day') ? 'rgba(245,245,242,0.95)' : 'rgba(8,8,10,0.95)';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const margin = 10;
    const gap = 10;
    const topHeight = Math.max(250, Math.floor(cssHeight * 0.52));
    const panelWidth = (cssWidth - margin * 2 - gap) / 2;
    const leftRect = { left: margin, top: margin, width: panelWidth, height: topHeight };
    const rightRect = { left: margin + panelWidth + gap, top: margin, width: panelWidth, height: topHeight };
    const chartRect = {
        left: margin,
        top: margin + topHeight + gap,
        width: cssWidth - margin * 2,
        height: cssHeight - (margin + topHeight + gap) - margin
    };

    const leftResult = addsubDrawProfilePanel(ctx, leftRect, state, theme, leftProfile, 'Left');
    const rightResult = addsubDrawProfilePanel(ctx, rightRect, state, theme, rightProfile, 'Right');
    addsubDrawXyDiagram(ctx, chartRect, leftResult, rightResult, theme);

    if (additiveSubtractiveUI.mainMeta) {
        const formatXy = (xy) => xy ? `${xy.x.toFixed(3)}, ${xy.y.toFixed(3)}` : 'undefined';
        additiveSubtractiveUI.mainMeta.textContent =
            `Left ${leftProfile.label} (${leftResult.mode}) xy ${formatXy(leftResult.xy)} · Right ${rightProfile.label} (${rightResult.mode}) xy ${formatXy(rightResult.xy)}`;
    }
}

function scheduleAdditiveSubtractiveRender() {
    requestAnimationFrame(renderAdditiveSubtractive);
}

Object.values(additiveSubtractiveUI.sliders).filter(Boolean).forEach((slider) => {
    slider.addEventListener('input', scheduleAdditiveSubtractiveRender);
    slider.addEventListener('change', scheduleAdditiveSubtractiveRender);
});

[additiveSubtractiveUI.leftProfile, additiveSubtractiveUI.rightProfile].filter(Boolean).forEach((select) => {
    select.addEventListener('input', scheduleAdditiveSubtractiveRender);
    select.addEventListener('change', scheduleAdditiveSubtractiveRender);
});

additiveSubtractiveUI.reset?.addEventListener('click', () => {
    addsubSetState(additiveSubtractiveDefaults);
    if (additiveSubtractiveUI.leftProfile) additiveSubtractiveUI.leftProfile.value = 'srgb';
    if (additiveSubtractiveUI.rightProfile) additiveSubtractiveUI.rightProfile.value = 'fogra39';
    scheduleAdditiveSubtractiveRender();
});

window.renderAdditiveSubtractive = renderAdditiveSubtractive;
window.scheduleAdditiveSubtractiveRender = scheduleAdditiveSubtractiveRender;
