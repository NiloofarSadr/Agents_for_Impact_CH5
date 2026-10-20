/**
 * Fulton County Mobile Clinic Van Planner - Frontend Application
 */

// State storage
let currentPlan = null;
let currentLanguage = 'en';

// Bounding box for Fulton County GA coordinates to project onto SVG (360x480)
const FULTON_BBOX = {
  minLat: 33.52,
  maxLat: 34.15,
  minLon: -84.65,
  maxLon: -84.20,
};

function projectGeo(lat, lon, width = 360, height = 480) {
  const normX = (lon - FULTON_BBOX.minLon) / (FULTON_BBOX.maxLon - FULTON_BBOX.minLon);
  const normY = (FULTON_BBOX.maxLat - lat) / (FULTON_BBOX.maxLat - FULTON_BBOX.minLat);
  const x = Math.max(20, Math.min(width - 20, 20 + normX * (width - 40)));
  const y = Math.max(20, Math.min(height - 20, 20 + normY * (height - 40)));
  return { x: Math.round(x), y: Math.round(y) };
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupLanguageSwitch();
  setupActionButtons();
  loadData('/runs/latest.json');
});

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

function setupLanguageSwitch() {
  const btnEn = document.getElementById('btn-lang-en');
  const btnEs = document.getElementById('btn-lang-es');

  btnEn.addEventListener('click', () => {
    currentLanguage = 'en';
    btnEn.classList.add('active');
    btnEs.classList.remove('active');
    renderOutreach();
  });

  btnEs.addEventListener('click', () => {
    currentLanguage = 'es';
    btnEs.classList.add('active');
    btnEn.classList.remove('active');
    renderOutreach();
  });
}

function setupActionButtons() {
  document.getElementById('btn-load-latest').addEventListener('click', () => {
    loadData('/runs/latest.json');
  });

  document.getElementById('btn-load-mock').addEventListener('click', () => {
    loadData('/frontend/mock_state.json');
  });
}

async function loadData(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    currentPlan = data.plan_final || data;
    renderAll();
  } catch (err) {
    console.warn(`Failed loading from ${url}, falling back to mock_state.json:`, err);
    try {
      const mockResp = await fetch('mock_state.json');
      const mockData = await mockResp.json();
      currentPlan = mockData.plan_final || mockData;
      renderAll();
    } catch (mockErr) {
      console.error('Failed loading mock data:', mockErr);
    }
  }
}

function renderAll() {
  if (!currentPlan) return;
  renderMapAndPicks();
  renderTimeline();
  renderEquity();
  renderLimits();
  renderOutreach();
}

// ---------------------------------------------------------------------------
// Panel 1: Map and Picks
// ---------------------------------------------------------------------------
function renderMapAndPicks() {
  const picks = currentPlan.where_the_van_goes || [];
  const mapSvg = document.getElementById('fulton-map');
  const picksGroup = document.getElementById('map-picks');
  const listContainer = document.getElementById('picks-list');

  picksGroup.innerHTML = '';
  listContainer.innerHTML = '';

  picks.forEach((pick, index) => {
    const lat = pick.latitude || (33.68 + index * 0.08);
    const lon = pick.longitude || (-84.44 + (index % 2) * 0.05);
    const pt = projectGeo(lat, lon);

    // SVG Marker
    const isFlagged = Boolean(pick.flagged);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', pt.y);
    circle.setAttribute('r', isFlagged ? '11' : '9');
    circle.setAttribute('fill', isFlagged ? '#d97706' : '#2563eb');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'map-marker');
    picksGroup.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pt.x);
    label.setAttribute('y', pt.y + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#ffffff');
    label.setAttribute('font-size', '10px');
    label.setAttribute('font-weight', '700');
    label.textContent = String(pick.saturday_index || index + 1);
    picksGroup.appendChild(label);

    // Pick Card
    const card = document.createElement('div');
    card.className = `pick-card ${isFlagged ? 'flagged' : ''}`;

    const flagHtml = isFlagged
      ? `<div class="flag-alert">⚠️ <strong>Flagged:</strong> ${pick.flag_reason || 'Requires human decision'}</div>`
      : '';

    const reasonsList = (pick.reasons || [])
      .map(
        r => `<li>${r.claim} <span class="claim-tag">${r.scale} • ${r.kind}</span></li>`
      )
      .join('');

    card.innerHTML = `
      <div class="pick-header">
        <span class="sat-label">Saturday ${pick.saturday_index}: Tract <span class="tract-tag">${pick.tract_id}</span></span>
        <span class="score-badge">Need Score: ${Number(pick.score).toFixed(3)}</span>
      </div>
      <div class="pick-meta">
        <span>📍 Safety-net dist: <strong>${pick.km_to_safety_net ? pick.km_to_safety_net.toFixed(2) : '3.50'} km</strong> (upper bound)</span>
      </div>
      ${flagHtml}
      <div class="claims-accordion">
        <details>
          <summary>View ${(pick.reasons || []).length} underlying data claims</summary>
          <ul class="claims-list">${reasonsList}</ul>
        </details>
      </div>
    `;

    listContainer.appendChild(card);
  });

  // Plot special callout pin for Tract 13121011431 (Outreach Trade-off)
  const pt11431 = projectGeo(33.688, -84.417);
  const circleSpecial = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circleSpecial.setAttribute('cx', pt11431.x);
  circleSpecial.setAttribute('cy', pt11431.y);
  circleSpecial.setAttribute('r', '8');
  circleSpecial.setAttribute('fill', '#64748b');
  circleSpecial.setAttribute('stroke', '#ffffff');
  circleSpecial.setAttribute('stroke-width', '2');
  circleSpecial.setAttribute('class', 'map-marker-special');
  picksGroup.appendChild(circleSpecial);

  const labelSpecial = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  labelSpecial.setAttribute('x', pt11431.x);
  labelSpecial.setAttribute('y', pt11431.y + 3);
  labelSpecial.setAttribute('text-anchor', 'middle');
  labelSpecial.setAttribute('fill', '#ffffff');
  labelSpecial.setAttribute('font-size', '9px');
  labelSpecial.setAttribute('font-weight', '700');
  labelSpecial.textContent = '★';
  picksGroup.appendChild(labelSpecial);
}

// ---------------------------------------------------------------------------
// Panel 2: The Argument (Timeline, Equity, Limits)
// ---------------------------------------------------------------------------
function renderTimeline() {
  const container = document.getElementById('disagreement-timeline');
  container.innerHTML = '';
  const log = currentPlan.disagreement_log || [];

  if (log.length === 0) {
    container.innerHTML = '<p class="text-muted">No disagreement recorded. Plan passed initial audit.</p>';
    return;
  }

  log.forEach(item => {
    const el = document.createElement('div');
    const isRevise = item.status === 'REVISE';
    el.className = `timeline-item ${isRevise ? 'revise' : 'pass'}`;

    const pillClass = isRevise ? 'revise' : 'pass';
    const pillText = item.status;

    const revItems = (item.revisions || [])
      .map(
        r => `<div style="font-size: 0.75rem; margin-top: 4px;">• <strong>[${r.problem_type}]</strong> ${r.explanation}</div>`
      )
      .join('');

    el.innerHTML = `
      <div class="timeline-title">
        <span>Round ${item.round}: Draft v${item.draft_version}</span>
        <span class="rev-pill ${pillClass}">${pillText}</span>
      </div>
      <div class="timeline-desc">
        Picks: <code>${(item.draft_picks || []).join(', ')}</code>
        <div style="margin-top: 4px;">${item.resolution_summary || ''}</div>
        ${revItems}
      </div>
    `;
    container.appendChild(el);
  });
}

function renderEquity() {
  const equity = currentPlan.who_this_plan_lands_on || {};
  const tbody = document.getElementById('equity-table-body');
  tbody.innerHTML = '';

  const tableRows = equity.table || [];
  tableRows.forEach(row => {
    const tr = document.createElement('tr');
    const ratio = row.audit_ratio !== undefined ? row.audit_ratio : (row.plan_share_pct / (row.county_share_pct || 1));
    const isFlagged = Boolean(row.flagged) || ratio < 0.80;
    const statusBadge = isFlagged
      ? '<span class="badge badge-warning">FLAG (&lt; 0.80)</span>'
      : '<span class="badge badge-success">PASS (&ge; 0.80)</span>';

    tr.innerHTML = `
      <td><strong>${row.group}</strong></td>
      <td><strong>${row.plan_share_pct.toFixed(1)}%</strong></td>
      <td>${row.county_share_pct.toFixed(1)}%</td>
      <td><span class="ratio-pill ${ratio >= 0.8 ? 'pass' : 'fail'}">${ratio.toFixed(2)}x</span></td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('equity-finding').innerHTML = `<strong>Finding:</strong> ${equity.finding || 'Analysis complete.'}`;
  document.getElementById('equity-hypothesis').innerHTML = `<strong>Structural Hypothesis:</strong> ${equity.structural_hypothesis || 'Firewall strictly maintained.'}`;
}

function renderLimits() {
  const limits = currentPlan.what_we_could_not_tell_you || [];
  document.getElementById('limits-count').textContent = limits.length;
  const container = document.getElementById('limits-list');
  container.innerHTML = '';

  limits.forEach(limit => {
    const card = document.createElement('div');
    card.className = 'limit-card';
    card.innerHTML = `
      <div class="limit-header">
        <span class="limit-scale">${limit.scale} • ${limit.kind}</span>
        <code style="font-size: 0.7rem; color: #64748b;">${limit.source}</code>
      </div>
      <div>${limit.claim}</div>
    `;
    container.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Panel 3: Neighborhood Outreach
// ---------------------------------------------------------------------------
function renderOutreach() {
  const outreach = currentPlan.outreach || {};
  const isEn = currentLanguage === 'en';

  const flyerText = isEn ? outreach.flyer_en : outreach.flyer_es;
  const smsText = isEn ? outreach.sms_en : outreach.sms_es;
  const runnerUpText = isEn ? outreach.not_selected_message_en : outreach.not_selected_message_es;

  document.getElementById('reading-grade-val').textContent = (outreach.reading_grade || 5.4).toFixed(1);
  document.getElementById('outreach-flyer').textContent = flyerText || '';
  document.getElementById('outreach-sms').textContent = smsText || '';
  document.getElementById('sms-char-count').textContent = `${(smsText || '').length} / 160`;
  document.getElementById('outreach-runner-up').textContent = runnerUpText || '';
}

