(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  const isMobile = window.innerWidth < 900;

  // ─── Canvas existente en el HTML ──────────────────────────────
  const canvas = document.getElementById('scene-canvas');
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
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xe8ecf0, 0.034);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 6, 20);
  camera.lookAt(0, 0, 0);

  const camTarget  = { x: 0, y: 6, z: 20 };
  const camCurrent = { x: 0, y: 6, z: 20 };

  // ─── Luces ────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xccd8e4, 3.0));

  const dirLight = new THREE.DirectionalLight(0xb8ccd8, 1.0);
  dirLight.position.set(-8, 12, -4);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xe0eaf2, 0.5);
  fillLight.position.set(10, -4, 8);
  scene.add(fillLight);

  // ─── Grid ─────────────────────────────────────────────────────
  const gridHelper = new THREE.GridHelper(80, 36, 0x1e3a5f, 0x1e3a5f);
  gridHelper.material.opacity = 0.055;
  gridHelper.material.transparent = true;
  gridHelper.position.y = -5;
  scene.add(gridHelper);

  // ─── Materiales compartidos ───────────────────────────────────
  const wireMats = {
    navy:    new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.55 }),
    crimson: new THREE.LineBasicMaterial({ color: 0xb03a48, transparent: true, opacity: 0.55 }),
    edge:    new THREE.LineBasicMaterial({ color: 0x2a4f7a, transparent: true, opacity: 0.13 }),
  };

  const solidMats = {
    navy:    new THREE.MeshStandardMaterial({ color: 0xd4dce6, emissive: 0x1e3a5f, emissiveIntensity: 0.18, roughness: 0.3, metalness: 0.6 }),
    crimson: new THREE.MeshStandardMaterial({ color: 0xe8d0d2, emissive: 0xb03a48, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.5 }),
    pi:      new THREE.MeshStandardMaterial({ color: 0xbccfe0, emissive: 0x1e3a5f, emissiveIntensity: 0.30, roughness: 0.25, metalness: 0.7 }),
  };

  // ─── Función: crea nodo geométrico con wireframe ───────────────
  function makeNode(geo, solidMat, wireMat) {
    const group = new THREE.Group();
    const solid = new THREE.Mesh(geo, solidMat);
    group.add(solid);
    const edges  = new THREE.EdgesGeometry(geo);
    const wire   = new THREE.LineSegments(edges, wireMat);
    wire.scale.setScalar(1.005); // ligerísimo offset para evitar z-fighting
    group.add(wire);
    return group;
  }

  // ─── Nodo central: Raspberry Pi — Dodecaedro (pentágonos) ─────
  const piGeo   = new THREE.DodecahedronGeometry(0.80, 0);
  const piNode  = makeNode(piGeo, solidMats.pi, wireMats.navy);
  piNode.position.set(0, 0, 0);
  scene.add(piNode);

  // Point light del nodo Pi
  const piLight = new THREE.PointLight(0x2a4f7a, 1.0, 12);
  piLight.position.set(0, 0, 0);
  scene.add(piLight);

  // ─── Servidores — Octaedros ───────────────────────────────────
  const serverDefs = [
    { pos: [-6.0, -1.0, -4.0], alert: false },
    { pos: [ 5.2,  1.6, -3.2], alert: true  },
    { pos: [-4.6,  1.2,  3.2], alert: false },
    { pos: [ 4.8, -1.6,  4.0], alert: false },
  ];

  const serverNodes = serverDefs.map(({ pos, alert }) => {
    const geo   = new THREE.OctahedronGeometry(0.46, 0);
    const solid = alert ? solidMats.crimson : solidMats.navy;
    const wire  = alert ? wireMats.crimson  : wireMats.navy;
    const node  = makeNode(geo, solid, wire);
    node.position.set(...pos);
    scene.add(node);

    const light = new THREE.PointLight(alert ? 0xb03a48 : 0x2a4f7a, 0.55, 7);
    light.position.set(...pos);
    scene.add(light);

    return { node, light, alert };
  });

  // ─── Ejes de rotación individuales (distintos por nodo) ───────
  const rotAxes = [
    new THREE.Vector3(0.4, 1, 0.2).normalize(),
    new THREE.Vector3(-0.3, 0.8, 0.5).normalize(),
    new THREE.Vector3(0.6, 0.4, -0.7).normalize(),
    new THREE.Vector3(-0.5, 0.9, 0.1).normalize(),
  ];

  // ─── Conexiones Pi → servidor (líneas) ───────────────────────
  const allPositions = [
    new THREE.Vector3(0, 0, 0),
    ...serverDefs.map(d => new THREE.Vector3(...d.pos)),
  ];

  // Pi a cada servidor
  [1, 2, 3, 4].forEach((i) => {
    const geo = new THREE.BufferGeometry().setFromPoints([allPositions[0], allPositions[i]]);
    scene.add(new THREE.Line(geo, wireMats.edge));
  });

  // Conexiones cruzadas entre servidores
  [[1, 2], [3, 4]].forEach(([a, b]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([allPositions[a], allPositions[b]]);
    scene.add(new THREE.Line(geo, wireMats.edge));
  });

  // ─── Partículas de datos (no en móvil) ───────────────────────
  const particles = [];

  if (!isMobile) {
    const pairs = [[0,1],[0,2],[0,3],[0,4],[1,2],[3,4]];
    pairs.forEach(([a, b]) => {
      for (let i = 0; i < 2; i++) {
        const geo  = new THREE.OctahedronGeometry(0.045, 0); // mini octaedros
        const mat  = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, opacity: 0.7, transparent: true });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        particles.push({
          mesh,
          posA: allPositions[a],
          posB: allPositions[b],
          t: i / 2,
          speed: 0.004 + Math.random() * 0.003,
          dir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    });
  }

  // ─── Puntos flotantes de fondo ────────────────────────────────
  if (!isMobile) {
    const count = 160;
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({
      color: 0x8a96a6, size: 0.06, transparent: true, opacity: 0.28,
    })));
  }

  // ─── Scroll → órbita cámara ───────────────────────────────────
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  }, { passive: true });

  // ─── Loop de animación ────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Órbita de cámara
    const angle  = t * 0.05 + scrollProgress * Math.PI * 1.4;
    const radius = 20 + scrollProgress * 5;
    const height =  6 - scrollProgress * 3;

    camTarget.x = Math.sin(angle) * radius;
    camTarget.y = height;
    camTarget.z = Math.cos(angle) * radius;

    const lf = 0.038;
    camCurrent.x += (camTarget.x - camCurrent.x) * lf;
    camCurrent.y += (camTarget.y - camCurrent.y) * lf;
    camCurrent.z += (camTarget.z - camCurrent.z) * lf;
    camera.position.set(camCurrent.x, camCurrent.y, camCurrent.z);
    camera.lookAt(0, 0, 0);

    // Rotación del dodecaedro Pi (lenta, elegante)
    piNode.rotation.y = t * 0.18;
    piNode.rotation.x = t * 0.09;
    piLight.intensity = 0.9 + Math.sin(t * 1.2) * 0.2;

    // Rotación de cada servidor en su propio eje
    serverNodes.forEach(({ node, light }, i) => {
      const speed = 0.22 + i * 0.04;
      node.rotateOnAxis(rotAxes[i], speed * 0.016);
      light.intensity = 0.45 + Math.sin(t * 1.1 + i * 1.4) * 0.18;
    });

    // Partículas de datos
    particles.forEach((p) => {
      p.t += p.speed * p.dir;
      if (p.t >= 1 || p.t <= 0) p.dir *= -1;
      p.mesh.position.lerpVectors(p.posA, p.posB, p.t);
      p.mesh.rotation.y = t * 3;
    });

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
