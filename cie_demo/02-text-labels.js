// 2. 축 그리기 (라벨, 눈금, 수치) 유틸리티 추가
// --------------------------------------------------------
const TEXT_SPRITE_RENDER_ORDER = 10000;
const FLOOR_LABEL_RENDER_ORDER = 20000;

function normalizeCssHexColor(colorStr) {
    const value = String(colorStr || '').trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(value)) {
        return '#' + value.slice(1).split('').map(ch => ch + ch).join('');
    }
    return value;
}

function getThemedTextColor(baseColor) {
    const normalized = normalizeCssHexColor(baseColor);
    if (typeof currentTheme !== 'undefined' && currentTheme === 'day') {
        if (['#ffffff', '#eeeeee', '#e6e6e6', '#dddddd', '#cccccc', '#bbbbbb'].includes(normalized)) {
            return '#1a1a1a';
        }
    }
    return baseColor;
}

function getThemedTextStroke(baseColor) {
    const normalized = normalizeCssHexColor(baseColor);
    if (typeof currentTheme !== 'undefined' && currentTheme === 'day'
        && ['#ffffff', '#eeeeee', '#e6e6e6', '#dddddd', '#cccccc', '#bbbbbb'].includes(normalized)) {
        return 'rgba(255,255,255,0.82)';
    }
    return null;
}

// 캔버스에 텍스트를 그려 Sprite로 반환하는 함수
function drawTextSpriteTexture(sprite, fillColor, strokeColor = null) {
    const { canvas, context, message } = sprite.userData.textSprite;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "Bold 32px 'Segoe UI', Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    if (strokeColor) {
        context.lineWidth = 7;
        context.strokeStyle = strokeColor;
        context.strokeText(message, canvas.width / 2, canvas.height / 2);
    }
    context.fillStyle = fillColor;
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    sprite.material.map.needsUpdate = true;
}

function createTextSprite(message, colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.renderOrder = TEXT_SPRITE_RENDER_ORDER;
    sprite.scale.set(0.15, 0.075, 1);
    sprite.userData.textSprite = { canvas, context, message, baseColor: colorStr };
    drawTextSpriteTexture(sprite, getThemedTextColor(colorStr), getThemedTextStroke(colorStr));

    return sprite;
}

function drawFloorLabelTexture(sprite, fillColor, strokeColor = 'rgba(0,0,0,0.78)') {
    const { canvas, context, message } = sprite.userData.floorLabel;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = "Bold 36px 'Segoe UI', Arial, sans-serif";
    context.lineWidth = 8;
    context.strokeStyle = strokeColor;
    context.fillStyle = fillColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeText(message, canvas.width / 2, canvas.height / 2);
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    sprite.material.map.needsUpdate = true;
}

// 바닥면용 라벨 스프라이트 (배경 없이 텍스트만 렌더링)
function createFloorLabelSprite(message, colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 96;
    const context = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.renderOrder = FLOOR_LABEL_RENDER_ORDER;
    sprite.scale.set(0.22, 0.066, 1);
    sprite.userData.floorLabel = { canvas, context, message, baseColor: colorStr };
    drawFloorLabelTexture(sprite, colorStr);
    return sprite;
}

let vectorTextFont = null;
new THREE.FontLoader().load(
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
        vectorTextFont = font;
        refreshVectorTextLabels();
    }
);

function createVectorTextLabel(message, colorStr = '#bbbbbb') {
    const geometry = vectorTextFont
        ? new THREE.TextGeometry(String(message), {
            font: vectorTextFont,
            size: 1,
            height: 0,
            curveSegments: 4
        })
        : new THREE.BufferGeometry();
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
        const textCenter = new THREE.Vector3();
        geometry.boundingBox.getCenter(textCenter);
        geometry.translate(-textCenter.x, -textCenter.y, 0);
    }
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(getThemedTextColor(colorStr)),
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false
    });
    const label = new THREE.Mesh(geometry, material);
    label.renderOrder = FLOOR_LABEL_RENDER_ORDER;
    label.userData.isVectorTextLabel = true;
    label.userData.vectorTextMessage = String(message);
    label.userData.vectorTextBaseColor = colorStr;
    return label;
}

function refreshVectorTextLabels() {
    if (!vectorTextFont) return;
    scene.traverse((obj) => {
        if (!obj.userData?.isVectorTextLabel || obj.geometry?.type === 'TextGeometry') return;
        const message = obj.userData.vectorTextMessage;
        if (message === undefined) return;
        const geometry = new THREE.TextGeometry(String(message), {
            font: vectorTextFont,
            size: 1,
            height: 0,
            curveSegments: 4
        });
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
            const textCenter = new THREE.Vector3();
            geometry.boundingBox.getCenter(textCenter);
            geometry.translate(-textCenter.x, -textCenter.y, 0);
        }
        obj.geometry.dispose();
        obj.geometry = geometry;
    });
}

function syncSceneLabelTheme() {
    if (typeof scene === 'undefined') return;
    scene.traverse((obj) => {
        if (obj.userData?.textSprite) {
            const baseColor = obj.userData.textSprite.baseColor;
            drawTextSpriteTexture(obj, getThemedTextColor(baseColor), getThemedTextStroke(baseColor));
        }
        if (obj.userData?.isVectorTextLabel && obj.material?.color) {
            const baseColor = obj.userData.vectorTextBaseColor || '#bbbbbb';
            obj.material.color.set(getThemedTextColor(baseColor));
        }
    });
}

// 축(Arrow), 라벨, 눈금(Ticks)을 모두 포함하는 그룹 생성
function createAxis(dir, colorHex, label, maxVal, lateralLabelSide = -1) {
    const group = new THREE.Group();
    const colorStr = '#' + colorHex.toString(16).padStart(6, '0');

    // 메인 화살표 선
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), maxVal + 0.1, colorHex, 0.04, 0.04);
    group.add(arrow);

    // 라벨 (축의 맨 끝 문자)
    const labelSprite = createTextSprite(label, colorStr);
    labelSprite.position.copy(dir).multiplyScalar(maxVal + 0.18);
    labelSprite.scale.multiplyScalar(1.2); // 라벨은 수치보다 약간 더 크게
    group.add(labelSprite);

    // 텍스트와 눈금을 띄울 오프셋 방향 (축에 수직이 되도록 계산)
    let offsetDir = new THREE.Vector3();
    if (dir.x > 0.5) { offsetDir.set(0, -1, 0); }      // X축: 아래로
    else if (dir.y > 0.5) { offsetDir.set(lateralLabelSide, 0, 0); } // Y축: 좌/우
    else if (dir.z > 0.5) { offsetDir.set(lateralLabelSide, 0, 0); } // Z(y)축: 좌/우

    // 0.2 단위 눈금선과 수치 생성
    for (let i = 0.2; i <= maxVal + 0.01; i += 0.2) {
        const valStr = i.toFixed(1);
        const pos = dir.clone().multiplyScalar(i);

        // 눈금선 (짧은 직교 라인)
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            pos.clone().add(offsetDir.clone().multiplyScalar(0.015)),
            pos.clone().add(offsetDir.clone().multiplyScalar(-0.015))
        ]);
        const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: colorHex }));
        group.add(tickLine);

        // 수치 텍스트
        const textSprite = createVectorTextLabel(valStr, '#bbbbbb');
        textSprite.userData.isxyYNumericLabel = true;
        textSprite.position.copy(pos).add(offsetDir.clone().multiplyScalar(0.06));
        textSprite.scale.setScalar(0.024);
        group.add(textSprite);
    }

    return group;
}

function createLabAxes() {
    const group = new THREE.Group();
    const origin = new THREE.Vector3(0.5, 0.5, 0.5);

    const addBiAxis = (dir, positiveColorHex, negativeColorHex, positiveLabel, negativeLabel) => {
        const axisLen = 0.52;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            origin.clone().add(dir.clone().multiplyScalar(-axisLen)),
            origin.clone().add(dir.clone().multiplyScalar(axisLen))
        ]);
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute([
            ((negativeColorHex >> 16) & 255) / 255,
            ((negativeColorHex >> 8) & 255) / 255,
            (negativeColorHex & 255) / 255,
            ((positiveColorHex >> 16) & 255) / 255,
            ((positiveColorHex >> 8) & 255) / 255,
            (positiveColorHex & 255) / 255
        ], 3));
        group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true })));

        group.add(new THREE.ArrowHelper(dir, origin, axisLen, positiveColorHex, 0.035, 0.02));
        group.add(new THREE.ArrowHelper(dir.clone().multiplyScalar(-1), origin, axisLen, negativeColorHex, 0.035, 0.02));

        const posLabel = createTextSprite(positiveLabel, '#' + positiveColorHex.toString(16).padStart(6, '0'));
        posLabel.position.copy(origin).add(dir.clone().multiplyScalar(axisLen + 0.09));
        posLabel.scale.multiplyScalar(1.35);
        group.add(posLabel);

        const negLabel = createTextSprite(negativeLabel, '#' + negativeColorHex.toString(16).padStart(6, '0'));
        negLabel.position.copy(origin).add(dir.clone().multiplyScalar(-axisLen - 0.1));
        negLabel.scale.multiplyScalar(1.25);
        group.add(negLabel);
    };

    addBiAxis(new THREE.Vector3(1, 0, 0), 0xff5555, 0x55dd77, '+a*', '-a*');
    addBiAxis(new THREE.Vector3(0, 0, 1), 0xffdd55, 0x66aaff, '+b*', '-b*');
    addBiAxis(new THREE.Vector3(0, 1, 0), 0xffffff, 0x888888, '+L*', 'L*=0');

    return group;
}

function createLabABPlaneGroup() {
    const group = new THREE.Group();
    const center = new THREE.Vector3(0.5, 0.5, 0.5);
    const renderOrder = 700;
    const planeSize = 1.2;
    const chartRadius = 0.44;
    const maxChroma = 100;
    const planeY = 0.502;
    const chartY = 0.506;
    const lineY = 0.51;
    const labelY = 0.548;

    const whitePlaneMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(planeSize, planeSize),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.96,
            depthTest: false,
            depthWrite: false
        })
    );
    whitePlaneMesh.rotation.x = Math.PI / 2;
    whitePlaneMesh.position.set(center.x, planeY, center.z);
    whitePlaneMesh.renderOrder = renderOrder;
    group.add(whitePlaneMesh);

    const labABColorDiskGeo = new THREE.BufferGeometry();
    const diskVertices = [];
    const diskColors = [];
    const diskIndices = [];
    const radialSteps = 36;
    const angularSteps = 144;
    for (let radialIndex = 0; radialIndex <= radialSteps; radialIndex++) {
        const chroma = (radialIndex / radialSteps) * maxChroma;
        const radius = (chroma / maxChroma) * chartRadius;
        for (let angleIndex = 0; angleIndex <= angularSteps; angleIndex++) {
            const theta = (angleIndex / angularSteps) * Math.PI * 2;
            const a = Math.cos(theta) * chroma;
            const b = Math.sin(theta) * chroma;
            const color = labOpponentPlaneColor(a, b);
            diskVertices.push(center.x + Math.cos(theta) * radius, chartY, center.z + Math.sin(theta) * radius);
            diskColors.push(color.r, color.g, color.b);
        }
    }
    const columns = angularSteps + 1;
    for (let radialIndex = 0; radialIndex < radialSteps; radialIndex++) {
        for (let angleIndex = 0; angleIndex < angularSteps; angleIndex++) {
            const i00 = radialIndex * columns + angleIndex;
            const i01 = i00 + 1;
            const i10 = (radialIndex + 1) * columns + angleIndex;
            const i11 = i10 + 1;
            diskIndices.push(i00, i10, i01, i01, i10, i11);
        }
    }
    labABColorDiskGeo.setAttribute('position', new THREE.Float32BufferAttribute(diskVertices, 3));
    labABColorDiskGeo.setAttribute('color', new THREE.Float32BufferAttribute(diskColors, 3));
    labABColorDiskGeo.setIndex(diskIndices);
    labABColorDiskGeo.computeVertexNormals();
    const colorDisk = new THREE.Mesh(
        labABColorDiskGeo,
        new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.96, depthTest: false, depthWrite: false })
    );
    colorDisk.renderOrder = renderOrder + 1;
    group.add(colorDisk);

    const labABPlaneLabelsGroup = new THREE.Group();
    const createLine = (points, colorHex, opacity = 0.78, order = renderOrder + 2) => {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity, depthTest: false, depthWrite: false })
        );
        line.renderOrder = order;
        group.add(line);
        return line;
    };
    const toPosition = (a, b, y = lineY) => new THREE.Vector3(
        center.x + (a / maxChroma) * chartRadius,
        y,
        center.z + (b / maxChroma) * chartRadius
    );
    const addHueArrow = () => {
        const radius = 116;
        const startAngle = THREE.MathUtils.degToRad(145);
        const endAngle = THREE.MathUtils.degToRad(42);
        const points = [];
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = startAngle + (endAngle - startAngle) * t;
            points.push(toPosition(Math.cos(angle) * radius, Math.sin(angle) * radius, lineY + 0.008));
        }
        createLine(points, 0x111111, 0.86, renderOrder + 8);

        const arrowTip = points[points.length - 1];
        const tangentAngle = endAngle - Math.PI / 2;
        const headLength = 9;
        const headSpread = THREE.MathUtils.degToRad(28);
        const headPoint = (angle) => toPosition(
            Math.cos(endAngle) * radius - Math.cos(angle) * headLength,
            Math.sin(endAngle) * radius - Math.sin(angle) * headLength,
            lineY + 0.008
        );
        createLine([arrowTip, headPoint(tangentAngle - headSpread)], 0x111111, 0.86, renderOrder + 9);
        createLine([arrowTip, headPoint(tangentAngle + headSpread)], 0x111111, 0.86, renderOrder + 9);
    };

    for (let value = -90; value <= 90; value += 10) {
        const limit = Math.sqrt(Math.max(0, maxChroma * maxChroma - value * value));
        createLine([toPosition(value, -limit), toPosition(value, limit)], 0xffffff, 0.48, renderOrder + 3);
        createLine([toPosition(-limit, value), toPosition(limit, value)], 0xffffff, 0.48, renderOrder + 3);
    }

    [20, 40, 60, 80, 100].forEach((chroma) => {
        const points = [];
        const steps = 160;
        for (let i = 0; i <= steps; i++) {
            const theta = (i / steps) * Math.PI * 2;
            points.push(toPosition(Math.cos(theta) * chroma, Math.sin(theta) * chroma));
        }
        createLine(points, 0x333333, 0.7, renderOrder + 4);
    });

    createLine([toPosition(-100, 0), toPosition(100, 0)], 0x111111, 0.95, renderOrder + 5);
    createLine([toPosition(0, -100), toPosition(0, 100)], 0x111111, 0.95, renderOrder + 5);
    addHueArrow();

    [-80, -60, -40, -20, 20, 40, 60, 80].forEach((value) => {
        const aLabel = createVectorTextLabel(`${value}`, '#111111');
        aLabel.position.copy(toPosition(value, -6, labelY));
        aLabel.scale.setScalar(0.012);
        labABPlaneLabelsGroup.add(aLabel);

        const bLabel = createVectorTextLabel(`${value}`, '#111111');
        bLabel.position.copy(toPosition(7, value, labelY));
        bLabel.scale.setScalar(0.012);
        labABPlaneLabelsGroup.add(bLabel);
    });

    const addOuterLabel = (message, color, a, b, scale = 0.018) => {
        const label = createVectorTextLabel(message, color);
        label.position.copy(toPosition(a, b, labelY));
        label.scale.setScalar(scale);
        labABPlaneLabelsGroup.add(label);
    };
    addOuterLabel('0° Red +a*', '#111111', 116, 0, 0.017);
    addOuterLabel('180° Green -a*', '#111111', -126, 0, 0.017);
    addOuterLabel('90° Yellow +b*', '#111111', 0, 113, 0.017);
    addOuterLabel('270° Blue -b*', '#111111', 0, -113, 0.017);
    addOuterLabel('Chroma C*', '#111111', 42, 42, 0.015);
    addOuterLabel('Hue', '#111111', 76, 91, 0.022);

    group.add(labABPlaneLabelsGroup);

    return group;
}


// --------------------------------------------------------
