/* ─── API Client ─────────────────────────────────────────────
   Thin wrapper around fetch. Attaches auth token automatically.
   ─────────────────────────────────────────────────────────── */
const API = (() => {
  let _token = localStorage.getItem('splitz_token') || null;

  function setToken(t) {
    _token = t;
    if (t) localStorage.setItem('splitz_token', t);
    else    localStorage.removeItem('splitz_token');
  }

  function getToken() { return _token; }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;

    const opts = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const get    = (path)       => request('GET',    path);
  const post   = (path, body) => request('POST',   path, body);
  const patch  = (path, body) => request('PATCH',  path, body);
  const del    = (path, body) => request('DELETE', path, body);

  // ── Auth ──────────────────────────────────────────────────
  async function register(name, email, password) {
    const data = await post('/api/auth/register', { name, email, password });
    if (data.token) setToken(data.token);
    return data;
  }
  async function login(email, password) {
    const data = await post('/api/auth/login', { email, password });
    if (data.token) setToken(data.token);
    return data;
  }
  async function logout() {
    await post('/api/auth/logout');
    setToken(null);
  }
  const getMe    = ()     => get('/api/users/me');
  const updateMe = (body) => patch('/api/users/me', body);

  // ── Friends ───────────────────────────────────────────────
  const getFriends        = ()     => get('/api/friends');
  const addFriend         = (email)=> post('/api/friends', { email });
  const removeFriend      = (id)   => del(`/api/friends/${id}`);
  const getFriendRequests = ()     => get('/api/friends/requests');
  const handleFriendRequest = (requestId, action) =>
    patch('/api/friends/requests', { requestId, action });

  // ── Groups ────────────────────────────────────────────────
  const getGroups   = ()          => get('/api/groups');
  const createGroup = (body)      => post('/api/groups', body);
  const getGroup    = (id)        => get(`/api/groups/${id}`);
  const updateGroup = (id, body)  => patch(`/api/groups/${id}`, body);
  const deleteGroup = (id)        => del(`/api/groups/${id}`);
  const addGroupMember    = (gid, userId) => post(`/api/groups/${gid}/members`, { userId });
  const removeGroupMember = (gid, userId) => del(`/api/groups/${gid}/members`, { userId });
  const getGroupExpenses  = (gid, params='') => get(`/api/groups/${gid}/expenses${params}`);
  const getGroupBalances  = (gid)            => get(`/api/groups/${gid}/balances`);
  const settleGroup       = (gid, body)      => post(`/api/groups/${gid}/settle`, body);

  // ── Expenses ──────────────────────────────────────────────
  const getExpenses    = (params='') => get(`/api/expenses${params}`);
  const createExpense  = (body)      => post('/api/expenses', body);
  const getExpense     = (id)        => get(`/api/expenses/${id}`);
  const updateExpense  = (id, body)  => patch(`/api/expenses/${id}`, body);
  const deleteExpense  = (id)        => del(`/api/expenses/${id}`);

  // ── Activity ──────────────────────────────────────────────
  const getActivity = (params='') => get(`/api/activity${params}`);

  return {
    setToken, getToken,
    register, login, logout, getMe, updateMe,
    getFriends, addFriend, removeFriend, getFriendRequests, handleFriendRequest,
    getGroups, createGroup, getGroup, updateGroup, deleteGroup,
    addGroupMember, removeGroupMember, getGroupExpenses, getGroupBalances, settleGroup,
    getExpenses, createExpense, getExpense, updateExpense, deleteExpense,
    getActivity,
  };
})();
