// --------------------------------------------------------
// 8.0 CIE XYZ 탭 좌표계/변환 표시
// --------------------------------------------------------
const xyzTransformUI = {
    coordinateMode: document.getElementById('xyz-coordinate-mode'),
    secondaryAxes: document.getElementById('toggle-xyz-secondary-axes'),
    secondaryPolygon: document.getElementById('toggle-xyz-secondary-polygon'),
    toggle: document.getElementById('toggle-cie-rgb-xyz'),
    controls: document.getElementById('cie-rgb-transform-controls'),
    wavelength: document.getElementById('xyz-decomp-wavelength'),
    wavelengthValue: document.getElementById('xyz-decomp-wavelength-value'),
    hint: document.getElementById('xyz-decomp-hint'),
    coeffs: document.getElementById('xyz-decomp-coeffs')
};

const MATCHING_LAMBDA_MIN = 380;
const MATCHING_LAMBDA_MAX = 780;
const CIE_RGB_PRIMARIES = [
    { label: 'R', wavelength: 700.0, color: 'rgba(255,68,68,0.95)' },
    { label: 'G', wavelength: 546.1, color: 'rgba(68,255,68,0.95)' },
    { label: 'B', wavelength: 435.8, color: 'rgba(68,136,255,0.95)' }
];
const CIE_RGB_TO_XYZ = [
    [2.7689, 1.7517, 1.1302],
    [1.0000, 4.5907, 0.0601],
    [0.0000, 0.0565, 5.5943]
];

function invert3x3(m) {
    const a = m[0][0], b = m[0][1], c = m[0][2];
    const d = m[1][0], e = m[1][1], f = m[1][2];
    const g = m[2][0], h = m[2][1], i = m[2][2];
    const A = (e * i - f * h);
    const B = (c * h - b * i);
    const C = (b * f - c * e);
    const D = (f * g - d * i);
    const E = (a * i - c * g);
    const F = (c * d - a * f);
    const G = (d * h - e * g);
    const H = (b * g - a * h);
    const I = (a * e - b * d);
    const det = a * A + b * D + c * G;
    if (Math.abs(det) < 1e-12) return null;
    const invDet = 1 / det;
    return [
        [A * invDet, B * invDet, C * invDet],
        [D * invDet, E * invDet, F * invDet],
        [G * invDet, H * invDet, I * invDet]
    ];
}

function mat3MulVec3(m, v) {
    return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
    ];
}

const XYZ_TO_CIE_RGB = invert3x3(CIE_RGB_TO_XYZ);

function getXYZCoordinateMode() {
    return xyzTransformUI.coordinateMode?.value === 'rgb' ? 'rgb' : 'xyz';
}

function applyXYZInitialControlDefaults() {
    if (xyzTransformUI.coordinateMode) xyzTransformUI.coordinateMode.value = 'xyz';
    if (xyzTransformUI.secondaryAxes) xyzTransformUI.secondaryAxes.checked = false;
    if (xyzTransformUI.secondaryPolygon) xyzTransformUI.secondaryPolygon.checked = false;
    const normalizedPlaneToggle = document.getElementById('toggle-xyz-normalized-plane');
    if (normalizedPlaneToggle) normalizedPlaneToggle.checked = false;
    planeGroup.visible = false;
    projGroup.visible = false;
}

function getXYZModeDisplayScale(mode = getXYZCoordinateMode()) {
    return XYZ_COORDINATE_DISPLAY_SCALE[mode] ?? 1;
}

function hexColorToCss(colorHex) {
    return '#' + colorHex.toString(16).padStart(6, '0');
}

function vectorFromMatrixColumn(matrix, columnIndex) {
    return new THREE.Vector3(matrix[0][columnIndex], matrix[1][columnIndex], matrix[2][columnIndex]);
}

function matrix3ToMatrix4(matrix) {
    return new THREE.Matrix4().set(
        matrix[0][0], matrix[0][1], matrix[0][2], 0,
        matrix[1][0], matrix[1][1], matrix[1][2], 0,
        matrix[2][0], matrix[2][1], matrix[2][2], 0,
        0, 0, 0, 1
    );
}

function createScaledCoordinateAxis(dir, colorHex, label, coordinateMax, displayScale, lateralLabelSide = -1, coordinateMin = 0) {
    const group = new THREE.Group();
    const colorStr = hexColorToCss(colorHex);
    const displayMax = coordinateMax * displayScale;
    const displayMin = coordinateMin * displayScale;

    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), displayMax + 0.1, colorHex, 0.04, 0.04);
    group.add(arrow);

    if (coordinateMin < 0) {
        const negativeArrow = new THREE.ArrowHelper(
            dir.clone().multiplyScalar(-1),
            new THREE.Vector3(0, 0, 0),
            Math.abs(displayMin) + 0.04,
            colorHex,
            0.028,
            0.024
        );
        negativeArrow.line.material.transparent = true;
        negativeArrow.line.material.opacity = 0.55;
        negativeArrow.cone.material.transparent = true;
        negativeArrow.cone.material.opacity = 0.55;
        group.add(negativeArrow);
    }

    const labelSprite = createTextSprite(label, colorStr);
    labelSprite.position.copy(dir).multiplyScalar(displayMax + 0.18);
    labelSprite.scale.multiplyScalar(1.2);
    group.add(labelSprite);

    let offsetDir = new THREE.Vector3();
    if (dir.x > 0.5) { offsetDir.set(0, -1, 0); }
    else if (dir.y > 0.5) { offsetDir.set(lateralLabelSide, 0, 0); }
    else if (dir.z > 0.5) { offsetDir.set(lateralLabelSide, 0, 0); }

    const tickStep = coordinateMax <= 0.5 ? 0.1 : 0.2;
    const tickStart = coordinateMin < 0 ? Math.ceil(coordinateMin / tickStep) * tickStep : tickStep;
    for (let value = tickStart; value <= coordinateMax + 1e-6; value += tickStep) {
        if (Math.abs(value) < 1e-9) continue;
        const pos = dir.clone().multiplyScalar(value * displayScale);
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            pos.clone().add(offsetDir.clone().multiplyScalar(0.015)),
            pos.clone().add(offsetDir.clone().multiplyScalar(-0.015))
        ]);
        group.add(new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: colorHex })));

        const textSprite = createVectorTextLabel(value.toFixed(coordinateMax <= 0.5 ? 1 : 1), '#bbbbbb');
        textSprite.userData.isxyYNumericLabel = true;
        textSprite.position.copy(pos).add(offsetDir.clone().multiplyScalar(0.06));
        textSprite.scale.setScalar(0.024);
        group.add(textSprite);
    }

    return group;
}

function addTiltedBasisAxis(group, vector, colorHex, label, length = 1.2) {
    const direction = vector.clone();
    if (direction.lengthSq() < 1e-9) return;
    direction.normalize();

    const axis = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0), length, colorHex, 0.04, 0.035);
    axis.line.material.transparent = true;
    axis.line.material.opacity = 0.72;
    axis.cone.material.transparent = true;
    axis.cone.material.opacity = 0.72;
    group.add(axis);

    const labelSprite = createTextSprite(label, hexColorToCss(colorHex));
    labelSprite.position.copy(direction).multiplyScalar(length + 0.13);
    labelSprite.scale.multiplyScalar(0.92);
    group.add(labelSprite);
}

function getXYZDisplayMatrixForMode(mode) {
    const displayScale = getXYZModeDisplayScale(mode);
    const scaleMatrix = new THREE.Matrix4().makeScale(displayScale, displayScale, displayScale);
    if (mode === 'rgb' && XYZ_TO_CIE_RGB) {
        return matrix3ToMatrix4(XYZ_TO_CIE_RGB).premultiply(scaleMatrix);
    }
    return scaleMatrix;
}

function getSecondaryCoordinatePolygonColor(mode) {
    return mode === 'rgb' ? 0x60ff80 : 0xff9056;
}

function updateXYZSecondaryCoordinatePolygon() {
    const mainVolumeVisible = document.getElementById('toggle-xyz-spectrum-volume')?.checked ?? true;
    const visible = !!(xyzTransformUI.secondaryPolygon?.checked && mainVolumeVisible);
    xyzSecondaryCoordinatePolygonGroup.visible = visible;
    if (!visible) return;

    const otherMode = getXYZCoordinateMode() === 'rgb' ? 'xyz' : 'rgb';
    const color = getSecondaryCoordinatePolygonColor(otherMode);
    secondaryConeMesh.material.color.setHex(color);
    secondaryConeWire.material.color.setHex(color);
    xyzSecondaryCoordinatePolygonGroup.matrix.copy(getXYZDisplayMatrixForMode(otherMode));
    xyzSecondaryCoordinatePolygonGroup.matrixWorldNeedsUpdate = true;
}

function updateXYZCoordinatePolygonVisualStyle() {
    coneMeshXYZ.material.opacity = 0.52;
    coneMeshXYZ.material.depthWrite = false;
    coneMeshXYZ.renderOrder = 3;

    secondaryConeMesh.material.opacity = 0.08;
    secondaryConeWire.material.opacity = 0.22;
    secondaryConeMesh.renderOrder = 1;
    secondaryConeWire.renderOrder = 2;
}

function updateXYZSceneCoordinateTransform() {
    const mode = getXYZCoordinateMode();
    xyzSceneContentGroup.matrix.copy(getXYZDisplayMatrixForMode(mode));
    xyzSceneContentGroup.matrixWorldNeedsUpdate = true;
    updateXYZCoordinatePolygonVisualStyle();
    updateXYZSecondaryCoordinatePolygon();
}

function updateXYZCoordinateSystem() {
    clearThreeGroup(xyzCoordinateAxesGroup);
    const mode = getXYZCoordinateMode();
    const displayScale = getXYZModeDisplayScale(mode);
    const coordinateMax = XYZ_COORDINATE_AXIS_MAX[mode] ?? 1.2;
    const coordinateMin = XYZ_COORDINATE_AXIS_MIN[mode] ?? 0;
    const showSecondaryAxes = xyzTransformUI.secondaryAxes?.checked ?? false;
    const showXyzAxes = mode === 'xyz' || showSecondaryAxes;
    const showRgbAxes = mode === 'rgb' || showSecondaryAxes;

    if (mode === 'rgb') {
        if (showRgbAxes) {
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(1, 0, 0), CMF_AXIS_COLORS.RGB.R, 'R', coordinateMax, displayScale, -1, coordinateMin));
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(0, 1, 0), CMF_AXIS_COLORS.RGB.G, 'G', coordinateMax, displayScale, -1, coordinateMin));
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(0, 0, 1), CMF_AXIS_COLORS.RGB.B, 'B', coordinateMax, displayScale, -1, coordinateMin));
        }

        if (showXyzAxes && XYZ_TO_CIE_RGB) {
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(XYZ_TO_CIE_RGB, 0), CMF_AXIS_COLORS.XYZ.X, 'X');
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(XYZ_TO_CIE_RGB, 1), CMF_AXIS_COLORS.XYZ.Y, 'Y');
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(XYZ_TO_CIE_RGB, 2), CMF_AXIS_COLORS.XYZ.Z, 'Z');
        }
    } else {
        if (showXyzAxes) {
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(1, 0, 0), CMF_AXIS_COLORS.XYZ.X, 'X', coordinateMax, displayScale, -1, coordinateMin));
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(0, 1, 0), CMF_AXIS_COLORS.XYZ.Y, 'Y', coordinateMax, displayScale, -1, coordinateMin));
            xyzCoordinateAxesGroup.add(createScaledCoordinateAxis(new THREE.Vector3(0, 0, 1), CMF_AXIS_COLORS.XYZ.Z, 'Z', coordinateMax, displayScale, -1, coordinateMin));
        }

        if (showRgbAxes) {
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 0), CMF_AXIS_COLORS.RGB.R, 'R');
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 1), CMF_AXIS_COLORS.RGB.G, 'G');
            addTiltedBasisAxis(xyzCoordinateAxesGroup, vectorFromMatrixColumn(CIE_RGB_TO_XYZ, 2), CMF_AXIS_COLORS.RGB.B, 'B');
        }
    }

    updateXYZSceneCoordinateTransform();
}
