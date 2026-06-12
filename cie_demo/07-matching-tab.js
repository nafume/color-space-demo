// --------------------------------------------------------
// 8.5 Color Matching 탭 (실험 시뮬레이션 + CMF 그래프)
// --------------------------------------------------------
const matchingUI = {
    mainMeta: document.getElementById('matching-main-meta'),
    selectedSwatch: document.getElementById('matching-selected-swatch'),
    selectedTitle: document.getElementById('matching-selected-title'),
    selectedNote: document.getElementById('matching-selected-note'),
    wavelength: document.getElementById('matching-wavelength'),
    autoSolve: document.getElementById('matching-auto-solve'),
    r: document.getElementById('matching-r'),
    g: document.getElementById('matching-g'),
    b: document.getElementById('matching-b'),
    rLabel: document.getElementById('matching-r-label'),
    gLabel: document.getElementById('matching-g-label'),
    bLabel: document.getElementById('matching-b-label'),
    rWavelength: document.getElementById('matching-r-wavelength'),
    gWavelength: document.getElementById('matching-g-wavelength'),
    bWavelength: document.getElementById('matching-b-wavelength'),
    rValue: document.getElementById('matching-r-value'),
    gValue: document.getElementById('matching-g-value'),
    bValue: document.getElementById('matching-b-value'),
    allowNegative: document.getElementById('matching-allow-negative'),
    allowNegativeLabel: document.getElementById('matching-allow-negative-label'),
    snap: document.getElementById('matching-snap'),
    recordCoeffs: document.getElementById('matching-record-coeffs'),
    resetCoeffs: document.getElementById('matching-reset-coeffs'),
    savedCoeffs: document.getElementById('matching-saved-coeffs'),
    errorValue: document.getElementById('matching-error-value'),
    hint: document.getElementById('matching-hint'),
    patchCanvas: document.getElementById('matching-patch-canvas'),
    graphCanvas: document.getElementById('matching-graph-canvas'),
    cmfView: document.getElementById('matching-cmf-view'),
    luminousEfficiency: document.getElementById('matching-luminous-efficiency'),
    showCmf: document.getElementById('matching-show-cmf'),
    rgbPrimaryWavelengths: document.getElementById('matching-rgb-primary-wavelengths')
};

const matchingCmf = (() => {
    const count = MATCHING_LAMBDA_MAX - MATCHING_LAMBDA_MIN + 1;
    const x = new Float32Array(count);
    const y = new Float32Array(count);
    const z = new Float32Array(count);
    const r = new Float32Array(count);
    const g = new Float32Array(count);
    const b = new Float32Array(count);

    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    let zMin = Infinity, zMax = -Infinity;
    let rMin = Infinity, rMax = -Infinity;
    let gMin = Infinity, gMax = -Infinity;
    let bMin = Infinity, bMax = -Infinity;

    for (let idx = 0; idx < count; idx++) {
        const lambda = MATCHING_LAMBDA_MIN + idx;
        const xyz = wavelengthToXYZ(lambda);
        x[idx] = xyz.x; y[idx] = xyz.y; z[idx] = xyz.z;
        xMin = Math.min(xMin, xyz.x); xMax = Math.max(xMax, xyz.x);
        yMin = Math.min(yMin, xyz.y); yMax = Math.max(yMax, xyz.y);
        zMin = Math.min(zMin, xyz.z); zMax = Math.max(zMax, xyz.z);

        const rgb = XYZ_TO_CIE_RGB ? mat3MulVec3(XYZ_TO_CIE_RGB, [xyz.x, xyz.y, xyz.z]) : [0, 0, 0];
        r[idx] = rgb[0]; g[idx] = rgb[1]; b[idx] = rgb[2];
        rMin = Math.min(rMin, rgb[0]); rMax = Math.max(rMax, rgb[0]);
        gMin = Math.min(gMin, rgb[1]); gMax = Math.max(gMax, rgb[1]);
        bMin = Math.min(bMin, rgb[2]); bMax = Math.max(bMax, rgb[2]);
    }

    return {
        count,
        x, y, z,
        r, g, b,
        range: {
            xMin, xMax, yMin, yMax, zMin, zMax,
            rMin, rMax, gMin, gMax, bMin, bMax
        }
    };
})();

const matchingState = {
    isActive: false,
    wavelengthNm: parseFloat(matchingUI.wavelength.value),
    autoSolve: matchingUI.autoSolve.checked,
    allowNegative: matchingUI.allowNegative.checked,
    coeffR: 0,
    coeffG: 0,
    coeffB: 0,
    cmfView: matchingUI.cmfView.value,
    showLuminousEfficiency: matchingUI.luminousEfficiency.checked,
    showCmf: matchingUI.showCmf.checked,
    showRgbPrimaryWavelengths: matchingUI.rgbPrimaryWavelengths.checked,
    savedCoeffSnapshots: [],
    needsRender: true
};

const cieRgbXYZGroup = new THREE.Group();
cieRgbXYZGroup.visible = xyzTransformUI.toggle.checked;
groupXYZ.add(cieRgbXYZGroup);

function formatWavelengthNm(wavelength) {
    return `${wavelength.toFixed(wavelength % 1 === 0 ? 0 : 1)} nm`;
}

function formatPrimaryWavelengthNm(wavelength) {
    return `${wavelength.toFixed(1)} nm`;
}

function withAlpha(color, alpha) {
    const parts = color.match(/rgba?\(([^)]+)\)/)?.[1]?.split(',').map(part => part.trim());
    if (!parts || parts.length < 3) return color;
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function clearThreeGroup(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child.geometry) child.geometry.dispose?.();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose?.());
            else child.material.dispose?.();
        }
    }
}

function createLine(points, material) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, material);
    if (line.computeLineDistances && material instanceof THREE.LineDashedMaterial) {
        line.computeLineDistances();
    }
    return line;
}

function updateCieRgbXYZDecomposition() {
    clearThreeGroup(cieRgbXYZGroup);

    const lambda = matchingState.wavelengthNm;
    if (xyzTransformUI.wavelength) xyzTransformUI.wavelength.value = String(Math.round(lambda));
    if (xyzTransformUI.wavelengthValue) xyzTransformUI.wavelengthValue.textContent = `${Math.round(lambda)} nm`;

    const rgb = getIdealRGB(lambda);
    const isRgbBasisMode = getXYZCoordinateMode() === 'rgb';
    if (xyzTransformUI.hint) {
        xyzTransformUI.hint.textContent = isRgbBasisMode
            ? '같은 단색광을 RGB 직교 좌표계에서 r̄, ḡ, b̄ 좌표로 보고, XYZ 기저축이 어떻게 기울어지는지 보여줍니다.'
            : 'r̄M_R + ḡM_G + b̄M_B = [X, Y, Z] 를 XYZ 직교 좌표계에서 분해해 보여줍니다.';
    }
    if (xyzTransformUI.coeffs) {
        xyzTransformUI.coeffs.textContent =
            `r̄=${formatSigned(rgb.R)}, ḡ=${formatSigned(rgb.G)}, b̄=${formatSigned(rgb.B)}`;
    }
    const displayScale = getXYZModeDisplayScale();
    const matrixColumns = isRgbBasisMode
        ? [
            new THREE.Vector3(displayScale, 0, 0),
            new THREE.Vector3(0, displayScale, 0),
            new THREE.Vector3(0, 0, displayScale)
        ]
        : [
            vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 0).multiplyScalar(displayScale),
            vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 1).multiplyScalar(displayScale),
            vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 2).multiplyScalar(displayScale)
        ];
    const basisColors = [CMF_AXIS_COLORS.RGB.R, CMF_AXIS_COLORS.RGB.G, CMF_AXIS_COLORS.RGB.B];
    const basisLabels = isRgbBasisMode ? ['R', 'G', 'B'] : ['M_R', 'M_G', 'M_B'];
    const coeffs = [rgb.R, rgb.G, rgb.B];

    matrixColumns.forEach((column, index) => {
        const basisLine = createLine(
            [new THREE.Vector3(0, 0, 0), column.clone()],
            new THREE.LineDashedMaterial({ color: basisColors[index], dashSize: 0.035, gapSize: 0.02, transparent: true, opacity: 0.35 })
        );
        cieRgbXYZGroup.add(basisLine);

        const basisLabel = createTextSprite(basisLabels[index], `#${basisColors[index].toString(16).padStart(6, '0')}`);
        basisLabel.position.copy(column).multiplyScalar(1.04);
        basisLabel.scale.multiplyScalar(0.72);
        cieRgbXYZGroup.add(basisLabel);
    });

    const contributionVectors = coeffs.map((coeff, index) => matrixColumns[index].clone().multiplyScalar(coeff));
    const origin = new THREE.Vector3(0, 0, 0);
    const p1 = contributionVectors[0].clone();
    const p2 = p1.clone().add(contributionVectors[1]);
    const p3 = p2.clone().add(contributionVectors[2]);

    const chainPoints = [origin, p1, p2, p3];
    for (let index = 0; index < 3; index++) {
        cieRgbXYZGroup.add(createLine(
            [chainPoints[index], chainPoints[index + 1]],
            new THREE.LineBasicMaterial({ color: basisColors[index], transparent: true, opacity: 0.95 })
        ));
    }

    [p1, p2].forEach((point, index) => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 16, 12),
            new THREE.MeshBasicMaterial({ color: basisColors[index] })
        );
        mesh.position.copy(point);
        cieRgbXYZGroup.add(mesh);
    });

    const targetXYZ = wavelengthToXYZ(lambda);
    const xyzColor = XYZtosRGB(targetXYZ.x, targetXYZ.y, targetXYZ.z);
    const totalPoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 18, 14),
        new THREE.MeshBasicMaterial({ color: xyzColor })
    );
    totalPoint.position.copy(p3);
    cieRgbXYZGroup.add(totalPoint);

    cieRgbXYZGroup.add(createLine(
        [origin, p3.clone()],
        new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.03, gapSize: 0.02, transparent: true, opacity: 0.55 })
    ));

    const totalLabel = createTextSprite(`${isRgbBasisMode ? 'RGB' : 'XYZ'} @ ${Math.round(lambda)}nm`, '#ffffff');
    totalLabel.position.copy(p3).add(new THREE.Vector3(0.05, 0.05, 0.05));
    totalLabel.scale.multiplyScalar(0.8);
    cieRgbXYZGroup.add(totalLabel);
}

function isXYZMatchingMode() {
    return matchingState.cmfView === 'xyz';
}

function getIdealMatchingCoeffs(lambda) {
    if (isXYZMatchingMode()) {
        const target = getTargetXYZ(lambda);
        return { R: target.X, G: target.Y, B: target.Z };
    }
    return getIdealRGB(lambda);
}

const matchingSliderFullRange = {
    r: { min: matchingCmf.range.rMin, max: matchingCmf.range.rMax },
    g: { min: matchingCmf.range.gMin, max: matchingCmf.range.gMax },
    b: { min: matchingCmf.range.bMin, max: matchingCmf.range.bMax }
};

function setRangeWithMargin(slider, min, max) {
    const span = Math.max(1e-6, max - min);
    const margin = span * 0.15 + 0.01;
    slider.min = (min - margin).toFixed(4);
    slider.max = (max + margin).toFixed(4);
}

function setPositiveRangeWithMargin(slider, max) {
    const safeMax = Math.max(0.0001, max);
    slider.min = '0';
    slider.max = (safeMax + safeMax * 0.08 + 0.01).toFixed(4);
}

function applyMatchingModeControls() {
    const xyzMode = isXYZMatchingMode();
    matchingUI.rLabel.textContent = xyzMode ? 'X' : 'R';
    matchingUI.gLabel.textContent = xyzMode ? 'Y' : 'G';
    matchingUI.bLabel.textContent = xyzMode ? 'Z' : 'B';

    [matchingUI.rWavelength, matchingUI.gWavelength, matchingUI.bWavelength].forEach((label, index) => {
        if (!label) return;
        label.textContent = xyzMode ? '' : `(${formatPrimaryWavelengthNm(CIE_RGB_PRIMARIES[index].wavelength)})`;
        label.style.display = xyzMode ? 'none' : '';
    });

    const sliderColors = xyzMode
        ? [CMF_GRAPH_COLORS.XYZ_CMF.X, CMF_GRAPH_COLORS.XYZ_CMF.Y, CMF_GRAPH_COLORS.XYZ_CMF.Z]
        : [CMF_GRAPH_COLORS.RGB_CMF.R, CMF_GRAPH_COLORS.RGB_CMF.G, CMF_GRAPH_COLORS.RGB_CMF.B];
    [matchingUI.r, matchingUI.g, matchingUI.b].forEach((slider, index) => {
        slider.style.setProperty('--range-color', sliderColors[index]);
        slider.style.accentColor = sliderColors[index];
    });

    if (xyzMode) {
        matchingState.allowNegative = false;
        matchingUI.allowNegative.checked = false;
    }
    matchingUI.allowNegative.disabled = xyzMode;
    matchingUI.allowNegativeLabel.style.opacity = xyzMode ? '0.48' : '';
    matchingUI.allowNegativeLabel.title = xyzMode ? 'XYZ CMF는 음수 계수 없이 정의됩니다.' : '';
}

function applyMatchingSliderRanges() {
    if (!matchingUI.r || !matchingUI.g || !matchingUI.b) return;
    applyMatchingModeControls();
    if (isXYZMatchingMode()) {
        setPositiveRangeWithMargin(matchingUI.r, matchingCmf.range.xMax);
        setPositiveRangeWithMargin(matchingUI.g, matchingCmf.range.yMax);
        setPositiveRangeWithMargin(matchingUI.b, matchingCmf.range.zMax);
        matchingState.coeffR = Math.max(0, matchingState.coeffR);
        matchingState.coeffG = Math.max(0, matchingState.coeffG);
        matchingState.coeffB = Math.max(0, matchingState.coeffB);
        matchingUI.r.value = String(matchingState.coeffR);
        matchingUI.g.value = String(matchingState.coeffG);
        matchingUI.b.value = String(matchingState.coeffB);
        return;
    }
    if (matchingState.allowNegative) {
        setRangeWithMargin(matchingUI.r, matchingSliderFullRange.r.min, matchingSliderFullRange.r.max);
        setRangeWithMargin(matchingUI.g, matchingSliderFullRange.g.min, matchingSliderFullRange.g.max);
        setRangeWithMargin(matchingUI.b, matchingSliderFullRange.b.min, matchingSliderFullRange.b.max);
    } else {
        matchingUI.r.min = '0'; matchingUI.g.min = '0'; matchingUI.b.min = '0';
        matchingUI.r.max = Math.max(0.0001, matchingSliderFullRange.r.max).toFixed(4);
        matchingUI.g.max = Math.max(0.0001, matchingSliderFullRange.g.max).toFixed(4);
        matchingUI.b.max = Math.max(0.0001, matchingSliderFullRange.b.max).toFixed(4);
        matchingState.coeffR = Math.max(0, matchingState.coeffR);
        matchingState.coeffG = Math.max(0, matchingState.coeffG);
        matchingState.coeffB = Math.max(0, matchingState.coeffB);
    }

    matchingUI.r.value = String(matchingState.coeffR);
    matchingUI.g.value = String(matchingState.coeffG);
    matchingUI.b.value = String(matchingState.coeffB);
}

function getTargetXYZ(lambda) {
    const xyz = wavelengthToXYZ(lambda);
    return { X: xyz.x, Y: xyz.y, Z: xyz.z };
}

function getIdealRGB(lambda) {
    if (!XYZ_TO_CIE_RGB) return { R: 0, G: 0, B: 0 };
    const t = wavelengthToXYZ(lambda);
    const rgb = mat3MulVec3(XYZ_TO_CIE_RGB, [t.x, t.y, t.z]);
    return { R: rgb[0], G: rgb[1], B: rgb[2] };
}

function setMatchingCoeffs({ R, G, B }, syncUI = true) {
    matchingState.coeffR = R;
    matchingState.coeffG = G;
    matchingState.coeffB = B;
    if (isXYZMatchingMode() || !matchingState.allowNegative) {
        matchingState.coeffR = Math.max(0, matchingState.coeffR);
        matchingState.coeffG = Math.max(0, matchingState.coeffG);
        matchingState.coeffB = Math.max(0, matchingState.coeffB);
    }
    if (syncUI) {
        matchingUI.r.value = String(matchingState.coeffR);
        matchingUI.g.value = String(matchingState.coeffG);
        matchingUI.b.value = String(matchingState.coeffB);
    }
    matchingState.needsRender = true;
}

function getCurrentMatchingCoeffs() {
    return {
        R: matchingState.coeffR,
        G: matchingState.coeffG,
        B: matchingState.coeffB,
        wavelengthNm: matchingState.wavelengthNm
    };
}

function formatMatchingCoeffSnapshots(snapshots) {
    if (!snapshots || snapshots.length === 0) return '기록값: 없음';
    const latest = snapshots[snapshots.length - 1];
    const labels = isXYZMatchingMode() ? ['X', 'Y', 'Z'] : ['R', 'G', 'B'];
    return `기록 ${snapshots.length}개 · 최근: λ ${Math.round(latest.wavelengthNm)} nm · ${labels[0]} ${latest.R.toFixed(4)} · ${labels[1]} ${latest.G.toFixed(4)} · ${labels[2]} ${latest.B.toFixed(4)}`;
}

function syncMatchingSavedCoeffControls() {
    if (matchingUI.savedCoeffs) {
        matchingUI.savedCoeffs.textContent = formatMatchingCoeffSnapshots(matchingState.savedCoeffSnapshots);
    }
    if (matchingUI.resetCoeffs) {
        matchingUI.resetCoeffs.disabled = matchingState.savedCoeffSnapshots.length === 0;
    }
}

function formatSigned(v) {
    const s = v >= 0 ? '+' : '−';
    return `${s}${Math.abs(v).toFixed(4)}`;
}

function resizeCanvasToDisplaySize(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function xyzToLinearSRGB(X, Y, Z) {
    return [
        3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
        -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
        0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
    ];
}

function compandSRGB(v) {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function linearToByte(v) {
    const srgb = compandSRGB(Math.max(0, v));
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
}

function computeMatchingPatchDisplayExposure() {
    let maxLinear = 1e-6;

    const includeXYZ = (X, Y, Z) => {
        const linear = xyzToLinearSRGB(X, Y, Z);
        maxLinear = Math.max(maxLinear, linear[0], linear[1], linear[2]);
    };

    for (let lambda = MATCHING_LAMBDA_MIN; lambda <= MATCHING_LAMBDA_MAX; lambda += 1) {
        const target = getTargetXYZ(lambda);
        const ideal = getIdealRGB(lambda);
        const pos = { R: Math.max(0, ideal.R), G: Math.max(0, ideal.G), B: Math.max(0, ideal.B) };
        const neg = { R: Math.max(0, -ideal.R), G: Math.max(0, -ideal.G), B: Math.max(0, -ideal.B) };

        includeXYZ(target.X, target.Y, target.Z);
        includeXYZ(
            target.X + CIE_RGB_TO_XYZ[0][0] * neg.R + CIE_RGB_TO_XYZ[0][1] * neg.G + CIE_RGB_TO_XYZ[0][2] * neg.B,
            target.Y + CIE_RGB_TO_XYZ[1][0] * neg.R + CIE_RGB_TO_XYZ[1][1] * neg.G + CIE_RGB_TO_XYZ[1][2] * neg.B,
            target.Z + CIE_RGB_TO_XYZ[2][0] * neg.R + CIE_RGB_TO_XYZ[2][1] * neg.G + CIE_RGB_TO_XYZ[2][2] * neg.B
        );
        includeXYZ(
            CIE_RGB_TO_XYZ[0][0] * pos.R + CIE_RGB_TO_XYZ[0][1] * pos.G + CIE_RGB_TO_XYZ[0][2] * pos.B,
            CIE_RGB_TO_XYZ[1][0] * pos.R + CIE_RGB_TO_XYZ[1][1] * pos.G + CIE_RGB_TO_XYZ[1][2] * pos.B,
            CIE_RGB_TO_XYZ[2][0] * pos.R + CIE_RGB_TO_XYZ[2][1] * pos.G + CIE_RGB_TO_XYZ[2][2] * pos.B
        );
    }

    return 1 / maxLinear;
}

const MATCHING_PATCH_DISPLAY_EXPOSURE = computeMatchingPatchDisplayExposure();

function spectralXYZToDisplayRGBBytes(X, Y, Z) {
    let [r, g, b] = xyzToLinearSRGB(X, Y, Z);
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);

    const maxRGB = Math.max(r, g, b, 1e-6);
    r /= maxRGB;
    g /= maxRGB;
    b /= maxRGB;

    return [
        linearToByte(r),
        linearToByte(g),
        linearToByte(b)
    ];
}

function computeMatchingXYZ() {
    const target = getTargetXYZ(matchingState.wavelengthNm);

    const coeff = {
        R: matchingState.coeffR,
        G: matchingState.coeffG,
        B: matchingState.coeffB
    };
    if (isXYZMatchingMode()) {
        coeff.R = Math.max(0, coeff.R);
        coeff.G = Math.max(0, coeff.G);
        coeff.B = Math.max(0, coeff.B);

        const left = { X: target.X, Y: target.Y, Z: target.Z };
        const right = { X: coeff.R, Y: coeff.G, Z: coeff.B };
        const reconstructed = { ...right };
        const dx = left.X - right.X;
        const dy = left.Y - right.Y;
        const dz = left.Z - right.Z;
        const err = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return { target, left, right, reconstructed, err, coeff };
    }

    if (!matchingState.allowNegative) {
        coeff.R = Math.max(0, coeff.R);
        coeff.G = Math.max(0, coeff.G);
        coeff.B = Math.max(0, coeff.B);
    }

    const pos = { R: Math.max(0, coeff.R), G: Math.max(0, coeff.G), B: Math.max(0, coeff.B) };
    const neg = { R: Math.max(0, -coeff.R), G: Math.max(0, -coeff.G), B: Math.max(0, -coeff.B) };

    const left = {
        X: target.X + CIE_RGB_TO_XYZ[0][0] * neg.R + CIE_RGB_TO_XYZ[0][1] * neg.G + CIE_RGB_TO_XYZ[0][2] * neg.B,
        Y: target.Y + CIE_RGB_TO_XYZ[1][0] * neg.R + CIE_RGB_TO_XYZ[1][1] * neg.G + CIE_RGB_TO_XYZ[1][2] * neg.B,
        Z: target.Z + CIE_RGB_TO_XYZ[2][0] * neg.R + CIE_RGB_TO_XYZ[2][1] * neg.G + CIE_RGB_TO_XYZ[2][2] * neg.B
    };

    const right = {
        X: CIE_RGB_TO_XYZ[0][0] * pos.R + CIE_RGB_TO_XYZ[0][1] * pos.G + CIE_RGB_TO_XYZ[0][2] * pos.B,
        Y: CIE_RGB_TO_XYZ[1][0] * pos.R + CIE_RGB_TO_XYZ[1][1] * pos.G + CIE_RGB_TO_XYZ[1][2] * pos.B,
        Z: CIE_RGB_TO_XYZ[2][0] * pos.R + CIE_RGB_TO_XYZ[2][1] * pos.G + CIE_RGB_TO_XYZ[2][2] * pos.B
    };

    const reconstructed = {
        X: CIE_RGB_TO_XYZ[0][0] * coeff.R + CIE_RGB_TO_XYZ[0][1] * coeff.G + CIE_RGB_TO_XYZ[0][2] * coeff.B,
        Y: CIE_RGB_TO_XYZ[1][0] * coeff.R + CIE_RGB_TO_XYZ[1][1] * coeff.G + CIE_RGB_TO_XYZ[1][2] * coeff.B,
        Z: CIE_RGB_TO_XYZ[2][0] * coeff.R + CIE_RGB_TO_XYZ[2][1] * coeff.G + CIE_RGB_TO_XYZ[2][2] * coeff.B
    };

    const dx = left.X - right.X;
    const dy = left.Y - right.Y;
    const dz = left.Z - right.Z;
    const err = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return { target, left, right, reconstructed, err, coeff };
}

function linearRgbToMatchingDisplayBytes(linearRgb) {
    const exposure = MATCHING_PATCH_DISPLAY_EXPOSURE;
    return [
        linearToByte(linearRgb[0] * exposure),
        linearToByte(linearRgb[1] * exposure),
        linearToByte(linearRgb[2] * exposure)
    ];
}

const MATCHING_PRIMARY_OVERLAYS = [
    { key: 'R', label: '+R', color: [255, 64, 64] },
    { key: 'G', label: '+G', color: [64, 255, 64] },
    { key: 'B', label: '+B', color: [80, 145, 255] }
];

function getNegativePrimaryStates(coeff, ideal) {
    return MATCHING_PRIMARY_OVERLAYS
        .map(primary => {
            const targetAmount = Math.max(0, -ideal[primary.key]);
            const currentAmount = Math.max(0, -coeff[primary.key]);
            const progress = targetAmount > 1e-5 ? Math.min(1, currentAmount / targetAmount) : (currentAmount > 1e-5 ? 1 : 0);
            const residual = targetAmount > 1e-5 ? 1 - progress : 0;
            return { ...primary, currentAmount, targetAmount, progress, residual };
        })
        .filter(primary => primary.currentAmount > 1e-5 || primary.targetAmount > 1e-5);
}

function getNegativePrimaryImpactPoint(circleCenter, circleRadius) {
    return {
        x: circleCenter.x - circleRadius * 0.5,
        y: circleCenter.y + circleRadius * 0.32
    };
}

function drawNegativePrimaryGuide(ctx, circleCenter, circleRadius, primaryStates, impactPoint) {
    if (!primaryStates.length) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.rect(circleCenter.x - circleRadius, circleCenter.y - circleRadius, circleRadius, circleRadius * 2);
    ctx.clip();

    primaryStates.forEach((primary, index) => {
        const [r, g, b] = primary.color;
        const targetRadius = circleRadius * 0.42;
        const ringRadius = circleRadius * (0.12 + 0.3 * primary.progress);
        const ringOffset = (index - (primaryStates.length - 1) / 2) * circleRadius * 0.08;
        const ringX = impactPoint.x + ringOffset;
        const ringY = impactPoint.y + ringOffset * 0.55;
        const alpha = 0.2 + 0.62 * Math.max(primary.progress, primary.residual * 0.45);

        ctx.globalCompositeOperation = 'source-over';
        if (primary.residual > 0.02) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.16 + 0.22 * primary.residual})`;
            ctx.lineWidth = Math.max(2, circleRadius * 0.018);
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(ringX, ringY, targetRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = Math.max(3, circleRadius * 0.042);
        ctx.beginPath();
        ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

function drawFlashlightIcon(ctx, x, y, size, angle, color, strength) {
    const [r, g, b] = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = size * 0.08;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.strokeStyle = 'rgba(20, 20, 24, 0.72)';
    ctx.lineWidth = Math.max(1.2, size * 0.045);
    ctx.beginPath();
    ctx.roundRect(-size * 1.54, -size * 0.17, size * 1.16, size * 0.34, size * 0.16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(62, 62, 70, 0.5)';
    ctx.beginPath();
    ctx.roundRect(-size * 1.18, -size * 0.055, size * 0.48, size * 0.11, size * 0.05);
    ctx.fill();

    ctx.fillStyle = 'rgba(42, 42, 48, 0.82)';
    ctx.beginPath();
    ctx.roundRect(-size * 1.72, -size * 0.14, size * 0.28, size * 0.28, size * 0.09);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeStyle = 'rgba(20, 20, 24, 0.74)';
    ctx.lineWidth = Math.max(1.4, size * 0.048);
    ctx.beginPath();
    ctx.roundRect(-size * 0.46, -size * 0.40, size * 0.92, size * 0.80, size * 0.22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(74, 74, 82, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.44, size * 0.38);
    ctx.lineTo(size * 0.42, size * 0.38);
    ctx.lineTo(size * 0.42, size * 0.02);
    ctx.lineTo(-size * 0.15, -size * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + 0.35 * strength})`;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)';
    ctx.lineWidth = Math.max(1, size * 0.032);
    ctx.beginPath();
    ctx.roundRect(size * 0.36, -size * 0.25, size * 0.22, size * 0.50, size * 0.10);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.45 + 0.4 * strength})`;
    ctx.lineWidth = Math.max(1.4, size * 0.05);
    [
        [size * 0.68, -size * 0.34, size * 1.08, -size * 0.68],
        [size * 0.78, 0, size * 1.26, 0],
        [size * 0.68, size * 0.34, size * 1.08, size * 0.68]
    ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });

    ctx.restore();
}

function drawNegativePrimaryLights(ctx, circleCenter, circleRadius, primaryStates) {
    if (!primaryStates.length) return;

    const lampSize = Math.max(20, circleRadius * 0.28);
    const impactPoint = getNegativePrimaryImpactPoint(circleCenter, circleRadius);
    const targetX = impactPoint.x;
    const targetY = impactPoint.y;
    const lampDistance = circleRadius * 0.82;
    const lampX = targetX - lampDistance;
    const lampY = targetY + lampDistance;
    const angle = -Math.PI / 4;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const normalX = -directionY;
    const normalY = directionX;

    ctx.save();
    primaryStates.forEach((primary, index) => {
        const [r, g, b] = primary.color;
        const offset = (index - (primaryStates.length - 1) / 2) * lampSize * 0.14;
        const localLampX = lampX + offset;
        const localLampY = lampY + offset;
        const localTargetX = targetX;
        const localTargetY = targetY;
        const visibleStrength = Math.max(primary.progress, primary.residual * 0.55);
        const beamAlpha = 0.12 + 0.34 * visibleStrength;
        const beamStartX = localLampX + directionX * lampSize * 0.55;
        const beamStartY = localLampY + directionY * lampSize * 0.55;

        const beam = ctx.createLinearGradient(beamStartX, beamStartY, localTargetX, localTargetY);
        beam.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${beamAlpha})`);
        beam.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, ${beamAlpha * 0.55})`);
        beam.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(beamStartX + normalX * lampSize * 0.22, beamStartY + normalY * lampSize * 0.22);
        ctx.lineTo(localTargetX + normalX * lampSize * 0.07, localTargetY + normalY * lampSize * 0.07);
        ctx.lineTo(localTargetX - normalX * lampSize * 0.07, localTargetY - normalY * lampSize * 0.07);
        ctx.lineTo(beamStartX - normalX * lampSize * 0.22, beamStartY - normalY * lampSize * 0.22);
        ctx.closePath();
        ctx.fill();

        drawFlashlightIcon(ctx, localLampX, localLampY, lampSize, angle, primary.color, visibleStrength);
    });
    ctx.restore();
}

function drawNegativePrimaryOverlay(ctx, circleCenter, circleRadius, coeff, ideal) {
    const primaryStates = getNegativePrimaryStates(coeff, ideal);
    if (!primaryStates.length) return;

    const impactPoint = getNegativePrimaryImpactPoint(circleCenter, circleRadius);
    drawNegativePrimaryLights(ctx, circleCenter, circleRadius, primaryStates);
    drawNegativePrimaryGuide(ctx, circleCenter, circleRadius, primaryStates, impactPoint);
}

function drawMatchingPatches() {
    const canvas = matchingUI.patchCanvas;
    if (!canvas) return;
    resizeCanvasToDisplaySize(canvas);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    const { left, right, coeff } = computeMatchingXYZ();
    const ideal = getIdealRGB(matchingState.wavelengthNm);

    const leftLin = xyzToLinearSRGB(left.X, left.Y, left.Z);
    const rightLin = xyzToLinearSRGB(right.X, right.Y, right.Z);

    const leftRGB = linearRgbToMatchingDisplayBytes(leftLin);
    const rightRGB = linearRgbToMatchingDisplayBytes(rightLin);

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(255,255,255,0.04)');
    bg.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const circleRadius = Math.min(h * 0.28, w * 0.16);
    const eyeRy = Math.min(h * 0.34, w * 0.105);
    const eyeRx = eyeRy * 1.06;
    const sidePad = Math.max(circleRadius * 1.15, Math.min(circleRadius * 2.0, w * 0.13));
    const circleCenter = {
        x: sidePad + circleRadius,
        y: h * 0.46
    };
    const eyeCenter = {
        x: Math.max(circleCenter.x + circleRadius * 2.3 + eyeRx, w - sidePad - eyeRx * 1.35),
        y: h * 0.42
    };
    const pupilRadius = Math.max(5, Math.min(w, h) * 0.025);
    const infoX = Math.min(w * 0.80, eyeCenter.x + circleRadius * 0.75);
    const infoY = h * 0.18;

    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `rgb(${leftRGB[0]},${leftRGB[1]},${leftRGB[2]})`;
    ctx.fillRect(circleCenter.x - circleRadius, circleCenter.y - circleRadius, circleRadius, circleRadius * 2);
    ctx.fillStyle = `rgb(${rightRGB[0]},${rightRGB[1]},${rightRGB[2]})`;
    ctx.fillRect(circleCenter.x, circleCenter.y - circleRadius, circleRadius, circleRadius * 2);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.90)';
    ctx.lineWidth = Math.max(2, Math.floor(w / 320));
    ctx.beginPath();
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(1.5, Math.floor(w / 420));
    ctx.beginPath();
    ctx.moveTo(circleCenter.x, circleCenter.y - circleRadius * 0.96);
    ctx.lineTo(circleCenter.x, circleCenter.y + circleRadius * 0.96);
    ctx.stroke();

    const labelFont = `${Math.max(12, Math.floor(h / 14))}px 'Pretendard', sans-serif`;
    ctx.font = `600 ${labelFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText('Test', circleCenter.x - circleRadius * 0.48, circleCenter.y - circleRadius - 10);
    ctx.fillText('Match', circleCenter.x + circleRadius * 0.48, circleCenter.y - circleRadius - 10);

    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `${Math.max(11, Math.floor(h / 18))}px 'Pretendard', sans-serif`;
    ctx.fillText('bipartite field', circleCenter.x, circleCenter.y + circleRadius + 12);
    if (!isXYZMatchingMode()) {
        drawNegativePrimaryOverlay(ctx, circleCenter, circleRadius, coeff, ideal);
    }

    const topRay = new THREE.Vector2(circleCenter.x, circleCenter.y - circleRadius);
    const bottomRay = new THREE.Vector2(circleCenter.x, circleCenter.y + circleRadius);
    const corneaX = eyeCenter.x - eyeRx * 0.88;
    const pupil = new THREE.Vector2(corneaX + eyeRx * 0.2, eyeCenter.y);
    const fovea = new THREE.Vector2(eyeCenter.x + eyeRx * 0.68, eyeCenter.y + eyeRy * 0.04);
    const foveaTop = new THREE.Vector2(fovea.x, fovea.y - eyeRy * 0.09);
    const foveaBottom = new THREE.Vector2(fovea.x, fovea.y + eyeRy * 0.09);
    const lensCross = new THREE.Vector2(eyeCenter.x - eyeRx * 0.38, pupil.y);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 214, 120, 0.88)';
    ctx.lineWidth = Math.max(1.5, Math.floor(w / 480));
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(topRay.x, topRay.y);
    ctx.lineTo(lensCross.x, lensCross.y);
    ctx.lineTo(foveaBottom.x, foveaBottom.y);
    ctx.moveTo(bottomRay.x, bottomRay.y);
    ctx.lineTo(lensCross.x, lensCross.y);
    ctx.lineTo(foveaTop.x, foveaTop.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const nerveY = eyeCenter.y + eyeRy * 0.12;
    const nerveGrad = ctx.createLinearGradient(eyeCenter.x + eyeRx * 0.65, nerveY - eyeRy * 0.2, eyeCenter.x + eyeRx * 1.35, nerveY + eyeRy * 0.25);
    nerveGrad.addColorStop(0, 'rgba(238, 201, 152, 0.95)');
    nerveGrad.addColorStop(1, 'rgba(161, 112, 80, 0.92)');
    ctx.fillStyle = nerveGrad;
    ctx.beginPath();
    ctx.moveTo(eyeCenter.x + eyeRx * 0.72, nerveY - eyeRy * 0.18);
    ctx.bezierCurveTo(eyeCenter.x + eyeRx * 0.96, nerveY - eyeRy * 0.24, eyeCenter.x + eyeRx * 1.08, nerveY - eyeRy * 0.1, eyeCenter.x + eyeRx * 1.35, nerveY - eyeRy * 0.04);
    ctx.lineTo(eyeCenter.x + eyeRx * 1.35, nerveY + eyeRy * 0.24);
    ctx.bezierCurveTo(eyeCenter.x + eyeRx * 1.08, nerveY + eyeRy * 0.22, eyeCenter.x + eyeRx * 0.96, nerveY + eyeRy * 0.08, eyeCenter.x + eyeRx * 0.72, nerveY + eyeRy * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(eyeCenter.x, eyeCenter.y, eyeRx, eyeRy, 0, 0, Math.PI * 2);
    ctx.clip();

    const scleraGrad = ctx.createRadialGradient(eyeCenter.x - eyeRx * 0.12, eyeCenter.y - eyeRy * 0.16, eyeRy * 0.1, eyeCenter.x, eyeCenter.y, eyeRx);
    scleraGrad.addColorStop(0, 'rgba(255, 248, 231, 1)');
    scleraGrad.addColorStop(0.62, 'rgba(234, 217, 196, 1)');
    scleraGrad.addColorStop(1, 'rgba(185, 144, 119, 1)');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(eyeCenter.x - eyeRx, eyeCenter.y - eyeRy, eyeRx * 2, eyeRy * 2);

    ctx.beginPath();
    ctx.ellipse(eyeCenter.x + eyeRx * 0.05, eyeCenter.y, eyeRx * 0.78, eyeRy * 0.78, 0, 0, Math.PI * 2);
    const vitreousGrad = ctx.createRadialGradient(eyeCenter.x - eyeRx * 0.05, eyeCenter.y - eyeRy * 0.12, eyeRy * 0.08, eyeCenter.x + eyeRx * 0.1, eyeCenter.y, eyeRx * 0.84);
    vitreousGrad.addColorStop(0, 'rgba(255, 178, 58, 1)');
    vitreousGrad.addColorStop(0.48, 'rgba(197, 72, 24, 1)');
    vitreousGrad.addColorStop(1, 'rgba(92, 22, 20, 1)');
    ctx.fillStyle = vitreousGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 103, 56, 0.95)';
    ctx.lineWidth = Math.max(3, eyeRy * 0.08);
    ctx.beginPath();
    ctx.ellipse(eyeCenter.x + eyeRx * 0.04, eyeCenter.y, eyeRx * 0.77, eyeRy * 0.76, 0, -Math.PI * 0.48, Math.PI * 0.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(93, 31, 24, 0.55)';
    ctx.lineWidth = Math.max(1, eyeRy * 0.018);
    for (let i = -2; i <= 2; i++) {
        const startY = fovea.y + i * eyeRy * 0.08;
        ctx.beginPath();
        ctx.moveTo(fovea.x - eyeRx * 0.05, startY);
        ctx.bezierCurveTo(
            eyeCenter.x + eyeRx * 0.35,
            startY - eyeRy * 0.12 * Math.sign(i || 1),
            eyeCenter.x + eyeRx * 0.08,
            eyeCenter.y + i * eyeRy * 0.18,
            eyeCenter.x - eyeRx * 0.05,
            eyeCenter.y + i * eyeRy * 0.12
        );
        ctx.stroke();
    }

    const lensGrad = ctx.createLinearGradient(pupil.x - eyeRx * 0.11, eyeCenter.y, pupil.x + eyeRx * 0.13, eyeCenter.y);
    lensGrad.addColorStop(0, 'rgba(255, 252, 205, 0.95)');
    lensGrad.addColorStop(0.5, 'rgba(255, 245, 174, 1)');
    lensGrad.addColorStop(1, 'rgba(224, 190, 120, 0.92)');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.ellipse(pupil.x + eyeRx * 0.02, eyeCenter.y, eyeRx * 0.11, eyeRy * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad = ctx.createRadialGradient(pupil.x - eyeRx * 0.09, eyeCenter.y, 1, pupil.x - eyeRx * 0.09, eyeCenter.y, eyeRy * 0.34);
    irisGrad.addColorStop(0, 'rgba(18, 28, 22, 1)');
    irisGrad.addColorStop(0.38, 'rgba(58, 104, 74, 1)');
    irisGrad.addColorStop(1, 'rgba(18, 49, 54, 0.95)');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(pupil.x - eyeRx * 0.08, eyeCenter.y, eyeRx * 0.05, eyeRy * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(6, 8, 10, 0.98)';
    ctx.beginPath();
    ctx.ellipse(pupil.x - eyeRx * 0.085, eyeCenter.y, eyeRx * 0.022, eyeRy * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    const corneaGrad = ctx.createLinearGradient(corneaX - eyeRx * 0.08, eyeCenter.y - eyeRy * 0.45, corneaX + eyeRx * 0.08, eyeCenter.y + eyeRy * 0.45);
    corneaGrad.addColorStop(0, 'rgba(186, 236, 255, 0.48)');
    corneaGrad.addColorStop(0.5, 'rgba(104, 211, 255, 0.28)');
    corneaGrad.addColorStop(1, 'rgba(238, 255, 255, 0.42)');
    ctx.fillStyle = corneaGrad;
    ctx.beginPath();
    ctx.ellipse(corneaX, eyeCenter.y, eyeRx * 0.13, eyeRy * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 244, 226, 0.92)';
    ctx.lineWidth = Math.max(1.5, Math.floor(w / 520));
    ctx.beginPath();
    ctx.ellipse(eyeCenter.x, eyeCenter.y, eyeRx, eyeRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(98, 225, 255, 0.62)';
    ctx.beginPath();
    ctx.ellipse(corneaX, eyeCenter.y, eyeRx * 0.13, eyeRy * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255, 214, 120, 0.92)';
    ctx.lineWidth = Math.max(1.5, Math.floor(w / 480));
    ctx.beginPath();
    ctx.moveTo(topRay.x, topRay.y);
    ctx.lineTo(lensCross.x, lensCross.y);
    ctx.lineTo(foveaBottom.x, foveaBottom.y);
    ctx.moveTo(bottomRay.x, bottomRay.y);
    ctx.lineTo(lensCross.x, lensCross.y);
    ctx.lineTo(foveaTop.x, foveaTop.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 245, 185, 0.95)';
    ctx.beginPath();
    ctx.arc(lensCross.x, lensCross.y, Math.max(1.8, eyeRy * 0.025), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 229, 132, 0.96)';
    ctx.beginPath();
    ctx.arc(fovea.x, fovea.y, Math.max(2.5, eyeRy * 0.045), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 225, 160, 0.98)';
    ctx.font = `700 ${Math.max(13, Math.floor(h / 15))}px 'Pretendard', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('2°', pupil.x + eyeRx * 0.2, pupil.y - eyeRy * 0.48);

    const observerInfoX = eyeCenter.x - eyeRx * 0.72;
    const observerTitleFontSize = Math.max(12, Math.floor(h / 21));
    const observerBodyFontSize = Math.max(9, Math.floor(h / 28));
    const observerTitleGap = observerTitleFontSize + 8;
    const observerLineGap = observerBodyFontSize + 7;
    const observerBlockHeight = observerTitleGap + observerLineGap * 2;
    const observerInfoY = Math.min(eyeCenter.y + eyeRy + 14, h - observerBlockHeight - 16);
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.font = `700 ${observerTitleFontSize}px 'Pretendard', sans-serif`;
    ctx.fillText('2° standard observer', observerInfoX, observerInfoY);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `${observerBodyFontSize}px 'Pretendard', sans-serif`;
    const infoLines = [
        '중심와(fovea)를 향한 작은 시야',
        '주변시 영향을 줄인 표준 관찰 조건'
    ];
    infoLines.forEach((line, index) => {
        ctx.fillText(line, observerInfoX, observerInfoY + observerTitleGap + index * observerLineGap);
    });

}

const spectrumStripCache = {
    width: 0,
    height: 0,
    canvas: null
};

function getSpectrumStripCanvas(width, height) {
    if (spectrumStripCache.canvas && spectrumStripCache.width === width && spectrumStripCache.height === height) {
        return spectrumStripCache.canvas;
    }

    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const ctx = off.getContext('2d');
    const img = ctx.createImageData(width, height);
    const data = img.data;

    for (let x = 0; x < width; x++) {
        const t = (x + 0.5) / width;
        const lambda = MATCHING_LAMBDA_MIN + t * (MATCHING_LAMBDA_MAX - MATCHING_LAMBDA_MIN);
        const xyz = wavelengthToXYZ(lambda);
        const [R, G, B] = spectralXYZToDisplayRGBBytes(xyz.x, xyz.y, xyz.z);

        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            data[idx] = R;
            data[idx + 1] = G;
            data[idx + 2] = B;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    spectrumStripCache.width = width;
    spectrumStripCache.height = height;
    spectrumStripCache.canvas = off;
    return off;
}

function drawMatchingGraph() {
    const canvas = matchingUI.graphCanvas;
    if (!canvas) return;
    resizeCanvasToDisplaySize(canvas);
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(0, 0, w, h);

    const padL = Math.max(18, Math.floor(w * 0.04));
    const padR = 10;
    const topLabelFontSize = Math.max(11, Math.floor(h / 24));
    const primaryMarkerFontSize = topLabelFontSize;
    const spectrumTop = 12 + topLabelFontSize + 8;
    const spectrumH = Math.max(12, Math.floor(h * 0.06));
    const spectrumGap = 10;
    const padT = spectrumTop + spectrumH + spectrumGap;
    const padB = Math.max(22, Math.floor(h * 0.12));
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const xToPx = (lambda) => padL + (lambda - MATCHING_LAMBDA_MIN) / (MATCHING_LAMBDA_MAX - MATCHING_LAMBDA_MIN) * plotW;
    const lambdaNow = matchingState.wavelengthNm;
    const xNow = xToPx(lambdaNow);

    const view = matchingState.cmfView;
    let yMin = Infinity, yMax = -Infinity;
    const ranges = matchingCmf.range;

    const includeXYZ = matchingState.showCmf && (view === 'xyz' || view === 'both');
    const includeRGB = matchingState.showCmf && (view === 'rgb' || view === 'both');
    const scaleForRGB = view === 'rgb' || view === 'both';
    const showRgbCoeffMarkers = view === 'rgb' || view === 'both';
    const showSavedCoeffMarkers = view === 'rgb' || view === 'both';
    if (includeXYZ) {
        yMin = Math.min(yMin, ranges.xMin, ranges.yMin, ranges.zMin);
        yMax = Math.max(yMax, ranges.xMax, ranges.yMax, ranges.zMax);
    }
    if (scaleForRGB) {
        yMin = Math.min(yMin, ranges.rMin, ranges.gMin, ranges.bMin);
        yMax = Math.max(yMax, ranges.rMax, ranges.gMax, ranges.bMax);
    }
    if (showRgbCoeffMarkers) {
        [matchingUI.r, matchingUI.g, matchingUI.b].forEach((slider) => {
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            if (!Number.isFinite(min) || !Number.isFinite(max)) return;
            yMin = Math.min(yMin, min);
            yMax = Math.max(yMax, max);
        });
        if (showSavedCoeffMarkers) {
            matchingState.savedCoeffSnapshots.forEach((snapshot) => {
                yMin = Math.min(yMin, snapshot.R, snapshot.G, snapshot.B);
                yMax = Math.max(yMax, snapshot.R, snapshot.G, snapshot.B);
            });
        }
    }
    if (matchingState.showLuminousEfficiency) {
        yMin = Math.min(yMin, ranges.yMin);
        yMax = Math.max(yMax, ranges.yMax);
    }
    if (!isFinite(yMin) || !isFinite(yMax) || Math.abs(yMax - yMin) < 1e-9) {
        yMin = 0; yMax = 1;
    }
    const ySpan = yMax - yMin;
    yMin -= ySpan * 0.08;
    yMax += ySpan * 0.08;

    const yToPx = (v) => padT + (yMax - v) / (yMax - yMin) * plotH;

    // Spectrum strip (wavelength → sRGB)
    if (plotW > 0 && plotH > 0) {
        const strip = getSpectrumStripCanvas(Math.max(1, Math.floor(plotW)), Math.max(1, Math.floor(spectrumH)));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(strip, padL, spectrumTop, plotW, spectrumH);
        ctx.imageSmoothingEnabled = true;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(padL, spectrumTop, plotW, spectrumH);
    }

    function drawRgbPrimaryWavelengthMarkers() {
        CIE_RGB_PRIMARIES.forEach((primary) => {
            const px = xToPx(primary.wavelength);
            ctx.strokeStyle = primary.color;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(px, spectrumTop);
            ctx.lineTo(px, padT + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = primary.color;
            ctx.beginPath();
            ctx.arc(px, spectrumTop + spectrumH * 0.5, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = `${primaryMarkerFontSize}px 'Pretendard', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(
                `${primary.label} ${formatPrimaryWavelengthNm(primary.wavelength)}`,
                px,
                spectrumTop - 5
            );
        });
        ctx.textAlign = 'start';
    }

    if (matchingState.showRgbPrimaryWavelengths) {
        drawRgbPrimaryWavelengthMarkers();
    }

    function drawSelectedWavelengthLabel() {
        const label = `${Math.round(lambdaNow)} nm`;
        ctx.font = `800 ${topLabelFontSize}px 'Pretendard', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelW = Math.max(56, Math.floor(topLabelFontSize * 4.7));
        const labelH = Math.max(22, Math.floor(topLabelFontSize * 1.65));
        const labelX = Math.max(padL + labelW / 2, Math.min(padL + plotW - labelW / 2, xNow));
        const labelY = spectrumTop - labelH / 2 - 4;
        const hueXYZ = getTargetXYZ(lambdaNow);
        const hue = spectralXYZToDisplayRGBBytes(hueXYZ.X, hueXYZ.Y, hueXYZ.Z);
        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.strokeStyle = `rgb(${hue[0]}, ${hue[1]}, ${hue[2]})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(labelX - labelW / 2, labelY - labelH / 2, labelW, labelH, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillText(label, labelX, labelY + 0.5);
        ctx.textAlign = 'start';
    }

    drawSelectedWavelengthLabel();

    // Axes / grid
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.stroke();

    const ticksX = [400, 500, 600, 700];
    ctx.font = `${Math.max(11, Math.floor(h / 20))}px 'Pretendard', sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ticksX.forEach(t => {
        const px = xToPx(t);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        ctx.fillText(String(t), px - 10, padT + plotH + 4);
    });

    if (yMin < 0 && yMax > 0) {
        const py0 = yToPx(0);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(padL, py0);
        ctx.lineTo(padL + plotW, py0);
        ctx.stroke();
    }

    function drawSeries(arr, color, options = {}) {
        ctx.strokeStyle = color;
        ctx.lineWidth = options.lineWidth ?? 2;
        ctx.setLineDash(options.dash ?? []);
        ctx.beginPath();
        for (let idx = 0; idx < matchingCmf.count; idx++) {
            const lambda = MATCHING_LAMBDA_MIN + idx;
            const px = xToPx(lambda);
            const py = yToPx(arr[idx]);
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (includeXYZ) {
        drawSeries(matchingCmf.x, CMF_GRAPH_COLORS.XYZ_CMF.X);
        drawSeries(matchingCmf.y, CMF_GRAPH_COLORS.XYZ_CMF.Y);
        drawSeries(matchingCmf.z, CMF_GRAPH_COLORS.XYZ_CMF.Z);
    }
    if (includeRGB) {
        drawSeries(matchingCmf.r, CMF_GRAPH_COLORS.RGB_CMF.R, { lineWidth: 2.4 });
        drawSeries(matchingCmf.g, CMF_GRAPH_COLORS.RGB_CMF.G, { lineWidth: 2.4 });
        drawSeries(matchingCmf.b, CMF_GRAPH_COLORS.RGB_CMF.B, { lineWidth: 2.4 });
    }
    if (matchingState.showLuminousEfficiency) {
        drawSeries(matchingCmf.y, 'rgba(255,212,90,0.95)', { lineWidth: 2.5, dash: [8, 5] });
        const peakIdx = matchingCmf.y.reduce((bestIdx, value, idx, arr) => value > arr[bestIdx] ? idx : bestIdx, 0);
        const peakLambda = MATCHING_LAMBDA_MIN + peakIdx;
        ctx.fillStyle = 'rgba(255,212,90,0.9)';
        ctx.textBaseline = 'bottom';
        ctx.fillText('V(λ)', xToPx(peakLambda) + 6, yToPx(matchingCmf.y[peakIdx]) - 4);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xNow, spectrumTop);
    ctx.lineTo(xNow, padT + plotH);
    ctx.stroke();

    const idealRGB = getIdealRGB(lambdaNow);
    const targetXYZ = getTargetXYZ(lambdaNow);
    const current = computeMatchingXYZ();

    function drawMarker(v, color, filled = true, radius = 4, xOffset = 0, xBase = xNow) {
        const py = yToPx(v);
        ctx.beginPath();
        ctx.arc(xBase + xOffset, py, radius, 0, Math.PI * 2);
        if (filled) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.4;
            ctx.stroke();
        }
    }

    function drawCoeffMarkers(radius = 4) {
        const markers = [
            { value: current.coeff.R, color: CMF_GRAPH_COLORS.RGB_CMF.R },
            { value: current.coeff.G, color: CMF_GRAPH_COLORS.RGB_CMF.G },
            { value: current.coeff.B, color: CMF_GRAPH_COLORS.RGB_CMF.B }
        ];
        markers.forEach(marker => {
            drawMarker(marker.value, 'rgba(0,0,0,0.65)', false, radius + 1.8);
            drawMarker(marker.value, marker.color, false, radius);
        });
    }

    function drawSavedCoeffMarkers() {
        if (!showSavedCoeffMarkers || matchingState.savedCoeffSnapshots.length === 0) return;
        matchingState.savedCoeffSnapshots.forEach((snapshot, index) => {
            const savedX = xToPx(snapshot.wavelengthNm);
            const alpha = Math.max(0.35, Math.min(0.92, 0.52 + (index + 1) / matchingState.savedCoeffSnapshots.length * 0.4));
            const markers = [
                { value: snapshot.R, color: CMF_GRAPH_COLORS.RGB_CMF.R },
                { value: snapshot.G, color: CMF_GRAPH_COLORS.RGB_CMF.G },
                { value: snapshot.B, color: CMF_GRAPH_COLORS.RGB_CMF.B }
            ];
            markers.forEach(marker => {
                drawMarker(marker.value, 'rgba(0,0,0,0.72)', false, 6.2, 0, savedX);
                drawMarker(marker.value, withAlpha(marker.color, alpha), true, 4.8, 0, savedX);
                drawMarker(marker.value, 'rgba(255,255,255,0.9)', false, 4.8, 0, savedX);
            });
        });
    }

    if (matchingState.showLuminousEfficiency) {
        drawMarker(targetXYZ.Y, 'rgba(255,212,90,0.95)', false, 6);
    }

    drawSavedCoeffMarkers();

    if (view === 'rgb') {
        if (includeRGB) {
            drawMarker(idealRGB.R, CMF_GRAPH_COLORS.RGB_CMF.R, true);
            drawMarker(idealRGB.G, CMF_GRAPH_COLORS.RGB_CMF.G, true);
            drawMarker(idealRGB.B, CMF_GRAPH_COLORS.RGB_CMF.B, true);
        }
        drawCoeffMarkers(4);
    } else if (view === 'xyz' && includeXYZ) {
        drawMarker(targetXYZ.X, CMF_GRAPH_COLORS.XYZ_CMF.X, true);
        drawMarker(targetXYZ.Y, CMF_GRAPH_COLORS.XYZ_CMF.Y, true);
        drawMarker(targetXYZ.Z, CMF_GRAPH_COLORS.XYZ_CMF.Z, true);
        drawMarker(current.reconstructed.X, 'rgba(255,255,255,0.9)', false);
        drawMarker(current.reconstructed.Y, 'rgba(255,255,255,0.9)', false);
        drawMarker(current.reconstructed.Z, 'rgba(255,255,255,0.9)', false);
    } else if (view === 'both') {
        if (includeXYZ) {
            drawMarker(targetXYZ.X, CMF_GRAPH_COLORS.XYZ_CMF.X, true, 5);
            drawMarker(targetXYZ.Y, CMF_GRAPH_COLORS.XYZ_CMF.Y, true, 5);
            drawMarker(targetXYZ.Z, CMF_GRAPH_COLORS.XYZ_CMF.Z, true, 5);
            drawMarker(current.reconstructed.X, 'rgba(255,255,255,0.9)', false, 5);
            drawMarker(current.reconstructed.Y, 'rgba(255,255,255,0.9)', false, 5);
            drawMarker(current.reconstructed.Z, 'rgba(255,255,255,0.9)', false, 5);
        }

        if (includeRGB) {
            drawMarker(idealRGB.R, CMF_GRAPH_COLORS.RGB_CMF.R, true, 3);
            drawMarker(idealRGB.G, CMF_GRAPH_COLORS.RGB_CMF.G, true, 3);
            drawMarker(idealRGB.B, CMF_GRAPH_COLORS.RGB_CMF.B, true, 3);
        }
        drawCoeffMarkers(3.2);
    }

}

function getMatchingGraphLayout(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const padL = Math.max(18, Math.floor(w * 0.04));
    const padR = 10;
    const primaryMarkerFontSize = Math.max(10, Math.floor(h / 24));
    const spectrumTop = 12 + primaryMarkerFontSize + 8;
    const spectrumH = Math.max(12, Math.floor(h * 0.06));
    const spectrumGap = 10;
    const padT = spectrumTop + spectrumH + spectrumGap;
    const padB = Math.max(22, Math.floor(h * 0.12));
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    return { padL, padR, padT, padB, plotW, plotH, spectrumTop, spectrumH };
}

function setMatchingWavelengthFromGraphClientX(clientX) {
    const canvas = matchingUI.graphCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 1) return;

    const xPx = (clientX - rect.left) * (canvas.width / rect.width);
    const layout = getMatchingGraphLayout(canvas);
    if (layout.plotW <= 1) return;

    const t = Math.max(0, Math.min(1, (xPx - layout.padL) / layout.plotW));
    matchingState.wavelengthNm = MATCHING_LAMBDA_MIN + t * (MATCHING_LAMBDA_MAX - MATCHING_LAMBDA_MIN);
    matchingUI.wavelength.value = String(Math.round(matchingState.wavelengthNm));

    if (matchingState.autoSolve) {
        setMatchingCoeffs(getIdealMatchingCoeffs(matchingState.wavelengthNm), true);
    }

    matchingState.needsRender = true;
    renderMatching();
}

function syncMatchingUIReadouts() {
    matchingUI.rValue.textContent = matchingState.coeffR.toFixed(4);
    matchingUI.gValue.textContent = matchingState.coeffG.toFixed(4);
    matchingUI.bValue.textContent = matchingState.coeffB.toFixed(4);
    syncMatchingSavedCoeffControls();
}

function updateSelectedWavelengthPreview(ideal) {
    const target = getTargetXYZ(matchingState.wavelengthNm);
    const [R, G, B] = spectralXYZToDisplayRGBBytes(target.X, target.Y, target.Z);
    const hasNegative = !isXYZMatchingMode() && (ideal.R < 0 || ideal.G < 0 || ideal.B < 0);

    if (matchingUI.selectedSwatch) {
        matchingUI.selectedSwatch.style.background = `rgb(${R}, ${G}, ${B})`;
    }
    if (matchingUI.selectedTitle) {
        matchingUI.selectedTitle.textContent = `선택 파장 순수색 · ${Math.round(matchingState.wavelengthNm)} nm`;
    }
    if (matchingUI.selectedNote) {
        matchingUI.selectedNote.textContent = hasNegative
            ? '스펙트럼 바와 이 스와치는 같은 순수 단색광 표시입니다. 현재 Test 패치는 음수 계수 보정 때문에 이 색과 다를 수 있습니다.'
            : '스펙트럼 바와 이 스와치는 같은 순수 단색광 표시입니다. 현재 파장에서는 Test 패치와도 거의 같은 색으로 보입니다.';
    }
}

function renderMatching() {
    if (!matchingState.isActive) return;

    applyMatchingModeControls();
    syncMatchingUIReadouts();

    const { err } = computeMatchingXYZ();
    matchingUI.errorValue.textContent = err.toFixed(4);
    if (matchingUI.mainMeta) {
        matchingUI.mainMeta.textContent = `λ ${Math.round(matchingState.wavelengthNm)} nm · ΔXYZ ${err.toFixed(4)}`;
    }

    const ideal = getIdealRGB(matchingState.wavelengthNm);
    const idealNeg = (ideal.R < 0) || (ideal.G < 0) || (ideal.B < 0);
    updateSelectedWavelengthPreview(ideal);
    const primarySummary = CIE_RGB_PRIMARIES
        .map(primary => `${primary.label}≈${formatPrimaryWavelengthNm(primary.wavelength)}`)
        .join(', ');
    const hintLines = [];
    if (isXYZMatchingMode()) {
        const target = getTargetXYZ(matchingState.wavelengthNm);
        hintLines.push(`이론값 (x̄,ȳ,z̄): ${formatSigned(target.X)} / ${formatSigned(target.Y)} / ${formatSigned(target.Z)}`);
        hintLines.push('XYZ CMF는 실제 RGB 원색 혼합이 아니라 음수 없는 가상 원색 좌표로 봅니다.');
    } else {
        hintLines.push(`이론값 (r̄,ḡ,b̄): ${formatSigned(ideal.R)} / ${formatSigned(ideal.G)} / ${formatSigned(ideal.B)}`);
        hintLines.push(`Primaries: CIE 1931 RGB (${primarySummary})`);
    }
    if (!isXYZMatchingMode() && !matchingState.allowNegative && idealNeg) {
        hintLines.push(`일부 파장에서는 음수 계수가 필요합니다. ‘음수 계수 허용’을 켜보세요.`);
    }
    matchingUI.hint.textContent = hintLines.join(' ');

    drawMatchingPatches();
    drawMatchingGraph();

    matchingState.needsRender = false;
}

window.scheduleMatchingLayoutRender = () => {
    const renderIfActive = () => {
        matchingState.needsRender = true;
        if (matchingState.isActive) {
            renderMatching();
        }
    };
    renderIfActive();
    window.requestAnimationFrame(renderIfActive);
    window.setTimeout(renderIfActive, 80);
    window.setTimeout(renderIfActive, 180);
    window.setTimeout(renderIfActive, 340);
};

if ('ResizeObserver' in window) {
    const matchingResizeObserver = new ResizeObserver(() => {
        window.scheduleMatchingLayoutRender();
    });
    matchingResizeObserver.observe(matchingUI.patchCanvas);
    matchingResizeObserver.observe(matchingUI.graphCanvas);
}

function initMatching() {
    if (!XYZ_TO_CIE_RGB) {
        matchingUI.hint.textContent = 'Color Matching 초기화 실패: 행렬 역행렬 계산에 실패했습니다.';
        return;
    }

    if (matchingState.autoSolve) {
        setMatchingCoeffs(getIdealMatchingCoeffs(matchingState.wavelengthNm), true);
    }

    applyMatchingSliderRanges();
    syncMatchingUIReadouts();
    updateCieRgbXYZDecomposition();
    matchingState.needsRender = true;
}

initMatching();

// --------------------------------------------------------
