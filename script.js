/* ==========================================================================
   COZY CORNER PLANNER — Engine JS (Production & Commercial Grade)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async function () {

  var SUPABASE_URL = 'https://udtiljauxgtneboirlgd.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdGlsamF1eGd0bmVib2lybGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTY5MzcsImV4cCI6MjEwNTIzMjkzN30.jzP5qdrI5jC-KR9YIQguFxWMQloOJgAIIk1d9_XduhE';
  var AVATAR_BUCKET = 'avatars';

  var supabaseClient = null;
  if (typeof window['supabase'] !== 'undefined') {
    try {
      supabaseClient = window['supabase'].createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
      console.warn('Supabase client init failed:', err);
    }
  }

  var currentUser = null;
  var currentProfile = null; // row from public.profiles for currentUser, or null

  /* ---------- REAL-TIME DATE UPDATE ---------- */
  var dateEl = document.getElementById('widgetCurrentDate');
  if (dateEl) {
    var options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  /* ---------- TOAST ENGINE ---------- */
  function showToast(message, emoji) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span>' + (emoji || '✨') + '</span> <span>' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  /* ---------- MOBILE MENU TOGGLE ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var navActions = document.getElementById('navActions');

  function closeMobileNav() {
    if (navLinks && navActions && navToggle) {
      navLinks.classList.remove('is-open');
      navActions.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }

  if (navToggle) {
    navToggle.onclick = function (e) {
      e.stopPropagation();
      if (navLinks && navActions) {
        var isOpen = navLinks.classList.toggle('is-open');
        navActions.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      }
    };
  }

  document.addEventListener('click', function (e) {
    var target = /** @type {Element} */ (e.target);
    if (navLinks && navLinks.classList.contains('is-open') && !navLinks.contains(target) && navToggle && !navToggle.contains(target)) {
      closeMobileNav();
    }
  });

  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', closeMobileNav);
  });

  /* ---------- MODAL HANDLERS & NAVIGATION ---------- */
  var authModal = document.getElementById('authModal');
  var habitModal = document.getElementById('habitModal');
  var taskModal = document.getElementById('taskModal');
  var infoModal = document.getElementById('infoModal');
  var journalDeleteModal = document.getElementById('journalDeleteModal');
  var profileModal = document.getElementById('profileModal');

  function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
  }

  function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
  }

  function handleStartPlanning() {
    if (currentUser) {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      openModal(authModal);
    }
  }

  document.getElementById('startPlanningBtn')?.addEventListener('click', handleStartPlanning);
  document.getElementById('heroStartBtn')?.addEventListener('click', handleStartPlanning);

  document.getElementById('loginBtn')?.addEventListener('click', function () { openModal(authModal); });
  document.getElementById('heroExploreBtn')?.addEventListener('click', function () {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.close-auth-modal').forEach(function (btn) {
    /** @type {HTMLElement} */ (btn).onclick = function () { closeModal(authModal); };
  });

  document.getElementById('closeHabitModalBtn')?.addEventListener('click', function () { closeModal(habitModal); });
  document.getElementById('closeTaskModalBtn')?.addEventListener('click', function () { closeModal(taskModal); });
  document.getElementById('closeInfoModalBtn')?.addEventListener('click', function () { closeModal(infoModal); });

  document.getElementById('navFeatures')?.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('navJournal')?.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('navHabits')?.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('habits')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('navFaq')?.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('navPricing')?.addEventListener('click', function (e) {
    e.preventDefault();
    var title = document.getElementById('infoModalTitle');
    var content = document.getElementById('infoModalContent');
    if (title) title.textContent = "Pricing Plans";
    if (content) content.innerHTML = "<p><strong>Free Plan:</strong> Daily habit tracking & unlimited notes.</p><p><strong>Pro Plan ($5/m):</strong> Advanced analytics & custom tags.</p>";
    openModal(infoModal);
  });

  document.getElementById('navWorkflow')?.addEventListener('click', function (e) {
    e.preventDefault();
    var title = document.getElementById('infoModalTitle');
    var content = document.getElementById('infoModalContent');
    if (title) title.textContent = "Daily Workflow";
    if (content) content.innerHTML = "<p>1. Track habits effortlessly<br>2. Complete tasks at your own pace<br>3. Reflect with daily journals.</p>";
    openModal(infoModal);
  });

  /* ---------- AUTHENTICATION ---------- */
  var tabLogin = document.getElementById('tabLogin');
  var tabRegister = document.getElementById('tabRegister');
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');

  if (tabLogin && tabRegister && loginForm && registerForm) {
    tabLogin.onclick = function () {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    };
    tabRegister.onclick = function () {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    };
  }

  if (registerForm) {
    registerForm.onsubmit = async function (e) {
      e.preventDefault();
      if (!supabaseClient) return showToast('Koneksi ke server gagal.', '⚠️');

      var usernameInput = /** @type {HTMLInputElement} */ (document.getElementById('regUsername'));
      var emailInput = /** @type {HTMLInputElement} */ (document.getElementById('regEmail'));
      var phoneInput = /** @type {HTMLInputElement} */ (document.getElementById('regPhone'));
      var passwordInput = /** @type {HTMLInputElement} */ (document.getElementById('regPassword'));

      var username = usernameInput ? usernameInput.value.trim() : '';
      var email = emailInput ? emailInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var password = passwordInput ? passwordInput.value.trim() : '';

      if (password.length < 6) return showToast('Password minimal 6 karakter!', '⚠️');

      var res = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { username: username, phone: phone } }
      });

      if (res.error) {
        showToast('Gagal: ' + res.error.message, '⚠️');
      } else {
        showToast('Welcome, ' + username + '! Silakan Login.', '🎉');
        if (tabLogin) tabLogin.click();
      }
    };
  }

  if (loginForm) {
    loginForm.onsubmit = async function (e) {
      e.preventDefault();
      if (!supabaseClient) return showToast('Koneksi ke server gagal.', '⚠️');

      var input = /** @type {HTMLInputElement} */ (document.getElementById('loginIdentifier'));
      var pass = /** @type {HTMLInputElement} */ (document.getElementById('loginPassword'));

      var email = input ? input.value.trim() : '';
      var password = pass ? pass.value.trim() : '';

      var res = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (res.error) return showToast('Email atau Password salah!', '❌');

      currentUser = res.data.user;
      closeModal(authModal);
      await loadProfile();
      updateUIUser(currentUser, currentProfile);
      loadHabits();
      loadJournal();
      showToast('Berhasil Login! Selamat datang.', '🌿');
    };
  }

  /* ---------- NAVBAR USER MENU ---------- */
  var loginBtn = document.getElementById('loginBtn');
  var userMenu = document.getElementById('userMenu');
  var userMenuTrigger = document.getElementById('userMenuTrigger');
  var userMenuDropdown = document.getElementById('userMenuDropdown');

  function closeUserMenuDropdown() {
    if (userMenuDropdown) userMenuDropdown.classList.remove('is-open');
    if (userMenuTrigger) userMenuTrigger.setAttribute('aria-expanded', 'false');
  }

  userMenuTrigger?.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!userMenuDropdown) return;
    var isOpen = userMenuDropdown.classList.toggle('is-open');
    userMenuTrigger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', function (e) {
    var target = /** @type {Element} */ (e.target);
    if (userMenuDropdown && userMenuDropdown.classList.contains('is-open') && userMenu && !userMenu.contains(target)) {
      closeUserMenuDropdown();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async function () {
    closeUserMenuDropdown();
    if (supabaseClient) await supabaseClient.auth.signOut();
    location.reload();
  });

  document.getElementById('openProfileSettingsBtn')?.addEventListener('click', function () {
    closeUserMenuDropdown();
    openProfileModal();
  });

  /**
   * Reflects the logged-in user across the navbar avatar/name, the user
   * menu, and the hero dashboard widget greeting. Prefers profile data
   * (display name / username / avatar) but falls back gracefully to the
   * auth user's metadata/email so existing behavior never breaks.
   */
  function updateUIUser(userObj, profile) {
    if (!userObj) return;

    var displayLabel = null;
    if (profile && (profile.display_name || profile.username)) {
      displayLabel = profile.display_name || profile.username;
    } else if (userObj.user_metadata && userObj.user_metadata.username) {
      displayLabel = userObj.user_metadata.username;
    } else if (userObj.email) {
      displayLabel = userObj.email.split('@')[0];
    }

    var avatarUrl = profile && profile.avatar_url ? profile.avatar_url : null;
    var avatarLetter = displayLabel ? displayLabel.charAt(0).toUpperCase() : 'G';

    // Hero dashboard widget
    var greetingEl = document.getElementById('userGreeting');
    var avatarEl = document.getElementById('userAvatar');
    if (greetingEl && displayLabel) greetingEl.textContent = 'Welcome, ' + displayLabel + ' 👋';
    applyAvatarVisual(avatarEl, avatarUrl, avatarLetter);

    // Navbar: hide plain Login button, show the user menu
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    var navAvatar = document.getElementById('navUserAvatar');
    var navName = document.getElementById('navUserName');
    if (navName && displayLabel) navName.textContent = displayLabel;
    applyAvatarVisual(navAvatar, avatarUrl, avatarLetter);
  }

  function applyAvatarVisual(el, avatarUrl, letter) {
    if (!el) return;
    if (avatarUrl) {
      el.style.backgroundImage = 'url(' + avatarUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = letter;
    }
  }

  /* ---------- DINAMIS TO-DO LIST ---------- */
  var initialTasks = [
    { id: '1', name: 'Morning stretch & tea', badge: 'In Progress', checked: false },
    { id: '2', name: 'Write project outline', badge: 'In Progress', checked: false },
    { id: '3', name: 'Call with design team', badge: '10:00 AM', checked: false }
  ];

  var tasksData = [...initialTasks];
  var todoListContainer = document.getElementById('todoList');
  var taskProgressEl = document.getElementById('taskProgress');

  function renderTasks() {
    if (!todoListContainer) return;
    todoListContainer.innerHTML = '';

    var doneCount = 0;

    tasksData.forEach(function (task) {
      if (task.checked) doneCount++;

      var li = document.createElement('li');
      li.className = 'todo-item';
      li.setAttribute('data-id', task.id);

      var isTimeBadge = task.badge.includes(':') || task.badge.toLowerCase().includes('am') || task.badge.toLowerCase().includes('pm');
      var badgeClass = task.checked ? 'badge--done' : (isTimeBadge ? 'badge--time' : 'badge--progress');
      var badgeText = task.checked ? 'Done' : task.badge;

      li.innerHTML =
        '<button class="checkbox ' + (task.checked ? 'is-checked' : '') + '" aria-label="Toggle task"></button>' +
        '<span class="todo-item__name">' + task.name + '</span>' +
        '<button class="badge ' + badgeClass + ' status-toggle">' + badgeText + '</button>' +
        '<div class="todo-actions">' +
          '<button class="btn-icon btn-icon--edit" title="Edit">✏️</button>' +
          '<button class="btn-icon btn-icon--delete" title="Delete">🗑️</button>' +
        '</div>';

      var checkbox = li.querySelector('.checkbox');
      var badge = li.querySelector('.status-toggle');

      function toggleTask() {
        task.checked = !task.checked;
        renderTasks();
      }

      if (checkbox) checkbox.onclick = toggleTask;
      if (badge) badge.onclick = toggleTask;

      li.querySelector('.btn-icon--edit')?.addEventListener('click', function () {
        var taskIdInput = /** @type {HTMLInputElement} */ (document.getElementById('taskIdInput'));
        var taskNameInput = /** @type {HTMLInputElement} */ (document.getElementById('taskNameInput'));
        var taskTimeInput = /** @type {HTMLInputElement} */ (document.getElementById('taskTimeInput'));
        var modalTitle = document.getElementById('taskModalTitle');

        if (taskIdInput) taskIdInput.value = task.id;
        if (taskNameInput) taskNameInput.value = task.name;
        if (taskTimeInput) taskTimeInput.value = task.badge;
        if (modalTitle) modalTitle.textContent = "Edit Task";

        openModal(taskModal);
      });

      li.querySelector('.btn-icon--delete')?.addEventListener('click', function () {
        tasksData = tasksData.filter(t => t.id !== task.id);
        renderTasks();
        showToast('Tugas dihapus', '🗑️');
      });

      todoListContainer.appendChild(li);
    });

    if (taskProgressEl && tasksData.length > 0) {
      taskProgressEl.textContent = Math.round((doneCount / tasksData.length) * 100) + '%';
    } else if (taskProgressEl) {
      taskProgressEl.textContent = '0%';
    }
  }

  document.getElementById('addTodoBtn')?.addEventListener('click', function () {
    var taskIdInput = /** @type {HTMLInputElement} */ (document.getElementById('taskIdInput'));
    var taskNameInput = /** @type {HTMLInputElement} */ (document.getElementById('taskNameInput'));
    var taskTimeInput = /** @type {HTMLInputElement} */ (document.getElementById('taskTimeInput'));
    var modalTitle = document.getElementById('taskModalTitle');

    if (taskIdInput) taskIdInput.value = '';
    if (taskNameInput) taskNameInput.value = '';
    if (taskTimeInput) taskTimeInput.value = 'In Progress';
    if (modalTitle) modalTitle.textContent = "Add Task";

    openModal(taskModal);
  });

  document.getElementById('taskForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    var taskIdInput = /** @type {HTMLInputElement} */ (document.getElementById('taskIdInput'));
    var taskNameInput = /** @type {HTMLInputElement} */ (document.getElementById('taskNameInput'));
    var taskTimeInput = /** @type {HTMLInputElement} */ (document.getElementById('taskTimeInput'));

    var id = taskIdInput ? taskIdInput.value : '';
    var name = taskNameInput ? taskNameInput.value.trim() : '';
    var badge = taskTimeInput ? taskTimeInput.value || 'In Progress' : 'In Progress';

    if (!name) {
      showToast('Nama tugas tidak boleh kosong.', '⚠️');
      return;
    }

    if (id) {
      var existing = tasksData.find(t => t.id === id);
      if (existing) {
        existing.name = name;
        existing.badge = badge;
      }
      showToast('Tugas diperbarui!', '✏️');
    } else {
      tasksData.push({
        id: Date.now().toString(),
        name: name,
        badge: badge,
        checked: false
      });
      showToast('Tugas baru ditambahkan!', '✨');
    }

    closeModal(taskModal);
    renderTasks();
  });

  renderTasks();

  /* ---------- HABIT TRACKER ENGINE ---------- */
  var habitTable = document.getElementById('habitTable');

  function isLocalHabitId(rowId) {
    return typeof rowId === 'string' && (rowId.startsWith('default-') || rowId.startsWith('local-'));
  }

  function loadDefaultHabits() {
    if (!habitTable) return;
    habitTable.querySelectorAll('.habit-table__row[data-habit]').forEach(function (r) { r.remove(); });
    renderRow('default-1', '🏃 Joging', [false, false, false, false, false, false, false], [true, true, true, true, true, true, true]);
  }

  async function loadHabits() {
    if (!currentUser || !habitTable || !supabaseClient) {
      loadDefaultHabits();
      return;
    }
    try {
      var res = await supabaseClient.from('habits').select('*').eq('user_id', currentUser.id);

      if (res.data && res.data.length > 0) {
        habitTable.querySelectorAll('.habit-table__row[data-habit]').forEach(function (r) { r.remove(); });
        res.data.forEach(function (rowItem) {
          renderRow(rowItem.id, rowItem.habit_name, rowItem.completed_days, rowItem.active_days);
        });
      } else {
        loadDefaultHabits();
      }
    } catch (err) {
      console.warn('Gagal memuat habit dari Supabase, memuat default:', err);
      loadDefaultHabits();
    }
  }

  function renderRow(rowId, rowName, daysArr, activeDaysArr) {
    if (!habitTable) return;

    var activeDays = activeDaysArr || [true, true, true, true, true, true, true];

    var row = document.createElement('div');
    row.className = 'habit-table__row';
    row.setAttribute('data-habit', rowName);

    var html = '<span class="habit-name-col">' + rowName + '</span>';
    for (var i = 0; i < 7; i++) {
      var isChecked = daysArr && daysArr[i] ? true : false;
      var isActiveDay = activeDays[i] !== false;

      if (isActiveDay) {
        html += '<span class="day-cell" data-checked="' + isChecked + '"><button class="day-toggle ' + (isChecked ? 'is-active' : '') + '" type="button" data-idx="' + i + '"></button></span>';
      } else {
        html += '<span class="day-cell" data-disabled="true"><button class="day-toggle" type="button" disabled title="Not scheduled"></button></span>';
      }
    }

    html += '<span class="habit-action-col"><button class="btn-icon btn-icon--delete delete-habit-btn" title="Delete Habit">🗑️</button></span>';

    row.innerHTML = html;

    // Hapus Habit Event
    row.querySelector('.delete-habit-btn')?.addEventListener('click', async function () {
      if (currentUser && supabaseClient && !isLocalHabitId(rowId)) {
        try {
          await supabaseClient.from('habits').delete().eq('id', rowId);
        } catch (err) {
          console.warn('Gagal hapus habit Supabase:', err);
        }
      }
      row.remove();
      updateHabitMetric();
      showToast('Habit berhasil dihapus', '🗑️');
    });

    // Toggle status hari Habit
    row.querySelectorAll('.day-toggle:not([disabled])').forEach(function (btn) {
      /** @type {HTMLElement} */ (btn).onclick = async function () {
        var idxStr = btn.getAttribute('data-idx');
        if (!idxStr) return;
        var idx = parseInt(idxStr);
        var cell = btn.parentElement;
        if (!cell) return;

        var current = cell.getAttribute('data-checked') === 'true';
        daysArr[idx] = !current;
        cell.setAttribute('data-checked', String(daysArr[idx]));
        btn.classList.toggle('is-active', daysArr[idx]);

        if (currentUser && supabaseClient && !isLocalHabitId(rowId)) {
          try {
            await supabaseClient.from('habits').update({ completed_days: daysArr }).eq('id', rowId);
          } catch (err) {
            console.warn('Gagal update status habit Supabase:', err);
          }
        }
        updateHabitMetric();
      };
    });

    habitTable.appendChild(row);
    updateHabitMetric();
  }

  function updateHabitMetric() {
    var habitMetricVal = document.getElementById('habitMetricVal');
    if (!habitMetricVal || !habitTable) return;
    var rows = habitTable.querySelectorAll('.habit-table__row[data-habit]');
    var totalDone = 0;
    var totalPossible = 0;

    rows.forEach(function (r) {
      totalDone += r.querySelectorAll('.day-cell[data-checked="true"]').length;
      totalPossible += r.querySelectorAll('.day-cell:not([data-disabled="true"])').length;
    });

    habitMetricVal.textContent = totalPossible > 0 ? totalDone + '/' + totalPossible : '0/0';
  }

  document.getElementById('addHabitBtn')?.addEventListener('click', function () {
    openModal(habitModal);
  });

  // FIXED SAVE HABIT SUBMIT HANDLER
  document.getElementById('addHabitForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    try {
      var iconInput = /** @type {HTMLInputElement} */ (document.getElementById('habitIconInput'));
      var nameInput = /** @type {HTMLInputElement} */ (document.getElementById('habitNameInput'));

      var icon = iconInput ? (iconInput.value.trim() || '✨') : '✨';
      var name = nameInput ? nameInput.value.trim() : '';

      if (!name) {
        showToast('Nama habit tidak boleh kosong.', '⚠️');
        return;
      }

      var fullName = icon + ' ' + name;

      var activeDays = [false, false, false, false, false, false, false];
      var cbList = document.querySelectorAll('.habit-day-cb');
      cbList.forEach(function (cb) {
        var input = /** @type {HTMLInputElement} */ (cb);
        var dayIdx = parseInt(input.getAttribute('data-day') || '0');
        activeDays[dayIdx] = input.checked;
      });

      var completedDays = [false, false, false, false, false, false, false];

      if (currentUser && supabaseClient) {
        var res = await supabaseClient
          .from('habits')
          .insert([{
            user_id: currentUser.id,
            habit_name: fullName,
            completed_days: completedDays,
            active_days: activeDays
          }])
          .select();

        if (!res.error && res.data && res.data.length > 0) {
          renderRow(res.data[0].id, res.data[0].habit_name, res.data[0].completed_days, res.data[0].active_days);
          showToast('Habit baru berhasil ditambahkan!', '✨');
        } else {
          // Fallback lokal jika database error
          renderRow('local-' + Date.now(), fullName, completedDays, activeDays);
          showToast('Habit ditambahkan (Lokal)', '✨');
        }
      } else {
        // Mode Guest/Lokal
        renderRow('local-' + Date.now(), fullName, completedDays, activeDays);
        showToast('Habit ditambahkan (Lokal)', '✨');
      }

      closeModal(habitModal);

      // Reset Form Input
      if (nameInput) nameInput.value = '';
    } catch (err) {
      console.error('Error saat menyimpan habit:', err);
      showToast('Gagal menyimpan habit.', '⚠️');
    }
  });

  /* ==========================================================================
     JOURNAL SYSTEM (Composer + History) — Supabase-backed, per-user
     ========================================================================== */

  var journalText = /** @type {HTMLTextAreaElement} */ (document.getElementById('journalText'));
  var saveJournalBtn = document.getElementById('saveJournalBtn');
  var cancelEditJournalBtn = document.getElementById('cancelEditJournalBtn');
  var journalHistoryList = document.getElementById('journalHistoryList');
  var journalStatusEl = document.getElementById('journalStatus');

  var moodPills = document.querySelectorAll('.mood-tags .pill');
  var selectedMood = null;         // currently selected mood in the composer
  var editingJournalId = null;     // non-null while editing an existing entry
  var journalsData = [];           // in-memory cache of the current user's journals
  var journalIdPendingDelete = null;

  var MOOD_EMOJI = { Peaceful: '🌿', Calm: '☁️', Creative: '✨' };

  function moodEmoji(mood) {
    return MOOD_EMOJI[mood] || '📝';
  }

  function formatJournalTimestamp(iso) {
    var d = new Date(iso);
    var dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return dateStr + ' · ' + timeStr;
  }

  // Mood pill selection (toggleable, optional)
  moodPills.forEach(function (p) {
    /** @type {HTMLElement} */ (p).onclick = function () {
      var moodVal = p.getAttribute('data-mood');
      if (selectedMood === moodVal) {
        selectedMood = null;
        p.classList.remove('pill--active');
      } else {
        selectedMood = moodVal;
        moodPills.forEach(function (pill) { pill.classList.remove('pill--active'); });
        p.classList.add('pill--active');
      }
    };
  });

  function resetJournalComposer() {
    editingJournalId = null;
    if (journalText) journalText.value = '';
    selectedMood = null;
    moodPills.forEach(function (p) { p.classList.remove('pill--active'); });
    if (saveJournalBtn) saveJournalBtn.textContent = 'Save Entry';
    if (cancelEditJournalBtn) cancelEditJournalBtn.style.display = 'none';
  }

  function startEditJournal(entry) {
    editingJournalId = entry.id;
    if (journalText) journalText.value = entry.content;
    selectedMood = entry.mood || null;
    moodPills.forEach(function (p) {
      p.classList.toggle('pill--active', p.getAttribute('data-mood') === selectedMood);
    });
    if (saveJournalBtn) saveJournalBtn.textContent = 'Update Entry';
    if (cancelEditJournalBtn) cancelEditJournalBtn.style.display = 'inline-flex';
    document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEditJournalBtn?.addEventListener('click', function () {
    resetJournalComposer();
  });

  /* ---------- RENDER STATES ---------- */

  function renderJournalHistoryLoginRequired() {
    if (!journalHistoryList) return;
    journalHistoryList.innerHTML =
      '<div class="journal-empty-state">' +
        '<span class="journal-empty-state__icon">📖</span>' +
        '<p class="journal-empty-state__title">Login to see your personal journal history.</p>' +
      '</div>';
  }

  function renderJournalHistoryLoading() {
    if (!journalHistoryList) return;
    journalHistoryList.innerHTML =
      '<div class="journal-empty-state">' +
        '<p class="journal-empty-state__title">Loading your journal...</p>' +
      '</div>';
  }

  function renderJournalHistoryEmpty() {
    if (!journalHistoryList) return;
    journalHistoryList.innerHTML =
      '<div class="journal-empty-state">' +
        '<span class="journal-empty-state__icon">📖</span>' +
        '<p class="journal-empty-state__title">No journal entries yet</p>' +
        '<p class="journal-empty-state__desc">Your thoughts will appear here after you save your first journal.</p>' +
      '</div>';
  }

  function renderJournalHistoryError() {
    if (!journalHistoryList) return;
    journalHistoryList.innerHTML =
      '<div class="journal-empty-state">' +
        '<p class="journal-empty-state__title">Unable to load your journals.</p>' +
      '</div>';
  }

  function renderJournalCards() {
    if (!journalHistoryList) return;
    journalHistoryList.innerHTML = '';

    journalsData.forEach(function (entry) {
      var card = document.createElement('div');
      card.className = 'journal-entry-card';
      card.setAttribute('data-id', entry.id);

      var header = document.createElement('div');
      header.className = 'journal-entry-card__header';

      var moodSpan = document.createElement('span');
      moodSpan.className = 'journal-entry-card__mood';
      moodSpan.textContent = moodEmoji(entry.mood) + ' ' + (entry.mood || 'Journal');

      var dateSpan = document.createElement('span');
      dateSpan.className = 'journal-entry-card__date';
      dateSpan.textContent = formatJournalTimestamp(entry.created_at);

      header.appendChild(moodSpan);
      header.appendChild(dateSpan);

      var content = document.createElement('p');
      content.className = 'journal-entry-card__content';
      content.textContent = entry.content;

      var actions = document.createElement('div');
      actions.className = 'journal-entry-card__actions';

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon btn-icon--edit-journal';
      editBtn.textContent = '✏️ Edit';
      editBtn.addEventListener('click', function () { startEditJournal(entry); });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon btn-icon--delete-journal';
      delBtn.textContent = '🗑️ Delete';
      delBtn.addEventListener('click', function () { requestDeleteJournal(entry.id); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      card.appendChild(header);
      card.appendChild(content);
      card.appendChild(actions);
      journalHistoryList.appendChild(card);
    });
  }

  /* ---------- LOAD ---------- */

  async function loadJournal() {
    if (!journalHistoryList) return;

    if (!currentUser || !supabaseClient) {
      renderJournalHistoryLoginRequired();
      return;
    }

    renderJournalHistoryLoading();

    try {
      var res = await supabaseClient
        .from('journals')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (res.error) throw res.error;

      journalsData = res.data || [];

      if (journalsData.length === 0) {
        renderJournalHistoryEmpty();
      } else {
        renderJournalCards();
      }
    } catch (err) {
      console.error('Failed to load journals:', err);
      renderJournalHistoryError();
      showToast('Unable to load your journals.', '⚠️');
    }
  }

  /* ---------- SAVE (insert or update) ---------- */

  saveJournalBtn?.addEventListener('click', async function () {
    if (!currentUser) return openModal(authModal);
    if (!supabaseClient || !journalText) return;

    var textVal = journalText.value.trim();
    if (!textVal) return showToast('Tuliskan sesuatu sebelum menyimpan.', '💭');

    try {
      if (editingJournalId) {
        var updateRes = await supabaseClient
          .from('journals')
          .update({ content: textVal, mood: selectedMood, updated_at: new Date().toISOString() })
          .eq('id', editingJournalId)
          .eq('user_id', currentUser.id)
          .select();

        if (updateRes.error) throw updateRes.error;
        showToast('Journal updated ✨', '✏️');
      } else {
        var insertRes = await supabaseClient
          .from('journals')
          .insert([{ user_id: currentUser.id, content: textVal, mood: selectedMood }])
          .select();

        if (insertRes.error) throw insertRes.error;
        showToast('Journal saved successfully ✨', '📝');
      }

      resetJournalComposer();

      if (journalStatusEl) {
        journalStatusEl.textContent = 'Tersimpan ✓';
        setTimeout(function () { journalStatusEl.textContent = ''; }, 2500);
      }

      loadJournal();
    } catch (err) {
      console.error('Failed to save journal:', err);
      showToast('Unable to save your journal.', '⚠️');
    }
  });

  /* ---------- DELETE (with confirmation) ---------- */

  function requestDeleteJournal(id) {
    journalIdPendingDelete = id;
    openModal(journalDeleteModal);
  }

  document.getElementById('cancelDeleteJournalBtn')?.addEventListener('click', function () {
    journalIdPendingDelete = null;
    closeModal(journalDeleteModal);
  });

  document.getElementById('confirmDeleteJournalBtn')?.addEventListener('click', async function () {
    if (!journalIdPendingDelete || !currentUser || !supabaseClient) {
      closeModal(journalDeleteModal);
      return;
    }

    var idToDelete = journalIdPendingDelete;

    try {
      var res = await supabaseClient
        .from('journals')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', currentUser.id);

      if (res.error) throw res.error;

      showToast('Journal deleted', '🗑️');
      await loadJournal(); // re-fetch from Supabase so the list stays the source of truth
    } catch (err) {
      console.error('Failed to delete journal:', err);
      showToast('Unable to delete your journal.', '⚠️');
    } finally {
      journalIdPendingDelete = null;
      closeModal(journalDeleteModal);
    }
  });

  /* ==========================================================================
     PROFILE & ACCOUNT SETTINGS — Supabase Auth + Storage + `profiles` table
     ========================================================================== */

  var profileAvatarImg = /** @type {HTMLImageElement} */ (document.getElementById('profileAvatarImg'));
  var profileAvatarFallback = document.getElementById('profileAvatarFallback');
  var avatarFileInput = /** @type {HTMLInputElement} */ (document.getElementById('avatarFileInput'));
  var removeAvatarBtn = document.getElementById('removeAvatarBtn');

  var profileUsernameInput = /** @type {HTMLInputElement} */ (document.getElementById('profileUsernameInput'));
  var profileEmailInput = /** @type {HTMLInputElement} */ (document.getElementById('profileEmailInput'));
  var usernameMsg = document.getElementById('usernameMsg');
  var emailMsg = document.getElementById('emailMsg');

  var togglePasswordFormBtn = document.getElementById('togglePasswordFormBtn');
  var passwordChangeForm = document.getElementById('passwordChangeForm');
  var currentPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('currentPasswordInput'));
  var newPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('newPasswordInput'));
  var confirmPasswordInput = /** @type {HTMLInputElement} */ (document.getElementById('confirmPasswordInput'));
  var passwordMsg = document.getElementById('passwordMsg');
  var updatePasswordBtn = document.getElementById('updatePasswordBtn');

  var displayNameInput = /** @type {HTMLInputElement} */ (document.getElementById('displayNameInput'));
  var bioInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('bioInput'));
  var locationInput = /** @type {HTMLInputElement} */ (document.getElementById('locationInput'));
  var birthdayInput = /** @type {HTMLInputElement} */ (document.getElementById('birthdayInput'));

  var saveProfileBtn = document.getElementById('saveProfileBtn');

  function setFieldMsg(el, msg, isError) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('field-msg--error', !!isError);
    el.classList.toggle('field-msg--success', !isError && !!msg);
  }

  function setAvatarPreview(url) {
    if (!profileAvatarImg || !profileAvatarFallback) return;
    if (url) {
      profileAvatarImg.src = url;
      profileAvatarImg.style.display = 'block';
      profileAvatarFallback.style.display = 'none';
    } else {
      profileAvatarImg.style.display = 'none';
      profileAvatarFallback.style.display = 'flex';
      var label = (currentProfile && (currentProfile.display_name || currentProfile.username)) ||
                  (currentUser && currentUser.email) || 'G';
      profileAvatarFallback.textContent = label.charAt(0).toUpperCase();
    }
  }

  function setAvatarActionsBusy(isBusy) {
    var changeLabel = document.querySelector('label[for="avatarFileInput"]');
    if (changeLabel) changeLabel.classList.toggle('is-disabled', isBusy);
    if (removeAvatarBtn) removeAvatarBtn.disabled = isBusy;
    if (avatarFileInput) avatarFileInput.disabled = isBusy;
  }

  /**
   * Fetches the current user's profile row, creating one on first login if
   * it doesn't exist yet (keeps the username already stored at sign-up).
   */
  async function loadProfile() {
    if (!currentUser || !supabaseClient) {
      currentProfile = null;
      return null;
    }
    try {
      var res = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (res.error) throw res.error;

      if (res.data) {
        currentProfile = res.data;
      } else {
        var fallbackUsername = (currentUser.user_metadata && currentUser.user_metadata.username) || null;
        var insertRes = await supabaseClient
          .from('profiles')
          .insert([{ user_id: currentUser.id, username: fallbackUsername }])
          .select()
          .single();
        currentProfile = insertRes.error ? null : insertRes.data;
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
      currentProfile = null;
    }
    return currentProfile;
  }

  async function isUsernameTaken(username) {
    var res = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .neq('user_id', currentUser.id)
      .maybeSingle();
    if (res.error) throw res.error;
    return !!res.data;
  }

  function openProfileModal() {
    if (!currentUser) { openModal(authModal); return; }

    if (profileUsernameInput) profileUsernameInput.value = (currentProfile && currentProfile.username) || '';
    if (profileEmailInput) profileEmailInput.value = currentUser.email || '';
    if (displayNameInput) displayNameInput.value = (currentProfile && currentProfile.display_name) || '';
    if (bioInput) bioInput.value = (currentProfile && currentProfile.bio) || '';
    if (locationInput) locationInput.value = (currentProfile && currentProfile.location) || '';
    if (birthdayInput) birthdayInput.value = (currentProfile && currentProfile.birthday) || '';

    setAvatarPreview(currentProfile && currentProfile.avatar_url ? currentProfile.avatar_url : null);

    if (passwordChangeForm) passwordChangeForm.style.display = 'none';
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    setFieldMsg(passwordMsg, '', false);
    setFieldMsg(usernameMsg, '', false);
    setFieldMsg(emailMsg, '', false);

    openModal(profileModal);
  }

  document.getElementById('closeProfileModalBtn')?.addEventListener('click', function () { closeModal(profileModal); });
  document.getElementById('closeProfileModalBtn2')?.addEventListener('click', function () { closeModal(profileModal); });

  /* ----- Profile Photo (Supabase Storage) ----- */

  function validateAvatarFile(file) {
    var allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.indexOf(file.type) === -1) return 'Only JPG, PNG, or WebP images are allowed.';
    var maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) return 'Image must be smaller than 3MB.';
    return null;
  }

  async function uploadAvatar(file) {
    if (!currentUser || !supabaseClient) return;

    var validationError = validateAvatarFile(file);
    if (validationError) {
      showToast(validationError, '⚠️');
      return;
    }

    // Instant local preview while the upload runs
    var localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);
    setAvatarActionsBusy(true);

    try {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var storagePath = currentUser.id + '/profile.' + ext;

      var uploadRes = await supabaseClient
        .storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadRes.error) throw uploadRes.error;

      var publicUrlRes = supabaseClient.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
      var publicUrl = publicUrlRes.data.publicUrl + '?t=' + Date.now(); // cache-bust so the new photo shows immediately

      var upsertRes = await supabaseClient
        .from('profiles')
        .upsert({ user_id: currentUser.id, avatar_url: publicUrl }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertRes.error) throw upsertRes.error;

      currentProfile = upsertRes.data;
      setAvatarPreview(publicUrl);
      updateUIUser(currentUser, currentProfile);
      showToast('Profile photo updated', '🖼️');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarPreview(currentProfile && currentProfile.avatar_url ? currentProfile.avatar_url : null);
      showToast('Failed to upload photo. Please try again.', '⚠️');
    } finally {
      setAvatarActionsBusy(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  async function removeAvatar() {
    if (!currentUser || !supabaseClient) return;
    if (!currentProfile || !currentProfile.avatar_url) {
      showToast('No profile photo to remove.', 'ℹ️');
      return;
    }

    setAvatarActionsBusy(true);
    try {
      var listRes = await supabaseClient.storage.from(AVATAR_BUCKET).list(currentUser.id);
      if (listRes.data && listRes.data.length > 0) {
        var pathsToRemove = listRes.data.map(function (f) { return currentUser.id + '/' + f.name; });
        await supabaseClient.storage.from(AVATAR_BUCKET).remove(pathsToRemove);
      }

      var upsertRes = await supabaseClient
        .from('profiles')
        .upsert({ user_id: currentUser.id, avatar_url: null }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertRes.error) throw upsertRes.error;

      currentProfile = upsertRes.data;
      setAvatarPreview(null);
      updateUIUser(currentUser, currentProfile);
      showToast('Profile photo removed', '🗑️');
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      showToast('Failed to remove photo. Please try again.', '⚠️');
    } finally {
      setAvatarActionsBusy(false);
    }
  }

  avatarFileInput?.addEventListener('change', function (e) {
    var target = /** @type {HTMLInputElement} */ (e.target);
    var file = target.files && target.files[0];
    if (file) uploadAvatar(file);
    target.value = ''; // allow re-selecting the same file later
  });

  removeAvatarBtn?.addEventListener('click', removeAvatar);

  /* ----- Password visibility toggles ----- */
  document.querySelectorAll('.password-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });

  /* ----- Change Password (Supabase Auth) ----- */

  togglePasswordFormBtn?.addEventListener('click', function () {
    if (!passwordChangeForm) return;
    var isVisible = passwordChangeForm.style.display !== 'none';
    passwordChangeForm.style.display = isVisible ? 'none' : 'block';
  });

  updatePasswordBtn?.addEventListener('click', async function () {
    if (!currentUser || !supabaseClient) return;

    var currentPass = currentPasswordInput ? currentPasswordInput.value : '';
    var newPass = newPasswordInput ? newPasswordInput.value : '';
    var confirmPass = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (!currentPass || !newPass || !confirmPass) {
      setFieldMsg(passwordMsg, 'Please fill in all password fields.', true);
      return;
    }
    if (newPass.length < 6) {
      setFieldMsg(passwordMsg, 'New password must be at least 6 characters.', true);
      return;
    }
    if (newPass !== confirmPass) {
      setFieldMsg(passwordMsg, 'New password and confirmation do not match.', true);
      return;
    }

    updatePasswordBtn.disabled = true;
    var originalLabel = updatePasswordBtn.textContent;
    updatePasswordBtn.textContent = 'Updating...';

    try {
      // Verify the current password by re-authenticating before changing it
      var reauth = await supabaseClient.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPass
      });
      if (reauth.error) {
        setFieldMsg(passwordMsg, 'Current password is incorrect.', true);
        return;
      }

      var res = await supabaseClient.auth.updateUser({ password: newPass });
      if (res.error) throw res.error;

      setFieldMsg(passwordMsg, 'Password updated successfully.', false);
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      showToast('Password updated successfully.', '🔒');
    } catch (err) {
      console.error('Failed to update password:', err);
      setFieldMsg(passwordMsg, 'Failed to update password. Please try again.', true);
    } finally {
      updatePasswordBtn.disabled = false;
      updatePasswordBtn.textContent = originalLabel;
    }
  });

  /* ----- Save Changes: username, display name, bio, location, birthday, email ----- */

  saveProfileBtn?.addEventListener('click', async function () {
    if (!currentUser || !supabaseClient) return;

    var username = profileUsernameInput ? profileUsernameInput.value.trim() : '';
    var newEmail = profileEmailInput ? profileEmailInput.value.trim() : '';
    var displayName = displayNameInput ? displayNameInput.value.trim() : '';
    var bio = bioInput ? bioInput.value.trim() : '';
    var location = locationInput ? locationInput.value.trim() : '';
    var birthday = birthdayInput && birthdayInput.value ? birthdayInput.value : null;

    setFieldMsg(usernameMsg, '', false);
    setFieldMsg(emailMsg, '', false);

    if (!username) {
      setFieldMsg(usernameMsg, 'Username cannot be empty.', true);
      return;
    }

    saveProfileBtn.disabled = true;
    var originalLabel = saveProfileBtn.textContent;
    saveProfileBtn.textContent = 'Saving...';

    try {
      // Only check uniqueness if the username actually changed
      if (!currentProfile || username !== currentProfile.username) {
        var taken = await isUsernameTaken(username);
        if (taken) {
          setFieldMsg(usernameMsg, 'Username is already taken.', true);
          return; // keep the previously saved username untouched
        }
      }

      var upsertRes = await supabaseClient
        .from('profiles')
        .upsert({
          user_id: currentUser.id,
          username: username,
          display_name: displayName || null,
          bio: bio || null,
          location: location || null,
          birthday: birthday
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertRes.error) throw upsertRes.error;
      currentProfile = upsertRes.data;

      // Email change goes through Supabase Auth, not the profiles table
      if (newEmail && newEmail !== currentUser.email) {
        var emailRes = await supabaseClient.auth.updateUser({ email: newEmail });
        if (emailRes.error) {
          setFieldMsg(emailMsg, 'Failed to change email: ' + emailRes.error.message, true);
          showToast('Profile saved, but email change failed.', '⚠️');
        } else {
          setFieldMsg(emailMsg, 'A confirmation email has been sent to your new email address. Please check your inbox to confirm the change.', false);
          showToast('Confirmation email sent to your new address.', '📧');
        }
      } else {
        showToast('Profile updated successfully.', '✅');
      }

      updateUIUser(currentUser, currentProfile);
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to update profile. Please try again.', '⚠️');
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = originalLabel;
    }
  });

  /* ==========================================================================
     INITIAL SESSION LOAD
     Runs LAST, after every element reference (habitTable, journalHistoryList,
     profile inputs, etc.) and every load-and-render function above has been
     defined and wired up. This fixes the refresh bug: previously this ran
     near the top of the script, right after an `await`, before
     journalHistoryList/habitTable had been assigned yet — so
     loadJournal()/loadHabits() silently no-opped on the very first page load
     and only "worked" after a save re-triggered them once the whole script
     had finished running.
     ========================================================================== */
  if (supabaseClient) {
    try {
      var sessionRes = await supabaseClient.auth.getSession();
      if (sessionRes.data && sessionRes.data.session) {
        currentUser = sessionRes.data.session.user;
        await loadProfile();
        updateUIUser(currentUser, currentProfile);
        await loadHabits();
        await loadJournal();
      } else {
        loadDefaultHabits();
        renderJournalHistoryLoginRequired();
      }
    } catch (e) {
      console.warn('Auth session check failed, using local mode:', e);
      loadDefaultHabits();
      renderJournalHistoryLoginRequired();
    }
  } else {
    loadDefaultHabits();
    renderJournalHistoryLoginRequired();
  }

});
