// 4. 그룹 초기화 및 축(Axis) 추가
// --------------------------------------------------------
const groupXYZ = new THREE.Group();
scene.add(groupXYZ);
groupXYZ.visible = false;
const xyzCoordinateAxesGroup = new THREE.Group();
const xyzSceneContentGroup = new THREE.Group();
xyzSceneContentGroup.matrixAutoUpdate = false;
groupXYZ.add(xyzCoordinateAxesGroup);
groupXYZ.add(xyzSceneContentGroup);

const groupLab = new THREE.Group();
scene.add(groupLab);
groupLab.visible = false;

const groupICtCp = new THREE.Group();
scene.add(groupICtCp);
groupICtCp.visible = false;

const groupxyY = new THREE.Group();
scene.add(groupxyY);
groupxyY.visible = true;

// CIELAB 축 (중심 원점 기반, opponent axis)
groupLab.add(createLabAxes());

// xyY 축 (x: 0~1, Y: 0~100 (SDR 기준), y: 0~1)
// x축은 요청에 따라 반전: 화면 좌->우로 갈수록 x 값은 1->0
function createReversedXAxis(maxVal = 1.0) {
    const group = new THREE.Group();
    const colorHex = 0xff3333;

    const arrowDir = new THREE.Vector3(-1, 0, 0);
    const arrowOrigin = new THREE.Vector3(1, 0, 0);
    const arrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, maxVal + 0.1, colorHex, 0.04, 0.04);
    group.add(arrow);

    const labelSprite = createTextSprite('x', '#ff3333');
    labelSprite.position.set(-0.18, 0, 0);
    labelSprite.scale.multiplyScalar(1.2);
    group.add(labelSprite);

    for (let value = 0.0; value <= maxVal + 1e-6; value += 0.2) {
        const xPos = 1.0 - value;
        const pos = new THREE.Vector3(xPos, 0, 0);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            pos.clone().add(new THREE.Vector3(0, -0.015, 0)),
            pos.clone().add(new THREE.Vector3(0, 0.015, 0))
        ]);
        group.add(new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: colorHex })));

        const textSprite = createVectorTextLabel(value.toFixed(1), '#bbbbbb');
        textSprite.userData.isxyYNumericLabel = true;
        textSprite.position.copy(pos).add(new THREE.Vector3(0, -0.06, 0));
        textSprite.scale.setScalar(0.024);
        group.add(textSprite);
    }

    return group;
}
groupxyY.add(createReversedXAxis(1.0));

const XY_X_AXIS_REVERSED = true;
const mapXToDisplay = (xChromaticity) => XY_X_AXIS_REVERSED ? (1.0 - xChromaticity) : xChromaticity;
const Y_AXIS_X_ORIGIN = mapXToDisplay(0.0);

// 동적 Y축 생성 로직
let yAxisGroup = new THREE.Group();
groupxyY.add(yAxisGroup);

function rebuildYAxis() {
    groupxyY.remove(yAxisGroup);
    yAxisGroup = new THREE.Group();
    const toggleCurve = document.getElementById('toggle-xyy-curve');
    yAxisGroup.visible = !!show3DPolygons || !!(toggleCurve && toggleCurve.checked);

    let maxNits = 100;
    if (gamuts && gamuts.pq && gamuts.pq.visible) maxNits = Math.max(maxNits, 10000);
    if (gamuts && gamuts.hlg && gamuts.hlg.visible) maxNits = Math.max(maxNits, 1000);

    // 초기 렌더링에 gamuts 요소들이 아직 바인딩 전일수 있으므로 checkbox 요소도 직접 체크
    const togglePQ = document.getElementById('toggle-xyy-pq');
    const toggleHLG = document.getElementById('toggle-xyy-hlg');
    if (togglePQ && togglePQ.checked) maxNits = Math.max(maxNits, 10000);
    if (toggleHLG && toggleHLG.checked) maxNits = Math.max(maxNits, 1000);

    const displayMaxHeight = mapYToScale(maxNits, maxNits);

    const yArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Y_AXIS_X_ORIGIN, 0, 0),
        displayMaxHeight * 1.1,
        0xffffff,
        0.04,
        0.04
    );
    yAxisGroup.add(yArrow);

    const yLabel = createTextSprite('Y (nits)', '#ffffff');
    yLabel.position.set(Y_AXIS_X_ORIGIN, displayMaxHeight * 1.18, 0);
    yLabel.scale.multiplyScalar(1.2);
    yAxisGroup.add(yLabel);

    let ticks = [];
    if (applyLogScale) {
        ticks.push(100);
        if (maxNits >= 1000) ticks.push(1000);
        if (maxNits >= 10000) ticks.push(10000);
    } else {
        const step = maxNits <= 100 ? 20 : (maxNits <= 1000 ? 200 : 2000);
        for (let i = step; i <= maxNits; i += step) {
            ticks.push(i);
        }
    }

    ticks = [...new Set(ticks)].sort((a, b) => a - b);
    for (let nits of ticks) {
        const height = mapYToScale(nits, maxNits);
        const pos = new THREE.Vector3(Y_AXIS_X_ORIGIN, height, 0);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            pos.clone().add(new THREE.Vector3(-0.015, 0, 0)),
            pos.clone().add(new THREE.Vector3(0.015, 0, 0))
        ]);
        yAxisGroup.add(new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));

        const textSprite = createVectorTextLabel(nits.toString(), '#bbbbbb');
        textSprite.userData.isxyYNumericLabel = true;
        textSprite.position.copy(pos).add(new THREE.Vector3(0.1, 0, 0));
        textSprite.scale.setScalar(0.024);
        yAxisGroup.add(textSprite);
    }

    groupxyY.add(yAxisGroup);
}

const chromaticityYAxis = createAxis(new THREE.Vector3(0, 0, 1), 0x33ff33, 'y', 1.0, 1);
chromaticityYAxis.position.x = mapXToDisplay(0.0);
groupxyY.add(chromaticityYAxis);

// 흰색 바닥 평면 (Z=0)
const xyPlaneGeo = new THREE.PlaneGeometry(1.2, 1.2);
const xyPlaneMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const xyPlaneMesh = new THREE.Mesh(xyPlaneGeo, xyPlaneMat);
xyPlaneMesh.rotation.x = Math.PI / 2;
xyPlaneMesh.position.set(0.5, -0.001, 0.5); // 선과 겹치지 않게 아주 약간 밑으로
xyPlaneMesh.visible = document.getElementById('toggle-xyy-plane').checked;
groupxyY.add(xyPlaneMesh);

// 2D 삼각형을 그리기 위한 그룹
const triangles2DGroup = new THREE.Group();
triangles2DGroup.visible = document.getElementById('toggle-xyy-triangles').checked;
groupxyY.add(triangles2DGroup);

// 2D CMYK 인쇄 표준(근사) 외곽선을 그리기 위한 그룹
const cmyk2DGroup = new THREE.Group();
groupxyY.add(cmyk2DGroup);

// 기준 화이트포인트(D 계열/E) 오버레이 그룹
const whitePointStandardsGroup = new THREE.Group();
whitePointStandardsGroup.visible = document.getElementById('toggle-xyy-whitepoint-standards').checked;
groupxyY.add(whitePointStandardsGroup);


// --------------------------------------------------------
// 5. 데이터 생성
// --------------------------------------------------------
const xyzPoints = [], xyzColors = [];
const projPoints = [], projColors = [];
const coneVertices = [], coneColors = [];
const labSurfaceVertices = [], labSurfaceColors = [], labSurfaceIndices = [];

const xyyPoints = [], xyyColors = [];
const xyyBasePoints = [], xyyBaseColors = [];
const xyyBaseChromaticityPoints = [];
const curtainVertices = [], curtainColors = [];

let prevXYZ, prevColor, prev_x, prev_y, prev_Y;
let maxYComponent = 1e-6;

for (let wl = 380; wl <= 780; wl += 2) {
    const xyz = wavelengthToXYZ(wl);
    const color = XYZtosRGB(xyz.x, xyz.y, xyz.z);
    const sum = xyz.x + xyz.y + xyz.z;
    maxYComponent = Math.max(maxYComponent, xyz.y);

    xyzPoints.push(xyz);
    xyzColors.push(color.r, color.g, color.b);

    if (sum > 0) {
        projPoints.push(new THREE.Vector3(xyz.x / sum, xyz.y / sum, xyz.z / sum));
        projColors.push(color.r, color.g, color.b);
    }

    if (wl > 380) {
        coneVertices.push(0, 0, 0, prevXYZ.x, prevXYZ.y, prevXYZ.z, xyz.x, xyz.y, xyz.z);
        coneColors.push(0.1, 0.1, 0.1, prevColor.r * 0.8, prevColor.g * 0.8, prevColor.b * 0.8, color.r * 0.8, color.g * 0.8, color.b * 0.8);
    }

    if (sum > 0) {
        const cx = xyz.x / sum;
        const cy = xyz.y / sum;
        const cY = xyz.y;
        const xDisplay = mapXToDisplay(cx);

        xyyPoints.push(new THREE.Vector3(xDisplay, cY, cy));
        xyyColors.push(color.r, color.g, color.b);

        xyyBasePoints.push(new THREE.Vector3(xDisplay, 0, cy));
        xyyBaseColors.push(color.r, color.g, color.b);
        xyyBaseChromaticityPoints.push(new THREE.Vector3(cx, 0, cy));

        if (wl > 380 && prev_x !== undefined) {
            curtainVertices.push(
                prev_x, 0, prev_y, prev_x, prev_Y, prev_y, xDisplay, 0, cy,
                prev_x, prev_Y, prev_y, xDisplay, cY, cy, xDisplay, 0, cy
            );
            curtainColors.push(
                prevColor.r * 0.2, prevColor.g * 0.2, prevColor.b * 0.2, prevColor.r * 0.6, prevColor.g * 0.6, prevColor.b * 0.6, color.r * 0.2, color.g * 0.2, color.b * 0.2,
                prevColor.r * 0.6, prevColor.g * 0.6, prevColor.b * 0.6, color.r * 0.6, color.g * 0.6, color.b * 0.6, color.r * 0.2, color.g * 0.2, color.b * 0.2
            );
        }
        prev_x = xDisplay; prev_y = cy; prev_Y = cY;
    }
    prevXYZ = xyz; prevColor = color;
}

const firstXYZ = xyzPoints[0], lastXYZ = xyzPoints[xyzPoints.length - 1];
const firstColor = new THREE.Color(xyzColors[0], xyzColors[1], xyzColors[2]);
const lastColor = new THREE.Color(xyzColors[xyzColors.length - 3], xyzColors[xyzColors.length - 2], xyzColors[xyzColors.length - 1]);

coneVertices.push(0, 0, 0, lastXYZ.x, lastXYZ.y, lastXYZ.z, firstXYZ.x, firstXYZ.y, firstXYZ.z);
coneColors.push(0.1, 0.1, 0.1, lastColor.r * 0.8, lastColor.g * 0.8, lastColor.b * 0.8, firstColor.r * 0.8, firstColor.g * 0.8, firstColor.b * 0.8);

// CIELAB opponent model 표면 (개념적 구형 모델)
const LAB_MODEL_A_RANGE = 104;
const LAB_MODEL_B_RANGE = 104;
const LAB_MODEL_RADIUS_X = 0.44;
const LAB_MODEL_RADIUS_Y = 0.5;
const LAB_MODEL_RADIUS_Z = 0.44;
const LAB_LAT_STEPS = 44;
const LAB_LON_STEPS = 88;
const labCols = LAB_LON_STEPS + 1;

for (let li = 0; li <= LAB_LAT_STEPS; li++) {
    const phi = (li / LAB_LAT_STEPS) * Math.PI;
    const ny = Math.cos(phi);
    const ring = Math.sin(phi);
    for (let hi = 0; hi <= LAB_LON_STEPS; hi++) {
        const theta = (hi / LAB_LON_STEPS) * Math.PI * 2;
        const nx = Math.cos(theta) * ring;
        const nz = Math.sin(theta) * ring;

        const x = 0.5 + nx * LAB_MODEL_RADIUS_X;
        const y = 0.5 + ny * LAB_MODEL_RADIUS_Y;
        const z = 0.5 + nz * LAB_MODEL_RADIUS_Z;

        const L = Math.max(0, Math.min(100, y * 100));
        const a = nx * LAB_MODEL_A_RANGE;
        const b = nz * LAB_MODEL_B_RANGE;

        const color = labOpponentColor(L, a, b);

        labSurfaceVertices.push(x, y, z);
        labSurfaceColors.push(color.r, color.g, color.b);
    }
}

for (let li = 0; li < LAB_LAT_STEPS; li++) {
    for (let hi = 0; hi < LAB_LON_STEPS; hi++) {
        const idx00 = li * labCols + hi;
        const idx10 = (li + 1) * labCols + hi;
        const idx01 = li * labCols + hi + 1;
        const idx11 = (li + 1) * labCols + hi + 1;
        labSurfaceIndices.push(idx00, idx10, idx01);
        labSurfaceIndices.push(idx01, idx10, idx11);
    }
}

const MACADAM_SEGMENTS = 72;
const MACADAM_MAGNIFICATION = 10;
const MACADAM_ELLIPSES = [
    { x: 0.160, y: 0.057, aMilli: 0.94, bMilli: 0.30, angleDeg: 62.3 },
    { x: 0.187, y: 0.118, aMilli: 2.31, bMilli: 0.44, angleDeg: 74.8 },
    { x: 0.253, y: 0.125, aMilli: 2.49, bMilli: 0.49, angleDeg: 54.8 },
    { x: 0.150, y: 0.680, aMilli: 9.09, bMilli: 2.21, angleDeg: 102.9 },
    { x: 0.131, y: 0.521, aMilli: 4.67, bMilli: 2.10, angleDeg: 110.5 },
    { x: 0.212, y: 0.550, aMilli: 5.63, bMilli: 2.30, angleDeg: 100.0 },
    { x: 0.258, y: 0.450, aMilli: 4.54, bMilli: 2.08, angleDeg: 88.5 },
    { x: 0.152, y: 0.365, aMilli: 3.81, bMilli: 1.86, angleDeg: 111.0 },
    { x: 0.280, y: 0.385, aMilli: 4.26, bMilli: 1.46, angleDeg: 74.6 },
    { x: 0.380, y: 0.498, aMilli: 4.23, bMilli: 1.32, angleDeg: 69.4 },
    { x: 0.160, y: 0.200, aMilli: 2.08, bMilli: 0.94, angleDeg: 95.4 },
    { x: 0.228, y: 0.250, aMilli: 3.09, bMilli: 0.82, angleDeg: 70.9 },
    { x: 0.305, y: 0.323, aMilli: 2.55, bMilli: 0.68, angleDeg: 57.2 },
    { x: 0.385, y: 0.393, aMilli: 3.70, bMilli: 1.48, angleDeg: 65.5 },
    { x: 0.472, y: 0.399, aMilli: 3.21, bMilli: 1.30, angleDeg: 54.0 },
    { x: 0.527, y: 0.350, aMilli: 2.56, bMilli: 1.27, angleDeg: 22.8 },
    { x: 0.475, y: 0.300, aMilli: 2.89, bMilli: 0.99, angleDeg: 29.1 },
    { x: 0.510, y: 0.236, aMilli: 2.40, bMilli: 1.15, angleDeg: 30.7 },
    { x: 0.596, y: 0.283, aMilli: 2.49, bMilli: 1.15, angleDeg: 11.1 },
    { x: 0.344, y: 0.284, aMilli: 2.24, bMilli: 0.97, angleDeg: 65.7 },
    { x: 0.390, y: 0.237, aMilli: 2.43, bMilli: 0.98, angleDeg: 44.2 },
    { x: 0.441, y: 0.198, aMilli: 2.73, bMilli: 0.90, angleDeg: 33.7 },
    { x: 0.278, y: 0.223, aMilli: 2.34, bMilli: 0.61, angleDeg: 60.3 },
    { x: 0.300, y: 0.163, aMilli: 3.01, bMilli: 0.60, angleDeg: 53.4 },
    { x: 0.365, y: 0.153, aMilli: 4.12, bMilli: 0.90, angleDeg: 38.6 }
];

function createMacAdamEllipsesGroup() {
    const group = new THREE.Group();
    const outlineElevation = 0.0012;
    const axisElevation = 0.0014;
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x161616, transparent: true, opacity: 0.95, depthTest: false });
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x0d0d0d, transparent: true, opacity: 0.65, depthTest: false });

    for (const ellipse of MACADAM_ELLIPSES) {
        const a = (ellipse.aMilli / 1000) * MACADAM_MAGNIFICATION;
        const b = (ellipse.bMilli / 1000) * MACADAM_MAGNIFICATION;
        const theta = THREE.MathUtils.degToRad(ellipse.angleDeg);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const outlinePoints = [];

        for (let i = 0; i < MACADAM_SEGMENTS; i++) {
            const t = (i / MACADAM_SEGMENTS) * Math.PI * 2;
            const localX = Math.cos(t) * a;
            const localY = Math.sin(t) * b;
            const dx = localX * cosTheta - localY * sinTheta;
            const dy = localX * sinTheta + localY * cosTheta;

            const x = ellipse.x + dx;
            const y = ellipse.y + dy;
            const displayX = mapXToDisplay(x);
            outlinePoints.push(new THREE.Vector3(displayX, outlineElevation, y));
        }

        outlinePoints.push(outlinePoints[0].clone());
        const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(outlinePoints), outlineMaterial);
        outline.renderOrder = 11;
        group.add(outline);

        const majorDx = a * cosTheta;
        const majorDy = a * sinTheta;
        const minorDx = -b * sinTheta;
        const minorDy = b * cosTheta;

        const majorAxis = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(mapXToDisplay(ellipse.x - majorDx), axisElevation, ellipse.y - majorDy),
                new THREE.Vector3(mapXToDisplay(ellipse.x + majorDx), axisElevation, ellipse.y + majorDy)
            ]),
            axisMaterial
        );
        majorAxis.renderOrder = 12;
        group.add(majorAxis);

        const minorAxis = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(mapXToDisplay(ellipse.x - minorDx), axisElevation, ellipse.y - minorDy),
                new THREE.Vector3(mapXToDisplay(ellipse.x + minorDx), axisElevation, ellipse.y + minorDy)
            ]),
            axisMaterial
        );
        minorAxis.renderOrder = 12;
        group.add(minorAxis);
    }
    return group;
}


// --------------------------------------------------------
// 6. XYZ 객체 메쉬 생성
// --------------------------------------------------------
const locusMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 3 });
const locusGroup = new THREE.Group();
const locusGeo = new THREE.BufferGeometry().setFromPoints(xyzPoints);
locusGeo.setAttribute('color', new THREE.Float32BufferAttribute(xyzColors, 3));
const purpleGeo = new THREE.BufferGeometry().setFromPoints([lastXYZ, firstXYZ]);
purpleGeo.setAttribute('color', new THREE.Float32BufferAttribute([lastColor.r, lastColor.g, lastColor.b, firstColor.r, firstColor.g, firstColor.b], 3));
locusGroup.add(new THREE.Line(locusGeo, locusMat), new THREE.Line(purpleGeo, locusMat));
xyzSceneContentGroup.add(locusGroup);

const coneGeo = new THREE.BufferGeometry();
coneGeo.setAttribute('position', new THREE.Float32BufferAttribute(coneVertices, 3));
coneGeo.setAttribute('color', new THREE.Float32BufferAttribute(coneColors, 3));
coneGeo.computeVertexNormals();
const coneMeshXYZ = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false }));
xyzSceneContentGroup.add(coneMeshXYZ);

const xyzSecondaryCoordinatePolygonGroup = new THREE.Group();
xyzSecondaryCoordinatePolygonGroup.matrixAutoUpdate = false;
xyzSecondaryCoordinatePolygonGroup.visible = false;
const secondaryConeMesh = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.08, depthWrite: false })
);
const secondaryConeWire = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.26, depthWrite: false })
);
xyzSecondaryCoordinatePolygonGroup.add(secondaryConeMesh, secondaryConeWire);
groupXYZ.add(xyzSecondaryCoordinatePolygonGroup);

const planeGeo = new THREE.BufferGeometry();
planeGeo.setAttribute('position', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
const planeGroup = new THREE.Group();
planeGroup.add(new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, transparent: true, opacity: 0.15, depthWrite: false })));
planeGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 })));
xyzSceneContentGroup.add(planeGroup);

const projGroup = new THREE.Group();
const projGeo = new THREE.BufferGeometry().setFromPoints(projPoints);
projGeo.setAttribute('color', new THREE.Float32BufferAttribute(projColors, 3));
const projPurpGeo = new THREE.BufferGeometry().setFromPoints([projPoints[projPoints.length - 1], projPoints[0]]);
projPurpGeo.setAttribute('color', new THREE.Float32BufferAttribute([projColors[projColors.length - 3], projColors[projColors.length - 2], projColors[projColors.length - 1], projColors[0], projColors[1], projColors[2]], 3));
projGroup.add(new THREE.Line(projGeo, new THREE.LineBasicMaterial({ vertexColors: true })));
projGroup.add(new THREE.Line(projPurpGeo, new THREE.LineBasicMaterial({ vertexColors: true })));
xyzSceneContentGroup.add(projGroup);

// --------------------------------------------------------
// 6.5 CIELAB 객체 메쉬 생성
// --------------------------------------------------------
const labSurfaceGeo = new THREE.BufferGeometry();
labSurfaceGeo.setAttribute('position', new THREE.Float32BufferAttribute(labSurfaceVertices, 3));
labSurfaceGeo.setAttribute('color', new THREE.Float32BufferAttribute(labSurfaceColors, 3));
labSurfaceGeo.setIndex(labSurfaceIndices);
labSurfaceGeo.computeVertexNormals();
const labSurfaceMesh = new THREE.Mesh(
    labSurfaceGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.88, depthWrite: false })
);
labSurfaceMesh.visible = document.getElementById('toggle-lab-surface').checked;
groupLab.add(labSurfaceMesh);

const labSliceRingsGroup = new THREE.Group();
const ringLevels = [20, 35, 50, 65, 80];
ringLevels.forEach((level) => {
    const ny = (level / 100 - 0.5) / LAB_MODEL_RADIUS_Y;
    const ringScale = Math.sqrt(Math.max(0, 1 - ny * ny));
    const rx = LAB_MODEL_RADIUS_X * ringScale;
    const rz = LAB_MODEL_RADIUS_Z * ringScale;
    const points = [];
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        points.push(new THREE.Vector3(0.5 + Math.cos(t) * rx, level / 100, 0.5 + Math.sin(t) * rz));
    }
    const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.55 })
    );
    labSliceRingsGroup.add(ring);
});
labSliceRingsGroup.visible = labSurfaceMesh.visible;
groupLab.add(labSliceRingsGroup);

const neutralStart = mapLabToDisplay(0, 0, 0);
const neutralEnd = mapLabToDisplay(100, 0, 0);
const labNeutralAxis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([neutralStart, neutralEnd]),
    new THREE.LineBasicMaterial({ color: 0xbbbbbb })
);
labNeutralAxis.visible = document.getElementById('toggle-lab-neutral').checked;
groupLab.add(labNeutralAxis);

const labABPlaneGroup = createLabABPlaneGroup();
labABPlaneGroup.visible = document.getElementById('toggle-lab-ab-plane').checked;
groupLab.add(labABPlaneGroup);

const labGridHelper = new THREE.GridHelper(1, 10, 0x5a5a5a, 0x2e2e2e);
labGridHelper.position.set(0.5, 0.5, 0.5);
labGridHelper.visible = document.getElementById('toggle-lab-grid').checked;
groupLab.add(labGridHelper);

// --------------------------------------------------------
