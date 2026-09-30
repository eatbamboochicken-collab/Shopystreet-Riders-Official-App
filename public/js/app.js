/**
 * Shopystreet Riders — V1 Vanilla JavaScript Client
 * Futuristic, Sky Blue brand, zero frameworks, installable PWA.
 */

(() => {
  'use strict';

  // PRODUCTION WORKER API CONFIGURATION
  const PRODUCTION_API_URL = 'https://shopystreet-delivery-api.warstreett.workers.dev';
  const TOKEN_STORAGE_KEY = 'shopystreet_rider_session_token';

  // APPLICATION STATE (Zero hardcoded rider identity)
  const state = {
    token: null,
    rider: null,
    activeJob: null,
    availableRequests: [],
    notifications: [],
    earnings: {
      today_earnings: 0,
      today_deliveries: 0,
      week_earnings: 0,
      week_deliveries: 0,
      recent_payouts: [],
    },
    currentTab: 'home',
    selectedRequest: null,
    deferredInstallPrompt: null,
    locationInterval: null,
    pollInterval: null,
    locationPermissionDenied: false,
    locationPermissionWarningShown: false,
  };

  // DOM ELEMENTS
  const el = {
    installBtn: document.getElementById('install-btn'),
    btnNotifications: document.getElementById('btn-notifications'),
    notifBadge: document.getElementById('notif-badge'),

    // Authentication Elements
    screenLogin: document.getElementById('screen-login'),
    loginForm: document.getElementById('login-form'),
    loginPhone: document.getElementById('login-phone'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    btnLogout: document.getElementById('btn-logout'),

    // Registration Elements (Checkpoint 3)
    screenRegister: document.getElementById('screen-register'),
    registerForm: document.getElementById('register-form'),
    regName: document.getElementById('reg-name'),
    regPhone: document.getElementById('reg-phone'),
    regNationalId: document.getElementById('reg-national-id'),
    regVehicleType: document.getElementById('reg-vehicle-type'),
    regVehicleTrigger: document.getElementById('reg-vehicle-trigger'),
    vehicleTriggerTitle: document.getElementById('vehicle-trigger-title'),
    vehicleTriggerDesc: document.getElementById('vehicle-trigger-desc'),
    vehicleTriggerIcon: document.getElementById('vehicle-trigger-icon'),
    inlineVehiclePicker: document.getElementById('inline-vehicle-picker'),
    vehicleOptionsInline: document.getElementById('vehicle-options-inline'),
    regPassword: document.getElementById('reg-password'),
    regConfirmPassword: document.getElementById('reg-confirm-password'),
    registerError: document.getElementById('register-error'),
    btnRegisterSubmit: document.getElementById('btn-register-submit'),
    registerSuccessCard: document.getElementById('register-success-card'),
    regSuccessName: document.getElementById('reg-success-name'),
    regSuccessPhone: document.getElementById('reg-success-phone'),
    btnRegSuccessLogin: document.getElementById('btn-reg-success-login'),

    // Application Status Elements (Checkpoint 3)
    screenAppStatus: document.getElementById('screen-application-status'),
    statusLookupCard: document.getElementById('status-lookup-card'),
    statusLookupForm: document.getElementById('status-lookup-form'),
    statusLookupError: document.getElementById('status-lookup-error'),
    statusPhone: document.getElementById('status-phone'),
    statusPassword: document.getElementById('status-password'),
    btnStatusLookupSubmit: document.getElementById('btn-status-lookup-submit'),
    statusResultCard: document.getElementById('status-result-card'),
    appStatusBadge: document.getElementById('app-status-badge'),
    appStatusTitle: document.getElementById('app-status-title'),
    appStatusSubtitle: document.getElementById('app-status-subtitle'),
    appInfoName: document.getElementById('app-info-name'),
    appInfoPhone: document.getElementById('app-info-phone'),
    appInfoVehicle: document.getElementById('app-info-vehicle'),
    appInfoId: document.getElementById('app-info-id'),
    appStatePendingBox: document.getElementById('app-state-pending-box'),
    appStateApprovedBox: document.getElementById('app-state-approved-box'),
    appStateRejectedBox: document.getElementById('app-state-rejected-box'),
    appRejectionReason: document.getElementById('app-rejection-reason'),
    btnAppLoginNow: document.getElementById('btn-app-login-now'),
    btnStatusRefresh: document.getElementById('btn-status-refresh'),
    btnStatusBackLogin: document.getElementById('btn-status-back-login'),

    // Navigation Links
    linkLoginToRegister: document.getElementById('link-login-to-register'),
    linkLoginToStatus: document.getElementById('link-login-to-status'),
    linkRegisterToLogin: document.getElementById('link-register-to-login'),
    linkRegisterToStatus: document.getElementById('link-register-to-status'),
    linkStatusToLogin: document.getElementById('link-status-to-login'),
    linkStatusToRegister: document.getElementById('link-status-to-register'),

    // Screens
    screenHome: document.getElementById('screen-home'),
    screenActive: document.getElementById('screen-active'),
    screenEarnings: document.getElementById('screen-earnings'),
    screenProfile: document.getElementById('screen-profile'),

    // Home elements
    statusIndicator: document.getElementById('status-indicator'),
    statusTitle: document.getElementById('status-title'),
    statusSubtitle: document.getElementById('status-subtitle'),
    btnToggleOnline: document.getElementById('btn-toggle-online'),
    activeBanner: document.getElementById('active-banner'),
    activeBannerEta: document.getElementById('active-banner-eta'),
    activeBannerMerchant: document.getElementById('active-banner-merchant'),
    activeBannerStatus: document.getElementById('active-banner-status'),
    requestsCount: document.getElementById('requests-count'),
    requestsCountBadge: document.getElementById('requests-count-badge'),
    requestsContainer: document.getElementById('requests-container'),
    homeTodayEarnings: document.getElementById('home-today-earnings'),
    homeTodayTrips: document.getElementById('home-today-trips'),
    homeRecentActivityContainer: document.getElementById('home-recent-activity-container'),
    todayDatePill: document.getElementById('today-date-pill'),

    // Deliveries (Active screen)
    activeEmpty: document.getElementById('active-empty'),
    activeCard: document.getElementById('active-card'),
    activeJobId: document.getElementById('active-job-id'),
    activeStatusText: document.getElementById('active-status-text'),
    activeMerchant: document.getElementById('active-merchant'),
    activeOrderId: document.getElementById('active-order-id'),
    activePayout: document.getElementById('active-payout'),
    activePickupName: document.getElementById('active-pickup-name'),
    activePickupAddr: document.getElementById('active-pickup-addr'),
    activePickupNotes: document.getElementById('active-pickup-notes'),
    activeDropoffName: document.getElementById('active-dropoff-name'),
    activeDropoffAddr: document.getElementById('active-dropoff-addr'),
    activeDropoffInstructions: document.getElementById('active-dropoff-instructions'),
    activeCustomerPhone: document.getElementById('active-customer-phone'),
    activePackageDesc: document.getElementById('active-package-desc'),
    btnActiveAction: document.getElementById('btn-active-action'),
    btnNavigate: document.getElementById('btn-navigate'),
    btnOpenIncident: document.getElementById('btn-open-incident'),

    // Earnings
    statTodayEarnings: document.getElementById('stat-today-earnings'),
    statTodayTrips: document.getElementById('stat-today-trips'),
    statWeekEarnings: document.getElementById('stat-week-earnings'),
    statWeekTrips: document.getElementById('stat-week-trips'),
    payoutsContainer: document.getElementById('payouts-container'),

    // Profile
    profileAvatar: document.getElementById('profile-avatar'),
    profileName: document.getElementById('profile-name'),
    profilePhone: document.getElementById('profile-phone'),
    profileForm: document.getElementById('profile-form'),
    inputRiderName: document.getElementById('input-rider-name'),
    inputRiderPhone: document.getElementById('input-rider-phone'),
    inputRiderVehicle: document.getElementById('input-rider-vehicle'),
    inputRiderReg: document.getElementById('input-rider-reg'),

    // Modals
    modalRequest: document.getElementById('modal-request'),
    modalReqMerchant: document.getElementById('modal-req-merchant'),
    modalReqSourceTag: document.getElementById('modal-req-source-tag'),
    modalReqJobId: document.getElementById('modal-req-job-id'),
    modalReqPayout: document.getElementById('modal-req-payout'),
    modalReqPickup: document.getElementById('modal-req-pickup'),
    modalReqDropoff: document.getElementById('modal-req-dropoff'),
    modalReqDistance: document.getElementById('modal-req-distance'),
    modalReqEta: document.getElementById('modal-req-eta'),
    modalReqError: document.getElementById('modal-req-error'),
    btnAcceptJob: document.getElementById('btn-accept-job'),
    btnCloseRequest: document.getElementById('btn-close-request'),

    modalNotifications: document.getElementById('modal-notifications'),
    notificationsList: document.getElementById('notifications-list'),
    btnCloseNotif: document.getElementById('btn-close-notif'),

    // Proof of Delivery Elements
    modalProof: document.getElementById('modal-proof'),
    proofJobId: document.getElementById('proof-job-id'),
    proofCustomerName: document.getElementById('proof-customer-name'),
    proofDropoffAddr: document.getElementById('proof-dropoff-addr'),
    proofForm: document.getElementById('proof-form'),
    proofError: document.getElementById('proof-error'),
    proofTypeSelect: document.getElementById('proof-type-select'),
    proofCodeGroup: document.getElementById('proof-code-group'),
    proofVerificationCode: document.getElementById('proof-verification-code'),
    proofRefGroup: document.getElementById('proof-ref-group'),
    proofRefLabel: document.getElementById('proof-ref-label'),
    proofReferenceInput: document.getElementById('proof-reference-input'),
    btnSubmitProof: document.getElementById('btn-submit-proof'),
    btnCloseProof: document.getElementById('btn-close-proof'),
    btnCancelProof: document.getElementById('btn-cancel-proof'),

    // Incident Reporting Elements
    modalIncident: document.getElementById('modal-incident'),
    incidentForm: document.getElementById('incident-form'),
    incidentError: document.getElementById('incident-error'),
    incidentTypeSelect: document.getElementById('incident-type-select'),
    incidentNotesInput: document.getElementById('incident-notes-input'),
    btnSubmitIncident: document.getElementById('btn-submit-incident'),
    btnCloseIncident: document.getElementById('btn-close-incident'),
    btnCancelIncident: document.getElementById('btn-cancel-incident'),

    modalDispatchTest: document.getElementById('modal-dispatch-test'),
    btnOpenDispatchTest: document.getElementById('btn-open-dispatch-test'),
    btnCloseDispatchTest: document.getElementById('btn-close-dispatch-test'),
    btnDispatchBamboo: document.getElementById('btn-dispatch-bamboo'),
    btnDispatchSend: document.getElementById('btn-dispatch-send'),
    btnDispatchRace: document.getElementById('btn-dispatch-race'),
    raceTestResult: document.getElementById('race-test-result'),

    // Nav
    navItems: document.querySelectorAll('.nav-item'),
    navActiveDot: document.getElementById('nav-active-dot'),
    toast: document.getElementById('toast'),
  };

  // TOAST HELPER
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // API UTILITY
  // ==========================================
  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : `${PRODUCTION_API_URL}${path}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ==========================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================
  let lastApplicantCredentials = { phone: '', password: '' };

  function hideAllAuthScreens() {
    if (el.screenLogin) el.screenLogin.style.display = 'none';
    if (el.screenRegister) el.screenRegister.style.display = 'none';
    if (el.screenAppStatus) el.screenAppStatus.style.display = 'none';
  }

  function showLoginScreen(errorMessage = null, prefillPhone = null) {
    document.body.classList.add('auth-mode');
    hideAllAuthScreens();
    if (el.screenLogin) el.screenLogin.style.display = 'flex';

    if (prefillPhone && el.loginPhone) {
      el.loginPhone.value = prefillPhone;
    }

    // Deactivate application tabs
    el.screenHome.classList.remove('active');
    el.screenActive.classList.remove('active');
    el.screenEarnings.classList.remove('active');
    el.screenProfile.classList.remove('active');

    if (errorMessage && el.loginError) {
      el.loginError.textContent = errorMessage;
      el.loginError.style.display = 'block';
    } else if (el.loginError) {
      el.loginError.textContent = '';
      el.loginError.style.display = 'none';
    }

    if (el.btnLoginSubmit) {
      el.btnLoginSubmit.disabled = false;
      el.btnLoginSubmit.innerHTML = '<span>LOGIN</span>';
    }

    if (el.loginPassword) {
      el.loginPassword.value = '';
    }

    // Stop active background tracking & polling while unauthenticated
    if (state.locationInterval) {
      clearInterval(state.locationInterval);
      state.locationInterval = null;
    }
    state.locationPermissionDenied = false;
    state.locationPermissionWarningShown = false;
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
      state.pollInterval = null;
    }
  }

  function renderExistingApplicantNotice(phone, password) {
    if (!el.registerError) return;

    el.registerError.className = 'reg-error-box is-existing-account';
    el.registerError.innerHTML = `
      <div class="reg-conflict-header">
        <svg class="reg-conflict-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div class="reg-conflict-text">
          <h4 class="reg-conflict-title">An account already exists for this phone number.</h4>
          <p class="reg-conflict-subtitle">Sign in with your password to continue to your rider account.</p>
        </div>
      </div>
      <div class="reg-conflict-actions">
        <button type="button" class="reg-conflict-btn-status" id="err-btn-login-direct">
          <span>SIGN IN WITH THIS PHONE &rarr;</span>
        </button>
      </div>
    `;
    el.registerError.style.display = 'flex';

    const btnLoginDirect = el.registerError.querySelector('#err-btn-login-direct');
    if (btnLoginDirect) {
      btnLoginDirect.addEventListener('click', () => {
        showLoginScreen(null, phone);
        if (password && el.loginPassword) {
          el.loginPassword.value = password;
        }
      });
    }

    try {
      el.registerError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  }

  function renderRegError(msg) {
    if (!el.registerError) return;
    const isExistingAccount =
      typeof msg === 'string' &&
      (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('existing'));

    if (isExistingAccount) {
      const phone = el.regPhone ? el.regPhone.value.trim() : '';
      const password = el.regPassword ? el.regPassword.value : '';
      renderExistingApplicantNotice(phone, password);
      return;
    }

    el.registerError.className = 'reg-error-box';
    el.registerError.innerHTML = `
      <div class="error-content">
        <svg class="error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
    el.registerError.style.display = 'flex';

    try {
      el.registerError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (_) {}
  }

  function showRegisterScreen(errorMessage = null) {
    document.body.classList.add('auth-mode');
    hideAllAuthScreens();
    closeInlineVehicleOptions();
    if (el.screenRegister) el.screenRegister.style.display = 'flex';
    if (el.registerForm) el.registerForm.style.display = 'block';
    if (el.registerSuccessCard) el.registerSuccessCard.style.display = 'none';

    if (errorMessage && el.registerError) {
      renderRegError(errorMessage);
    } else if (el.registerError) {
      el.registerError.innerHTML = '';
      el.registerError.className = 'reg-error-box';
      el.registerError.style.display = 'none';
    }

    if (el.btnRegisterSubmit) {
      el.btnRegisterSubmit.disabled = false;
      el.btnRegisterSubmit.innerHTML = '<span>CREATE RIDER ACCOUNT</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
    }
  }

  function renderRegistrationSuccess(phone, name) {
    if (el.registerForm) el.registerForm.style.display = 'none';
    if (el.registerError) el.registerError.style.display = 'none';
    if (el.regSuccessName) el.regSuccessName.textContent = name || 'Courier Partner';
    if (el.regSuccessPhone) el.regSuccessPhone.textContent = phone || '';
    if (el.registerSuccessCard) el.registerSuccessCard.style.display = 'flex';
    try {
      el.registerSuccessCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (_) {}
  }

  function showStatusLookupScreen(errorMessage = null, prefillPhone = null, prefillPassword = null) {
    document.body.classList.add('auth-mode');
    hideAllAuthScreens();
    if (el.screenAppStatus) el.screenAppStatus.style.display = 'flex';
    if (el.statusLookupCard) el.statusLookupCard.style.display = 'block';
    if (el.statusResultCard) el.statusResultCard.style.display = 'none';

    const phoneToUse = prefillPhone || lastApplicantCredentials.phone || '';
    if (phoneToUse && el.statusPhone) {
      el.statusPhone.value = phoneToUse;
    }

    const pwdToUse = prefillPassword || lastApplicantCredentials.password || '';
    if (pwdToUse && el.statusPassword) {
      el.statusPassword.value = pwdToUse;
    }

    if (errorMessage && el.statusLookupError) {
      el.statusLookupError.textContent = errorMessage;
      el.statusLookupError.style.display = 'block';
    } else if (el.statusLookupError) {
      el.statusLookupError.textContent = '';
      el.statusLookupError.style.display = 'none';
    }

    if (el.btnStatusLookupSubmit) {
      el.btnStatusLookupSubmit.disabled = false;
      el.btnStatusLookupSubmit.innerHTML = '<span>CHECK APPLICATION STATUS</span>';
    }

    if (el.statusPhone && el.statusPhone.value && el.statusPassword && !el.statusPassword.value) {
      setTimeout(() => {
        try { el.statusPassword.focus(); } catch (_) {}
      }, 50);
    }
  }

  function renderApplicationStatus(app) {
    if (!app) return;
    document.body.classList.add('auth-mode');
    hideAllAuthScreens();
    if (el.screenAppStatus) el.screenAppStatus.style.display = 'flex';
    if (el.statusLookupCard) el.statusLookupCard.style.display = 'none';
    if (el.statusResultCard) el.statusResultCard.style.display = 'block';

    const applicantName = app.name || 'Courier Applicant';
    const applicantPhone = app.phone || '';
    const vehicleType = app.vehicle_type || 'motorbike';
    const appId = app.id || `app_${Date.now()}`;
    const status = String(app.application_status || app.account_status || 'pending').toLowerCase();
    const accountStatus = String(app.account_status || '').toLowerCase();

    if (el.appInfoName) el.appInfoName.textContent = applicantName;
    if (el.appInfoPhone) el.appInfoPhone.textContent = applicantPhone;
    if (el.appInfoVehicle) {
      el.appInfoVehicle.textContent = vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
    }
    if (el.appInfoId) el.appInfoId.textContent = appId;

    if (status === 'approved' || accountStatus === 'active') {
      if (el.appStatusBadge) {
        el.appStatusBadge.className = 'badge-status-pill badge-approved';
        el.appStatusBadge.textContent = 'APPLICATION APPROVED';
      }
      if (el.appStatusTitle) el.appStatusTitle.textContent = 'Application Approved!';
      if (el.appStatusSubtitle) {
        el.appStatusSubtitle.textContent = 'Your courier account has been verified and activated. You can now log in to start delivering.';
      }
      if (el.appStatePendingBox) el.appStatePendingBox.style.display = 'none';
      if (el.appStateApprovedBox) el.appStateApprovedBox.style.display = 'block';
      if (el.appStateRejectedBox) el.appStateRejectedBox.style.display = 'none';
    } else if (status === 'rejected' || accountStatus === 'rejected') {
      if (el.appStatusBadge) {
        el.appStatusBadge.className = 'badge-status-pill badge-rejected';
        el.appStatusBadge.textContent = 'APPLICATION NOT APPROVED';
      }
      if (el.appStatusTitle) el.appStatusTitle.textContent = 'Application Not Approved';
      if (el.appStatusSubtitle) {
        el.appStatusSubtitle.textContent = 'Your courier application could not be approved by fleet management at this time.';
      }
      if (el.appStatePendingBox) el.appStatePendingBox.style.display = 'none';
      if (el.appStateApprovedBox) el.appStateApprovedBox.style.display = 'none';
      if (el.appStateRejectedBox) el.appStateRejectedBox.style.display = 'block';
      if (el.appRejectionReason) {
        el.appRejectionReason.textContent = app.rejection_reason || 'Your application was not approved by fleet management at this time.';
      }
    } else {
      if (el.appStatusBadge) {
        el.appStatusBadge.className = 'badge-status-pill badge-pending';
        el.appStatusBadge.textContent = 'PENDING REVIEW';
      }
      if (el.appStatusTitle) el.appStatusTitle.textContent = 'Application Under Review';
      if (el.appStatusSubtitle) {
        el.appStatusSubtitle.textContent = 'Your application has been received and is waiting for fleet manager review.';
      }
      if (el.appStatePendingBox) el.appStatePendingBox.style.display = 'block';
      if (el.appStateApprovedBox) el.appStateApprovedBox.style.display = 'none';
      if (el.appStateRejectedBox) el.appStateRejectedBox.style.display = 'none';
    }
  }

  function enterApp() {
    document.body.classList.remove('auth-mode');
    hideAllAuthScreens();

    switchTab(state.currentTab || 'home');
    updateProfileUI();
    updateOnlineUI();
    renderEarningsUI();
    renderHomeActivity();

    // Trigger initial production delivery fetch
    fetchDeliveries();

    // Start production polling loop (every 6 seconds while authenticated and visible)
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
    }
    state.pollInterval = setInterval(() => {
      if (state.token && document.visibilityState !== 'hidden') {
        fetchDeliveries();
      }
    }, 6000);
  }

  async function validateSession(token) {
    try {
      const res = await fetch(`${PRODUCTION_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.rider) {
          state.token = token;
          state.rider = data.rider;
          return { valid: true, rider: data.rider };
        }
      }

      // If 401/403 Unauthorized or invalid session, purge stored token
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        state.token = null;
        state.rider = null;
        return { valid: false, reason: 'unauthorized' };
      }

      return { valid: false, reason: 'server_error' };
    } catch (err) {
      console.warn('Network issue during session validation:', err.message);
      return { valid: false, reason: 'network' };
    }
  }

  function showLoginError(msg) {
    if (el.loginError) {
      el.loginError.textContent = msg;
      el.loginError.style.display = 'block';
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!el.loginForm) return;

    const phone = el.loginPhone.value.trim();
    const password = el.loginPassword.value;

    if (!phone || !password) {
      showLoginError('Phone and password are required.');
      return;
    }

    // Clear existing error
    if (el.loginError) el.loginError.style.display = 'none';

    // Loading state: disable button, show spinner/status
    el.btnLoginSubmit.disabled = true;
    el.btnLoginSubmit.innerHTML = '<span>LOGGING IN...</span>';

    try {
      const res = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data.ok && data.token) {
        // Successful authentication
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        state.token = data.token;
        state.rider = data.rider;

        if (el.loginPassword) el.loginPassword.value = '';
        enterApp();
        showToast(`✓ Welcome, ${data.rider?.name || 'Rider'}!`);
      } else if (res.status === 400) {
        showLoginError('Phone and password are required.');
      } else if (res.status === 401) {
        showLoginError('Invalid phone or password.');
      } else if (res.status === 403) {
        showLoginError('Your rider account is not active yet.');
      } else {
        showLoginError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      showLoginError('Unable to connect to Shopystreet. Check your internet connection and try again.');
    } finally {
      if (!state.token) {
        el.btnLoginSubmit.disabled = false;
        el.btnLoginSubmit.innerHTML = '<span>LOGIN</span>';
      }
    }
  }

  async function handleLogout() {
    const currentToken = state.token || localStorage.getItem(TOKEN_STORAGE_KEY);

    // Call production Worker logout endpoint
    if (currentToken) {
      try {
        await fetch(`${PRODUCTION_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        // Proceed with local logout regardless of network state
      }
    }

    // Clear local authentication token and state
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    state.token = null;
    state.rider = null;
    state.activeJob = null;

    showLoginScreen();
    showToast('Logged out successfully');
  }

  // ==========================================
  // INLINE VEHICLE SELECTOR (Piece 1.2)
  // ==========================================
  const VEHICLE_CONFIG = {
    motorbike: {
      value: 'motorbike',
      title: 'Motorbike / Scooter',
      desc: 'Fast local delivery',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5" cy="16.5" r="3.2"></circle>
        <circle cx="19" cy="16.5" r="3.2"></circle>
        <path d="M5 16.5l4-5.5h4l3.5 5.5"></path>
        <path d="M12.5 11l1.8-5h2.2"></path>
        <path d="M9 11l2.5-3"></path>
        <circle cx="11.5" cy="5" r="1.5" fill="currentColor"></circle>
      </svg>`,
    },
    bicycle: {
      value: 'bicycle',
      title: 'Bicycle / E-Bike',
      desc: 'Light local delivery',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="5.5" cy="16.5" r="3.2"></circle>
        <circle cx="18.5" cy="16.5" r="3.2"></circle>
        <path d="M12 16.5l-3.5-5.5H5"></path>
        <path d="M12 16.5V13l3.5-3.5 2 2"></path>
        <path d="M12 13l3-5H18"></path>
        <circle cx="14" cy="5.5" r="1.5" fill="currentColor"></circle>
      </svg>`,
    },
    car: {
      value: 'car',
      title: 'Car / Light Vehicle',
      desc: 'Larger delivery capacity',
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 17h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1.5l-2.5-4h-6L6.5 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z"></path>
        <circle cx="7.5" cy="17" r="2.2" fill="currentColor"></circle>
        <circle cx="16.5" cy="17" r="2.2" fill="currentColor"></circle>
      </svg>`,
    },
  };

  function toggleInlineVehicleOptions() {
    if (!el.vehicleOptionsInline) return;
    const isCurrentlyOpen = el.vehicleOptionsInline.style.display !== 'none';
    if (isCurrentlyOpen) {
      closeInlineVehicleOptions();
    } else {
      openInlineVehicleOptions();
    }
  }

  function openInlineVehicleOptions() {
    if (!el.vehicleOptionsInline) return;
    const currentVal = el.regVehicleType ? el.regVehicleType.value : 'motorbike';

    document.querySelectorAll('.inline-opt-row').forEach((row) => {
      const isSelected = row.getAttribute('data-value') === currentVal;
      row.classList.toggle('selected', isSelected);
      row.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    el.vehicleOptionsInline.style.display = 'flex';
    if (el.regVehicleTrigger) {
      el.regVehicleTrigger.setAttribute('aria-expanded', 'true');
      el.regVehicleTrigger.classList.add('open');
    }
  }

  function closeInlineVehicleOptions() {
    if (!el.vehicleOptionsInline) return;
    el.vehicleOptionsInline.style.display = 'none';
    if (el.regVehicleTrigger) {
      el.regVehicleTrigger.setAttribute('aria-expanded', 'false');
      el.regVehicleTrigger.classList.remove('open');
    }
  }

  function selectVehicle(val) {
    const config = VEHICLE_CONFIG[val] || VEHICLE_CONFIG.motorbike;
    if (el.regVehicleType) {
      el.regVehicleType.value = config.value;
    }
    if (el.vehicleTriggerTitle) {
      el.vehicleTriggerTitle.textContent = config.title;
    }
    if (el.vehicleTriggerDesc) {
      el.vehicleTriggerDesc.textContent = config.desc;
    }
    if (el.vehicleTriggerIcon) {
      el.vehicleTriggerIcon.innerHTML = config.iconSvg;
    }

    document.querySelectorAll('.inline-opt-row').forEach((row) => {
      const isSelected = row.getAttribute('data-value') === config.value;
      row.classList.toggle('selected', isSelected);
      row.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    closeInlineVehicleOptions();
  }

  // ==========================================
  // REGISTRATION & STATUS LIFECYCLE (Checkpoint 3)
  // ==========================================
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!el.registerForm) return;

    const name = el.regName ? el.regName.value.trim() : '';
    const phone = el.regPhone ? el.regPhone.value.trim() : '';
    const nationalId = el.regNationalId ? el.regNationalId.value.trim() : '';
    const vehicleType = el.regVehicleType ? el.regVehicleType.value : 'motorbike';
    const password = el.regPassword ? el.regPassword.value : '';
    const confirmPassword = el.regConfirmPassword ? el.regConfirmPassword.value : '';

    // Frontend validation rules
    if (!name) {
      renderRegError('Full name is required.');
      return;
    }
    if (!phone) {
      renderRegError('Phone number is required.');
      return;
    }
    if (!nationalId) {
      renderRegError('National ID number is required.');
      return;
    }
    if (!vehicleType) {
      renderRegError('Please select a vehicle type.');
      return;
    }
    if (!password || password.length < 10) {
      renderRegError('Password must be at least 10 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      renderRegError('Password and confirmation password do not match.');
      return;
    }

    if (el.registerError) {
      el.registerError.innerHTML = '';
      el.registerError.style.display = 'none';
    }

    el.btnRegisterSubmit.disabled = true;
    el.btnRegisterSubmit.innerHTML = '<span>SUBMITTING APPLICATION...</span>';

    try {
      // Connect to production Worker POST /api/riders/register
      const res = await fetch(`${PRODUCTION_API_URL}/api/riders/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          password,
          vehicle_type: vehicleType,
          national_id_number: nationalId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if ((res.status === 200 || res.status === 201) && data.ok) {
        lastApplicantCredentials = { phone, password };
        const riderData = data.rider || data.application || {};
        const riderName = riderData.name || name;
        const riderPhone = riderData.phone || phone;
        showToast('✓ Account created successfully!');
        renderRegistrationSuccess(riderPhone, riderName);
      } else if (
        res.status === 409 ||
        (data.error && (
          data.error.toLowerCase().includes('already exists') ||
          data.error.toLowerCase().includes('existing')
        ))
      ) {
        renderExistingApplicantNotice(phone, password);
      } else {
        renderRegError(data.error || 'Failed to create rider account. Please verify your details.');
      }
    } catch (err) {
      renderRegError('Unable to connect to Shopystreet. Check your internet connection.');
    } finally {
      el.btnRegisterSubmit.disabled = false;
      el.btnRegisterSubmit.innerHTML = '<span>CREATE RIDER ACCOUNT</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
    }
  }

  async function handleStatusLookupSubmit(e) {
    e.preventDefault();
    if (!el.statusLookupForm) return;

    const phone = el.statusPhone ? el.statusPhone.value.trim() : '';
    const password = el.statusPassword ? el.statusPassword.value : '';

    function showStatusError(msg) {
      if (el.statusLookupError) {
        el.statusLookupError.textContent = msg;
        el.statusLookupError.style.display = 'block';
      }
    }

    if (!phone || !password) {
      showStatusError('Phone number and password are required.');
      return;
    }

    if (el.statusLookupError) el.statusLookupError.style.display = 'none';

    el.btnStatusLookupSubmit.disabled = true;
    el.btnStatusLookupSubmit.innerHTML = '<span>CHECKING STATUS...</span>';

    try {
      const res = await fetch(`${PRODUCTION_API_URL}/api/riders/application-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data.ok && data.application) {
        lastApplicantCredentials = { phone, password };
        renderApplicationStatus(data.application);
      } else if (res.status === 401) {
        showStatusError('Invalid phone or password');
      } else {
        showStatusError(data.error || 'Unable to retrieve status. Please try again.');
      }
    } catch (err) {
      showStatusError('Unable to connect to Shopystreet. Check your connection and try again.');
    } finally {
      el.btnStatusLookupSubmit.disabled = false;
      el.btnStatusLookupSubmit.innerHTML = '<span>CHECK APPLICATION STATUS</span>';
    }
  }

  async function handleStatusRefresh() {
    if (!lastApplicantCredentials.phone || !lastApplicantCredentials.password) {
      showStatusLookupScreen();
      return;
    }
    showToast('Refreshing application status...');
    try {
      const res = await fetch(`${PRODUCTION_API_URL}/api/riders/application-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastApplicantCredentials),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 200 && data.ok && data.application) {
        renderApplicationStatus(data.application);
        showToast('Status updated');
      } else {
        showStatusLookupScreen('Session expired. Please enter your credentials.');
      }
    } catch {
      showToast('Network error while refreshing status');
    }
  }

  // ==========================================
  // PRODUCTION WORKER API CLIENT
  // ==========================================
  async function workerApi(endpoint, options = {}) {
    const token = state.token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      showLoginScreen();
      throw new Error('Authentication required');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${PRODUCTION_API_URL}${endpoint}`;

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (netErr) {
      throw new Error('Unable to connect to Shopystreet. Check your internet connection.');
    }

    // Handle session expiry immediately
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      state.token = null;
      state.rider = null;
      state.activeJob = null;
      if (state.locationInterval) {
        clearInterval(state.locationInterval);
        state.locationInterval = null;
      }
      if (state.pollInterval) {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
      }
      showLoginScreen('Your session has expired. Please sign in again.');
      throw new Error('Session expired');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  // Normalize production delivery job object to UI shape
  function normalizeJob(raw) {
    if (!raw) return null;

    const jobId = raw.job_id || raw.id || '';
    const sourceApp = raw.source_app || raw.source_key || raw.source_id || 'merchant';
    const sourceOrderId = raw.source_order_id || raw.order_id || '';
    const merchantName = raw.merchant_name || raw.merchant || 'Merchant';
    const status = String(raw.status || 'SEEKING_RIDER').toUpperCase();

    const pickupName = raw.pickup?.name || raw.pickup_name || merchantName;
    const pickupAddr = raw.pickup?.address || raw.pickup_address || '';
    const pickupArea = raw.pickup?.general_area || raw.pickup_area || raw.pickup_general_area || pickupName;
    const pickupLat = Number(raw.pickup?.latitude ?? raw.pickup_latitude ?? -17.8286);
    const pickupLng = Number(raw.pickup?.longitude ?? raw.pickup_longitude ?? 31.0522);
    const pickupNotes = raw.pickup?.notes || raw.pickup_notes || '';
    const pickupPhone = raw.pickup?.contact_phone || raw.pickup_phone || '';

    const dropoffName = raw.dropoff?.name || raw.dropoff_name || raw.customer_name || 'Customer';
    const dropoffAddr = raw.dropoff?.address || raw.dropoff_address || '';
    const dropoffArea = raw.dropoff?.general_area || raw.dropoff_general_area || raw.dropoff_area || 'Harare Area';
    const dropoffLat = Number(raw.dropoff?.latitude ?? raw.dropoff_latitude ?? -17.8012);
    const dropoffLng = Number(raw.dropoff?.longitude ?? raw.dropoff_longitude ?? 31.0345);
    const dropoffInstructions = raw.dropoff?.instructions || raw.dropoff_instructions || raw.delivery_notes || '';
    const dropoffPhone = raw.dropoff?.contact_phone || raw.dropoff_phone || raw.customer_phone || '';

    const packageDesc = typeof raw.package_summary === 'string'
      ? raw.package_summary
      : (raw.package_summary?.description || raw.package_description || 'Standard sealed package');

    return {
      job_id: jobId,
      source_app: sourceApp,
      source_order_id: sourceOrderId,
      merchant_name: merchantName,
      status: status,
      distance_km: Number(raw.distance_km ?? 0),
      eta_minutes: Number(raw.eta_minutes ?? raw.estimated_duration_minutes ?? 12),
      rider_payout: Number(raw.rider_payout ?? raw.payout ?? 0),
      delivery_fee: Number(raw.delivery_fee ?? 0),
      pickup: {
        name: pickupName,
        address: pickupAddr,
        general_area: pickupArea,
        latitude: pickupLat,
        longitude: pickupLng,
        notes: pickupNotes,
        contact_phone: pickupPhone,
      },
      pickup_name: pickupName,
      pickup_area: pickupArea,
      dropoff: {
        name: dropoffName,
        address: dropoffAddr,
        general_area: dropoffArea,
        latitude: dropoffLat,
        longitude: dropoffLng,
        instructions: dropoffInstructions,
        contact_phone: dropoffPhone,
      },
      dropoff_general_area: dropoffArea,
      package_summary: {
        description: packageDesc,
      },
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }

  // ==========================================
  // PRODUCTION DELIVERY SYNCHRONIZATION
  // ==========================================
  let isFetchingDeliveries = false;
  async function fetchDeliveries() {
    if (!state.token || document.body.classList.contains('auth-mode')) {
      return;
    }

    if (isFetchingDeliveries) return;
    isFetchingDeliveries = true;

    try {
      const data = await workerApi('/api/rider/deliveries', { method: 'GET' });
      if (data && data.ok) {
        // 1. Available delivery requests
        const rawAvailable = Array.isArray(data.available_jobs) ? data.available_jobs : [];
        state.availableRequests = rawAvailable.map(normalizeJob).filter(Boolean);
        renderAvailableRequests();

        // 2. Active delivery in progress
        const previousActiveId = state.activeJob?.job_id;
        state.activeJob = data.active_job ? normalizeJob(data.active_job) : null;
        updateActiveJobUI();
        syncLocationTracking();

        if (previousActiveId && !state.activeJob) {
          showToast('Delivery status updated');
        }
      }
    } catch (err) {
      if (err.message !== 'Session expired') {
        console.warn('Delivery synchronization notice:', err.message);
      }
    } finally {
      isFetchingDeliveries = false;
    }
  }

  // ==========================================
  // GPS LOCATION TRACKING (Production Worker)
  // ==========================================
  function syncLocationTracking() {
    const activeStates = [
      'RIDER_ASSIGNED',
      'HEADING_TO_PICKUP',
      'ARRIVED_AT_PICKUP',
      'PICKED_UP',
      'DELIVERING',
      'NEAR_DESTINATION',
    ];
    const shouldTrack = state.activeJob && activeStates.includes(String(state.activeJob.status).toUpperCase());

    if (shouldTrack) {
      if (!state.locationInterval) {
        sendLocationFix();
        state.locationInterval = setInterval(sendLocationFix, 12000);
      }
    } else {
      if (state.locationInterval) {
        clearInterval(state.locationInterval);
        state.locationInterval = null;
      }
      state.locationPermissionDenied = false;
      state.locationPermissionWarningShown = false;
    }
  }

  function sendLocationFix() {
    if (!state.activeJob || !state.rider?.id) return;

    const riderId = state.rider.id;
    const activeJobId = state.activeJob.job_id;

    // Helper to send waypoint fallback coordinates if GPS is unpermitted or unavailable
    const sendWaypointFallback = () => {
      const isDropoffPhase =
        state.activeJob &&
        (state.activeJob.status === 'DELIVERING' || state.activeJob.status === 'NEAR_DESTINATION');
      const target = isDropoffPhase ? state.activeJob.dropoff : state.activeJob.pickup;
      if (target && target.latitude && target.longitude) {
        workerApi(`/api/riders/${encodeURIComponent(riderId)}/location`, {
          method: 'POST',
          body: JSON.stringify({
            latitude: target.latitude,
            longitude: target.longitude,
            accuracy: 50,
            job_id: activeJobId,
          }),
        }).catch(() => {});
      }
    };

    // If permission was denied by the user, do not repeatedly re-trigger browser prompts
    if (state.locationPermissionDenied) {
      sendWaypointFallback();
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.locationPermissionDenied = false;
          workerApi(`/api/riders/${encodeURIComponent(riderId)}/location`, {
            method: 'POST',
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 10,
              job_id: activeJobId,
            }),
          }).catch(() => {});
        },
        (err) => {
          // If rider denied location permission (error code 1 = PERMISSION_DENIED)
          if (err && err.code === 1) {
            state.locationPermissionDenied = true;
            if (!state.locationPermissionWarningShown) {
              state.locationPermissionWarningShown = true;
              showToast('Location access not granted. Continuing delivery with route waypoints.');
            }
          }
          sendWaypointFallback();
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      sendWaypointFallback();
    }
  }

  // ==========================================
  // ATOMIC CLAIM ACTION (Production Worker)
  // ==========================================
  async function claimDeliveryJob(jobId, triggerBtn = null) {
    if (state.rider && state.rider.is_online === false) {
      showToast('You must be Online to accept delivery requests.');
      return;
    }

    if (state.activeJob) {
      showToast('You already have an active delivery in progress.');
      return;
    }

    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.innerHTML = '<span>CLAIMING...</span>';
    }

    try {
      await workerApi(`/api/delivery-jobs/${encodeURIComponent(jobId)}/accept`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      closeRequestModal();
      showToast('✓ Delivery Assigned to You!');
      switchTab('deliveries');

      // Refresh production state immediately
      await fetchDeliveries();
    } catch (err) {
      if (err.status === 409) {
        showToast('⚠ Delivery no longer available. Another rider accepted first.');
        if (triggerBtn) {
          triggerBtn.innerHTML = '<span>UNAVAILABLE</span>';
          triggerBtn.style.opacity = '0.5';
        }
        if (el.modalReqError) {
          el.modalReqError.textContent = 'DELIVERY NO LONGER AVAILABLE. Another rider accepted this job.';
          el.modalReqError.style.display = 'block';
        }
        state.availableRequests = state.availableRequests.filter((j) => j.job_id !== jobId);
        renderAvailableRequests();
      } else if (err.status === 401) {
        // Handled by workerApi session expiration
      } else {
        showToast(`⚠ ${err.message || 'Could not accept delivery.'}`);
        if (triggerBtn) {
          triggerBtn.disabled = false;
          triggerBtn.innerHTML = '<span>ACCEPT DELIVERY</span>';
        }
      }
      fetchDeliveries().catch(() => {});
    }
  }

  // ==========================================
  // UI RENDERING FUNCTIONS
  // ==========================================

  // 1. Online/Offline State
  function updateOnlineUI() {
    const isOnline = Boolean(state.rider?.is_online ?? true);
    if (isOnline) {
      el.statusIndicator.className = 'status-indicator online';
      el.statusTitle.textContent = 'ONLINE & AVAILABLE';
      el.statusSubtitle.textContent = 'Ready to receive delivery orders';
      el.btnToggleOnline.textContent = 'GO OFFLINE';
      el.btnToggleOnline.className = 'switch-btn go-offline';
    } else {
      el.statusIndicator.className = 'status-indicator';
      el.statusTitle.textContent = 'OFFLINE';
      el.statusSubtitle.textContent = 'Go online to receive delivery requests';
      el.btnToggleOnline.textContent = 'GO ONLINE';
      el.btnToggleOnline.className = 'switch-btn go-online';
    }
  }

  // 2. Active Job Banner & Screen
  function updateActiveJobUI() {
    const job = state.activeJob;

    if (job) {
      // Home banner
      el.activeBanner.style.display = 'block';
      el.activeBannerMerchant.textContent = job.merchant_name;
      el.activeBannerEta.textContent = `ETA ~${job.eta_minutes} min`;
      el.activeBannerStatus.textContent = formatStatusLabel(job.status);

      // Active screen
      el.activeEmpty.style.display = 'none';
      el.activeCard.style.display = 'block';
      el.activeJobId.textContent = `#${job.job_id}`;
      el.activeStatusText.textContent = formatStatusLabel(job.status).toUpperCase();
      el.activeMerchant.textContent = job.merchant_name;
      el.activeOrderId.textContent = `Order #${job.source_order_id}`;
      el.activePayout.textContent = `$${job.rider_payout.toFixed(2)}`;

      // Pickup
      el.activePickupName.textContent = job.pickup.name;
      el.activePickupAddr.textContent = job.pickup.address;
      if (job.pickup.notes) {
        el.activePickupNotes.textContent = `Prep Note: ${job.pickup.notes}`;
        el.activePickupNotes.style.display = 'block';
      } else {
        el.activePickupNotes.style.display = 'none';
      }

      // Dropoff (Customer details unlocked!)
      el.activeDropoffName.textContent = job.dropoff.name;
      el.activeDropoffAddr.textContent = job.dropoff.address;
      if (job.dropoff.instructions) {
        el.activeDropoffInstructions.textContent = `Instructions: ${job.dropoff.instructions}`;
        el.activeDropoffInstructions.style.display = 'block';
      } else {
        el.activeDropoffInstructions.style.display = 'none';
      }

      if (job.dropoff.contact_phone) {
        el.activeCustomerPhone.href = `tel:${job.dropoff.contact_phone}`;
        el.activeCustomerPhone.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>Call ${escapeHtml(job.dropoff.name || 'Customer')} (${escapeHtml(job.dropoff.contact_phone)})</span>
        `;
      } else {
        el.activeCustomerPhone.textContent = '📞 No phone provided';
      }

      el.activePackageDesc.textContent = job.package_summary.description;

      // Update primary progression button
      updateActiveActionButton(job.status);

      // Nav dot indicator
      el.navActiveDot.style.display = 'block';
    } else {
      el.activeBanner.style.display = 'none';
      el.activeEmpty.style.display = 'block';
      el.activeCard.style.display = 'none';
      el.activeJobId.textContent = '';
      el.navActiveDot.style.display = 'none';
    }
  }

  function formatStatusLabel(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'SEEKING_RIDER': return 'Seeking Rider';
      case 'RIDER_ASSIGNED':
      case 'ASSIGNED': return 'Rider Assigned';
      case 'HEADING_TO_PICKUP': return 'Heading to Pickup';
      case 'ARRIVED_AT_PICKUP':
      case 'ARRIVED_PICKUP': return 'Arrived at Pickup';
      case 'PICKED_UP': return 'Order Picked Up';
      case 'DELIVERING': return 'Delivering';
      case 'NEAR_DESTINATION':
      case 'ARRIVED_DESTINATION': return 'Near Destination';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      case 'FAILED': return 'Delivery Failed';
      default: return status;
    }
  }

  function updateActiveActionButton(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'RIDER_ASSIGNED':
      case 'ASSIGNED':
        el.btnActiveAction.innerHTML = '<span>START HEADING TO PICKUP &rarr;</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
        break;
      case 'HEADING_TO_PICKUP':
        el.btnActiveAction.innerHTML = '<span>ARRIVED AT PICKUP &rarr;</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
        break;
      case 'ARRIVED_AT_PICKUP':
      case 'ARRIVED_PICKUP':
        el.btnActiveAction.innerHTML = '<span>CONFIRM ORDER PICKED UP &rarr;</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
        break;
      case 'PICKED_UP':
        el.btnActiveAction.innerHTML = '<span>START DELIVERY TO CUSTOMER &rarr;</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
        break;
      case 'DELIVERING':
        el.btnActiveAction.innerHTML = '<span>NEAR DESTINATION &rarr;</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
        break;
      case 'NEAR_DESTINATION':
      case 'ARRIVED_DESTINATION':
        el.btnActiveAction.innerHTML = '<span>CONFIRM ARRIVAL & SUBMIT PROOF &rarr;</span>';
        el.btnActiveAction.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        break;
      default:
        el.btnActiveAction.innerHTML = '<span>UPDATE STATUS</span>';
        el.btnActiveAction.style.background = 'var(--sky-gradient)';
    }
  }

  // 3. AVAILABLE DELIVERY REQUESTS (THE DOMINANT HERO ELEMENT)
  function renderAvailableRequests() {
    const list = state.availableRequests;

    if (list.length > 0) {
      el.requestsCountBadge.style.display = 'inline-block';
      el.requestsCountBadge.textContent = list.length;
      el.requestsCount.textContent = `${list.length} available now`;
    } else {
      el.requestsCountBadge.style.display = 'none';
      el.requestsCount.textContent = 'Monitoring incoming requests';
    }

    if (list.length === 0) {
      el.requestsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"></path>
              <polyline points="3.29 7 12 12 20.71 7"></polyline>
              <line x1="12" y1="22" x2="12" y2="12"></line>
            </svg>
          </div>
          <h3>No delivery requests yet.</h3>
          <p>Incoming deliveries from Bamboo Chicken and partner apps will appear here in real time.</p>
        </div>
      `;
      return;
    }

    el.requestsContainer.innerHTML = '';
    list.forEach((job) => {
      const card = document.createElement('div');
      card.className = 'hero-request-card';
      card.innerHTML = `
        <div class="request-live-header">
          <div class="new-delivery-pill">
            <span class="live-beacon"></span>
            <span>NEW DELIVERY</span>
          </div>
          <span class="req-job-id">#${escapeHtml(job.job_id)}</span>
        </div>

        <div class="request-main-row">
          <div class="request-merchant-block">
            <h3>${escapeHtml(job.merchant_name)}</h3>
            <span class="source-app-tag">${escapeHtml(job.source_app.replace('_', ' ').toUpperCase())}</span>
          </div>
          <div class="request-payout-block">
            <div class="payout-big-number">$${job.rider_payout.toFixed(2)}</div>
            <span class="payout-tag-label">Rider Payout</span>
          </div>
        </div>

        <div class="request-route-container">
          <div class="route-waypoint">
            <div class="waypoint-icon pickup">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
              </svg>
            </div>
            <div class="waypoint-info">
              <div class="waypoint-label">Pickup Location</div>
              <div class="waypoint-name">${escapeHtml(job.pickup_name)} (${escapeHtml(job.pickup_area)})</div>
            </div>
          </div>

          <div class="route-waypoint">
            <div class="waypoint-icon dropoff">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="waypoint-info">
              <div class="waypoint-label">Drop-off Area</div>
              <div class="waypoint-name">${escapeHtml(job.dropoff_general_area)}</div>
            </div>
          </div>
        </div>

        <div class="request-metrics-strip">
          <div class="metric-pill">
            <span>Distance:</span>
            <strong>${job.distance_km} km</strong>
          </div>
          <div class="metric-pill">
            <span>Est. ETA:</span>
            <strong>~${job.eta_minutes} min</strong>
          </div>
        </div>

        <!-- THE DOMINANT ACCEPT BUTTON DIRECTLY ON CARD -->
        <button class="btn-dominant-accept btn-card-accept" data-job-id="${job.job_id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>ACCEPT DELIVERY</span>
        </button>
      `;

      // 1-tap accept button
      const acceptBtn = card.querySelector('.btn-card-accept');
      acceptBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        claimDeliveryJob(job.job_id, acceptBtn);
      });

      // Tapping the card opens the full sheet
      card.addEventListener('click', () => openRequestModal(job));

      el.requestsContainer.appendChild(card);
    });
  }

  // 4. TODAY'S REAL ACTIVITY (HOME)
  function renderHomeActivity() {
    const e = state.earnings;
    el.homeTodayEarnings.textContent = `$${e.today_earnings.toFixed(2)}`;
    el.homeTodayTrips.textContent = e.today_deliveries;

    // Filter today's payouts
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayPayouts = (e.recent_payouts || []).filter((p) => {
      return new Date(p.completed_at).getTime() >= startOfToday;
    });

    if (todayPayouts.length === 0) {
      el.homeRecentActivityContainer.innerHTML = `
        <div class="empty-state compact">
          <p>No completed deliveries recorded today yet.</p>
        </div>
      `;
      return;
    }

    el.homeRecentActivityContainer.innerHTML = '';
    todayPayouts.slice(0, 5).forEach((p) => {
      const row = document.createElement('div');
      row.className = 'activity-row';
      row.innerHTML = `
        <div class="activity-row-left">
          <h4>${escapeHtml(p.merchant_name)}</h4>
          <span>${escapeHtml(p.job_id)} • ${p.distance_km} km</span>
        </div>
        <div class="activity-row-right">
          <div class="activity-row-payout">+$${p.payout.toFixed(2)}</div>
          <span class="activity-row-status">${new Date(p.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `;
      el.homeRecentActivityContainer.appendChild(row);
    });
  }

  // 5. EARNINGS SCREEN
  function renderEarningsUI() {
    const e = state.earnings;
    el.statTodayEarnings.textContent = `$${e.today_earnings.toFixed(2)}`;
    el.statTodayTrips.textContent = `${e.today_deliveries} ${e.today_deliveries === 1 ? 'trip' : 'trips'} completed`;

    el.statWeekEarnings.textContent = `$${e.week_earnings.toFixed(2)}`;
    el.statWeekTrips.textContent = `${e.week_deliveries} ${e.week_deliveries === 1 ? 'trip' : 'trips'} completed`;

    if (!e.recent_payouts || e.recent_payouts.length === 0) {
      el.payoutsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3>No completed deliveries yet.</h3>
          <p>Real completed deliveries and payout settlements will appear here.</p>
        </div>
      `;
      return;
    }

    el.payoutsContainer.innerHTML = '';
    e.recent_payouts.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'activity-row';
      row.style.marginBottom = '8px';
      row.innerHTML = `
        <div class="activity-row-left">
          <h4>${escapeHtml(p.merchant_name)}</h4>
          <span>${escapeHtml(p.job_id)} • ${p.distance_km} km</span>
        </div>
        <div class="activity-row-right">
          <div class="activity-row-payout">+$${p.payout.toFixed(2)}</div>
          <span class="activity-row-status">Settled</span>
        </div>
      `;
      el.payoutsContainer.appendChild(row);
    });
  }

  // 6. NOTIFICATIONS UI
  function renderNotificationsUI() {
    const unread = state.notifications.filter((n) => !n.read).length;
    el.notifBadge.style.display = unread > 0 ? 'block' : 'none';

    if (state.notifications.length === 0) {
      el.notificationsList.innerHTML = `
        <div class="empty-state">
          <h3>No notifications</h3>
          <p>Important delivery alerts and assignment updates will appear here.</p>
        </div>
      `;
      return;
    }

    el.notificationsList.innerHTML = '';
    state.notifications.forEach((n) => {
      const card = document.createElement('div');
      card.className = 'activity-row';
      card.style.marginBottom = '8px';
      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
            <strong style="font-size: 13.5px; color: var(--text-main); font-weight: 800;">${escapeHtml(n.title)}</strong>
            <span style="font-size: 10px; color: var(--text-light);">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.35;">${escapeHtml(n.message)}</p>
        </div>
      `;
      el.notificationsList.appendChild(card);
    });
  }

  // 7. PROFILE UI
  function updateProfileUI() {
    const r = state.rider;
    if (!r) return;

    el.profileName.textContent = r.name || 'Rider Account';
    el.profilePhone.textContent = r.phone || '';
    el.profileAvatar.textContent = (r.name || 'R')
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    el.inputRiderName.value = r.name || '';
    el.inputRiderPhone.value = r.phone || '';
    if (r.vehicle_type) el.inputRiderVehicle.value = r.vehicle_type;
    el.inputRiderReg.value = r.vehicle_reg || '';

    const statusTag = document.getElementById('profile-status-tag');
    if (statusTag) {
      statusTag.textContent = `${(r.account_status || 'active').toUpperCase()} RIDER`;
    }
  }

  // ==========================================
  // MODAL HANDLERS
  // ==========================================
  function openRequestModal(job) {
    state.selectedRequest = job;
    el.modalReqMerchant.textContent = job.merchant_name;
    el.modalReqSourceTag.textContent = job.source_app.replace('_', ' ').toUpperCase();
    el.modalReqJobId.textContent = `#${job.job_id}`;
    el.modalReqPayout.textContent = `$${job.rider_payout.toFixed(2)}`;
    el.modalReqPickup.textContent = `${job.pickup_name} (${job.pickup_area})`;
    el.modalReqDropoff.textContent = job.dropoff_general_area;
    el.modalReqDistance.textContent = `${job.distance_km} km`;
    el.modalReqEta.textContent = `~${job.eta_minutes} min`;

    el.modalReqError.style.display = 'none';
    el.btnAcceptJob.disabled = false;
    el.btnAcceptJob.style.opacity = '1';
    el.btnAcceptJob.innerHTML = '<span>ACCEPT DELIVERY</span>';

    el.modalRequest.classList.add('open');
  }

  function closeRequestModal() {
    el.modalRequest.classList.remove('open');
    state.selectedRequest = null;
  }

  // Proof of Delivery Modal Handlers
  function openProofModal() {
    if (!state.activeJob) return;
    const job = state.activeJob;

    if (el.proofJobId) el.proofJobId.textContent = `#${job.job_id}`;
    if (el.proofCustomerName) el.proofCustomerName.textContent = job.dropoff?.name || 'Customer';
    if (el.proofDropoffAddr) el.proofDropoffAddr.textContent = job.dropoff?.address || job.dropoff_general_area || '';
    if (el.proofError) {
      el.proofError.style.display = 'none';
      el.proofError.textContent = '';
    }
    if (el.proofTypeSelect) el.proofTypeSelect.value = 'recipient_name';
    if (el.proofVerificationCode) el.proofVerificationCode.value = '';
    if (el.proofReferenceInput) {
      el.proofReferenceInput.value = job.dropoff?.name || '';
      el.proofReferenceInput.placeholder = 'Name of person receiving the package';
    }
    if (el.proofRefLabel) el.proofRefLabel.textContent = 'Recipient Name / Receiver Note';
    if (el.proofCodeGroup) el.proofCodeGroup.style.display = 'none';
    if (el.proofRefGroup) el.proofRefGroup.style.display = 'block';
    if (el.btnSubmitProof) {
      el.btnSubmitProof.disabled = false;
      el.btnSubmitProof.innerHTML = '<span>CONFIRM DELIVERED ✓</span>';
    }

    if (el.modalProof) el.modalProof.classList.add('open');
  }

  function closeProofModal() {
    if (el.modalProof) el.modalProof.classList.remove('open');
  }

  // Incident Reporting Modal Handlers
  function openIncidentModal() {
    if (!state.activeJob) {
      showToast('No active delivery to report an issue for.');
      return;
    }
    if (el.incidentError) {
      el.incidentError.style.display = 'none';
      el.incidentError.textContent = '';
    }
    if (el.incidentNotesInput) el.incidentNotesInput.value = '';
    if (el.btnSubmitIncident) {
      el.btnSubmitIncident.disabled = false;
      el.btnSubmitIncident.innerHTML = '<span>SUBMIT REPORT</span>';
    }
    if (el.modalIncident) el.modalIncident.classList.add('open');
  }

  function closeIncidentModal() {
    if (el.modalIncident) el.modalIncident.classList.remove('open');
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  // Tab switching (Supports both 'deliveries' and 'active')
  el.navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    state.currentTab = tabId;

    el.navItems.forEach((item) => {
      const itemTab = item.getAttribute('data-tab');
      if (
        itemTab === tabId ||
        (itemTab === 'deliveries' && tabId === 'active') ||
        (itemTab === 'active' && tabId === 'deliveries')
      ) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    el.screenHome.classList.toggle('active', tabId === 'home');
    el.screenActive.classList.toggle('active', tabId === 'active' || tabId === 'deliveries');
    el.screenEarnings.classList.toggle('active', tabId === 'earnings');
    el.screenProfile.classList.toggle('active', tabId === 'profile');
  }

  // Home active banner click -> jumps to deliveries screen
  el.activeBanner.addEventListener('click', () => {
    switchTab('deliveries');
  });

  // Toggle Online/Offline status (Client-side availability preference)
  el.btnToggleOnline.addEventListener('click', () => {
    if (state.activeJob) {
      showToast('Cannot go offline with an active delivery in progress.');
      return;
    }
    const currentOnline = Boolean(state.rider?.is_online ?? true);
    const nextStatus = !currentOnline;
    if (state.rider) {
      state.rider.is_online = nextStatus;
    }
    updateOnlineUI();
    showToast(nextStatus ? 'Status: Online & Ready (Client preference)' : 'Status: Offline (Client preference)');
    if (nextStatus) {
      fetchDeliveries();
    }
  });

  // Modal Accept Button
  el.btnAcceptJob.addEventListener('click', () => {
    if (!state.selectedRequest) return;
    claimDeliveryJob(state.selectedRequest.job_id, el.btnAcceptJob);
  });

  el.btnCloseRequest.addEventListener('click', closeRequestModal);

  // Active delivery progression (Production Worker)
  el.btnActiveAction.addEventListener('click', async () => {
    if (!state.activeJob) return;

    const currentStatus = String(state.activeJob.status || '').toUpperCase();
    let nextStatus = '';

    if (currentStatus === 'RIDER_ASSIGNED' || currentStatus === 'ASSIGNED') nextStatus = 'HEADING_TO_PICKUP';
    else if (currentStatus === 'HEADING_TO_PICKUP') nextStatus = 'ARRIVED_AT_PICKUP';
    else if (currentStatus === 'ARRIVED_AT_PICKUP' || currentStatus === 'ARRIVED_PICKUP') nextStatus = 'PICKED_UP';
    else if (currentStatus === 'PICKED_UP') nextStatus = 'DELIVERING';
    else if (currentStatus === 'DELIVERING') nextStatus = 'NEAR_DESTINATION';
    else if (currentStatus === 'NEAR_DESTINATION' || currentStatus === 'ARRIVED_DESTINATION') {
      // Require Proof of Delivery before transitioning to DELIVERED
      openProofModal();
      return;
    }

    if (!nextStatus) return;

    el.btnActiveAction.disabled = true;
    try {
      const res = await workerApi(`/api/delivery-jobs/${encodeURIComponent(state.activeJob.job_id)}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (nextStatus === 'DELIVERED') {
        state.activeJob = null;
        updateActiveJobUI();
        syncLocationTracking();
        showToast('✓ Delivery Completed!');
        switchTab('earnings');
      } else {
        if (res && res.job) {
          state.activeJob = normalizeJob(res.job);
        } else {
          state.activeJob.status = nextStatus;
        }
        updateActiveJobUI();
        syncLocationTracking();
        showToast(`Status: ${formatStatusLabel(nextStatus)}`);
      }
      fetchDeliveries();
    } catch (err) {
      showToast(err.message || 'Status transition failed.');
      fetchDeliveries().catch(() => {});
    } finally {
      el.btnActiveAction.disabled = false;
    }
  });

  // Proof Method Select changes input display
  if (el.proofTypeSelect) {
    el.proofTypeSelect.addEventListener('change', () => {
      const pType = el.proofTypeSelect.value;
      if (pType === 'delivery_code') {
        if (el.proofCodeGroup) el.proofCodeGroup.style.display = 'block';
        if (el.proofRefLabel) el.proofRefLabel.textContent = 'Recipient Name (Optional)';
        if (el.proofReferenceInput) {
          el.proofReferenceInput.required = false;
          el.proofReferenceInput.placeholder = 'Receiver name or relation';
        }
        if (el.proofVerificationCode) {
          el.proofVerificationCode.required = true;
          el.proofVerificationCode.focus();
        }
      } else {
        if (el.proofCodeGroup) el.proofCodeGroup.style.display = 'none';
        if (el.proofVerificationCode) el.proofVerificationCode.required = false;
        if (el.proofReferenceInput) el.proofReferenceInput.required = true;

        if (pType === 'signature') {
          if (el.proofRefLabel) el.proofRefLabel.textContent = 'Signatory Full Name';
          if (el.proofReferenceInput) el.proofReferenceInput.placeholder = 'Full name of person who signed';
        } else if (pType === 'photo') {
          if (el.proofRefLabel) el.proofRefLabel.textContent = 'Safe Drop Location Note';
          if (el.proofReferenceInput) el.proofReferenceInput.placeholder = 'e.g. Left with security guard / front desk';
        } else {
          if (el.proofRefLabel) el.proofRefLabel.textContent = 'Recipient Name / Receiver Note';
          if (el.proofReferenceInput) el.proofReferenceInput.placeholder = 'Name of person receiving the package';
        }
      }
    });
  }

  // Proof modal close/cancel buttons
  if (el.btnCloseProof) el.btnCloseProof.addEventListener('click', closeProofModal);
  if (el.btnCancelProof) el.btnCancelProof.addEventListener('click', closeProofModal);

  // Proof Form Submission (Worker POST /api/delivery-jobs/{id}/proof -> POST /api/delivery-jobs/{id}/status)
  if (el.proofForm) {
    el.proofForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.activeJob) return;

      const jobId = state.activeJob.job_id;
      const proofType = el.proofTypeSelect ? el.proofTypeSelect.value : 'recipient_name';
      const verificationCode = el.proofVerificationCode ? el.proofVerificationCode.value.trim() : '';
      const proofReference = el.proofReferenceInput ? el.proofReferenceInput.value.trim() : '';

      if (proofType === 'delivery_code' && !verificationCode) {
        if (el.proofError) {
          el.proofError.textContent = 'Please enter the customer delivery code.';
          el.proofError.style.display = 'block';
        }
        return;
      }

      if (proofType !== 'delivery_code' && !proofReference) {
        if (el.proofError) {
          el.proofError.textContent = 'Please enter the recipient name or handover note.';
          el.proofError.style.display = 'block';
        }
        return;
      }

      if (el.proofError) el.proofError.style.display = 'none';
      if (el.btnSubmitProof) {
        el.btnSubmitProof.disabled = true;
        el.btnSubmitProof.innerHTML = '<span>RECORDING PROOF...</span>';
      }

      try {
        // Step 1: Submit Proof of Delivery to Worker
        const proofPayload = {
          proof_type: proofType,
          proof_reference: proofReference || undefined,
          verification_code: verificationCode || undefined,
        };

        await workerApi(`/api/delivery-jobs/${encodeURIComponent(jobId)}/proof`, {
          method: 'POST',
          body: JSON.stringify(proofPayload),
        });

        // Step 2: On successful proof submission, advance status to DELIVERED
        if (el.btnSubmitProof) {
          el.btnSubmitProof.innerHTML = '<span>COMPLETING DELIVERY...</span>';
        }

        await workerApi(`/api/delivery-jobs/${encodeURIComponent(jobId)}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: 'DELIVERED' }),
        });

        closeProofModal();
        state.activeJob = null;
        updateActiveJobUI();
        syncLocationTracking();
        showToast('✓ Delivery Completed with Proof!');
        switchTab('earnings');
        fetchDeliveries();
      } catch (err) {
        if (el.proofError) {
          el.proofError.textContent = err.message || 'Proof submission failed. Please verify and retry.';
          el.proofError.style.display = 'block';
        }
        showToast(err.message || 'Proof submission failed.');
      } finally {
        if (el.btnSubmitProof) {
          el.btnSubmitProof.disabled = false;
          el.btnSubmitProof.innerHTML = '<span>CONFIRM DELIVERED ✓</span>';
        }
      }
    });
  }

  // Incident modal open/close buttons
  if (el.btnOpenIncident) el.btnOpenIncident.addEventListener('click', openIncidentModal);
  if (el.btnCloseIncident) el.btnCloseIncident.addEventListener('click', closeIncidentModal);
  if (el.btnCancelIncident) el.btnCancelIncident.addEventListener('click', closeIncidentModal);

  // Incident Form Submission (Worker POST /api/delivery-jobs/{id}/incident)
  if (el.incidentForm) {
    el.incidentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.activeJob) return;

      const jobId = state.activeJob.job_id;
      const incidentType = el.incidentTypeSelect ? el.incidentTypeSelect.value : 'other';
      const notes = el.incidentNotesInput ? el.incidentNotesInput.value.trim() : '';

      if (!notes) {
        if (el.incidentError) {
          el.incidentError.textContent = 'Please provide details describing the issue.';
          el.incidentError.style.display = 'block';
        }
        return;
      }

      if (el.incidentError) el.incidentError.style.display = 'none';
      if (el.btnSubmitIncident) {
        el.btnSubmitIncident.disabled = true;
        el.btnSubmitIncident.innerHTML = '<span>SUBMITTING REPORT...</span>';
      }

      try {
        const incidentPayload = {
          incident_type: incidentType,
          notes: notes,
        };

        const res = await workerApi(`/api/delivery-jobs/${encodeURIComponent(jobId)}/incident`, {
          method: 'POST',
          body: JSON.stringify(incidentPayload),
        });

        closeIncidentModal();
        showToast('✓ Report submitted. Fleet support notified.');

        // Active delivery remains active unless Worker returns a modified status
        if (res && res.job) {
          state.activeJob = normalizeJob(res.job);
          updateActiveJobUI();
          syncLocationTracking();
        }
        fetchDeliveries();
      } catch (err) {
        if (el.incidentError) {
          el.incidentError.textContent = err.message || 'Failed to submit incident report. Please retry.';
          el.incidentError.style.display = 'block';
        }
        showToast(err.message || 'Incident report failed.');
      } finally {
        if (el.btnSubmitIncident) {
          el.btnSubmitIncident.disabled = false;
          el.btnSubmitIncident.innerHTML = '<span>SUBMIT REPORT</span>';
        }
      }
    });
  }

  // Turn-by-Turn Navigation Shortcut
  el.btnNavigate.addEventListener('click', () => {
    if (!state.activeJob) return;
    const isDropoffPhase =
      state.activeJob.status === 'DELIVERING' ||
      state.activeJob.status === 'NEAR_DESTINATION' ||
      state.activeJob.status === 'delivering' ||
      state.activeJob.status === 'arrived_destination';
    const target = isDropoffPhase ? state.activeJob.dropoff : state.activeJob.pickup;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
    window.open(mapsUrl, '_blank');
  });

  // Profile Form submission
  el.profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/rider/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: el.inputRiderName.value,
          phone: el.inputRiderPhone.value,
          vehicle_type: el.inputRiderVehicle.value,
          vehicle_reg: el.inputRiderReg.value,
        }),
      });
      state.rider = res.rider;
      updateProfileUI();
      showToast('Profile Updated');
    } catch (err) {
      showToast(err.message || 'Failed to update profile');
    }
  });

  // Notifications modal
  el.btnNotifications.addEventListener('click', () => {
    el.modalNotifications.classList.add('open');
    state.notifications.forEach((n) => (n.read = true));
    el.notifBadge.style.display = 'none';
  });

  el.btnCloseNotif.addEventListener('click', () => {
    el.modalNotifications.classList.remove('open');
  });

  // Dispatch Test Tool (Only if elements present in DOM)
  if (el.btnOpenDispatchTest) {
    el.btnOpenDispatchTest.addEventListener('click', () => {
      if (el.modalDispatchTest) el.modalDispatchTest.classList.add('open');
      if (el.raceTestResult) el.raceTestResult.style.display = 'none';
    });
  }

  if (el.btnCloseDispatchTest) {
    el.btnCloseDispatchTest.addEventListener('click', () => {
      if (el.modalDispatchTest) el.modalDispatchTest.classList.remove('open');
    });
  }

  // Simulate Bamboo Chicken cashier dispatch
  if (el.btnDispatchBamboo) {
    el.btnDispatchBamboo.addEventListener('click', async () => {
      try {
        const orderNum = Math.floor(1000 + Math.random() * 9000);
        await api('/api/webhook/delivery-request', {
          method: 'POST',
          body: JSON.stringify({
            source_app: 'bamboo_select',
            source_order_id: `BC-${orderNum}`,
            merchant_name: 'Bamboo Chicken Select',
            pickup: {
              name: 'Bamboo Chicken — Harare CBD',
              address: '88 Kwame Nkrumah Ave, Harare CBD',
              general_area: 'Harare CBD',
              latitude: -17.8286,
              longitude: 31.0522,
              contact_name: 'Bamboo Dispatch Cashier',
              contact_phone: '+263 24 275 8899',
              notes: 'Thermal seal bagged. Pickup counter 2.',
            },
            dropoff: {
              name: 'Kuda Mataranyika',
              address: '42 Argyle Rd, Avondale West',
              general_area: 'Avondale West',
              latitude: -17.8012,
              longitude: 31.0345,
              contact_phone: '+263 77 456 7890',
              instructions: 'Gate 3, call upon arrival.',
            },
            package_summary: {
              description: '2x 1/4 Chicken Meals + Spicy Wings + 2L Soda',
              items_count: 3,
              is_food: true,
            },
            delivery_fee: 3.5,
            rider_payout: 3.0,
            distance_km: 4.2,
          }),
        });

        if (el.modalDispatchTest) el.modalDispatchTest.classList.remove('open');
        showToast('Bamboo Chicken Order Dispatched!');
        switchTab('home');
        fetchAllData();
      } catch (err) {
        showToast(err.message || 'Dispatch failed');
      }
    });
  }

  // Simulate Shopystreet SEND dispatch
  if (el.btnDispatchSend) {
    el.btnDispatchSend.addEventListener('click', async () => {
      try {
        const orderNum = Math.floor(100 + Math.random() * 900);
        await api('/api/webhook/delivery-request', {
          method: 'POST',
          body: JSON.stringify({
            source_app: 'shopystreet_send',
            source_order_id: `SEND-${orderNum}`,
            merchant_name: 'Shopystreet SEND',
            pickup: {
              name: 'Eastlea Business Hub',
              address: '22 Samora Machel Ave East, Eastlea',
              general_area: 'Eastlea',
              latitude: -17.8241,
              longitude: 31.0789,
              contact_name: 'Farai Sender',
              contact_phone: '+263 77 222 3344',
              notes: 'Sealed document flyer.',
            },
            dropoff: {
              name: 'Dr. Chipo Mutasa',
              address: '18 Piers Road, Borrowdale',
              general_area: 'Borrowdale',
              latitude: -17.7621,
              longitude: 31.0912,
              contact_phone: '+263 71 888 9900',
              instructions: 'Main clinic reception desk.',
            },
            package_summary: {
              description: 'Express documents folder (A4)',
              items_count: 1,
              is_food: false,
            },
            delivery_fee: 5.0,
            rider_payout: 4.2,
            distance_km: 7.4,
          }),
        });

        if (el.modalDispatchTest) el.modalDispatchTest.classList.remove('open');
        showToast('Shopystreet SEND Package Dispatched!');
        switchTab('home');
        fetchAllData();
      } catch (err) {
        showToast(err.message || 'Dispatch failed');
      }
    });
  }

  // Atomic Concurrency Double-Claim Race Test
  if (el.btnDispatchRace) {
    el.btnDispatchRace.addEventListener('click', async () => {
      if (el.raceTestResult) {
        el.raceTestResult.style.display = 'block';
        el.raceTestResult.innerHTML = 'Executing simultaneous dual-claim race condition test...';
      }

      try {
        const createRes = await api('/api/webhook/delivery-request', {
          method: 'POST',
          body: JSON.stringify({
            source_app: 'bamboo_select',
            source_order_id: `BC-RACE-${Date.now().toString().slice(-4)}`,
            merchant_name: 'Bamboo Chicken (Race Test)',
            pickup: { name: 'Bamboo CBD', address: 'Harare CBD', general_area: 'Harare CBD', latitude: -17.8286, longitude: 31.0522 },
            dropoff: { name: 'Test Dropoff', address: 'Avenues', general_area: 'Avenues', latitude: -17.818, longitude: 31.052 },
            package_summary: { description: 'Burger Combo', items_count: 1, is_food: true },
            delivery_fee: 3.0,
            rider_payout: 2.5,
            distance_km: 2.0,
          }),
        });

        const jobId = createRes.job_id;

        const [res1, res2] = await Promise.all([
          fetch(`${PRODUCTION_API_URL}/api/jobs/${jobId}/claim`, { method: 'POST' }).then(async (r) => ({ status: r.status, data: await r.json() })),
          fetch(`${PRODUCTION_API_URL}/api/jobs/${jobId}/claim`, { method: 'POST' }).then(async (r) => ({ status: r.status, data: await r.json() })),
        ]);

        const successCount = (res1.status === 200 ? 1 : 0) + (res2.status === 200 ? 1 : 0);
        const conflictCount = (res1.status === 409 ? 1 : 0) + (res2.status === 409 ? 1 : 0);

        if (el.raceTestResult) {
          el.raceTestResult.innerHTML = `
            <strong>Atomic Concurrency Test Result:</strong><br />
            • Request 1 Status: HTTP ${res1.status} (${res1.status === 200 ? 'Claimed' : res1.data.error})<br />
            • Request 2 Status: HTTP ${res2.status} (${res2.status === 200 ? 'Claimed' : res2.data.error})<br />
            <span style="color: ${successCount === 1 && conflictCount === 1 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
              ${successCount === 1 && conflictCount === 1 ? '✓ VERIFIED: Server locked job to 1 rider; rejected 2nd rider with HTTP 409 Conflict.' : 'Race test finished.'}
            </span>
          `;
        }
        fetchAllData();
      } catch (e) {
        if (el.raceTestResult) el.raceTestResult.textContent = `Error: ${e.message}`;
      }
    });
  }

  // ==========================================
  // PWA REGISTRATION & INSTALL PROMPT
  // ==========================================
  function initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          console.warn('PWA Service Worker registration error:', err);
        });
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      el.installBtn.style.display = 'none';
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      el.installBtn.style.display = 'flex';
    });

    el.installBtn.addEventListener('click', async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        const { outcome } = await state.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          el.installBtn.style.display = 'none';
        }
        state.deferredInstallPrompt = null;
      } else {
        alert('To install on Android or iOS:\nTap your browser menu (or Share button) and select "Add to Home Screen".');
      }
    });

    window.addEventListener('appinstalled', () => {
      el.installBtn.style.display = 'none';
      showToast('Shopystreet Riders Installed');
    });
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // INITIALIZE
  document.addEventListener('DOMContentLoaded', async () => {
    initPWA();

    // Attach Authentication Event Listeners
    if (el.loginForm) {
      el.loginForm.addEventListener('submit', handleLoginSubmit);
    }
    if (el.btnLogout) {
      el.btnLogout.addEventListener('click', handleLogout);
    }

    // Attach Registration & Status Event Listeners (Checkpoint 3 & Piece 1)
    if (el.registerForm) {
      el.registerForm.addEventListener('submit', handleRegisterSubmit);
      el.registerForm.addEventListener('input', () => {
        if (el.registerError && el.registerError.style.display !== 'none') {
          if (!el.registerError.querySelector('.error-actions')) {
            el.registerError.innerHTML = '';
            el.registerError.style.display = 'none';
          }
        }
      });
    }

    // Password visibility toggle buttons (Piece 1)
    document.querySelectorAll('.btn-toggle-password').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const showIcon = btn.querySelector('.icon-eye-show');
        const hideIcon = btn.querySelector('.icon-eye-hide');
        if (showIcon && hideIcon) {
          showIcon.style.display = isPassword ? 'none' : 'block';
          hideIcon.style.display = isPassword ? 'block' : 'none';
        }
      });
    });

    // Vehicle Type Inline Selector (Piece 1.2)
    if (el.regVehicleTrigger) {
      el.regVehicleTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleInlineVehicleOptions();
      });
    }
    document.querySelectorAll('.inline-opt-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        e.preventDefault();
        const val = row.getAttribute('data-value');
        if (val) selectVehicle(val);
      });
    });
    document.addEventListener('click', (e) => {
      if (
        el.inlineVehiclePicker &&
        !el.inlineVehiclePicker.contains(e.target) &&
        el.vehicleOptionsInline &&
        el.vehicleOptionsInline.style.display !== 'none'
      ) {
        closeInlineVehicleOptions();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.vehicleOptionsInline && el.vehicleOptionsInline.style.display !== 'none') {
        closeInlineVehicleOptions();
      }
    });
    if (el.statusLookupForm) {
      el.statusLookupForm.addEventListener('submit', handleStatusLookupSubmit);
    }
    if (el.btnStatusRefresh) {
      el.btnStatusRefresh.addEventListener('click', handleStatusRefresh);
    }
    if (el.btnStatusBackLogin) {
      el.btnStatusBackLogin.addEventListener('click', () => showLoginScreen());
    }
    if (el.btnAppLoginNow) {
      el.btnAppLoginNow.addEventListener('click', () => {
        showLoginScreen();
        if (lastApplicantCredentials.phone && el.loginPhone) {
          el.loginPhone.value = lastApplicantCredentials.phone;
          if (el.loginPassword) el.loginPassword.focus();
        }
      });
    }
    if (el.btnRegSuccessLogin) {
      el.btnRegSuccessLogin.addEventListener('click', () => {
        const phone = el.regSuccessPhone ? el.regSuccessPhone.textContent.trim() : '';
        showLoginScreen(null, phone);
      });
    }

    // Navigation links between auth views
    if (el.linkLoginToRegister) {
      el.linkLoginToRegister.addEventListener('click', () => showRegisterScreen());
    }
    if (el.linkLoginToStatus) {
      el.linkLoginToStatus.addEventListener('click', () => showStatusLookupScreen());
    }
    if (el.linkRegisterToLogin) {
      el.linkRegisterToLogin.addEventListener('click', () => showLoginScreen());
    }
    if (el.linkRegisterToStatus) {
      el.linkRegisterToStatus.addEventListener('click', () => showStatusLookupScreen());
    }
    if (el.linkStatusToLogin) {
      el.linkStatusToLogin.addEventListener('click', () => showLoginScreen());
    }
    if (el.linkStatusToRegister) {
      el.linkStatusToRegister.addEventListener('click', () => showRegisterScreen());
    }

    // Re-synchronize when user returns to app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.token && !document.body.classList.contains('auth-mode')) {
        fetchDeliveries();
      }
    });

    // Multi-tab / PWA instance synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === TOKEN_STORAGE_KEY) {
        if (!e.newValue && state.token) {
          // Explicit logout in another tab/window
          state.token = null;
          state.rider = null;
          state.activeJob = null;
          showLoginScreen();
        } else if (e.newValue && !state.token) {
          // Logged in from another tab/window
          validateSession(e.newValue).then((res) => {
            if (res && res.valid) {
              enterApp();
            }
          });
        }
      }
    });

    // Check stored session token
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      const sessionResult = await validateSession(savedToken);
      if (sessionResult && sessionResult.valid) {
        enterApp();
        return;
      }
      if (sessionResult && sessionResult.reason === 'unauthorized') {
        showLoginScreen('Your session has ended. Please sign in again.');
        return;
      }
      if (sessionResult && sessionResult.reason === 'network') {
        showLoginScreen('Unable to verify session. Check your internet connection and try again.');
        return;
      }
    }

    // No valid production session -> present Login Screen
    showLoginScreen();
  });
})();
