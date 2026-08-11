import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}/api`;
const STORAGE_KEY = 'turn-ui-state';

const initialRegistrationForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  registrationType: 'FERDI'
};

const initialLoginForm = { email: '', password: '' };
const initialCustomerRegisterForm = { firstName: '', lastName: '', email: '', password: '' };
const initialQueueForm = {
  address: '',
  serviceName: '',
  categoryInput: '',
  categories: [],
  resetMode: 'DAILY',
  resetAt: '',
  managerUsername: '',
  managerPassword: ''
};
const initialScanForm = { qrToken: '', displayName: '', firstName: '', lastName: '' };
const initialCustomerJoinForm = { queueId: '', displayName: '' };
const initialQueueManagerLoginForm = { username: '', password: '' };
const initialAdminLoginForm = { username: '', password: '' };
const initialAdminFilters = { search: '', registrationType: 'ALL', paymentStatus: 'ALL', month: '' };

function getSavedState() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function sanitizeForStorage(value) {
  return JSON.parse(JSON.stringify(value, (key, item) => (
    ['accessToken', 'sessionToken', 'checkoutUrl'].includes(key) ? undefined : item
  )));
}

function resolveRoute(pathname) {
  if (pathname.startsWith('/payments/')) {
    const paymentSessionId = pathname.split('/')[2];
    if (paymentSessionId) return { screen: 'paymentCheckout', paymentSessionId: Number(paymentSessionId) };
  }
  if (pathname === '/scan') return { screen: 'scan' };
  if (pathname === '/login') return { screen: 'creatorLogin' };
  if (pathname === '/musteri/login') return { screen: 'customerLogin' };
  if (pathname === '/musteri/qeydiyyat') return { screen: 'customerRegister' };
  if (pathname === '/musteri') return { screen: 'customerDashboard' };
  if (pathname === '/musteri/qosul') return { screen: 'customerJoin' };
  if (pathname === '/register/type') return { screen: 'registrationType' };
  if (pathname === '/register') return { screen: 'register' };
  if (pathname === '/dashboard') return { screen: 'dashboard' };
  if (pathname === '/queues/new') return { screen: 'createQueue' };
  if (pathname === '/queue-manager/login') return { screen: 'queueManagerLogin' };
  if (pathname === '/admin') return { screen: 'adminLogin' };
  if (pathname === '/admin/dashboard') return { screen: 'adminDashboard' };
  if (pathname.startsWith('/queues/')) {
    const queueId = pathname.split('/')[2];
    if (queueId && queueId !== 'new') {
      return { screen: 'queueDetail', queueId: Number(queueId) };
    }
  }
  return { screen: 'home' };
}

function getPathForScreen(screen, queueId, paymentSessionId) {
  switch (screen) {
    case 'paymentCheckout':
      return `/payments/${paymentSessionId ?? ''}`;
    case 'scan':
      return '/scan';
    case 'creatorLogin':
      return '/login';
    case 'customerLogin':
      return '/musteri/login';
    case 'customerRegister':
      return '/musteri/qeydiyyat';
    case 'customerDashboard':
      return '/musteri';
    case 'customerJoin':
      return '/musteri/qosul';
    case 'registrationType':
      return '/register/type';
    case 'register':
      return '/register';
    case 'dashboard':
      return '/dashboard';
    case 'createQueue':
      return '/queues/new';
    case 'queueManagerLogin':
      return '/queue-manager/login';
    case 'queueDetail':
      return `/queues/${queueId ?? ''}`;
    case 'adminLogin':
      return '/admin';
    case 'adminDashboard':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

export default function App() {
  const savedState = getSavedState();
  const initialRoute = resolveRoute(window.location.pathname);

  const [screen, setScreen] = useState(initialRoute.screen);
  const [routeQueueId, setRouteQueueId] = useState(initialRoute.queueId ?? null);
  const [routePaymentSessionId, setRoutePaymentSessionId] = useState(initialRoute.paymentSessionId ?? null);
  const [registrationForm, setRegistrationForm] = useState(initialRegistrationForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [customerLoginForm, setCustomerLoginForm] = useState(initialLoginForm);
  const [customerRegisterForm, setCustomerRegisterForm] = useState(initialCustomerRegisterForm);
  const [queueForm, setQueueForm] = useState(initialQueueForm);
  const [scanForm, setScanForm] = useState(initialScanForm);
  const [customerJoinForm, setCustomerJoinForm] = useState(initialCustomerJoinForm);
  const [queueManagerLoginForm, setQueueManagerLoginForm] = useState(initialQueueManagerLoginForm);
  const [adminLoginForm, setAdminLoginForm] = useState(initialAdminLoginForm);
  const [adminFilters, setAdminFilters] = useState(initialAdminFilters);

  const [registration, setRegistration] = useState(savedState.registration ?? null);
  const [queues, setQueues] = useState(savedState.queues ?? []);
  const [selectedQueueDetail, setSelectedQueueDetail] = useState(savedState.selectedQueueDetail ?? null);
  const [selectedQueueAccess, setSelectedQueueAccess] = useState(savedState.selectedQueueAccess ?? null);
  const [queueManagerSession, setQueueManagerSession] = useState(savedState.queueManagerSession ?? null);
  const [adminSession, setAdminSession] = useState(savedState.adminSession ?? null);
  const [adminDashboard, setAdminDashboard] = useState(savedState.adminDashboard ?? null);
  const [customer, setCustomer] = useState(savedState.customer ?? null);
  const [customerHistory, setCustomerHistory] = useState(savedState.customerHistory ?? []);
  const [publicQueues, setPublicQueues] = useState(savedState.publicQueues ?? []);
  const [scanResult, setScanResult] = useState(savedState.scanResult ?? null);
  const [accessToken, setAccessToken] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [paymentSession, setPaymentSession] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCustomerRegistering, setIsCustomerRegistering] = useState(false);
  const [isCustomerLoggingIn, setIsCustomerLoggingIn] = useState(false);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [isLoadingCustomerHistory, setIsLoadingCustomerHistory] = useState(false);
  const [isSavingHistoryItem, setIsSavingHistoryItem] = useState(null);
  const [isQueueManagerLoggingIn, setIsQueueManagerLoggingIn] = useState(false);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [isLoadingAdminDashboard, setIsLoadingAdminDashboard] = useState(false);
  const [isLoadingQueueDetail, setIsLoadingQueueDetail] = useState(false);
  const [isAdvancingQueue, setIsAdvancingQueue] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  const scannerRegionIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const html5QrCodeRef = useRef(null);
  const lastDetectedTokenRef = useRef('');
  const handledPaymentReturnRef = useRef('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForStorage({
      registration,
      queues,
      selectedQueueDetail,
      selectedQueueAccess,
      queueManagerSession,
      adminSession,
      adminDashboard,
      customer,
      customerHistory,
      publicQueues,
      scanResult,
    })));
  }, [registration, queues, selectedQueueDetail, selectedQueueAccess, queueManagerSession, adminSession, adminDashboard, customer, customerHistory, publicQueues, scanResult]);

  useEffect(() => {
    function handlePopState() {
      const route = resolveRoute(window.location.pathname);
      setScreen(route.screen);
      setRouteQueueId(route.queueId ?? null);
      setRoutePaymentSessionId(route.paymentSessionId ?? null);
      clearMessages();
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const supported = typeof window !== 'undefined'
      && navigator.mediaDevices
      && typeof navigator.mediaDevices.getUserMedia === 'function';
    setIsCameraAvailable(Boolean(supported));
  }, []);

  useEffect(() => {
    async function syncRouteQueue() {
      if (screen !== 'queueDetail' || !routeQueueId) return;

      const access = selectedQueueAccess
        ?? (registration ? { registrationId: registration.id } : null)
        ?? (queueManagerSession ? { queueManagerId: queueManagerSession.queueManagerId } : null);

      if (!access) return;
      if (selectedQueueDetail?.id === routeQueueId) return;

      try {
        await loadQueueDetail(routeQueueId, access);
      } catch {
        return;
      }
    }

    syncRouteQueue();
  }, [screen, routeQueueId]);

  useEffect(() => {
    if (screen === 'scan' && isCameraAvailable) {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }

    return () => stopCameraScanner();
  }, [screen, isCameraAvailable]);

  useEffect(() => {
    ensureCsrfToken().catch(() => {});
  }, []);

  useEffect(() => {
    if (screen === 'customerDashboard' && customer) {
      loadCustomerHistory(customer.id).catch(() => {});
    }
    if (screen === 'customerJoin') {
      loadPublicQueues().catch(() => {});
    }
    if (screen === 'paymentCheckout' && routePaymentSessionId) {
      loadPaymentSession(routePaymentSessionId).catch(() => {});
    }
  }, [screen, customer?.id]);

  useEffect(() => {
    if (screen !== 'paymentCheckout' || !paymentSession || paymentSession.status !== 'PENDING') return;

    const params = new URLSearchParams(window.location.search);
    const bankOrderId = params.get('ID');
    const bankStatus = params.get('STATUS');
    const returnKey = `${routePaymentSessionId}-${bankOrderId}-${bankStatus}`;

    if (!bankOrderId || handledPaymentReturnRef.current === returnKey) return;

    handledPaymentReturnRef.current = returnKey;
    handleConfirmPayment().catch(() => {});
  }, [screen, routePaymentSessionId, paymentSession?.id, paymentSession?.status]);

  function clearMessages() {
    setError('');
    setSuccessMessage('');
  }

  function navigateTo(nextScreen, options = {}) {
    const path = options.path ?? getPathForScreen(nextScreen, options.queueId, options.paymentSessionId);
    setScreen(nextScreen);
    setRouteQueueId(options.queueId ?? null);
    setRoutePaymentSessionId(options.paymentSessionId ?? null);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }

  function resetAll() {
    setRegistration(null);
    setQueues([]);
    setSelectedQueueDetail(null);
    setSelectedQueueAccess(null);
    setQueueManagerSession(null);
    setAdminSession(null);
    setAdminDashboard(null);
    setCustomer(null);
    setCustomerHistory([]);
    setPublicQueues([]);
    setScanResult(null);
    setAccessToken('');
    setCsrfToken('');
    setPaymentSession(null);
    setRegistrationForm(initialRegistrationForm);
    setLoginForm(initialLoginForm);
    setCustomerLoginForm(initialLoginForm);
    setCustomerRegisterForm(initialCustomerRegisterForm);
    setQueueForm(initialQueueForm);
    setScanForm(initialScanForm);
    setCustomerJoinForm(initialCustomerJoinForm);
    setQueueManagerLoginForm(initialQueueManagerLoginForm);
    setAdminLoginForm(initialAdminLoginForm);
    clearMessages();
    window.localStorage.removeItem(STORAGE_KEY);
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}
    }).catch(() => {});
    navigateTo('home');
  }

  function activateRole(role) {
    if (role !== 'REGISTRATION') {
      setRegistration(null);
      setQueues([]);
    }
    if (role !== 'CUSTOMER') {
      setCustomer(null);
      setCustomerHistory([]);
    }
    if (role !== 'QUEUE_MANAGER') {
      setQueueManagerSession(null);
      setSelectedQueueAccess(null);
      setSelectedQueueDetail(null);
    }
    if (role !== 'ADMIN') {
      setAdminSession(null);
      setAdminDashboard(null);
    }
  }

  function startRegistration(type) {
    clearMessages();
    setRegistrationForm({ ...initialRegistrationForm, registrationType: type });
    navigateTo('register');
  }

  function addCategory() {
    const value = queueForm.categoryInput.trim();
    if (!value || queueForm.categories.includes(value)) return;
    setQueueForm((current) => ({
      ...current,
      categoryInput: '',
      categories: [...current.categories, value]
    }));
  }

  function removeCategory(categoryToRemove) {
    setQueueForm((current) => ({
      ...current,
      categories: current.categories.filter((category) => category !== categoryToRemove)
    }));
  }

  function printQueueQr(printableId) {
    const printableNode = document.getElementById(printableId);
    if (!printableNode) {
      setError('Cap ucun barkod karti tapilmadi.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=720,height=900');
    if (!printWindow) {
      setError('Print penceresi acilmadi. Pop-up icazesini yoxlayin.');
      return;
    }

    printWindow.document.write(`
      <html lang="az">
        <head>
          <title>E-Novbe QR</title>
          <style>
            body { margin: 0; padding: 32px; font-family: Georgia, "Times New Roman", serif; color: #0f172a; background: #ffffff; }
            .printCard { max-width: 420px; margin: 0 auto; padding: 28px; border: 2px solid #cbd5e1; border-radius: 24px; text-align: center; }
            .printBrand { margin: 0 0 8px; font-size: 1.6rem; font-weight: 700; }
            .printService { margin: 0; font-size: 1.1rem; font-weight: 700; }
            .printAddress, .printHint { margin: 8px 0 0; color: #475569; line-height: 1.5; }
            .printCard svg { width: 220px; height: 220px; margin: 18px auto; display: block; }
            .printUidLabel { margin-top: 14px; font-size: 0.9rem; letter-spacing: 0.18em; text-transform: uppercase; color: #475569; }
            .uidCode { display: block; margin-top: 8px; font-size: 1.05rem; font-weight: 700; word-break: break-word; }
          </style>
        </head>
        <body>${printableNode.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function stopCameraScanner() {
    const scanner = html5QrCodeRef.current;
    if (scanner?.isScanning) {
      scanner.stop().catch(() => {});
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
  }

  async function startCameraScanner() {
    if (!isCameraAvailable || isCameraActive || isCameraStarting) return;
    setIsCameraStarting(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = html5QrCodeRef.current ?? new Html5Qrcode(scannerRegionIdRef.current);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.333334 },
        async (decodedText) => {
          const detectedToken = decodedText?.trim();
          if (!detectedToken || detectedToken === lastDetectedTokenRef.current) return;
          lastDetectedTokenRef.current = detectedToken;
          setScanForm((current) => ({ ...current, qrToken: detectedToken }));
          await submitScanToken(detectedToken);
        },
        () => {}
      );

      setIsCameraActive(true);
      setIsCameraStarting(false);
    } catch {
      setIsCameraActive(false);
      setIsCameraStarting(false);
      setError('Kamera açıla bilmədi. İcazə verin və ya tokeni əl ilə yazın.');
    }
  }

  async function ensureCsrfToken(forceRefresh = false) {
    if (csrfToken && !forceRefresh) {
      return csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('CSRF token alınmadı.');
    }
    const data = await response.json();
    setCsrfToken(data.csrfToken);
    return data.csrfToken;
  }

  async function refreshAccessToken(currentCsrfToken) {
    const token = currentCsrfToken || await ensureCsrfToken();
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-TOKEN': token
      }
    });

    if (!response.ok) {
      throw new Error('Sessiya yenilənmədi.');
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  }

  async function apiFetch(path, options = {}) {
    const {
      method = 'GET',
      body,
      requiresAuth = false,
      retryOnUnauthorized = true,
      retryOnCsrfFailure = true,
      csrfTokenOverride = '',
      accessTokenOverride = '',
      headers: customHeaders = {}
    } = options;

    const headers = { ...customHeaders };
    let resolvedCsrfToken = csrfTokenOverride || csrfToken;

    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      resolvedCsrfToken = csrfTokenOverride || await ensureCsrfToken();
      headers['X-CSRF-TOKEN'] = resolvedCsrfToken;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const bearerToken = accessTokenOverride || accessToken;
    if (requiresAuth && !bearerToken && retryOnUnauthorized) {
      const newAccessToken = await refreshAccessToken(resolvedCsrfToken);
      return apiFetch(path, {
        ...options,
        retryOnUnauthorized: false,
        accessTokenOverride: newAccessToken
      });
    }
    if (requiresAuth && bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (response.status === 401 && requiresAuth && retryOnUnauthorized) {
      const newAccessToken = await refreshAccessToken(resolvedCsrfToken);
      return apiFetch(path, {
        ...options,
        retryOnUnauthorized: false,
        accessTokenOverride: newAccessToken
      });
    }

    if (response.status === 403 && retryOnCsrfFailure) {
      const errorBody = await response.clone().json().catch(() => ({}));
      if (String(errorBody.message || '').toUpperCase().includes('CSRF')) {
        const freshCsrfToken = await ensureCsrfToken(true);
        return apiFetch(path, {
          ...options,
          retryOnCsrfFailure: false,
          csrfTokenOverride: freshCsrfToken
        });
      }
    }

    return response;
  }

  async function handleRegister(event) {
    event.preventDefault();
    clearMessages();
    setIsRegistering(true);
    try {
      const response = await apiFetch('/payments/registration-sessions', {
        method: 'POST',
        body: {
          firstName: registrationForm.firstName,
          lastName: registrationForm.lastName,
          email: registrationForm.email,
          password: registrationForm.password,
          registrationType: registrationForm.registrationType
        }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Ödəniş sessiyası alınmadı.'));
      const data = await response.json();
      setPaymentSession(data);
      navigateTo('paymentCheckout', {
        paymentSessionId: data.id,
        path: `/payments/${data.id}`
      });
      setSuccessMessage('Ödəniş sessiyası yaradıldı.');
    } catch (requestError) {
      try {
        const latestSession = await loadPaymentSession(paymentSession.id);
        setPaymentSession(latestSession);
      } catch {
        // Session reload best-effort only.
      }
      setError(requestError.message);
    } finally {
      setIsRegistering(false);
    }
  }

  async function loadPaymentSession(paymentSessionId) {
    const response = await apiFetch(`/payments/registration-sessions/${paymentSessionId}`);
    if (!response.ok) throw new Error(await readErrorMessage(response, 'Ödəniş sessiyası yüklənmədi.'));
    const data = await response.json();
    setPaymentSession(data);
    return data;
  }

  async function handleConfirmPayment() {
    if (!paymentSession) return;
    clearMessages();
    setIsRegistering(true);
    try {
      const response = await apiFetch(`/payments/registration-sessions/${paymentSession.id}/confirm`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Ödəniş statusu yoxlanmadı.'));
      const data = await response.json();
      setPaymentSession(data.payment);
      if (data.registration) {
        activateRole('REGISTRATION');
        setRegistration(data.registration);
        setAccessToken(data.registration.accessToken || '');
        setQueues([]);
        navigateTo('dashboard');
        setSuccessMessage('Ödəniş uğurla tamamlandı və profil aktiv oldu.');
      } else if (data.payment?.status === 'FAILED' || data.payment?.status === 'CANCELLED') {
        setRegistration(null);
        setAccessToken('');
        setError('Ödəniş uğursuz oldu. Profil expired edildi və növbələr deaktiv olacaq.');
      } else if (data.payment?.status === 'PENDING') {
        setSuccessMessage('Ödəniş hələ tamamlanmayıb. Bank səhifəsini yoxlayın.');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRegistering(false);
    }
  }

  function openBankCheckout() {
    if (!paymentSession?.checkoutUrl) {
      setError('Bank checkout URL tapilmadi.');
      return;
    }
    window.location.href = paymentSession.checkoutUrl;
  }

  async function handleCancelPayment() {
    if (!paymentSession) return;
    clearMessages();
    setIsRegistering(true);
    try {
      const response = await apiFetch(`/payments/registration-sessions/${paymentSession.id}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Ödəniş sessiyası ləğv olunmadı.'));
      const data = await response.json();
      setPaymentSession(data);
      navigateTo('register');
      setSuccessMessage('Ödəniş sessiyası ləğv olundu.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCreatorLogin(event) {
    event.preventDefault();
    clearMessages();
    setIsLoggingIn(true);
    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        body: loginForm
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Daxil olmaq alınmadı.'));
      const data = await response.json();
      activateRole('REGISTRATION');
      setAccessToken(data.accessToken || '');
      setRegistration(data);
      setQueues(await loadQueues(data.id));
      navigateTo('dashboard');
      setSuccessMessage('Növbə yaradan kabinetinə daxil oldunuz.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleCustomerRegister(event) {
    event.preventDefault();
    clearMessages();
    setIsCustomerRegistering(true);
    try {
      const response = await apiFetch('/customers/register', {
        method: 'POST',
        body: customerRegisterForm
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Müştəri qeydiyyatı alınmadı.'));
      const data = await response.json();
      activateRole('CUSTOMER');
      setAccessToken(data.accessToken || '');
      setCustomer(data);
      setCustomerHistory([]);
      navigateTo('customerDashboard');
      setSuccessMessage('Müştəri hesabı yaradıldı.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCustomerRegistering(false);
    }
  }

  async function handleCustomerLogin(event) {
    event.preventDefault();
    clearMessages();
    setIsCustomerLoggingIn(true);
    try {
      const response = await apiFetch('/customers/login', {
        method: 'POST',
        body: customerLoginForm
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Müştəri girişi alınmadı.'));
      const data = await response.json();
      activateRole('CUSTOMER');
      setAccessToken(data.accessToken || '');
      setCustomer(data);
      await loadCustomerHistory(data.id);
      navigateTo('customerDashboard');
      setSuccessMessage('Müştəri kimi daxil oldunuz.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCustomerLoggingIn(false);
    }
  }

  async function handleQueueManagerLogin(event) {
    event.preventDefault();
    clearMessages();
    setIsQueueManagerLoggingIn(true);
    try {
      const response = await apiFetch('/queue-managers/login', {
        method: 'POST',
        body: queueManagerLoginForm
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbə idarəçisi girişi alınmadı.'));
      const data = await response.json();
      activateRole('QUEUE_MANAGER');
      setAccessToken(data.accessToken || '');
      setQueueManagerSession({ queueManagerId: data.queueManagerId, username: data.username });
      setSelectedQueueAccess({ queueManagerId: data.queueManagerId });
      setSelectedQueueDetail(data.queue);
      navigateTo('queueDetail', { queueId: data.queue.id });
      setSuccessMessage('Növbə idarəçisi kimi daxil oldunuz.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsQueueManagerLoggingIn(false);
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    clearMessages();
    setIsAdminLoggingIn(true);
    try {
      const response = await apiFetch('/admin/login', {
        method: 'POST',
        body: adminLoginForm
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Admin girişi alınmadı.'));
      const data = await response.json();
      activateRole('ADMIN');
      setAccessToken(data.accessToken || '');
      setAdminSession(data);
      await loadAdminDashboard(adminFilters);
      navigateTo('adminDashboard');
      setSuccessMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAdminLoggingIn(false);
    }
  }

  async function handleCreateQueue(event) {
    event.preventDefault();
    if (!registration) return;
    clearMessages();
    setIsCreatingQueue(true);
    try {
      const response = await apiFetch('/queues', {
        method: 'POST',
        requiresAuth: true,
        body: {
          registrationId: registration.id,
          address: queueForm.address,
          serviceName: queueForm.serviceName,
          categories: queueForm.categories,
          resetMode: queueForm.resetMode,
          resetAt: queueForm.resetAt,
          managerUsername: queueForm.managerUsername,
          managerPassword: queueForm.managerPassword
        }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbə yaradılmadı.'));
      const createdQueue = await response.json();
      setQueues(await loadQueues(registration.id));
      setQueueForm(initialQueueForm);
      navigateTo('dashboard');
      setSuccessMessage(`Növbə yaradıldı. QR token: ${createdQueue.qrToken}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCreatingQueue(false);
    }
  }

  async function handleScan(event) {
    event.preventDefault();
    await submitScanToken(scanForm.qrToken);
  }

  async function submitScanToken(qrToken) {
    const normalizedToken = (qrToken ?? '').trim();
    if (!normalizedToken) {
      setScanResult(null);
      setError('QR token boş ola bilməz.');
      return;
    }

    clearMessages();
    setIsScanning(true);
    try {
      const response = await apiFetch('/queues/scan', {
        method: 'POST',
        body: {
          qrToken: normalizedToken,
          customerId: customer?.id ?? null,
          displayName: scanForm.displayName,
          firstName: scanForm.firstName,
          lastName: scanForm.lastName
        }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Scan alınmadı.'));
      const data = await response.json();
      setScanResult(data);
      if (customer) {
        await loadCustomerHistory(customer.id);
      }
      stopCameraScanner();
      setSuccessMessage(data.message);
    } catch (requestError) {
      setScanResult(null);
      setError(requestError.message);
      lastDetectedTokenRef.current = '';
    } finally {
      setIsScanning(false);
    }
  }

  async function handleCustomerJoin(event) {
    event.preventDefault();
    if (!customer) {
      setError('Əvvəl müştəri kimi daxil olun.');
      return;
    }

    clearMessages();
    setIsJoiningQueue(true);
    try {
      const response = await apiFetch('/queues/join', {
        method: 'POST',
        requiresAuth: true,
        body: {
          customerId: customer.id,
          queueId: Number(customerJoinForm.queueId),
          displayName: customerJoinForm.displayName
        }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbəyə qoşulmaq alınmadı.'));
      const data = await response.json();
      await loadCustomerHistory(customer.id);
      setCustomerJoinForm(initialCustomerJoinForm);
      navigateTo('customerDashboard');
      setSuccessMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsJoiningQueue(false);
    }
  }

  async function handleAdvanceQueue() {
    if (!selectedQueueDetail || !selectedQueueAccess) return;
    clearMessages();
    setIsAdvancingQueue(true);
    try {
      const response = await apiFetch(`/queues/${selectedQueueDetail.id}/next`, {
        method: 'POST',
        requiresAuth: true,
        body: selectedQueueAccess
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbəti növbəyə keçmək olmadı.'));
      const data = await response.json();
      setSelectedQueueDetail(data);
      if (registration) {
        setQueues(await loadQueues(registration.id));
      }
      if (customer) {
        await loadCustomerHistory(customer.id);
      }
      setSuccessMessage(`Hazırda ${data.currentServingNumber} nömrəyə xidmət olunur.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAdvancingQueue(false);
    }
  }

  async function handleResetQueue() {
    if (!selectedQueueDetail || !selectedQueueAccess) return;
    clearMessages();
    setIsAdvancingQueue(true);
    try {
      const response = await apiFetch(`/queues/${selectedQueueDetail.id}/reset`, {
        method: 'POST',
        requiresAuth: true,
        body: selectedQueueAccess
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbə sıfırlanmadı.'));
      const data = await response.json();
      setSelectedQueueDetail(data);
      if (registration) {
        setQueues(await loadQueues(registration.id));
      }
      setSuccessMessage('Növbə sıfırlandı.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAdvancingQueue(false);
    }
  }

  async function openQueueDetail(queueId, access) {
    clearMessages();
    try {
      await loadQueueDetail(queueId, access);
      navigateTo('queueDetail', { queueId });
    } catch {
      return;
    }
  }

  async function saveHistoryRename(entryId, displayName) {
    if (!customer) return;
    clearMessages();
    setIsSavingHistoryItem(entryId);
    try {
      const response = await apiFetch(`/customer-queue-entries/${entryId}/rename`, {
        method: 'POST',
        requiresAuth: true,
        body: { customerId: customer.id, displayName }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Ad dəyişdirilmədi.'));
      await response.json();
      await loadCustomerHistory(customer.id);
      setSuccessMessage('Növbə adı yeniləndi.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingHistoryItem(null);
    }
  }

  async function saveHistoryRating(entryId, rating, note) {
    if (!customer) return;
    clearMessages();
    setIsSavingHistoryItem(entryId);
    try {
      const response = await apiFetch(`/customer-queue-entries/${entryId}/rating`, {
        method: 'POST',
        requiresAuth: true,
        body: { customerId: customer.id, rating: Number(rating), note }
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Qiymət saxlanmadı.'));
      await response.json();
      await loadCustomerHistory(customer.id);
      setSuccessMessage('Qiymət qeyd olundu.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingHistoryItem(null);
    }
  }

  async function loadQueues(registrationId) {
    const response = await apiFetch(`/registrations/${registrationId}/queues`, { requiresAuth: true });
    if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbələr yüklənmədi.'));
    return response.json();
  }

  async function loadPublicQueues() {
    const response = await apiFetch('/queues/public');
    if (!response.ok) throw new Error(await readErrorMessage(response, 'Açıq növbələr yüklənmədi.'));
    const data = await response.json();
    setPublicQueues(data);
    return data;
  }

  async function loadCustomerHistory(customerId) {
    setIsLoadingCustomerHistory(true);
    try {
      const response = await apiFetch(`/customers/${customerId}/history`, { requiresAuth: true });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Müştəri tarixçəsi yüklənmədi.'));
      const data = await response.json();
      setCustomerHistory(data.map((item) => ({ ...item, draftName: item.queueName, draftRating: item.rating ?? 5, draftNote: item.ratingNote ?? '' })));
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoadingCustomerHistory(false);
    }
  }

  async function loadQueueDetail(queueId, access) {
    setIsLoadingQueueDetail(true);
    try {
      const params = new URLSearchParams();
      if (access?.registrationId) params.set('registrationId', access.registrationId);
      if (access?.queueManagerId) params.set('queueManagerId', access.queueManagerId);
      const response = await apiFetch(`/queues/${queueId}?${params.toString()}`, { requiresAuth: true });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Növbə detalları yüklənmədi.'));
      const data = await response.json();
      setSelectedQueueAccess(access);
      setSelectedQueueDetail(data);
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoadingQueueDetail(false);
    }
  }

  async function loadAdminDashboard(filters) {
    setIsLoadingAdminDashboard(true);
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set('search', filters.search.trim());
      if (filters.registrationType !== 'ALL') params.set('registrationType', filters.registrationType);
      if (filters.paymentStatus !== 'ALL') params.set('paymentStatus', filters.paymentStatus);
      if (filters.month) params.set('month', filters.month);
      const response = await apiFetch(`/admin/dashboard${params.toString() ? `?${params.toString()}` : ''}`, { requiresAuth: true });
      if (!response.ok) throw new Error(await readErrorMessage(response, 'Admin məlumatları yüklənmədi.'));
      const data = await response.json();
      setAdminDashboard(data);
      return data;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoadingAdminDashboard(false);
    }
  }

  async function handleAdminFilterSubmit(event) {
    event.preventDefault();
    clearMessages();
    try {
      await loadAdminDashboard(adminFilters);
      setSuccessMessage('Admin siyahısı yeniləndi.');
    } catch {
      return;
    }
  }

  async function handleAdminFiltersReset() {
    clearMessages();
    setAdminFilters(initialAdminFilters);
    try {
      await loadAdminDashboard(initialAdminFilters);
    } catch {
      return;
    }
  }

  const individualLimitReached = registration?.registrationType === 'FERDI' && queues.length >= 1;

  return (
    <main className={`app app-${screen}`}>
      <div className="shell">
        <header className="masthead">
          <button className="brandButton" type="button" onClick={() => navigateTo('home')} aria-label="E-Növbə ana səhifəsi">
            <span className="brandMark">eN</span>
            <span className="brandWords">
              <strong>E-Növbə</strong>
              <small>Rəqəmsal növbə platforması</small>
            </span>
          </button>
          <p className="description">
            Vaxtını növbədə deyil, həyatında keçir.
          </p>
        </header>

        <nav className="toolbar" aria-label="Əsas naviqasiya">
          <button className="ghostButton" type="button" onClick={() => navigateTo('home')}>Ana səhifə</button>
          {registration ? <button className="ghostButton" type="button" onClick={() => navigateTo('dashboard')}>Yaradan kabineti</button> : null}
          {customer ? <button className="ghostButton" type="button" onClick={() => navigateTo('customerDashboard')}>Müştəri kabineti</button> : null}
          {adminSession ? <button className="ghostButton" type="button" onClick={() => navigateTo('adminDashboard')}>Admin paneli</button> : null}
          {registration || customer || queueManagerSession || adminSession ? <button className="ghostButton logoutButton" type="button" onClick={resetAll}>Çıxış et</button> : null}
        </nav>

        {successMessage ? <div className="resultBanner">{successMessage}</div> : null}
        {error ? <div className="error">{error}</div> : null}

        {screen === 'home' ? (
          <section className="panel homePanel">
            <div className="homeHero">
              <div className="homeHeroCopy">
                <p className="homeOverline">Növbənin yeni ritmi</p>
                <h1>Gözləməni<br /><em>görünən et.</em></h1>
                <p>Nömrəni əvvəlcədən al, vaxtını hesabla və xidmətə tam zamanında yaxınlaş.</p>
                <div className="homeSignals">
                  <span><i /> Canlı növbə statusu</span>
                  <span>QR və UID ilə sürətli giriş</span>
                </div>
              </div>
              <div className="homeTicket" aria-hidden="true">
                <div className="ticketTop"><span>E-NÖVBƏ</span><small>CANLI</small></div>
                <p>Sizin nömrəniz</p>
                <strong>015</strong>
                <div className="ticketProgress"><i /></div>
                <div className="ticketMeta"><span>İndi<br /><b>003</b></span><span>Gözləyən<br /><b>12 nəfər</b></span><span>Təxmini<br /><b>60 dəq</b></span></div>
              </div>
            </div>
            <div className="choiceGrid choiceGridWide">
              <button className="choiceCard" type="button" onClick={() => navigateTo('creatorLogin')}>
                <span className="choiceLabel">Yaradan</span>
                <strong>Növbə yaradan kimi daxil ol</strong>
                <p>Öz növbələrini yarat və idarə et.</p>
              </button>
              <button className="choiceCard" type="button" onClick={() => navigateTo('customerLogin')}>
                <span className="choiceLabel">Müştəri</span>
                <strong>Müştəri kimi daxil ol</strong>
                <p>Tarixçənə bax, qiymət ver və evdən növbəyə qoşul.</p>
              </button>
              <button className="choiceCard" type="button" onClick={() => navigateTo('registrationType')}>
                <span className="choiceLabel">Yeni hesab</span>
                <strong>Qeydiyyatdan keç</strong>
                <p>Fərdi və ya korporativ növbə yaradan hesabı aç.</p>
              </button>
              <button className="choiceCard" type="button" onClick={() => navigateTo('scan')}>
                <span className="choiceLabel">QR</span>
                <strong>Scan et</strong>
                <p>Kamera ilə və ya token daxil edərək növbəyə düş.</p>
              </button>
            </div>
          </section>
        ) : null}

        {screen === 'registrationType' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>Qeydiyyat növünü seç</h2>
            </div>
            <div className="choiceColumn">
              <button className="choiceCard" type="button" onClick={() => startRegistration('FERDI')}>
                <span className="choiceLabel">Fərdi</span>
                <strong>Bir növbə yarat</strong>
                <p>Fərdi hesab yalnız bir növbə aça bilər.</p>
              </button>
              <button className="choiceCard" type="button" onClick={() => startRegistration('KORPORATIV')}>
                <span className="choiceLabel">Korporativ</span>
                <strong>Çoxlu növbə yarat</strong>
                <p>Korporativ hesab istədiyi qədər növbə idarə edə bilər.</p>
              </button>
            </div>
          </section>
        ) : null}

        {screen === 'register' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>{registrationForm.registrationType === 'KORPORATIV' ? 'Korporativ qeydiyyat' : 'Fərdi qeydiyyat'}</h2>
            </div>
            <form className="form" onSubmit={handleRegister}>
              <div className="fieldRow">
                <label className="field">
                  <span>Ad</span>
                  <input className="input" required minLength={2} maxLength={80} value={registrationForm.firstName} onChange={(event) => setRegistrationForm((current) => ({ ...current, firstName: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Soyad</span>
                  <input className="input" required minLength={2} maxLength={80} value={registrationForm.lastName} onChange={(event) => setRegistrationForm((current) => ({ ...current, lastName: event.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span>Email</span>
                <input className="input" required maxLength={254} type="email" value={registrationForm.email} onChange={(event) => setRegistrationForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" required minLength={8} maxLength={72} pattern="(?=.*[A-Za-zƏÖÜĞÇŞİəöüğçşı])(?=.*\d).{8,72}" title="Ən azı 8 simvol, bir hərf və bir rəqəm" type="password" value={registrationForm.password} onChange={(event) => setRegistrationForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <div className="paymentBox">
                <div className="paymentHeader">
                  <h3>Kapital Bank ödənişi</h3>
                  <span className="pendingBadge">Test mühiti</span>
                </div>
                <p className="hint">Kart məlumatlarını burada yazmağa ehtiyac yoxdur. "Ödəniş et" düyməsindən sonra birbaşa bankın test səhifəsinə keçəcəksən.</p>
              </div>
              <button className="button" type="submit" disabled={isRegistering}>
                {isRegistering ? 'Sessiya yaradılır...' : 'Ödəniş et'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'paymentCheckout' && paymentSession ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <div>
                <h2>Kapital Bank test ödənişi</h2>
                <p className="mutedText">Ödəniş bankın test səhifəsində tamamlanır. Qayıdandan sonra status burada yoxlanılır.</p>
              </div>
            </div>
            <div className="paymentBox">
              <p><strong>Provider:</strong> {paymentSession.provider}</p>
              <p><strong>Mühit:</strong> {paymentSession.paymentMode}</p>
              <p><strong>Qeydiyyat tipi:</strong> {paymentSession.registrationType === 'KORPORATIV' ? 'Korporativ' : 'Fərdi'}</p>
              <p><strong>Məbləğ:</strong> {paymentSession.amount} {paymentSession.currency}</p>
              <p><strong>Status:</strong> {paymentSession.status}</p>
              {paymentSession.externalOrderId ? <p><strong>Bank sifarişi:</strong> {paymentSession.externalOrderId}</p> : null}
              {paymentSession.paymentReference ? <p><strong>Reference:</strong> {paymentSession.paymentReference}</p> : null}
            </div>
            {paymentSession.status === 'PENDING' ? (
              <div className="actionRow">
                <button className="button" type="button" disabled={isRegistering || !paymentSession.checkoutUrl} onClick={openBankCheckout}>
                  Ödəniş et
                </button>
              </div>
            ) : null}
            {paymentSession.status !== 'PENDING' ? (
              <div className="actionRow">
                <button className="secondaryButton" type="button" onClick={() => navigateTo('register')}>
                  Yenidən yoxla
                </button>
              </div>
            ) : null}
            {paymentSession.status === 'PENDING' ? (
              <p className="hint">"Ödəniş et" düyməsini bas, bank səhifəsində kart məlumatlarını daxil et. Qayıtdıqdan sonra status avtomatik yoxlanacaq.</p>
            ) : null}
            {paymentSession.status === 'FAILED' || paymentSession.status === 'CANCELLED' ? (
              <p className="error">Ödəniş tamamlanmadı. Profil expired edildi və aktiv növbələr deaktiv olacaq.</p>
            ) : null}
            {paymentSession.status === 'COMPLETED' ? (
              <p className="resultBanner">Ödəniş uğurla tamamlandı. Profil aktivdir.</p>
            ) : null}
          </section>
        ) : null}

        {screen === 'creatorLogin' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>Növbə yaradan girişi</h2>
            </div>
            <form className="form" onSubmit={handleCreatorLogin}>
              <label className="field">
                <span>Email</span>
                <input className="input" type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="button" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Daxil olunur...' : 'Daxil ol'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'customerLogin' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <div>
                <h2>Müştəri girişi</h2>
                <p className="mutedText">Tarixçə, qiymətləndirmə və evdən növbəyə qoşulma burada olacaq.</p>
              </div>
              <button className="secondaryButton" type="button" onClick={() => navigateTo('customerRegister')}>Müştəri qeydiyyatı</button>
            </div>
            <form className="form" onSubmit={handleCustomerLogin}>
              <label className="field">
                <span>Email</span>
                <input className="input" type="email" value={customerLoginForm.email} onChange={(event) => setCustomerLoginForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" type="password" value={customerLoginForm.password} onChange={(event) => setCustomerLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="button" type="submit" disabled={isCustomerLoggingIn}>
                {isCustomerLoggingIn ? 'Daxil olunur...' : 'Müştəri kimi daxil ol'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'customerRegister' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>Müştəri qeydiyyatı</h2>
            </div>
            <form className="form" onSubmit={handleCustomerRegister}>
              <div className="fieldRow">
                <label className="field">
                  <span>Ad</span>
                  <input className="input" required minLength={2} maxLength={80} value={customerRegisterForm.firstName} onChange={(event) => setCustomerRegisterForm((current) => ({ ...current, firstName: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Soyad</span>
                  <input className="input" required minLength={2} maxLength={80} value={customerRegisterForm.lastName} onChange={(event) => setCustomerRegisterForm((current) => ({ ...current, lastName: event.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span>Email</span>
                <input className="input" required maxLength={254} type="email" value={customerRegisterForm.email} onChange={(event) => setCustomerRegisterForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" required minLength={8} maxLength={72} pattern="(?=.*[A-Za-zƏÖÜĞÇŞİəöüğçşı])(?=.*\d).{8,72}" title="Ən azı 8 simvol, bir hərf və bir rəqəm" type="password" value={customerRegisterForm.password} onChange={(event) => setCustomerRegisterForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="button" type="submit" disabled={isCustomerRegistering}>
                {isCustomerRegistering ? 'Qeydiyyat gedir...' : 'Müştəri hesabı yarat'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'dashboard' && registration ? (
          <section className="panel">
            <div className="sectionHeader">
              <div>
                <h2>{registration.firstName} {registration.lastName}</h2>
                <p className="mutedText">{registration.email}</p>
                <p className="mutedText">{registration.registrationType === 'KORPORATIV' ? 'Korporativ hesab' : 'Fərdi hesab'}</p>
                <p className="mutedText">Qeydiyyat tarixi: {formatDateTime(registration.createdAt)}</p>
              </div>
              <button className="button" type="button" onClick={() => navigateTo('createQueue')}>Növbə yarat</button>
            </div>
            {queues.length === 0 ? (
              <p className="hint">Hələ növbə yoxdur.</p>
            ) : (
              <div className="queueList">
                {queues.map((queue) => (
                  <article className="queueCard" key={queue.id}>
                    <div className="queueMeta">
                      <p className="queueTitle">{queue.serviceName}</p>
                      <p>{queue.address}</p>
                      <p className="mutedText">{queue.active ? 'Aktiv növbə' : 'Deaktiv növbə'}</p>
                      <p className="mutedText">Reset: {formatResetRule(queue.resetMode, queue.resetAt)}</p>
                      {queue.managerUsername ? <p className="mutedText">Növbə idarəçisi: {queue.managerUsername}</p> : null}
                      <div className="chips">
                        {queue.categories.map((category) => (
                          <span className="chip staticChip" key={category}>{category}</span>
                        ))}
                      </div>
                    </div>
                    <div className="qrBox">
                      <div className="printCard" id={`queue-print-${queue.id}`}>
                        <p className="printBrand">E-Novbe</p>
                        <p className="printService">{queue.serviceName}</p>
                        <p className="printAddress">{queue.address}</p>
                        <QRCodeSVG value={queue.qrToken} size={120} />
                        <p className="printUidLabel">UID kodu</p>
                        <code className="uidCode">{queue.qrToken}</code>
                        <p className="printHint">Scan alinmasa bu UID kodu ile novbeye dusmek olar.</p>
                      </div>
                      <button className="secondaryButton" type="button" onClick={() => printQueueQr(`queue-print-${queue.id}`)}>Cap et</button>
                      <button className="secondaryButton" type="button" onClick={() => openQueueDetail(queue.id, { registrationId: registration.id })}>Növbəni izlə</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {screen === 'customerDashboard' && customer ? (
          <section className="panel">
            <div className="sectionHeader">
              <div>
                <h2>{customer.firstName} {customer.lastName}</h2>
                <p className="mutedText">{customer.email}</p>
                <p className="mutedText">Müştəri qeydiyyat tarixi: {formatDateTime(customer.createdAt)}</p>
              </div>
              <div className="actionRow">
                <button className="button" type="button" onClick={() => navigateTo('customerJoin')}>Evdən növbəyə qoşul</button>
                <button className="secondaryButton" type="button" onClick={() => navigateTo('scan')}>Scan et</button>
              </div>
            </div>
            {isLoadingCustomerHistory ? <p className="hint">Tarixçə yüklənir...</p> : null}
            {customerHistory.length === 0 ? (
              <p className="hint">Hələ heç bir növbə tarixçəsi yoxdur.</p>
            ) : (
              <div className="queueList">
                {customerHistory.map((item, index) => (
                  <article className="queueHistoryCard" key={item.entryId}>
                    <div className="queueMeta">
                      <p className="queueTitle">{item.queueName}</p>
                      <p>Əsas növbə adı: {item.serviceName}</p>
                      <p>{item.address}</p>
                      <p>Nömrəniz: {item.queueNumber}</p>
                      <p>Hazırda xidmət: {item.currentServingNumber}</p>
                      <p>Sizdən öncə gözləyən: {item.waitingAhead}</p>
                      <p>Orta xidmət vaxtı: {item.averageServiceMinutes} dəq</p>
                      <p>Qoşulma vaxtı: {formatDateTime(item.joinedAt)}</p>
                      <div className="chips">
                        {item.categories.map((category) => (
                          <span className="chip staticChip" key={`${item.entryId}-${category}`}>{category}</span>
                        ))}
                      </div>
                    </div>
                    <div className="historyEditor">
                      <label className="field">
                        <span>Bu növbənin səndə adı</span>
                        <input
                          className="input"
                          value={item.draftName ?? item.queueName}
                          onChange={(event) => setCustomerHistory((current) => current.map((historyItem, historyIndex) => historyIndex === index ? { ...historyItem, draftName: event.target.value } : historyItem))}
                        />
                      </label>
                      <button className="secondaryButton" type="button" disabled={isSavingHistoryItem === item.entryId} onClick={() => saveHistoryRename(item.entryId, item.draftName ?? item.queueName)}>
                        Adı saxla
                      </button>
                      <label className="field">
                        <span>Qiymət</span>
                        <select
                          className="input"
                          value={item.draftRating ?? 5}
                          onChange={(event) => setCustomerHistory((current) => current.map((historyItem, historyIndex) => historyIndex === index ? { ...historyItem, draftRating: event.target.value } : historyItem))}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Qeyd</span>
                        <input
                          className="input"
                          value={item.draftNote ?? ''}
                          onChange={(event) => setCustomerHistory((current) => current.map((historyItem, historyIndex) => historyIndex === index ? { ...historyItem, draftNote: event.target.value } : historyItem))}
                        />
                      </label>
                      <button className="button" type="button" disabled={isSavingHistoryItem === item.entryId} onClick={() => saveHistoryRating(item.entryId, item.draftRating ?? 5, item.draftNote ?? '')}>
                        Qiyməti saxla
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {screen === 'customerJoin' && customer ? (
          <section className="panel">
            <div className="sectionHeader">
              <div>
                <h2>Evdən növbəyə qoşul</h2>
                <p className="mutedText">Barcode scan etmədən açıq növbələrdən birini seçə bilərsiniz.</p>
              </div>
            </div>
            <form className="form narrowPanel" onSubmit={handleCustomerJoin}>
              <label className="field">
                <span>Növbə seç</span>
                <select className="input" value={customerJoinForm.queueId} onChange={(event) => setCustomerJoinForm((current) => ({ ...current, queueId: event.target.value }))}>
                  <option value="">Seçin</option>
                  {publicQueues.map((queue) => (
                    <option key={queue.id} value={queue.id}>{queue.serviceName} - {queue.address}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Sənin üçün görünən ad</span>
                <input className="input" value={customerJoinForm.displayName} onChange={(event) => setCustomerJoinForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Məsələn: Uzi üçün növbə" />
              </label>
              <button className="button" type="submit" disabled={isJoiningQueue || !customerJoinForm.queueId}>
                {isJoiningQueue ? 'Qoşulur...' : 'Növbəyə qoşul'}
              </button>
            </form>
            <div className="queueList">
              {publicQueues.map((queue) => (
                <article className="queueCard" key={queue.id}>
                  <div className="queueMeta">
                    <p className="queueTitle">{queue.serviceName}</p>
                    <p>{queue.address}</p>
                    <p className="mutedText">Sahib: {queue.fullName}</p>
                    <div className="chips">
                      {queue.categories.map((category) => (
                        <span className="chip staticChip" key={`${queue.id}-${category}`}>{category}</span>
                      ))}
                    </div>
                  </div>
                  <button className="secondaryButton" type="button" onClick={() => setCustomerJoinForm((current) => ({ ...current, queueId: String(queue.id), displayName: current.displayName || queue.serviceName }))}>
                    Seç
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {screen === 'createQueue' && registration ? (
          <section className="panel">
            <div className="sectionHeader">
              <h2>Yeni növbə yarat</h2>
            </div>
            <form className="form" onSubmit={handleCreateQueue}>
              <label className="field">
                <span>Ünvan</span>
                <input className="input" disabled={individualLimitReached} value={queueForm.address} onChange={(event) => setQueueForm((current) => ({ ...current, address: event.target.value }))} />
              </label>
              <label className="field">
                <span>İşin adı</span>
                <input className="input" disabled={individualLimitReached} value={queueForm.serviceName} onChange={(event) => setQueueForm((current) => ({ ...current, serviceName: event.target.value }))} />
              </label>
              <label className="field">
                <span>Kateqoriya</span>
                <div className="inlineAction">
                  <input className="input" disabled={individualLimitReached} value={queueForm.categoryInput} onChange={(event) => setQueueForm((current) => ({ ...current, categoryInput: event.target.value }))} />
                  <button className="secondaryButton" type="button" onClick={addCategory}>Əlavə et</button>
                </div>
              </label>
              <label className="field">
                <span>Reset qaydası</span>
                <select className="input" value={queueForm.resetMode} onChange={(event) => setQueueForm((current) => ({ ...current, resetMode: event.target.value, resetAt: event.target.value === 'CUSTOM_DATE' ? current.resetAt : '' }))}>
                  <option value="DAILY">Hər gün gecə 00:00-da sıfırlansın</option>
                  <option value="CUSTOM_DATE">Seçilən günədək aktiv olsun</option>
                  <option value="MANUAL">Yalnız manual sıfırlansın</option>
                </select>
              </label>
              {queueForm.resetMode === 'CUSTOM_DATE' ? (
                <label className="field">
                  <span>Son aktiv gün</span>
                  <input className="input" type="date" value={queueForm.resetAt} onChange={(event) => setQueueForm((current) => ({ ...current, resetAt: event.target.value }))} />
                </label>
              ) : null}
              <div className="chips">
                {queueForm.categories.map((category) => (
                  <button key={category} className="chip" type="button" onClick={() => removeCategory(category)}>
                    {category} x
                  </button>
                ))}
              </div>
              {registration.registrationType === 'KORPORATIV' ? (
                <div className="adminSection">
                  <h3>Bu növbə üçün idarəçi istifadəçi</h3>
                  <label className="field">
                    <span>İstifadəçi adı</span>
                    <input className="input" value={queueForm.managerUsername} onChange={(event) => setQueueForm((current) => ({ ...current, managerUsername: event.target.value }))} />
                  </label>
                  <label className="field">
                    <span>Şifrə</span>
                    <input className="input" type="password" value={queueForm.managerPassword} onChange={(event) => setQueueForm((current) => ({ ...current, managerPassword: event.target.value }))} />
                  </label>
                </div>
              ) : null}
              {individualLimitReached ? <p className="hint">Fərdi hesab yalnız bir növbə yarada bilər.</p> : null}
              <button className="button" type="submit" disabled={isCreatingQueue || individualLimitReached}>
                {isCreatingQueue ? 'Növbə yaradılır...' : 'Növbə yarat'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'queueDetail' && selectedQueueDetail ? (
          <section className="panel">
            <div className="sectionHeader">
              <div>
                <h2>{selectedQueueDetail.serviceName}</h2>
                <p className="mutedText">{selectedQueueDetail.address}</p>
                <p className="mutedText">Sahib: {selectedQueueDetail.ownerFullName}</p>
                {selectedQueueDetail.managerUsername ? <p className="mutedText">Növbə idarəçisi: {selectedQueueDetail.managerUsername}</p> : null}
                <p className="mutedText">Status: {selectedQueueDetail.active ? 'Aktiv' : 'Deaktiv'}</p>
                <p className="mutedText">Reset: {formatResetRule(selectedQueueDetail.resetMode, selectedQueueDetail.resetAt)}</p>
              </div>
              <div className="actionRow">
                <button className="button" type="button" onClick={handleAdvanceQueue} disabled={isAdvancingQueue || !selectedQueueDetail.active}>
                  {isAdvancingQueue ? 'Gedir...' : 'Növbəti növbəyə keç'}
                </button>
                <button className="secondaryButton" type="button" onClick={handleResetQueue} disabled={isAdvancingQueue}>
                  Manual sıfırla
                </button>
              </div>
            </div>
            {isLoadingQueueDetail ? <p className="hint">Yüklənir...</p> : null}
            <div className="statsGrid">
              <article className="statCard"><span>Hazırda xidmət</span><strong>{selectedQueueDetail.currentServingNumber}</strong></article>
              <article className="statCard"><span>Ümumi növbə</span><strong>{selectedQueueDetail.totalCustomers}</strong></article>
              <article className="statCard"><span>Gözləyənlər</span><strong>{selectedQueueDetail.waitingCount}</strong></article>
              <article className="statCard"><span>1 nəfər orta vaxt</span><strong>{selectedQueueDetail.averageServiceMinutes} dəq</strong></article>
            </div>
            <div className="adminSection">
              <p className="hint">Təqribi gözləmə: {formatDuration(selectedQueueDetail.estimatedWaitMinutes)}</p>
              <p className="hint">Son keçid: {formatDateTime(selectedQueueDetail.lastAdvancedAt)}</p>
            </div>
            <div className="qrPrintSection">
              <div className="printCard" id={`queue-print-${selectedQueueDetail.id}`}>
                <p className="printBrand">E-Novbe</p>
                <p className="printService">{selectedQueueDetail.serviceName}</p>
                <p className="printAddress">{selectedQueueDetail.address}</p>
                <QRCodeSVG value={selectedQueueDetail.qrToken} size={180} />
                <p className="printUidLabel">UID kodu</p>
                <code className="uidCode">{selectedQueueDetail.qrToken}</code>
                <p className="printHint">Scan alinmasa bu UID kodunu yazib novbeye dusmek olar.</p>
              </div>
              <div className="actionRow">
                <button className="button" type="button" onClick={() => printQueueQr(`queue-print-${selectedQueueDetail.id}`)}>Barkodu cap et</button>
              </div>
            </div>
          </section>
        ) : null}

        {screen === 'scan' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <div>
                <h2>Scan et</h2>
                <p className="mutedText">İstəsən kamera ilə oxut, istəsən tokeni əl ilə daxil et.</p>
              </div>
            </div>
            {customer ? (
              <label className="field">
                <span>Tarixçəndə görünəcək ad</span>
                <input className="input" value={scanForm.displayName} onChange={(event) => setScanForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Məsələn: Seyidin qəbulu" />
              </label>
            ) : (
              <div className="fieldRow">
                <label className="field">
                  <span>Ad</span>
                  <input className="input" value={scanForm.firstName} onChange={(event) => setScanForm((current) => ({ ...current, firstName: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Soyad</span>
                  <input className="input" value={scanForm.lastName} onChange={(event) => setScanForm((current) => ({ ...current, lastName: event.target.value }))} />
                </label>
              </div>
            )}
            {isCameraAvailable ? (
              <div className="adminSection">
                <div id={scannerRegionIdRef.current} className="cameraPreview" />
                <div className="toolbar">
                  {!isCameraActive ? (
                    <button className="secondaryButton" type="button" onClick={startCameraScanner} disabled={isCameraStarting}>
                      {isCameraStarting ? 'Kamera açılır...' : 'Kameranı aç'}
                    </button>
                  ) : (
                    <button className="secondaryButton" type="button" onClick={stopCameraScanner}>Kameranı bağla</button>
                  )}
                </div>
              </div>
            ) : (
              <p className="hint">Bu brauzer kamera ilə QR oxumağı dəstəkləmir.</p>
            )}
            <form className="form" onSubmit={handleScan}>
              <label className="field">
                <span>QR token ve ya UID kodu</span>
                <input className="input" value={scanForm.qrToken} onChange={(event) => setScanForm((current) => ({ ...current, qrToken: event.target.value }))} placeholder="Barkodun altindaki UID kodunu daxil edin" />
              </label>
              <button className="button" type="submit" disabled={isScanning}>
                {isScanning ? 'Scan gedir...' : 'Scan et və növbəyə düş'}
              </button>
            </form>
            {scanResult ? (
              <div className="scanCard">
                <strong>{scanResult.serviceName}</strong>
                <p>{scanResult.address}</p>
                <p>Sizi yaradan: {scanResult.ownerFullName}</p>
                <p>Növbəniz: {scanResult.queueNumber}</p>
                <p>Hazırda xidmət: {scanResult.currentServingNumber}</p>
                <p>Gözləyənlər: {scanResult.waitingCount}</p>
                <p>Ümumi növbə: {scanResult.totalCustomers}</p>
                <p>1 nəfər orta vaxt: {scanResult.averageServiceMinutes} dəq</p>
                <p>Təqribi gözləmə: {formatDuration(scanResult.estimatedWaitMinutes)}</p>
                <div className="chips">
                  {scanResult.categories.map((category) => (
                    <span className="chip staticChip" key={category}>{category}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {screen === 'queueManagerLogin' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>Növbə idarəçisi girişi</h2>
            </div>
            <form className="form" onSubmit={handleQueueManagerLogin}>
              <label className="field">
                <span>İstifadəçi adı</span>
                <input className="input" value={queueManagerLoginForm.username} onChange={(event) => setQueueManagerLoginForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" type="password" value={queueManagerLoginForm.password} onChange={(event) => setQueueManagerLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="button" type="submit" disabled={isQueueManagerLoggingIn}>
                {isQueueManagerLoggingIn ? 'Daxil olunur...' : 'Daxil ol'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'adminLogin' ? (
          <section className="panel narrowPanel">
            <div className="sectionHeader">
              <h2>Admin girişi</h2>
            </div>
            <form className="form" onSubmit={handleAdminLogin}>
              <label className="field">
                <span>İstifadəçi adı</span>
                <input className="input" value={adminLoginForm.username} onChange={(event) => setAdminLoginForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label className="field">
                <span>Şifrə</span>
                <input className="input" type="password" value={adminLoginForm.password} onChange={(event) => setAdminLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="button" type="submit" disabled={isAdminLoggingIn}>
                {isAdminLoggingIn ? 'Daxil olunur...' : 'Admin daxil ol'}
              </button>
            </form>
          </section>
        ) : null}

        {screen === 'adminDashboard' && adminSession ? (
          <section className="adminWorkspace">
            <header className="adminHero">
              <div>
                <p className="adminKicker">İdarəetmə mərkəzi</p>
                <h2>Sistemin nəbzi, bir baxışda.</h2>
                <p>Hesablar, ödənişlər və aktiv növbələr üzrə canlı əməliyyat görünüşü.</p>
              </div>
              <div className="adminHeroActions">
                <span className="liveStatus"><i /> Sistem işləyir</span>
                <button className="adminRefreshButton" type="button" disabled={isLoadingAdminDashboard} onClick={() => loadAdminDashboard(adminFilters).catch(() => {})}>
                  {isLoadingAdminDashboard ? 'Yenilənir...' : 'Məlumatları yenilə'}
                </button>
              </div>
            </header>

            <div className="adminMetricGrid">
              {[
                { label: 'Növbə yaradanlar', value: adminDashboard?.summary.totalUsers ?? 0, note: `${adminDashboard?.summary.totalPaidUsers ?? 0} ödənişli`, tone: 'blue' },
                { label: 'Müştərilər', value: adminDashboard?.summary.totalCustomers ?? 0, note: 'qeydiyyatlı hesab', tone: 'cyan' },
                { label: 'Ümumi gəlir', value: `${adminDashboard?.summary.totalRevenue ?? 0} ₼`, note: `${adminDashboard?.summary.completedPayments ?? 0} uğurlu ödəniş`, tone: 'gold' },
                { label: 'Aktiv növbələr', value: adminDashboard?.summary.activeQueues ?? 0, note: `${adminDashboard?.summary.totalQueues ?? 0} ümumi növbə`, tone: 'green' },
                { label: 'Gözləyən ödəniş', value: adminDashboard?.summary.pendingPayments ?? 0, note: 'bank təsdiqi gözlənilir', tone: 'orange' },
                { label: 'Müddəti bitən', value: adminDashboard?.summary.expiredUsers ?? 0, note: 'expired hesab', tone: 'red' }
              ].map((metric) => (
                <article className={`adminMetric adminMetric-${metric.tone}`} key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.note}</small>
                </article>
              ))}
            </div>

            <div className="adminOverviewGrid">
              <article className="adminSurface revenueSurface">
                <div className="adminSurfaceHeader">
                  <div>
                    <p className="adminSectionLabel">Maliyyə</p>
                    <h3>Aylıq gəlir dinamikası</h3>
                  </div>
                  <span className="adminCountPill">Son {adminDashboard?.monthlyPayments?.length ?? 0} ay</span>
                </div>
                {(adminDashboard?.monthlyPayments ?? []).length ? (
                  <div className="revenueChart">
                    {(adminDashboard?.monthlyPayments ?? []).slice(0, 8).reverse().map((monthItem) => (
                      <div className="revenueRow" key={monthItem.month}>
                        <span>{formatMonth(monthItem.month)}</span>
                        <div className="revenueTrack">
                          <i style={{ width: `${getRevenueBarWidth(monthItem.revenueAmount, adminDashboard.monthlyPayments)}%` }} />
                        </div>
                        <strong>{monthItem.revenueAmount} ₼</strong>
                        <small>{monthItem.registrations} ödəniş</small>
                      </div>
                    ))}
                  </div>
                ) : <div className="adminEmpty">Tamamlanmış ödəniş olduqda aylıq qrafik burada görünəcək.</div>}
              </article>

              <article className="adminSurface pulseSurface">
                <div className="adminSurfaceHeader">
                  <div>
                    <p className="adminSectionLabel">Əməliyyat</p>
                    <h3>Platforma vəziyyəti</h3>
                  </div>
                </div>
                <div className="pulseList">
                  <div><span>Aktiv növbə nisbəti</span><strong>{formatPercent(adminDashboard?.summary.activeQueues, adminDashboard?.summary.totalQueues)}</strong></div>
                  <div><span>Ödənişli hesab nisbəti</span><strong>{formatPercent(adminDashboard?.summary.totalPaidUsers, adminDashboard?.summary.totalUsers)}</strong></div>
                  <div><span>Bankda gözləyən sorğular</span><strong>{adminDashboard?.summary.pendingPayments ?? 0}</strong></div>
                  <div><span>Deaktiv növbələr</span><strong>{Math.max(0, (adminDashboard?.summary.totalQueues ?? 0) - (adminDashboard?.summary.activeQueues ?? 0))}</strong></div>
                </div>
              </article>
            </div>

            <article className="adminSurface">
              <div className="adminSurfaceHeader filterHeader">
                <div>
                  <p className="adminSectionLabel">Hesablar</p>
                  <h3>Növbə yaradanların reyestri</h3>
                </div>
                <span className="adminCountPill">{adminDashboard?.registrations?.length ?? 0} nəticə</span>
              </div>
              <form className="adminFilterBar" onSubmit={handleAdminFilterSubmit}>
                <label className="adminSearchField">
                  <span>Axtarış</span>
                  <input placeholder="Ad, email və ya reference" value={adminFilters.search} onChange={(event) => setAdminFilters((current) => ({ ...current, search: event.target.value }))} />
                </label>
                <label><span>Hesab növü</span><select value={adminFilters.registrationType} onChange={(event) => setAdminFilters((current) => ({ ...current, registrationType: event.target.value }))}><option value="ALL">Hamısı</option><option value="FERDI">Fərdi</option><option value="KORPORATIV">Korporativ</option></select></label>
                <label><span>Ödəniş</span><select value={adminFilters.paymentStatus} onChange={(event) => setAdminFilters((current) => ({ ...current, paymentStatus: event.target.value }))}><option value="ALL">Hamısı</option><option value="PAID">Ödənib</option><option value="UNPAID">Ödənməyib</option></select></label>
                <label><span>Qeydiyyat ayı</span><input type="month" value={adminFilters.month} onChange={(event) => setAdminFilters((current) => ({ ...current, month: event.target.value }))} /></label>
                <button className="adminApplyButton" type="submit" disabled={isLoadingAdminDashboard}>Tətbiq et</button>
                <button className="adminResetButton" type="button" onClick={handleAdminFiltersReset}>Sıfırla</button>
              </form>
              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>Hesab</th>
                      <th>Növ və status</th>
                      <th>Ödəniş</th>
                      <th>Reference</th>
                      <th>Növbələr</th>
                      <th>Qeydiyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminDashboard?.registrations ?? []).map((item) => (
                      <tr key={item.id}>
                        <td><div className="identityCell"><span>{getInitials(item.fullName)}</span><div><strong>{item.fullName}</strong><small>{item.email}</small><small>ID #{item.id}</small></div></div></td>
                        <td><div className="stackedBadges"><span className="typeBadge">{formatRegistrationType(item.registrationType)}</span><span className={`statusBadge status-${String(item.status).toLowerCase()}`}>{formatRegistrationStatus(item.status)}</span></div></td>
                        <td><strong>{item.paymentAmount} ₼</strong><small className={item.paid ? 'paymentOk' : 'paymentMuted'}>{item.paid ? 'Ödənib' : 'Ödənməyib'}</small></td>
                        <td><code className="referenceCode">{item.paymentReference || '-'}</code></td>
                        <td><strong>{item.queueCount}</strong><small>növbə</small></td>
                        <td>{formatDateTime(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!(adminDashboard?.registrations ?? []).length ? <div className="adminEmpty">Bu filtrlərə uyğun hesab tapılmadı.</div> : null}
            </article>

            <div className="adminDataGrid">
              <article className="adminSurface">
                <div className="adminSurfaceHeader"><div><p className="adminSectionLabel">Bank axını</p><h3>Son ödənişlər</h3></div><span className="adminCountPill">Son 50</span></div>
                <div className="adminTableWrap compactTableWrap">
                  <table className="adminTable compactAdminTable">
                    <thead><tr><th>Müştəri</th><th>Status</th><th>Məbləğ</th><th>Sifariş</th><th>Tarix</th></tr></thead>
                    <tbody>{(adminDashboard?.recentPayments ?? []).map((payment) => (
                      <tr key={payment.id}>
                        <td><strong>{payment.customerName}</strong><small>{payment.email}</small></td>
                        <td><span className={`statusBadge payment-${String(payment.status).toLowerCase()}`}>{formatPaymentStatus(payment.status)}</span></td>
                        <td><strong>{payment.amount} {payment.currency}</strong><small>{payment.provider}</small></td>
                        <td><code className="referenceCode">{payment.externalOrderId || '-'}</code></td>
                        <td>{formatDateTime(payment.completedAt || payment.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {!(adminDashboard?.recentPayments ?? []).length ? <div className="adminEmpty">Hələ ödəniş əməliyyatı yoxdur.</div> : null}
              </article>

              <article className="adminSurface">
                <div className="adminSurfaceHeader"><div><p className="adminSectionLabel">Canlı monitorinq</p><h3>Növbələr</h3></div><span className="adminCountPill">{adminDashboard?.queues?.length ?? 0} növbə</span></div>
                <div className="queueMonitorList">
                  {(adminDashboard?.queues ?? []).map((queue) => (
                    <div className="queueMonitorItem" key={queue.id}>
                      <div className="queueMonitorTop"><span className={queue.active ? 'queueState active' : 'queueState'}>{queue.active ? 'Aktiv' : 'Deaktiv'}</span><small>#{queue.id}</small></div>
                      <strong>{queue.serviceName}</strong>
                      <p>{queue.address}</p>
                      <div className="queueMonitorNumbers"><span><b>{queue.currentServingNumber}</b> xidmət</span><span><b>{queue.waitingCount}</b> gözləyir</span><span><b>{queue.averageServiceMinutes}</b> dəq orta</span></div>
                      <small>{queue.ownerFullName} · {formatRegistrationType(queue.registrationType)}</small>
                    </div>
                  ))}
                </div>
                {!(adminDashboard?.queues ?? []).length ? <div className="adminEmpty">Hələ növbə yaradılmayıb.</div> : null}
              </article>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatMonth(value) {
  if (!value) return '-';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('az-AZ', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
}

function getRevenueBarWidth(amount, monthlyPayments) {
  const maximum = Math.max(1, ...(monthlyPayments ?? []).map((item) => item.revenueAmount));
  return Math.max(8, Math.round((amount / maximum) * 100));
}

function formatPercent(value, total) {
  if (!total) return '0%';
  return `${Math.round(((value ?? 0) / total) * 100)}%`;
}

function getInitials(fullName) {
  return String(fullName || '?').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('az-AZ');
}

function formatRegistrationType(value) {
  return value === 'KORPORATIV' ? 'Korporativ' : 'Fərdi';
}

function formatRegistrationStatus(value) {
  if (value === 'ACTIVE') return 'Aktiv';
  if (value === 'EXPIRED') return 'Müddəti bitib';
  return 'Ödəniş gözləyir';
}

function formatPaymentStatus(value) {
  if (value === 'COMPLETED') return 'Uğurlu';
  if (value === 'PENDING') return 'Gözləyir';
  if (value === 'CANCELLED') return 'Ləğv edilib';
  return 'Uğursuz';
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} dəq`;
  return `${hours} saat ${minutes} dəq`;
}

function formatResetRule(resetMode, resetAt) {
  if (resetMode === 'MANUAL') {
    return 'yalnız manual sıfırlama';
  }
  if (resetMode === 'CUSTOM_DATE') {
    return resetAt ? `${formatDateTime(resetAt)} tarixində bağlanır` : 'seçilmiş tarixədək';
  }
  return 'hər gün gecə 00:00-da';
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
