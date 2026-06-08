// ============================================================
// details.js
// Loads and displays complete institution profile
// Reads institution ID from URL: details.html?id=XXXX
// Fetches: institutions/{id} and feeStructures/{id}
// ============================================================

// ── DOM REFERENCES ────────────────────────────────────────
const loadingOverlay  = document.getElementById('loadingOverlay');
const detailsContent  = document.getElementById('detailsContent');
const toast           = document.getElementById('toast');
const toastMsg        = document.getElementById('toastMsg');

// ── GET INSTITUTION ID FROM URL ───────────────────────────
const urlParams       = new URLSearchParams(window.location.search);
const institutionId   = urlParams.get('id');

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('navUserName').style.display = 'inline';
    document.getElementById('navUserName').textContent =
      user.displayName || user.email;
    document.getElementById('btnSignOut').style.display = 'inline-block';
    document.getElementById('btnSignIn').style.display  = 'none';
  } else {
    document.getElementById('navUserName').style.display = 'none';
    document.getElementById('btnSignOut').style.display  = 'none';
    document.getElementById('btnSignIn').style.display   = 'inline-block';
  }
});

document.getElementById('btnSignOut').addEventListener('click', () => {
  auth.signOut();
});

// ══════════════════════════════════════════════════════════
// FETCH INSTITUTION + FEE DATA
// ══════════════════════════════════════════════════════════
async function loadInstitutionDetails() {
  // Validate ID exists
  if (!institutionId) {
    showError('No institution ID found in URL.');
    return;
  }

  try {
    // Fetch institution document
    const instDoc = await db
      .collection('institutions')
      .doc(institutionId)
      .get();

    if (!instDoc.exists) {
      showError('Institution not found.');
      return;
    }

    const inst = { id: instDoc.id, ...instDoc.data() };

    // Fetch fee structure document (same ID as institution)
    const feeDoc = await db
      .collection('feeStructures')
      .doc(institutionId)
      .get();

    const feeData = feeDoc.exists ? feeDoc.data() : null;

    // Update page title
    document.title = `${inst.name} – EduFees`;

    // Hide loading
    loadingOverlay.style.display = 'none';

    // Render all sections
    renderDetailsPage(inst, feeData);

  } catch (err) {
    console.error('Error loading institution details:', err);
    showError('Failed to load institution. Please try again.');
  }
}

// ══════════════════════════════════════════════════════════
// RENDER COMPLETE DETAILS PAGE
// ══════════════════════════════════════════════════════════
function renderDetailsPage(inst, feeData) {
  detailsContent.innerHTML = `
    ${buildHeroBanner(inst)}
    ${buildSection1(inst)}
    ${buildSection2(inst)}
    ${buildSection3(inst)}
    ${buildSection4(inst, feeData)}
  `;
}

// ── SECTION 0: HERO BANNER ────────────────────────────────
function buildHeroBanner(inst) {
  const address = [inst.area, inst.city, inst.state]
    .filter(Boolean).join(', ');

  const logoHtml = inst.logoUrl
    ? `<img src="${inst.logoUrl}" alt="${inst.name} logo"/>`
    : `<div class="details-logo-placeholder">${getInitials(inst.name)}</div>`;

  const typeIcon = (inst.type === 'college' || inst.type === 'university')
    ? 'fa-university' : 'fa-school';

  const rating = inst.rating || 0;

  return `
    <div class="details-hero">
      <div class="details-logo">${logoHtml}</div>

      <div class="details-hero-info">
        <h1>${inst.name || 'Institution Name'}</h1>

        <div class="details-reg-id">
          <i class="fa-solid fa-id-card"></i>
          Registration ID: ${inst.registrationId || inst.id}
        </div>

        <div class="details-hero-meta">
          <div class="details-meta-item">
            <i class="fa-solid ${typeIcon}"></i>
            ${capitalise(inst.type || 'School')}
          </div>

          ${address ? `
            <div class="details-meta-item">
              <i class="fa-solid fa-location-dot"></i>
              ${address}
            </div>` : ''}

          ${inst.phone ? `
            <div class="details-meta-item">
              <i class="fa-solid fa-phone"></i>
              ${inst.phone}
            </div>` : ''}

          ${inst.email ? `
            <div class="details-meta-item">
              <i class="fa-solid fa-envelope"></i>
              ${inst.email}
            </div>` : ''}

          ${rating > 0 ? `
            <div class="details-meta-item">
              <span style="color:var(--star-gold);">
                ${buildStars(rating)}
              </span>
              <span style="margin-left:4px;">${rating.toFixed(1)}</span>
            </div>` : ''}
        </div>
      </div>
    </div>`;
}

// ── SECTION 1: INSTITUTION INFORMATION ───────────────────
function buildSection1(inst) {
  const address = [inst.address, inst.area, inst.city, inst.state]
    .filter(Boolean).join(', ');

  return `
    <div class="section-card">
      <div class="section-title">
        <div class="title-icon">
          <i class="fa-solid fa-building-columns"></i>
        </div>
        Institution Information
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Institution Name</span>
          <span class="info-value">${inst.name || '—'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Registration ID</span>
          <span class="info-value">${inst.registrationId || inst.id}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Type</span>
          <span class="info-value">${capitalise(inst.type || '—')}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Board / Affiliation</span>
          <span class="info-value">${inst.board || inst.collegeType || '—'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Address</span>
          <span class="info-value">${address || '—'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">City</span>
          <span class="info-value">${inst.city || '—'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">State</span>
          <span class="info-value">${inst.state || '—'}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Contact Number</span>
          <span class="info-value">
            <a href="tel:${inst.phone}" style="color:var(--primary);">
              ${inst.phone || '—'}
            </a>
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">
            <a href="mailto:${inst.email}" style="color:var(--primary);">
              ${inst.email || '—'}
            </a>
          </span>
        </div>

        ${inst.website ? `
          <div class="info-item">
            <span class="info-label">Website</span>
            <span class="info-value">
              <a href="${inst.website}" target="_blank" style="color:var(--primary);">
                ${inst.website}
              </a>
            </span>
          </div>` : ''}

        ${inst.totalStudents ? `
          <div class="info-item">
            <span class="info-label">Total Students</span>
            <span class="info-value">
              ${Number(inst.totalStudents).toLocaleString('en-IN')}
            </span>
          </div>` : ''}
      </div>
    </div>`;
}

// ── SECTION 2: ABOUT INSTITUTION ─────────────────────────
function buildSection2(inst) {
  return `
    <div class="section-card">
      <div class="section-title">
        <div class="title-icon">
          <i class="fa-solid fa-circle-info"></i>
        </div>
        About Institution
      </div>

      ${inst.description
        ? `<p class="about-text">${inst.description}</p>`
        : `<p class="about-text" style="color:var(--grey-text);font-style:italic;">
             No description provided.
           </p>`}

      <div class="info-grid" style="margin-bottom:20px;">
        ${inst.establishedYear ? `
          <div class="info-item">
            <span class="info-label">Established Year</span>
            <span class="info-value">${inst.establishedYear}</span>
          </div>` : ''}

        ${inst.principalName ? `
          <div class="info-item">
            <span class="info-label">Principal / Director</span>
            <span class="info-value">${inst.principalName}</span>
          </div>` : ''}
      </div>

      ${(inst.vision || inst.mission) ? `
        <div class="vision-mission-grid">
          ${inst.vision ? `
            <div class="vm-box">
              <h4><i class="fa-solid fa-eye"></i> Vision</h4>
              <p>${inst.vision}</p>
            </div>` : ''}

          ${inst.mission ? `
            <div class="vm-box">
              <h4><i class="fa-solid fa-bullseye"></i> Mission</h4>
              <p>${inst.mission}</p>
            </div>` : ''}
        </div>` : ''}
    </div>`;
}

// ── SECTION 3: FACILITIES ─────────────────────────────────
function buildSection3(inst) {
  const fac = inst.facilities || {};

  const facilityList = [
    { key: 'hostel',      label: 'Hostel',       icon: '🏠' },
    { key: 'transport',   label: 'Transport',     icon: '🚌' },
    { key: 'library',     label: 'Library',       icon: '📚' },
    { key: 'computerLab', label: 'Computer Lab',  icon: '💻' },
    { key: 'sports',      label: 'Sports',        icon: '⚽' },
    { key: 'cafeteria',   label: 'Cafeteria',     icon: '🍽️' },
    { key: 'wifi',        label: 'WiFi',          icon: '📶' },
    { key: 'science_lab', label: 'Science Lab',   icon: '🔬' },
    { key: 'auditorium',  label: 'Auditorium',    icon: '🎭' },
    { key: 'medical',     label: 'Medical Room',  icon: '🏥' },
  ];

  const facilitiesHtml = facilityList.map(f => {
    const isAvailable = fac[f.key] === true;
    return `
      <div class="facility-item ${isAvailable ? 'available' : ''}">
        <span class="fac-icon">${f.icon}</span>
        <span>${f.label}</span>
        <span class="fac-check">
          ${isAvailable
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-xmark"></i>'}
        </span>
      </div>`;
  }).join('');

  return `
    <div class="section-card">
      <div class="section-title">
        <div class="title-icon">
          <i class="fa-solid fa-star"></i>
        </div>
        Facilities
      </div>
      <div class="facilities-grid">
        ${facilitiesHtml}
      </div>
    </div>`;
}

// ── SECTION 4: FEE STRUCTURE ──────────────────────────────
function buildSection4(inst, feeData) {
  const type = (inst.type || 'school').toLowerCase();

  let tableHtml = '';

  if (!feeData || !feeData.fees || feeData.fees.length === 0) {
    tableHtml = `
      <div class="empty-state" style="padding:30px 0;">
        <div class="empty-icon">📋</div>
        <h3>Fee structure not available</h3>
        <p>Please contact the institution directly for fee details.</p>
      </div>`;
  } else if (type === 'school') {
    tableHtml = buildSchoolFeeTable(feeData.fees);
  } else {
    tableHtml = buildCollegeFeeTable(feeData.fees);
  }

  return `
    <div class="section-card">
      <div class="section-title">
        <div class="title-icon">
          <i class="fa-solid fa-indian-rupee-sign"></i>
        </div>
        Complete Fee Structure
      </div>
      <div class="fee-table-wrap">
        ${tableHtml}
      </div>
    </div>`;
}

// ── SCHOOL FEE TABLE ──────────────────────────────────────
function buildSchoolFeeTable(fees) {
  // Calculate grand totals
  let grandAdmission = 0, grandTuition = 0, grandExam = 0;
  let grandTransport = 0, grandHostel  = 0, grandOther = 0;

  const rows = fees.map(row => {
    const total = (
      (row.admissionFee  || 0) +
      (row.tuitionFee    || 0) +
      (row.examFee       || 0) +
      (row.transportFee  || 0) +
      (row.hostelFee     || 0) +
      (row.otherFee      || 0)
    );

    grandAdmission += (row.admissionFee  || 0);
    grandTuition   += (row.tuitionFee    || 0);
    grandExam      += (row.examFee       || 0);
    grandTransport += (row.transportFee  || 0);
    grandHostel    += (row.hostelFee     || 0);
    grandOther     += (row.otherFee      || 0);

    return `
      <tr>
        <td>${row.class || '—'}</td>
        <td>${formatFee(row.admissionFee)}</td>
        <td>${formatFee(row.tuitionFee)}</td>
        <td>${formatFee(row.examFee)}</td>
        <td>${formatFee(row.transportFee)}</td>
        <td>${formatFee(row.hostelFee)}</td>
        <td>${formatFee(row.otherFee)}</td>
        <td class="total-fee-cell">${formatFee(total)}</td>
      </tr>`;
  }).join('');

  const grandTotal = grandAdmission + grandTuition + grandExam +
                     grandTransport + grandHostel  + grandOther;

  return `
    <table class="fee-table">
      <thead>
        <tr>
          <th>Class</th>
          <th>Admission Fee</th>
          <th>Tuition Fee</th>
          <th>Exam Fee</th>
          <th>Transport Fee</th>
          <th>Hostel Fee</th>
          <th>Other Fee</th>
          <th>Total Fee</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td><strong>Overall Total</strong></td>
          <td>${formatFee(grandAdmission)}</td>
          <td>${formatFee(grandTuition)}</td>
          <td>${formatFee(grandExam)}</td>
          <td>${formatFee(grandTransport)}</td>
          <td>${formatFee(grandHostel)}</td>
          <td>${formatFee(grandOther)}</td>
          <td>${formatFee(grandTotal)}</td>
        </tr>
      </tfoot>
    </table>`;
}

// ── COLLEGE FEE TABLE ─────────────────────────────────────
function buildCollegeFeeTable(fees) {
  const rows = fees.map(row => {
    const total = (
      (row.admissionFee || 0) +
      (row.tuitionFee   || 0) +
      (row.examFee      || 0) +
      (row.hostelFee    || 0) +
      (row.otherFee     || 0)
    );

    return `
      <tr>
        <td>${row.branch || row.course || '—'}</td>
        <td>${formatFee(row.admissionFee)}</td>
        <td>${formatFee(row.tuitionFee)}</td>
        <td>${formatFee(row.examFee)}</td>
        <td>${formatFee(row.hostelFee)}</td>
        <td>${formatFee(row.otherFee)}</td>
        <td class="total-fee-cell">${formatFee(total)}</td>
      </tr>`;
  }).join('');

  return `
    <table class="fee-table">
      <thead>
        <tr>
          <th>Branch / Course</th>
          <th>Admission Fee</th>
          <th>Tuition Fee</th>
          <th>Exam Fee</th>
          <th>Hostel Fee</th>
          <th>Other Fee</th>
          <th>Total Fee</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════
function formatFee(amount) {
  if (!amount || amount === 0) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span style="color:${rating >= i ? 'var(--star-gold)' : '#ddd'};">★</span>`;
  }
  return html;
}

function showError(message) {
  loadingOverlay.style.display = 'none';
  detailsContent.innerHTML = `
    <div class="empty-state" style="padding:80px 20px;">
      <div class="empty-icon">⚠️</div>
      <h3>${message}</h3>
      <p style="margin-top:16px;">
        <button class="btn-view-details"
                style="width:auto;padding:10px 24px;"
                onclick="window.location.href='index.html'">
          Go Back to Search
        </button>
      </p>
    </div>`;
}

function showToast(message, type = 'success') {
  toastMsg.textContent = message;
  toast.style.background = type === 'warning' ? '#e67e22' : 'var(--primary)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════
loadInstitutionDetails();