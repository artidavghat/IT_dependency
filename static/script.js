/**
 * IT DEPENDENCY MAPPER — Interactive 3D & Dynamic Animations Script
 * Features:
 * 1. Real-time 3D Mouse Parallax Tilt for Cards & Nodes
 * 2. Draggable & Movable 3D Dependency Nodes
 * 3. Fade-In / Fade-Out for Flash Alerts, Search Rows & Live Updates
 * 4. Real-time API Service Status Checks with Smooth Counter Transitions
 */

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
  const flowContainer = document.querySelector('.flow');

  // ==========================================
  // 1. AUTO FADE-OUT FOR FLASH MESSAGES
  // ==========================================
  const flashMessages = document.querySelectorAll('.flash');
  flashMessages.forEach(flash => {
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'background:none; border:none; color:inherit; font-size:18px; cursor:pointer; margin-left:14px; opacity:0.8; line-height:1;';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.addEventListener('click', () => fadeOutAndRemove(flash));
    flash.appendChild(closeBtn);

    // Auto-dismiss after 6 seconds with smooth fade-out
    setTimeout(() => {
      if (document.body.contains(flash)) {
        fadeOutAndRemove(flash);
      }
    }, 6000);
  });

  function fadeOutAndRemove(el) {
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease, margin 0.4s ease, padding 0.4s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px) scale(0.96)';
    setTimeout(() => {
      el.style.maxHeight = '0';
      el.style.margin = '0';
      el.style.padding = '0';
      setTimeout(() => el.remove(), 400);
    }, 200);
  }

  // ==========================================
  // 2. 3D CARD TILT ON MOUSEMOVE
  // ==========================================
  const tiltElements = document.querySelectorAll('.stat, .panel, .node');

  tiltElements.forEach(elem => {
    // Skip tilt while dragging a movable node
    elem.addEventListener('mousemove', (e) => {
      if (elem.classList.contains('is-dragging')) return;
      const rect = elem.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within element
      const y = e.clientY - rect.top;  // y position within element
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (limit between -8 and 8 degrees)
      const maxTilt = elem.classList.contains('stat') ? 10 : (elem.classList.contains('node') ? 12 : 5);
      const rotX = (((y - centerY) / centerY) * -maxTilt).toFixed(2);
      const rotY = (((x - centerX) / centerX) * maxTilt).toFixed(2);

      const zDepth = elem.classList.contains('node') ? 18 : 12;
      elem.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${zDepth}px)`;
    });

    elem.addEventListener('mouseleave', () => {
      if (elem.classList.contains('is-dragging')) return;
      elem.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
      elem.style.transform = '';
      setTimeout(() => {
        elem.style.transition = '';
      }, 450);
    });
  });

  // ==========================================
  // 3. MOVABLE & DRAGGABLE 3D DEPENDENCY NODES
  // ==========================================
  if (flowContainer && nodes.length > 0) {
    // Add helpful 3D hint & Reset button if not present
    let movableBar = document.querySelector('.movable-bar');
    if (!movableBar) {
      movableBar = document.createElement('div');
      movableBar.className = 'movable-bar';
      movableBar.innerHTML = `
        <span>✨ <strong>3D Movable:</strong> Drag any node to rearrange your architecture map</span>
        <button type="button" id="resetNodesBtn">↺ Reset Positions</button>
      `;
      flowContainer.parentNode.insertBefore(movableBar, flowContainer.nextSibling);

      const resetBtn = document.getElementById('resetNodesBtn');
      resetBtn.addEventListener('click', () => {
        nodes.forEach(n => {
          n.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.5s ease, top 0.5s ease';
          n.style.position = '';
          n.style.left = '';
          n.style.top = '';
          n.style.transform = '';
          n.classList.remove('has-moved');
          setTimeout(() => { n.style.transition = ''; }, 500);
        });
      });
    }

    nodes.forEach(node => {
      let isDragging = false;
      let startX, startY;
      let initialLeft = 0;
      let initialTop = 0;

      node.addEventListener('mousedown', (e) => {
        // Only trigger on primary mouse button
        if (e.button !== 0) return;
        isDragging = true;
        node.classList.add('is-dragging');

        // Capture starting pointer position
        startX = e.clientX;
        startY = e.clientY;

        // Get computed position or offset
        const computedStyle = window.getComputedStyle(node);
        const matrix = new DOMMatrixReadOnly(computedStyle.transform);
        initialLeft = parseFloat(node.style.left) || 0;
        initialTop = parseFloat(node.style.top) || 0;

        document.body.style.userSelect = 'none';

        function onMouseMove(moveEvent) {
          if (!isDragging) return;
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          // If not positioned relatively yet, make it relative
          if (node.style.position !== 'relative') {
            node.style.position = 'relative';
          }

          node.style.left = `${initialLeft + deltaX}px`;
          node.style.top = `${initialTop + deltaY}px`;
          node.classList.add('has-moved');
        }

        function onMouseUp() {
          if (!isDragging) return;
          isDragging = false;
          node.classList.remove('is-dragging');
          document.body.style.userSelect = '';

          // Add gentle drop settle animation
          node.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease';
          node.style.transform = 'perspective(1000px) translateY(0) translateZ(0)';
          setTimeout(() => {
            node.style.transition = '';
            node.style.transform = '';
          }, 300);

          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  // ==========================================
  // 4. NODE SELECTION & INSPECTION DETAILS
  // ==========================================
  nodes.forEach(node => {
    node.addEventListener('click', (e) => {
      // Don't deselect if just finished dragging
      nodes.forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');

      const name = node.dataset.service;
      const host = node.dataset.host;
      const port = node.dataset.port;
      const depends = node.dataset.depends;
      const status = node.dataset.status;

      if (dependencyInfo) {
        // Smooth fade out and fade in content change
        dependencyInfo.style.opacity = '0';
        dependencyInfo.style.transform = 'translateY(4px)';
        dependencyInfo.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

        setTimeout(() => {
          dependencyInfo.innerHTML = `
            <span>🌐 <strong>${escapeHtml(name)}</strong> (<code style="font-size:12px;">${escapeHtml(host)}:${escapeHtml(port)}</code>)</span>
            <span>&bull;</span>
            <span>Depends on: <em>${escapeHtml(depends || 'None')}</em></span>
            <span>&bull;</span>
            <span>Status: <span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span></span>
          `;
          dependencyInfo.style.opacity = '1';
          dependencyInfo.style.transform = 'translateY(0)';
        }, 150);
      }
    });
  });

  // ==========================================
  // 5. SMOOTH SEARCH FILTERING WITH FADE IN/OUT
  // ==========================================
  if (serviceSearch && serviceTable) {
    serviceSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows = serviceTable.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const text = row.dataset.search || row.textContent.toLowerCase();
        const matches = text.includes(q);

        if (matches) {
          row.style.display = '';
          row.style.opacity = '0';
          row.style.transform = 'scale(0.98)';
          row.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          requestAnimationFrame(() => {
            row.style.opacity = '1';
            row.style.transform = 'scale(1)';
          });
        } else {
          row.style.opacity = '0';
          row.style.transform = 'scale(0.96)';
          row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          setTimeout(() => {
            if (!text.includes(serviceSearch.value.toLowerCase().trim())) {
              row.style.display = 'none';
            }
          }, 200);
        }
      });
    });
  }

  // ==========================================
  // 6. CHECK ALL SERVICES VIA API WITH 3D TELEMETRY
  // ==========================================
  if (checkAllBtn) {
    checkAllBtn.addEventListener('click', async () => {
      const originalText = checkAllBtn.innerHTML;
      checkAllBtn.disabled = true;
      checkAllBtn.innerHTML = '↻ Pinging Endpoints...';
      checkAllBtn.style.animation = 'pulseGlow 1.2s infinite alternate';

      try {
        const res = await fetch('/api/status', { method: 'POST' });
        if (!res.ok) throw new Error('API check failed: ' + res.statusText);
        const data = await res.json();

        // Update statistics counters with smooth number fade transition
        updateCounterWithFade(onlineEl, data.online ?? 0);
        updateCounterWithFade(offlineEl, data.offline ?? 0);
        updateCounterWithFade(historyEl, data.history_count ?? 0);

        if (lastCheckEl) {
          lastCheckEl.style.opacity = '0';
          setTimeout(() => {
            lastCheckEl.textContent = data.checked_at ?? 'Just now';
            lastCheckEl.style.transition = 'opacity 0.3s ease';
            lastCheckEl.style.opacity = '1';
          }, 150);
        }

        // Update table rows and node status with live animations
        if (Array.isArray(data.services)) {
          data.services.forEach(svc => {
            // Update table row
            const row = document.querySelector(`tr[data-id="${svc.id}"]`);
            if (row) {
              row.style.animation = 'freshPulse 1.2s ease-out';
              setTimeout(() => { row.style.animation = ''; }, 1200);

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
        checkAllBtn.style.animation = '';
      }
    });
  }

  function updateCounterWithFade(el, val) {
    if (!el) return;
    el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
    setTimeout(() => {
      el.textContent = val;
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    }, 200);
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
