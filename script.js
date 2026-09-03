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
  notes: localStorage.getItem('em_notes') || '',
  catalog: [],
  filteredFiles: [],
  readerTopic: 'powerlines',
  workbenchTab: 'ohms',
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
  if (viewName === 'saved') {
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
  renderUnitsGrid();

  try {
    const response = await fetch('/api/catalog');
    if (response.ok) {
      const data = await response.json();
      if (data.units && data.units.length > 0) {
        state.catalog = data.units;
        renderDashboardUnits();
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
  
  const elFiles = document.getElementById('stat-total-files');
  if (elFiles) elFiles.textContent = totalFiles;
  
  const elUnits = document.getElementById('stat-total-units');
  if (elUnits) elUnits.textContent = totalUnits;
}

/* ==========================================================================
   VIEW: DASHBOARD
   ========================================================================== */

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
          <a href="${file.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1;">
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

  // Resistor band setup
  renderResistorControls();
  calculateResistor();

  // Cable sizing table
  renderCableTable();

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

/* --- Tool 1: Ohm's Law Solver --- */
function highlightActiveOhmInputs() {
  const v = document.getElementById('ohm-v').value;
  const i = document.getElementById('ohm-i').value;
  const r = document.getElementById('ohm-r').value;
  const p = document.getElementById('ohm-p').value;

  const filledCount = [v, i, r, p].filter(val => val !== '').length;
  const solveBtn = document.getElementById('ohm-solve-btn');
  if (solveBtn) {
    solveBtn.disabled = filledCount < 2;
    solveBtn.textContent = filledCount >= 2 ? 'Solve Ohm\'s Law' : 'Enter Any 2 Values';
  }
}

function solveOhmsLaw() {
  let v = parseFloat(document.getElementById('ohm-v').value);
  let i = parseFloat(document.getElementById('ohm-i').value);
  let r = parseFloat(document.getElementById('ohm-r').value);
  let p = parseFloat(document.getElementById('ohm-p').value);

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
  document.getElementById('ohm-v').value = Number(v.toFixed(4));
  document.getElementById('ohm-i').value = Number(i.toFixed(4));
  document.getElementById('ohm-r').value = Number(r.toFixed(4));
  document.getElementById('ohm-p').value = Number(p.toFixed(4));

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
  document.getElementById('band-4-toggle').classList.toggle('active', count === 4);
  document.getElementById('band-5-toggle').classList.toggle('active', count === 5);
  
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

  if (!band1Select) return;

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
  const b1 = parseInt(document.getElementById('select-band-1').value);
  const b2 = parseInt(document.getElementById('select-band-2').value);
  const b3 = parseInt(document.getElementById('select-band-3').value);
  const mult = parseFloat(document.getElementById('select-mult').value);
  const tol = parseFloat(document.getElementById('select-tol').value);

  // Update visual resistor stripes
  const color1 = RESISTOR_COLORS.find(c => c.digit === b1);
  const color2 = RESISTOR_COLORS.find(c => c.digit === b2);
  const color3 = RESISTOR_COLORS.find(c => c.digit === b3);
  const colorMult = RESISTOR_COLORS.find(c => c.mult === mult);
  const colorTol = RESISTOR_COLORS.find(c => c.tol === tol);

  if (color1) document.getElementById('res-visual-band1').style.backgroundColor = color1.hex;
  if (color2) document.getElementById('res-visual-band2').style.backgroundColor = color2.hex;
  if (color3 && state.resistorBands === 5) document.getElementById('res-visual-band3').style.backgroundColor = color3.hex;
  if (colorMult) document.getElementById('res-visual-mult').style.backgroundColor = colorMult.hex;
  if (colorTol) document.getElementById('res-visual-tol').style.backgroundColor = colorTol.hex;

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
  const tolEl = document.getElementById('res-tolerance-readout');
  const rangeEl = document.getElementById('res-range-readout');

  if (displayEl) displayEl.textContent = formatMetric(baseValue, 'Ω');
  if (tolEl) tolEl.textContent = `±${tol}%`;
  if (rangeEl) rangeEl.textContent = `${formatMetric(minVal, 'Ω')} to ${formatMetric(maxVal, 'Ω')}`;
}

/* --- Tool 3: AC Power Factor Calculator --- */
function calculatePowerFactor() {
  const v = parseFloat(document.getElementById('pf-v').value) || 230;
  const i = parseFloat(document.getElementById('pf-i').value) || 10;
  const pf = parseFloat(document.getElementById('pf-val').value) || 0.8;

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

  document.getElementById('pf-res-p').textContent = `${p.toFixed(2)} kW`;
  document.getElementById('pf-res-s').textContent = `${s.toFixed(2)} kVA`;
  document.getElementById('pf-res-q').textContent = `${q.toFixed(2)} kVAR`;
  document.getElementById('pf-res-angle').textContent = `${angleDeg.toFixed(1)}°`;
  document.getElementById('pf-res-correction').textContent = `${requiredKvar.toFixed(2)} kVAR`;

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
        <a href="${exam.url}" target="_blank" rel="noopener" class="btn btn-sm btn-amber" style="flex: 1;">
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
            <a href="${file.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1;">
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
          action: () => { closeSearchModal(); window.open(f.url, '_blank'); }
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
