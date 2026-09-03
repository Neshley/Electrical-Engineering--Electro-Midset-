import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base Unit definitions mapping
const BASE_UNITS_META = [
  { id: 'powerlines', name: 'Electrical Powerlines & Transmission', folder: 'Electrical Powerlines', icon: 'zap', domain: 'Power Systems', code: 'EE-601', description: 'Overhead transmission lines, mechanical design, sag & tension, corona losses, tower structures, and POE exams.' },
  { id: 'principles', name: 'Electrical Principles & Circuit Theory', folder: 'Electrical principles', icon: 'activity', domain: 'Circuit Theory', code: 'EE-602', description: 'Fundamental laws of electricity, DC/AC circuit calculations, earthing systems, and lightning protection.' },
  { id: 'installation', name: 'Electrical Installation & Safety', folder: 'ELECTRICAL  (....+)/ELECTRICAL INSTALLATION', icon: 'shield-check', domain: 'Installation', code: 'EE-603', description: 'IEE wiring regulations, cable sizing, cable color identification, fire safety, and final circuit distribution.' },
  { id: 'machines', name: 'Electrical Machines & Industrial Drives', folder: 'ELECTRICAL  (....+)/ELECTRICAL MACHINE INSTALLATION', icon: 'cpu', domain: 'Machines & Drives', code: 'EE-604', description: 'Three-phase motors, synchronous machines, star-delta starters, forward-reverse control, and industrial drives.' },
  { id: 'automate', name: 'Automate an Electrical Machine', folder: 'Automate an Electrical Machine', icon: 'sliders', domain: 'Machines & Drives', code: 'EE-605', description: 'Machine automation, theory, practical assessments, control systems, and automated machine examination guides.' },
  { id: 'generation', name: 'Power Generation & Grid Stations', folder: 'Power Generation', icon: 'power', domain: 'Power Systems', code: 'EE-606', description: 'AC power generation, 11kV generating stations, primary/secondary transmission, and distribution sub-stations.' },
  { id: 'solar', name: 'Solar PV Systems & Installation', folder: 'Install solar systems', icon: 'sun', domain: 'Renewable Energy', code: 'EE-607', description: 'Solar PV technology fundamentals, PV array sizing, charge controllers, inverters, and battery storage.' },
  { id: 'electronics', name: 'Electronics & Semiconductor Devices', folder: 'Electronics', icon: 'radio', domain: 'Electronics', code: 'EE-608', description: 'Electronic components, semiconductor physics, rectification, signal conditioning, and examination questions.' },
  { id: 'maths', name: 'Engineering Mathematics', folder: 'Engineering Mathematics', icon: 'hash', domain: 'Mathematics', code: 'EE-609', description: 'Algebra, logarithms, laws of indices, binomial expansion, trigonometry, and CAT 1 worked solutions.' },
  { id: 'drawing', name: 'Technical Drawing & Schematics', folder: 'Technical Drawing', icon: 'edit-3', domain: 'Applied Engineering', code: 'EE-610', description: 'Engineering drawing principles, electrical symbols, wiring schematics, CAD layouts, and blueprint reading.' },
  { id: 'workshop', name: 'Workshop Technology & Practice', folder: 'Workshop tachnology', icon: 'tool', domain: 'Applied Engineering', code: 'EE-611', description: 'Level 5/6 workshop skills, fabrication, safety guidelines, fitting, machine tools, and continuous assessments.' },
  { id: 'security', name: 'Security Systems (CCTV & Alarms)', folder: 'Install Security Systems', icon: 'video', domain: 'Installation', code: 'EE-612', description: 'CCTV surveillance installation, intruder alarm systems, wiring techniques, and system testing.' },
  { id: 'digital', name: 'Digital Literacy & Computing', folder: 'Digital literacy', icon: 'monitor', domain: 'Computing', code: 'EE-613', description: 'Computer hardware, OS, spreadsheets, database management, digital tools, and cybersecurity basics.' },
  { id: 'maintenance', name: 'Maintain Electrical Equipment', folder: 'ELECTRICAL  (....+)/MAINTAIN ELECTRICAL EQUIPMENT AND MACHINES', icon: 'wrench', domain: 'Maintenance', code: 'EE-614', description: 'Preventive maintenance, troubleshooting electrical machines, fault diagnosis, and maintenance log guides.' },
  { id: 'projects', name: 'Manage Electrical Projects', folder: 'manage electrical projects', icon: 'clipboard', domain: 'Management', code: 'EE-615', description: 'Project management principles, project planning, work breakdown structure, cost estimation, and delivery.' },
  { id: 'ethics', name: 'Work Ethics & Professional Practice', folder: 'work ethics', icon: 'award', domain: 'Professional Skills', code: 'EE-616', description: 'CBET professional standards, workplace conduct, electrical safety ethics, and occupational health.' },
  { id: 'entrepreneurship', name: 'Entrepreneurship Education', folder: 'ENTREPRENEURSHIP', icon: 'briefcase', domain: 'Professional Skills', code: 'EE-617', description: 'Business planning, technical enterprise setup, electrical contracting startup, and financial planning.' }
];

const CUSTOM_UNITS_FILE = path.join(__dirname, 'custom-units.json');

// Helper to load persistent custom units
function loadCustomUnits() {
  try {
    if (fs.existsSync(CUSTOM_UNITS_FILE)) {
      const data = fs.readFileSync(CUSTOM_UNITS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading custom units:', err.message);
  }
  return [];
}

// Helper to save persistent custom units
function saveCustomUnits(units) {
  try {
    fs.writeFileSync(CUSTOM_UNITS_FILE, JSON.stringify(units, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving custom units:', err.message);
  }
}

// Multer storage for uploading files directly into unit folders
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const targetFolder = req.targetUnitFolder || 'Unit Notes';
    const fullTarget = path.join(__dirname, 'Unit Notes', targetFolder);
    if (!fs.existsSync(fullTarget)) {
      fs.mkdirSync(fullTarget, { recursive: true });
    }
    cb(null, fullTarget);
  },
  filename: function (req, file, cb) {
    // Preserve original filename, decoding any encoded chars
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = original.replace(/[<>:"/\\|?*]/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
});

function getFileType(filename) {
  return path.extname(filename).toLowerCase().replace('.', '');
}

function getCategory(filename, folderPath) {
  const lower = (filename + ' ' + folderPath).toLowerCase();
  if (lower.includes('exam') || lower.includes('cat') || lower.includes('question') || lower.includes('assessment') || lower.includes('answer') || lower.includes('assignment') || lower.includes('poe')) {
    return 'Exams & CATs';
  }
  if (lower.includes('practical') || lower.includes('lab') || lower.includes('guide') || lower.includes('exercise')) {
    return 'Practical Guides';
  }
  if (lower.includes('ebook') || lower.includes('bird') || lower.includes('manual') || lower.includes('pack')) {
    return 'Reference Books';
  }
  if (['jpg', 'jpeg', 'png'].includes(getFileType(filename))) {
    return 'Diagrams & Images';
  }
  return 'Lecture Notes';
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function scanFolder(relativeFolder) {
  const fullPath = path.join(__dirname, 'Unit Notes', relativeFolder);
  let files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          walk(itemPath);
        } else {
          const ext = getFileType(item);
          // Omit executable setup files from direct documents view
          if (ext === 'exe' || ext === 'winmd' || ext === 'lnk') continue;

          const relPath = path.relative(__dirname, itemPath).replace(/\\/g, '/');
          files.push({
            name: item.replace(/\.[^/.]+$/, ''),
            rawName: item,
            path: relPath,
            url: '/' + relPath.split('/').map(segment => encodeURIComponent(segment)).join('/'),
            ext,
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            category: getCategory(item, dir)
          });
        }
      }
    } catch (err) {
      console.error(`Error scanning ${dir}:`, err.message);
    }
  }

  walk(fullPath);
  return files;
}

// Build the complete catalog with automatic folder discovery
let cachedCatalog = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 3000; // Fast 3-second cache or manual invalidation

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function guessDomain(name) {
  const lower = name.toLowerCase();
  if (lower.includes('power') || lower.includes('trans') || lower.includes('substation') || lower.includes('high voltage')) return 'Power Systems';
  if (lower.includes('circuit') || lower.includes('principle') || lower.includes('law') || lower.includes('ohm')) return 'Circuit Theory';
  if (lower.includes('machine') || lower.includes('motor') || lower.includes('drive') || lower.includes('generator') || lower.includes('automate')) return 'Machines & Drives';
  if (lower.includes('install') || lower.includes('wiring') || lower.includes('cctv') || lower.includes('security')) return 'Installation';
  if (lower.includes('solar') || lower.includes('wind') || lower.includes('renewable') || lower.includes('pv')) return 'Renewable Energy';
  if (lower.includes('electronic') || lower.includes('instrument') || lower.includes('sensor') || lower.includes('telecom') || lower.includes('control')) return 'Electronics & Control';
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra')) return 'Mathematics';
  if (lower.includes('draw') || lower.includes('cad') || lower.includes('workshop') || lower.includes('fabricat')) return 'Applied Engineering';
  if (lower.includes('comput') || lower.includes('program') || lower.includes('digital') || lower.includes('micro')) return 'Computing';
  if (lower.includes('project') || lower.includes('manage')) return 'Management';
  if (lower.includes('ethic') || lower.includes('safety') || lower.includes('entrepreneur')) return 'Professional Skills';
  return 'General Engineering';
}

function getNextUnitCode(existingUnits) {
  let maxNum = 600;
  existingUnits.forEach(u => {
    if (u.code && u.code.startsWith('EE-')) {
      const num = parseInt(u.code.replace('EE-', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return `EE-${maxNum + 1}`;
}

// Discover all units from BASE_UNITS, custom-units.json, AND any unmapped folders in "Unit Notes"
function getAllUnitsList() {
  const customUnits = loadCustomUnits();
  const knownUnits = [...BASE_UNITS_META, ...customUnits];
  const knownFolders = new Set(knownUnits.map(u => u.folder.toLowerCase().replace(/\\/g, '/')));

  // Inspect the Unit Notes directory for any newly dropped folders
  const unitNotesDir = path.join(__dirname, 'Unit Notes');
  const autoDiscovered = [];

  if (fs.existsSync(unitNotesDir)) {
    try {
      const topLevelEntries = fs.readdirSync(unitNotesDir);
      for (const entry of topLevelEntries) {
        const entryPath = path.join(unitNotesDir, entry);
        if (!fs.statSync(entryPath).isDirectory()) continue;

        const normalizedEntry = entry.toLowerCase().replace(/\\/g, '/');
        
        // Check if this folder is directly known
        const isDirectlyKnown = knownFolders.has(normalizedEntry);
        
        // Check if any known unit is a subfolder inside this folder
        const hasKnownSubfolder = Array.from(knownFolders).some(kf => kf.startsWith(normalizedEntry + '/'));

        if (!isDirectlyKnown && !hasKnownSubfolder) {
          // New standalone folder dropped into Unit Notes!
          const name = toTitleCase(entry.replace(/[-_]/g, ' '));
          const code = getNextUnitCode([...knownUnits, ...autoDiscovered]);
          const domain = guessDomain(entry);
          autoDiscovered.push({
            id: slugify(entry) || `unit-${Date.now()}`,
            name,
            folder: entry,
            icon: 'book-open',
            domain,
            code,
            description: `Study resources, lecture notes, and engineering materials for ${name}.`,
            isAutoDiscovered: true
          });
        } else if (hasKnownSubfolder) {
          // Check if there are any other subdirectories inside that are not mapped
          const subEntries = fs.readdirSync(entryPath);
          for (const sub of subEntries) {
            const subPath = path.join(entryPath, sub);
            if (!fs.statSync(subPath).isDirectory()) continue;
            const subFolderRel = (entry + '/' + sub).toLowerCase().replace(/\\/g, '/');
            if (!knownFolders.has(subFolderRel)) {
              const name = toTitleCase(sub.replace(/[-_]/g, ' '));
              const code = getNextUnitCode([...knownUnits, ...autoDiscovered]);
              const domain = guessDomain(sub);
              autoDiscovered.push({
                id: slugify(sub) || `unit-${Date.now()}`,
                name,
                folder: entry + '/' + sub,
                icon: 'book-open',
                domain,
                code,
                description: `Study resources, lecture notes, and engineering materials for ${name}.`,
                isAutoDiscovered: true
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error auto-discovering folders:', err.message);
    }
  }

  return [...knownUnits, ...autoDiscovered];
}

function getCatalog(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCatalog && (now - lastScanTime < CACHE_TTL_MS)) {
    return cachedCatalog;
  }

  const allUnits = getAllUnitsList();
  const catalog = allUnits.map(unit => {
    const files = scanFolder(unit.folder);
    const categoryCounts = {};
    files.forEach(f => {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    });

    return {
      ...unit,
      fileCount: files.length,
      categoryCounts,
      files
    };
  });

  cachedCatalog = catalog;
  lastScanTime = now;
  return catalog;
}

function clearCatalogCache() {
  cachedCatalog = null;
  lastScanTime = 0;
}

// Normalize Windows-style backslashes in request URLs
app.use((req, res, next) => {
  if (req.url.includes('\\') || req.url.includes('%5C') || req.url.includes('%5c')) {
    req.url = req.url.replace(/\\|%5c|%5C/g, '/');
  }
  next();
});

// API endpoint for units catalog
app.get('/api/catalog', (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const catalog = getCatalog(force);
    res.json({
      success: true,
      units: catalog,
      totalUnits: catalog.length,
      totalFiles: catalog.reduce((acc, u) => acc + u.fileCount, 0),
      domains: [...new Set(catalog.map(u => u.domain))]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint for stats overview
app.get('/api/stats', (req, res) => {
  const catalog = getCatalog();
  const totalFiles = catalog.reduce((acc, u) => acc + u.fileCount, 0);
  const totalExams = catalog.reduce((acc, u) => acc + (u.categoryCounts['Exams & CATs'] || 0), 0);
  const totalPracticals = catalog.reduce((acc, u) => acc + (u.categoryCounts['Practical Guides'] || 0), 0);

  res.json({
    unitsCount: catalog.length,
    filesCount: totalFiles,
    examsCount: totalExams,
    practicalsCount: totalPracticals,
    toolsCount: 4
  });
});

// API: Create a new unit with optional initial file uploads
app.post('/api/units', (req, res) => {
  // Use temporary upload handler that dynamically places files in target unit folder
  let targetFolder = '';
  
  const uploadHandler = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'Unit Notes', targetFolder || 'temp');
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: function (req, file, cb) {
        const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const safeName = original.replace(/[<>:"/\\|?*]/g, '_');
        cb(null, safeName);
      }
    }),
    limits: { fileSize: 100 * 1024 * 1024 }
  }).array('files', 20);

  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      const name = (req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ success: false, error: 'Unit name is required.' });
      }

      const existingUnits = getAllUnitsList();
      const code = (req.body.code || '').trim() || getNextUnitCode(existingUnits);
      const domain = (req.body.domain || '').trim() || guessDomain(name);
      const description = (req.body.description || '').trim() || `Study notes, CATs, and learning resources for ${name}.`;
      
      // Clean safe folder name
      const safeFolder = (req.body.folder || name).trim().replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ');
      const id = slugify(name) || `unit-${Date.now()}`;

      // Ensure directory exists in Unit Notes
      const targetDir = path.join(__dirname, 'Unit Notes', safeFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // If files were uploaded to a temp directory or targetFolder was set
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const newPath = path.join(targetDir, file.filename);
          if (file.path !== newPath) {
            fs.renameSync(file.path, newPath);
          }
        });
      }

      // Save to custom units JSON
      const customUnits = loadCustomUnits();
      // Remove any existing duplicate id
      const filtered = customUnits.filter(u => u.id !== id && u.folder.toLowerCase() !== safeFolder.toLowerCase());
      
      const newUnit = {
        id,
        name,
        folder: safeFolder,
        icon: 'book-open',
        domain,
        code,
        description,
        isCustom: true,
        createdAt: new Date().toISOString()
      };

      filtered.push(newUnit);
      saveCustomUnits(filtered);
      clearCatalogCache();

      const freshCatalog = getCatalog(true);
      const createdWithFiles = freshCatalog.find(u => u.id === id) || newUnit;

      res.status(201).json({
        success: true,
        unit: createdWithFiles,
        message: `Unit "${name}" successfully registered!`
      });
    } catch (createErr) {
      console.error('Error creating unit:', createErr);
      res.status(500).json({ success: false, error: createErr.message });
    }
  });
});

// API: Upload files into an existing unit folder
app.post('/api/units/:unitId/files', (req, res) => {
  const { unitId } = req.params;
  const allUnits = getAllUnitsList();
  const unit = allUnits.find(u => u.id === unitId);

  if (!unit) {
    return res.status(404).json({ success: false, error: `Unit '${unitId}' not found.` });
  }

  const targetDir = path.join(__dirname, 'Unit Notes', unit.folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const unitUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, targetDir);
      },
      filename: function (req, file, cb) {
        const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const safeName = original.replace(/[<>:"/\\|?*]/g, '_');
        cb(null, safeName);
      }
    }),
    limits: { fileSize: 100 * 1024 * 1024 }
  }).array('files', 20);

  unitUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    clearCatalogCache();
    const freshCatalog = getCatalog(true);
    const updatedUnit = freshCatalog.find(u => u.id === unitId);

    res.json({
      success: true,
      filesUploaded: req.files ? req.files.length : 0,
      unit: updatedUnit,
      message: `${req.files ? req.files.length : 0} file(s) added successfully to ${unit.name}!`
    });
  });
});

// API: Delete a custom unit (keeps files on disk for safety, but unregisters from catalog)
app.delete('/api/units/:unitId', (req, res) => {
  const { unitId } = req.params;
  const customUnits = loadCustomUnits();
  const filtered = customUnits.filter(u => u.id !== unitId);

  if (filtered.length === customUnits.length) {
    return res.status(404).json({ success: false, error: 'Custom unit not found or is a core curriculum unit.' });
  }

  saveCustomUnits(filtered);
  clearCatalogCache();

  res.json({
    success: true,
    message: `Unit removed from custom units catalog.`
  });
});

// Serve static assets from the project directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  index: 'index.html',
  dotfiles: 'ignore'
}));

// Route handler for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Client app SPA fallbacks
app.get(['/dashboard', '/units', '/reader', '/workbench', '/exams', '/saved', '/info', '/outline', '/calculator'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server on host 0.0.0.0 and port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Electro-Mindset server running on http://0.0.0.0:${PORT}`);
});
