// ============================================================
// index.js
// Fetches institutions from Firestore
// Renders cards — NO filter sidebar
// Search by text + quick tags only
// Sort + Grid/List view toggle
// ============================================================

// ── GLOBAL STATE ──────────────────────────────────────────
let allInstitutions   = [];
let filteredList      = [];
let currentUser       = null;
let activeQuickFilter = '';

// ── DOM REFERENCES ────────────────────────────────────────
const cardsGrid       = document.getElementById('cardsGrid');
const resultsCount    = document.getElementById('resultsCount');
const mainSearchInput = document.getElementById('mainSearchInput');
const loadingOverlay  = document.getElementById('loadingOverlay');
const toast           = document.getElementById('toast');
const toastMsg        = document.getElementById('toastMsg');

// ══════════════════════════════════════════════════════════
// 1. AUTH STATE
// ══════════════════════════════════════════════════════════
auth.onAuthStateChanged((user) => {
  currentUser = user;

  if (user) {
    document.getElementById('navUserName').style.display  = 'inline';
    document.getElementById('navUserName').textContent    =
      user.displayName || user.email;
    document.getElementById('btnSignOut').style.display   = 'inline-flex';
    document.getElementById('btnSignIn').style.display    = 'none';
  } else {
    document.getElementById('navUserName').style.display  = 'none';
    document.getElementById('btnSignOut').style.display   = 'none';
    document.getElementById('btnSignIn').style.display    = 'inline-block';
  }
});

document.getElementById('btnSignOut').addEventListener('click', () => {
  auth.signOut().then(() => showToast('Signed out successfully'));
});

// ══════════════════════════════════════════════════════════
// 2. FETCH ALL INSTITUTIONS FROM FIRESTORE
// ══════════════════════════════════════════════════════════
async function fetchInstitutions() {
  try {
    const snapshot = await db
      .collection('institutions')
      .orderBy('name')
      .get();

    allInstitutions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    filteredList = [...allInstitutions];

    // Hide loading overlay
    loadingOverlay.style.display = 'none';

    renderCards(filteredList);

  } catch (err) {
    console.error('Firestore error:', err);
    loadingOverlay.style.display = 'none';
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load institutions</h3>
        <p>Please check your connection and refresh the page.</p>
      </div>`;
  }
}

// ══════════════════════════════════════════════════════════
// 3. RENDER CARDS
// ══════════════════════════════════════════════════════════
function renderCards(list) {
  // Update count display
  resultsCount.innerHTML =
    `<span>${list.length}</span> institution${list.length !== 1 ? 's' : ''} found`;

  if (list.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No institutions found</h3>
        <p>Try different search terms or clear the search.</p>
      </div>`;
    return;
  }

  cardsGrid.innerHTML = list.map(inst => buildCard(inst)).join('');
}

// ── BUILD ONE CARD ─────────────────────────────────────────
function buildCard(inst) {
  // Logo
  const logoHtml = inst.logoUrl
    ? `<img src="${inst.logoUrl}" alt="${escapeHtml(inst.name)} logo"/>`
    : `<div class="card-logo-placeholder">${getInitials(inst.name)}</div>`;

  // Type icon
  const typeIcon =
    (inst.type === 'college' || inst.type === 'university')
      ? 'fa-university' : 'fa-school';

  // Board / college type label
  const boardLabel = inst.board || inst.collegeType || capitalise(inst.type || 'School');

  // Starting fee display
  const startingFee = inst.startingFee
    ? `₹${Number(inst.startingFee).toLocaleString('en-IN')}`
    : 'Contact Institution';

  // Address
  const address = [inst.area, inst.city, inst.state]
    .filter(Boolean).join(', ');

  // Rating
  const rating = Number(inst.rating) || 0;

  return `
    <div class="inst-card" id="card-${inst.id}">

      <!-- Top Banner -->
      <div class="card-top">
        <div class="card-logo-wrap">${logoHtml}</div>
        <div class="card-type-badge">
          <i class="fa-solid ${typeIcon}"></i>
          ${capitalise(inst.type || 'School')}
        </div>
      </div>

      <!-- Body -->
      <div class="card-body">

        <div class="card-name">${escapeHtml(inst.name || 'Unnamed Institution')}</div>

        <div class="card-location">
          <i class="fa-solid fa-location-dot"
             style="color:var(--primary);"></i>
          ${escapeHtml(address || 'Address not available')}
        </div>

        <div>
          <span class="card-board-tag">${escapeHtml(boardLabel)}</span>
        </div>

        <div class="card-fee-row">
          <span class="card-fee-label">Annual Fees</span>
          <span class="card-fee-amount">${startingFee}</span>
          ${inst.startingFee ? `<span class="card-fee-year">/yr</span>` : ''}
        </div>

        <div class="card-meta-row">
          ${inst.totalStudents ? `
            <span>
              <i class="fa-solid fa-user-group"
                 style="color:var(--primary);"></i>
              ${Number(inst.totalStudents).toLocaleString('en-IN')}
            </span>` : ''}
          ${inst.establishedYear ? `
            <span>
              <i class="fa-regular fa-calendar"
                 style="color:var(--primary);"></i>
              Est. ${inst.establishedYear}
            </span>` : ''}
        </div>

        <!-- Rating Stars -->
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="stars">${buildStars(rating)}</div>
          <span class="rating-num">
            ${rating > 0 ? rating.toFixed(1) : 'N/A'}
          </span>
        </div>

        <!-- Contact -->
        <div class="card-contact-row">
          ${inst.phone ? `
            <span>
              <i class="fa-solid fa-phone"
                 style="color:var(--primary);"></i>
              ${escapeHtml(inst.phone)}
            </span>` : ''}
          ${inst.email ? `
            <span>
              <i class="fa-solid fa-envelope"
                 style="color:var(--primary);"></i>
              ${escapeHtml(inst.email)}
            </span>` : ''}
        </div>

      </div>

      <!-- Footer -->
      <div class="card-footer">
        <button class="btn-view-details"
                onclick="goToDetails('${inst.id}')">
          View Details
        </button>
      </div>

    </div>`;
}

// ══════════════════════════════════════════════════════════
// 4. SEARCH
// ══════════════════════════════════════════════════════════

// Live search on every keystroke
mainSearchInput.addEventListener('input', () => {
  // Clear quick tag when user types
  activeQuickFilter = '';
  document.querySelectorAll('.quick-tag')
    .forEach(t => t.classList.remove('active'));
  applySearch();
});

// Search button click
function triggerSearch() {
  activeQuickFilter = '';
  document.querySelectorAll('.quick-tag')
    .forEach(t => t.classList.remove('active'));
  applySearch();
  // Scroll to results
  document.querySelector('.main-content')
    .scrollIntoView({ behavior: 'smooth' });
}

// Quick tag click
function quickFilter(value) {
  if (activeQuickFilter === value) {
    // Toggle off
    activeQuickFilter = '';
    document.querySelectorAll('.quick-tag')
      .forEach(t => t.classList.remove('active'));
  } else {
    activeQuickFilter = value;
    document.querySelectorAll('.quick-tag').forEach(t => {
      t.classList.toggle('active', t.textContent.trim() === value);
    });
  }
  // Clear text search when tag selected
  mainSearchInput.value = '';
  applySearch();
}

// ── CORE SEARCH LOGIC ─────────────────────────────────────
function applySearch() {
  const query = mainSearchInput.value.trim().toLowerCase();

  filteredList = allInstitutions.filter(inst => {

    // Text search
    if (query) {
      const searchable = [
        inst.name,
        inst.city,
        inst.area,
        inst.state,
        inst.board,
        inst.collegeType,
        inst.type,
        inst.address,
        ...(inst.courses || [])
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchable.includes(query)) return false;
    }

    // Quick tag filter
    if (activeQuickFilter) {
      const searchable = [
        inst.board,
        inst.collegeType,
        inst.type,
        ...(inst.courses || [])
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchable.includes(activeQuickFilter.toLowerCase())) return false;
    }

    return true;
  });

  applySorting();
}

// ══════════════════════════════════════════════════════════
// 5. SORTING
// ══════════════════════════════════════════════════════════
function applySorting() {
  const sortVal = document.getElementById('sortSelect').value;
  let sorted = [...filteredList];

  switch (sortVal) {
    case 'fee-low':
      sorted.sort((a, b) => (a.startingFee || 0) - (b.startingFee || 0));
      break;
    case 'fee-high':
      sorted.sort((a, b) => (b.startingFee || 0) - (a.startingFee || 0));
      break;
    case 'name-az':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  renderCards(sorted);
}

// ══════════════════════════════════════════════════════════
// 6. VIEW TOGGLE (Grid / List)
// ══════════════════════════════════════════════════════════
function setView(mode) {
  if (mode === 'grid') {
    cardsGrid.classList.remove('list-view');
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
  } else {
    cardsGrid.classList.add('list-view');
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
  }
}

// ══════════════════════════════════════════════════════════
// 7. NAVIGATE TO DETAILS
// ══════════════════════════════════════════════════════════
function goToDetails(institutionId) {
  window.location.href = `details.html?id=${institutionId}`;
}

// ══════════════════════════════════════════════════════════
// 8. HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════
function buildStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${rating >= i ? 'filled' : ''}">★</span>`;
  }
  return html;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'success') {
  toastMsg.textContent = message;
  toast.style.background =
    type === 'warning' ? '#e67e22' : 'var(--primary)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════
fetchInstitutions();