# QA tools

Small scripts for checking the panel and the production API by hand. They need a Chrome with remote debugging on `127.0.0.1:9333` that has a logged-in Polyvik tab on `localhost:5173`. `api.mjs` reads that tab's session token once, over CDP, and keeps it only in memory.

Every script opens its own tab and closes it when done, so it never takes over the tab you are using.

| Script | Usage |
|---|---|
| `api.mjs` | `import { api } from './api.mjs'`, then `await api('/api/brands')`. Calls the production API with the QA tab's session. Takes a body object: `api(path, { method, body })`. |
| `cdp-shot.mjs` | `node cdp-shot.mjs <route> <out.png> [js to run first]`. Screenshots the local panel at 1440×900. |
| `cdp-mobile.mjs` | The same at phone size. |
| `ls-assets.mjs` | Lists each brand's Library assets and Feed items (ids, names, ref use). |
| `video-run.mjs` | `node video-run.mjs <n> <prompt.txt> <refs.json>`. Creates a real video job (**it spends video credits**), waits for it, downloads the mp4 and builds a frame contact sheet. |

Don't commit screenshots or outputs here; write them to a scratch folder.
