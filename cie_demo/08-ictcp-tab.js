// --------------------------------------------------------
// 8.6 ICtCp 탭 (BT.2100 HDR/WCG 색차 공간)
// --------------------------------------------------------
const ICTCP_CHROMA_DISPLAY_SCALE = 0.82;
const ICTCP_AXIS_CENTER = new THREE.Vector3(0.5, 0.0, 0.5);
const toggleICtCp3DPolygons = document.getElementById('toggle-ictcp-3d-polygons');
const toggleICtCpSolidSurface = document.getElementById('toggle-ictcp-solid-surface');
const toggleICtCpSurfaceLines = document.getElementById('toggle-ictcp-surface-lines');
const inputICtCpPolygonOpacity = document.getElementById('input-ictcp-opacity');
const ictcpPolygonOpacityValue = document.getElementById('ictcp-opacity-value');
const toggleICtCpLogI = document.getElementById('toggle-ictcp-log-i');
const toggleICtCpYHeatmap = document.getElementById('toggle-ictcp-y-heatmap');
const toggleICtCpYDisplayLimit = document.getElementById('toggle-ictcp-y-display-limit');
const inputICtCpDisplayPeakNits = document.getElementById('input-ictcp-display-peak-nits');
const selectICtCpAxisMode = document.getElementById('ictcp-axis-mode');
const selectICtCpEotfMode = document.getElementById('ictcp-eotf-mode');
const inputICtCpDecodePeakNits = document.getElementById('input-ictcp-decode-peak-nits');
const ictcpEotfControls = document.getElementById('ictcp-eotf-controls');

let showICtCp3DPolygons = toggleICtCp3DPolygons.checked;
let isICtCpSolidSurface = toggleICtCpSolidSurface.checked;
let showICtCpSurfaceLines = toggleICtCpSurfaceLines.checked;
const ICTCP_FALLBACK_POLYGON_OPACITY = 0.4;
let ictcpPolygonOpacityOverride = null;
let applyICtCpLogI = toggleICtCpLogI.checked;
let useICtCpLuminanceHeatmap = toggleICtCpYHeatmap.checked;
let useICtCpDisplayPeakLimit = toggleICtCpYDisplayLimit.checked;
let ictcpAxisMode = selectICtCpAxisMode.value;
let ictcpEotfMode = selectICtCpEotfMode.value;

function getICtCpPolygonOpacityControlValue() {
    if (ictcpPolygonOpacityOverride !== null) return ictcpPolygonOpacityOverride;
    if (typeof ictcpVolumes !== 'undefined') {
        const activeOpacities = Object.entries(ictcpVolumes)
            .filter(([key]) => document.getElementById(`toggle-ictcp-${key}`)?.checked)
            .map(([, volume]) => volume.userData.defaultOpacity)
            .filter((opacity) => Number.isFinite(opacity));
        if (activeOpacities.length === 1) return activeOpacities[0];
        if (activeOpacities.length > 1) return Math.max(...activeOpacities);
    }
    return ICTCP_FALLBACK_POLYGON_OPACITY;
}

function syncICtCpPolygonOpacityControl() {
    const opacity = getICtCpPolygonOpacityControlValue();
    inputICtCpPolygonOpacity.value = opacity.toFixed(2);
    ictcpPolygonOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
}

function applyICtCpPolygonOpacityOptions(materialOptions) {
    const baseOpacity = Number.isFinite(materialOptions.opacity) ? materialOptions.opacity : 1;
    const opacity = Math.max(0.01, ictcpPolygonOpacityOverride ?? baseOpacity);
    materialOptions.opacity = opacity;
    if (opacity < 0.999) {
        materialOptions.transparent = true;
        materialOptions.depthWrite = false;
    }
    return materialOptions;
}

function pqOetfNormalized(linearValue) {
    const m1 = 2610 / 16384;
    const m2 = (2523 / 4096) * 128;
    const c1 = 3424 / 4096;
    const c2 = (2413 / 4096) * 32;
    const c3 = (2392 / 4096) * 32;
    const value = Math.max(0, Math.min(1, linearValue));
    const valueM1 = Math.pow(value, m1);
    return Math.pow((c1 + c2 * valueM1) / (1 + c3 * valueM1), m2);
}

function bt2020LinearToXYZ(r, g, b) {
    return {
        X: 0.6369580 * r + 0.1446169 * g + 0.1688809 * b,
        Y: 0.2627002 * r + 0.6779981 * g + 0.0593017 * b,
        Z: 0.0000000 * r + 0.0280727 * g + 1.0609851 * b
    };
}

function xyzToBt2020Linear(X, Y, Z) {
    return {
        r: 1.7166512 * X - 0.3556708 * Y - 0.2533663 * Z,
        g: -0.6666844 * X + 1.6164812 * Y + 0.0157685 * Z,
        b: 0.0176399 * X - 0.0427706 * Y + 0.9421031 * Z
    };
}

function bt2020LinearToICtCp(r, g, b) {
    const l = (1688 * r + 2146 * g + 262 * b) / 4096;
    const m = (683 * r + 2951 * g + 462 * b) / 4096;
    const s = (99 * r + 309 * g + 3688 * b) / 4096;

    const lp = pqOetfNormalized(l);
    const mp = pqOetfNormalized(m);
    const sp = pqOetfNormalized(s);

    return {
        I: (2048 * lp + 2048 * mp) / 4096,
        Ct: (6610 * lp - 13613 * mp + 7003 * sp) / 4096,
        Cp: (17933 * lp - 17390 * mp - 543 * sp) / 4096
    };
}

function mapICtCpToDisplay(ictcp) {
    return new THREE.Vector3(
        0.5 + ictcp.Cp * ICTCP_CHROMA_DISPLAY_SCALE,
        ictcp.I,
        0.5 + ictcp.Ct * ICTCP_CHROMA_DISPLAY_SCALE
    );
}

function getICtCpDecodePeakNits() {
    const parsed = Number(inputICtCpDecodePeakNits.value);
    if (!Number.isFinite(parsed)) return 1000;
    return Math.max(1, Math.min(10000, parsed));
}

function getICtCpDisplayPeakNits() {
    const parsed = Number(inputICtCpDisplayPeakNits.value);
    if (!Number.isFinite(parsed)) return 600;
    return Math.max(1, Math.min(10000, parsed));
}

function absoluteXYZToICtCpPeakColor(X, Y, Z) {
    const displayPeakNits = getICtCpDisplayPeakNits();
    const targetRelativeLuminance = clamp01(Y / displayPeakNits);
    const scale = Y > 1e-6 ? (targetRelativeLuminance * displayPeakNits) / Y : 0;
    const normalizedXYZ = {
        X: (X * scale) / displayPeakNits,
        Y: (Y * scale) / displayPeakNits,
        Z: (Z * scale) / displayPeakNits
    };
    const linear = xyzToLinearSrgb(normalizedXYZ.X, normalizedXYZ.Y, normalizedXYZ.Z);
    const fittedLinear = liftLinearSrgbToTargetLuminance(linear, targetRelativeLuminance);
    return linearToDisplaySrgbColor(fittedLinear.r, fittedLinear.g, fittedLinear.b);
}

function pqEotfNits(codeValue) {
    const m1 = 2610 / 16384;
    const m2 = (2523 / 4096) * 128;
    const c1 = 3424 / 4096;
    const c2 = (2413 / 4096) * 32;
    const c3 = (2392 / 4096) * 32;
    const value = Math.max(0, Math.min(1, codeValue));
    const valuePow = Math.pow(value, 1 / m2);
    const numerator = Math.max(valuePow - c1, 0);
    const denominator = Math.max(c2 - c3 * valuePow, 1e-6);
    return 10000 * Math.pow(numerator / denominator, 1 / m1);
}

function hlgInverseOetf(codeValue) {
    const a = 0.17883277;
    const b = 0.28466892;
    const c = 0.55991073;
    const value = Math.max(0, Math.min(1, codeValue));
    return value <= 0.5
        ? (value * value) / 3
        : (Math.exp((value - c) / a) + b) / 12;
}

function srgbInverseOetf(codeValue) {
    const value = Math.max(0, Math.min(1, codeValue));
    return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
}

function ictcpToPqLms(ictcp) {
    return {
        l: ictcp.I + 0.0086090370 * ictcp.Ct + 0.1110296250 * ictcp.Cp,
        m: ictcp.I - 0.0086090370 * ictcp.Ct - 0.1110296250 * ictcp.Cp,
        s: ictcp.I + 0.5600313357 * ictcp.Ct - 0.3206271750 * ictcp.Cp
    };
}

function lmsToBt2020Linear(l, m, s) {
    return {
        r: 3.4366066943 * l - 2.5064521187 * m + 0.0698454243 * s,
        g: -0.7913295556 * l + 1.9836004518 * m - 0.1922708962 * s,
        b: -0.0259498997 * l - 0.0989137147 * m + 1.1248636144 * s
    };
}

function bt2020LinearToRelativeY(rgb) {
    return Math.max(0, 0.2627002 * rgb.r + 0.6779981 * rgb.g + 0.0593017 * rgb.b);
}

function decodeICtCpLuminanceNits(ictcp) {
    const lmsCode = ictcpToPqLms(ictcp);
    let linearLms;

    if (ictcpEotfMode === 'pq') {
        linearLms = {
            l: pqEotfNits(lmsCode.l) / 10000,
            m: pqEotfNits(lmsCode.m) / 10000,
            s: pqEotfNits(lmsCode.s) / 10000
        };
        const rgb = lmsToBt2020Linear(linearLms.l, linearLms.m, linearLms.s);
        return bt2020LinearToRelativeY(rgb) * 10000;
    }

    if (ictcpEotfMode === 'hlg') {
        linearLms = {
            l: hlgInverseOetf(lmsCode.l),
            m: hlgInverseOetf(lmsCode.m),
            s: hlgInverseOetf(lmsCode.s)
        };
        const rgb = lmsToBt2020Linear(linearLms.l, linearLms.m, linearLms.s);
        const sceneY = bt2020LinearToRelativeY(rgb);
        return getICtCpDecodePeakNits() * Math.pow(sceneY, 1.2);
    }

    const decode = ictcpEotfMode === 'srgb'
        ? srgbInverseOetf
        : (value) => Math.pow(Math.max(0, Math.min(1, value)), 2.4);
    linearLms = {
        l: decode(lmsCode.l),
        m: decode(lmsCode.m),
        s: decode(lmsCode.s)
    };
    const rgb = lmsToBt2020Linear(linearLms.l, linearLms.m, linearLms.s);
    return bt2020LinearToRelativeY(rgb) * getICtCpDecodePeakNits();
}

function mapICtCpDecodedNitsToHeight(nits) {
    const peak = ictcpEotfMode === 'pq' ? 10000 : getICtCpDecodePeakNits();
    if (applyICtCpLogI) {
        return Math.log10(Math.max(0, nits) + 1) / Math.log10(peak + 1);
    }
    return Math.max(0, Math.min(1, nits / Math.max(1, peak)));
}

function absoluteXYZToICtCpDisplayPoint(X, Y, Z) {
    const bt2020 = xyzToBt2020Linear(X / 10000, Y / 10000, Z / 10000);
    const ictcp = bt2020LinearToICtCp(
        Math.max(0, bt2020.r),
        Math.max(0, bt2020.g),
        Math.max(0, bt2020.b)
    );
    const point = mapICtCpToDisplay(ictcp);
    if (ictcpAxisMode === 'decoded-luminance') {
        point.y = mapICtCpDecodedNitsToHeight(decodeICtCpLuminanceNits(ictcp));
    }
    return point;
}

function createICtCpBiAxis(direction, positiveColorHex, negativeColorHex, positiveLabel, negativeLabel, length = 0.56) {
    const group = new THREE.Group();
    const addSide = (dir, colorHex, label, scale = 1) => {
        const arrow = new THREE.ArrowHelper(dir, ICTCP_AXIS_CENTER, length * scale, colorHex, 0.035, 0.03);
        group.add(arrow);
        const labelSprite = createTextSprite(label, `#${colorHex.toString(16).padStart(6, '0')}`);
        labelSprite.position.copy(ICTCP_AXIS_CENTER).add(dir.clone().multiplyScalar(length * scale + 0.08));
        labelSprite.scale.multiplyScalar(0.95);
        group.add(labelSprite);
    };
    addSide(direction.clone().normalize(), positiveColorHex, positiveLabel);
    addSide(direction.clone().normalize().multiplyScalar(-1), negativeColorHex, negativeLabel, 0.9);
    return group;
}

function createICtCpAxes() {
    const group = new THREE.Group();
    const decodedAxis = ictcpAxisMode === 'decoded-luminance';
    const axisPeak = ictcpEotfMode === 'pq' ? 10000 : getICtCpDecodePeakNits();
    const iArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0.5, 0, 0.5),
        1.12,
        0xffffff,
        0.04,
        0.04
    );
    group.add(iArrow);

    const iLabel = createTextSprite(decodedAxis ? 'Y nits' : 'I', '#ffffff');
    iLabel.position.set(0.5, 1.2, 0.5);
    iLabel.scale.multiplyScalar(1.25);
    group.add(iLabel);

    const tickValues = decodedAxis
        ? [axisPeak * 0.25, axisPeak * 0.5, axisPeak * 0.75, axisPeak]
        : [0.25, 0.5, 0.75, 1.0];
    tickValues.forEach((value) => {
        const tickPosition = decodedAxis ? mapICtCpDecodedNitsToHeight(value) : value;
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0.485, tickPosition, 0.5),
            new THREE.Vector3(0.515, tickPosition, 0.5)
        ]);
        group.add(new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })));
        const tickLabelText = decodedAxis
            ? `${Math.round(value)}`
            : value.toFixed(2);
        const tickLabel = createVectorTextLabel(tickLabelText, '#bbbbbb');
        tickLabel.position.set(0.56, tickPosition, 0.5);
        tickLabel.scale.setScalar(0.018);
        group.add(tickLabel);
    });

    group.add(createICtCpBiAxis(new THREE.Vector3(1, 0, 0), 0xff88aa, 0x88ff99, '+Cp', '-Cp'));
    group.add(createICtCpBiAxis(new THREE.Vector3(0, 0, 1), 0xffdd66, 0x66ccff, '+Ct', '-Ct'));
    return group;
}

function ictcpOpponentGuideColor(cpNormalized, ctNormalized) {
    const angle = (Math.atan2(ctNormalized, cpNormalized) + Math.PI * 2) % (Math.PI * 2);
    const degrees = THREE.MathUtils.radToDeg(angle);
    const stops = [
        { angle: 0, color: new THREE.Color(0xff3058) },
        { angle: 90, color: new THREE.Color(0xffe45c) },
        { angle: 180, color: new THREE.Color(0x27d86a) },
        { angle: 270, color: new THREE.Color(0x46a7ff) },
        { angle: 360, color: new THREE.Color(0xff3058) }
    ];
    const saturation = Math.min(1, Math.hypot(cpNormalized, ctNormalized));
    let hueColor = stops[0].color.clone();
    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        if (degrees >= a.angle && degrees <= b.angle) {
            hueColor = a.color.clone().lerp(b.color, (degrees - a.angle) / (b.angle - a.angle));
            break;
        }
    }
    return new THREE.Color(0xffffff).lerp(hueColor, saturation);
}

function createICtCpBasePlaneGroup() {
    const group = new THREE.Group();
    const center = new THREE.Vector3(0.5, 0.0, 0.5);
    const renderOrder = 650;
    const whitePlaneSize = 1.08;
    const halfSize = ICTCP_CHROMA_DISPLAY_SCALE * 0.5;
    const planeY = 0.004;
    const colorY = 0.007;
    const lineY = 0.011;
    const labelY = 0.048;

    const whitePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(whitePlaneSize, whitePlaneSize),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false
        })
    );
    whitePlane.rotation.x = Math.PI / 2;
    whitePlane.position.set(center.x, planeY, center.z);
    whitePlane.renderOrder = renderOrder;
    group.add(whitePlane);

    const planeGeo = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];
    const steps = 72;
    for (let zIndex = 0; zIndex <= steps; zIndex++) {
        const ctNormalized = -1 + (zIndex / steps) * 2;
        for (let xIndex = 0; xIndex <= steps; xIndex++) {
            const cpNormalized = -1 + (xIndex / steps) * 2;
            const color = ictcpOpponentGuideColor(cpNormalized, ctNormalized);
            vertices.push(
                center.x + cpNormalized * halfSize,
                colorY,
                center.z + ctNormalized * halfSize
            );
            colors.push(color.r, color.g, color.b);
        }
    }
    const columns = steps + 1;
    for (let zIndex = 0; zIndex < steps; zIndex++) {
        for (let xIndex = 0; xIndex < steps; xIndex++) {
            const i00 = zIndex * columns + xIndex;
            const i01 = i00 + 1;
            const i10 = (zIndex + 1) * columns + xIndex;
            const i11 = i10 + 1;
            indices.push(i00, i10, i01, i01, i10, i11);
        }
    }
    planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    planeGeo.setIndex(indices);
    planeGeo.computeVertexNormals();

    const colorPlane = new THREE.Mesh(
        planeGeo,
        new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.94,
            depthTest: false,
            depthWrite: false
        })
    );
    colorPlane.renderOrder = renderOrder + 1;
    group.add(colorPlane);

    const makePoint = (cp, ct, y = lineY) => new THREE.Vector3(
        center.x + cp * halfSize,
        y,
        center.z + ct * halfSize
    );
    const addLine = (points, colorHex, opacity = 0.72, order = renderOrder + 2) => {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity,
                depthTest: false,
                depthWrite: false
            })
        );
        line.renderOrder = order;
        group.add(line);
        return line;
    };

    for (let value = -0.8; value <= 0.8001; value += 0.2) {
        addLine([makePoint(value, -1), makePoint(value, 1)], 0xffffff, 0.44, renderOrder + 3);
        addLine([makePoint(-1, value), makePoint(1, value)], 0xffffff, 0.44, renderOrder + 3);
    }

    addLine([makePoint(-1, 0), makePoint(1, 0)], 0x111111, 0.95, renderOrder + 4);
    addLine([makePoint(0, -1), makePoint(0, 1)], 0x111111, 0.95, renderOrder + 4);

    const labels = new THREE.Group();
    const addLabel = (message, color, cp, ct, scale = 0.018) => {
        const label = createVectorTextLabel(message, color);
        label.position.copy(makePoint(cp, ct, labelY));
        label.scale.setScalar(scale);
        label.rotation.x = -Math.PI / 2;
        labels.add(label);
        return label;
    };
    addLabel('+Cp Red', '#111111', 1.18, 0, 0.018);
    addLabel('-Cp Green', '#111111', -1.22, 0, 0.018);
    addLabel('+Ct Yellow', '#111111', 0, 1.16, 0.018);
    addLabel('-Ct Blue', '#111111', 0, -1.16, 0.018);
    addLabel('I=0 Ct/Cp plane', '#111111', 0, -1.34, 0.017);

    [-0.4, 0, 0.4].forEach((value) => {
        const cpLabel = addLabel(value.toFixed(1), '#222222', value * 2, -0.08, 0.011);
        cpLabel.position.y = labelY + 0.002;
        const ctLabel = addLabel(value.toFixed(1), '#222222', 0.08, value * 2, 0.011);
        ctLabel.position.y = labelY + 0.002;
    });

    group.add(labels);
    return group;
}

function createICtCpStandardVolume(standard) {
    const vertices = [];
    const colors = [];
    const segments = 14;
    const tint = new THREE.Color(standard.colorHex);
    const peakNits = getPeakNitsForGamutName(standard.name);

    const addVertex = (r, g, b) => {
        const xyz = standard.toXYZ(r, g, b);
        const point = absoluteXYZToICtCpDisplayPoint(xyz.X, xyz.Y, xyz.Z);
        vertices.push(point.x, point.y, point.z);

        if (useICtCpLuminanceHeatmap) {
            const heatColor = luminanceHeatmapColor(xyz.Y, peakNits);
            colors.push(heatColor.r, heatColor.g, heatColor.b);
        } else if (useICtCpDisplayPeakLimit) {
            const displayColor = absoluteXYZToICtCpPeakColor(xyz.X, xyz.Y, xyz.Z);
            colors.push(displayColor.r, displayColor.g, displayColor.b);
        } else {
            const nativeColor = new THREE.Color(
                Math.pow(Math.max(0, r), 1 / 2.2),
                Math.pow(Math.max(0, g), 1 / 2.2),
                Math.pow(Math.max(0, b), 1 / 2.2)
            ).lerp(tint, 0.18);
            colors.push(nativeColor.r, nativeColor.g, nativeColor.b);
        }
    };

    const buildFace = (dimFixed, valFixed, dimU, dimV) => {
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const u1 = i / segments, v1 = j / segments;
                const u2 = (i + 1) / segments, v2 = (j + 1) / segments;
                const p1 = [], p2 = [], p3 = [], p4 = [];
                p1[dimFixed] = valFixed; p1[dimU] = u1; p1[dimV] = v1;
                p2[dimFixed] = valFixed; p2[dimU] = u2; p2[dimV] = v1;
                p3[dimFixed] = valFixed; p3[dimU] = u2; p3[dimV] = v2;
                p4[dimFixed] = valFixed; p4[dimU] = u1; p4[dimV] = v2;
                addVertex(...p1); addVertex(...p2); addVertex(...p3);
                addVertex(...p1); addVertex(...p3); addVertex(...p4);
            }
        }
    };

    buildFace(0, 0, 1, 2); buildFace(0, 1, 1, 2);
    buildFace(1, 0, 0, 2); buildFace(1, 1, 0, 2);
    buildFace(2, 0, 0, 1); buildFace(2, 1, 0, 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const fillMaterialOptions = applyICtCpPolygonOpacityOptions(useICtCpDisplayPeakLimit
        ? {
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1.0,
            depthWrite: true
        }
        : {
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: standard.opacity,
            depthWrite: false
        });

    const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial(fillMaterialOptions)
    );
    mesh.renderOrder = standard.renderOrder || 10;

    const wire = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.36, depthWrite: false })
    );
    wire.renderOrder = mesh.renderOrder + 1;

    const group = new THREE.Group();
    group.name = `${standard.key}_ICtCp`;
    group.userData.standard = standard;
    group.userData.defaultOpacity = standard.opacity;
    mesh.userData.isICtCpFill = true;
    wire.userData.isICtCpWire = true;
    group.add(mesh, wire);
    syncICtCpVolumeAppearance(group);
    return group;
}

function createICtCpNeutralAxis() {
    const points = [];
    for (let value = 0; value <= 1.0001; value += 0.0125) {
        const ictcp = bt2020LinearToICtCp(value, value, value);
        const point = mapICtCpToDisplay(ictcp);
        if (ictcpAxisMode === 'decoded-luminance') {
            point.y = mapICtCpDecodedNitsToHeight(decodeICtCpLuminanceNits(ictcp));
        }
        points.push(point);
    }
    return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 })
    );
}

let ictcpAxesGroup = null;
function rebuildICtCpAxes() {
    if (ictcpAxesGroup) {
        groupICtCp.remove(ictcpAxesGroup);
        ictcpAxesGroup.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
    ictcpAxesGroup = createICtCpAxes();
    groupICtCp.add(ictcpAxesGroup);
}
rebuildICtCpAxes();

const ictcpStandards = {
    srgb: { key: 'srgb', name: 'sRGB', toXYZ: sRGB_to_XYZ, colorHex: 0x6eb5ff, opacity: 0.85, renderOrder: 11 },
    p3: { key: 'p3', name: 'P3', toXYZ: DisplayP3_to_XYZ, colorHex: 0x88ff88, opacity: 0.6, renderOrder: 12 },
    rec601: { key: 'rec601', name: 'Rec601', toXYZ: Rec601_to_XYZ, colorHex: 0xffbf6a, opacity: 0.6, renderOrder: 13 },
    rec709: { key: 'rec709', name: 'Rec709', toXYZ: Rec709_to_XYZ, colorHex: 0xffdd66, opacity: 0.6, renderOrder: 14 },
    rec2020: { key: 'rec2020', name: 'Rec2020', toXYZ: Rec2020_to_XYZ, colorHex: 0xff8888, opacity: 0.4, renderOrder: 15 },
    pq: { key: 'pq', name: 'PQ', toXYZ: PQ_to_XYZ, colorHex: 0xdd88ff, opacity: 0.35, renderOrder: 16 },
    hlg: { key: 'hlg', name: 'HLG', toXYZ: HLG_to_XYZ, colorHex: 0xffaa44, opacity: 0.35, renderOrder: 17 }
};

const ictcpVolumes = {};
function syncICtCpVolumeAppearance(volume) {
    if (!volume) return;
    const fill = volume.children.find(child => child.userData?.isICtCpFill);
    const wire = volume.children.find(child => child.userData?.isICtCpWire);
    if (fill) fill.visible = isICtCpSolidSurface;
    if (wire) {
        wire.visible = showICtCpSurfaceLines;
        if (wire.material) {
            const overlayingFill = isICtCpSolidSurface && showICtCpSurfaceLines;
            wire.material.color.setHex(overlayingFill ? 0x555555 : 0xffffff);
            wire.material.opacity = overlayingFill ? 0.72 : 0.36;
        }
    }
}

function syncICtCpDependentControls() {
    const decodedAxis = ictcpAxisMode === 'decoded-luminance';
    toggleICtCpSolidSurface.disabled = !showICtCp3DPolygons;
    toggleICtCpSolidSurface.parentElement.style.opacity = showICtCp3DPolygons ? '1' : '0.45';
    toggleICtCpSurfaceLines.disabled = !showICtCp3DPolygons;
    toggleICtCpSurfaceLines.parentElement.style.opacity = showICtCp3DPolygons ? '1' : '0.45';
    inputICtCpPolygonOpacity.disabled = false;
    inputICtCpPolygonOpacity.parentElement.style.opacity = '1';
    toggleICtCpLogI.disabled = !showICtCp3DPolygons || !decodedAxis;
    toggleICtCpLogI.parentElement.style.opacity = showICtCp3DPolygons && decodedAxis ? '1' : '0.45';
    toggleICtCpYHeatmap.disabled = !showICtCp3DPolygons;
    toggleICtCpYHeatmap.parentElement.style.opacity = showICtCp3DPolygons ? '1' : '0.45';
    toggleICtCpYDisplayLimit.disabled = !showICtCp3DPolygons;
    toggleICtCpYDisplayLimit.parentElement.style.opacity = showICtCp3DPolygons ? '1' : '0.45';
    inputICtCpDisplayPeakNits.disabled = !showICtCp3DPolygons || !useICtCpDisplayPeakLimit;
    inputICtCpDisplayPeakNits.parentElement.style.opacity = showICtCp3DPolygons && useICtCpDisplayPeakLimit ? '1' : '0.45';
    selectICtCpEotfMode.disabled = !decodedAxis;
    inputICtCpDecodePeakNits.disabled = !decodedAxis || ictcpEotfMode === 'pq';
    ictcpEotfControls.style.opacity = decodedAxis ? '1' : '0.45';
}

function syncICtCpVolumeVisibility() {
    Object.keys(ictcpVolumes).forEach((key) => {
        const toggle = document.getElementById(`toggle-ictcp-${key}`);
        ictcpVolumes[key].visible = showICtCp3DPolygons && !!(toggle && toggle.checked);
        syncICtCpVolumeAppearance(ictcpVolumes[key]);
    });
}

function addICtCpStandardVolume(standard) {
    const volume = createICtCpStandardVolume(standard);
    const toggle = document.getElementById(`toggle-ictcp-${standard.key}`);
    volume.visible = showICtCp3DPolygons && !!(toggle && toggle.checked);
    ictcpVolumes[standard.key] = volume;
    groupICtCp.add(volume);
}

Object.values(ictcpStandards).forEach((standard) => {
    addICtCpStandardVolume(standard);
});

function rebuildICtCpVolumes() {
    Object.values(ictcpVolumes).forEach((volume) => {
        groupICtCp.remove(volume);
        volume.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    });
    Object.keys(ictcpVolumes).forEach((key) => delete ictcpVolumes[key]);
    Object.values(ictcpStandards).forEach((standard) => addICtCpStandardVolume(standard));
    syncICtCpVolumeVisibility();
}

syncICtCpDependentControls();
syncICtCpVolumeVisibility();
syncICtCpPolygonOpacityControl();

let ictcpNeutralAxis = createICtCpNeutralAxis();
ictcpNeutralAxis.visible = document.getElementById('toggle-ictcp-neutral').checked;
groupICtCp.add(ictcpNeutralAxis);

function rebuildICtCpNeutralAxis() {
    const isVisible = ictcpNeutralAxis.visible;
    groupICtCp.remove(ictcpNeutralAxis);
    if (ictcpNeutralAxis.geometry) ictcpNeutralAxis.geometry.dispose();
    if (ictcpNeutralAxis.material) ictcpNeutralAxis.material.dispose();
    ictcpNeutralAxis = createICtCpNeutralAxis();
    ictcpNeutralAxis.visible = isVisible;
    groupICtCp.add(ictcpNeutralAxis);
}

const ictcpBasePlaneGroup = createICtCpBasePlaneGroup();
ictcpBasePlaneGroup.visible = document.getElementById('toggle-ictcp-base-plane').checked;
groupICtCp.add(ictcpBasePlaneGroup);

const ictcpGridHelper = new THREE.GridHelper(1, 10, 0x4a4a4a, 0x262626);
ictcpGridHelper.position.set(0.5, 0.0, 0.5);
ictcpGridHelper.visible = document.getElementById('toggle-ictcp-grid').checked;
groupICtCp.add(ictcpGridHelper);
