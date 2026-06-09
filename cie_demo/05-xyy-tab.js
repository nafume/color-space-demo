// 7. xyY 객체 메쉬 생성
// --------------------------------------------------------
const xyyMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 });
const xyyCurveGroup = new THREE.Group();
const xyyCurveGeo = new THREE.BufferGeometry().setFromPoints(xyyPoints);
xyyCurveGeo.setAttribute('color', new THREE.Float32BufferAttribute(xyyColors, 3));
xyyCurveGroup.add(new THREE.Line(xyyCurveGeo, xyyMat));
groupxyY.add(xyyCurveGroup);
const xyyRelativeY = xyyPoints.map(p => p.y);
const inputXyyPolygonOpacity = document.getElementById('input-xyy-opacity');
const xyyPolygonOpacityValue = document.getElementById('xyy-opacity-value');
const XYY_FALLBACK_POLYGON_OPACITY = 0.6;
let xyyPolygonOpacityOverride = null;

function getXyyPolygonOpacityControlValue() {
    if (xyyPolygonOpacityOverride !== null) return xyyPolygonOpacityOverride;
    if (typeof gamuts !== 'undefined') {
        const activeOpacities = Object.entries(gamuts)
            .filter(([key]) => document.getElementById(`toggle-xyy-${key}`)?.checked)
            .map(([, gamut]) => gamut.userData.defaultOpacity)
            .filter((opacity) => Number.isFinite(opacity));
        if (activeOpacities.length === 1) return activeOpacities[0];
        if (activeOpacities.length > 1) return Math.max(...activeOpacities);
    }
    return XYY_FALLBACK_POLYGON_OPACITY;
}

function syncXyyPolygonOpacityControl() {
    const opacity = getXyyPolygonOpacityControlValue();
    inputXyyPolygonOpacity.value = opacity.toFixed(2);
    xyyPolygonOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
}

function applyXyyPolygonOpacityOptions(materialOptions) {
    const baseOpacity = Number.isFinite(materialOptions.opacity) ? materialOptions.opacity : 1;
    const opacity = Math.max(0.01, xyyPolygonOpacityOverride ?? baseOpacity);
    materialOptions.opacity = opacity;
    if (opacity < 0.999) {
        materialOptions.transparent = true;
        materialOptions.depthWrite = false;
    }
    return materialOptions;
}

const xyyBaseGroup = new THREE.Group();
const xyyBaseGeo = new THREE.BufferGeometry().setFromPoints(xyyBasePoints);
xyyBaseGeo.setAttribute('color', new THREE.Float32BufferAttribute(xyyBaseColors, 3));
xyyBaseGroup.add(new THREE.Line(xyyBaseGeo, new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 })));

function getxyYDisplayPointForWavelength(lambda) {
    const xyz = wavelengthToXYZ(lambda);
    const sum = Math.max(1e-9, xyz.x + xyz.y + xyz.z);
    const cx = xyz.x / sum;
    const cy = xyz.y / sum;
    return new THREE.Vector3(mapXToDisplay(cx), 0, cy);
}

function getSpectralLocusOutwardNormal(lambda, center) {
    const prev = getxyYDisplayPointForWavelength(Math.max(CIE1931_2DEG_CMF_START, lambda - 1));
    const next = getxyYDisplayPointForWavelength(Math.min(CIE1931_2DEG_CMF_END, lambda + 1));
    const tangent = next.sub(prev);
    tangent.y = 0;

    if (tangent.lengthSq() < 1e-10) {
        const fallback = getxyYDisplayPointForWavelength(lambda).sub(center);
        fallback.y = 0;
        return fallback.lengthSq() > 1e-10 ? fallback.normalize() : new THREE.Vector3(1, 0, 0);
    }

    tangent.normalize();
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x);
    const point = getxyYDisplayPointForWavelength(lambda);
    const outward = point.clone().sub(center);
    outward.y = 0;
    if (normal.dot(outward) < 0) normal.multiplyScalar(-1);
    return normal.normalize();
}

function buildWavelengthMarksGroup() {
    const group = new THREE.Group();
    const wavelengths = [];
    for (let lambda = 380; lambda <= 700; lambda += 10) {
        wavelengths.push(lambda);
    }
    const tickLength = 0.023;
    const labelOffset = 0.04;
    const locusCenter = new THREE.Vector3(mapXToDisplay(0.33), 0, 0.33);

    wavelengths.forEach((lambda) => {
        const point = getxyYDisplayPointForWavelength(lambda);
        const outward = getSpectralLocusOutwardNormal(lambda, locusCenter);

        const tickStart = point.clone();
        const tickEnd = point.clone().add(outward.clone().multiplyScalar(tickLength));
        tickStart.y = 0.004;
        tickEnd.y = 0.004;

        const tick = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([tickStart, tickEnd]),
            new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.95, depthTest: false })
        );
        tick.userData.isFloorContrastLine = true;
        tick.renderOrder = 998;
        group.add(tick);

        const shouldShowLabel =
            lambda % 10 === 0 &&
            !(lambda > 620 && lambda < 700) &&
            !(lambda > 380 && lambda < 450);
        if (shouldShowLabel) {
            const suffix = (lambda % 50 === 0 || lambda === 510 || lambda === 700) ? ' nm' : '';
            const label = createVectorTextLabel(`${lambda}${suffix}`, '#111111');
            label.renderOrder = TEXT_SPRITE_RENDER_ORDER - 1;
            label.userData.isWavelengthLabel = true;
            label.userData.baseVisible = true;
            label.scale.setScalar(0.012);
            label.position.copy(point).add(outward.clone().multiplyScalar(labelOffset));
            label.position.y = 0.018;
            group.add(label);
        }
    });

    return group;
}

xyyBaseGroup.add(buildWavelengthMarksGroup());


groupxyY.add(xyyBaseGroup);

const xyyMacAdamGroup = createMacAdamEllipsesGroup();
xyyMacAdamGroup.visible = document.getElementById('toggle-xyy-macadam').checked;
groupxyY.add(xyyMacAdamGroup);

// --------------------------------------------------------
// 7.1 2D xy 색도도 컬러 채우기 (표준 CIE 1931 2° 기반, sRGB 표시)
// --------------------------------------------------------
function buildChromaticityFillCanvas(size, polygonPointsXZ) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;

    const poly = polygonPointsXZ.map(p => ({ x: p.x, y: p.z }));
    const n = poly.length;
    const polyX = new Float32Array(n);
    const polyY = new Float32Array(n);
    for (let i = 0; i < n; i++) { polyX[i] = poly[i].x; polyY[i] = poly[i].y; }

    const compand = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    const toByte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));

    for (let j = 0; j < size; j++) {
        const y = 1.0 - (j + 0.5) / size;
        if (y <= 1e-6 || y >= 1.0) continue;

        const xs = [];
        for (let i = 0, k = n - 1; i < n; k = i++) {
            const y1 = polyY[k], y2 = polyY[i];
            if ((y1 > y) !== (y2 > y)) {
                const x1 = polyX[k], x2 = polyX[i];
                const t = (y - y1) / (y2 - y1);
                xs.push(x1 + t * (x2 - x1));
            }
        }
        if (xs.length < 2) continue;
        xs.sort((a, b) => a - b);

        for (let m = 0; m < xs.length - 1; m += 2) {
            const xStart = xs[m];
            const xEnd = xs[m + 1];
            let iStart = Math.ceil(size * xStart - 0.5);
            let iEnd = Math.floor(size * xEnd - 0.5);
            if (iEnd < 0 || iStart >= size) continue;
            iStart = Math.max(0, iStart);
            iEnd = Math.min(size - 1, iEnd);

            for (let i = iStart; i <= iEnd; i++) {
                const x = (i + 0.5) / size;
                const Y = 1.0;
                const X = (x * Y) / y;
                const Z = Math.max(0, ((1 - x - y) * Y) / y);

                let r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
                let g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
                let b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

                r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
                const maxRGB = Math.max(r, g, b);
                if (maxRGB > 0) { r /= maxRGB; g /= maxRGB; b /= maxRGB; }

                r = compand(r); g = compand(g); b = compand(b);
                const idx = (j * size + i) * 4;
                data[idx] = toByte(r);
                data[idx + 1] = toByte(g);
                data[idx + 2] = toByte(b);
                data[idx + 3] = 255;
            }
        }
    }

    ctx.putImageData(img, 0, 0);
    return canvas;
}

const chromaCanvas = buildChromaticityFillCanvas(512, xyyBaseChromaticityPoints);
const chromaTexture = new THREE.CanvasTexture(chromaCanvas);
chromaTexture.minFilter = THREE.LinearMipmapLinearFilter;
chromaTexture.magFilter = THREE.LinearFilter;
if (XY_X_AXIS_REVERSED) {
    chromaTexture.wrapS = THREE.RepeatWrapping;
    chromaTexture.repeat.x = -1;
    chromaTexture.offset.x = 1;
}

const chromaFillMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 1.0),
    new THREE.MeshBasicMaterial({ map: chromaTexture, side: THREE.DoubleSide, transparent: true, opacity: 1.0, depthWrite: false })
);
chromaFillMesh.rotation.x = Math.PI / 2;
chromaFillMesh.position.set(0.5, -0.0005, 0.5);
chromaFillMesh.visible = document.getElementById('toggle-xyy-chromaticity-fill').checked;
groupxyY.add(chromaFillMesh);

const first_cx = xyyPoints[0].x, first_cy = xyyPoints[0].z, first_cY = xyyPoints[0].y;
const last_cx = xyyPoints[xyyPoints.length - 1].x, last_cy = xyyPoints[xyyPoints.length - 1].z, last_cY = xyyPoints[xyyPoints.length - 1].y;
curtainVertices.push(
    last_cx, 0, last_cy, last_cx, last_cY, last_cy, first_cx, 0, first_cy,
    last_cx, last_cY, last_cy, first_cx, first_cY, first_cy, first_cx, 0, first_cy
);
curtainColors.push(
    lastColor.r * 0.2, lastColor.g * 0.2, lastColor.b * 0.2, lastColor.r * 0.6, lastColor.g * 0.6, lastColor.b * 0.6, firstColor.r * 0.2, firstColor.g * 0.2, firstColor.b * 0.2,
    lastColor.r * 0.6, lastColor.g * 0.6, lastColor.b * 0.6, firstColor.r * 0.6, firstColor.g * 0.6, firstColor.b * 0.6, firstColor.r * 0.2, firstColor.g * 0.2, firstColor.b * 0.2
);
const curtainGeo = new THREE.BufferGeometry();
curtainGeo.setAttribute('position', new THREE.Float32BufferAttribute(curtainVertices, 3));
curtainGeo.setAttribute('color', new THREE.Float32BufferAttribute(curtainColors, 3));
curtainGeo.computeVertexNormals();
const curtainMesh = new THREE.Mesh(curtainGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.15, depthWrite: false }));
groupxyY.add(curtainMesh);
const curtainRelativeYRaw = Float32Array.from(curtainVertices);

function rebuildxyYCurveAndCurtainHeights() {
    const mapRelativeY = (relativeY) => mapYToScale(Math.max(0, relativeY) * 100.0, 100.0);

    const curvePos = xyyCurveGeo.attributes.position.array;
    for (let i = 0; i < xyyRelativeY.length; i++) {
        curvePos[i * 3 + 1] = mapRelativeY(xyyRelativeY[i]);
    }
    xyyCurveGeo.attributes.position.needsUpdate = true;
    xyyCurveGeo.computeBoundingSphere();

    const curtainPos = curtainGeo.attributes.position.array;
    for (let i = 1; i < curtainPos.length; i += 3) {
        const rawY = curtainRelativeYRaw[i];
        curtainPos[i] = rawY <= 0 ? 0 : mapRelativeY(rawY);
    }
    curtainGeo.attributes.position.needsUpdate = true;
    curtainGeo.computeVertexNormals();
}

function createDashedFloorGrid(size = 1, divisions = 10) {
    const group = new THREE.Group();
    const material = new THREE.LineDashedMaterial({
        color: 0x2f2f2f,
        dashSize: 0.006,
        gapSize: 0.004,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
    });
    const step = size / divisions;
    const half = size / 2;

    for (let i = 0; i <= divisions; i++) {
        const offset = -half + i * step;
        const verticalGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(offset, 0.0008, -half),
            new THREE.Vector3(offset, 0.0008, half)
        ]);
        const horizontalGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-half, 0.0008, offset),
            new THREE.Vector3(half, 0.0008, offset)
        ]);
        const vertical = new THREE.Line(verticalGeo, material);
        const horizontal = new THREE.Line(horizontalGeo, material);
        vertical.computeLineDistances();
        horizontal.computeLineDistances();
        group.add(vertical, horizontal);
    }

    return group;
}

const gridHelper = createDashedFloorGrid(1, 10);
gridHelper.position.set(0.5, 0, 0.5);
groupxyY.add(gridHelper);


// --------------------------------------------------------
// 8. Color Space 변환 로직 (RGB 0~1 to Absolute XYZ nits)
// --------------------------------------------------------

// sRGB (SDR, 100 nits)
function sRGB_to_XYZ(r, g, b) {
    const lr = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const lg = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const lb = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const X = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) * 100;
    const Y = (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) * 100;
    const Z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Display P3 (SDR, 100 nits, sRGB Transfer curve)
function DisplayP3_to_XYZ(r, g, b) {
    const lr = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const lg = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const lb = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    const X = (lr * 0.4865709 + lg * 0.2656677 + lb * 0.1982173) * 100;
    const Y = (lr * 0.2289746 + lg * 0.6917385 + lb * 0.0792869) * 100;
    const Z = (lr * 0.0000000 + lg * 0.0451134 + lb * 1.0439444) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Adobe RGB (1998) (SDR, 100 nits, D65, gamma 563/256)
function AdobeRGB_to_XYZ(r, g, b) {
    const gamma = 563 / 256;
    const lr = Math.pow(r, gamma);
    const lg = Math.pow(g, gamma);
    const lb = Math.pow(b, gamma);
    const X = (lr * 0.5767309 + lg * 0.1855540 + lb * 0.1881852) * 100;
    const Y = (lr * 0.2973769 + lg * 0.6273491 + lb * 0.0752741) * 100;
    const Z = (lr * 0.0270343 + lg * 0.0706872 + lb * 0.9911085) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// ProPhoto RGB (SDR, 100 nits, D50, gamma 1.8 with linear toe)
function ProPhotoRGB_to_XYZ(r, g, b) {
    const decode = (value) => value <= 16 / 512 ? value / 16 : Math.pow(value, 1.8);
    const lr = decode(r);
    const lg = decode(g);
    const lb = decode(b);
    const X = (lr * 0.7976749 + lg * 0.1351917 + lb * 0.0313534) * 100;
    const Y = (lr * 0.2880402 + lg * 0.7118741 + lb * 0.0000857) * 100;
    const Z = (lr * 0.0000000 + lg * 0.0000000 + lb * 0.8252100) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Rec. 709 (SDR, 100 nits, ITU-R BT.709 OETF inverse)
function Rec709_to_XYZ(r, g, b) {
    const lr = r < 0.081 ? r / 4.5 : Math.pow((r + 0.099) / 1.099, 1 / 0.45);
    const lg = g < 0.081 ? g / 4.5 : Math.pow((g + 0.099) / 1.099, 1 / 0.45);
    const lb = b < 0.081 ? b / 4.5 : Math.pow((b + 0.099) / 1.099, 1 / 0.45);
    const X = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) * 100;
    const Y = (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) * 100;
    const Z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Rec. 601 (SDR, 100 nits, SMPTE-C primaries, BT.601 OETF inverse)
function Rec601_to_XYZ(r, g, b) {
    const lr = r < 0.081 ? r / 4.5 : Math.pow((r + 0.099) / 1.099, 1 / 0.45);
    const lg = g < 0.081 ? g / 4.5 : Math.pow((g + 0.099) / 1.099, 1 / 0.45);
    const lb = b < 0.081 ? b / 4.5 : Math.pow((b + 0.099) / 1.099, 1 / 0.45);
    const X = (lr * 0.3935 + lg * 0.3653 + lb * 0.1916) * 100;
    const Y = (lr * 0.2124 + lg * 0.7011 + lb * 0.0866) * 100;
    const Z = (lr * 0.0187 + lg * 0.1119 + lb * 0.9582) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Rec. 2020 (SDR, 100 nits, BT.2020 curve)
function Rec2020_to_XYZ(r, g, b) {
    const alpha = 1.09929682680944; const beta = 0.018053968510807;
    const lr = r < beta * 4.5 ? r / 4.5 : Math.pow((r + alpha - 1) / alpha, 1 / 0.45);
    const lg = g < beta * 4.5 ? g / 4.5 : Math.pow((g + alpha - 1) / alpha, 1 / 0.45);
    const lb = b < beta * 4.5 ? b / 4.5 : Math.pow((b + alpha - 1) / alpha, 1 / 0.45);
    const X = (lr * 0.636958 + lg * 0.144617 + lb * 0.168881) * 100;
    const Y = (lr * 0.262700 + lg * 0.677998 + lb * 0.059302) * 100;
    const Z = (lr * 0.000000 + lg * 0.028073 + lb * 1.060985) * 100;
    return { X, Y, Z, lr, lg, lb };
}

// Rec. 2100 PQ (HDR, 10000 nits, SMPTE ST 2084)
function PQ_to_XYZ(r, g, b) {
    const m1 = 2610 / 16384;
    const m2 = (2523 / 4096) * 128;
    const c1 = 3424 / 4096;
    const c2 = (2413 / 4096) * 32;
    const c3 = (2392 / 4096) * 32;
    const eotf = (v) => {
        const vp = Math.pow(v, 1 / m2);
        const num = Math.max(vp - c1, 0);
        const den = Math.max(c2 - c3 * vp, 1e-6); // zero division protection
        return Math.pow(num / den, 1 / m1) * 10000; // PQ scales 0-1 to 0-10,000 nits
    };
    const lr = eotf(r), lg = eotf(g), lb = eotf(b);
    const X = (lr * 0.636958 + lg * 0.144617 + lb * 0.168881);
    const Y = (lr * 0.262700 + lg * 0.677998 + lb * 0.059302);
    const Z = (lr * 0.000000 + lg * 0.028073 + lb * 1.060985);
    return { X, Y, Z, lr: lr / 10000, lg: lg / 10000, lb: lb / 10000 };
}

// Rec. 2100 HLG (HDR, nominally 1000 nits peak, ARIB STD-B67)
function HLG_to_XYZ(r, g, b) {
    const a = 0.17883277, b_val = 0.28466892, c = 0.55991073;
    const invOETF = (v) => v <= 0.5 ? Math.pow(v, 2) / 3 : (Math.exp((v - c) / a) + b_val) / 12;
    let lr = invOETF(r), lg = invOETF(g), lb = invOETF(b);

    // OOTD (Optical to Optical) Assuming Lw = 1000 nits, gamma ~ 1.2
    const Ys = 0.2627 * lr + 0.6780 * lg + 0.0593 * lb;
    const gamma = 1.2;
    const Lw = 1000;
    const scale = Math.pow(Ys, gamma - 1);

    lr *= scale; lg *= scale; lb *= scale;
    const X = (lr * 0.636958 + lg * 0.144617 + lb * 0.168881) * Lw;
    const Y = (lr * 0.262700 + lg * 0.677998 + lb * 0.059302) * Lw;
    const Z = (lr * 0.000000 + lg * 0.028073 + lb * 1.060985) * Lw;
    return { X, Y, Z, lr: lr, lg: lg, lb: lb };
}

// --------------------------------------------------------
// 9. Gamut 3D 폴리곤 독립적 생성 유틸리티
// --------------------------------------------------------

const toggleLogY = document.getElementById('toggle-log-y');
let applyLogScale = toggleLogY.checked;
const toggleYHeatmap = document.getElementById('toggle-y-heatmap');
const toggleYDisplayLimit = document.getElementById('toggle-y-display-limit');
const inputDisplayPeakNits = document.getElementById('input-display-peak-nits');
let useLuminanceHeatmap = toggleYHeatmap.checked;
let useDisplayPeakLimit = toggleYDisplayLimit.checked;

function getDisplayPeakNits() {
    const parsed = Number(inputDisplayPeakNits.value);
    if (!Number.isFinite(parsed)) return 600;
    return Math.max(1, Math.min(10000, parsed));
}

// Y축 스케일 매핑 함수 (100 -> 높이 1.0, 10000 -> 높이 2.something)
// Log 스케일 적용 시: height = log10(Y + 1) / log10(100+1)  (100nits 가 여전히 높이 1이 되도록)
function mapYToScale(Ynits, referencePeakNits = 100) {
    if (applyLogScale) {
        return Math.log10(Ynits + 1) / Math.log10(101);
    } else {
        return Ynits / 100.0;
    }
}

function getPeakNitsForGamutName(name) {
    if (name === 'PQ') return 10000;
    if (name === 'HLG') return 1000;
    return 100;
}

function luminanceHeatmapColor(Ynits, referencePeakNits) {
    const t = Math.max(0, Math.min(1, Math.log10(Ynits + 1) / Math.log10(referencePeakNits + 1)));
    const stops = [
        { t: 0.00, color: new THREE.Color(0x102040) },
        { t: 0.25, color: new THREE.Color(0x0c78ff) },
        { t: 0.50, color: new THREE.Color(0x00e0c0) },
        { t: 0.75, color: new THREE.Color(0xffcc33) },
        { t: 1.00, color: new THREE.Color(0xffffff) }
    ];
    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        if (t >= a.t && t <= b.t) {
            return a.color.clone().lerp(b.color, (t - a.t) / (b.t - a.t));
        }
    }
    return stops[stops.length - 1].color.clone();
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function linearSrgbLuminance(linearColor) {
    return 0.2126729 * linearColor.r + 0.7151522 * linearColor.g + 0.0721750 * linearColor.b;
}

function liftLinearSrgbToTargetLuminance(linearColor, targetLuminance) {
    const lifted = {
        r: clamp01(linearColor.r),
        g: clamp01(linearColor.g),
        b: clamp01(linearColor.b)
    };

    let currentLuminance = linearSrgbLuminance(lifted);
    if (currentLuminance <= 1e-8 && targetLuminance <= 1e-8) return lifted;

    if (currentLuminance > targetLuminance && currentLuminance > 1e-8) {
        const scale = targetLuminance / currentLuminance;
        lifted.r *= scale;
        lifted.g *= scale;
        lifted.b *= scale;
        return lifted;
    }

    const channelWeights = [
        { key: 'r', weight: 0.2126729 },
        { key: 'g', weight: 0.7151522 },
        { key: 'b', weight: 0.0721750 }
    ];

    for (let pass = 0; pass < 3 && currentLuminance < targetLuminance - 1e-6; pass++) {
        const availableWeight = channelWeights.reduce((sum, channel) => (
            lifted[channel.key] < 1 - 1e-8 ? sum + channel.weight : sum
        ), 0);
        if (availableWeight <= 1e-8) break;

        const lift = (targetLuminance - currentLuminance) / availableWeight;
        channelWeights.forEach((channel) => {
            if (lifted[channel.key] < 1 - 1e-8) {
                lifted[channel.key] = Math.min(1, lifted[channel.key] + lift);
            }
        });
        currentLuminance = linearSrgbLuminance(lifted);
    }

    return lifted;
}

function absoluteXYZToDisplayPeakColor(X, Y, Z) {
    const displayPeakNits = getDisplayPeakNits();
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

function applyPhysicalLuminanceMaterialOptions(materialOptions) {
    const physicalOptions = Object.assign({}, materialOptions);
    physicalOptions.transparent = false;
    physicalOptions.opacity = 1.0;
    physicalOptions.depthWrite = true;
    delete physicalOptions.roughness;
    delete physicalOptions.metalness;
    delete physicalOptions.color;
    return physicalOptions;
}

const gamutStyleColors = {
    sRGB: 0x6eb5ff,
    P3: 0x88ff88,
    'adobe-rgb': 0xff7ac8,
    'prophoto-rgb': 0xb7f36b,
    Rec601: 0xffbf6a,
    Rec709: 0xffdd66,
    Rec2020: 0xff8888,
    PQ: 0xdd88ff,
    HLG: 0xffaa44
};

function createGamutMesh(toXYZ_Func, materialOptions, name) {
    const vertices = [];
    const colors = [];
    const peakNits = getPeakNitsForGamutName(name);
    const baseMaterialOptions = Object.assign({}, materialOptions);

    function addVertex(r, g, b) {
        const { X, Y, Z, lr, lg, lb } = toXYZ_Func(r, g, b);
        let sum = X + Y + Z;
        let cx = sum > 0 ? X / sum : 0.3127;
        let cy = sum > 0 ? Y / sum : 0.3290;
        cx = mapXToDisplay(cx);

        // Y는 Absolute nits 이므로, 화면에 그릴 스케일로 변환
        let height = mapYToScale(Y, peakNits);

        vertices.push(cx, height, cy);

        if (useLuminanceHeatmap) {
            const heatColor = luminanceHeatmapColor(Y, peakNits);
            colors.push(heatColor.r, heatColor.g, heatColor.b);
        } else if (useDisplayPeakLimit) {
            const displayColor = absoluteXYZToDisplayPeakColor(X, Y, Z);
            colors.push(displayColor.r, displayColor.g, displayColor.b);
        } else {
            // 표시되는 폴리곤의 정점 색상 매핑 (선형적인 RGB 추정치를 출력)
            // HDR의 경우 값이 작아서 너무 어둡게 보이므로 살짝 보정
            colors.push(Math.pow(Math.min(1, Math.max(0, lr)), 1 / 2.2) || r,
                Math.pow(Math.min(1, Math.max(0, lg)), 1 / 2.2) || g,
                Math.pow(Math.min(1, Math.max(0, lb)), 1 / 2.2) || b);
        }
    }

    const segments = 12; // 최적화
    function buildFace(dimFixed, valFixed, dimU, dimV) {
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
    }
    buildFace(0, 0, 1, 2); buildFace(0, 1, 1, 2);
    buildFace(1, 0, 0, 2); buildFace(1, 1, 0, 2);
    buildFace(2, 0, 0, 1); buildFace(2, 1, 0, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    let effectiveMaterialOptions = useDisplayPeakLimit
        ? applyPhysicalLuminanceMaterialOptions(baseMaterialOptions)
        : Object.assign({}, baseMaterialOptions);
    if (effectiveMaterialOptions.transparent && effectiveMaterialOptions.depthWrite === undefined) {
        effectiveMaterialOptions.depthWrite = false;
    }
    effectiveMaterialOptions = applyXyyPolygonOpacityOptions(effectiveMaterialOptions);

    effectiveMaterialOptions.wireframe = false;
    const MaterialClass = useDisplayPeakLimit ? THREE.MeshBasicMaterial : THREE.MeshStandardMaterial;

    const renderOrder = name === 'Rec2020' ? 20 : name === 'PQ' ? 30 : name === 'HLG' ? 31 : 10;
    const mesh = new THREE.Mesh(geo, new MaterialClass(effectiveMaterialOptions));
    mesh.renderOrder = renderOrder;
    mesh.userData.isGamutFill = true;
    mesh.visible = document.getElementById('toggle-solid-surface')?.checked ?? true;

    const wire = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
            vertexColors: true,
            wireframe: true,
            transparent: true,
            opacity: 0.48,
            depthWrite: false
        })
    );
    wire.renderOrder = renderOrder + 1;
    wire.userData.isGamutWire = true;
    wire.visible = document.getElementById('toggle-xyy-surface-lines')?.checked ?? false;

    const group = new THREE.Group();
    group.name = name;
    group.userData = {
        toXYZ_Func,
        vertices,
        colors,
        materialOptions: baseMaterialOptions,
        defaultOpacity: Number.isFinite(baseMaterialOptions.opacity) ? baseMaterialOptions.opacity : 1,
        isGamutMesh: true
    };
    group.add(mesh, wire);
    return group;
}

const gamuts = {};

gamuts.srgb = createGamutMesh(sRGB_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85, roughness: 0.3, metalness: 0.1, wireframe: false }, 'sRGB');
gamuts.p3 = createGamutMesh(DisplayP3_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0x88ff88 }, 'P3');
gamuts.p3.visible = false;

gamuts['adobe-rgb'] = createGamutMesh(AdobeRGB_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0xff7ac8 }, 'adobe-rgb');
gamuts['adobe-rgb'].visible = false;

gamuts['prophoto-rgb'] = createGamutMesh(ProPhotoRGB_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.5, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0xb7f36b }, 'prophoto-rgb');
gamuts['prophoto-rgb'].visible = false;

gamuts.rec709 = createGamutMesh(Rec709_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0xffdd66 }, 'Rec709');
gamuts.rec709.visible = false;

gamuts.rec601 = createGamutMesh(Rec601_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0xffbf6a }, 'Rec601');
gamuts.rec601.visible = false;

gamuts.rec2020 = createGamutMesh(Rec2020_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.4, roughness: 0.3, metalness: 0.1, wireframe: false, color: 0xff8888 }, 'Rec2020');
gamuts.rec2020.visible = false;

gamuts.pq = createGamutMesh(PQ_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.35, roughness: 0.3, metalness: 0.1, wireframe: false }, 'PQ');
gamuts.pq.visible = false;

gamuts.hlg = createGamutMesh(HLG_to_XYZ, { vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.35, roughness: 0.3, metalness: 0.1, wireframe: false }, 'HLG');
gamuts.hlg.visible = false;

groupxyY.add(gamuts.srgb, gamuts.p3, gamuts['adobe-rgb'], gamuts['prophoto-rgb'], gamuts.rec709, gamuts.rec601, gamuts.rec2020, gamuts.pq, gamuts.hlg);

// --- 2D 색역 삼각형 그리기 로직 ---
const triangleMeshes = {};
const standardDisplayName = {
    sRGB: 'sRGB',
    P3: 'Display P3',
    'adobe-rgb': 'Adobe RGB',
    'prophoto-rgb': 'ProPhoto RGB',
    Rec709: 'Rec.709',
    Rec601: 'Rec.601',
    Rec2020: 'Rec.2020',
    PQ: 'Rec.2100 PQ',
    HLG: 'Rec.2100 HLG',
    fogra39: 'FOGRA39',
    swopv2: 'SWOP v2',
    japan2001: 'Japan Color 2001'
};
const standardWhitePointName = {
    sRGB: 'D65',
    P3: 'D65',
    'adobe-rgb': 'D65',
    'prophoto-rgb': 'D50',
    Rec709: 'D65',
    Rec601: 'D65',
    Rec2020: 'D65',
    PQ: 'D65',
    HLG: 'D65',
    fogra39: 'D50',
    swopv2: 'D50',
    japan2001: 'D50'
};

function getPolylineCentroid(polyline) {
    let sx = 0, sz = 0;
    const n = Math.max(1, polyline.length);
    for (let i = 0; i < polyline.length; i++) {
        sx += polyline[i].x;
        sz += polyline[i].y;
    }
    return { x: sx / n, z: sz / n };
}

function getPerimeterLabelAnchor(polyline, interiorPoint = null, radialOffset = 0.06) {
    const centroid = getPolylineCentroid(polyline);
    const ref = interiorPoint || centroid;
    let edgePoint = polyline[0];
    let maxDist = -1;
    for (let i = 0; i < polyline.length; i++) {
        const pt = polyline[i];
        const d2 = Math.pow(pt.x - ref.x, 2) + Math.pow(pt.y - ref.z, 2);
        if (d2 > maxDist) {
            maxDist = d2;
            edgePoint = pt;
        }
    }

    let vx = edgePoint.x - centroid.x;
    let vz = edgePoint.y - centroid.z;
    let len = Math.hypot(vx, vz);
    if (len < 1e-6) {
        vx = edgePoint.x - ref.x;
        vz = edgePoint.y - ref.z;
        len = Math.hypot(vx, vz);
    }
    if (len < 1e-6) {
        vx = 1; vz = 0; len = 1;
    }

    return {
        x: edgePoint.x + (vx / len) * radialOffset,
        z: edgePoint.y + (vz / len) * radialOffset
    };
}

function addStandardWhitePointMarker(group, name, colorHex, wx, wy, polyline) {
    const markerX = wx;
    const markerZ = wy;
    const markerRenderOrder = FLOOR_LABEL_RENDER_ORDER - 80;

    const outer = new THREE.Mesh(
        new THREE.RingGeometry(0.0042, 0.0070, 24),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 1.0, depthTest: false, depthWrite: false })
    );
    outer.userData.isWhitePointMarker = true;
    outer.renderOrder = markerRenderOrder + 1;
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(markerX, 0.0025, markerZ);
    group.add(outer);

    const underlay = new THREE.Mesh(
        new THREE.RingGeometry(0.0035, 0.0078, 24),
        new THREE.MeshBasicMaterial({ color: 0x101010, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false })
    );
    underlay.userData.isWhitePointMarker = true;
    underlay.renderOrder = markerRenderOrder;
    underlay.rotation.x = -Math.PI / 2;
    underlay.position.set(markerX, 0.0023, markerZ);
    group.add(underlay);

    const centroid = getPolylineCentroid(polyline);
    let vx = markerX - centroid.x;
    let vz = markerZ - centroid.z;
    let len = Math.hypot(vx, vz);
    if (len < 1e-6) {
        vx = 0.75; vz = 0.25;
        len = Math.hypot(vx, vz);
    }

    const wpText = `WP ${standardWhitePointName[name] || 'D65'}`;
    const wpLabel = createFloorLabelSprite(wpText, '#e6e6e6');
    wpLabel.userData.isWhitePointLabel = true;
    wpLabel.scale.set(0.14, 0.042, 1);
    wpLabel.position.set(markerX + (vx / len) * 0.032, 0.012, markerZ + (vz / len) * 0.032);
    group.add(wpLabel);
}

function addStandardFloorLabel(group, name, colorHex, polyline, interiorPoint = null) {
    const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
    const displayText = standardDisplayName[name] || name;
    const label = createFloorLabelSprite(displayText, colorStr);
    label.userData.isStandardFloorLabel = true;
    const anchor = getPerimeterLabelAnchor(polyline, interiorPoint, 0.058);
    label.position.set(anchor.x, 0.015, anchor.z);
    group.add(label);
}

function build2DStrokeBandGeometry(polyline, yLevel, strokeWidth) {
    const half = strokeWidth * 0.5;
    const positions = [];
    for (let i = 0; i < polyline.length - 1; i++) {
        const p0 = polyline[i];
        const p1 = polyline[i + 1];
        const dx = p1.x - p0.x;
        const dz = p1.y - p0.y;
        const len = Math.hypot(dx, dz);
        if (len < 1e-6) continue;

        const nx = -dz / len;
        const nz = dx / len;

        const ax = p0.x + nx * half, az = p0.y + nz * half;
        const bx = p0.x - nx * half, bz = p0.y - nz * half;
        const cx = p1.x + nx * half, cz = p1.y + nz * half;
        const dx2 = p1.x - nx * half, dz2 = p1.y - nz * half;

        positions.push(
            ax, yLevel, az, bx, yLevel, bz, cx, yLevel, cz,
            bx, yLevel, bz, dx2, yLevel, dz2, cx, yLevel, cz
        );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
}

function create2DOutlinedStroke(polyline, colorHex, yLevel = 0.0015) {
    const group = new THREE.Group();

    const underlayGeo = build2DStrokeBandGeometry(polyline, yLevel, 0.0043);
    const underlayMat = new THREE.MeshBasicMaterial({
        color: 0x101010,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
    });
    const underlay = new THREE.Mesh(underlayGeo, underlayMat);
    underlay.renderOrder = FLOOR_LABEL_RENDER_ORDER - 110;
    group.add(underlay);

    const overlayGeo = build2DStrokeBandGeometry(polyline, yLevel + 0.0002, 0.0027);
    const overlayMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
    });
    const overlay = new THREE.Mesh(overlayGeo, overlayMat);
    overlay.renderOrder = FLOOR_LABEL_RENDER_ORDER - 100;
    group.add(overlay);

    return group;
}

function create2DTriangle(toXYZ_Func, colorHex, name) {
    // R, G, B 의 xy 좌표 추출 (nits 와 상관없이 비율로서의 xy)
    const pts = [
        toXYZ_Func(1, 0, 0),
        toXYZ_Func(0, 1, 0),
        toXYZ_Func(0, 0, 1)
    ];

    const polyline = [];
    pts.forEach(pt => {
        const sum = pt.X + pt.Y + pt.Z;
        let cx = sum > 0 ? pt.X / sum : 0.3127;
        let cy = sum > 0 ? pt.Y / sum : 0.3290;
        cx = mapXToDisplay(cx);
        polyline.push({ x: cx, y: cy });
    });
    polyline.push({ x: polyline[0].x, y: polyline[0].y }); // 닫힌 선분

    const stroke = create2DOutlinedStroke(polyline, colorHex, 0.0012);
    const group = new THREE.Group();
    group.name = name + '_2D';
    group.add(stroke);

    const wp = toXYZ_Func(1, 1, 1);
    const wsum = Math.max(1e-6, wp.X + wp.Y + wp.Z);
    const wpX = mapXToDisplay(wp.X / wsum);
    const wpY = wp.Y / wsum;
    const polylineOpen = polyline.slice(0, -1);
    addStandardFloorLabel(group, name, colorHex, polylineOpen, { x: wpX, z: wpY });
    addStandardWhitePointMarker(group, name, colorHex, wpX, wpY, polylineOpen);

    return group;
}

triangleMeshes.srgb = create2DTriangle(sRGB_to_XYZ, 0x6eb5ff, 'sRGB');
triangleMeshes.p3 = create2DTriangle(DisplayP3_to_XYZ, 0x88ff88, 'P3');
triangleMeshes['adobe-rgb'] = create2DTriangle(AdobeRGB_to_XYZ, 0xff7ac8, 'adobe-rgb');
triangleMeshes['prophoto-rgb'] = create2DTriangle(ProPhotoRGB_to_XYZ, 0xb7f36b, 'prophoto-rgb');
triangleMeshes.rec709 = create2DTriangle(Rec709_to_XYZ, 0xffdd66, 'Rec709');
triangleMeshes.rec601 = create2DTriangle(Rec601_to_XYZ, 0xffbf6a, 'Rec601');
triangleMeshes.rec2020 = create2DTriangle(Rec2020_to_XYZ, 0xff8888, 'Rec2020');
triangleMeshes.pq = create2DTriangle(Rec2020_to_XYZ, 0xdd88ff, 'PQ');
triangleMeshes.hlg = create2DTriangle(Rec2020_to_XYZ, 0xffaa44, 'HLG');

// 초기화
Object.entries(triangleMeshes).forEach(([key, mesh]) => {
    const toggle = document.getElementById(`toggle-xyy-${key}`);
    mesh.visible = !!(toggle && toggle.checked);
    triangles2DGroup.add(mesh);
});

// --- 2D CMYK 인쇄 표준(근사) 외곽선 ---
// 주의: 아래 xy 값은 대표 ICC 프로파일의 전형적인 인쇄 고형색 좌표를 단순화한 근사치다.
// 실제 인쇄 결과는 잉크/용지/TVI/측정조건에 따라 달라질 수 있다.
const cmykStandards = {
    fogra39: {
        color: 0xff66cc,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.183, y: 0.112 }, // B (C+M)
            { x: 0.370, y: 0.205 }, // M
            { x: 0.503, y: 0.335 }, // R (M+Y)
            { x: 0.438, y: 0.499 }, // Y
            { x: 0.285, y: 0.445 }, // G (C+Y)
            { x: 0.190, y: 0.180 }  // C
        ]
    },
    swopv2: {
        color: 0xff99cc,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.180, y: 0.102 },
            { x: 0.362, y: 0.190 },
            { x: 0.492, y: 0.325 },
            { x: 0.433, y: 0.487 },
            { x: 0.277, y: 0.430 },
            { x: 0.188, y: 0.168 }
        ]
    },
    japan2001: {
        color: 0xcc66ff,
        white: { x: 0.3457, y: 0.3585 },
        hull: [
            { x: 0.186, y: 0.116 },
            { x: 0.378, y: 0.214 },
            { x: 0.511, y: 0.343 },
            { x: 0.446, y: 0.506 },
            { x: 0.292, y: 0.452 },
            { x: 0.196, y: 0.184 }
        ]
    }
};

const cmykMeshes = {};
function createCMYKStandardOutline(key, standard) {
    const group = new THREE.Group();
    const polyline = [...standard.hull, standard.hull[0]].map(pt => ({ x: mapXToDisplay(pt.x), y: pt.y }));
    const outline = create2DOutlinedStroke(polyline, standard.color, 0.0014);
    outline.name = `CMYK_${key}_outline`;
    group.add(outline);

    const hullDisplay = standard.hull.map(pt => ({ x: mapXToDisplay(pt.x), y: pt.y }));
    const wpX = mapXToDisplay(standard.white.x);
    const wpY = standard.white.y;
    addStandardFloorLabel(group, key, standard.color, hullDisplay, { x: wpX, z: wpY });
    addStandardWhitePointMarker(group, key, standard.color, wpX, wpY, hullDisplay);

    return group;
}

Object.keys(cmykStandards).forEach((key) => {
    cmykMeshes[key] = createCMYKStandardOutline(key, cmykStandards[key]);
    cmyk2DGroup.add(cmykMeshes[key]);
});
cmykMeshes.fogra39.visible = document.getElementById('toggle-xyy-cmyk-fogra39').checked;
cmykMeshes.swopv2.visible = document.getElementById('toggle-xyy-cmyk-swopv2').checked;
cmykMeshes.japan2001.visible = document.getElementById('toggle-xyy-cmyk-japan2001').checked;

const whitePointStandards = [
    { name: 'D50', x: 0.34567, y: 0.35850, color: 0xfff0cc },
    { name: 'D55', x: 0.33242, y: 0.34743, color: 0xffefb8 },
    { name: 'D60', x: 0.32168, y: 0.33767, color: 0xffeb9e },
    { name: 'D65', x: 0.31271, y: 0.32902, color: 0xffffff },
    { name: 'D75', x: 0.29902, y: 0.31485, color: 0xd8e8ff },
    { name: 'E', x: 1 / 3, y: 1 / 3, color: 0xe6e6e6 }
];

function buildWhitePointStandardsOverlay() {
    whitePointStandardsGroup.clear();
    const displayPoints = whitePointStandards.map((wp) => ({
        ...wp,
        xDisplay: mapXToDisplay(wp.x),
        zDisplay: wp.y
    }));

    const center = displayPoints.reduce((acc, wp) => {
        acc.x += wp.xDisplay;
        acc.z += wp.zDisplay;
        return acc;
    }, { x: 0, z: 0 });
    center.x /= displayPoints.length;
    center.z /= displayPoints.length;

    displayPoints.forEach((wp) => {
        const x = wp.xDisplay;
        const z = wp.zDisplay;

        const underlay = new THREE.Mesh(
            new THREE.RingGeometry(0.0032, 0.0070, 24),
            new THREE.MeshBasicMaterial({ color: 0x101010, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false })
        );
        underlay.rotation.x = -Math.PI / 2;
        underlay.position.set(x, 0.0023, z);
        underlay.userData.isWhitePointMarker = true;
        underlay.renderOrder = FLOOR_LABEL_RENDER_ORDER - 80;
        whitePointStandardsGroup.add(underlay);

        const outer = new THREE.Mesh(
            new THREE.RingGeometry(0.0039, 0.0063, 24),
            new THREE.MeshBasicMaterial({ color: wp.color, side: THREE.DoubleSide, transparent: true, opacity: 1.0, depthTest: false, depthWrite: false })
        );
        outer.rotation.x = -Math.PI / 2;
        outer.position.set(x, 0.0027, z);
        outer.userData.isWhitePointMarker = true;
        outer.renderOrder = FLOOR_LABEL_RENDER_ORDER - 79;
        whitePointStandardsGroup.add(outer);

        const labelColor = '#' + wp.color.toString(16).padStart(6, '0');
        const label = createFloorLabelSprite(wp.name, labelColor);
        label.userData.isWhitePointLabel = true;
        label.scale.set(0.12, 0.036, 1);

        let dirX = x - center.x;
        let dirZ = z - center.z;
        let dirLen = Math.hypot(dirX, dirZ);
        if (dirLen < 1e-6) {
            dirX = x - mapXToDisplay(0.3127);
            dirZ = z - 0.3290;
            dirLen = Math.hypot(dirX, dirZ);
        }
        if (dirLen < 1e-6) {
            dirX = 1;
            dirZ = 0;
            dirLen = 1;
        }

        const radialOffset = 0.045;
        label.position.set(x + (dirX / dirLen) * radialOffset, 0.012, z + (dirZ / dirLen) * radialOffset);
        whitePointStandardsGroup.add(label);
    });
}
buildWhitePointStandardsOverlay();


// Y축 스케일 변경에 따른 메쉬 업데이트
const toggle3DPolygons = document.getElementById('toggle-xyy-3d-polygons');
const toggleSolidSurface = document.getElementById('toggle-solid-surface');
const toggleSurfaceLines = document.getElementById('toggle-xyy-surface-lines');
const togglexyYCurve = document.getElementById('toggle-xyy-curve');
const togglexyYCurtain = document.getElementById('toggle-xyy-curtain');
let show3DPolygons = toggle3DPolygons.checked;
let isSolidSurface = toggleSolidSurface.checked;
let showSurfaceLines = toggleSurfaceLines.checked;

function syncDependentControls() {
    toggleSolidSurface.disabled = !show3DPolygons;
    toggleSolidSurface.parentElement.style.opacity = show3DPolygons ? '1' : '0.45';
    toggleSurfaceLines.disabled = !show3DPolygons;
    toggleSurfaceLines.parentElement.style.opacity = show3DPolygons ? '1' : '0.45';
    inputXyyPolygonOpacity.disabled = false;
    inputXyyPolygonOpacity.parentElement.style.opacity = '1';
    toggleLogY.disabled = !show3DPolygons;
    toggleLogY.parentElement.style.opacity = show3DPolygons ? '1' : '0.45';
    toggleYHeatmap.disabled = !show3DPolygons;
    toggleYHeatmap.parentElement.style.opacity = show3DPolygons ? '1' : '0.45';
    toggleYDisplayLimit.disabled = !show3DPolygons;
    toggleYDisplayLimit.parentElement.style.opacity = show3DPolygons ? '1' : '0.45';
    inputDisplayPeakNits.disabled = !show3DPolygons || !useDisplayPeakLimit;
    inputDisplayPeakNits.parentElement.style.opacity = show3DPolygons && useDisplayPeakLimit ? '1' : '0.45';
    togglexyYCurtain.disabled = !togglexyYCurve.checked;
    togglexyYCurtain.parentElement.style.opacity = togglexyYCurve.checked ? '1' : '0.45';
}

function syncSpectralLocusVisibility() {
    xyyCurveGroup.visible = togglexyYCurve.checked;
    curtainMesh.visible = togglexyYCurve.checked && togglexyYCurtain.checked;
}

function syncFloorLabelContrast() {
    const useDarkBaseContrast = !xyPlaneMesh.visible;
    const isDayTheme = typeof currentTheme !== 'undefined' && currentTheme === 'day';
    const fillColor = isDayTheme ? '#000000' : useDarkBaseContrast ? '#ffffff' : '#000000';
    const strokeColor = isDayTheme
        ? 'rgba(255,255,255,0.95)'
        : useDarkBaseContrast ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)';
    const lineColor = isDayTheme ? 0x111111 : useDarkBaseContrast ? 0xffffff : 0x111111;
    groupxyY.traverse((obj) => {
        if (!obj.userData) return;
        if (obj.userData.floorLabel) {
            drawFloorLabelTexture(obj, fillColor, strokeColor);
        }
        if (obj.userData.isxyYNumericLabel && obj.userData.textSprite) {
            drawTextSpriteTexture(obj, fillColor, strokeColor);
        }
        if ((obj.userData.isxyYNumericLabel || obj.userData.isWavelengthLabel) && obj.userData.isVectorTextLabel && obj.material?.color) {
            obj.material.color.set(fillColor);
        }
        if (obj.userData.isFloorContrastLine && obj.material && obj.material.color) {
            obj.material.color.set(lineColor);
        }
    });
}

function isVisibleInScene(obj) {
    let current = obj;
    while (current) {
        if (!current.visible) return false;
        current = current.parent;
    }
    return true;
}

function getFloorPlaneDistance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

function syncWavelengthLabelOcclusion() {
    const blockers = [];
    groupxyY.traverse((obj) => {
        if (!obj.userData || !isVisibleInScene(obj)) return;
        if (!obj.userData.isStandardFloorLabel && !obj.userData.isWhitePointLabel) return;

        const position = new THREE.Vector3();
        obj.getWorldPosition(position);
        const radius = obj.userData.isStandardFloorLabel
            ? Math.max(0.105, obj.scale.x * 0.48)
            : Math.max(0.055, obj.scale.x * 0.44);
        blockers.push({ position, radius });
    });

    groupxyY.traverse((obj) => {
        if (!obj.userData || !obj.userData.isWavelengthLabel) return;
        if (obj.userData.baseVisible === false) {
            obj.visible = false;
            return;
        }

        const position = new THREE.Vector3();
        obj.getWorldPosition(position);
        obj.visible = !blockers.some((blocker) => (
            getFloorPlaneDistance(position, blocker.position) < blocker.radius
        ));
    });
}

function sync3DPolygonVisibility() {
    Object.keys(gamuts).forEach((key) => {
        const toggle = document.getElementById(`toggle-xyy-${key}`);
        gamuts[key].visible = show3DPolygons && !!(toggle && toggle.checked);
        syncGamutAppearance(gamuts[key]);
    });
}

function syncGamutAppearance(gamut) {
    if (!gamut) return;
    const fill = gamut.children?.find(child => child.userData?.isGamutFill);
    const wire = gamut.children?.find(child => child.userData?.isGamutWire);
    if (fill) fill.visible = isSolidSurface;
    if (wire) {
        wire.visible = showSurfaceLines;
        if (wire.material) {
            const overlayingFill = isSolidSurface && showSurfaceLines;
            wire.material.color.setHex(overlayingFill ? 0x555555 : 0xffffff);
            wire.material.opacity = overlayingFill ? 0.72 : 0.48;
        }
    }
}

syncDependentControls();
sync3DPolygonVisibility();
syncXyyPolygonOpacityControl();
syncSpectralLocusVisibility();
syncFloorLabelContrast();
syncWavelengthLabelOcclusion();

function rebuildGamuts() {
    Object.values(gamuts).forEach(obj => {
        const name = obj.name.toLowerCase();
        const toXYZ_Func = obj.userData.toXYZ_Func;
        const matOpts = obj.userData.materialOptions;
        // 기존 객체 삭제 후 재 생성
        groupxyY.remove(obj);

        obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });

        let newObj = createGamutMesh(toXYZ_Func, Object.assign({}, matOpts), obj.name);

        const isChecked = document.getElementById(`toggle-xyy-${name}`).checked;
        newObj.visible = show3DPolygons && isChecked;
        syncGamutAppearance(newObj);

        gamuts[name] = newObj;
        groupxyY.add(newObj);
    });
}

// --------------------------------------------------------
