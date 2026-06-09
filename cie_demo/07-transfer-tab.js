// --------------------------------------------------------
// 8.5 Transfer characteristic 비교 탭
// --------------------------------------------------------
const transferUI = {
    mainMeta: document.getElementById('transfer-main-meta'),
    canvas: document.getElementById('transfer-chart-canvas'),
    allocationCanvas: document.getElementById('transfer-allocation-canvas'),
    formulaList: document.getElementById('transfer-formula-list'),
    toggleEotf: document.getElementById('toggle-transfer-eotf'),
    toggleOetf: document.getElementById('toggle-transfer-oetf'),
    axisMode: document.getElementById('transfer-axis-mode'),
    peakNits: document.getElementById('transfer-peak-nits'),
    peakNitsRange: document.getElementById('transfer-peak-nits-range'),
    standardToggles: Array.from(document.querySelectorAll('.transfer-standard-toggle'))
};

const cameraLogUI = {
    mainMeta: document.getElementById('camera-log-main-meta'),
    canvas: document.getElementById('camera-log-chart-canvas'),
    modeToggles: Array.from(document.querySelectorAll('.camera-log-mode-toggle')),
    logToggles: Array.from(document.querySelectorAll('.camera-log-toggle')),
    rangeMode: document.getElementById('camera-log-range-mode'),
    minStop: document.getElementById('camera-log-min-stop'),
    maxStop: document.getElementById('camera-log-max-stop'),
    minStopValue: document.getElementById('camera-log-min-stop-value'),
    maxStopValue: document.getElementById('camera-log-max-stop-value'),
    rangeReadout: document.getElementById('camera-log-range-readout')
};

const transferClamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const transferClampPeakNits = (value) => Math.max(100, Math.min(10000, Number.isFinite(value) ? value : 1000));
const transferHdrStandardKeys = new Set(['pq', 'hlg']);
const transferNitsUnsupportedKeys = new Set(['linear', 'srgb', 'adobe-rgb', 'prophoto']);
const transferNitsBase = 100;
const cameraLogGray = 0.18;
const cameraLogDisplayFloorStop = -16;
const cameraLogCompactRange = { min: -8, max: 8 };
const cameraLogExtendedRange = { min: -12, max: 12 };

function transferSrgbDecode(signal) {
    return signal <= 0.04045 ? signal / 12.92 : Math.pow((signal + 0.055) / 1.055, 2.4);
}

function transferSrgbEncode(light) {
    return light <= 0.0031308 ? 12.92 * light : 1.055 * Math.pow(light, 1 / 2.4) - 0.055;
}

function transferBt709Encode(light) {
    return light < 0.018 ? 4.5 * light : 1.099 * Math.pow(light, 0.45) - 0.099;
}

function transferBt1886Eotf(signal) {
    return Math.pow(signal, 2.4);
}

function transferBt2020Encode(light) {
    const alpha = 1.09929682680944;
    const beta = 0.018053968510807;
    return light < beta ? 4.5 * light : alpha * Math.pow(light, 0.45) - (alpha - 1);
}

function transferPqEotf(signal) {
    const m1 = 2610 / 16384;
    const m2 = (2523 / 4096) * 128;
    const c1 = 3424 / 4096;
    const c2 = (2413 / 4096) * 32;
    const c3 = (2392 / 4096) * 32;
    const powered = Math.pow(signal, 1 / m2);
    const numerator = Math.max(powered - c1, 0);
    const denominator = Math.max(c2 - c3 * powered, 1e-9);
    return Math.pow(numerator / denominator, 1 / m1);
}

function transferPqInverseEotf(light) {
    const m1 = 2610 / 16384;
    const m2 = (2523 / 4096) * 128;
    const c1 = 3424 / 4096;
    const c2 = (2413 / 4096) * 32;
    const c3 = (2392 / 4096) * 32;
    const powered = Math.pow(light, m1);
    return Math.pow((c1 + c2 * powered) / (1 + c3 * powered), m2);
}

function transferHlgOetf(light) {
    const a = 0.17883277;
    const b = 0.28466892;
    const c = 0.55991073;
    return light <= 1 / 12 ? Math.sqrt(3 * light) : a * Math.log(12 * light - b) + c;
}

function transferHlgInverseOetf(signal) {
    const a = 0.17883277;
    const b = 0.28466892;
    const c = 0.55991073;
    return signal <= 0.5 ? (signal * signal) / 3 : (Math.exp((signal - c) / a) + b) / 12;
}

function transferLogC3Encode(sceneLinear) {
    const cut = 0.010591;
    const a = 5.555556;
    const b = 0.052272;
    const c = 0.247190;
    const d = 0.385537;
    const e = 5.367655;
    const f = 0.092809;
    return sceneLinear > cut ? c * Math.log10(a * sceneLinear + b) + d : e * sceneLinear + f;
}

function transferLogC3Decode(codeValue) {
    const cut = 0.010591;
    const a = 5.555556;
    const b = 0.052272;
    const c = 0.247190;
    const d = 0.385537;
    const e = 5.367655;
    const f = 0.092809;
    const cutCode = e * cut + f;
    return codeValue > cutCode ? (Math.pow(10, (codeValue - d) / c) - b) / a : (codeValue - f) / e;
}

function transferSLog3Encode(sceneLinear) {
    const black = 95;
    const cutCode = 171.2102946929;
    const cut = 0.01125;
    const code10bit = sceneLinear >= cut
        ? 420 + Math.log10((sceneLinear + 0.01) / (0.18 + 0.01)) * 261.5
        : black + sceneLinear * (cutCode - black) / cut;
    return code10bit / 1023;
}

function transferSLog3Decode(codeValue) {
    const black = 95;
    const cutCode = 171.2102946929;
    const cut = 0.01125;
    const code10bit = codeValue * 1023;
    return code10bit >= cutCode
        ? Math.pow(10, (code10bit - 420) / 261.5) * (0.18 + 0.01) - 0.01
        : (code10bit - black) * cut / (cutCode - black);
}

function transferVLogEncode(sceneLinear) {
    const b = 0.00873;
    return sceneLinear < 0.01
        ? 5.6 * sceneLinear + 0.125
        : 0.241514 * Math.log10(sceneLinear + b) + 0.598206;
}

function transferVLogDecode(codeValue) {
    const b = 0.00873;
    return codeValue < 0.181
        ? (codeValue - 0.125) / 5.6
        : Math.pow(10, (codeValue - 0.598206) / 0.241514) - b;
}

function transferLog3G10Encode(sceneLinear) {
    const a = 0.224282;
    const b = 155.975327;
    const c = 0.01;
    const g = 15.1927;
    const shifted = sceneLinear + c;
    return shifted < 0 ? shifted * g : a * Math.log10(shifted * b + 1);
}

function transferLog3G10Decode(codeValue) {
    const a = 0.224282;
    const b = 155.975327;
    const c = 0.01;
    const g = 15.1927;
    return codeValue < 0 ? codeValue / g - c : (Math.pow(10, codeValue / a) - 1) / b - c;
}

const transferStandards = [
    {
        key: 'linear',
        label: 'Linear',
        color: '#9ca3af',
        referencePeakNits: 100,
        decodeLabel: 'Identity',
        encodeLabel: 'Identity',
        decodeFormula: ['L = V'],
        encodeFormula: ["V' = L"],
        decode: (signal) => signal,
        encode: (light) => light
    },
    {
        key: 'srgb',
        label: 'sRGB / P3',
        color: '#6eb5ff',
        referencePeakNits: 100,
        decodeLabel: 'sRGB EOTF',
        encodeLabel: 'sRGB OETF',
        decodeFormula: [
            'L = V / 12.92,  V ≤ 0.04045',
            'L = ((V + 0.055) / 1.055)^2.4,  V > 0.04045'
        ],
        encodeFormula: [
            "V' = 12.92L,  L ≤ 0.0031308",
            "V' = 1.055L^(1/2.4) - 0.055,  L > 0.0031308"
        ],
        decode: transferSrgbDecode,
        encode: transferSrgbEncode
    },
    {
        key: 'adobe-rgb',
        label: 'Adobe RGB',
        color: '#ff7ac8',
        referencePeakNits: 100,
        decodeLabel: 'γ 563/256',
        encodeLabel: '1/γ',
        decodeFormula: ['L = V^(563/256)'],
        encodeFormula: ["V' = L^(256/563)"],
        decode: (signal) => Math.pow(signal, 563 / 256),
        encode: (light) => Math.pow(light, 256 / 563)
    },
    {
        key: 'prophoto',
        label: 'ProPhoto',
        color: '#b7f36b',
        referencePeakNits: 100,
        decodeLabel: 'γ 1.8',
        encodeLabel: '1/1.8',
        decodeFormula: [
            'L = V / 16,  V ≤ 16/512',
            'L = V^1.8,  V > 16/512'
        ],
        encodeFormula: [
            "V' = 16L,  L ≤ 1/512",
            "V' = L^(1/1.8),  L > 1/512"
        ],
        decode: (signal) => signal <= 16 / 512 ? signal / 16 : Math.pow(signal, 1.8),
        encode: (light) => light <= 1 / 512 ? 16 * light : Math.pow(light, 1 / 1.8)
    },
    {
        key: 'rec601',
        label: 'Rec.601',
        color: '#ffbf6a',
        referencePeakNits: 100,
        decodeLabel: 'BT.1886 display EOTF',
        encodeLabel: 'BT.601 OETF',
        decodeFormula: ['L = V^2.4  (BT.1886 display EOTF approximation)'],
        encodeFormula: [
            "V' = 4.5L,  L < 0.018",
            "V' = 1.099L^0.45 - 0.099,  L ≥ 0.018"
        ],
        decode: transferBt1886Eotf,
        encode: transferBt709Encode
    },
    {
        key: 'rec709',
        label: 'Rec.709',
        color: '#ffdd66',
        referencePeakNits: 100,
        decodeLabel: 'BT.1886 display EOTF',
        encodeLabel: 'BT.709 OETF',
        decodeFormula: ['L = V^2.4  (BT.1886 display EOTF approximation)'],
        encodeFormula: [
            "V' = 4.5L,  L < 0.018",
            "V' = 1.099L^0.45 - 0.099,  L ≥ 0.018"
        ],
        decode: transferBt1886Eotf,
        encode: transferBt709Encode
    },
    {
        key: 'rec2020',
        label: 'Rec.2020',
        color: '#ff8888',
        referencePeakNits: 100,
        decodeLabel: 'BT.1886 display EOTF',
        encodeLabel: 'BT.2020 OETF',
        decodeFormula: ['L = V^2.4  (BT.1886 display EOTF approximation)'],
        encodeFormula: [
            "V' = 4.5L,  L < β",
            "V' = αL^0.45 - (α - 1),  L ≥ β",
            'α = 1.09929682680944,  β = 0.018053968510807'
        ],
        decode: transferBt1886Eotf,
        encode: transferBt2020Encode
    },
    {
        key: 'pq',
        label: 'Rec.2100 PQ',
        color: '#dd88ff',
        referencePeakNits: 10000,
        decodeLabel: 'ST 2084 EOTF',
        encodeLabel: 'ST 2084 inverse',
        decodeFormula: [
            'L = (max(V^(1/m2) - c1, 0) / (c2 - c3V^(1/m2)))^(1/m1)',
            'actual nits = 10000 × L',
            'm1=2610/16384,  m2=(2523/4096)×128'
        ],
        encodeFormula: [
            "V' = ((c1 + c2L^m1) / (1 + c3L^m1))^m2",
            'L is normalized display luminance, 1.0 = 10000 nits',
            'c1=3424/4096, c2=(2413/4096)×32, c3=(2392/4096)×32'
        ],
        decode: transferPqEotf,
        encode: transferPqInverseEotf
    },
    {
        key: 'hlg',
        label: 'Rec.2100 HLG',
        color: '#ffaa44',
        referencePeakNits: 1000,
        decodeLabel: 'HLG inverse + γ1.2',
        encodeLabel: 'HLG OETF',
        decodeFormula: [
            'E = V² / 3,  V ≤ 0.5',
            'E = (exp((V - c) / a) + b) / 12,  V > 0.5',
            'display light ∝ E^1.2  (1000 nits reference system gamma)'
        ],
        encodeFormula: [
            "V' = sqrt(3E),  0 ≤ E ≤ 1/12",
            "V' = a ln(12E - b) + c,  1/12 < E ≤ 1",
            'a=0.17883277, b=0.28466892, c=0.55991073'
        ],
        decode: (signal) => Math.pow(transferHlgInverseOetf(signal), 1.2),
        encode: transferHlgOetf
    }
];

const transferCameraLogs = [
    {
        key: 'logc3',
        label: 'ARRI LogC3',
        color: '#36d399',
        family: 'camera',
        decodeLabel: 'LogC3 → scene-linear',
        encodeLabel: 'scene-linear → LogC3',
        decodeMax: transferLogC3Decode(1),
        decode: transferLogC3Decode,
        encode: transferLogC3Encode
    },
    {
        key: 'slog3',
        label: 'Sony S-Log3',
        color: '#38bdf8',
        family: 'camera',
        decodeLabel: 'S-Log3 → scene-linear',
        encodeLabel: 'scene-linear → S-Log3',
        decodeMax: transferSLog3Decode(1),
        decode: transferSLog3Decode,
        encode: transferSLog3Encode
    },
    {
        key: 'vlog',
        label: 'Panasonic V-Log',
        color: '#f97316',
        family: 'camera',
        decodeLabel: 'V-Log → scene-linear',
        encodeLabel: 'scene-linear → V-Log',
        decodeMax: transferVLogDecode(1),
        decode: transferVLogDecode,
        encode: transferVLogEncode
    },
    {
        key: 'log3g10',
        label: 'RED Log3G10',
        color: '#ef4444',
        family: 'camera',
        decodeLabel: 'Log3G10 → scene-linear',
        encodeLabel: 'scene-linear → Log3G10',
        decodeMax: transferLog3G10Decode(1),
        decode: transferLog3G10Decode,
        encode: transferLog3G10Encode
    }
];

function getTransferNitsSpan(peakNits) {
    return Math.max(1, transferNitsToAxisUnits(transferClampPeakNits(peakNits)));
}

function transferNitsToAxisUnits(nits) {
    const safeNits = Math.max(0, Number.isFinite(nits) ? nits : 0);
    if (safeNits <= transferNitsBase) return safeNits / transferNitsBase;
    return 1 + Math.log10(safeNits / transferNitsBase);
}

function transferNitsToAxisRatio(nits, peakNits) {
    const safeNits = Math.max(0, Math.min(transferClampPeakNits(peakNits), Number.isFinite(nits) ? nits : 0));
    return transferNitsToAxisUnits(safeNits) / getTransferNitsSpan(peakNits);
}

function transferCurveNitsToAxisRatio(standard, relativeLight, standardPeakNits, axisPeakNits) {
    const safeLight = transferClamp01(relativeLight);
    if (!transferHdrStandardKeys.has(standard.key)) {
        return transferNitsToAxisRatio(safeLight * standardPeakNits, axisPeakNits);
    }
    return safeLight * transferNitsToAxisRatio(standardPeakNits, axisPeakNits);
}

function transferAxisRatioToNits(ratio, peakNits) {
    const axisUnits = transferClamp01(ratio) * getTransferNitsSpan(peakNits);
    if (axisUnits <= 1) return axisUnits * transferNitsBase;
    return Math.min(transferClampPeakNits(peakNits), transferNitsBase * Math.pow(10, axisUnits - 1));
}

function drawTransferGrid(ctx, plot, theme, axisMode = 'input-output', peakNits = 1000) {
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let step = 0; step <= 10; step++) {
        const ratio = step / 10;
        const x = plot.left + ratio * plot.width;
        const y = plot.top + (1 - ratio) * plot.height;
        ctx.beginPath();
        ctx.moveTo(x, plot.top);
        ctx.lineTo(x, plot.bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(plot.left, y);
        ctx.lineTo(plot.right, y);
        ctx.stroke();
        if (step % 2 === 0) {
            const showNitsTick = axisMode === 'light-code-nits' && (step === 0 || step === 10);
            const showNormalizedTick = axisMode !== 'light-code-nits';
            if (showNitsTick || showNormalizedTick) {
                const xTick = axisMode === 'light-code-nits' ? Math.round(transferAxisRatioToNits(ratio, peakNits)).toLocaleString() : ratio.toFixed(1);
                ctx.fillText(xTick, x, plot.bottom + 10);
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(ratio.toFixed(1), plot.left - 12, y);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
        }
    }

    if (axisMode === 'light-code-nits') {
        drawTransferNitsReferenceLine(ctx, plot, theme, peakNits, 100, 'SDR 100 nits', '#ffdd66');
        drawTransferNitsReferenceLine(ctx, plot, theme, peakNits, 1000, 'HLG 1000 nits', '#ffaa44');
        drawTransferNitsReferenceLine(ctx, plot, theme, peakNits, 10000, 'PQ 10000 nits', '#ff77cc');
        if (![100, 1000, 10000].includes(transferClampPeakNits(peakNits))) {
            drawTransferNitsReferenceLine(ctx, plot, theme, peakNits, transferClampPeakNits(peakNits), `${transferClampPeakNits(peakNits).toLocaleString()} nits`, theme.axis);
        }
    }

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.top);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.stroke();

    ctx.fillStyle = theme.text;
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const xLabel = axisMode === 'light-code-nits'
        ? `display light (nits, 0–${peakNits.toLocaleString()})`
        : axisMode === 'light-code'
            ? 'light / relative luminance (0–1)'
            : 'input signal / relative light';
    const yLabel = axisMode === 'light-code' || axisMode === 'light-code-nits'
        ? 'code value (0–1)'
        : 'output light / code';
    ctx.fillText(xLabel, plot.left + plot.width / 2, plot.bottom + 36);
    ctx.save();
    ctx.translate(plot.left - 48, plot.top + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    ctx.restore();
}

function drawTransferNitsReferenceLine(ctx, plot, theme, peakNits, nits, label, color) {
    if (nits > peakNits) return;
    const ratio = transferNitsToAxisRatio(nits, peakNits);
    const x = plot.left + ratio * plot.width;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(x, plot.top);
    ctx.lineTo(x, plot.bottom);
    ctx.stroke();

    ctx.translate(x + 6, plot.top + 12);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = color;
    ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
}

function drawTransferCurve(ctx, plot, standard, mode, dashed, axisMode = 'input-output', axisPeakNits = 1000) {
    const sampleCount = 220;
    const standardPeakNits = getTransferEffectivePeakNits(standard, axisPeakNits);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.left, plot.top, plot.width, plot.height);
    ctx.clip();
    ctx.strokeStyle = standard.color;
    ctx.lineWidth = mode === 'decode' ? 2.5 : 2;
    ctx.setLineDash(dashed ? [7, 5] : []);
    ctx.beginPath();
    for (let index = 0; index <= sampleCount; index++) {
        const input = index / sampleCount;
        const output = transferClamp01(mode === 'decode' ? standard.decode(input) : standard.encode(input));
        const isLightCodeAxis = axisMode === 'light-code' || axisMode === 'light-code-nits';
        const relativeLight = isLightCodeAxis && mode === 'decode' ? output : input;
        const horizontalValue = axisMode === 'light-code-nits'
            ? transferCurveNitsToAxisRatio(standard, relativeLight, standardPeakNits, axisPeakNits)
            : relativeLight;
        const verticalValue = isLightCodeAxis && mode === 'decode' ? input : output;
        const x = plot.left + horizontalValue * plot.width;
        const y = plot.bottom - verticalValue * plot.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawTransferAllocationDemo() {
    if (!transferUI.allocationCanvas) return;
    const canvas = transferUI.allocationCanvas;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(720, Math.floor(rect.width || canvas.clientWidth || 960));
    const height = Math.max(360, Math.floor(rect.height || canvas.clientHeight || 420));
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const theme = getTransferTheme();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    const left = 42;
    const right = width - 34;
    const barWidth = right - left;
    const linearY = 72;
    const gammaY = 176;
    const barHeight = 38;
    const sampleLights = [0.01, 0.03, 0.08, 0.18, 0.5, 1.0];

    ctx.fillStyle = theme.text;
    ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Limited code values: linear light vs gamma/log allocation', left, 16);

    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Linear 저장: 밝기 값을 그대로 같은 간격으로 quantize', left, linearY - 28);
    ctx.fillText('Gamma / Log 저장: 어두운 영역과 중간톤에 더 많은 code step 배치', left, gammaY - 28);

    drawAllocationRamp(ctx, left, linearY, barWidth, barHeight, (code) => code, theme);
    drawAllocationRamp(ctx, left, gammaY, barWidth, barHeight, transferSrgbDecode, theme);
    drawAllocationCodeTicks(ctx, left, linearY, barWidth, barHeight, (light) => light, sampleLights, '#6eb5ff', theme);
    drawAllocationCodeTicks(ctx, left, gammaY, barWidth, barHeight, transferSrgbEncode, sampleLights, '#ffdd66', theme);

    drawAllocationDensity(ctx, left, 274, barWidth, 58, theme);
}

function drawAllocationRamp(ctx, x, y, width, height, decodeFn, theme) {
    const steps = Math.floor(width);
    for (let index = 0; index < steps; index++) {
        const code = index / Math.max(1, steps - 1);
        const light = transferClamp01(decodeFn(code));
        const display = Math.round(255 * transferSrgbEncode(light));
        ctx.fillStyle = `rgb(${display}, ${display}, ${display})`;
        ctx.fillRect(x + index, y, 1.2, height);
    }
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
}

function drawAllocationCodeTicks(ctx, x, y, width, height, encodeFn, sampleLights, color, theme) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = theme.text;
    ctx.lineWidth = 1.6;
    ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const light of sampleLights) {
        const code = transferClamp01(encodeFn(light));
        const markerX = x + code * width;
        ctx.beginPath();
        ctx.moveTo(markerX, y - 6);
        ctx.lineTo(markerX, y + height + 8);
        ctx.stroke();
        ctx.fillText(`${Math.round(light * 100)}%`, markerX, y + height + 12);
    }
    ctx.restore();
}

function drawAllocationDensity(ctx, x, y, width, height, theme) {
    const shadowEnd = transferSrgbEncode(0.18);
    const linearShadowWidth = 0.18 * width;
    const gammaShadowWidth = shadowEnd * width;

    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('18% gray까지 확보되는 code space', x, y - 28);

    drawDensityBar(ctx, x, y, width, 18, linearShadowWidth, '#6eb5ff', theme, 'Linear: 약 18%');
    drawDensityBar(ctx, x, y + 36, width, 18, gammaShadowWidth, '#ffdd66', theme, 'sRGB gamma: 약 46%');
    ctx.restore();
}

function drawDensityBar(ctx, x, y, width, height, filledWidth, color, theme, label) {
    ctx.fillStyle = document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, filledWidth, height);
    ctx.strokeStyle = theme.axis;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = theme.text;
    ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 8, y + height / 2);
}

function drawTransferLegend(ctx, standards, plot, theme, showDecode, showEncode) {
    const legendX = plot.right + 22;
    let legendY = plot.top + 8;
    ctx.save();
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    for (const standard of standards) {
        ctx.strokeStyle = standard.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(legendX, legendY);
        ctx.lineTo(legendX + 20, legendY);
        ctx.stroke();
        if (showEncode) {
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(legendX, legendY + 9);
            ctx.lineTo(legendX + 20, legendY + 9);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.fillStyle = theme.text;
        ctx.fillText(standard.label, legendX + 28, legendY + (showDecode && showEncode ? 4 : 0));
        legendY += 25;
    }
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    legendY += 8;
    if (showDecode) ctx.fillText('solid: EOTF/decode', legendX, legendY);
    if (showEncode) ctx.fillText('dashed: OETF/encode', legendX, legendY + (showDecode ? 18 : 0));
    ctx.restore();
}

function renderTransferFormulas(selectedStandards, showDecode, showEncode) {
    if (!transferUI.formulaList) return;
    transferUI.formulaList.replaceChildren();

    if (selectedStandards.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'transfer-formula-empty';
        empty.textContent = '왼쪽 메뉴에서 표준을 선택하면 해당 transfer 함수 수식이 표시됩니다.';
        transferUI.formulaList.appendChild(empty);
        return;
    }

    if (!showDecode && !showEncode) {
        const empty = document.createElement('div');
        empty.className = 'transfer-formula-empty';
        empty.textContent = 'EOTF 또는 OETF 표시 옵션을 켜면 선택된 함수 수식이 표시됩니다.';
        transferUI.formulaList.appendChild(empty);
        return;
    }

    for (const standard of selectedStandards) {
        const card = document.createElement('div');
        card.className = 'transfer-formula-card';
        card.style.setProperty('--formula-accent', standard.color);

        const title = document.createElement('div');
        title.className = 'transfer-formula-title';
        title.textContent = standard.label;
        card.appendChild(title);

        if (showDecode) {
            card.appendChild(createTransferFormulaBlock('EOTF / Decode', standard.decodeLabel, standard.decodeFormula));
        }
        if (showEncode) {
            card.appendChild(createTransferFormulaBlock('OETF / Encode', standard.encodeLabel, standard.encodeFormula));
        }

        transferUI.formulaList.appendChild(card);
    }
}

function createTransferFormulaBlock(modeLabel, functionLabel, formulas = []) {
    const block = document.createElement('div');
    block.className = 'transfer-formula-block';

    const heading = document.createElement('div');
    heading.className = 'transfer-formula-mode';
    heading.textContent = `${modeLabel} · ${functionLabel}`;
    block.appendChild(heading);

    for (const formula of formulas) {
        const line = document.createElement('code');
        line.className = 'transfer-formula-line';
        line.textContent = formula;
        block.appendChild(line);
    }

    return block;
}

function getTransferPeakNits() {
    return transferClampPeakNits(Number(transferUI.peakNits?.value || transferUI.peakNitsRange?.value || 100));
}

function getTransferEffectivePeakNits(standard, displayPeakNits) {
    const referencePeakNits = standard.referencePeakNits || 100;
    return transferHdrStandardKeys.has(standard.key)
        ? Math.min(referencePeakNits, displayPeakNits)
        : referencePeakNits;
}

function syncTransferPeakNits(sourceElement = null) {
    const value = transferClampPeakNits(Number(sourceElement?.value || transferUI.peakNits?.value || transferUI.peakNitsRange?.value || 100));
    if (transferUI.peakNits && transferUI.peakNits !== sourceElement) transferUI.peakNits.value = String(value);
    if (transferUI.peakNitsRange && transferUI.peakNitsRange !== sourceElement) transferUI.peakNitsRange.value = String(value);
    if (sourceElement) sourceElement.value = String(value);
    return value;
}

function syncTransferStandardAvailability() {
    const isNitsAxis = transferUI.axisMode?.value === 'light-code-nits';
    for (const toggle of transferUI.standardToggles) {
        const disabled = isNitsAxis && transferNitsUnsupportedKeys.has(toggle.value);
        toggle.disabled = disabled;
        toggle.closest('label')?.classList.toggle('is-disabled', disabled);
        if (disabled) toggle.checked = false;
    }
}

function drawCameraLogLegend(ctx, standards, plot, theme, mode) {
    const legendX = plot.right + 22;
    let legendY = plot.top + 8;
    ctx.save();
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    for (const standard of standards) {
        const range = getCameraLogRepresentableRange(standard);
        ctx.strokeStyle = standard.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY);
        ctx.lineTo(legendX + 20, legendY);
        ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.fillText(standard.label, legendX + 28, legendY);
        ctx.fillStyle = theme.muted;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(`from ${formatStop(range.minStop)} display floor → ${formatStop(range.maxStop)} stops`, legendX + 28, legendY + 14);
        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        legendY += 36;
    }
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    legendY += 8;
    ctx.fillText(mode === 'encode' ? 'scene stops → code' : 'code → scene stops', legendX, legendY);
    ctx.fillText('0 stop = 18% gray', legendX, legendY + 18);
    ctx.restore();
}

function renderTransferChart() {
    if (!transferUI.canvas) return;
    const canvas = transferUI.canvas;
    const axisMode = transferUI.axisMode?.value || 'input-output';
    const peakNits = getTransferPeakNits();
    const isNitsAxis = axisMode === 'light-code-nits';
    const rect = canvas.getBoundingClientRect();
    const baseWidth = Math.max(720, Math.floor(rect.width || canvas.clientWidth || 960));
    const height = Math.max(420, Math.floor(rect.height || canvas.clientHeight || 520));
    const legendWidth = baseWidth >= 900 ? 190 : 0;
    const plotMargins = {
        left: 76,
        top: 56,
        right: 34 + legendWidth,
        bottom: 66
    };
    const maxPlotHeight = Math.max(260, height - plotMargins.top - plotMargins.bottom);
    const squarePlotSize = Math.min(Math.max(260, baseWidth - plotMargins.left - plotMargins.right), maxPlotHeight);
    const nitsPlotHeight = squarePlotSize;
    const nitsPlotWidth = nitsPlotHeight * getTransferNitsSpan(peakNits);
    const width = isNitsAxis
        ? Math.max(baseWidth, Math.ceil(plotMargins.left + nitsPlotWidth + plotMargins.right))
        : baseWidth;
    const pixelRatio = isNitsAxis ? 1 : Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.style.width = isNitsAxis ? `${width}px` : '';
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const style = getComputedStyle(document.body);
    const theme = {
        text: style.getPropertyValue('--text-main').trim() || '#ffffff',
        muted: style.getPropertyValue('--text-muted').trim() || '#cccccc',
        grid: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
        axis: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.58)',
        background: document.body.classList.contains('theme-day') ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.2)'
    };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    syncTransferStandardAvailability();
    const selectedKeys = new Set(transferUI.standardToggles
        .filter((toggle) => toggle.checked && !toggle.disabled)
        .map((toggle) => toggle.value));
    const selectedStandards = transferStandards.filter((standard) => selectedKeys.has(standard.key));
    const showDecode = !!transferUI.toggleEotf?.checked;
    const showEncode = !!transferUI.toggleOetf?.checked;
    const maxPlotWidth = Math.max(260, width - plotMargins.left - plotMargins.right);
    const plotHeight = isNitsAxis ? nitsPlotHeight : squarePlotSize;
    const plotWidth = isNitsAxis ? nitsPlotWidth : plotHeight;
    const centeredPlotLeft = isNitsAxis
        ? plotMargins.left
        : plotMargins.left + Math.max(0, (maxPlotWidth - plotWidth) / 2);
    const plot = {
        left: centeredPlotLeft,
        top: plotMargins.top,
        right: centeredPlotLeft + plotWidth,
        bottom: plotMargins.top + plotHeight
    };
    plot.width = plot.right - plot.left;
    plot.height = plot.bottom - plot.top;

    drawTransferGrid(ctx, plot, theme, axisMode, peakNits);
    for (const standard of selectedStandards) {
        if (showDecode) drawTransferCurve(ctx, plot, standard, 'decode', false, axisMode, peakNits);
        if (showEncode) drawTransferCurve(ctx, plot, standard, 'encode', true, axisMode, peakNits);
    }

    if (legendWidth > 0) {
        drawTransferLegend(ctx, selectedStandards, plot, theme, showDecode, showEncode);
    }

    ctx.fillStyle = theme.text;
    ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Transfer characteristic: display/delivery comparison', plot.left, 10);

    if (selectedStandards.length === 0 || (!showDecode && !showEncode)) {
        ctx.fillStyle = theme.muted;
        ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('왼쪽 메뉴에서 표시할 표준과 곡선을 선택하세요.', plot.left + plot.width / 2, plot.top + plot.height / 2);
    }

    if (transferUI.mainMeta) {
        const curveCount = (showDecode ? 1 : 0) + (showEncode ? 1 : 0);
        const axisLabel = axisMode === 'light-code-nits'
            ? `light nits → code axes · display peak ${peakNits.toLocaleString()} nits`
            : axisMode === 'light-code'
                ? 'light → code axes'
                : 'input → output axes';
        transferUI.mainMeta.textContent = `${selectedStandards.length} standards · ${curveCount} mode${curveCount === 1 ? '' : 's'} · ${axisLabel}`;
    }

    renderTransferFormulas(selectedStandards, showDecode, showEncode);
    drawTransferAllocationDemo();
}

function scheduleTransferRender() {
    requestAnimationFrame(renderTransferChart);
}

window.scheduleTransferRender = scheduleTransferRender;

function getTransferTheme() {
    const style = getComputedStyle(document.body);
    return {
        text: style.getPropertyValue('--text-main').trim() || '#ffffff',
        muted: style.getPropertyValue('--text-muted').trim() || '#cccccc',
        grid: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
        axis: document.body.classList.contains('theme-day') ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.58)',
        background: document.body.classList.contains('theme-day') ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.2)'
    };
}

function cameraLogSceneLinearToStop(sceneLinear) {
    return Math.log2(Math.max(sceneLinear, 1e-6) / cameraLogGray);
}

function cameraLogStopToSceneLinear(stop) {
    return cameraLogGray * Math.pow(2, stop);
}

function formatStop(stop) {
    if (stop === -Infinity) return '-∞';
    if (stop === Infinity) return '+∞';
    if (!Number.isFinite(stop)) return '—';
    const roundedValue = Math.round(stop * 10) / 10;
    const rounded = Number.isInteger(roundedValue) ? roundedValue.toFixed(0) : roundedValue.toFixed(1);
    return `${stop > 0 ? '+' : ''}${rounded}`;
}

function getCameraLogRepresentableRange(logStandard) {
    if (logStandard.representableRange) return logStandard.representableRange;
    const maxSceneLinear = logStandard.decode(1);
    const minStop = Math.max(cameraLogDisplayFloorStop, cameraLogSceneLinearToStop(Math.max(logStandard.decode(0), cameraLogStopToSceneLinear(cameraLogDisplayFloorStop))));
    logStandard.representableRange = {
        minStop,
        maxStop: Number.isFinite(maxSceneLinear) && maxSceneLinear > 0
            ? cameraLogSceneLinearToStop(maxSceneLinear)
            : cameraLogCompactRange.max,
        zeroCode: logStandard.encode(0),
        maxCode: 1
    };
    return logStandard.representableRange;
}

function getSelectedCameraLogRange(selectedLogs) {
    const selectedMode = cameraLogUI.rangeMode?.value || 'compact';
    if (selectedMode === 'extended') return { ...cameraLogExtendedRange, label: 'Extended' };
    if (selectedMode === 'custom') {
        const minStop = Number(cameraLogUI.minStop?.value ?? cameraLogCompactRange.min);
        const maxStop = Number(cameraLogUI.maxStop?.value ?? cameraLogCompactRange.max);
        return {
            min: Math.min(minStop, maxStop - 1),
            max: Math.max(maxStop, minStop + 1),
            label: 'Custom'
        };
    }
    if (selectedMode === 'auto') {
        const logsForRange = selectedLogs.length ? selectedLogs : transferCameraLogs;
        const ranges = logsForRange.map(getCameraLogRepresentableRange);
        const min = Math.floor(Math.min(...ranges.map((range) => range.minStop)));
        const max = Math.ceil(Math.max(...ranges.map((range) => range.maxStop)));
        return { min, max, label: 'Auto selected log ranges' };
    }
    return { ...cameraLogCompactRange, label: 'Compact' };
}

function updateCameraLogRangeUI(stopRange) {
    if (cameraLogUI.minStop && cameraLogUI.rangeMode?.value !== 'custom') {
        cameraLogUI.minStop.value = String(Math.max(Number(cameraLogUI.minStop.min), Math.min(Number(cameraLogUI.minStop.max), stopRange.min)));
    }
    if (cameraLogUI.maxStop && cameraLogUI.rangeMode?.value !== 'custom') {
        cameraLogUI.maxStop.value = String(Math.max(Number(cameraLogUI.maxStop.min), Math.min(Number(cameraLogUI.maxStop.max), stopRange.max)));
    }
    if (cameraLogUI.minStopValue) cameraLogUI.minStopValue.textContent = formatStop(stopRange.min);
    if (cameraLogUI.maxStopValue) cameraLogUI.maxStopValue.textContent = formatStop(stopRange.max);
    if (cameraLogUI.rangeReadout) {
        cameraLogUI.rangeReadout.textContent = `표시 범위: ${formatStop(stopRange.min)} ~ ${formatStop(stopRange.max)} stops · ${stopRange.label}`;
    }
}

function cameraLogStopToPlotY(stop, plot, stopRange) {
    const ratio = (stop - stopRange.min) / (stopRange.max - stopRange.min);
    return plot.bottom - transferClamp01(ratio) * plot.height;
}

function cameraLogStopToPlotX(stop, plot, stopRange) {
    const ratio = (stop - stopRange.min) / (stopRange.max - stopRange.min);
    return plot.left + transferClamp01(ratio) * plot.width;
}

function drawCameraLogGrid(ctx, plot, theme, mode, stopRange) {
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';

    if (mode === 'encode') {
        for (let stop = Math.ceil(stopRange.min); stop <= Math.floor(stopRange.max); stop += 1) {
            const x = cameraLogStopToPlotX(stop, plot, stopRange);
            ctx.beginPath();
            ctx.moveTo(x, plot.top);
            ctx.lineTo(x, plot.bottom);
            ctx.stroke();
            if (stop % 2 === 0) {
                ctx.textAlign = 'center';
                ctx.fillText(`${stop > 0 ? '+' : ''}${stop}`, x, plot.bottom + 18);
            }
        }
        for (let step = 0; step <= 10; step++) {
            const code = step / 10;
            const y = plot.bottom - code * plot.height;
            ctx.beginPath();
            ctx.moveTo(plot.left, y);
            ctx.lineTo(plot.right, y);
            ctx.stroke();
            if (step % 2 === 0) {
                ctx.textAlign = 'right';
                ctx.fillText(code.toFixed(1), plot.left - 12, y);
            }
        }
    } else {
        for (let step = 0; step <= 10; step++) {
            const code = step / 10;
            const x = plot.left + code * plot.width;
            ctx.beginPath();
            ctx.moveTo(x, plot.top);
            ctx.lineTo(x, plot.bottom);
            ctx.stroke();
            if (step % 2 === 0) {
                ctx.textAlign = 'center';
                ctx.fillText(code.toFixed(1), x, plot.bottom + 18);
            }
        }
        for (let stop = Math.ceil(stopRange.min); stop <= Math.floor(stopRange.max); stop += 1) {
            const y = cameraLogStopToPlotY(stop, plot, stopRange);
            ctx.beginPath();
            ctx.moveTo(plot.left, y);
            ctx.lineTo(plot.right, y);
            ctx.stroke();
            if (stop % 2 === 0) {
                ctx.textAlign = 'right';
                ctx.fillText(`${stop > 0 ? '+' : ''}${stop}`, plot.left - 12, y);
            }
        }
    }

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.top);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.stroke();

    ctx.strokeStyle = theme.axis;
    ctx.setLineDash([5, 5]);
    if (mode === 'encode' && stopRange.min <= 0 && stopRange.max >= 0) {
        const zeroStopX = cameraLogStopToPlotX(0, plot, stopRange);
        ctx.beginPath();
        ctx.moveTo(zeroStopX, plot.top);
        ctx.lineTo(zeroStopX, plot.bottom);
        ctx.stroke();
    } else if (mode === 'decode' && stopRange.min <= 0 && stopRange.max >= 0) {
        const zeroStopY = cameraLogStopToPlotY(0, plot, stopRange);
        ctx.beginPath();
        ctx.moveTo(plot.left, zeroStopY);
        ctx.lineTo(plot.right, zeroStopY);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = theme.text;
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(mode === 'encode' ? 'scene exposure stops relative to 18% gray' : 'camera log code value', plot.left + plot.width / 2, plot.bottom + 40);
    ctx.save();
    ctx.translate(plot.left - 52, plot.top + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(mode === 'encode' ? 'camera log code value' : 'scene exposure stops', 0, 0);
    ctx.restore();
    ctx.restore();
}

function drawCameraLogCurve(ctx, plot, logStandard, mode, stopRange) {
    const sampleCount = 260;
    const logRange = getCameraLogRepresentableRange(logStandard);
    let isDrawing = false;
    ctx.save();
    ctx.strokeStyle = logStandard.color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let index = 0; index <= sampleCount; index++) {
        let x;
        let y;
        if (mode === 'encode') {
            const stop = stopRange.min + (index / sampleCount) * (stopRange.max - stopRange.min);
            if (stop < logRange.minStop || stop > logRange.maxStop) {
                isDrawing = false;
                continue;
            }
            const code = logStandard.encode(cameraLogStopToSceneLinear(stop));
            if (!Number.isFinite(code) || code < 0 || code > 1) {
                isDrawing = false;
                continue;
            }
            x = cameraLogStopToPlotX(stop, plot, stopRange);
            y = plot.bottom - code * plot.height;
        } else {
            const code = index / sampleCount;
            const stop = cameraLogSceneLinearToStop(logStandard.decode(code));
            if (!Number.isFinite(stop) || stop < stopRange.min || stop > stopRange.max) {
                isDrawing = false;
                continue;
            }
            x = plot.left + code * plot.width;
            y = cameraLogStopToPlotY(stop, plot, stopRange);
        }
        if (!isDrawing) {
            ctx.moveTo(x, y);
            isDrawing = true;
        }
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawCameraLogEndpointMarkers(ctx, plot, selectedLogs, mode, stopRange, theme) {
    ctx.save();
    ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    for (const logStandard of selectedLogs) {
        const range = getCameraLogRepresentableRange(logStandard);
        const markers = mode === 'encode'
            ? [
                { stop: range.minStop, code: logStandard.encode(cameraLogStopToSceneLinear(range.minStop)), label: 'start' },
                { stop: range.maxStop, code: logStandard.encode(cameraLogStopToSceneLinear(range.maxStop)), label: 'end' }
            ]
            : [
                { stop: range.minStop, code: logStandard.encode(cameraLogStopToSceneLinear(range.minStop)), label: 'start' },
                { stop: range.maxStop, code: range.maxCode, label: 'end' }
            ];

        for (const marker of markers) {
            if (marker.stop < stopRange.min || marker.stop > stopRange.max) continue;
            if (!Number.isFinite(marker.code) || marker.code < 0 || marker.code > 1) continue;
            const x = mode === 'encode'
                ? cameraLogStopToPlotX(marker.stop, plot, stopRange)
                : plot.left + marker.code * plot.width;
            const y = mode === 'encode'
                ? plot.bottom - marker.code * plot.height
                : cameraLogStopToPlotY(marker.stop, plot, stopRange);
            ctx.fillStyle = logStandard.color;
            ctx.strokeStyle = theme.background;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.restore();
}

function renderCameraLogChart() {
    if (!cameraLogUI.canvas) return;
    const canvas = cameraLogUI.canvas;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(720, Math.floor(rect.width || canvas.clientWidth || 960));
    const height = Math.max(420, Math.floor(rect.height || canvas.clientHeight || 520));
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const theme = getTransferTheme();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    const selectedKeys = new Set(cameraLogUI.logToggles.filter((toggle) => toggle.checked).map((toggle) => toggle.value));
    const selectedLogs = transferCameraLogs.filter((standard) => selectedKeys.has(standard.key));
    const selectedMode = cameraLogUI.modeToggles.find((toggle) => toggle.checked)?.value || 'encode';
    const stopRange = getSelectedCameraLogRange(selectedLogs);
    updateCameraLogRangeUI(stopRange);
    const legendWidth = width >= 900 ? 190 : 0;
    const plot = {
        left: 82,
        top: 46,
        right: width - 34 - legendWidth,
        bottom: height - 78
    };
    plot.width = plot.right - plot.left;
    plot.height = plot.bottom - plot.top;

    drawCameraLogGrid(ctx, plot, theme, selectedMode, stopRange);
    for (const logStandard of selectedLogs) {
        drawCameraLogCurve(ctx, plot, logStandard, selectedMode, stopRange);
    }
    drawCameraLogEndpointMarkers(ctx, plot, selectedLogs, selectedMode, stopRange, theme);
    if (legendWidth > 0) {
        drawCameraLogLegend(ctx, selectedLogs, plot, theme, selectedMode);
    }

    ctx.fillStyle = theme.text;
    ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(selectedMode === 'encode'
        ? 'Camera Log: scene exposure stops → code value'
        : 'Camera Log: code value → scene exposure stops', plot.left, 10);
    ctx.fillStyle = theme.muted;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('18% gray = 0 stop · display brightness/nits conversion is intentionally not shown here.', plot.left, 29);

    if (selectedLogs.length === 0) {
        ctx.fillStyle = theme.muted;
        ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('왼쪽 메뉴에서 표시할 카메라 로그를 선택하세요.', plot.left + plot.width / 2, plot.top + plot.height / 2);
    }

    if (cameraLogUI.mainMeta) {
        cameraLogUI.mainMeta.textContent = `${selectedLogs.length} camera logs · ${formatStop(stopRange.min)}~${formatStop(stopRange.max)} stops · ${selectedMode === 'encode' ? 'stops → code' : 'code → stops'}`;
    }
}

function scheduleCameraLogRender() {
    requestAnimationFrame(renderCameraLogChart);
}

window.scheduleCameraLogRender = scheduleCameraLogRender;

[
    transferUI.toggleEotf,
    transferUI.toggleOetf,
    transferUI.axisMode,
    ...transferUI.standardToggles
].filter(Boolean).forEach((element) => {
    element.addEventListener('input', scheduleTransferRender);
    element.addEventListener('change', scheduleTransferRender);
});

[transferUI.peakNits, transferUI.peakNitsRange].filter(Boolean).forEach((element) => {
    element.addEventListener('input', () => {
        syncTransferPeakNits(element);
        scheduleTransferRender();
    });
    element.addEventListener('change', () => {
        syncTransferPeakNits(element);
        scheduleTransferRender();
    });
});

[
    ...cameraLogUI.modeToggles,
    ...cameraLogUI.logToggles,
    cameraLogUI.rangeMode,
    cameraLogUI.minStop,
    cameraLogUI.maxStop
].filter(Boolean).forEach((element) => {
    element.addEventListener('input', scheduleCameraLogRender);
    element.addEventListener('change', scheduleCameraLogRender);
});

[cameraLogUI.minStop, cameraLogUI.maxStop].filter(Boolean).forEach((element) => {
    element.addEventListener('input', () => {
        if (cameraLogUI.rangeMode) cameraLogUI.rangeMode.value = 'custom';
        scheduleCameraLogRender();
    });
});

window.addEventListener('resize', () => {
    scheduleTransferRender();
    scheduleCameraLogRender();
});
scheduleTransferRender();
scheduleCameraLogRender();
