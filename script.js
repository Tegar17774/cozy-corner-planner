/* ==========================================================================
   COZY CORNER PLANNER — Engine JS (Production & Commercial Grade)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async function () {
  
  var SUPABASE_URL = 'https://udtiljauxgtneboirlgd.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdGlsamF1eGd0bmVib2lybGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTY5MzcsImV4cCI6MjEwNTIzMjkzN30.jzP5qdrI5jC-KR9YIQguFxWMQloOJgAIIk1d9_XduhE';
  
  var supabaseClient = null;
  if (typeof window['supabase'] !== 'undefined') {
    try {
      supabaseClient = window['supabase'].createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (err) {
      console.warn('Supabase client init failed:', err);
    }
  }

  var currentUser = null;

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

  /* ---------- INITIAL SESSION LOAD ---------- */
  if (supabaseClient) {
    try {
      var sessionRes = await supabaseClient.auth.getSession();
      if (sessionRes.data && sessionRes.data.session) {
        currentUser = sessionRes.data.session.user;
        updateUIUser(currentUser);
        loadHabits();
        loadJournal();
      } else {
        loadDefaultHabits();
      }
    } catch (e) {
      console.warn('Auth session check failed, using local mode:', e);
      loadDefaultHabits();
    }
  } else {
    loadDefaultHabits();
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
      updateUIUser(currentUser);
      loadHabits();
      loadJournal();
      showToast('Berhasil Login! Selamat datang.', '🌿');
    };
  }

  function updateUIUser(userObj) {
    var btn = document.getElementById('loginBtn');
    if (btn) {
      btn.textContent = 'Logout';
      btn.onclick = async function () {
        if (supabaseClient) await supabaseClient.auth.signOut();
        location.reload();
      };
    }

    var greetingEl = document.getElementById('userGreeting');
    var avatarEl = document.getElementById('userAvatar');

    if (userObj && userObj.user_metadata && userObj.user_metadata.username) {
      var name = userObj.user_metadata.username;
      if (greetingEl) greetingEl.textContent = 'Welcome, ' + name + ' 👋';
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    } else if (userObj && userObj.email) {
      var emailName = userObj.email.split('@')[0];
      if (greetingEl) greetingEl.textContent = 'Welcome, ' + emailName + ' 👋';
      if (avatarEl) avatarEl.textContent = emailName.charAt(0).toUpperCase();
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

  /* ---------- JOURNAL & MOOD ---------- */
  var moodPills = document.querySelectorAll('.mood-tags .pill');
  moodPills.forEach(function (p) {
    /** @type {HTMLElement} */ (p).onclick = function () {
      moodPills.forEach(function(pill){ pill.classList.remove('pill--active'); });
      p.classList.add('pill--active');
    };
  });

  var journalText = /** @type {HTMLTextAreaElement} */ (document.getElementById('journalText'));
  async function loadJournal() {
    if (!currentUser || !journalText || !supabaseClient) return;
    try {
      var res = await supabaseClient.from('journals').select('content').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(1);
      if (res.data && res.data.length > 0) journalText.value = res.data[0].content;
    } catch (err) {
      console.warn('Gagal memuat jurnal:', err);
    }
  }

  document.getElementById('saveJournalBtn')?.addEventListener('click', async function () {
    if (!currentUser) return openModal(authModal);
    if (!supabaseClient || !journalText) return;

    var textVal = journalText.value;
    if (!textVal.trim()) return showToast('Tuliskan sesuatu sebelum menyimpan.', '💭');

    try {
      var res = await supabaseClient.from('journals').insert([{ user_id: currentUser.id, content: textVal }]);
      if (!res.error) {
        showToast('Jurnal tersimpan dengan aman!', '📝');
        var status = document.getElementById('journalStatus');
        if (status) {
          status.textContent = 'Tersimpan ✓';
          setTimeout(function () { status.textContent = ''; }, 2500);
        }
      }
    } catch (err) {
      showToast('Gagal menyimpan jurnal.', '⚠️');
    }
  });
});