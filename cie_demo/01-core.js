// 0. UI 메뉴 접기/펴기 로직
// --------------------------------------------------------
const toggleMenuBtn = document.getElementById('toggle-menu-btn');
const uiPanel = document.getElementById('ui-panel');
const toggleMenuText = document.getElementById('toggle-menu-text');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const THEME_STORAGE_KEY = 'cie-demo-theme';
const themeSceneBackgrounds = {
    day: 0xe7e4dc,
    night: 0x111111
};

let isMenuOpen = false;
let currentTheme = getStoredTheme();

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY) === 'day' ? 'day' : 'night';
    } catch {
        return 'night';
    }
}

function storeTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch { }
}

function renderResponsiveOverlayCanvases() {
    const isVisible = (id) => {
        const element = document.getElementById(id);
        return element && element.style.display !== 'none';
    };
    if (isVisible('matching-main') && typeof window.scheduleMatchingLayoutRender === 'function') {
        window.scheduleMatchingLayoutRender();
    }
    if (isVisible('additive-subtractive-main') && typeof window.scheduleAdditiveSubtractiveRender === 'function') {
        window.scheduleAdditiveSubtractiveRender();
    }
    if (isVisible('rgb-compare-main') && typeof window.renderRgbCompare === 'function') {
        window.renderRgbCompare();
    }
    if (isVisible('transfer-main') && typeof window.scheduleTransferRender === 'function') {
        window.scheduleTransferRender();
    }
    if (isVisible('camera-log-main') && typeof window.scheduleCameraLogRender === 'function') {
        window.scheduleCameraLogRender();
    }
}

function scheduleResponsiveOverlayCanvases() {
    renderResponsiveOverlayCanvases();
    window.requestAnimationFrame(renderResponsiveOverlayCanvases);
    window.setTimeout(renderResponsiveOverlayCanvases, 120);
    window.setTimeout(renderResponsiveOverlayCanvases, 340);
}

function syncThemeChrome() {
    document.body.classList.toggle('theme-day', currentTheme === 'day');
    if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-pressed', currentTheme === 'day' ? 'true' : 'false');
        themeToggleBtn.title = currentTheme === 'day' ? 'Night 테마로 전환' : 'Day 테마로 전환';
        themeToggleBtn.setAttribute('aria-label', currentTheme === 'day' ? 'Night 테마로 전환' : 'Day 테마로 전환');
    }
}

function applyTheme(theme) {
    currentTheme = theme === 'day' ? 'day' : 'night';
    syncThemeChrome();
    scene.background = new THREE.Color(themeSceneBackgrounds[currentTheme]);
    if (typeof syncSceneLabelTheme === 'function') {
        syncSceneLabelTheme();
    }
    if (typeof syncFloorLabelContrast === 'function') {
        syncFloorLabelContrast();
    }
    storeTheme(currentTheme);
}

function updateMenuState() {
    if (isMenuOpen) {
        document.body.classList.add('menu-open');
        uiPanel.classList.remove('collapsed');
        toggleMenuText.textContent = "메뉴 숨기기";
        toggleMenuBtn.title = "메뉴 숨기기";
        toggleMenuBtn.setAttribute('aria-label', '메뉴 숨기기');
    } else {
        document.body.classList.remove('menu-open');
        uiPanel.classList.add('collapsed');
        toggleMenuText.textContent = "메뉴 보이기";
        toggleMenuBtn.title = "메뉴 보이기";
        toggleMenuBtn.setAttribute('aria-label', '메뉴 보이기');
    }
    if (typeof window.scheduleViewerLayoutResize === 'function') {
        window.scheduleViewerLayoutResize();
    }
    scheduleResponsiveOverlayCanvases();
}
syncThemeChrome();
updateMenuState();
toggleMenuBtn.addEventListener('click', () => { isMenuOpen = !isMenuOpen; updateMenuState(); });
themeToggleBtn?.addEventListener('click', () => {
    applyTheme(currentTheme === 'day' ? 'night' : 'day');
    scheduleResponsiveOverlayCanvases();
});


// --------------------------------------------------------
// 1. 기본 씬, 카메라, 조명 설정
// --------------------------------------------------------
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(themeSceneBackgrounds[currentTheme]);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
const XYY_DEFAULT_CAMERA_POS = new THREE.Vector3(0.5, 2.05, 0.5);
const XYY_DEFAULT_TARGET = new THREE.Vector3(0.5, 0.0, 0.5);
const LAB_DEFAULT_TARGET = new THREE.Vector3(0.5, 0.5, 0.5);
const LAB_DEFAULT_DISTANCE = 2.05;
const ICTCP_DEFAULT_TARGET = new THREE.Vector3(0.5, 0.5, 0.5);
const ICTCP_DEFAULT_DISTANCE = LAB_DEFAULT_DISTANCE;
camera.up.set(0, 0, 1);
camera.position.copy(XYY_DEFAULT_CAMERA_POS);

function getViewerSize() {
    return {
        width: Math.max(1, container.clientWidth || window.innerWidth),
        height: Math.max(1, container.clientHeight || window.innerHeight)
    };
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const initialViewerSize = getViewerSize();
renderer.setSize(initialViewerSize.width, initialViewerSize.height);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(XYY_DEFAULT_TARGET);
controls.saveState();

const interactionInstruction = document.getElementById('interaction-instruction');
let yAxisDragState = null;
const Y_AXIS_ROTATION_SENSITIVITY = 0.0035;
const Y_AXIS_ROTATION_MAX_DELTA = 48;
const Y_AXIS_ROTATION_STALE_MS = 180;

function isYAxisRotateGesture(event) {
    return activeTab === 'xyy' && event.shiftKey && event.button === 0;
}

function syncXyyMouseMode() {
    const isMatchingTab = activeTab === 'matching';
    controls.enabled = !isMatchingTab;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = !isMatchingTab;

    if (interactionInstruction) {
        interactionInstruction.textContent = activeTab === 'xyy'
            ? '좌클릭: x/y 회전 | Shift+좌클릭: Y축 회전 | 우클릭: 평면 이동 | 휠/핀치: 줌'
            : '좌클릭: 회전 | 우클릭: 이동 | 휠/핀치: 줌';
    }
    renderer.domElement.style.cursor = '';
}

function rotateCameraAroundYAxis(deltaX) {
    const angle = -deltaX * Y_AXIS_ROTATION_SENSITIVITY;
    const target = controls.target.clone();
    const offset = camera.position.clone().sub(target);
    const axis = new THREE.Vector3(0, 1, 0);

    offset.applyAxisAngle(axis, angle);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    controls.update();
}

function resetYAxisDragState(pointerId = null) {
    if (!yAxisDragState) return;
    if (pointerId !== null && yAxisDragState.pointerId !== pointerId) return;
    try { renderer.domElement.releasePointerCapture(yAxisDragState.pointerId); } catch { }
    yAxisDragState = null;
    renderer.domElement.style.cursor = '';
}

renderer.domElement.addEventListener('pointerdown', (event) => {
    if (!isYAxisRotateGesture(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    cameraFitAnimation = null;
    yAxisDragState = { pointerId: event.pointerId, lastX: event.clientX, lastTime: event.timeStamp };
    renderer.domElement.style.cursor = 'ew-resize';
    try { renderer.domElement.setPointerCapture(event.pointerId); } catch { }
}, true);

renderer.domElement.addEventListener('pointermove', (event) => {
    if (!yAxisDragState || yAxisDragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if ((event.buttons & 1) === 0) {
        resetYAxisDragState(event.pointerId);
        return;
    }
    const elapsed = event.timeStamp - yAxisDragState.lastTime;
    const rawDeltaX = event.clientX - yAxisDragState.lastX;
    yAxisDragState.lastX = event.clientX;
    yAxisDragState.lastTime = event.timeStamp;
    if (elapsed > Y_AXIS_ROTATION_STALE_MS) return;
    const deltaX = Math.max(-Y_AXIS_ROTATION_MAX_DELTA, Math.min(Y_AXIS_ROTATION_MAX_DELTA, rawDeltaX));
    rotateCameraAroundYAxis(deltaX);
}, true);

function stopYAxisDrag(event) {
    if (!yAxisDragState || yAxisDragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    resetYAxisDragState(event.pointerId);
}

renderer.domElement.addEventListener('pointerup', stopYAxisDrag, true);
renderer.domElement.addEventListener('pointercancel', stopYAxisDrag, true);
renderer.domElement.addEventListener('lostpointercapture', (event) => resetYAxisDragState(event.pointerId), true);
window.addEventListener('blur', () => resetYAxisDragState());
document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetYAxisDragState();
});

let cameraFitAnimation = null;

function getVisibleGamutBounds() {
    if (!show3DPolygons || typeof gamuts === 'undefined') return null;

    const bounds = new THREE.Box3();
    let hasVisibleGamut = false;
    Object.values(gamuts).forEach((mesh) => {
        if (!mesh.visible) return;
        mesh.updateWorldMatrix(true, false);
        const meshBounds = new THREE.Box3().setFromObject(mesh);
        if (meshBounds.isEmpty()) return;
        if (hasVisibleGamut) {
            bounds.union(meshBounds);
        } else {
            bounds.copy(meshBounds);
            hasVisibleGamut = true;
        }
    });

    return hasVisibleGamut ? bounds : null;
}

function computeFitCameraPoseForBounds(bounds) {
    const center = bounds.getCenter(new THREE.Vector3());
    const viewDir = camera.position.clone().sub(controls.target).normalize();
    const forward = viewDir.clone().negate();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const viewUp = new THREE.Vector3().crossVectors(right, forward).normalize();

    const currentTarget = controls.target.clone();
    const centerDelta = center.clone().sub(currentTarget);
    const endTarget = currentTarget
        .add(right.clone().multiplyScalar(centerDelta.dot(right)))
        .add(viewUp.clone().multiplyScalar(centerDelta.dot(viewUp)));

    const centerDepthOffset = center.clone().sub(endTarget).dot(forward);
    const size = bounds.getSize(new THREE.Vector3());
    const fallbackRadius = Math.max(size.length() * 0.5, 0.08);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const aspect = Math.max(camera.aspect || 1, 1e-6);

    const corners = [
        new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
        new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
        new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
        new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
        new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
        new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
        new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
        new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
    ];

    let requiredDistance = 0;
    corners.forEach((corner) => {
        const rel = corner.sub(center);
        const relForward = rel.dot(forward);
        const relX = Math.abs(rel.dot(right));
        const relY = Math.abs(rel.dot(viewUp));
        requiredDistance = Math.max(
            requiredDistance,
            relX / (tanHalfFov * aspect) - centerDepthOffset - relForward,
            relY / tanHalfFov - centerDepthOffset - relForward
        );
    });

    const endDistance = Math.max(requiredDistance * 1.22, fallbackRadius * 1.5, 0.25);
    return {
        target: endTarget,
        position: endTarget.clone().add(viewDir.multiplyScalar(endDistance))
    };
}

function getXRotatedPresetPose() {
    const resetPosition = XYY_DEFAULT_CAMERA_POS.clone();
    const resetTarget = XYY_DEFAULT_TARGET.clone();
    const offset = resetPosition.sub(resetTarget);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-60));
    return {
        position: resetTarget.clone().add(offset),
        target: resetTarget
    };
}

function getLabDefaultPose() {
    const offset = new THREE.Vector3(0, LAB_DEFAULT_DISTANCE, 0);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-60));
    return {
        position: LAB_DEFAULT_TARGET.clone().add(offset),
        target: LAB_DEFAULT_TARGET.clone()
    };
}

function getICtCpDefaultPose() {
    const offset = new THREE.Vector3(0, ICTCP_DEFAULT_DISTANCE, 0);
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-60));
    return {
        position: ICTCP_DEFAULT_TARGET.clone().add(offset),
        target: ICTCP_DEFAULT_TARGET.clone()
    };
}

function getXYZDefaultPose() {
    const bounds = new THREE.Box3();
    bounds.expandByPoint(new THREE.Vector3(0, 0, 0));
    bounds.expandByPoint(new THREE.Vector3(1.2, 1.2, 1.2));
    if (typeof xyzPoints !== 'undefined') {
        xyzPoints.forEach((point) => bounds.expandByPoint(point));
    }

    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() * 0.5, 0.1);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const aspect = Math.max(camera.aspect || 1, 1e-6);
    const distance = radius / (tanHalfFov * Math.min(1, aspect)) * 1.35;
    const viewDir = new THREE.Vector3(1, 1, 1).normalize();

    return {
        position: center.clone().add(viewDir.multiplyScalar(distance)),
        target: center
    };
}

function setCameraPose(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    camera.lookAt(controls.target);
    controls.update();
}

function clearOrbitControlMomentum() {
    const wasDampingEnabled = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = wasDampingEnabled;
}

const tabCameraStates = {};
const cameraTabs = new Set(['xyz', 'xyy', 'lab', 'ictcp']);

function cloneCameraPose() {
    return {
        position: camera.position.clone(),
        target: controls.target.clone()
    };
}

function getDefaultPoseForTab(tab) {
    if (tab === 'xyz') {
        return getXYZDefaultPose();
    }
    if (tab === 'lab') {
        return getLabDefaultPose();
    }
    if (tab === 'ictcp') {
        return getICtCpDefaultPose();
    }
    return {
        position: XYY_DEFAULT_CAMERA_POS.clone(),
        target: XYY_DEFAULT_TARGET.clone()
    };
}

function saveCameraPoseForTab(tab) {
    if (!cameraTabs.has(tab)) return;
    tabCameraStates[tab] = cloneCameraPose();
}

function restoreCameraPoseForTab(tab) {
    if (!cameraTabs.has(tab)) return;
    const pose = tabCameraStates[tab] || getDefaultPoseForTab(tab);
    setCameraPose({
        position: pose.position.clone(),
        target: pose.target.clone()
    });
}

function getCurrentTabDefaultPose() {
    if (activeTab === 'xyz') {
        return getXYZDefaultPose();
    }
    if (activeTab === 'lab') {
        return getLabDefaultPose();
    }
    if (activeTab === 'ictcp') {
        return getICtCpDefaultPose();
    }
    return {
        position: XYY_DEFAULT_CAMERA_POS.clone(),
        target: XYY_DEFAULT_TARGET.clone()
    };
}

function animateCameraFitToVisiblePolygons() {
    if (activeTab !== 'xyy' || !show3DPolygons) return;
    const bounds = getVisibleGamutBounds();
    if (!bounds) return;

    const pose = computeFitCameraPoseForBounds(bounds);
    cameraFitAnimation = {
        startTime: performance.now(),
        duration: 650,
        startPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        endPosition: pose.position,
        endTarget: pose.target
    };
}

function requestCameraFitToVisiblePolygons() {
    window.requestAnimationFrame(animateCameraFitToVisiblePolygons);
}

function updateCameraFitAnimation(now) {
    if (!cameraFitAnimation) return;

    const t = Math.min(1, (now - cameraFitAnimation.startTime) / cameraFitAnimation.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(cameraFitAnimation.startPosition, cameraFitAnimation.endPosition, eased);
    controls.target.lerpVectors(cameraFitAnimation.startTarget, cameraFitAnimation.endTarget, eased);
    camera.lookAt(controls.target);

    if (t >= 1) {
        cameraFitAnimation = null;
    }
}

function animateCameraToInitialView() {
    yAxisDragState = null;
    renderer.domElement.style.cursor = '';
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const pose = getCurrentTabDefaultPose();
    cameraFitAnimation = {
        startTime: performance.now(),
        duration: 700,
        startPosition,
        startTarget,
        endPosition: pose.position,
        endTarget: pose.target
    };
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    camera.lookAt(controls.target);
}

function animateCameraToXRotatedPreset() {
    yAxisDragState = null;
    renderer.domElement.style.cursor = '';
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const pose = getXRotatedPresetPose();

    cameraFitAnimation = {
        startTime: performance.now(),
        duration: 700,
        startPosition,
        startTarget,
        endPosition: pose.position,
        endTarget: pose.target
    };
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    camera.lookAt(controls.target);
}

function animateCameraToXRotatedFitView() {
    const bounds = getVisibleGamutBounds();
    if (!bounds) {
        animateCameraToXRotatedPreset();
        return;
    }

    yAxisDragState = null;
    renderer.domElement.style.cursor = '';
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const presetPose = getXRotatedPresetPose();
    camera.position.copy(presetPose.position);
    controls.target.copy(presetPose.target);
    camera.lookAt(controls.target);

    const fitPose = computeFitCameraPoseForBounds(bounds);
    cameraFitAnimation = {
        startTime: performance.now(),
        duration: 750,
        startPosition,
        startTarget,
        endPosition: fitPose.position,
        endTarget: fitPose.target
    };
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    camera.lookAt(controls.target);
}

renderer.domElement.addEventListener('pointerdown', () => {
    cameraFitAnimation = null;
});

window.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName?.toLowerCase();
    const inputType = activeElement?.type?.toLowerCase();
    const isTextInput = tagName === 'textarea' || tagName === 'select' ||
        (tagName === 'input' && !['checkbox', 'radio', 'range', 'button'].includes(inputType)) ||
        activeElement?.isContentEditable;
    const isTyping = isTextInput || (tagName === 'input' && inputType === 'range' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code));
    if (isTyping || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code !== 'KeyR' && event.code !== 'KeyV' && event.code !== 'KeyF') return;
    event.preventDefault();
    if (event.code === 'KeyR') {
        animateCameraToInitialView();
    } else if (event.code === 'KeyV') {
        animateCameraToXRotatedPreset();
    } else {
        animateCameraToXRotatedFitView();
    }
});

window.resizeViewerToLayout = () => {
    const { width, height } = getViewerSize();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};
window.scheduleViewerLayoutResize = () => {
    window.resizeViewerToLayout();
    window.requestAnimationFrame(window.resizeViewerToLayout);
    window.setTimeout(window.resizeViewerToLayout, 340);
};
if ('ResizeObserver' in window) {
    const viewerResizeObserver = new ResizeObserver(() => window.resizeViewerToLayout());
    viewerResizeObserver.observe(container);
}
window.scheduleViewerLayoutResize();

// --------------------------------------------------------
