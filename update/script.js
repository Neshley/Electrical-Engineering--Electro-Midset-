const currentVersion = '1.1.0'; // App current version
const updateUrl = 'https://yourserver.com/version.json';

const checkButton = document.getElementById('checkUpdate');
if (checkButton) {
  checkButton.addEventListener('click', checkForUpdate);
}

function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function checkForUpdate() {
  const statusEl = document.getElementById('updateStatus');
  if (!statusEl) return;
  statusEl.innerHTML = '<p>Checking for updates...</p>';

  fetch(updateUrl)
    .then(response => response.json())
    .then(data => {
      const latestVersion = data.latestVersion;
      const updateLink = data.updateLink || data.updateUrl || '#';

      if (compareVersions(latestVersion, currentVersion) > 0) {
        statusEl.innerHTML = `
          <p class="update-available">Update available: ${latestVersion}</p>
          <a href="${updateLink}" target="_blank">Click here to update</a>`;
      } else {
        statusEl.innerHTML = `
          <p class="up-to-date">🎉 You are up to date 🎉</p>
          <p>Current Version: ${currentVersion}</p>`;
      }
    })
    .catch(() => {
      // In local or offline mode, show current status
      statusEl.innerHTML = `
        <p class="up-to-date">🎉 You are up to date 🎉</p>
        <p>Current Version: ${currentVersion}</p>`;
    });
}
