// Client-side Application State
const state = {
  password: localStorage.getItem('startpagina_pwd') || '',
  categories: [],
  links: [],
  searchQuery: ''
};

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const togglePasswordBtn = document.getElementById('toggle-password');
const loginError = document.getElementById('login-error');

const searchInput = document.getElementById('search-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const emptyAddCategoryBtn = document.getElementById('empty-add-category-btn');
const logoutBtn = document.getElementById('logout-btn');
const categoriesGrid = document.getElementById('categories-grid');
const emptyState = document.getElementById('empty-state');
const headerLogo = document.getElementById('header-logo');

// Dialog Elements
const categoryDialog = document.getElementById('category-dialog');
const categoryForm = document.getElementById('category-form');
const categoryIdInput = document.getElementById('category-id-input');
const categoryNameInput = document.getElementById('category-name-input');
const categoryDialogTitle = document.getElementById('category-dialog-title');

const linkDialog = document.getElementById('link-dialog');
const linkForm = document.getElementById('link-form');
const linkIdInput = document.getElementById('link-id-input');
const linkCategoryIdInput = document.getElementById('link-category-id-input');
const linkTitleInput = document.getElementById('link-title-input');
const linkUrlInput = document.getElementById('link-url-input');
const linkDialogTitle = document.getElementById('link-dialog-title');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  
  if (state.password) {
    verifyStoredPassword();
  } else {
    showLogin();
  }
});

// Setup Events
function setupEventListeners() {
  // Reset view on header logo click (Return Home)
  headerLogo.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    render();
  });

  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = passwordInput.value.trim();
    if (!pwd) return;
    
    const success = await attemptLogin(pwd);
    if (success) {
      state.password = pwd;
      localStorage.setItem('startpagina_pwd', pwd);
      showDashboard();
      fetchData();
    } else {
      loginError.textContent = 'Ongeldig wachtwoord, probeer het opnieuw.';
    }
  });

  // Toggle Password Visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const eyeIcon = togglePasswordBtn.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    state.password = '';
    localStorage.removeItem('startpagina_pwd');
    showLogin();
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    render();
  });

  // Dialog Close buttons (for older browser fallback or custom action)
  document.querySelectorAll('button[command="close"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dialogId = btn.getAttribute('commandfor');
      const dialog = document.getElementById(dialogId);
      if (dialog) {
        dialog.close();
      }
    });
  });

  // Add Category Modal
  const openCategoryAdd = () => {
    categoryIdInput.value = '';
    categoryNameInput.value = '';
    categoryDialogTitle.textContent = 'Categorie Toevoegen';
    categoryDialog.showModal();
  };
  addCategoryBtn.addEventListener('click', openCategoryAdd);
  emptyAddCategoryBtn.addEventListener('click', openCategoryAdd);

  // Category Form Submit
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = categoryIdInput.value;
    const name = categoryNameInput.value.trim();
    
    if (id) {
      // Edit
      const category = state.categories.find(c => c.id === id);
      if (category) category.name = name;
    } else {
      // Add
      const newCategory = {
        id: 'cat-' + Date.now(),
        name: name
      };
      state.categories.push(newCategory);
    }
    
    categoryDialog.close();
    await saveData();
    render();
  });

  // Link Form Submit
  linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = linkIdInput.value;
    const categoryId = linkCategoryIdInput.value;
    const title = linkTitleInput.value.trim();
    let url = linkUrlInput.value.trim();

    // Ensure valid URL prefix
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (id) {
      // Edit
      const link = state.links.find(l => l.id === id);
      if (link) {
        link.title = title;
        link.url = url;
      }
    } else {
      // Add
      const newLink = {
        id: 'link-' + Date.now(),
        categoryId: categoryId,
        title: title,
        url: url
      };
      state.links.push(newLink);
    }

    linkDialog.close();
    await saveData();
    render();
  });

  // Copy Link Form Submit
  const copyLinkDialog = document.getElementById('copy-link-dialog');
  const copyLinkForm = document.getElementById('copy-link-form');
  const copyLinkTitleInput = document.getElementById('copy-link-title-input');
  const copyLinkUrlInput = document.getElementById('copy-link-url-input');
  const copyLinkCategorySelect = document.getElementById('copy-link-category-select');

  copyLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = copyLinkTitleInput.value;
    const url = copyLinkUrlInput.value;
    const categoryId = copyLinkCategorySelect.value;

    const newLink = {
      id: 'link-' + Date.now(),
      categoryId: categoryId,
      title: title,
      url: url
    };
    state.links.push(newLink);

    copyLinkDialog.close();
    await saveData();
    render();
  });
}

// Show / Hide Panels
function showLogin() {
  loginContainer.style.display = 'flex';
  dashboardContainer.style.display = 'none';
  passwordInput.value = '';
  loginError.textContent = '';
  passwordInput.focus();
}

function showDashboard() {
  loginContainer.style.display = 'none';
  dashboardContainer.style.display = 'flex';
}

const APP_PASSWORD = 'PC6qZrtQC*C'; // Wijzig dit wachtwoord voor Vercel/client-side
let isServerMode = true;

// API Interactions
async function attemptLogin(password) {
  if (!isServerMode) {
    return password === APP_PASSWORD;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.status === 404) {
      isServerMode = false;
      return password === APP_PASSWORD;
    }
    return res.ok;
  } catch (err) {
    console.error('API call failed, switching to client-only mode:', err);
    isServerMode = false;
    return password === APP_PASSWORD;
  }
}

async function verifyStoredPassword() {
  const success = await attemptLogin(state.password);
  if (success) {
    showDashboard();
    fetchData();
  } else {
    state.password = '';
    localStorage.removeItem('startpagina_pwd');
    showLogin();
  }
}

async function fetchData() {
  if (!isServerMode) {
    loadLocalData();
    return;
  }

  try {
    const res = await fetch('/api/data', {
      headers: { 'X-Password': state.password }
    });
    if (res.status === 404) {
      isServerMode = false;
      loadLocalData();
      return;
    }
    if (res.status === 401) {
      logoutBtn.click();
      return;
    }
    const data = await res.json();
    state.categories = data.categories || [];
    state.links = data.links || [];
    render();
  } catch (err) {
    console.error('Fout bij ophalen van data, switching to client-only mode:', err);
    isServerMode = false;
    loadLocalData();
  }
}

async function loadLocalData() {
  // Try loading from localStorage first
  const localData = localStorage.getItem('startpagina_data');
  if (localData) {
    try {
      const data = JSON.parse(localData);
      state.categories = data.categories || [];
      state.links = data.links || [];
      render();
      return;
    } catch (e) {
      console.error('Error parsing localStorage data', e);
    }
  }

  // Fallback: fetch static public/data.json (copied to public folder)
  try {
    const res = await fetch('/data.json');
    if (res.ok) {
      const data = await res.json();
      state.categories = data.categories || [];
      state.links = data.links || [];
      // Save it to localStorage so subsequent edits persist
      localStorage.setItem('startpagina_data', JSON.stringify(data));
      render();
    }
  } catch (err) {
    console.error('Fout bij laden van statische data:', err);
  }
}

async function saveData() {
  if (!isServerMode) {
    saveLocalData();
    return;
  }

  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Password': state.password
      },
      body: JSON.stringify({
        categories: state.categories,
        links: state.links
      })
    });
    if (res.status === 404) {
      isServerMode = false;
      saveLocalData();
      return;
    }
    if (res.status === 401) {
      logoutBtn.click();
    }
  } catch (err) {
    console.error('Fout bij opslaan van data, switching to client-only mode:', err);
    isServerMode = false;
    saveLocalData();
  }
}

function saveLocalData() {
  const dataToSave = {
    categories: state.categories,
    links: state.links
  };
  localStorage.setItem('startpagina_data', JSON.stringify(dataToSave));
}

function openCopyLinkDialog(link) {
  const copyLinkDialog = document.getElementById('copy-link-dialog');
  const copyLinkTitleInput = document.getElementById('copy-link-title-input');
  const copyLinkUrlInput = document.getElementById('copy-link-url-input');
  const copyLinkCategorySelect = document.getElementById('copy-link-category-select');

  copyLinkTitleInput.value = link.title;
  copyLinkUrlInput.value = link.url;

  // Clear existing options
  copyLinkCategorySelect.innerHTML = '';

  // Populate categories select
  state.categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    if (cat.id === link.categoryId) {
      option.selected = true;
    }
    copyLinkCategorySelect.appendChild(option);
  });

  copyLinkDialog.showModal();
}

// Helper to get domain favicon
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return null;
  }
}

// Rendering Logic
function render() {
  categoriesGrid.innerHTML = '';
  
  if (state.categories.length === 0) {
    categoriesGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  categoriesGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  let hasVisibleCategories = false;

  state.categories.forEach(category => {
    // Filter links inside category based on search query
    const categoryLinks = state.links.filter(l => l.categoryId === category.id);
    const filteredLinks = categoryLinks.filter(link => {
      if (!state.searchQuery) return true;
      return link.title.toLowerCase().includes(state.searchQuery) ||
             link.url.toLowerCase().includes(state.searchQuery);
    });

    // If searching, hide category if it has no matching links and the category name doesn't match
    const categoryMatches = category.name.toLowerCase().includes(state.searchQuery);
    if (state.searchQuery && !categoryMatches && filteredLinks.length === 0) {
      return;
    }

    hasVisibleCategories = true;

    // Create Category Card Element
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.id = category.id;

    // Card Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'category-header';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = category.name;
    
    const actions = document.createElement('div');
    actions.className = 'category-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.title = 'Categorie bewerken';
    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
    editBtn.addEventListener('click', () => {
      categoryIdInput.value = category.id;
      categoryNameInput.value = category.name;
      categoryDialogTitle.textContent = 'Categorie Aanpassen';
      categoryDialog.showModal();
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.title = 'Categorie verwijderen';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Weet je zeker dat je de categorie "${category.name}" en alle bijbehorende links wilt verwijderen?`)) {
        state.categories = state.categories.filter(c => c.id !== category.id);
        state.links = state.links.filter(l => l.categoryId !== category.id);
        await saveData();
        render();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    cardHeader.appendChild(title);
    cardHeader.appendChild(actions);
    card.appendChild(cardHeader);

    // Links List Container
    const linksList = document.createElement('div');
    linksList.className = 'links-list';

    // Render each link
    filteredLinks.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';

      const anchor = document.createElement('a');
      anchor.className = 'link-anchor';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';

      // Favicon
      const favWrapper = document.createElement('div');
      favWrapper.className = 'favicon-wrapper';
      const faviconUrl = getFaviconUrl(link.url);
      if (faviconUrl) {
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = '';
        img.onerror = () => {
          favWrapper.innerHTML = '<i class="fa-solid fa-link"></i>';
        };
        favWrapper.appendChild(img);
      } else {
        favWrapper.innerHTML = '<i class="fa-solid fa-link"></i>';
      }

      const linkTitle = document.createElement('span');
      linkTitle.className = 'link-title';
      linkTitle.textContent = link.title;
      linkTitle.title = link.url;

      anchor.appendChild(favWrapper);
      anchor.appendChild(linkTitle);
      linkItem.appendChild(anchor);

      // Link Edit/Delete Controls
      const linkControls = document.createElement('div');
      linkControls.className = 'link-controls';

      const linkEdit = document.createElement('button');
      linkEdit.className = 'action-btn edit-btn';
      linkEdit.title = 'Link bewerken';
      linkEdit.innerHTML = '<i class="fa-solid fa-pencil"></i>';
      linkEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        linkIdInput.value = link.id;
        linkCategoryIdInput.value = category.id;
        linkTitleInput.value = link.title;
        linkUrlInput.value = link.url;
        linkDialogTitle.textContent = 'Link Aanpassen';
        linkDialog.showModal();
      });

      const linkCopy = document.createElement('button');
      linkCopy.className = 'action-btn copy-btn';
      linkCopy.title = 'Link kopiëren naar andere categorie';
      linkCopy.innerHTML = '<i class="fa-solid fa-copy"></i>';
      linkCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        openCopyLinkDialog(link);
      });

      const linkDelete = document.createElement('button');
      linkDelete.className = 'action-btn delete-btn';
      linkDelete.title = 'Link verwijderen';
      linkDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      linkDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Weet je zeker dat je de link "${link.title}" wilt verwijderen?`)) {
          state.links = state.links.filter(l => l.id !== link.id);
          await saveData();
          render();
        }
      });

      linkControls.appendChild(linkEdit);
      linkControls.appendChild(linkCopy);
      linkControls.appendChild(linkDelete);
      linkItem.appendChild(linkControls);
      linksList.appendChild(linkItem);
    });

    card.appendChild(linksList);

    // "Add Link" button at bottom of card
    const addLinkCardBtn = document.createElement('button');
    addLinkCardBtn.className = 'add-link-card-btn';
    addLinkCardBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Link Toevoegen';
    addLinkCardBtn.addEventListener('click', () => {
      linkIdInput.value = '';
      linkCategoryIdInput.value = category.id;
      linkTitleInput.value = '';
      linkUrlInput.value = '';
      linkDialogTitle.textContent = 'Link Toevoegen';
      linkDialog.showModal();
    });
    card.appendChild(addLinkCardBtn);

    categoriesGrid.appendChild(card);
  });

  // If search filtered everything out
  if (!hasVisibleCategories && state.searchQuery) {
    const noResults = document.createElement('div');
    noResults.className = 'empty-state';
    noResults.innerHTML = `
      <i class="fa-solid fa-magnifying-glass empty-icon"></i>
      <h2>Geen resultaten gevonden</h2>
      <p>Geen categorieën of links matchen met "${state.searchQuery}"</p>
    `;
    categoriesGrid.appendChild(noResults);
  }
}
