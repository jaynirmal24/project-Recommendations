// Demo books data (could be loaded from a backend in the future)
const demoBooks = [
  {
    id: 'book1',
    title: 'Atomic Habits',
    fullDesc: 'Explore the wonders of the universe, from the birth of stars to the mysteries of black holes. This book is a visual and scientific treat for astronomy lovers.',
    cover: 'https://s3proxy.cdn-zlib.sk//covers299/collections/userbooks/fb8ab6c4608d3b6aa27315af81fc396ce61c18d002cff6e759c30e25ea079669.jpg',
    download: 'https://archive.org/embed/unlimited-memory',
    pdf: 'https://archive.org/embed/unlimited-memory',
    meta: 'Author: Jane Doe · 2023 · 120 pages',
    language: 'English',
    fileType: 'PDF'
  },
  {
    id: 'book2',
    title: 'Minimalist Living',
    fullDesc: 'Discover how to live more with less. This guide offers actionable tips, real-life stories, and beautiful photography to inspire a simpler, happier life.',
    cover: 'assets/book2.jpg',
    download: '#',
    pdf: '#',
    meta: 'Author: John Smith · 2022 · 98 pages',
    language: 'English',
    fileType: 'PDF'
  },
  {
    id: 'book3',
    title: 'Code Zen',
    fullDesc: 'Blending mindfulness with coding best practices, this book helps you write better code and find joy in the process. Includes exercises and meditations.',
    cover: 'assets/book3.jpg',
    download: '#',
    pdf: 'assets/book3.pdf',
    meta: 'Author: Alex Lee · 2024 · 150 pages',
    language: 'English',
    fileType: 'PDF'
  }
];

// --- LocalStorage helpers ---
// NOTE: These could be moved to a utils.js if the app grows
function getFavorites() {
  // Returns array of favorite book IDs
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}
function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
  updateFavoritesBtn();
}
function isFavorited(id) {
  return getFavorites().includes(id);
}
function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) favs = favs.filter(f => f !== id);
  else favs.push(id);
  setFavorites(favs);
}

function getReadingProgress(bookId) {
  // Returns last read page for a book, default 1
  return JSON.parse(localStorage.getItem('readingProgress') || '{}')[bookId] || 1;
}
function setReadingProgress(bookId, page) {
  const prog = JSON.parse(localStorage.getItem('readingProgress') || '{}');
  prog[bookId] = page;
  localStorage.setItem('readingProgress', JSON.stringify(prog));
}

// Utility to update the favorites button heart icon
function updateFavoritesBtn() {
  const btn = document.getElementById('favoritesBtn');
  const favs = getFavorites();
  btn.innerHTML = favs.length > 0 ? '❤️' : '🤍';
}

// --- Render homepage ---
let authorFilter = null;

// --- Reader Popup ---
function openReaderPopup(book) {
  // Opens the reader modal with the book PDF
  const modal = document.getElementById('readerModal');
  const frame = document.getElementById('readerIframe');
  frame.src = book.pdf;
  customizeIframe(frame);
  showModal('readerModal');
}

// Add fullscreen logic for reader iframe
document.addEventListener('DOMContentLoaded', () => {
  const fullscreenBtn = document.getElementById('fullscreenReaderBtn');
  const readerIframe = document.getElementById('readerIframe');
  if (fullscreenBtn && readerIframe) {
    fullscreenBtn.onclick = () => {
      // NOTE: Not all browsers support all these methods
      if (readerIframe.requestFullscreen) {
        readerIframe.requestFullscreen();
      } else if (readerIframe.webkitRequestFullscreen) {
        readerIframe.webkitRequestFullscreen();
      } else if (readerIframe.mozRequestFullScreen) {
        readerIframe.mozRequestFullScreen();
      } else if (readerIframe.msRequestFullscreen) {
        readerIframe.msRequestFullscreen();
      }
    };
  }
});

// Function to render books by a specific author in a popup
function renderAuthorBooks(author) {
  const modal = document.getElementById('authorBooksModal');
  const list = document.getElementById('authorBooksList');
  list.innerHTML = '';

  const booksByAuthor = demoBooks.filter(book => {
    const match = book.meta.match(/Author:\s*([^·]+)/i);
    const bookAuthor = match ? match[1].trim() : 'Unknown';
    return bookAuthor.toLowerCase() === author.toLowerCase();
  });

  if (booksByAuthor.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);text-align:center;">No books found for this author.</div>';
  } else {
    booksByAuthor.forEach(book => {
      const item = document.createElement('div');
      item.className = 'author-book-item';
      let readBtn = '';
      if (book.pdf && book.pdf !== '#') {
        readBtn = `<button class="read-btn" data-id="${book.id}">Read</button>`;
      }
      item.innerHTML = `
        <img src="${book.cover}" class="author-book-cover" />
        <div>
          <div class="author-book-title">${book.title}</div>
          <div class="author-book-meta">${book.meta}</div>
        </div>
        ${readBtn}
      `;
      if (book.pdf && book.pdf !== '#') {
        item.querySelector('.read-btn').onclick = (e) => {
          openReaderPopup(book);
          e.stopPropagation();
        };
      }
      item.onclick = () => openBookDetail(book.id);
      list.appendChild(item);
    });
  }

  showModal('authorBooksModal');
}

// Main render function for books grid
function renderBooks() {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '';

  // Show "Saw Collection" button if filtered
  let collectionBtn = document.getElementById('collectionBtn');
  if (authorFilter) {
    if (!collectionBtn) {
      collectionBtn = document.createElement('button');
      collectionBtn.id = 'collectionBtn';
      collectionBtn.className = 'collection-btn';
      collectionBtn.innerText = 'Saw Collection';
      collectionBtn.onclick = () => {
        authorFilter = null;
        renderBooks();
      };
      grid.parentElement.insertBefore(collectionBtn, grid);
    }
  } else if (collectionBtn) {
    collectionBtn.remove();
  }

  // Filter books if authorFilter is set using strict (exact) match
  const booksToShow = authorFilter
    ? demoBooks.filter(book => {
        const match = book.meta.match(/Author:\s*([^·]+)/i);
        const bookAuthor = match ? match[1].trim().toLowerCase() : '';
        return bookAuthor === authorFilter.toLowerCase();
      })
    : demoBooks;

  booksToShow.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';

    // Extract author once from meta field
    const match = book.meta.match(/Author:\s*([^·]+)/i);
    const bookAuthor = match ? match[1].trim() : 'Unknown';

    // Show star badge only if book is favorited
    if (isFavorited(book.id)) {
      const favBadge = document.createElement('div');
      favBadge.className = 'fav-badge';
      favBadge.title = 'Unfavorite';
      favBadge.innerHTML = `<span class="fav-badge-inner">★</span>`;
      favBadge.onclick = (e) => {
        toggleFavorite(book.id);
        renderBooks();
        e.stopPropagation();
      };
      card.appendChild(favBadge);
    }

    // Author badge (blue, below cover) - NOT clickable
    const authorBadge = document.createElement('div');
    authorBadge.className = 'author-badge';
    authorBadge.innerText = bookAuthor;

    card.innerHTML += `
      <img src="${book.cover}" alt="${book.title} cover" class="book-cover" />
      <div class="book-title">${book.title}</div>
    `;
    card.appendChild(authorBadge);
    card.innerHTML += `
      <div class="book-lang">Language: ${book.language}</div>
      <div class="book-file-type">File Type: ${book.fileType}</div>
    `;
    card.onclick = () => openBookDetail(book.id);
    grid.appendChild(card);
  });
}

// --- Favorites Modal ---
function renderFavoritesModal() {
  const favs = getFavorites();
  const list = document.getElementById('favoritesList');
  list.innerHTML = '';
  if (!favs.length) {
    list.innerHTML = '<div style="color:var(--muted);text-align:center;">No favorites yet.</div>';
    return;
  }
  favs.forEach(id => {
    const book = demoBooks.find(b => b.id === id);
    if (!book) return;
    const item = document.createElement('div');
    item.className = 'fav-book-item';
    // Build actions HTML based on book.pdf and book.download
    let actionsHTML = '';
    if (book.pdf && book.pdf !== '#') {
      actionsHTML += `<button class="read-btn" data-id="${book.id}">Read</button>`;
    }
    if (book.download && book.download !== '#') {
      actionsHTML += `<button class="download-btn" data-id="${book.id}">Download</button>`;
    }
    actionsHTML += `<button class="favorite-btn favorited" data-id="${book.id}" aria-label="Unfavorite">&#10084;</button>`;
    item.innerHTML = `
      <img src="${book.cover}" class="fav-book-cover" />
      <div>
        <div class="fav-book-title">${book.title}</div>
        <div class="fav-book-meta">${book.meta}</div>
      </div>
      <div class="fav-book-actions">
        ${actionsHTML}
      </div>
    `;
    if (book.pdf && book.pdf !== '#') {
      item.querySelector('.read-btn').onclick = (e) => {
        openReaderPopup(book);
        e.stopPropagation();
      };
    }
    if (book.download && book.download !== '#') {
      item.querySelector('.download-btn').onclick = (e) => {
        window.open(book.download, '_blank');
        e.stopPropagation();
      };
    }
    item.querySelector('.favorite-btn').onclick = e => {
      toggleFavorite(book.id);
      renderFavoritesModal();
      renderBooks();
      e.stopPropagation();
    };
    item.onclick = () => openBookDetail(book.id);
    list.appendChild(item);
  });
}

// --- Book Detail Modal ---
function openBookDetail(bookId) {
  const book = demoBooks.find(b => b.id === bookId);
  if (!book) return;
  const match = book.meta.match(/Author:\s*([^·]+)/i);
  const bookAuthor = match ? match[1].trim() : 'Unknown';
  const content = document.getElementById('bookDetailContent');
  // Build buttons HTML based on book.pdf and book.download
  let buttonsHTML = '';
  if (book.pdf && book.pdf !== '#') {
    buttonsHTML += `<button class="read-btn" data-id="${book.id}">Read</button>`;
  }
  if (book.download && book.download !== '#') {
    buttonsHTML += `<button class="download-btn" data-id="${book.id}">Download</button>`;
  }
  buttonsHTML += `<button class="favorite-btn${isFavorited(book.id) ? ' favorited' : ''}" data-id="${book.id}" aria-label="Favorite">&#10084;</button>`;
  content.innerHTML = `
    <img src="${book.cover}" class="detail-cover" />
    <div class="detail-info">
      <div class="detail-title">${book.title}</div>
      <div class="detail-meta">
        <span class="author-link" style="cursor:pointer;color:#0a84ff;text-decoration:underline;">${bookAuthor}</span>
        ${book.meta.replace(/Author:\s*([^·]+)/i, '')}
      </div>
      <div class="detail-lang-file">Language: ${book.language} | File Type: ${book.fileType}</div>
      <div class="detail-buttons">
        ${buttonsHTML}
      </div>
    </div>
  `;
  content.querySelector('.author-link').onclick = (e) => {
    renderAuthorBooks(bookAuthor);
    e.stopPropagation();
  };
  if (book.pdf && book.pdf !== '#') {
    content.querySelector('.read-btn').onclick = () => openReaderPopup(book);
  }
  if (book.download && book.download !== '#') {
    content.querySelector('.download-btn').onclick = () => window.open(book.download, '_blank');
  }
  content.querySelector('.favorite-btn').onclick = () => {
    toggleFavorite(book.id);
    openBookDetail(book.id);
    renderBooks();
  };
  showModal('bookDetailModal');
}

// --- Flipbook Modal ---
let pageFlip = null;
function openFlipbook(bookId) {
  const book = demoBooks.find(b => b.id === bookId);
  if (!book) return;
  const prompt = document.getElementById('flipbookPrompt');
  const container = document.getElementById('flipbookContainer');
  prompt.innerHTML = '';
  container.innerHTML = '';
  showModal('flipbookModal');

  // Load PDF and get page count
  fetch(book.pdf)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      pdfjsLib.getDocument(url).promise.then(pdf => {
        const totalPages = pdf.numPages;
        let lastPage = getReadingProgress(bookId);
        if (lastPage > totalPages) lastPage = 1;
        // Prompt to resume
        if (lastPage > 1) {
          prompt.innerHTML = `
            <button id="resumeBtn">Resume from page ${lastPage}</button>
            <button id="restartBtn">Start from beginning</button>
          `;
          document.getElementById('resumeBtn').onclick = () => {
            prompt.innerHTML = '';
            startFlipbook(pdf, bookId, lastPage);
          };
          document.getElementById('restartBtn').onclick = () => {
            prompt.innerHTML = '';
            startFlipbook(pdf, bookId, 1);
          };
        } else {
          startFlipbook(pdf, bookId, 1);
        }
      });
    });
}

function startFlipbook(pdf, bookId, startPage) {
  const container = document.getElementById('flipbookContainer');
  container.innerHTML = '';
  if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
  const pageCount = pdf.numPages;
  // Create page elements
  const pages = [];
  for (let i = 1; i <= pageCount; i++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'flipbook-page';
    pageDiv.style.background = '#232326';
    pageDiv.style.display = 'flex';
    pageDiv.style.alignItems = 'center';
    pageDiv.style.justifyContent = 'center';
    pageDiv.style.height = '100%';
    pageDiv.innerHTML = `<canvas style="width:100%;height:100%;"></canvas>`;
    pages.push(pageDiv);
  }
  // Render pages
  Promise.all(pages.map((div, idx) =>
    pdf.getPage(idx + 1).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = div.querySelector('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    })
  )).then(() => {
    // Init StPageFlip
    pageFlip = new St.PageFlip(container, {
      width: 500, height: 700,
      size: 'stretch',
      minWidth: 320, minHeight: 400,
      maxWidth: 1200, maxHeight: 1600,
      showCover: false,
      mobileScrollSupport: true,
      usePortrait: true,
      startPage: startPage - 1,
      animationDuration: 600
    });
    pageFlip.loadFromHTML(pages);
    pageFlip.on('flip', e => {
      setReadingProgress(bookId, e.data + 1);
    });
    // Fullscreen on click
    container.onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else container.requestFullscreen();
    };
  });
}

// --- Settings/Performance Mode ---
function applyPerformanceMode(enabled) {
  document.body.classList.toggle('performance-mode', !!enabled);
  // TODO: Add more performance tweaks if needed
  localStorage.setItem('performanceMode', enabled ? '1' : '0');
}

function setupSettings() {
  const settingsBtn = document.getElementById('settingsBtn');
  const perfToggle = document.getElementById('performanceModeToggle');
  settingsBtn.onclick = () => {
    perfToggle.checked = !!+localStorage.getItem('performanceMode');
    showModal('settingsModal');
  };
  perfToggle.onchange = () => {
    applyPerformanceMode(perfToggle.checked);
  };
  if (localStorage.getItem('performanceMode') === '1') {
    applyPerformanceMode(true);
  }
}

// --- Modal helpers ---
function showModal(id) {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  setTimeout(() => { modal.querySelector('.modal-content').focus?.(); }, 50);
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.onclick = e => {
    closeModal(btn.dataset.close);
    e.stopPropagation();
  };
});
document.getElementById('favoritesBtn').onclick = () => {
  renderFavoritesModal();
  showModal('favoritesModal');
};

// --- PDF.js loader ---
// NOTE: Only loads if not already present
window.pdfjsLib = window.pdfjsLib || {};
(function loadPDFjs() {
  if (window.pdfjsLib && window.pdfjsLib.getDocument) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; };
  document.head.appendChild(s);
})();

// --- Customize iframe ---
function customizeIframe(iframe) {
  iframe.onload = () => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const style = iframeDoc.createElement('style');
    style.textContent = `
      .lending-wrapper {
        width: 100%;
        margin: 0 auto;
        background: var(--primaryBGColor, #000);
        color: var(--primaryTextColor, #fff);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        visibility: hidden;
      }
    `;
    iframeDoc.head.appendChild(style);

    // Optionally, remove the element directly if it exists
    const lendingWrapper = iframeDoc.querySelector('.lending-wrapper');
    if (lendingWrapper) {
      lendingWrapper.style.visibility = 'hidden';
    }
  };
}

// --- Initial render ---
renderBooks();
updateFavoritesBtn();
setupSettings();

// TODO: Add search/filter functionality in future
