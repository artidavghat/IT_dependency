document.addEventListener('DOMContentLoaded', () => {
  const checkAllBtn = document.getElementById('checkAllBtn');
  const serviceSearch = document.getElementById('serviceSearch');
  const serviceTable = document.getElementById('serviceTable');
  const dependencyInfo = document.getElementById('dependencyInfo');
  const nodes = document.querySelectorAll('.node');
  const onlineEl = document.getElementById('onlineServices');
  const offlineEl = document.getElementById('offlineServices');
  const historyEl = document.getElementById('historyCount');
  const lastCheckEl = document.getElementById('lastCheck');
  const alertList = document.getElementById('alertList');

  // Node selection & inspection
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      nodes.forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');

      const name = node.dataset.service;
      const host = node.dataset.host;
      const port = node.dataset.port;
      const depends = node.dataset.depends;
      const status = node.dataset.status;

      if (dependencyInfo) {
        dependencyInfo.innerHTML = `<strong>${escapeHtml(name)}</strong> (${escapeHtml(host)}:${escapeHtml(port)}) &bull; ` +
          `Depends on: <em>${escapeHtml(depends || 'None')}</em> &bull; ` +
          `Status: <span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span>`;
      }
    });
  });

  // Real-time table search filter
  if (serviceSearch && serviceTable) {
    serviceSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows = serviceTable.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const text = row.dataset.search || row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Check all services via API
  if (checkAllBtn) {
    checkAllBtn.addEventListener('click', async () => {
      const originalText = checkAllBtn.innerHTML;
      checkAllBtn.disabled = true;
      checkAllBtn.innerHTML = '↻ Checking Services...';

      try {
        const res = await fetch('/api/status', { method: 'POST' });
        if (!res.ok) throw new Error('API check failed: ' + res.statusText);
        const data = await res.json();

        // Update statistics counters
        if (onlineEl) onlineEl.textContent = data.online ?? 0;
        if (offlineEl) offlineEl.textContent = data.offline ?? 0;
        if (historyEl) historyEl.textContent = data.history_count ?? 0;
        if (lastCheckEl) lastCheckEl.textContent = data.checked_at ?? 'Just now';

        // Update table rows and node status
        if (Array.isArray(data.services)) {
          data.services.forEach(svc => {
            // Update table
            const row = document.querySelector(`tr[data-id="${svc.id}"]`);
            if (row) {
              const statusTd = row.querySelector('.row-status');
              const respTd = row.querySelector('.row-response');
              if (statusTd) {
                statusTd.innerHTML = `<span class="badge ${badgeClass(svc.status)}">${escapeHtml(svc.status)}</span>`;
              }
              if (respTd) {
                respTd.textContent = svc.response_ms !== null && svc.response_ms !== undefined ? `${svc.response_ms} ms` : '—';
              }
            }

            // Update dependency map node
            const node = Array.from(nodes).find(n => n.dataset.service === svc.name);
            if (node) {
              node.dataset.status = svc.status;
              const badge = node.querySelector('.badge');
              if (badge) {
                badge.className = `badge ${badgeClass(svc.status)}`;
                badge.textContent = svc.status;
              }
            }
          });

          // Update alerts section if any service went offline
          const offlineServices = data.services.filter(s => s.status === 'Offline');
          if (offlineServices.length > 0 && alertList) {
            const emptyNotice = alertList.querySelector('.empty');
            if (emptyNotice) emptyNotice.remove();

            offlineServices.forEach(s => {
              const alertDiv = document.createElement('div');
              alertDiv.className = 'alert';
              alertDiv.innerHTML = `<i></i><div><b>${escapeHtml(s.name)} unreachable</b><p>${escapeHtml(s.details)}</p><small>${escapeHtml(s.checked_at)}</small></div>`;
              alertList.prepend(alertDiv);
            });
          }
        }
      } catch (err) {
        console.error('Failed to check services:', err);
        alert('Could not complete status check. Ensure the server is running.');
      } finally {
        checkAllBtn.disabled = false;
        checkAllBtn.innerHTML = originalText;
      }
    });
  }

  function badgeClass(status) {
    if (!status) return 'not-checked';
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }
});
