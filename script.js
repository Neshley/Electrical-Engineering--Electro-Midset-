/**
 * ELECTRO-MINDSET EEE HUB - CORE APPLICATION SCRIPT
 * Single Page Application engine, Interactive Workbench, Study Reader, and Document Index
 */

// Application State
const state = {
  currentView: 'dashboard',
  activeUnitId: null,
  activeDomain: 'All',
  activeCategory: 'All',
  searchQuery: '',
  theme: localStorage.getItem('em_theme') || 'dark',
  bookmarks: JSON.parse(localStorage.getItem('em_bookmarks') || '[]'),
  recentlyAccessed: JSON.parse(localStorage.getItem('em_recently_accessed') || '[]'),
  notes: localStorage.getItem('em_notes') || '',
  catalog: [],
  filteredFiles: [],
  readerTopic: 'powerlines',
  workbenchTab: 'motors',
  motorPhase: 3,
  motorPowerUnit: 'kw',
  vdropPhase: 1,
  rlcMode: 'series',
  txPhase: 3,
  // Resistor tool state
  resistorBands: 4,
  resBand1: 1, // Brown
  resBand2: 0, // Black
  resBand3: 0, // Black (for 5 band)
  resMultiplier: 2, // 10^2 = 100
  resTolerance: 5 // Gold 5%
};

// Resistor standard color data
const RESISTOR_COLORS = [
  { name: 'Black', hex: '#000000', digit: 0, mult: 1, tol: null },
  { name: 'Brown', hex: '#8b5a2b', digit: 1, mult: 10, tol: 1 },
  { name: 'Red', hex: '#ef4444', digit: 2, mult: 100, tol: 2 },
  { name: 'Orange', hex: '#f97316', digit: 3, mult: 1000, tol: null },
  { name: 'Yellow', hex: '#eab308', digit: 4, mult: 10000, tol: null },
  { name: 'Green', hex: '#22c55e', digit: 5, mult: 100000, tol: 0.5 },
  { name: 'Blue', hex: '#3b82f6', digit: 6, mult: 1000000, tol: 0.25 },
  { name: 'Violet', hex: '#a855f7', digit: 7, mult: 10000000, tol: 0.1 },
  { name: 'Gray', hex: '#64748b', digit: 8, mult: 100000000, tol: 0.05 },
  { name: 'White', hex: '#f8fafc', digit: 9, mult: 1000000000, tol: null },
  { name: 'Gold', hex: '#d97706', digit: null, mult: 0.1, tol: 5 },
  { name: 'Silver', hex: '#94a3b8', digit: null, mult: 0.01, tol: 10 }
];

// Fallback embedded catalog data for instant rendering
const DEFAULT_UNITS = [
  { id: 'powerlines', name: 'Electrical Powerlines & Transmission', folder: 'Electrical Powerlines', icon: 'zap', domain: 'Power Systems', code: 'EE-601', description: 'Overhead transmission lines, mechanical design, sag & tension, corona losses, tower structures, and POE exams.', fileCount: 13, files: [] },
  { id: 'principles', name: 'Electrical Principles & Circuit Theory', folder: 'Electrical principles', icon: 'activity', domain: 'Circuit Theory', code: 'EE-602', description: 'Fundamental laws of electricity, DC/AC circuit calculations, earthing systems, and lightning protection.', fileCount: 10, files: [] },
  { id: 'installation', name: 'Electrical Installation & Safety', folder: 'ELECTRICAL  (....+)/ELECTRICAL INSTALLATION', icon: 'shield-check', domain: 'Installation', code: 'EE-603', description: 'IEE wiring regulations, cable sizing, cable color identification, fire safety, and final circuit distribution.', fileCount: 18, files: [] },
  { id: 'machines', name: 'Electrical Machines & Industrial Drives', folder: 'ELECTRICAL  (....+)/ELECTRICAL MACHINE INSTALLATION', icon: 'cpu', domain: 'Machines & Drives', code: 'EE-604', description: 'Three-phase motors, synchronous machines, star-delta starters, forward-reverse control, and industrial drives.', fileCount: 18, files: [] },
  { id: 'automate', name: 'Automate an Electrical Machine', folder: 'Automate an Electrical Machine', icon: 'sliders', domain: 'Machines & Drives', code: 'EE-605', description: 'Machine automation, theory, practical assessments, control systems, and automated machine examination guides.', fileCount: 7, files: [] },
  { id: 'generation', name: 'Power Generation & Grid Stations', folder: 'Power Generation', icon: 'power', domain: 'Power Systems', code: 'EE-606', description: 'AC power generation, 11kV generating stations, primary/secondary transmission, and distribution sub-stations.', fileCount: 9, files: [] },
  { id: 'solar', name: 'Solar PV Systems & Installation', folder: 'Install solar systems', icon: 'sun', domain: 'Renewable Energy', code: 'EE-607', description: 'Solar PV technology fundamentals, PV array sizing, charge controllers, inverters, and battery storage.', fileCount: 11, files: [] },
  { id: 'electronics', name: 'Electronics & Semiconductor Devices', folder: 'Electronics', icon: 'radio', domain: 'Electronics', code: 'EE-608', description: 'Electronic components, semiconductor physics, rectification, signal conditioning, and examination questions.', fileCount: 2, files: [] },
  { id: 'maths', name: 'Engineering Mathematics', folder: 'Engineering Mathematics', icon: 'hash', domain: 'Mathematics', code: 'EE-609', description: 'Algebra, logarithms, laws of indices, binomial expansion, trigonometry, and CAT 1 worked solutions.', fileCount: 35, files: [] },
  { id: 'drawing', name: 'Technical Drawing & Schematics', folder: 'Technical Drawing', icon: 'edit-3', domain: 'Applied Engineering', code: 'EE-610', description: 'Engineering drawing principles, electrical symbols, wiring schematics, CAD layouts, and blueprint reading.', fileCount: 13, files: [] },
  { id: 'workshop', name: 'Workshop Technology & Practice', folder: 'Workshop tachnology', icon: 'tool', domain: 'Applied Engineering', code: 'EE-611', description: 'Level 5/6 workshop skills, fabrication, safety guidelines, fitting, machine tools, and continuous assessments.', fileCount: 4, files: [] },
  { id: 'security', name: 'Security Systems (CCTV & Alarms)', folder: 'Install Security Systems', icon: 'video', domain: 'Installation', code: 'EE-612', description: 'CCTV surveillance installation, intruder alarm systems, wiring techniques, and system testing.', fileCount: 3, files: [] },
  { id: 'digital', name: 'Digital Literacy & Computing', folder: 'Digital literacy', icon: 'monitor', domain: 'Computing', code: 'EE-613', description: 'Computer hardware, OS, spreadsheets, database management, digital tools, and cybersecurity basics.', fileCount: 15, files: [] },
  { id: 'maintenance', name: 'Maintain Electrical Equipment', folder: 'ELECTRICAL  (....+)/MAINTAIN ELECTRICAL EQUIPMENT AND MACHINES', icon: 'wrench', domain: 'Maintenance', code: 'EE-614', description: 'Preventive maintenance, troubleshooting electrical machines, fault diagnosis, and maintenance log guides.', fileCount: 2, files: [] },
  { id: 'projects', name: 'Manage Electrical Projects', folder: 'manage electrical projects', icon: 'clipboard', domain: 'Management', code: 'EE-615', description: 'Project management principles, project planning, work breakdown structure, cost estimation, and delivery.', fileCount: 5, files: [] },
  { id: 'ethics', name: 'Work Ethics & Professional Practice', folder: 'work ethics', icon: 'award', domain: 'Professional Skills', code: 'EE-616', description: 'CBET professional standards, workplace conduct, electrical safety ethics, and occupational health.', fileCount: 3, files: [] },
  { id: 'entrepreneurship', name: 'Entrepreneurship Education', folder: 'ENTREPRENEURSHIP', icon: 'briefcase', domain: 'Professional Skills', code: 'EE-617', description: 'Business planning, technical enterprise setup, electrical contracting startup, and financial planning.', fileCount: 1, files: [] }
];

// Study Notes Content Repository
const STUDY_NOTES = {
  powerlines: {
    title: "Electrical Powerlines & Transmission",
    domain: "Power Systems",
    sections: [
      {
        heading: "Essential Definitions & Terminology",
        content: `
          <p><strong>Alternating Current (AC):</strong> Electric current whose magnitude and direction alternate periodically (50 Hz standard in Kenya/UK, 60 Hz in USA).</p>
          <p><strong>Conductor:</strong> Low-resistance metallic cables (typically ACSR - Aluminum Conductor Steel Reinforced) used to transport bulk electrical power.</p>
          <p><strong>Transmission Structure (Poles & Towers):</strong> Physical lattice towers or wood/concrete poles engineered to hold high-voltage conductors safely separated from each other and the earth.</p>
          <p><strong>Shield / Ground Wire:</strong> Overhead earth conductor positioned at the very top of transmission towers to shield phase conductors from direct lightning strikes.</p>
          <p><strong>Substation:</strong> Grid node where transformers step transmission voltages up or down, coupled with switchgear, circuit breakers, and protection relays.</p>
        `
      },
      {
        heading: "Transmission Line Mechanical Design",
        content: `
          <p>The mechanical design of overhead transmission lines ensures structural integrity under extreme environmental loading. Factors considered include:</p>
          <ul>
            <li><strong>Conductor Selection:</strong> ACSR conductor size, cross-sectional tensile strength, and weight per meter.</li>
            <li><strong>Line Supports:</strong> Lattice steel towers, steel tubular poles, or treated wooden poles chosen based on line voltage (66kV, 132kV, 220kV, 400kV) and terrain.</li>
            <li><strong>Insulators:</strong> Number and type of disc insulators (Suspension or Tension strain) calculated according to line voltage and creepage distance.</li>
            <li><strong>Sag and Tension:</strong> Conductor sag is directly proportional to the square of the span length and inversely proportional to horizontal tension.</li>
          </ul>
          <div class="reader-callout">
            <p><strong>Sag Formula:</strong> $S = \\frac{w \\cdot L^2}{8T}$<br>
            Where $w$ = conductor weight per unit length (N/m), $L$ = span length (m), and $T$ = conductor tension (N).</p>
          </div>
        `
      },
      {
        heading: "Corona Phenomenon & Loss Reduction",
        content: `
          <p><strong>Corona</strong> is the phenomenon of violet luminescence, hissing audible noise, and ozone gas generation caused by the ionization of air surrounding high-voltage conductors when the electric field gradient exceeds the breakdown strength of air (approx. 30 kV/cm peak).</p>
          <h3>Effects of Corona</h3>
          <ul>
            <li><strong>Power Loss:</strong> Increases transmission power loss, reducing system efficiency.</li>
            <li><strong>Corrosion:</strong> Ozone chemically oxidizes and corrodes conductor surfaces.</li>
            <li><strong>Interference:</strong> Non-sinusoidal charging current causes inductive radio and telecommunication interference.</li>
          </ul>
          <h3>Methods of Minimizing Corona:</h3>
          <ol>
            <li><strong>Increase Conductor Diameter:</strong> Using hollow conductors or ACSR with large outer diameters lowers surface electric stress.</li>
            <li><strong>Increase Conductor Spacing:</strong> Separating phase conductors further apart lowers the electrostatic field gradient.</li>
            <li><strong>Use Bundled Conductors:</strong> Splitting each phase into 2, 3, or 4 sub-conductors dramatically increases effective diameter.</li>
          </ol>
        `
      }
    ]
  },
  principles: {
    title: "Electrical Principles & Circuit Theory",
    domain: "Circuit Theory",
    sections: [
      {
        heading: "Fundamental DC Circuit Laws",
        content: `
          <p><strong>Ohm's Law:</strong> The electric current flowing through a metallic conductor between two points is directly proportional to the voltage across the two points, provided physical conditions (temperature) remain constant:</p>
          <div class="reader-callout">
            <p><strong>$V = I \\times R$</strong> &nbsp;|&nbsp; <strong>$I = \\frac{V}{R}$</strong> &nbsp;|&nbsp; <strong>$R = \\frac{V}{I}$</strong></p>
          </div>
          <p><strong>Joule's Law of Electric Heating:</strong> The heat energy $H$ dissipated in an electrical conductor of resistance $R$ carrying current $I$ for time $t$:</p>
          <div class="reader-callout">
            <p><strong>$P = V \\times I = I^2 R = \\frac{V^2}{R}$</strong> (Watts)</p>
          </div>
        `
      },
      {
        heading: "Earthing in Electrical Installations",
        content: `
          <p>Earthing connects non-current-carrying metallic enclosures of equipment to the general mass of the Earth. Its primary purposes are:</p>
          <ul>
            <li>Protect human life against electric shock due to insulation failure.</li>
            <li>Provide a low-impedance path for fault currents to rapidly trip protective devices (fuses, MCBs, RCDs).</li>
            <li>Dissipate high-voltage transients caused by lightning or switching surges.</li>
          </ul>
        `
      },
      {
        heading: "Lightning Protection Systems",
        content: `
          <p>Direct lightning strikes carry instantaneous currents exceeding 20,000 to 200,000 Amperes. Standard protection uses the Faraday cage or Franklin air-termination rod method consisting of:</p>
          <ol>
            <li><strong>Air Termination Rods:</strong> Intercept lightning strokes at high elevation.</li>
            <li><strong>Down Conductors:</strong> Low-impedance copper or aluminum tape conducting charge safely down exterior building walls.</li>
            <li><strong>Earth Termination Network:</strong> Earth rods and ground plates maintaining an earth resistance below $10\\,\\Omega$.</li>
          </ol>
        `
      }
    ]
  },
  machines: {
    title: "Electrical Machines & Industrial Drives",
    domain: "Machines & Drives",
    sections: [
      {
        heading: "Three-Phase Induction Motors",
        content: `
          <p>The three-phase squirrel cage induction motor is the workhorse of industrial automation. It operates on Faraday's law of induction where a rotating magnetic field (RMF) is set up in the stator winding.</p>
          <p><strong>Synchronous Speed:</strong> $N_s = \\frac{120 \\times f}{P}$ (RPM), where $f$ is frequency (Hz) and $P$ is the number of poles.</p>
          <p><strong>Slip:</strong> $s = \\frac{N_s - N_r}{N_s}$, typically between 2% and 5% at rated full load.</p>
        `
      },
      {
        heading: "Star-Delta (Y-Δ) Motor Starting",
        content: `
          <p>Starting a 3-phase motor Direct-On-Line (DOL) draws 5 to 7 times the rated full-load current, causing severe voltage dips. The Star-Delta starter connects windings in Star during startup and switches to Delta once reaching ~80% speed:</p>
          <ul>
            <li><strong>Phase Voltage in Star:</strong> $V_{ph} = \\frac{V_L}{\\sqrt{3}} \\approx 0.58 \\times V_L$.</li>
            <li><strong>Starting Current in Star:</strong> Reduced to exactly <strong>1/3 (33.3%)</strong> of the direct-on-line delta starting current!</li>
            <li><strong>Starting Torque:</strong> Also reduced to <strong>1/3</strong> of full starting torque.</li>
          </ul>
        `
      },
      {
        heading: "Fleming's Left-Hand & Right-Hand Rules",
        content: `
          <p><strong>Fleming's Left-Hand Rule (Electric Motors):</strong> Used to determine the direction of force (motion) on a current-carrying conductor in a magnetic field:</p>
          <ul>
            <li><strong>Thumb:</strong> Direction of Motion / Force ($F$).</li>
            <li><strong>First Finger:</strong> Direction of Magnetic Field ($B$, North to South).</li>
            <li><strong>Second Finger:</strong> Direction of Current ($I$, Positive to Negative).</li>
          </ul>
          <p><strong>Fleming's Right-Hand Rule (Electric Generators):</strong> Used to determine the direction of induced EMF/current when a conductor moves through a magnetic field.</p>
          <div class="reader-diagram-wrapper">
            <img src="images/Fleming's rule.png" alt="Fleming's Rule Illustration" onerror="this.style.display='none'">
            <div class="diagram-caption">Figure: Fleming's Motor and Generator Hand Rules</div>
          </div>
        `
      }
    ]
  },
  generation: {
    title: "Power Generation & Grid Stations",
    domain: "Power Systems",
    sections: [
      {
        heading: "Grid Transmission & Distribution Hierarchy",
        content: `
          <p>Electrical power transmission systems transfer electrical energy from generating stations to consumers through a five-tier hierarchy:</p>
          <ol>
            <li><strong>Generating Station:</strong> Power generated at 11 kV by 3-phase synchronous alternators. Stepped up to 132 kV or 220 kV using step-up transformers for high-voltage transmission.</li>
            <li><strong>Primary Transmission:</strong> 132 kV / 220 kV transmitted over long distances using 3-phase 3-wire overhead towers to regional grid bulk supply points.</li>
            <li><strong>Secondary Transmission:</strong> Stepped down to 33 kV at primary substations and transmitted to industrial load centers.</li>
            <li><strong>Primary Distribution:</strong> Stepped down from 33 kV to 11 kV at distribution substations and routed throughout towns and industrial parks.</li>
            <li><strong>Secondary Distribution:</strong> Stepped down to <strong>400 V 3-phase 4-wire / 230 V single-phase</strong> via local pole-mounted or ground-mounted step-down transformers to supply domestic and commercial consumers.</li>
          </ol>
        `
      }
    ]
  },
  installation: {
    title: "Electrical Installation & Safety Regulations",
    domain: "Installation",
    sections: [
      {
        heading: "IEE Wiring Regulations & Cable Sizing",
        content: `
          <p>According to BS 7671 (IEE Wiring Regulations), conductors must be properly sized to prevent overheating, limit voltage drop to within 3% for lighting and 5% for other uses, and withstand prospective fault currents.</p>
          <h3>Standard Cable Color Identification:</h3>
          <ul>
            <li><strong>Single Phase:</strong> Line = Brown, Neutral = Blue, Protective Earth = Green/Yellow stripes.</li>
            <li><strong>Three Phase:</strong> L1 = Brown, L2 = Black, L3 = Grey, Neutral = Blue, Earth = Green/Yellow.</li>
          </ul>
        `
      },
      {
        heading: "Standard Domestic Final Circuits",
        content: `
          <ul>
            <li><strong>Lighting Circuit:</strong> $1.0\\,\\text{mm}^2$ or $1.5\\,\\text{mm}^2$ twin & earth cable, protected by a 6 A MCB.</li>
            <li><strong>Radial Socket Circuit:</strong> $2.5\\,\\text{mm}^2$ cable, protected by a 16 A or 20 A MCB (up to $20\\,\\text{m}^2$ floor area).</li>
            <li><strong>Ring Main Circuit:</strong> $2.5\\,\\text{mm}^2$ looped circuit, protected by a 32 A MCB (up to $100\\,\\text{m}^2$ floor area).</li>
            <li><strong>Cooker Circuit:</strong> $6.0\\,\\text{mm}^2$ or $10.0\\,\\text{mm}^2$ cable, protected by a 32 A or 40 A MCB.</li>
            <li><strong>Instant Shower Unit:</strong> $6.0\\,\\text{mm}^2$ or $10.0\\,\\text{mm}^2$ dedicated cable, protected by a 40 A or 45 A MCB + 30mA RCD.</li>
          </ul>
        `
      }
    ]
  },
  maths: {
    title: "Engineering Mathematics",
    domain: "Mathematics",
    sections: [
      {
        heading: "Laws of Indices & Powers",
        content: `
          <p>Indices represent repeated multiplication. The fundamental laws are:</p>
          <ul>
            <li>$a^m \\times a^n = a^{m+n}$</li>
            <li>$\\frac{a^m}{a^n} = a^{m-n}$</li>
            <li>$(a^m)^n = a^{m \\cdot n}$</li>
            <li>$a^0 = 1$ (for any $a \\neq 0$)</li>
            <li>$a^{-n} = \\frac{1}{a^n}$</li>
            <li>$a^{1/n} = \\sqrt[n]{a}$</li>
          </ul>
        `
      },
      {
        heading: "Logarithmic Functions in Engineering",
        content: `
          <p>If $y = a^x$, then $x = \\log_a(y)$. Standard properties used in decibel (dB) and attenuation calculations:</p>
          <ul>
            <li>$\\log(A \\times B) = \\log A + \\log B$</li>
            <li>$\\log(A / B) = \\log A - \\log B$</li>
            <li>$\\log(A^n) = n \\log A$</li>
            <li>Natural logarithm: $\\ln x = \\log_e x$, where $e \\approx 2.71828$.</li>
          </ul>
        `
      }
    ]
  },
  solar: {
    title: "Solar PV Systems & Sizing",
    domain: "Renewable Energy",
    sections: [
      {
        heading: "Photovoltaic Sizing Methodology",
        content: `
          <p>Step-by-step PV array sizing equation:</p>
          <ol>
            <li><strong>Calculate Daily Energy Consumption ($E_d$):</strong> Sum of $(P_{watt} \\times \\text{hours})$ for all loads in Watt-hours (Wh/day).</li>
            <li><strong>Factor in System Losses:</strong> Total Wh required = $E_d / \\eta_{sys}$, where system efficiency $\\eta_{sys} \\approx 0.75 - 0.80$.</li>
            <li><strong>Peak Sun Hours ($PSH$):</strong> Average daily irradiance hours (e.g. 5.0 to 5.5 PSH in East Africa).</li>
            <li><strong>PV Array Capacity ($W_p$):</strong> $\\text{Array } W_p = \\frac{\\text{Total Wh}}{PSH}$.</li>
            <li><strong>Battery Bank Capacity:</strong> $Ah = \\frac{E_d \\times \\text{Days of Autonomy}}{\\text{System Voltage} \\times \\text{Depth of Discharge (DoD)}}$.</li>
          </ol>
        `
      }
    ]
  }
};

// Cable standard data for IEE Tool
const CABLE_SIZES = [
  { size: '1.0 mm²', capacity: '11 - 15 A', mcb: '6 A', app: 'Lighting circuits (Domestic & Commercial)', maxKw: '1.4 kW' },
  { size: '1.5 mm²', capacity: '14 - 19.5 A', mcb: '10 A / 16 A', app: 'Long-run lighting, immersion heaters, control wiring', maxKw: '2.3 kW' },
  { size: '2.5 mm²', capacity: '18.5 - 27 A', mcb: '20 A / 32 A', app: 'Radial sockets & 32A Ring Final Circuits (Domestic)', maxKw: '4.6 - 7.4 kW' },
  { size: '4.0 mm²', capacity: '25 - 37 A', mcb: '25 A / 32 A', app: 'High-power socket radials, small motors, air conditioning', maxKw: '7.4 kW' },
  { size: '6.0 mm²', capacity: '34 - 47 A', mcb: '32 A / 40 A', app: 'Electric cookers, standard instant showers (7-8.5 kW)', maxKw: '9.2 kW' },
  { size: '10.0 mm²', capacity: '46 - 65 A', mcb: '50 A', app: 'High-power electric showers (9.5-10.8 kW), sub-main distribution', maxKw: '11.5 kW' },
  { size: '16.0 mm²', capacity: '62 - 87 A', mcb: '63 A', app: 'Consumer unit main tails, sub-panels, workshop supply', maxKw: '14.5 kW' },
  { size: '25.0 mm²', capacity: '80 - 114 A', mcb: '80 A / 100 A', app: 'Main service entry, industrial machinery feeds', maxKw: '23.0 kW' }
];

/* ==========================================================================
   INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  initNavigation();
  initWorkbench();
  initSearch();
  initStudyBag();
  renderRecentlyAccessed();
  loadCatalogData();
  handleUrlRouting();

  window.addEventListener('hashchange', handleUrlRouting);
  window.addEventListener('keydown', handleGlobalKeydown);
});

// URL Hash routing for smooth SPA navigation
function handleUrlRouting() {
  const hash = window.location.hash.replace('#', '').trim();
  if (!hash) {
    switchView('dashboard');
    return;
  }

  if (hash.startsWith('unit-')) {
    const unitId = hash.replace('unit-', '');
    openUnitDetail(unitId);
  } else if (hash.startsWith('reader-')) {
    const topicId = hash.replace('reader-', '');
    switchView('reader');
    selectReaderTopic(topicId);
  } else if (hash === 'calculator' || hash === 'workbench') {
    switchView('workbench');
  } else if (['dashboard', 'units', 'reader', 'workbench', 'exams', 'saved', 'info'].includes(hash)) {
    switchView(hash);
  } else {
    switchView('dashboard');
  }
}

function handleGlobalKeydown(e) {
  // Quick Search trigger with Ctrl+K or Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openSearchModal();
  }
  // Close modals on Escape
  if (e.key === 'Escape') {
    closeSearchModal();
  }
}

/* ==========================================================================
   NAVIGATION & VIEW SWITCHING
   ========================================================================== */

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn, .dock-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      if (targetView) {
        window.location.hash = targetView;
        switchView(targetView);
      }
      closeMobileSidebar();
    });
  });

  // Mobile sidebar toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Theme toggle buttons
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function switchView(viewName) {
  state.currentView = viewName;

  // Update nav button active states
  document.querySelectorAll('.nav-btn, .dock-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Show only current view container
  document.querySelectorAll('.app-view').forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update topbar breadcrumbs
  const breadcrumbEl = document.getElementById('topbar-breadcrumb');
  if (breadcrumbEl) {
    const titles = {
      dashboard: 'Dashboard',
      units: 'Units & Syllabus',
      'unit-detail': 'Unit Resource Explorer',
      reader: 'Study Notes & Formulas',
      workbench: 'Engineering Workbench',
      exams: 'CATs & Exams Portal',
      saved: 'My Study Bag',
      info: 'Course Outline & Contacts'
    };
    breadcrumbEl.textContent = titles[viewName] || 'Electro-Mindset';
  }

  // View specific refreshes
  if (viewName === 'dashboard') {
    renderRecentlyAccessed();
  } else if (viewName === 'saved') {
    renderSavedBookmarks();
  } else if (viewName === 'exams') {
    renderExamsPortal();
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('em_theme', theme);

  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  showToast(`Switched to ${nextTheme === 'light' ? 'Light' : 'Deep Dark'} Mode`);
}

/* ==========================================================================
   CATALOG DATA & API INTEGRATION
   ========================================================================== */

async function loadCatalogData() {
  // Start with default embedded catalog so UI paints instantly
  state.catalog = DEFAULT_UNITS;
  renderDashboardUnits();
  renderRecentlyAccessed();
  renderUnitsGrid();

  try {
    const response = await fetch('/api/catalog');
    if (response.ok) {
      const data = await response.json();
      if (data.units && data.units.length > 0) {
        state.catalog = data.units;
        renderDashboardUnits();
        renderRecentlyAccessed();
        renderUnitsGrid();
        updateGlobalStats(data);
      }
    }
  } catch (err) {
    console.warn('Using offline embedded catalog data:', err);
  }
}

function updateGlobalStats(data) {
  const totalFiles = data.totalFiles || 195;
  const totalUnits = data.totalUnits || 17;
  const totalTools = data.toolsCount || 8;
  
  const elFiles = document.getElementById('stat-total-files');
  if (elFiles) elFiles.textContent = totalFiles;
  
  const elUnits = document.getElementById('stat-total-units');
  if (elUnits) elUnits.textContent = totalUnits;

  const elTools = document.getElementById('stat-total-tools');
  if (elTools) elTools.textContent = totalTools;
}

/* ==========================================================================
   VIEW: DASHBOARD & RECENTLY ACCESSED ENGINE
   ========================================================================== */

function trackFileOpen(fileData, unitMeta) {
  try {
    let file = typeof fileData === 'string' ? JSON.parse(decodeURIComponent(fileData)) : fileData;
    if (!file || (!file.url && !file.path)) return;

    let unitName = file.unitName;
    let unitCode = file.unitCode;
    let unitId = file.unitId;

    if ((!unitName || !unitCode) && unitMeta) {
      unitName = unitName || unitMeta.name;
      unitCode = unitCode || unitMeta.code;
      unitId = unitId || unitMeta.id;
    }

    if ((!unitName || !unitCode) && state.catalog) {
      const foundUnit = state.catalog.find(u => 
        (u.files || []).some(f => (file.path && f.path === file.path) || (file.url && f.url === file.url))
      );
      if (foundUnit) {
        unitName = unitName || foundUnit.name;
        unitCode = unitCode || foundUnit.code;
        unitId = unitId || foundUnit.id;
      }
    }

    const item = {
      name: file.name || 'Engineering Document',
      rawName: file.rawName || file.name || '',
      path: file.path || file.url,
      url: file.url || file.path,
      ext: file.ext || (file.name ? file.name.split('.').pop().toLowerCase() : 'pdf'),
      category: file.category || 'Lecture Notes',
      sizeFormatted: file.sizeFormatted || '',
      unitName: unitName || 'Electrical Engineering',
      unitCode: unitCode || 'EE',
      unitId: unitId || '',
      timestamp: Date.now() // Tracked with a timestamp in local storage
    };

    let recents = JSON.parse(localStorage.getItem('em_recently_accessed') || '[]');
    recents = recents.filter(r => r.path !== item.path && r.url !== item.url);
    recents.unshift(item);

    // Keep top 10 in storage, but display last 3 on dashboard
    if (recents.length > 10) recents = recents.slice(0, 10);

    localStorage.setItem('em_recently_accessed', JSON.stringify(recents));
    state.recentlyAccessed = recents;

    renderRecentlyAccessed();
  } catch (err) {
    console.error('Error tracking file access:', err);
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function clearRecentlyAccessed() {
  localStorage.removeItem('em_recently_accessed');
  state.recentlyAccessed = [];
  renderRecentlyAccessed();
  showToast('Recently accessed history cleared.');
}

function renderRecentlyAccessed() {
  const container = document.getElementById('recently-accessed-container');
  const countBadge = document.getElementById('recently-accessed-count-badge');
  const actionsContainer = document.getElementById('recently-accessed-header-actions');
  if (!container) return;

  try {
    const stored = localStorage.getItem('em_recently_accessed');
    state.recentlyAccessed = stored ? JSON.parse(stored) : [];
  } catch (e) {
    state.recentlyAccessed = [];
  }

  // Strictly display the last 3 files the user opened
  const last3 = state.recentlyAccessed.slice(0, 3);

  if (countBadge) {
    if (last3.length > 0) {
      countBadge.textContent = `${last3.length} of 3`;
      countBadge.style.display = 'inline-block';
    } else {
      countBadge.style.display = 'none';
    }
  }

  if (actionsContainer) {
    if (last3.length > 0) {
      actionsContainer.innerHTML = `
        <button class="btn btn-sm btn-secondary" onclick="clearRecentlyAccessed()" style="font-size: 11px; padding: 3px 8px; color: var(--text-muted);" title="Clear history">
          Clear History
        </button>
      `;
    } else {
      actionsContainer.innerHTML = '';
    }
  }

  if (last3.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-strong);">
        <div style="font-size: 24px; margin-bottom: 8px;">⏱️</div>
        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No recently opened files yet</div>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 480px; margin: 0 auto 14px;">
          Files you open from any unit notes, examination past papers, or lab practicals will be automatically tracked here with timestamps so you can immediately resume your work.
        </p>
        <button class="btn btn-sm btn-secondary" onclick="window.location.hash='units'">
          Browse Study Units &rarr;
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      ${last3.map(item => {
        const relTime = formatRelativeTime(item.timestamp);
        const exactTime = new Date(item.timestamp).toLocaleString();
        const extClass = `ext-${(item.ext || 'doc').toLowerCase()}`;
        return `
          <div class="file-card recently-accessed-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="file-ext-icon ${extClass}" style="width: 32px; height: 32px; font-size: 10px;">${item.ext || 'doc'}</div>
                  <span class="unit-code-badge" style="font-size: 10px; padding: 2px 6px;">${item.unitCode || 'EE'}</span>
                </div>
                <div class="recently-accessed-timestamp" title="Opened: ${exactTime}">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${relTime}</span>
                </div>
              </div>

              <div class="file-title" style="font-size: 14px; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${item.rawName || item.name}">
                ${item.name}
              </div>
              <div class="file-meta" style="font-size: 12px; margin-bottom: 12px;">
                <span>${item.unitName}</span>
                <span>&bull;</span>
                <span>${item.category || 'Notes'}</span>
              </div>
            </div>

            <div class="file-actions" style="margin-top: auto;">
              <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1; text-align: center; justify-content: center; display: inline-flex; align-items: center; gap: 6px;" onclick="trackFileOpen('${encodeURIComponent(JSON.stringify(item))}')">
                <span>Open File</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              ${item.unitId ? `
                <button class="btn btn-sm btn-secondary" onclick="openUnitDetail('${item.unitId}')" title="Go to ${item.unitName}" style="padding: 6px 10px;">
                  Unit &rarr;
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDashboardUnits() {
  const container = document.getElementById('dashboard-units-preview');
  if (!container) return;

  const previewUnits = state.catalog.slice(0, 6);
  container.innerHTML = previewUnits.map(unit => `
    <div class="unit-card" onclick="openUnitDetail('${unit.id}')">
      <div class="unit-card-header">
        <span class="unit-code-badge">${unit.code}</span>
        <span class="unit-domain-badge">${unit.domain}</span>
      </div>
      <h3>${unit.name}</h3>
      <p>${unit.description}</p>
      <div class="unit-card-footer">
        <span>📄 ${unit.fileCount || unit.files?.length || 0} Resources</span>
        <span style="color: var(--accent-cyan); font-weight: 600;">Open &rarr;</span>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   VIEW: UNITS EXPLORER & DETAIL
   ========================================================================== */

function renderUnitsGrid() {
  const container = document.getElementById('units-all-grid');
  if (!container) return;

  const filtered = state.activeDomain === 'All' 
    ? state.catalog 
    : state.catalog.filter(u => u.domain === state.activeDomain);

  container.innerHTML = filtered.map(unit => `
    <div class="unit-card" onclick="openUnitDetail('${unit.id}')">
      <div class="unit-card-header">
        <span class="unit-code-badge">${unit.code}</span>
        <span class="unit-domain-badge">${unit.domain}</span>
      </div>
      <h3>${unit.name}</h3>
      <p>${unit.description}</p>
      <div class="unit-card-footer">
        <span>📚 ${unit.fileCount || unit.files?.length || 0} Files</span>
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openUnitDetail('${unit.id}')">View Unit</button>
      </div>
    </div>
  `).join('');

  // Render Domain Filter Chips
  renderDomainFilterChips();
}

function renderDomainFilterChips() {
  const filterContainer = document.getElementById('domain-filters');
  if (!filterContainer) return;

  const domains = ['All', ...new Set(state.catalog.map(u => u.domain))];
  filterContainer.innerHTML = domains.map(d => `
    <button class="filter-chip ${state.activeDomain === d ? 'active' : ''}" onclick="setDomainFilter('${d}')">
      ${d}
    </button>
  `).join('');
}

function setDomainFilter(domain) {
  state.activeDomain = domain;
  renderUnitsGrid();
}

function openUnitDetail(unitId) {
  state.activeUnitId = unitId;
  const unit = state.catalog.find(u => u.id === unitId);
  if (!unit) return;

  window.location.hash = `unit-${unitId}`;
  switchView('unit-detail');

  // Render Unit Header
  const headerContainer = document.getElementById('unit-detail-header-content');
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span class="unit-code-badge">${unit.code}</span>
          <span class="unit-domain-badge">${unit.domain}</span>
          ${unit.isCustom ? '<span style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(16,185,129,0.3);">Custom Unit</span>' : ''}
          ${unit.isAutoDiscovered ? '<span style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(6,182,212,0.3);">Auto Discovered</span>' : ''}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-sm btn-primary" onclick="openUploadFilesModal('${unit.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>+ Add Files</span>
          </button>
          ${unit.isCustom ? `<button class="btn btn-sm btn-secondary" style="color: var(--accent-rose); border-color: rgba(244,63,94,0.3);" onclick="deleteCustomUnit('${unit.id}', '${unit.name}')">Delete Unit</button>` : ''}
        </div>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${unit.name}</h2>
      <p style="color: var(--text-secondary); font-size: 14px; max-width: 720px; line-height: 1.6;">${unit.description}</p>
      <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <span>📁 Folder: <code style="color: var(--accent-cyan);">${unit.folder}</code></span>
        <span>📚 ${unit.files ? unit.files.length : unit.fileCount || 0} indexed documents</span>
      </div>
    `;
  }

  // Reset category filter
  state.activeCategory = 'All';
  renderUnitCategoryFilters(unit);
  renderUnitFiles(unit);
}

function renderUnitCategoryFilters(unit) {
  const container = document.getElementById('unit-category-filters');
  if (!container) return;

  const categories = ['All', 'Lecture Notes', 'Exams & CATs', 'Practical Guides', 'Reference Books', 'Diagrams & Images'];
  container.innerHTML = categories.map(cat => {
    const count = cat === 'All' 
      ? (unit.files ? unit.files.length : unit.fileCount) 
      : (unit.files ? unit.files.filter(f => f.category === cat).length : 0);
    return `
      <button class="filter-chip ${state.activeCategory === cat ? 'active' : ''}" onclick="setUnitCategoryFilter('${cat}')">
        ${cat} (${count})
      </button>
    `;
  }).join('');
}

function setUnitCategoryFilter(category) {
  state.activeCategory = category;
  const unit = state.catalog.find(u => u.id === state.activeUnitId);
  if (unit) {
    renderUnitCategoryFilters(unit);
    renderUnitFiles(unit);
  }
}

function renderUnitFiles(unit) {
  const filesContainer = document.getElementById('unit-files-list');
  if (!filesContainer) return;

  let files = unit.files || [];
  if (state.activeCategory !== 'All') {
    files = files.filter(f => f.category === state.activeCategory);
  }

  if (files.length === 0) {
    filesContainer.innerHTML = `
      <div style="grid-column: 1/-1; padding: 48px 24px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-strong);">
        <div style="font-size: 32px; margin-bottom: 12px;">📁</div>
        <p style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">No documents in this view</p>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 18px;">Drop notes, exam past papers, or lab guides to index them into this unit.</p>
        <button class="btn btn-primary" onclick="openUploadFilesModal('${unit.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Upload Files to ${unit.name}</span>
        </button>
      </div>
    `;
    return;
  }

  filesContainer.innerHTML = files.map(file => {
    const isStarred = state.bookmarks.some(b => b.path === file.path);
    return `
      <div class="file-card">
        <div class="file-header">
          <div class="file-ext-icon ext-${file.ext}">${file.ext}</div>
          <div class="file-info">
            <div class="file-title" title="${file.rawName || file.name}">${file.name}</div>
            <div class="file-meta">
              <span>${file.category}</span>
              <span>&bull;</span>
              <span>${file.sizeFormatted || 'Standard'}</span>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <a href="${file.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1;" onclick="trackFileOpen('${encodeURIComponent(JSON.stringify({ ...file, unitName: unit.name, unitCode: unit.code, unitId: unit.id }))}')">
            Open / Download
          </a>
          <button class="star-btn ${isStarred ? 'starred' : ''}" onclick="toggleBookmark('${encodeURIComponent(JSON.stringify(file))}')" title="Save to Study Bag">
            ${isStarred ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   VIEW: STUDY READER
   ========================================================================== */

function selectReaderTopic(topicId) {
  state.readerTopic = topicId;
  const topicData = STUDY_NOTES[topicId];
  if (!topicData) return;

  // Update TOC active state
  document.querySelectorAll('.toc-link').forEach(link => {
    if (link.getAttribute('data-topic') === topicId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Render Content
  const container = document.getElementById('reader-content-body');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <span class="unit-code-badge">${topicData.domain}</span>
      <button class="btn btn-sm btn-secondary" onclick="window.location.hash='unit-${topicId}'">Open Unit Files &rarr;</button>
    </div>
    <h1 style="font-size: 26px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px;">${topicData.title}</h1>
    <div class="reader-article">
      ${topicData.sections.map(sec => `
        <h2>${sec.heading}</h2>
        ${sec.content}
      `).join('')}
    </div>
  `;
}

/* ==========================================================================
   VIEW: INTERACTIVE ENGINEERING WORKBENCH
   ========================================================================== */

function initWorkbench() {
  // Tabs switcher
  const tabs = document.querySelectorAll('.workbench-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTool = tab.getAttribute('data-tool');
      switchWorkbenchTool(targetTool);
    });
  });

  // Ohm's law input listeners for real-time bidirectional solving
  ['ohm-v', 'ohm-i', 'ohm-r', 'ohm-p'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        highlightActiveOhmInputs();
      });
    }
  });

  // Real-time calculation listeners for all engineering calculators
  ['motor-power', 'motor-voltage', 'motor-rpm', 'motor-pf', 'motor-eff'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateMotor);
  });

  ['vdrop-voltage', 'vdrop-current', 'vdrop-length'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateVoltageDrop);
  });

  ['rlc-r', 'rlc-v', 'rlc-l', 'rlc-c', 'rlc-f'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateRlc);
  });

  ['tx-kva', 'tx-v1', 'tx-v2', 'tx-z'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateTransformer);
  });

  // Initial runs for all calculator suites if elements are present in the DOM
  if (document.getElementById('motor-power')) calculateMotor();
  if (document.getElementById('vdrop-voltage')) calculateVoltageDrop();
  if (document.getElementById('rlc-r')) calculateRlc();
  if (document.getElementById('tx-kva')) calculateTransformer();

  // Resistor band setup if elements are present
  if (document.getElementById('select-band-1')) {
    renderResistorControls();
    calculateResistor();
  }

  // Cable sizing table if elements are present
  if (document.getElementById('cable-table-body')) {
    renderCableTable();
  }

  // Power factor listener
  const pfCalcBtn = document.getElementById('calc-pf-btn');
  if (pfCalcBtn) {
    pfCalcBtn.addEventListener('click', calculatePowerFactor);
  }
}

function switchWorkbenchTool(toolName) {
  state.workbenchTab = toolName;

  document.querySelectorAll('.workbench-tab').forEach(tab => {
    if (tab.getAttribute('data-tool') === toolName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  document.querySelectorAll('.tool-panel').forEach(panel => {
    if (panel.id === `tool-${toolName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
}

/* ==========================================================================
   TOOL 0.1: 3-PHASE & AC INDUCTION MOTOR CALCULATOR
   ========================================================================== */
function setMotorPhase(phase) {
  state.motorPhase = phase;
  const btn3 = document.getElementById('motor-phase-3-btn');
  const btn1 = document.getElementById('motor-phase-1-btn');
  const voltInput = document.getElementById('motor-voltage');
  if (phase === 3) {
    if (btn3) btn3.classList.add('active');
    if (btn1) btn1.classList.remove('active');
    if (voltInput && voltInput.value === '230') voltInput.value = '415';
  } else {
    if (btn1) btn1.classList.add('active');
    if (btn3) btn3.classList.remove('active');
    if (voltInput && voltInput.value === '415') voltInput.value = '230';
  }
  calculateMotor();
}

function toggleMotorPowerUnit() {
  const select = document.getElementById('motor-unit-select');
  const label = document.getElementById('motor-power-unit-label');
  const powerInput = document.getElementById('motor-power');
  if (!select || !label || !powerInput) return;
  const newUnit = select.value;
  const currentVal = parseFloat(powerInput.value) || 0;
  if (newUnit === 'hp' && state.motorPowerUnit === 'kw') {
    powerInput.value = (currentVal / 0.7457).toFixed(1);
    label.textContent = 'HP';
    state.motorPowerUnit = 'hp';
  } else if (newUnit === 'kw' && state.motorPowerUnit === 'hp') {
    powerInput.value = (currentVal * 0.7457).toFixed(1);
    label.textContent = 'kW';
    state.motorPowerUnit = 'kw';
  }
  calculateMotor();
}

function updateMotorPoles() {
  const polesSelect = document.getElementById('motor-poles');
  const freqSelect = document.getElementById('motor-freq');
  const rpmInput = document.getElementById('motor-rpm');
  if (!polesSelect || !freqSelect || !rpmInput) return;
  const poles = parseInt(polesSelect.value) || 4;
  const freq = parseFloat(freqSelect.value) || 50;
  const ns = (120 * freq) / poles;
  rpmInput.value = Math.round(ns * 0.96);
  calculateMotor();
}

function applyMotorPreset(kw, poles, pf, eff) {
  const pInput = document.getElementById('motor-power');
  const uSelect = document.getElementById('motor-unit-select');
  const pLabel = document.getElementById('motor-power-unit-label');
  const polesSelect = document.getElementById('motor-poles');
  const pfInput = document.getElementById('motor-pf');
  const effInput = document.getElementById('motor-eff');
  const rpmInput = document.getElementById('motor-rpm');
  const freqSelect = document.getElementById('motor-freq');

  if (pInput) pInput.value = kw;
  if (uSelect) uSelect.value = 'kw';
  if (pLabel) pLabel.textContent = 'kW';
  state.motorPowerUnit = 'kw';
  if (polesSelect) polesSelect.value = poles;
  if (pfInput) pfInput.value = pf;
  if (effInput) effInput.value = eff;
  const freq = freqSelect ? parseFloat(freqSelect.value) || 50 : 50;
  const ns = (120 * freq) / poles;
  if (rpmInput) rpmInput.value = Math.round(ns * 0.96);
  setMotorPhase(3);
  calculateMotor();
}

function resetMotorCalc() {
  applyMotorPreset(7.5, 4, 0.85, 88.5);
  const voltInput = document.getElementById('motor-voltage');
  if (voltInput) voltInput.value = '415';
}

function calculateMotor() {
  const powerVal = parseFloat(document.getElementById('motor-power')?.value) || 0;
  const unit = document.getElementById('motor-unit-select')?.value || 'kw';
  const v = parseFloat(document.getElementById('motor-voltage')?.value) || 415;
  const freq = parseFloat(document.getElementById('motor-freq')?.value) || 50;
  const poles = parseInt(document.getElementById('motor-poles')?.value) || 4;
  let nr = parseFloat(document.getElementById('motor-rpm')?.value) || 1440;
  const pf = parseFloat(document.getElementById('motor-pf')?.value) || 0.85;
  const effPercent = parseFloat(document.getElementById('motor-eff')?.value) || 88.5;
  const phase = state.motorPhase || 3;

  if (powerVal <= 0 || v <= 0 || pf <= 0 || effPercent <= 0) return;

  const powerKw = unit === 'hp' ? powerVal * 0.7457 : powerVal;
  const powerWatts = powerKw * 1000;
  const eff = effPercent / 100;

  // Synchronous speed
  const ns = (120 * freq) / poles;
  if (nr >= ns) nr = ns - 1;
  const slip = ((ns - nr) / ns) * 100;

  // Full Load Current (FLA)
  let fla = 0;
  if (phase === 3) {
    fla = powerWatts / (Math.sqrt(3) * v * pf * eff);
  } else {
    fla = powerWatts / (v * pf * eff);
  }

  // Shaft Torque
  const torque = nr > 0 ? (9550 * powerKw) / nr : 0;

  // Apparent & Reactive Power
  let sKva = 0;
  if (phase === 3) {
    sKva = (Math.sqrt(3) * v * fla) / 1000;
  } else {
    sKva = (v * fla) / 1000;
  }
  const pElecKw = powerKw / eff;
  const qKvar = Math.sqrt(Math.max(0, sKva * sKva - pElecKw * pElecKw));

  // Inrush
  const dolInrush = fla * 6;
  const sdInrush = phase === 3 ? fla * 2 : dolInrush;

  // Protection recommendations
  const olMin = (fla * 1.0).toFixed(1);
  const olMax = (fla * 1.15).toFixed(1);
  
  const mcbStandard = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
  const targetMcb = fla * 1.35;
  const recMcb = mcbStandard.find(s => s >= targetMcb) || Math.ceil(targetMcb);

  const targetContactor = fla * 1.25;
  const recContactor = mcbStandard.find(s => s >= targetContactor) || Math.ceil(targetContactor);

  let pfcKvar = 0;
  if (pf < 0.95) {
    const phi1 = Math.acos(Math.min(1, pf));
    const phi2 = Math.acos(0.95);
    pfcKvar = pElecKw * (Math.tan(phi1) - Math.tan(phi2));
  }

  // Update UI Elements
  const elFla = document.getElementById('motor-res-fla');
  if (elFla) elFla.textContent = `${fla.toFixed(2)} A`;

  const elTorque = document.getElementById('motor-res-torque');
  if (elTorque) elTorque.textContent = `${torque.toFixed(2)} N·m`;

  const elNs = document.getElementById('motor-res-ns');
  if (elNs) elNs.textContent = `${Math.round(ns)} RPM`;

  const elSlip = document.getElementById('motor-res-slip');
  if (elSlip) elSlip.textContent = `${slip.toFixed(2)} %`;

  const elS = document.getElementById('motor-res-s');
  if (elS) elS.textContent = `${sKva.toFixed(2)} kVA`;

  const elQ = document.getElementById('motor-res-q');
  if (elQ) elQ.textContent = `${qKvar.toFixed(2)} kVAR`;

  const elDol = document.getElementById('motor-res-dol');
  if (elDol) elDol.textContent = `${dolInrush.toFixed(1)} A`;

  const elSd = document.getElementById('motor-res-sd');
  if (elSd) elSd.textContent = phase === 3 ? `${sdInrush.toFixed(1)} A` : 'N/A (1-Phase)';

  const elOl = document.getElementById('motor-rec-ol');
  if (elOl) elOl.textContent = `${olMin} A - ${olMax} A`;

  const elMcb = document.getElementById('motor-rec-mcb');
  if (elMcb) elMcb.textContent = `${recMcb} A (Type D)`;

  const elContactor = document.getElementById('motor-rec-contactor');
  if (elContactor) elContactor.textContent = `${recContactor} A`;

  const elPfc = document.getElementById('motor-rec-pfc');
  if (elPfc) elPfc.textContent = pfcKvar > 0 ? `${pfcKvar.toFixed(2)} kVAR` : 'Already ≥ 0.95';
}

/* ==========================================================================
   TOOL 0.2: BS 7671 / IEE VOLTAGE DROP & CABLE SIZER
   ========================================================================== */
function setVdropPhase(phase) {
  state.vdropPhase = phase;
  const btn1 = document.getElementById('vdrop-phase-1-btn');
  const btn3 = document.getElementById('vdrop-phase-3-btn');
  const vInput = document.getElementById('vdrop-voltage');
  if (phase === 1) {
    if (btn1) btn1.classList.add('active');
    if (btn3) btn3.classList.remove('active');
    if (vInput && vInput.value === '400') vInput.value = '230';
  } else {
    if (btn3) btn3.classList.add('active');
    if (btn1) btn1.classList.remove('active');
    if (vInput && vInput.value === '230') vInput.value = '400';
  }
  calculateVoltageDrop();
}

function resetVdropCalc() {
  setVdropPhase(1);
  const vInput = document.getElementById('vdrop-voltage');
  const iInput = document.getElementById('vdrop-current');
  const lInput = document.getElementById('vdrop-length');
  const matSelect = document.getElementById('vdrop-material');
  const sizeSelect = document.getElementById('vdrop-size');
  const limitSelect = document.getElementById('vdrop-limit');
  if (vInput) vInput.value = '230';
  if (iInput) iInput.value = '24';
  if (lInput) lInput.value = '45';
  if (matSelect) matSelect.value = 'copper';
  if (sizeSelect) sizeSelect.value = '4.0';
  if (limitSelect) limitSelect.value = '5';
  calculateVoltageDrop();
}

function calculateVoltageDrop() {
  const vNom = parseFloat(document.getElementById('vdrop-voltage')?.value) || 230;
  const current = parseFloat(document.getElementById('vdrop-current')?.value) || 24;
  const length = parseFloat(document.getElementById('vdrop-length')?.value) || 45;
  const material = document.getElementById('vdrop-material')?.value || 'copper';
  const size = parseFloat(document.getElementById('vdrop-size')?.value) || 4.0;
  const limitPct = parseFloat(document.getElementById('vdrop-limit')?.value) || 5.0;
  const phase = state.vdropPhase || 1;

  if (vNom <= 0 || current <= 0 || length <= 0 || size <= 0) return;

  const rho = material === 'aluminum' ? 0.0282 : 0.0175;
  const rSingle = (rho * length) / size;
  const rLoop = phase === 1 ? 2 * rSingle : Math.sqrt(3) * rSingle;

  const vDrop = current * rLoop;
  const pctDrop = (vDrop / vNom) * 100;
  const vLoad = Math.max(0, vNom - vDrop);

  const pLoss = phase === 1 ? current * current * (2 * rSingle) : 3 * current * current * rSingle;

  const standardSizes = [1.5, 2.5, 4.0, 6.0, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

  function findMinSize(targetPct) {
    const maxDropVolts = (targetPct / 100) * vNom;
    const factor = phase === 1 ? 2 : Math.sqrt(3);
    const reqArea = (factor * rho * length * current) / maxDropVolts;
    const match = standardSizes.find(s => s >= reqArea);
    return match ? `${match} mm²` : `> 240 mm² (${reqArea.toFixed(1)} mm²)`;
  }

  const rec5 = findMinSize(5.0);
  const rec3 = findMinSize(3.0);

  const isPassed = pctDrop <= limitPct;
  const badge = document.getElementById('vdrop-compliance-badge');
  const badgeText = document.getElementById('vdrop-compliance-text');

  if (badge && badgeText) {
    if (isPassed) {
      badge.className = 'compliance-badge pass';
      badgeText.innerHTML = `<strong>PASSED:</strong> Voltage drop is ${pctDrop.toFixed(2)}% (within ${limitPct}% allowable limit)`;
    } else {
      badge.className = 'compliance-badge fail';
      badgeText.innerHTML = `<strong>EXCEEDS CODE LIMIT:</strong> Drop is ${pctDrop.toFixed(2)}% (Limit: ${limitPct}%). Upgrade conductor recommended.`;
    }
  }

  const elVolts = document.getElementById('vdrop-res-volts');
  if (elVolts) elVolts.textContent = `${vDrop.toFixed(2)} V`;

  const elPct = document.getElementById('vdrop-res-percent');
  if (elPct) {
    elPct.textContent = `${pctDrop.toFixed(2)} %`;
    elPct.style.color = isPassed ? 'var(--accent-emerald)' : 'var(--accent-rose)';
  }

  const elLoadv = document.getElementById('vdrop-res-loadv');
  if (elLoadv) elLoadv.textContent = `${vLoad.toFixed(2)} V`;

  const elR = document.getElementById('vdrop-res-r');
  if (elR) elR.textContent = `${rLoop.toFixed(3)} Ω`;

  const elLoss = document.getElementById('vdrop-res-loss');
  if (elLoss) elLoss.textContent = `${pLoss.toFixed(1)} W`;

  const elRec5 = document.getElementById('vdrop-rec-5');
  if (elRec5) elRec5.textContent = rec5;

  const elRec3 = document.getElementById('vdrop-rec-3');
  if (elRec3) elRec3.textContent = rec3;
}

/* ==========================================================================
   TOOL 0.3: AC RLC IMPEDANCE & RESONANCE NETWORK SOLVER
   ========================================================================== */
function setRlcMode(mode) {
  state.rlcMode = mode;
  const btnS = document.getElementById('rlc-mode-series-btn');
  const btnP = document.getElementById('rlc-mode-parallel-btn');
  if (mode === 'series') {
    if (btnS) btnS.classList.add('active');
    if (btnP) btnP.classList.remove('active');
  } else {
    if (btnP) btnP.classList.add('active');
    if (btnS) btnS.classList.remove('active');
  }
  calculateRlc();
}

function resetRlcCalc() {
  setRlcMode('series');
  const rInput = document.getElementById('rlc-r');
  const vInput = document.getElementById('rlc-v');
  const lInput = document.getElementById('rlc-l');
  const lUnit = document.getElementById('rlc-l-unit');
  const cInput = document.getElementById('rlc-c');
  const cUnit = document.getElementById('rlc-c-unit');
  const fInput = document.getElementById('rlc-f');
  const fUnit = document.getElementById('rlc-f-unit');

  if (rInput) rInput.value = '47';
  if (vInput) vInput.value = '230';
  if (lInput) lInput.value = '150';
  if (lUnit) lUnit.value = 'mh';
  if (cInput) cInput.value = '10';
  if (cUnit) cUnit.value = 'uf';
  if (fInput) fInput.value = '50';
  if (fUnit) fUnit.value = 'hz';
  calculateRlc();
}

function calculateRlc() {
  const r = parseFloat(document.getElementById('rlc-r')?.value) || 0;
  const vRms = parseFloat(document.getElementById('rlc-v')?.value) || 230;

  let lVal = parseFloat(document.getElementById('rlc-l')?.value) || 0;
  const lUnit = document.getElementById('rlc-l-unit')?.value || 'mh';
  const lUnitLabel = document.getElementById('rlc-l-unit-label');
  if (lUnitLabel) lUnitLabel.textContent = lUnit === 'h' ? 'H' : (lUnit === 'uh' ? 'µH' : 'mH');
  let lH = lVal;
  if (lUnit === 'mh') lH = lVal * 1e-3;
  else if (lUnit === 'uh') lH = lVal * 1e-6;

  let cVal = parseFloat(document.getElementById('rlc-c')?.value) || 0;
  const cUnit = document.getElementById('rlc-c-unit')?.value || 'uf';
  const cUnitLabel = document.getElementById('rlc-c-unit-label');
  if (cUnitLabel) cUnitLabel.textContent = cUnit === 'pf' ? 'pF' : (cUnit === 'nf' ? 'nF' : 'µF');
  let cF = cVal;
  if (cUnit === 'uf') cF = cVal * 1e-6;
  else if (cUnit === 'nf') cF = cVal * 1e-9;
  else if (cUnit === 'pf') cF = cVal * 1e-12;

  let fVal = parseFloat(document.getElementById('rlc-f')?.value) || 50;
  const fUnit = document.getElementById('rlc-f-unit')?.value || 'hz';
  const fUnitLabel = document.getElementById('rlc-f-unit-label');
  if (fUnitLabel) fUnitLabel.textContent = fUnit === 'khz' ? 'kHz' : 'Hz';
  let fHz = fUnit === 'khz' ? fVal * 1e3 : fVal;

  if (fHz <= 0) return;

  const mode = state.rlcMode || 'series';

  const xl = 2 * Math.PI * fHz * lH;
  const xc = cF > 0 ? 1 / (2 * Math.PI * fHz * cF) : 1e12;

  let zMag = 0;
  let phaseDeg = 0;
  let pf = 0;
  let iRms = 0;
  let qFactor = 0;

  const f0 = (lH > 0 && cF > 0) ? 1 / (2 * Math.PI * Math.sqrt(lH * cF)) : 0;

  if (mode === 'series') {
    const xNet = xl - xc;
    zMag = Math.sqrt(r * r + xNet * xNet);
    phaseDeg = Math.atan2(xNet, r) * (180 / Math.PI);
    iRms = zMag > 0 ? vRms / zMag : 0;
    pf = zMag > 0 ? r / zMag : 1;
    qFactor = (r > 0 && lH > 0 && cF > 0) ? (1 / r) * Math.sqrt(lH / cF) : 0;
  } else {
    const g = r > 0 ? 1 / r : 0;
    const bl = xl > 0 ? 1 / xl : 0;
    const bc = 1 / xc;
    const bNet = bc - bl;
    const yMag = Math.sqrt(g * g + bNet * bNet);
    zMag = yMag > 0 ? 1 / yMag : 0;
    phaseDeg = Math.atan2(-bNet, g) * (180 / Math.PI);
    iRms = vRms * yMag;
    pf = yMag > 0 ? g / yMag : 1;
    qFactor = (lH > 0 && cF > 0) ? r * Math.sqrt(cF / lH) : 0;
  }

  const bw = (f0 > 0 && qFactor > 0) ? f0 / qFactor : 0;

  let natureText = '';
  let natureColor = 'var(--text-primary)';
  if (Math.abs(xl - xc) < 0.05 * Math.max(xl, xc, 1)) {
    natureText = 'Purely Resistive (Near Resonance, Unity PF)';
    natureColor = 'var(--accent-emerald)';
  } else if (xl > xc) {
    natureText = `Inductive (Current lags Voltage by ${Math.abs(phaseDeg).toFixed(1)}°)`;
    natureColor = 'var(--accent-cyan)';
  } else {
    natureText = `Capacitive (Current leads Voltage by ${Math.abs(phaseDeg).toFixed(1)}°)`;
    natureColor = 'var(--accent-rose)';
  }

  const elZ = document.getElementById('rlc-res-z');
  if (elZ) elZ.textContent = formatMetric(zMag, 'Ω');

  const elI = document.getElementById('rlc-res-i');
  if (elI) elI.textContent = formatMetric(iRms, 'A');

  const elAngle = document.getElementById('rlc-res-angle');
  if (elAngle) elAngle.textContent = `${phaseDeg >= 0 ? '+' : ''}${phaseDeg.toFixed(1)}°`;

  const elPf = document.getElementById('rlc-res-pf');
  if (elPf) elPf.textContent = `${pf.toFixed(3)} (${phaseDeg > 0.5 ? 'Lagging' : (phaseDeg < -0.5 ? 'Leading' : 'Unity')})`;

  const elXl = document.getElementById('rlc-res-xl');
  if (elXl) elXl.textContent = formatMetric(xl, 'Ω');

  const elXc = document.getElementById('rlc-res-xc');
  if (elXc) elXc.textContent = formatMetric(xc, 'Ω');

  const elNature = document.getElementById('rlc-res-nature');
  if (elNature) {
    elNature.textContent = natureText;
    elNature.style.color = natureColor;
  }

  const elF0 = document.getElementById('rlc-res-f0');
  if (elF0) elF0.textContent = formatMetric(f0, 'Hz');

  const elQ = document.getElementById('rlc-res-q');
  if (elQ) elQ.textContent = qFactor.toFixed(2);

  const elBw = document.getElementById('rlc-res-bw');
  if (elBw) elBw.textContent = formatMetric(bw, 'Hz');
}

/* ==========================================================================
   TOOL 0.4: POWER TRANSFORMER SIZING & FAULT ANALYSIS
   ========================================================================== */
function setTxPhase(phase) {
  state.txPhase = phase;
  const btn3 = document.getElementById('tx-phase-3-btn');
  const btn1 = document.getElementById('tx-phase-1-btn');
  if (phase === 3) {
    if (btn3) btn3.classList.add('active');
    if (btn1) btn1.classList.remove('active');
  } else {
    if (btn1) btn1.classList.add('active');
    if (btn3) btn3.classList.remove('active');
  }
  calculateTransformer();
}

function applyTxPreset(cap, v1, v2, z) {
  const capInput = document.getElementById('tx-kva');
  const uSelect = document.getElementById('tx-unit-select');
  const v1Input = document.getElementById('tx-v1');
  const v2Input = document.getElementById('tx-v2');
  const zInput = document.getElementById('tx-z');

  if (capInput) capInput.value = cap;
  if (uSelect) uSelect.value = cap >= 1000 && cap % 1000 === 0 && cap > 2000 ? 'mva' : 'kva';
  if (v1Input) v1Input.value = v1;
  if (v2Input) v2Input.value = v2;
  if (zInput) zInput.value = z;
  setTxPhase(3);
  calculateTransformer();
}

function resetTxCalc() {
  applyTxPreset(500, 11000, 415, 4.75);
}

function calculateTransformer() {
  let capVal = parseFloat(document.getElementById('tx-kva')?.value) || 500;
  const unit = document.getElementById('tx-unit-select')?.value || 'kva';
  const v1 = parseFloat(document.getElementById('tx-v1')?.value) || 11000;
  const v2 = parseFloat(document.getElementById('tx-v2')?.value) || 415;
  const zPercent = parseFloat(document.getElementById('tx-z')?.value) || 4.75;
  const phase = state.txPhase || 3;

  if (capVal <= 0 || v1 <= 0 || v2 <= 0 || zPercent <= 0) return;

  const kva = unit === 'mva' ? capVal * 1000 : capVal;
  const sVa = kva * 1000;

  let i1 = 0;
  let i2 = 0;
  if (phase === 3) {
    i1 = sVa / (Math.sqrt(3) * v1);
    i2 = sVa / (Math.sqrt(3) * v2);
  } else {
    i1 = sVa / v1;
    i2 = sVa / v2;
  }

  const ratio = v1 / v2;
  const zRatio = ratio * ratio;

  const iscAmps = i2 / (zPercent / 100);
  const iscKa = iscAmps / 1000;

  const faultMva = (kva / 1000) / (zPercent / 100);

  const fuseMin = (i1 * 1.25).toFixed(0);
  const fuseMax = (i1 * 1.5).toFixed(0);

  const acbStandard = [100, 160, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
  const targetAcb = i2 * 1.15;
  const recAcb = acbStandard.find(s => s >= targetAcb) || Math.ceil(targetAcb);

  const breakingRatings = [10, 16, 25, 36, 50, 65, 85, 100];
  const recBreaking = breakingRatings.find(r => r >= iscKa) || `${Math.ceil(iscKa)} kA`;

  const elI1 = document.getElementById('tx-res-i1');
  if (elI1) elI1.textContent = formatMetric(i1, 'A');

  const elI2 = document.getElementById('tx-res-i2');
  if (elI2) elI2.textContent = formatMetric(i2, 'A');

  const elRatio = document.getElementById('tx-res-ratio');
  if (elRatio) elRatio.textContent = `${ratio.toFixed(2)} : 1`;

  const elZratio = document.getElementById('tx-res-zratio');
  if (elZratio) elZratio.textContent = zRatio >= 1000 ? `${(zRatio / 1000).toFixed(1)}k` : zRatio.toFixed(1);

  const elIsc = document.getElementById('tx-res-isc');
  if (elIsc) elIsc.textContent = `${iscKa.toFixed(2)} kA (${Math.round(iscAmps)} A)`;

  const elMva = document.getElementById('tx-res-mva');
  if (elMva) elMva.textContent = `${faultMva.toFixed(2)} MVA`;

  const elFuse = document.getElementById('tx-rec-fuse');
  if (elFuse) elFuse.textContent = `${fuseMin} A - ${fuseMax} A`;

  const elAcb = document.getElementById('tx-rec-acb');
  if (elAcb) elAcb.textContent = `${recAcb} A`;

  const elBreaking = document.getElementById('tx-rec-breaking');
  if (elBreaking) elBreaking.textContent = `${recBreaking} kA rated`;
}

/* --- Tool 1: Ohm's Law Solver --- */
function highlightActiveOhmInputs() {
  const vEl = document.getElementById('ohm-v');
  const iEl = document.getElementById('ohm-i');
  const rEl = document.getElementById('ohm-r');
  const pEl = document.getElementById('ohm-p');
  if (!vEl || !iEl || !rEl || !pEl) return;

  const v = vEl.value;
  const i = iEl.value;
  const r = rEl.value;
  const p = pEl.value;

  const filledCount = [v, i, r, p].filter(val => val !== '').length;
  const solveBtn = document.getElementById('ohm-solve-btn');
  if (solveBtn) {
    solveBtn.disabled = filledCount < 2;
    solveBtn.textContent = filledCount >= 2 ? 'Solve Ohm\'s Law' : 'Enter Any 2 Values';
  }
}

function solveOhmsLaw() {
  const vEl = document.getElementById('ohm-v');
  const iEl = document.getElementById('ohm-i');
  const rEl = document.getElementById('ohm-r');
  const pEl = document.getElementById('ohm-p');
  if (!vEl || !iEl || !rEl || !pEl) return;

  let v = parseFloat(vEl.value);
  let i = parseFloat(iEl.value);
  let r = parseFloat(rEl.value);
  let p = parseFloat(pEl.value);

  const hasV = !isNaN(v) && v > 0;
  const hasI = !isNaN(i) && i > 0;
  const hasR = !isNaN(r) && r > 0;
  const hasP = !isNaN(p) && p > 0;

  let steps = [];

  if (hasV && hasI) {
    r = v / i;
    p = v * i;
    steps = [
      `R = V / I = ${v} / ${i} = ${formatMetric(r, 'Ω')}`,
      `P = V × I = ${v} × ${i} = ${formatMetric(p, 'W')}`
    ];
  } else if (hasV && hasR) {
    i = v / r;
    p = (v * v) / r;
    steps = [
      `I = V / R = ${v} / ${r} = ${formatMetric(i, 'A')}`,
      `P = V² / R = ${v}² / ${r} = ${formatMetric(p, 'W')}`
    ];
  } else if (hasV && hasP) {
    i = p / v;
    r = (v * v) / p;
    steps = [
      `I = P / V = ${p} / ${v} = ${formatMetric(i, 'A')}`,
      `R = V² / P = ${v}² / ${p} = ${formatMetric(r, 'Ω')}`
    ];
  } else if (hasI && hasR) {
    v = i * r;
    p = (i * i) * r;
    steps = [
      `V = I × R = ${i} × ${r} = ${formatMetric(v, 'V')}`,
      `P = I² × R = ${i}² × ${r} = ${formatMetric(p, 'W')}`
    ];
  } else if (hasI && hasP) {
    v = p / i;
    r = p / (i * i);
    steps = [
      `V = P / I = ${p} / ${i} = ${formatMetric(v, 'V')}`,
      `R = P / I² = ${p} / ${i}² = ${formatMetric(r, 'Ω')}`
    ];
  } else if (hasR && hasP) {
    v = Math.sqrt(p * r);
    i = Math.sqrt(p / r);
    steps = [
      `V = √(P × R) = √(${p} × ${r}) = ${formatMetric(v, 'V')}`,
      `I = √(P / R) = √(${p} / ${r}) = ${formatMetric(i, 'A')}`
    ];
  } else {
    showToast('Please enter at least 2 positive numbers');
    return;
  }

  // Update input fields
  if (vEl) vEl.value = Number(v.toFixed(4));
  if (iEl) iEl.value = Number(i.toFixed(4));
  if (rEl) rEl.value = Number(r.toFixed(4));
  if (pEl) pEl.value = Number(p.toFixed(4));

  // Render Formula Steps Box
  const stepsBox = document.getElementById('ohm-steps');
  if (stepsBox) {
    stepsBox.innerHTML = `
      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Calculation Breakdown:</div>
      ${steps.map(s => `<div class="formula-step">&rarr; ${s}</div>`).join('')}
    `;
  }

  showToast('Ohm\'s Law values calculated');
}

function resetOhmsLaw() {
  ['ohm-v', 'ohm-i', 'ohm-r', 'ohm-p'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const stepsBox = document.getElementById('ohm-steps');
  if (stepsBox) {
    stepsBox.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Enter any 2 values above to solve.</div>';
  }
}

function formatMetric(val, unit) {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)} M${unit}`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)} k${unit}`;
  if (val < 1 && val >= 1e-3) return `${(val * 1e3).toFixed(2)} m${unit}`;
  if (val < 1e-3) return `${(val * 1e6).toFixed(2)} µ${unit}`;
  return `${val.toFixed(2)} ${unit}`;
}

/* --- Tool 2: Resistor Color Code Calculator --- */
function setResistorBands(count) {
  state.resistorBands = count;
  const b4 = document.getElementById('band-4-toggle');
  const b5 = document.getElementById('band-5-toggle');
  if (b4) b4.classList.toggle('active', count === 4);
  if (b5) b5.classList.toggle('active', count === 5);
  
  const band3Group = document.getElementById('group-band-3');
  const visualBand3 = document.getElementById('res-visual-band3');
  if (band3Group) band3Group.style.display = count === 5 ? 'block' : 'none';
  if (visualBand3) visualBand3.style.display = count === 5 ? 'block' : 'none';

  calculateResistor();
}

function renderResistorControls() {
  const band1Select = document.getElementById('select-band-1');
  const band2Select = document.getElementById('select-band-2');
  const band3Select = document.getElementById('select-band-3');
  const multSelect = document.getElementById('select-mult');
  const tolSelect = document.getElementById('select-tol');

  if (!band1Select || !band2Select || !band3Select || !multSelect || !tolSelect) return;

  // Band 1 (digits 1-9)
  band1Select.innerHTML = RESISTOR_COLORS.filter(c => c.digit !== null && c.digit > 0).map(c => `
    <option value="${c.digit}" ${c.digit === state.resBand1 ? 'selected' : ''}>${c.digit} - ${c.name}</option>
  `).join('');

  // Band 2 & 3 (digits 0-9)
  const digitOptions = RESISTOR_COLORS.filter(c => c.digit !== null).map(c => `
    <option value="${c.digit}">${c.digit} - ${c.name}</option>
  `).join('');
  band2Select.innerHTML = digitOptions;
  band3Select.innerHTML = digitOptions;

  // Multipliers
  multSelect.innerHTML = RESISTOR_COLORS.filter(c => c.mult !== null).map((c, idx) => `
    <option value="${c.mult}">× ${c.mult >= 1 ? c.mult.toLocaleString() : c.mult} (${c.name})</option>
  `).join('');

  // Tolerances
  tolSelect.innerHTML = RESISTOR_COLORS.filter(c => c.tol !== null).map(c => `
    <option value="${c.tol}">±${c.tol}% (${c.name})</option>
  `).join('');

  // Defaults
  band2Select.value = state.resBand2;
  band3Select.value = state.resBand3;
  multSelect.value = 100;
  tolSelect.value = 5;

  [band1Select, band2Select, band3Select, multSelect, tolSelect].forEach(sel => {
    sel.addEventListener('change', calculateResistor);
  });
}

function calculateResistor() {
  const b1El = document.getElementById('select-band-1');
  const b2El = document.getElementById('select-band-2');
  const b3El = document.getElementById('select-band-3');
  const multEl = document.getElementById('select-mult');
  const tolEl = document.getElementById('select-tol');

  if (!b1El || !b2El || !multEl || !tolEl) return;

  const b1 = parseInt(b1El.value) || 0;
  const b2 = parseInt(b2El.value) || 0;
  const b3 = b3El ? (parseInt(b3El.value) || 0) : 0;
  const mult = parseFloat(multEl.value) || 1;
  const tol = parseFloat(tolEl.value) || 5;

  // Update visual resistor stripes
  const color1 = RESISTOR_COLORS.find(c => c.digit === b1);
  const color2 = RESISTOR_COLORS.find(c => c.digit === b2);
  const color3 = RESISTOR_COLORS.find(c => c.digit === b3);
  const colorMult = RESISTOR_COLORS.find(c => c.mult === mult);
  const colorTol = RESISTOR_COLORS.find(c => c.tol === tol);

  const vis1 = document.getElementById('res-visual-band1');
  const vis2 = document.getElementById('res-visual-band2');
  const vis3 = document.getElementById('res-visual-band3');
  const visMult = document.getElementById('res-visual-mult');
  const visTol = document.getElementById('res-visual-tol');

  if (color1 && vis1) vis1.style.backgroundColor = color1.hex;
  if (color2 && vis2) vis2.style.backgroundColor = color2.hex;
  if (color3 && vis3 && state.resistorBands === 5) vis3.style.backgroundColor = color3.hex;
  if (colorMult && visMult) visMult.style.backgroundColor = colorMult.hex;
  if (colorTol && visTol) visTol.style.backgroundColor = colorTol.hex;

  // Calculate value
  let baseValue = 0;
  if (state.resistorBands === 4) {
    baseValue = (b1 * 10 + b2) * mult;
  } else {
    baseValue = (b1 * 100 + b2 * 10 + b3) * mult;
  }

  const minVal = baseValue * (1 - tol / 100);
  const maxVal = baseValue * (1 + tol / 100);

  const displayEl = document.getElementById('res-readout');
  const tolElOut = document.getElementById('res-tolerance-readout');
  const rangeEl = document.getElementById('res-range-readout');

  if (displayEl) displayEl.textContent = formatMetric(baseValue, 'Ω');
  if (tolElOut) tolElOut.textContent = `±${tol}%`;
  if (rangeEl) rangeEl.textContent = `${formatMetric(minVal, 'Ω')} to ${formatMetric(maxVal, 'Ω')}`;
}

/* --- Tool 3: AC Power Factor Calculator --- */
function calculatePowerFactor() {
  const vEl = document.getElementById('pf-v');
  const iEl = document.getElementById('pf-i');
  const pfEl = document.getElementById('pf-val');
  if (!vEl || !iEl || !pfEl) return;

  const v = parseFloat(vEl.value) || 230;
  const i = parseFloat(iEl.value) || 10;
  const pf = parseFloat(pfEl.value) || 0.8;

  if (pf <= 0 || pf > 1) {
    showToast('Power factor must be between 0.01 and 1.0');
    return;
  }

  // Apparent power S = V * I (VA)
  const s = (v * i) / 1000; // kVA
  // Real power P = S * cos(phi) (kW)
  const p = s * pf; // kW
  // Reactive power Q = sqrt(S^2 - P^2) (kVAR)
  const q = Math.sqrt(Math.max(0, s * s - p * p));
  const angleDeg = Math.acos(pf) * (180 / Math.PI);

  // Correction to target pf 0.95
  const targetPf = 0.95;
  const targetQ = p * Math.tan(Math.acos(targetPf));
  const requiredKvar = Math.max(0, q - targetQ);

  const resPEl = document.getElementById('pf-res-p');
  const resSEl = document.getElementById('pf-res-s');
  const resQEl = document.getElementById('pf-res-q');
  const resAngleEl = document.getElementById('pf-res-angle');
  const resCorrEl = document.getElementById('pf-res-correction');

  if (resPEl) resPEl.textContent = `${p.toFixed(2)} kW`;
  if (resSEl) resSEl.textContent = `${s.toFixed(2)} kVA`;
  if (resQEl) resQEl.textContent = `${q.toFixed(2)} kVAR`;
  if (resAngleEl) resAngleEl.textContent = `${angleDeg.toFixed(1)}°`;
  if (resCorrEl) resCorrEl.textContent = `${requiredKvar.toFixed(2)} kVAR`;

  // Draw Dynamic SVG Power Triangle
  drawPowerTriangle(p, q, s, angleDeg);
}

function drawPowerTriangle(p, q, s, angle) {
  const svg = document.getElementById('power-triangle-svg');
  if (!svg) return;

  const width = 240;
  const height = 140;
  const pad = 25;

  const baseWidth = width - pad * 2;
  const oppHeight = Math.min(height - pad * 2, (q / Math.max(1, p)) * baseWidth);

  const x0 = pad;
  const y0 = height - pad;
  const x1 = pad + baseWidth;
  const y1 = y0;
  const x2 = x1;
  const y2 = y0 - Math.max(20, oppHeight);

  svg.innerHTML = `
    <polygon points="${x0},${y0} ${x1},${y1} ${x2},${y2}" fill="rgba(6, 182, 212, 0.15)" stroke="var(--accent-cyan)" stroke-width="2" />
    <text x="${(x0 + x1) / 2}" y="${y0 + 16}" fill="var(--text-primary)" font-size="11" font-weight="bold" text-anchor="middle">P = ${p.toFixed(1)} kW</text>
    <text x="${x1 + 6}" y="${(y1 + y2) / 2}" fill="var(--accent-amber)" font-size="11" font-weight="bold" dominant-baseline="middle">Q = ${q.toFixed(1)} kVAR</text>
    <text x="${(x0 + x2) / 2 - 12}" y="${(y0 + y2) / 2 - 8}" fill="#a855f7" font-size="11" font-weight="bold">S = ${s.toFixed(1)} kVA</text>
  `;
}

/* --- Tool 4: Cable Sizing Table --- */
function renderCableTable() {
  const tbody = document.getElementById('cable-table-body');
  if (!tbody) return;

  tbody.innerHTML = CABLE_SIZES.map(c => `
    <tr style="border-bottom: 1px solid var(--border-subtle);">
      <td style="padding: 12px 14px; font-weight: 700; font-family: var(--font-mono); color: var(--accent-cyan);">${c.size}</td>
      <td style="padding: 12px 14px; color: var(--text-primary);">${c.capacity}</td>
      <td style="padding: 12px 14px; font-weight: 600; color: var(--accent-amber);">${c.mcb}</td>
      <td style="padding: 12px 14px; color: var(--text-secondary); font-size: 13px;">${c.app}</td>
      <td style="padding: 12px 14px; font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">${c.maxKw}</td>
    </tr>
  `).join('');
}

/* ==========================================================================
   VIEW: CATS & EXAMS PORTAL
   ========================================================================== */

function renderExamsPortal() {
  const container = document.getElementById('exams-list-container');
  if (!container) return;

  const searchInput = document.getElementById('exam-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let allExams = [];
  state.catalog.forEach(unit => {
    (unit.files || []).forEach(file => {
      if (file.category === 'Exams & CATs') {
        allExams.push({ ...file, unitName: unit.name, unitCode: unit.code });
      }
    });
  });

  if (query) {
    allExams = allExams.filter(e => e.name.toLowerCase().includes(query) || e.unitName.toLowerCase().includes(query));
  }

  if (allExams.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <p style="font-size: 16px; font-weight: 600;">No exams matching "${query}"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allExams.map(exam => `
    <div class="file-card">
      <div class="file-header">
        <div class="file-ext-icon ext-${exam.ext}">${exam.ext}</div>
        <div class="file-info">
          <div style="font-size: 11px; font-weight: 700; color: var(--accent-cyan);">${exam.unitCode} &bull; ${exam.unitName}</div>
          <div class="file-title" style="margin-top: 4px;">${exam.name}</div>
          <div class="file-meta">
            <span>Examination Paper</span>
            <span>&bull;</span>
            <span>${exam.sizeFormatted || 'Standard'}</span>
          </div>
        </div>
      </div>
      <div class="file-actions">
        <a href="${exam.url}" target="_blank" rel="noopener" class="btn btn-sm btn-amber" style="flex: 1;" onclick="trackFileOpen('${encodeURIComponent(JSON.stringify(exam))}')">
          Download Exam Paper &rarr;
        </a>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   VIEW: STUDY BAG & SCRATCHPAD
   ========================================================================== */

function initStudyBag() {
  const notepad = document.getElementById('study-scratchpad');
  if (notepad) {
    notepad.value = state.notes;
    notepad.addEventListener('input', () => {
      state.notes = notepad.value;
      localStorage.setItem('em_notes', state.notes);
    });
  }
}

function renderSavedBookmarks() {
  const container = document.getElementById('saved-bookmarks-container');
  const countBadge = document.getElementById('saved-count-badge');
  if (countBadge) countBadge.textContent = state.bookmarks.length;

  if (!container) return;

  if (state.bookmarks.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <p style="font-size: 16px; font-weight: 600;">Your Study Bag is empty</p>
        <p style="font-size: 13px; margin-top: 6px;">Click the "Save" button on any note, exam, or practical guide to keep it handy here.</p>
        <button class="btn btn-sm btn-primary" style="margin-top: 14px;" onclick="switchView('units')">Browse Units</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="files-grid">
      ${state.bookmarks.map(file => `
        <div class="file-card">
          <div class="file-header">
            <div class="file-ext-icon ext-${file.ext}">${file.ext}</div>
            <div class="file-info">
              <div class="file-title">${file.name}</div>
              <div class="file-meta">
                <span>${file.category || 'Saved'}</span>
                <span>&bull;</span>
                <span>${file.sizeFormatted || 'Document'}</span>
              </div>
            </div>
          </div>
          <div class="file-actions">
            <a href="${file.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1;" onclick="trackFileOpen('${encodeURIComponent(JSON.stringify(file))}')">
              Open File
            </a>
            <button class="btn btn-sm btn-secondary" onclick="removeBookmark('${file.path}')" title="Remove from bag">
              ✕
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleBookmark(encodedFileJson) {
  try {
    const file = JSON.parse(decodeURIComponent(encodedFileJson));
    const index = state.bookmarks.findIndex(b => b.path === file.path);
    if (index >= 0) {
      state.bookmarks.splice(index, 1);
      showToast('Removed from Study Bag');
    } else {
      state.bookmarks.push(file);
      showToast('Saved to Study Bag');
    }
    localStorage.setItem('em_bookmarks', JSON.stringify(state.bookmarks));
    
    // Update active unit view if open
    if (state.currentView === 'unit-detail') {
      const unit = state.catalog.find(u => u.id === state.activeUnitId);
      if (unit) renderUnitFiles(unit);
    }
  } catch (err) {
    console.error('Bookmark error:', err);
  }
}

function removeBookmark(path) {
  state.bookmarks = state.bookmarks.filter(b => b.path !== path);
  localStorage.setItem('em_bookmarks', JSON.stringify(state.bookmarks));
  renderSavedBookmarks();
  showToast('Removed from Study Bag');
}

function exportNotes() {
  const blob = new Blob([state.notes], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Electro-Mindset-Notes-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  showToast('Exported notes file');
}

/* ==========================================================================
   GLOBAL SEARCH MODAL PALETTE
   ========================================================================== */

function initSearch() {
  const searchInput = document.getElementById('search-modal-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearchQuery(e.target.value);
    });
  }

  const trigger = document.getElementById('search-trigger');
  if (trigger) {
    trigger.addEventListener('click', openSearchModal);
  }

  // Handle backdrop clicks for all modals
  ['search-modal-overlay', 'create-unit-modal-overlay', 'upload-files-modal-overlay'].forEach(id => {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    }
  });

  // Global ESC key to close any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['search-modal-overlay', 'create-unit-modal-overlay', 'upload-files-modal-overlay'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
      });
    }
  });
}

function openSearchModal() {
  const overlay = document.getElementById('search-modal-overlay');
  const input = document.getElementById('search-modal-input');
  if (overlay) overlay.classList.add('active');
  if (input) {
    input.value = '';
    input.focus();
    handleSearchQuery('');
  }
}

function closeSearchModal() {
  const overlay = document.getElementById('search-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

function handleSearchQuery(query) {
  const resultsContainer = document.getElementById('search-results-list');
  if (!resultsContainer) return;

  const q = query.toLowerCase().trim();
  let matches = [];

  // Search Units
  state.catalog.forEach(u => {
    if (u.name.toLowerCase().includes(q) || u.domain.toLowerCase().includes(q) || u.code.toLowerCase().includes(q)) {
      matches.push({
        type: 'Unit',
        title: u.name,
        subtitle: `${u.code} &bull; ${u.domain}`,
        action: () => { closeSearchModal(); openUnitDetail(u.id); }
      });
    }

    // Search Files within Units
    (u.files || []).forEach(f => {
      if (f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)) {
        matches.push({
          type: f.category,
          title: f.name,
          subtitle: `${u.code} &bull; ${f.sizeFormatted || f.ext.toUpperCase()}`,
          action: () => {
            trackFileOpen({ ...f, unitName: u.name, unitCode: u.code, unitId: u.id });
            closeSearchModal();
            window.open(f.url, '_blank');
          }
        });
      }
    });
  });

  // Search Study Topics
  Object.keys(STUDY_NOTES).forEach(key => {
    const topic = STUDY_NOTES[key];
    if (topic.title.toLowerCase().includes(q) || topic.domain.toLowerCase().includes(q)) {
      matches.push({
        type: 'Formula / Note',
        title: topic.title,
        subtitle: `Study Reader &bull; ${topic.domain}`,
        action: () => { closeSearchModal(); window.location.hash = `reader-${key}`; selectReaderTopic(key); }
      });
    }
  });

  // Display top 15 results
  const topMatches = matches.slice(0, 15);
  if (topMatches.length === 0) {
    resultsContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        No results found for "${query}".
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = topMatches.map((m, idx) => `
    <div class="search-result-item" id="search-res-${idx}">
      <div class="search-result-left">
        <span class="nav-badge">${m.type}</span>
        <div>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${m.title}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${m.subtitle}</div>
        </div>
      </div>
      <span style="font-size: 12px; color: var(--accent-cyan); font-weight: 600;">Open &rarr;</span>
    </div>
  `).join('');

  // Attach click events
  topMatches.forEach((m, idx) => {
    const el = document.getElementById(`search-res-${idx}`);
    if (el) el.addEventListener('click', m.action);
  });
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */

function showToast(message, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: var(--accent-cyan); font-size: 16px;">⚡</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ==========================================================================
   DYNAMIC UNIT MANAGEMENT & FILE UPLOAD ENGINE
   ========================================================================== */

let newUnitSelectedFiles = [];
let existingUnitSelectedFiles = [];

function getCalculatedNextUnitCode() {
  let maxNum = 600;
  state.catalog.forEach(u => {
    if (u.code && u.code.startsWith('EE-')) {
      const n = parseInt(u.code.replace('EE-', ''), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  return `EE-${maxNum + 1}`;
}

function openCreateUnitModal() {
  const modal = document.getElementById('create-unit-modal-overlay');
  if (!modal) return;

  const codeInput = document.getElementById('new-unit-code');
  if (codeInput) codeInput.value = getCalculatedNextUnitCode();

  const nameInput = document.getElementById('new-unit-name');
  if (nameInput) nameInput.value = '';

  const folderInput = document.getElementById('new-unit-folder');
  if (folderInput) folderInput.value = '';

  const descInput = document.getElementById('new-unit-desc');
  if (descInput) descInput.value = '';

  const customDomainGroup = document.getElementById('custom-domain-group');
  if (customDomainGroup) customDomainGroup.style.display = 'none';

  const domainSelect = document.getElementById('new-unit-domain');
  if (domainSelect) domainSelect.value = 'Power Systems';

  newUnitSelectedFiles = [];
  renderNewUnitSelectedFiles();

  modal.classList.add('active');
  if (nameInput) nameInput.focus();
}

function closeCreateUnitModal() {
  const modal = document.getElementById('create-unit-modal-overlay');
  if (modal) modal.classList.remove('active');
}

function autoSuggestCodeAndFolder() {
  const name = (document.getElementById('new-unit-name')?.value || '').trim();
  const folderInput = document.getElementById('new-unit-folder');
  if (folderInput) {
    folderInput.value = name;
  }

  // Suggest domain based on name
  const domainSelect = document.getElementById('new-unit-domain');
  if (domainSelect && name) {
    const lower = name.toLowerCase();
    if (lower.includes('power') || lower.includes('high voltage') || lower.includes('transmission')) {
      domainSelect.value = 'Power Systems';
    } else if (lower.includes('circuit') || lower.includes('principle') || lower.includes('analysis')) {
      domainSelect.value = 'Circuit Theory';
    } else if (lower.includes('machine') || lower.includes('motor') || lower.includes('drive') || lower.includes('generator')) {
      domainSelect.value = 'Machines & Drives';
    } else if (lower.includes('solar') || lower.includes('wind') || lower.includes('renewable')) {
      domainSelect.value = 'Renewable Energy';
    } else if (lower.includes('electronic') || lower.includes('control') || lower.includes('instrument') || lower.includes('sensor')) {
      domainSelect.value = 'Electronics & Control';
    } else if (lower.includes('install') || lower.includes('wiring') || lower.includes('cctv')) {
      domainSelect.value = 'Installation';
    } else if (lower.includes('math') || lower.includes('calculus')) {
      domainSelect.value = 'Mathematics';
    } else if (lower.includes('draw') || lower.includes('workshop')) {
      domainSelect.value = 'Applied Engineering';
    } else if (lower.includes('comput') || lower.includes('micro') || lower.includes('digital') || lower.includes('program')) {
      domainSelect.value = 'Computing';
    } else if (lower.includes('project') || lower.includes('manage')) {
      domainSelect.value = 'Management';
    } else if (lower.includes('ethic') || lower.includes('entrepreneur')) {
      domainSelect.value = 'Professional Skills';
    }
  }
}

function handleDomainSelectChange() {
  const domainSelect = document.getElementById('new-unit-domain');
  const customGroup = document.getElementById('custom-domain-group');
  if (!domainSelect || !customGroup) return;

  if (domainSelect.value === '__custom__') {
    customGroup.style.display = 'block';
    document.getElementById('new-unit-custom-domain')?.focus();
  } else {
    customGroup.style.display = 'none';
  }
}

function handleUnitFilesSelected(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    newUnitSelectedFiles.push(files[i]);
  }
  renderNewUnitSelectedFiles();
}

function removeNewUnitFile(index) {
  newUnitSelectedFiles.splice(index, 1);
  renderNewUnitSelectedFiles();
}

function renderNewUnitSelectedFiles() {
  const container = document.getElementById('new-unit-selected-files-list');
  if (!container) return;

  if (newUnitSelectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = newUnitSelectedFiles.map((file, idx) => `
    <div class="file-pill">
      <span>📄 ${file.name} (${Math.round(file.size / 1024)} KB)</span>
      <button type="button" onclick="removeNewUnitFile(${idx})" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 14px; font-weight: 700;">✕</button>
    </div>
  `).join('');
}

async function handleCreateUnitSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('new-unit-name')?.value.trim();
  if (!name) {
    showToast('Please enter a unit name.');
    return;
  }

  const code = document.getElementById('new-unit-code')?.value.trim() || getCalculatedNextUnitCode();
  let domain = document.getElementById('new-unit-domain')?.value;
  if (domain === '__custom__') {
    domain = document.getElementById('new-unit-custom-domain')?.value.trim() || 'General Engineering';
  }
  const folder = document.getElementById('new-unit-folder')?.value.trim() || name;
  const description = document.getElementById('new-unit-desc')?.value.trim() || `Course resources and examination materials for ${name}.`;

  const submitBtn = document.getElementById('btn-submit-create-unit');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Creating Unit & Indexing...';

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('code', code);
    formData.append('domain', domain);
    formData.append('folder', folder);
    formData.append('description', description);

    newUnitSelectedFiles.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/units', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success && result.unit) {
      closeCreateUnitModal();
      showToast(`Unit "${result.unit.name}" created successfully!`);
      
      // Reload full catalog and navigate to the newly created unit
      await loadCatalogData();
      openUnitDetail(result.unit.id);
    } else {
      showToast(result.error || 'Failed to create unit.');
    }
  } catch (err) {
    console.error('Error creating unit:', err);
    showToast('Network error while creating unit.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Uploading files to existing unit
function openUploadFilesModal(unitId) {
  const targetId = unitId || state.activeUnitId;
  state.uploadTargetUnitId = targetId;

  const unit = state.catalog.find(u => u.id === targetId);
  if (!unit) return;

  const titleEl = document.getElementById('upload-modal-unit-name');
  if (titleEl) {
    titleEl.textContent = `Adding resources to ${unit.name} (${unit.code})`;
  }

  existingUnitSelectedFiles = [];
  renderExistingSelectedFiles();

  const modal = document.getElementById('upload-files-modal-overlay');
  if (modal) modal.classList.add('active');
}

function closeUploadFilesModal() {
  const modal = document.getElementById('upload-files-modal-overlay');
  if (modal) modal.classList.remove('active');
}

function handleExistingFilesSelected(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    existingUnitSelectedFiles.push(files[i]);
  }
  renderExistingSelectedFiles();
}

function removeExistingFile(index) {
  existingUnitSelectedFiles.splice(index, 1);
  renderExistingSelectedFiles();
}

function renderExistingSelectedFiles() {
  const container = document.getElementById('upload-existing-selected-list');
  if (!container) return;

  if (existingUnitSelectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = existingUnitSelectedFiles.map((file, idx) => `
    <div class="file-pill">
      <span>📄 ${file.name} (${Math.round(file.size / 1024)} KB)</span>
      <button type="button" onclick="removeExistingFile(${idx})" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 14px; font-weight: 700;">✕</button>
    </div>
  `).join('');
}

async function handleUploadFilesSubmit(event) {
  event.preventDefault();
  if (existingUnitSelectedFiles.length === 0) {
    showToast('Please select at least one document to upload.');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-upload-files');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Uploading & indexing...';

  try {
    const formData = new FormData();
    existingUnitSelectedFiles.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`/api/units/${state.uploadTargetUnitId}/files`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      closeUploadFilesModal();
      showToast(`${result.filesUploaded} document(s) added and indexed!`);
      
      // Refresh catalog from server
      await loadCatalogData();
      if (state.activeUnitId === state.uploadTargetUnitId) {
        openUnitDetail(state.activeUnitId);
      }
    } else {
      showToast(result.error || 'Failed to upload files.');
    }
  } catch (err) {
    console.error('Error uploading files:', err);
    showToast('Network error while uploading files.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function deleteCustomUnit(unitId, unitName) {
  if (!confirm(`Are you sure you want to unregister "${unitName}" from the curriculum catalog? Files on disk will be preserved.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      showToast(`Unit "${unitName}" removed.`);
      await loadCatalogData();
      window.location.hash = 'units';
      switchView('units');
    } else {
      showToast(result.error || 'Could not delete unit.');
    }
  } catch (err) {
    console.error('Error deleting unit:', err);
    showToast('Error removing unit.');
  }
}

// Setup drag and drop for both dropzones
document.addEventListener('DOMContentLoaded', () => {
  ['new-unit-dropzone', 'upload-existing-dropzone'].forEach(id => {
    const dropzone = document.getElementById(id);
    if (!dropzone) return;

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        if (id === 'new-unit-dropzone') {
          handleUnitFilesSelected(e.dataTransfer.files);
        } else {
          handleExistingFilesSelected(e.dataTransfer.files);
        }
      }
    });
  });
});
