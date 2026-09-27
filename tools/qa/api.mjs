// Llamadas a la API de producción con la sesión de la pestaña de QA (el token se lee una vez por CDP y vive solo en memoria).
export const API = 'https://api.polyvik.com'
let token = null
async function readToken() {
  const target = await (await fetch('http://127.0.0.1:9333/json/new?http://localhost:5173/', { method: 'PUT' })).json()
  await new Promise((r) => setTimeout(r, 3000))
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  const value = await new Promise((resolve) => {
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id === 1) resolve(m.result?.result?.value) })
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: "localStorage.getItem('polyvik_token')", returnByValue: true } }))
  })
  ws.close(); await fetch('http://127.0.0.1:9333/json/close/' + target.id).catch(() => {})
  if (!value) throw new Error('La pestaña de QA no tiene sesión')
  return value
}
export async function api(path, { method = 'GET', body, raw = false } = {}) {
  token ||= await readToken()
  const res = await fetch(API + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(900000) })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { json = { text: text.slice(-500) } }
  if (!res.ok) throw Object.assign(new Error(`${method} ${path} → ${res.status} ${json.message || json.text || ''}`), { status: res.status, json })
  return raw ? json : json.data
}
