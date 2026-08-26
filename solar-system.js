import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEG = Math.PI / 180;
const J2000_JULIAN_DATE = 2451545.0;
const DAYS_PER_CENTURY = 36525;
const SIMULATED_DAYS_PER_SECOND = 365.256 / 45;
const ROTATION_HOURS_PER_SECOND = 2;
const ECLIPTIC_NORMAL = new THREE.Vector3(0, 1, 0);

// JPL approximate Keplerian elements and rates for 1800–2050.
// Each pair is [J2000 value, change per Julian century].
const PLANETS = [
  {
    id: "mercury", name: "水星 Mercury", texture: "textures/2k_mercury.jpg",
    radius: 2.3, rotationHours: 1407.6, axialTilt: 0.034,
    elements: {
      a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], i: [7.00497902, -0.00594749],
      L: [252.25032350, 149472.67411175], peri: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081]
    }
  },
  {
    id: "venus", name: "金星 Venus", texture: "textures/2k_venus_surface.jpg",
    radius: 4.6, rotationHours: -5832.5, axialTilt: 177.36,
    elements: {
      a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], i: [3.39467605, -0.00078890],
      L: [181.97909950, 58517.81538729], peri: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418]
    }
  },
  {
    id: "earth", name: "地球 Earth", texture: "textures/2k_earth_daymap.jpg",
    clouds: "textures/2k_earth_clouds.jpg", radius: 5, rotationHours: 23.9345, axialTilt: 23.439,
    elements: {
      a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], i: [-0.00001531, -0.01294668],
      L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0, 0]
    }
  },
  {
    id: "mars", name: "火星 Mars", texture: "textures/2k_mars.jpg",
    radius: 3.3, rotationHours: 24.6229, axialTilt: 25.19,
    elements: {
      a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], i: [1.84969142, -0.00813131],
      L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343]
    }
  },
  {
    id: "jupiter", name: "木星 Jupiter", texture: "textures/2k_jupiter.jpg",
    radius: 11.5, rotationHours: 9.925, axialTilt: 3.13,
    rings: [
      { inner: 1.71, outer: 1.82, color: 0x9a7658, opacity: 0.14 },
      { inner: 1.82, outer: 3.1, color: 0x9a7658, opacity: 0.025 }
    ],
    elements: {
      a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], i: [1.30439695, -0.00183714],
      L: [34.39644051, 3034.74612775], peri: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106]
    }
  },
  {
    id: "saturn", name: "土星 Saturn", texture: "textures/2k_saturn.jpg",
    radius: 10, rotationHours: 10.656, axialTilt: 26.73,
    rings: [
      { inner: 1.24, outer: 1.52, color: 0x9b896c, opacity: 0.25 },
      { inner: 1.53, outer: 1.95, color: 0xd8c69b, opacity: 0.67 },
      { inner: 1.97, outer: 2.27, color: 0xb8a57e, opacity: 0.48 }
    ],
    elements: {
      a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], i: [2.48599187, 0.00193609],
      L: [49.95424423, 1222.49362201], peri: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794]
    }
  },
  {
    id: "uranus", name: "天王星 Uranus", texture: "textures/2k_uranus.jpg",
    radius: 7.5, rotationHours: -17.24, axialTilt: 97.77,
    rings: [
      { inner: 1.64, outer: 1.67, color: 0x667174, opacity: 0.19 },
      { inner: 1.72, outer: 1.75, color: 0x69777a, opacity: 0.2 },
      { inner: 1.84, outer: 1.87, color: 0x718083, opacity: 0.2 },
      { inner: 1.96, outer: 2.01, color: 0x7c8b8e, opacity: 0.24 }
    ],
    elements: {
      a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], i: [0.77263783, -0.00242939],
      L: [313.23810451, 428.48202785], peri: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589]
    }
  },
  {
    id: "neptune", name: "海王星 Neptune", texture: "textures/2k_neptune.jpg",
    radius: 7.3, rotationHours: 16.11, axialTilt: 28.32,
    rings: [
      { inner: 1.65, outer: 1.69, color: 0x53617b, opacity: 0.08 },
      { inner: 2.1, outer: 2.15, color: 0x596984, opacity: 0.11 },
      { inner: 2.5, outer: 2.55, color: 0x61728f, opacity: 0.15 }
    ],
    elements: {
      a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], i: [1.77004347, 0.00035372],
      L: [-55.12002969, 218.45945325], peri: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664]
    }
  }
];

/** Convert a JavaScript date to a Julian date. */
function toJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Evaluate a J2000 element and its rate at the supplied Julian-century offset. */
function atCentury([base, rate], centuries) {
  return base + rate * centuries;
}

/** Keep an angle in the stable -180° to 180° range. */
function normalizeDegrees(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

/** Solve M = E - e sin(E) with Newton iterations. */
function solveEccentricAnomaly(meanAnomaly, eccentricity) {
  let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const delta = (meanAnomaly - eccentricAnomaly + eccentricity * Math.sin(eccentricAnomaly))
      / (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly += delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return eccentricAnomaly;
}

/**
 * Compress semimajor-axis spacing monotonically while retaining each orbit's
 * measured eccentricity. This is a display transform, not a physical unit map.
 */
function displaySemimajorAxis(astronomicalUnits) {
  return 58 + 76 * Math.log1p(astronomicalUnits * 2.2);
}

/** Create a repeatable pseudo-random generator for stable particle fields. */
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate an approximately normal random value with the Box-Muller transform. */
function randomNormal(random) {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(Math.PI * 2 * second);
}

/** Read the six approximate Keplerian elements for a simulated Julian date. */
function orbitalElementsAt(planet, julianDate) {
  const centuries = (julianDate - J2000_JULIAN_DATE) / DAYS_PER_CENTURY;
  const source = planet.elements;
  return {
    a: atCentury(source.a, centuries),
    e: atCentury(source.e, centuries),
    inclination: atCentury(source.i, centuries) * DEG,
    meanLongitude: atCentury(source.L, centuries),
    longitudePerihelion: atCentury(source.peri, centuries),
    longitudeNode: atCentury(source.node, centuries)
  };
}

/** Transform coordinates in an orbital ellipse into the Three.js world frame. */
function orbitalPointToWorld(xPrime, yPrime, elements, target = new THREE.Vector3()) {
  const omega = (elements.longitudePerihelion - elements.longitudeNode) * DEG;
  const node = elements.longitudeNode * DEG;
  const inclination = elements.inclination;
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosInclination = Math.cos(inclination);
  const sinInclination = Math.sin(inclination);

  const eclipticX = (cosOmega * cosNode - sinOmega * sinNode * cosInclination) * xPrime
    + (-sinOmega * cosNode - cosOmega * sinNode * cosInclination) * yPrime;
  const eclipticY = (cosOmega * sinNode + sinOmega * cosNode * cosInclination) * xPrime
    + (-sinOmega * sinNode + cosOmega * cosNode * cosInclination) * yPrime;
  const eclipticZ = sinOmega * sinInclination * xPrime + cosOmega * sinInclination * yPrime;

  return target.set(eclipticX, eclipticZ, -eclipticY);
}

/** Calculate a planet position with the Sun at the occupied focus. */
function planetPositionAt(planet, julianDate, target = new THREE.Vector3()) {
  const elements = orbitalElementsAt(planet, julianDate);
  const meanAnomaly = normalizeDegrees(elements.meanLongitude - elements.longitudePerihelion) * DEG;
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, elements.e);
  const semimajor = displaySemimajorAxis(elements.a);
  const xPrime = semimajor * (Math.cos(eccentricAnomaly) - elements.e);
  const yPrime = semimajor * Math.sqrt(1 - elements.e ** 2) * Math.sin(eccentricAnomaly);
  return orbitalPointToWorld(xPrime, yPrime, elements, target);
}

/** Build a sampled elliptical orbit in its measured J2000 orientation. */
function createOrbitLine(planet, julianDate) {
  const elements = orbitalElementsAt(planet, julianDate);
  const semimajor = displaySemimajorAxis(elements.a);
  const semiminor = semimajor * Math.sqrt(1 - elements.e ** 2);
  const points = [];
  for (let segment = 0; segment < 360; segment += 1) {
    const eccentricAnomaly = segment / 360 * Math.PI * 2;
    const xPrime = semimajor * (Math.cos(eccentricAnomaly) - elements.e);
    const yPrime = semiminor * Math.sin(eccentricAnomaly);
    points.push(orbitalPointToWorld(xPrime, yPrime, elements));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x7890c8,
    transparent: true,
    opacity: planet.id === "earth" ? 0.24 : 0.15,
    depthWrite: false
  });
  const line = new THREE.LineLoop(geometry, material);
  line.name = `${planet.id}-orbit`;
  return line;
}

/** Return the normal of a planet's orbital plane in the Three.js world frame. */
function orbitNormalAt(planet, julianDate) {
  const elements = orbitalElementsAt(planet, julianDate);
  const basisX = orbitalPointToWorld(1, 0, elements);
  const basisY = orbitalPointToWorld(0, 1, elements);
  return basisX.cross(basisY).normalize();
}

/** Make a soft additive sprite used as the Sun's corona. */
function createSunGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,236,190,0.95)");
  gradient.addColorStop(0.18, "rgba(255,176,72,0.52)");
  gradient.addColorStop(0.5, "rgba(255,100,32,0.16)");
  gradient.addColorStop(1, "rgba(255,72,16,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  sprite.scale.setScalar(105);
  return sprite;
}

/** Build the flattened 30–55 AU population beyond Neptune. */
function createKuiperBelt() {
  const random = createSeededRandom(0x4b554950);
  const positions = [];
  const particleCount = 4200;

  for (let index = 0; index < particleCount; index += 1) {
    // Weight the classical 38–50 AU region while retaining the full NASA range.
    const astronomicalUnits = random() < 0.72 ? 38 + random() * 12 : 30 + random() * 25;
    const radius = displaySemimajorAxis(astronomicalUnits);
    const longitude = random() * Math.PI * 2;
    const latitude = THREE.MathUtils.clamp(randomNormal(random) * 6 * DEG, -20 * DEG, 20 * DEG);
    const planarRadius = radius * Math.cos(latitude);
    positions.push(
      planarRadius * Math.cos(longitude),
      radius * Math.sin(latitude),
      planarRadius * Math.sin(longitude)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const belt = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0x9cafcf,
    size: 0.9,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  }));
  belt.name = "kuiper-belt-30-55-au";
  return belt;
}

/** Build the theorized 2,000–100,000 AU spherical Oort Cloud shell. */
function createOortCloud() {
  const random = createSeededRandom(0x4f4f5254);
  const positions = [];
  const particleCount = 7200;
  const logInner = Math.log(2000);
  const logOuter = Math.log(100000);

  for (let index = 0; index < particleCount; index += 1) {
    const astronomicalUnits = Math.exp(logInner + random() * (logOuter - logInner));
    const radius = displaySemimajorAxis(astronomicalUnits);
    const longitude = random() * Math.PI * 2;
    const vertical = random() * 2 - 1;
    const planar = Math.sqrt(1 - vertical * vertical);
    positions.push(
      radius * planar * Math.cos(longitude),
      radius * vertical,
      radius * planar * Math.sin(longitude)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const cloud = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xb7c9e8,
    size: 1,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  }));
  cloud.name = "oort-cloud-theoretical-2000-100000-au";
  return cloud;
}

/** Populate a deep 3D star field outside the Oort Cloud model. */
function createStarField() {
  const random = createSeededRandom(0x53544152);
  const positions = [];
  for (let index = 0; index < 2600; index += 1) {
    const radius = 1900 + random() * 1200;
    const theta = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const planar = Math.sqrt(1 - z * z);
    positions.push(
      radius * planar * Math.cos(theta),
      radius * z,
      radius * planar * Math.sin(theta)
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xdde6ff,
    size: 1.65,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    fog: false
  }));
}

/** Add physically subdued ring bands in a planet's equatorial plane. */
function addRingBands(parent, planet) {
  for (const band of planet.rings ?? []) {
    const geometry = new THREE.RingGeometry(
      planet.radius * band.inner,
      planet.radius * band.outer,
      192
    );
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: band.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: band.opacity,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.renderOrder = 1;
    parent.add(ring);
  }
}

/** Build a textured planet, its axial orientation, optional clouds and rings. */
function createPlanetObject(planet, textureLoader, labelsRoot, julianDate) {
  const body = new THREE.Group();
  body.name = planet.id;

  const orbitalNormal = orbitNormalAt(planet, julianDate);
  const orbitAlignment = new THREE.Quaternion().setFromUnitVectors(ECLIPTIC_NORMAL, orbitalNormal);
  const axialRotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    planet.axialTilt * DEG
  );
  body.quaternion.copy(orbitAlignment).multiply(axialRotation);

  const texture = textureLoader.load(planet.texture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(planet.radius, 48, 32),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 })
  );
  body.add(sphere);

  let clouds = null;
  if (planet.clouds) {
    const cloudTexture = textureLoader.load(planet.clouds);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(planet.radius * 1.012, 48, 32),
      new THREE.MeshBasicMaterial({
        map: cloudTexture,
        color: 0xcbdcff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    body.add(clouds);
  }

  addRingBands(body, planet);

  const label = document.createElement("span");
  label.className = "planet-label";
  label.textContent = planet.name;
  labelsRoot.append(label);

  return { data: planet, body, sphere, clouds, label };
}

/** Create a projected HTML label for a modeled outer-solar-system region. */
function createRegionLabel(labelsRoot, text, position) {
  const label = document.createElement("span");
  label.className = "planet-label region-label";
  label.textContent = text;
  labelsRoot.append(label);
  return { label, position };
}

/**
 * Initialize the complete Three.js solar-system scene and its input controls.
 * This is the single application entry point.
 */
function initSolarSystem() {
  const app = document.querySelector("#app");
  const labelsRoot = document.querySelector("#labels");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03040d, 0.0005);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 4200);
  camera.position.set(0, 360, 610);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "拖拽旋转太阳系，滚轮缩放");
  app.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.rotateSpeed = 0.48;
  controls.zoomSpeed = 0.72;
  controls.minDistance = 72;
  controls.maxDistance = 1800;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI - 0.08;
  controls.target.set(0, 0, 0);
  controls.update();

  // OrbitControls receives wheel input on the full-viewport canvas. This
  // document handler also covers the small linked overlay region.
  document.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.target === renderer.domElement) return;
    const offset = camera.position.clone().sub(controls.target);
    const factor = Math.exp(event.deltaY * 0.001);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance
    );
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
  }, { passive: false });

  const kuiperBelt = createKuiperBelt();
  const oortCloud = createOortCloud();
  scene.add(createStarField(), kuiperBelt, oortCloud);
  scene.add(new THREE.AmbientLight(0x7183b4, 0.18));
  scene.add(new THREE.PointLight(0xffd2a0, 52000, 0, 2));

  const textureManager = new THREE.LoadingManager();
  textureManager.onLoad = () => {
    document.body.classList.add("ready");
    app.dataset.ready = "true";
  };
  textureManager.onError = (url) => {
    console.error(`贴图加载失败：${url}`);
  };
  const textureLoader = new THREE.TextureLoader(textureManager);

  const sunTexture = textureLoader.load("textures/2k_sun.jpg");
  sunTexture.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(19, 64, 40),
    new THREE.MeshBasicMaterial({ map: sunTexture })
  );
  scene.add(sun, createSunGlow());

  const initialJulianDate = toJulianDate(new Date());
  const bodies = [];
  for (const planet of PLANETS) {
    scene.add(createOrbitLine(planet, initialJulianDate));
    const object = createPlanetObject(planet, textureLoader, labelsRoot, initialJulianDate);
    object.body.position.copy(planetPositionAt(planet, initialJulianDate));
    scene.add(object.body);
    bodies.push(object);
  }
  app.dataset.planetCount = String(bodies.length);
  app.dataset.orbitModel = "jpl-j2000-keplerian";
  app.dataset.kuiperBelt = "30-55-au";
  app.dataset.oortCloud = "theoretical-2000-100000-au";

  const kuiperRadius = displaySemimajorAxis(52);
  const kuiperAngle = 2.45;
  const oortLabelPosition = new THREE.Vector3(-0.68, 0.56, -0.48)
    .normalize()
    .multiplyScalar(displaySemimajorAxis(3500));
  const regionLabels = [
    createRegionLabel(
      labelsRoot,
      "柯伊伯带 · 30–55 AU",
      new THREE.Vector3(
        kuiperRadius * Math.cos(kuiperAngle),
        26,
        kuiperRadius * Math.sin(kuiperAngle)
      )
    ),
    createRegionLabel(labelsRoot, "奥尔特云 · 理论模型", oortLabelPosition)
  ];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  const labelPoint = new THREE.Vector3();
  let simulatedSeconds = 0;

  function placeLabel(label, worldPosition) {
    labelPoint.copy(worldPosition).project(camera);
    const visible = labelPoint.z > -1 && labelPoint.z < 1;
    const x = (labelPoint.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-labelPoint.y * 0.5 + 0.5) * window.innerHeight;
    label.style.opacity = visible ? "1" : "0";
    label.style.transform = `translate(-50%, 12px) translate3d(${x}px, ${y}px, 0)`;
  }

  function updateLabels() {
    for (const object of bodies) {
      placeLabel(object.label, object.body.position);
    }
    for (const region of regionLabels) {
      placeLabel(region.label, region.position);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (!reducedMotion) simulatedSeconds += delta;
    const julianDate = initialJulianDate + simulatedSeconds * SIMULATED_DAYS_PER_SECOND;

    for (const object of bodies) {
      object.body.position.copy(planetPositionAt(object.data, julianDate));
      if (!reducedMotion) {
        const rotationDirection = Math.sign(object.data.rotationHours);
        const rotationPeriod = Math.abs(object.data.rotationHours) / ROTATION_HOURS_PER_SECOND;
        object.sphere.rotation.y += rotationDirection * delta * Math.PI * 2 / rotationPeriod;
        if (object.clouds) object.clouds.rotation.y += delta * Math.PI * 2 / (rotationPeriod * 0.93);
      }
    }

    if (!reducedMotion) sun.rotation.y += delta * 0.035;
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  animate();
}

try {
  initSolarSystem();
} catch (error) {
  console.error(error);
  const loading = document.querySelector(".loading");
  if (loading) loading.textContent = "无法初始化三维场景";
}
