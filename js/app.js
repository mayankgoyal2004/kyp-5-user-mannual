/* ==========================================================================
   KYP 5 Platform Documentation - Interactive Client Engine
   Theme Switcher,    Instant Search (Ctrl+K), ScrollSpy & Lightbox
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSearch();
  initSidebar();
  initTOCScrollSpy();
  initLightbox();
  initCopyCode();
});

/* --------------------------------------------------------------------------
   1. Theme Management (Default: Light Mode with LocalStorage Memory)
   -------------------------------------------------------------------------- */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('kyp5_doc_theme') || 'light';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('kyp5_doc_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'light' 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun"></i>';
    themeToggleBtn.setAttribute('title', `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`);
  }
}

/* --------------------------------------------------------------------------
   2. Instant Search Engine & Search Modal (Ctrl + K)
   -------------------------------------------------------------------------- */
let searchIndex = [];

function initSearch() {
  const searchModalOverlay = document.getElementById('searchModalOverlay');
  const searchTriggerBtn = document.getElementById('searchTriggerBtn');
  const searchInput = document.getElementById('searchInput');
  const searchResultsContainer = document.getElementById('searchResults');

  // Build client-side index from all doc sections
  const sections = document.querySelectorAll('.doc-section');
  sections.forEach(section => {
    const id = section.id;
    const titleEl = section.querySelector('h2');
    const title = titleEl ? titleEl.innerText.trim() : '';
    
    // Sub-items (h3, h4, steps)
    const subHeadings = Array.from(section.querySelectorAll('h3, h4')).map(h => h.innerText.trim());
    const textContent = Array.from(section.querySelectorAll('p, li, .step-content, td')).map(el => el.innerText).join(' ');

    if (id && title) {
      searchIndex.push({
        id: id,
        title: title,
        subHeadings: subHeadings.join(' • '),
        content: textContent
      });
    }
  });

  const openSearch = () => {
    if (searchModalOverlay) {
      searchModalOverlay.classList.add('active');
      if (searchInput) {
        searchInput.value = '';
        renderResults('');
        setTimeout(() => searchInput.focus(), 80);
      }
    }
  };

  const closeSearch = () => {
    if (searchModalOverlay) {
      searchModalOverlay.classList.remove('active');
    }
  };

  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', openSearch);
  }

  if (searchModalOverlay) {
    searchModalOverlay.addEventListener('click', (e) => {
      if (e.target === searchModalOverlay) closeSearch();
    });
  }

  // Keyboard shortcut Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeLightbox();
    }
  });

  // Real-time input typing handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderResults(e.target.value.trim());
    });
  }

  function renderResults(query) {
    if (!searchResultsContainer) return;

    if (!query) {
      searchResultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
          Type any keyword (e.g. <i>Psychometric, Scoring, Assessment Groups, Options, Versioning, PDF Report, Institutions, CMS, Anti-cheat</i>) to search...
        </div>
      `;
      return;
    }

    const q = query.toLowerCase();
    const matched = searchIndex.filter(item => {
      return item.title.toLowerCase().includes(q) ||
             item.subHeadings.toLowerCase().includes(q) ||
             item.content.toLowerCase().includes(q);
    });

    if (matched.length === 0) {
      searchResultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;">
          No documentation matching "<strong>${escapeHtml(query)}</strong>" was found. Try another search term.
        </div>
      `;
      return;
    }

    searchResultsContainer.innerHTML = matched.slice(0, 8).map(item => {
      const snippet = extractSnippet(item.content, q);
      return `
        <a href="#${item.id}" class="search-result-item" onclick="document.getElementById('searchModalOverlay').classList.remove('active')">
          <div class="search-result-title"><i class="fa-solid fa-arrow-right" style="font-size: 11px; margin-right: 6px;"></i> ${escapeHtml(item.title)}</div>
          ${item.subHeadings ? `<div style="font-size: 11.5px; color: var(--accent-primary); margin-bottom: 3px;">${escapeHtml(item.subHeadings.substring(0, 100))}...</div>` : ''}
          <div class="search-result-snippet">${snippet}</div>
        </a>
      `;
    }).join('');
  }

  function extractSnippet(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(text.slice(0, 120)) + '...';
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 80);
    const raw = text.slice(start, end);
    return '...' + highlightQuery(escapeHtml(raw), query) + '...';
  }

  function highlightQuery(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(79, 70, 229, 0.25); color: inherit; padding: 1px 3px; border-radius: 2px;">$1</mark>');
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }
}

/* --------------------------------------------------------------------------
   3. Mobile Sidebar Drawer & Navigation
   -------------------------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');

  if (!sidebar || !mobileToggleBtn) return;

  const toggle = () => {
    sidebar.classList.toggle('active');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
  };

  const close = () => {
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  };

  mobileToggleBtn.addEventListener('click', toggle);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', close);

  // Close sidebar on link click (mobile)
  sidebar.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) close();
    });
  });
}

/* --------------------------------------------------------------------------
   4. Table of Contents & ScrollSpy Active Highlighting
   -------------------------------------------------------------------------- */
function initTOCScrollSpy() {
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  const tocLinks = document.querySelectorAll('.toc-link');

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -65% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        // Update sidebar links
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        // Update right TOC links
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));
}

/* --------------------------------------------------------------------------
   5. Image Lightbox Modal Zoom
   -------------------------------------------------------------------------- */
let lightboxOverlay, lightboxImg;

function initLightbox() {
  lightboxOverlay = document.getElementById('lightboxOverlay');
  lightboxImg = document.getElementById('lightboxImg');

  if (!lightboxOverlay) {
    lightboxOverlay = document.createElement('div');
    lightboxOverlay.id = 'lightboxOverlay';
    lightboxOverlay.className = 'lightbox-overlay';
    lightboxOverlay.innerHTML = '<img class="lightbox-img" id="lightboxImg" src="" alt="Enlarged Diagram / Preview">';
    document.body.appendChild(lightboxOverlay);

    lightboxImg = document.getElementById('lightboxImg');
    lightboxOverlay.addEventListener('click', closeLightbox);
  }

  // Attach zoom to clickable diagrams/images
  document.querySelectorAll('.zoomable-img, .diagram-card svg').forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      if (el.tagName.toLowerCase() === 'img') {
        openLightbox(el.src);
      }
    });
  });
}

function openLightbox(src) {
  if (lightboxOverlay && lightboxImg) {
    lightboxImg.src = src;
    lightboxOverlay.classList.add('active');
  }
}

function closeLightbox() {
  if (lightboxOverlay) {
    lightboxOverlay.classList.remove('active');
  }
}

/* --------------------------------------------------------------------------
   6. Copy-to-Clipboard for Code Blocks
   -------------------------------------------------------------------------- */
function initCopyCode() {
  document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const codeBlock = document.getElementById(targetId) || btn.closest('.code-card').querySelector('pre code');
      if (codeBlock) {
        const text = codeBlock.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i> Copied!';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 2000);
        });
      }
    });
  });
}
