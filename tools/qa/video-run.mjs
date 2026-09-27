// node run.mjs <n> <prompt.txt> <refs.json>: crea el video, espera, descarga y arma la hoja de fotogramas.
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { api } from './api.mjs'
const [n, promptFile, refsFile] = process.argv.slice(2)
const b = (await api('/api/brands')).find((x) => /bruma/i.test(x.name))
const prompt = readFileSync(promptFile, 'utf8').trim()
const references = JSON.parse(readFileSync(refsFile, 'utf8'))
const job = await api('/api/video/jobs', { method: 'POST', body: { brandId: b.id, model: 'bytedance/seedance-2.5', prompt, references, contextTexts: [], duration: 7, resolution: '480p', aspectRatio: '9:16', muteAudio: false } })
console.log('job', job.id, job.status)
let j = job
for (let i = 0; i < 180 && !['done', 'failed', 'canceled'].includes(j.status); i++) {
  await new Promise((r) => setTimeout(r, 10000))
  j = await api(`/api/video/jobs/${job.id}`)
}
console.log('final', j.status, j.error || '', j.url || j.videoUrl || '')
writeFileSync(`v${n}.json`, JSON.stringify(j, null, 2))
const url = j.url || j.videoUrl || j.result?.url
if (url) {
  execFileSync('curl', ['-sL', url, '-o', `v${n}.mp4`])
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `v${n}.mp4`, '-vf', 'fps=1.5,scale=270:-1,tile=6x2', '-frames:v', '1', `v${n}-sheet.jpg`])
}
process.exit(0)
