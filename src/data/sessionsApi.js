const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path, options, attempts = 5) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`/api${path}`, { headers: { 'content-type': 'application/json' }, ...options });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'API request failed');
      return await response.json();
    } catch (error) {
      if (attempt === attempts) throw new Error('Conversation database is starting. Please refresh once.');
      await wait(attempt * 250);
    }
  }
};

export const sessionsApi = {
  bootstrap: () => request('/bootstrap'),
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  list: () => request('/sessions'),
  get: (id) => request(`/sessions/${id}`),
  create: (title, message) => request('/sessions', { method: 'POST', body: JSON.stringify({ title, message }) }),
  addMessage: (id, role, text) => request(`/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ role, text }) }),
  remove: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  update: (id, changes) => request(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  respond: (sessionId, message, value = null) => request('/chat/respond', { method: 'POST', body: JSON.stringify({ sessionId, message, value }) }),
};