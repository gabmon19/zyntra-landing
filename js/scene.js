(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  const isMobile = window.innerWidth < 900;
  const canvas   = document.getElementById('scene-canvas');
  if (!canvas) return;

  // ─── Renderer ─────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xe8ecf0, 1);

  // ─── Scene & Camera ──────────────────────────────────────────
  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0xe8ecf0, 0.028);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 14, 0.1);
  camera.lookAt(0, 0, 0);

  const camTarget  = { x: 0, y: 14, z: 0.1 };
  const camCurrent = { x: 0, y: 14, z: 0.1 };

  // ─── Luces ────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xd4dde6, 4.0));

  // ─── Cuadrícula principal — perspectiva cenital ───────────────
  const grid1 = new THREE.GridHelper(200, 60, 0x1e3a5f, 0x1e3a5f);
  grid1.material.opacity     = 0.10;
  grid1.material.transparent = true;
  grid1.position.y = -0.01;
  scene.add(grid1);

  // Cuadrícula secundaria más densa para profundidad
  const grid2 = new THREE.GridHelper(200, 180, 0x1e3a5f, 0x1e3a5f);
  grid2.material.opacity     = 0.04;
  grid2.material.transparent = true;
  grid2.position.y = -0.01;
  scene.add(grid2);

  // ─── Líneas de horizonte (efecto perspectiva) ──────────────────
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x2a4f7a,
    transparent: true,
    opacity: 0.08,
  });

  for (let i = -10; i <= 10; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i * 8, 0, -100),
      new THREE.Vector3(i * 8, 0,  100),
    ]);
    scene.add(new THREE.Line(geo, lineMat));
  }

  for (let j = -12; j <= 12; j++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-100, 0, j * 8),
      new THREE.Vector3( 100, 0, j * 8),
    ]);
    scene.add(new THREE.Line(geo, lineMat));
  }

  // ─── Partículas flotantes muy sutiles ─────────────────────────
  if (!isMobile) {
    const count = 120;
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] =  Math.random() * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({
      color: 0x6a82a0,
      size: 0.15,
      transparent: true,
      opacity: 0.25,
    })));
  }

  // ─── Scroll → cámara orbita lentamente ───────────────────────
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  }, { passive: true });

  // ─── Loop ─────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Movimiento muy lento de cámara — sentido de flotar sobre la red
    const angle  = t * 0.018 + scrollProgress * 0.8;
    const radius = 1.5 + scrollProgress * 12;
    const height = 14 - scrollProgress * 6;

    camTarget.x = Math.sin(angle) * radius;
    camTarget.y = Math.max(height, 2);
    camTarget.z = Math.cos(angle) * radius;

    const lf = 0.025;
    camCurrent.x += (camTarget.x - camCurrent.x) * lf;
    camCurrent.y += (camTarget.y - camCurrent.y) * lf;
    camCurrent.z += (camTarget.z - camCurrent.z) * lf;

    camera.position.set(camCurrent.x, camCurrent.y, camCurrent.z);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ─── Resize ───────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
