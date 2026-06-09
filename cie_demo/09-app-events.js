// 9. 이벤트 연결 및 애니메이션 루프
// --------------------------------------------------------
const tabButtons = Array.from(document.querySelectorAll('.tab'));
const defaultTabTarget = tabButtons[0]?.dataset.target || 'rgb-compare';

function normalizeTabTarget(target) {
    return tabButtons.some(tab => tab.dataset.target === target) ? target : defaultTabTarget;
}

function getTabIndexByTarget(target) {
    return Math.max(0, tabButtons.findIndex(tab => tab.dataset.target === target));
}

function getTabTargetFromUrl() {
    const rawIndex = new URLSearchParams(window.location.search).get('index');
    if (rawIndex === null) return null;
    const tabIndex = Number(rawIndex);
    if (Number.isInteger(tabIndex) && tabIndex >= 0 && tabIndex < tabButtons.length) {
        return tabButtons[tabIndex].dataset.target;
    }
    return tabButtons.find(tab => tab.dataset.target === rawIndex)?.dataset.target || null;
}

function syncActiveTabButton(target) {
    tabButtons.forEach(tab => tab.classList.toggle('active', tab.dataset.target === target));
}

function syncTabIndexUrl(target, replace = false) {
    if (!window.history || !window.history.pushState) return;
    if (!replace && getTabTargetFromUrl() === target) return;
    const url = new URL(window.location.href);
    url.searchParams.set('index', String(getTabIndexByTarget(target)));
    const state = { tabIndex: getTabIndexByTarget(target), tab: target };
    if (replace) window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
}

const initialTabFromUrl = getTabTargetFromUrl();
let activeTab = normalizeTabTarget(initialTabFromUrl || document.querySelector('.tab.active')?.dataset.target);
let isStartCoverVisible = document.body.classList.contains('app-start-screen') && !initialTabFromUrl;
if (initialTabFromUrl) {
    document.body.classList.remove('app-start-screen', 'app-start-lifting');
}
syncActiveTabButton(activeTab);
let startLiftPointerY = null;
let startLiftPointerMoved = false;

function chromaticityToStartSvgPoint(x, y) {
    const minX = 0.0;
    const maxX = 0.8;
    const minY = 0.0;
    const maxY = 0.9;
    const left = 42;
    const right = 318;
    const top = 24;
    const bottom = 252;
    return {
        x: left + ((x - minX) / (maxX - minX)) * (right - left),
        y: bottom - ((y - minY) / (maxY - minY)) * (bottom - top)
    };
}

function svgPathFromChromaticity(points, closePath = false) {
    if (!points.length) return '';
    const svgPoints = points.map((point) => chromaticityToStartSvgPoint(point.x, point.z));
    const commands = svgPoints.map((point, index) => (
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    ));
    return `${commands.join(' ')}${closePath ? ' Z' : ''}`;
}

function renderStartChromaticityMotif() {
    const locusShape = document.getElementById('start-spectrum-shape');
    const locusClip = document.getElementById('start-chromaticity-clip-path');
    const chromaticityFill = document.getElementById('start-chromaticity-fill');
    const locusLine = document.getElementById('start-locus-line');
    const purpleLine = document.getElementById('start-purple-line');
    const gamutTriangle = document.getElementById('start-gamut-triangle');
    const gamutPoints = document.getElementById('start-gamut-points');
    if (!locusShape || !locusLine || !purpleLine || !gamutTriangle || !gamutPoints) return;

    const locusPoints = xyyBaseChromaticityPoints.map((point) => new THREE.Vector3(point.x, 0, point.z));
    const locusPath = svgPathFromChromaticity(locusPoints, false);
    const locusShapePath = svgPathFromChromaticity(locusPoints, true);
    locusLine.setAttribute('d', locusPath);
    locusShape.setAttribute('d', locusShapePath);
    locusClip?.setAttribute('d', locusShapePath);

    if (chromaticityFill && typeof chromaCanvas !== 'undefined') {
        const dataUrl = chromaCanvas.toDataURL('image/png');
        chromaticityFill.setAttribute('href', dataUrl);
        chromaticityFill.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
    }

    const firstPoint = chromaticityToStartSvgPoint(locusPoints[0].x, locusPoints[0].z);
    const lastPoint = chromaticityToStartSvgPoint(locusPoints[locusPoints.length - 1].x, locusPoints[locusPoints.length - 1].z);
    purpleLine.setAttribute('d', `M${lastPoint.x.toFixed(1)} ${lastPoint.y.toFixed(1)} L${firstPoint.x.toFixed(1)} ${firstPoint.y.toFixed(1)}`);

    const primaryXy = [
        sRGB_to_XYZ(1, 0, 0),
        sRGB_to_XYZ(0, 1, 0),
        sRGB_to_XYZ(0, 0, 1)
    ].map((xyz) => {
        const sum = Math.max(1e-9, xyz.X + xyz.Y + xyz.Z);
        return chromaticityToStartSvgPoint(xyz.X / sum, xyz.Y / sum);
    });
    gamutTriangle.setAttribute('d', `M${primaryXy[0].x.toFixed(1)} ${primaryXy[0].y.toFixed(1)} L${primaryXy[1].x.toFixed(1)} ${primaryXy[1].y.toFixed(1)} L${primaryXy[2].x.toFixed(1)} ${primaryXy[2].y.toFixed(1)} Z`);
    gamutPoints.innerHTML = primaryXy
        .map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5" />`)
        .join('');
}

function setActiveTab(target, options = {}) {
    target = normalizeTabTarget(target);
    const previousTab = activeTab;
    saveCameraPoseForTab(previousTab);
    if (previousTab !== target) {
        cameraFitAnimation = null;
        clearOrbitControlMomentum();
    }
    activeTab = target;
    syncActiveTabButton(target);
    if (options.updateUrl !== false) syncTabIndexUrl(target, !!options.replaceUrl);

    const show = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? (['start-main', 'matching-main', 'rgb-compare-main', 'additive-subtractive-main', 'transfer-main', 'camera-log-main'].includes(id) ? 'flex' : 'block') : 'none';
    };

    controls.enabled = !['matching', 'rgb-compare', 'additive-subtractive', 'transfer', 'camera-log'].includes(target);
    syncXyyMouseMode();
    show('start-main', false);
    show('rgb-compare-main', false);
    show('additive-subtractive-main', false);
    show('transfer-main', false);
    show('camera-log-main', false);
    show('matching-main', false);
    show('controls-additive-subtractive', false);
    show('controls-transfer', false);
    show('controls-camera-log', false);
    show('legend-transfer', false);
    show('legend-camera-log', false);

    // stop matching playback when leaving tab
    if (target !== 'matching') {
        matchingState.isActive = false;
    }

    if (target === 'xyz') {
        groupXYZ.visible = true; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
        restoreCameraPoseForTab('xyz');
        show('main-overlay', false);
        show('controls-rgb-compare', false);
        show('controls-matching', false);
        show('controls-camera-log', false);
        show('controls-xyz', true);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-matching', false);
        show('legend-camera-log', false);
        show('legend-xyz', true);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        updateCieRgbXYZDecomposition();
        return;
    }

    if (target === 'lab') {
        groupXYZ.visible = false; groupLab.visible = true; groupICtCp.visible = false; groupxyY.visible = false;
        restoreCameraPoseForTab('lab');
        show('main-overlay', false);
        show('controls-rgb-compare', false);
        show('controls-matching', false);
        show('controls-camera-log', false);
        show('controls-xyz', false);
        show('controls-lab', true);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-matching', false);
        show('legend-camera-log', false);
        show('legend-xyz', false);
        show('legend-lab', true);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        return;
    }

    if (target === 'ictcp') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = true; groupxyY.visible = false;
        restoreCameraPoseForTab('ictcp');
        show('main-overlay', false);
        show('controls-rgb-compare', false);
        show('controls-matching', false);
        show('controls-camera-log', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', true);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-matching', false);
        show('legend-camera-log', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', true);
        show('legend-xyy', false);
        return;
    }

    if (target === 'xyy') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = true;
        restoreCameraPoseForTab('xyy');
        show('main-overlay', false);
        show('controls-rgb-compare', false);
        show('controls-matching', false);
        show('controls-camera-log', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', true);
        show('legend-rgb-compare', false);
        show('legend-matching', false);
        show('legend-camera-log', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', true);
        return;
    }

    if (target === 'additive-subtractive') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
        show('main-overlay', true);
        show('additive-subtractive-main', true);
        show('controls-rgb-compare', false);
        show('controls-additive-subtractive', true);
        show('controls-transfer', false);
        show('controls-camera-log', false);
        show('controls-matching', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-transfer', false);
        show('legend-camera-log', false);
        show('legend-matching', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        scheduleAdditiveSubtractiveRender();
        return;
    }

    if (target === 'rgb-compare') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
        show('main-overlay', true);
        show('rgb-compare-main', true);
        show('controls-rgb-compare', true);
        show('controls-camera-log', false);
        show('controls-matching', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', true);
        show('legend-matching', false);
        show('legend-camera-log', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        renderRgbCompare();
        return;
    }

    if (target === 'transfer') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
        show('main-overlay', true);
        show('transfer-main', true);
        show('controls-rgb-compare', false);
        show('controls-transfer', true);
        show('controls-camera-log', false);
        show('controls-matching', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-transfer', true);
        show('legend-camera-log', false);
        show('legend-matching', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        scheduleTransferRender();
        return;
    }

    if (target === 'camera-log') {
        groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
        show('main-overlay', true);
        show('camera-log-main', true);
        show('controls-rgb-compare', false);
        show('controls-transfer', false);
        show('controls-camera-log', true);
        show('controls-matching', false);
        show('controls-xyz', false);
        show('controls-lab', false);
        show('controls-ictcp', false);
        show('controls-xyy', false);
        show('legend-rgb-compare', false);
        show('legend-transfer', false);
        show('legend-camera-log', true);
        show('legend-matching', false);
        show('legend-xyz', false);
        show('legend-lab', false);
        show('legend-ictcp', false);
        show('legend-xyy', false);
        scheduleCameraLogRender();
        return;
    }

    // matching
    groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
    show('main-overlay', true);
    show('matching-main', true);
    show('controls-rgb-compare', false);
    show('controls-additive-subtractive', false);
    show('controls-camera-log', false);
    show('controls-matching', true);
    show('controls-xyz', false);
    show('controls-lab', false);
    show('controls-ictcp', false);
    show('controls-xyy', false);
    show('legend-rgb-compare', false);
    show('legend-camera-log', false);
    show('legend-matching', true);
    show('legend-xyz', false);
    show('legend-lab', false);
    show('legend-ictcp', false);
    show('legend-xyy', false);
    matchingState.isActive = true;
    matchingState.needsRender = true;
    renderMatching();
}

function showStartCover() {
    groupXYZ.visible = false; groupLab.visible = false; groupICtCp.visible = false; groupxyY.visible = false;
    controls.enabled = false;
    const show = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? (id === 'start-main' ? 'flex' : 'block') : 'none';
    };
    show('main-overlay', true);
    show('start-main', true);
    show('rgb-compare-main', false);
    show('additive-subtractive-main', false);
    show('transfer-main', false);
    show('camera-log-main', false);
    show('matching-main', false);
    show('controls-rgb-compare', false);
    show('controls-additive-subtractive', false);
    show('controls-transfer', false);
    show('controls-camera-log', false);
    show('controls-matching', false);
    show('controls-xyz', false);
    show('controls-lab', false);
    show('controls-ictcp', false);
    show('controls-xyy', false);
    show('legend-rgb-compare', false);
    show('legend-transfer', false);
    show('legend-camera-log', false);
    show('legend-matching', false);
    show('legend-xyz', false);
    show('legend-lab', false);
    show('legend-ictcp', false);
    show('legend-xyy', false);
}

function enterFromStartCover() {
    if (!isStartCoverVisible || document.body.classList.contains('app-start-lifting')) return;
    document.body.classList.add('app-start-lifting');
    window.setTimeout(() => {
        document.body.classList.remove('app-start-screen', 'app-start-lifting');
        isStartCoverVisible = false;
        setActiveTab(activeTab || 'rgb-compare');
    }, 620);
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        if (isStartCoverVisible) {
            enterFromStartCover();
            return;
        }
        setActiveTab(e.currentTarget.dataset.target);
    });
});

window.addEventListener('popstate', () => {
    const targetFromUrl = getTabTargetFromUrl();
    if (!targetFromUrl) {
        document.body.classList.add('app-start-screen');
        isStartCoverVisible = true;
        showStartCover();
        syncActiveTabButton(activeTab);
        return;
    }
    document.body.classList.remove('app-start-screen', 'app-start-lifting');
    isStartCoverVisible = false;
    setActiveTab(targetFromUrl, { updateUrl: false });
});

const startMain = document.getElementById('start-main');
startMain?.addEventListener('pointerdown', (event) => {
    startLiftPointerY = event.clientY;
    startLiftPointerMoved = false;
});
startMain?.addEventListener('pointermove', (event) => {
    if (startLiftPointerY === null) return;
    const deltaY = event.clientY - startLiftPointerY;
    if (Math.abs(deltaY) > 8) startLiftPointerMoved = true;
    if (deltaY < -42) enterFromStartCover();
});
startMain?.addEventListener('pointerup', () => {
    if (!startLiftPointerMoved) enterFromStartCover();
    startLiftPointerY = null;
    startLiftPointerMoved = false;
});
startMain?.addEventListener('pointercancel', () => {
    startLiftPointerY = null;
    startLiftPointerMoved = false;
});
startMain?.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 10) return;
    event.preventDefault();
    enterFromStartCover();
}, { passive: false });
startMain?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    enterFromStartCover();
});

renderStartChromaticityMotif();

if (isStartCoverVisible) {
    showStartCover();
} else {
    setActiveTab(activeTab, { replaceUrl: !!initialTabFromUrl });
}

// Color Matching controls
matchingUI.autoSolve.addEventListener('change', (e) => {
    matchingState.autoSolve = e.target.checked;
    matchingState.needsRender = true;
    renderMatching();
});

matchingUI.cmfView.addEventListener('change', (e) => {
    matchingState.cmfView = e.target.value;
    applyMatchingSliderRanges();
    if (matchingState.autoSolve) {
        setMatchingCoeffs(getIdealMatchingCoeffs(matchingState.wavelengthNm), true);
    }
    matchingState.needsRender = true;
    renderMatching();
});

matchingUI.luminousEfficiency.addEventListener('change', (e) => {
    matchingState.showLuminousEfficiency = e.target.checked;
    matchingState.needsRender = true;
    renderMatching();
});

matchingUI.rgbPrimaryWavelengths.addEventListener('change', (e) => {
    matchingState.showRgbPrimaryWavelengths = e.target.checked;
    matchingState.needsRender = true;
    renderMatching();
});

matchingUI.allowNegative.addEventListener('change', (e) => {
    if (isXYZMatchingMode()) {
        matchingState.allowNegative = false;
        matchingUI.allowNegative.checked = false;
        return;
    }
    matchingState.allowNegative = e.target.checked;
    applyMatchingSliderRanges();
    matchingState.needsRender = true;
    renderMatching();
});

matchingUI.snap.addEventListener('click', () => {
    setMatchingCoeffs(getIdealMatchingCoeffs(matchingState.wavelengthNm), true);
    renderMatching();
});

const onCoeffInput = () => {
    matchingState.coeffR = parseFloat(matchingUI.r.value);
    matchingState.coeffG = parseFloat(matchingUI.g.value);
    matchingState.coeffB = parseFloat(matchingUI.b.value);
    if (isXYZMatchingMode() || !matchingState.allowNegative) {
        matchingState.coeffR = Math.max(0, matchingState.coeffR);
        matchingState.coeffG = Math.max(0, matchingState.coeffG);
        matchingState.coeffB = Math.max(0, matchingState.coeffB);
    }
    matchingState.needsRender = true;
    renderMatching();
};
matchingUI.r.addEventListener('input', onCoeffInput);
matchingUI.g.addEventListener('input', onCoeffInput);
matchingUI.b.addEventListener('input', onCoeffInput);

// CMF 그래프에서 클릭/드래그로 파장 선택
let isGraphDragging = false;
matchingUI.graphCanvas.addEventListener('pointerdown', (e) => {
    if (!matchingState.isActive) return;
    isGraphDragging = true;
    try { matchingUI.graphCanvas.setPointerCapture(e.pointerId); } catch { }
    setMatchingWavelengthFromGraphClientX(e.clientX);
});
matchingUI.graphCanvas.addEventListener('pointermove', (e) => {
    if (!matchingState.isActive || !isGraphDragging) return;
    setMatchingWavelengthFromGraphClientX(e.clientX);
});
const stopGraphDrag = (e) => {
    if (!isGraphDragging) return;
    isGraphDragging = false;
    try { matchingUI.graphCanvas.releasePointerCapture(e.pointerId); } catch { }
};
matchingUI.graphCanvas.addEventListener('pointerup', stopGraphDrag);
matchingUI.graphCanvas.addEventListener('pointercancel', stopGraphDrag);
matchingUI.graphCanvas.addEventListener('pointerleave', () => { isGraphDragging = false; });

xyzTransformUI.coordinateMode.addEventListener('change', () => {
    updateXYZCoordinateSystem();
    updateCieRgbXYZDecomposition();
});
xyzTransformUI.secondaryAxes.addEventListener('change', () => {
    updateXYZCoordinateSystem();
});
xyzTransformUI.secondaryPolygon.addEventListener('change', () => {
    updateXYZSecondaryCoordinatePolygon();
});
document.getElementById('toggle-xyz-spectrum-volume').addEventListener('change', e => {
    locusGroup.visible = e.target.checked;
    coneMeshXYZ.visible = e.target.checked;
    updateXYZSecondaryCoordinatePolygon();
});
document.getElementById('toggle-xyz-normalized-plane').addEventListener('change', e => {
    planeGroup.visible = e.target.checked;
    projGroup.visible = e.target.checked;
});
document.getElementById('toggle-lab-surface').addEventListener('change', e => {
    labSurfaceMesh.visible = e.target.checked;
    labSliceRingsGroup.visible = e.target.checked;
});
document.getElementById('toggle-lab-neutral').addEventListener('change', e => labNeutralAxis.visible = e.target.checked);
document.getElementById('toggle-lab-ab-plane').addEventListener('change', e => labABPlaneGroup.visible = e.target.checked);
document.getElementById('toggle-lab-grid').addEventListener('change', e => labGridHelper.visible = e.target.checked);
Object.keys(ictcpVolumes).forEach((key) => {
    document.getElementById(`toggle-ictcp-${key}`).addEventListener('change', e => {
        ictcpVolumes[key].visible = showICtCp3DPolygons && e.target.checked;
        syncICtCpVolumeAppearance(ictcpVolumes[key]);
        if (ictcpPolygonOpacityOverride === null) syncICtCpPolygonOpacityControl();
    });
});
toggleICtCp3DPolygons.addEventListener('change', e => {
    showICtCp3DPolygons = e.target.checked;
    syncICtCpDependentControls();
    syncICtCpVolumeVisibility();
});
toggleICtCpSolidSurface.addEventListener('change', e => {
    isICtCpSolidSurface = e.target.checked;
    if (!isICtCpSolidSurface) {
        showICtCpSurfaceLines = true;
        toggleICtCpSurfaceLines.checked = true;
    }
    syncICtCpVolumeVisibility();
});
toggleICtCpSurfaceLines.addEventListener('change', e => {
    showICtCpSurfaceLines = e.target.checked;
    syncICtCpVolumeVisibility();
});
inputICtCpPolygonOpacity.addEventListener('input', e => {
    ictcpPolygonOpacityOverride = Number(e.target.value);
    syncICtCpPolygonOpacityControl();
    rebuildICtCpVolumes();
});
toggleICtCpLogI.addEventListener('change', e => {
    applyICtCpLogI = e.target.checked;
    rebuildICtCpAxes();
    rebuildICtCpVolumes();
    rebuildICtCpNeutralAxis();
});
toggleICtCpYHeatmap.addEventListener('change', e => {
    useICtCpLuminanceHeatmap = e.target.checked;
    rebuildICtCpVolumes();
});
toggleICtCpYDisplayLimit.addEventListener('change', e => {
    useICtCpDisplayPeakLimit = e.target.checked;
    ictcpPolygonOpacityOverride = useICtCpDisplayPeakLimit ? 1 : null;
    syncICtCpDependentControls();
    syncICtCpPolygonOpacityControl();
    rebuildICtCpVolumes();
});
inputICtCpDisplayPeakNits.addEventListener('change', () => {
    inputICtCpDisplayPeakNits.value = getICtCpDisplayPeakNits();
    rebuildICtCpVolumes();
});
inputICtCpDisplayPeakNits.addEventListener('input', () => {
    if (!useICtCpDisplayPeakLimit) return;
    rebuildICtCpVolumes();
});
selectICtCpAxisMode.addEventListener('change', e => {
    ictcpAxisMode = e.target.value;
    syncICtCpDependentControls();
    rebuildICtCpAxes();
    rebuildICtCpVolumes();
    rebuildICtCpNeutralAxis();
});
selectICtCpEotfMode.addEventListener('change', e => {
    ictcpEotfMode = e.target.value;
    syncICtCpDependentControls();
    rebuildICtCpAxes();
    rebuildICtCpVolumes();
    rebuildICtCpNeutralAxis();
});
inputICtCpDecodePeakNits.addEventListener('change', () => {
    inputICtCpDecodePeakNits.value = getICtCpDecodePeakNits();
    rebuildICtCpAxes();
    rebuildICtCpVolumes();
    rebuildICtCpNeutralAxis();
});
inputICtCpDecodePeakNits.addEventListener('input', () => {
    if (ictcpAxisMode !== 'decoded-luminance' || ictcpEotfMode === 'pq') return;
    rebuildICtCpAxes();
    rebuildICtCpVolumes();
    rebuildICtCpNeutralAxis();
});
document.getElementById('toggle-ictcp-neutral').addEventListener('change', e => ictcpNeutralAxis.visible = e.target.checked);
document.getElementById('toggle-ictcp-base-plane').addEventListener('change', e => ictcpBasePlaneGroup.visible = e.target.checked);
document.getElementById('toggle-ictcp-grid').addEventListener('change', e => ictcpGridHelper.visible = e.target.checked);
document.getElementById('toggle-cie-rgb-xyz').addEventListener('change', e => {
    cieRgbXYZGroup.visible = e.target.checked;
    xyzTransformUI.controls.style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked) updateCieRgbXYZDecomposition();
});
xyzTransformUI.controls.style.display = xyzTransformUI.toggle.checked ? 'block' : 'none';
applyXYZInitialControlDefaults();
updateXYZCoordinateSystem();
updateCieRgbXYZDecomposition();
xyzTransformUI.wavelength.addEventListener('input', e => {
    matchingState.wavelengthNm = parseFloat(e.target.value);
    matchingUI.wavelength.value = String(Math.round(matchingState.wavelengthNm));
    updateCieRgbXYZDecomposition();
    if (matchingState.isActive) {
        matchingState.needsRender = true;
        renderMatching();
    }
});

const toggleGamut = (key) => (e) => {
    const checked = e.target.checked;
    gamuts[key].visible = show3DPolygons && checked;

    // 2D 삼각형도 동기화 (HDR의 경우 rec2020 삼각형과 모양이 같음, 가시성은 독립적으로 관리)
    if (triangleMeshes[key]) {
        triangleMeshes[key].visible = checked;
    }

    rebuildYAxis();
    if (xyyPolygonOpacityOverride === null) syncXyyPolygonOpacityControl();
    syncWavelengthLabelOcclusion();
    if (show3DPolygons) {
        requestCameraFitToVisiblePolygons();
    }
};

document.getElementById('toggle-xyy-srgb').addEventListener('change', toggleGamut('srgb'));
document.getElementById('toggle-xyy-p3').addEventListener('change', toggleGamut('p3'));
document.getElementById('toggle-xyy-adobe-rgb').addEventListener('change', toggleGamut('adobe-rgb'));
document.getElementById('toggle-xyy-prophoto-rgb').addEventListener('change', toggleGamut('prophoto-rgb'));
document.getElementById('toggle-xyy-rec709').addEventListener('change', toggleGamut('rec709'));
document.getElementById('toggle-xyy-rec601').addEventListener('change', toggleGamut('rec601'));
document.getElementById('toggle-xyy-rec2020').addEventListener('change', toggleGamut('rec2020'));
document.getElementById('toggle-xyy-pq').addEventListener('change', toggleGamut('pq'));
document.getElementById('toggle-xyy-hlg').addEventListener('change', toggleGamut('hlg'));
document.getElementById('toggle-xyy-cmyk-fogra39').addEventListener('change', e => {
    cmykMeshes.fogra39.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});
document.getElementById('toggle-xyy-cmyk-swopv2').addEventListener('change', e => {
    cmykMeshes.swopv2.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});
document.getElementById('toggle-xyy-cmyk-japan2001').addEventListener('change', e => {
    cmykMeshes.japan2001.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});

toggleSolidSurface.addEventListener('change', e => {
    isSolidSurface = e.target.checked;
    if (!isSolidSurface) {
        showSurfaceLines = true;
        toggleSurfaceLines.checked = true;
    }
    sync3DPolygonVisibility();
});

toggleSurfaceLines.addEventListener('change', e => {
    showSurfaceLines = e.target.checked;
    sync3DPolygonVisibility();
});

inputXyyPolygonOpacity.addEventListener('input', e => {
    xyyPolygonOpacityOverride = Number(e.target.value);
    syncXyyPolygonOpacityControl();
    rebuildGamuts();
});

toggle3DPolygons.addEventListener('change', e => {
    show3DPolygons = e.target.checked;
    syncDependentControls();
    sync3DPolygonVisibility();
    rebuildYAxis();
    if (show3DPolygons) {
        requestCameraFitToVisiblePolygons();
    }
});

toggleLogY.addEventListener('change', e => {
    applyLogScale = e.target.checked;
    rebuildGamuts();
    rebuildYAxis();
    rebuildxyYCurveAndCurtainHeights();
    if (show3DPolygons) {
        requestCameraFitToVisiblePolygons();
    }
});

toggleYHeatmap.addEventListener('change', e => {
    useLuminanceHeatmap = e.target.checked;
    rebuildGamuts();
});

toggleYDisplayLimit.addEventListener('change', e => {
    useDisplayPeakLimit = e.target.checked;
    xyyPolygonOpacityOverride = useDisplayPeakLimit ? 1 : null;
    syncDependentControls();
    syncXyyPolygonOpacityControl();
    rebuildGamuts();
    rebuildYAxis();
    rebuildxyYCurveAndCurtainHeights();
});

inputDisplayPeakNits.addEventListener('change', () => {
    inputDisplayPeakNits.value = getDisplayPeakNits();
    rebuildGamuts();
    rebuildYAxis();
    rebuildxyYCurveAndCurtainHeights();
});

inputDisplayPeakNits.addEventListener('input', () => {
    if (!useDisplayPeakLimit) return;
    rebuildGamuts();
    rebuildYAxis();
    rebuildxyYCurveAndCurtainHeights();
});

togglexyYCurve.addEventListener('change', () => {
    syncDependentControls();
    syncSpectralLocusVisibility();
    rebuildYAxis();
});
togglexyYCurtain.addEventListener('change', syncSpectralLocusVisibility);
document.getElementById('toggle-xyy-base').addEventListener('change', e => {
    xyyBaseGroup.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});
document.getElementById('toggle-xyy-chromaticity-fill').addEventListener('change', e => chromaFillMesh.visible = e.target.checked);

document.getElementById('toggle-xyy-plane').addEventListener('change', e => {
    xyPlaneMesh.visible = e.target.checked;
    syncFloorLabelContrast();
});
document.getElementById('toggle-xyy-triangles').addEventListener('change', e => {
    triangles2DGroup.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});
document.getElementById('toggle-xyy-macadam').addEventListener('change', e => xyyMacAdamGroup.visible = e.target.checked);
document.getElementById('toggle-xyy-whitepoint-standards').addEventListener('change', e => {
    whitePointStandardsGroup.visible = e.target.checked;
    syncWavelengthLabelOcclusion();
});
document.getElementById('toggle-xyy-grid').addEventListener('change', e => gridHelper.visible = e.target.checked);

// 초기 렌더링 시에도 Y(nits) 축이 보이도록 1회 생성
rebuildYAxis();
// 현재 스케일 모드 기준으로 곡선/커튼 높이를 1회 동기화
rebuildxyYCurveAndCurtainHeights();

window.addEventListener('resize', () => {
    window.resizeViewerToLayout();
    matchingState.needsRender = true;
    if (activeTab === 'additive-subtractive') {
        scheduleAdditiveSubtractiveRender();
    }
});

let lastFrameTs = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrameTs) / 1000);
    lastFrameTs = now;

    if (activeTab === 'matching' && matchingState.isActive) {
        if (matchingState.autoSolve) {
            const ideal = getIdealMatchingCoeffs(matchingState.wavelengthNm);
            const t = 1 - Math.exp(-dt * 6);
            const next = {
                R: matchingState.coeffR + (ideal.R - matchingState.coeffR) * t,
                G: matchingState.coeffG + (ideal.G - matchingState.coeffG) * t,
                B: matchingState.coeffB + (ideal.B - matchingState.coeffB) * t
            };
            setMatchingCoeffs(next, true);
        }

        if (matchingState.needsRender) {
            renderMatching();
        }
    }
    updateCameraFitAnimation(now);
    controls.update();
    scene.traverse((obj) => {
        if (obj.userData?.isVectorTextLabel) {
            obj.quaternion.copy(camera.quaternion);
        }
    });
    renderer.render(scene, camera);
}
animate();
