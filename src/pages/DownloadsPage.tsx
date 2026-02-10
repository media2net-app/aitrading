import { useState, useCallback } from 'react'
import { getAuthHeaders } from '../lib/api'

const EA_DOWNLOAD_PATH = '/downloads/AITradingBot.mq5'
const AGENT_DOWNLOADS = {
  windows: { url: '/downloads/AITradingAgent-win-x64.exe', label: 'Agent voor Windows (.exe)' },
  macIntel: { url: '/downloads/AITradingAgent-macos-x64', label: 'Agent voor Mac (Intel)' },
  macArm: { url: '/downloads/AITradingAgent-macos-arm64', label: 'Agent voor Mac (Apple Silicon M1/M2)' },
} as const
const AGENT_ELECTRON_DOWNLOADS = {
  windows: { url: '/downloads/AITradingAgent-Electron-Windows.exe', label: 'Agent voor Windows (Electron)' },
  mac: { url: '/downloads/AITradingAgent-Electron-Mac.dmg', label: 'Agent voor Mac (Electron .dmg)' },
} as const

export default function DownloadsPage() {
  const [os, setOs] = useState<'windows' | 'mac'>('windows')
  const [agentToken, setAgentToken] = useState<string | null>(null)
  const [agentTokenLoading, setAgentTokenLoading] = useState(false)
  const [agentTokenError, setAgentTokenError] = useState<string | null>(null)

  const generateAgentToken = useCallback(async () => {
    setAgentTokenError(null)
    setAgentToken(null)
    setAgentTokenLoading(true)
    try {
      const res = await fetch('/api/user/agent-token', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success && json.data?.token) {
        setAgentToken(json.data.token)
      } else {
        setAgentTokenError(json.error || 'Token genereren mislukt')
      }
    } catch {
      setAgentTokenError('Netwerkfout')
    } finally {
      setAgentTokenLoading(false)
    }
  }, [])

  const copyAgentToken = useCallback(() => {
    if (agentToken) {
      navigator.clipboard.writeText(agentToken)
    }
  }, [agentToken])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Downloads</h1>
        <p className="mt-1 text-gray-400">
          Download de EA en de local agent (Windows of Mac), volg de uitleg om te installeren en te koppelen met www.aitrading.software.
        </p>
      </div>

      {/* OS-keuze */}
      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Kies je besturingssysteem</h2>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setOs('windows')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              os === 'windows'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-dark-600 bg-dark-800 text-gray-400 hover:text-white'
            }`}
          >
            Windows
          </button>
          <button
            type="button"
            onClick={() => setOs('mac')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              os === 'mac'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-dark-600 bg-dark-800 text-gray-400 hover:text-white'
            }`}
          >
            Mac
          </button>
        </div>
      </section>

      {/* Download EA */}
      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">1. Download de EA (Expert Advisor)</h2>
        <p className="mt-1 text-sm text-gray-400">
          Eén bestand voor zowel Windows als Mac. Zet het in de Experts-map van MT5 en compileer.
        </p>
        <a
          href={EA_DOWNLOAD_PATH}
          download="AITradingBot.mq5"
          className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Download AITradingBot.mq5
        </a>
      </section>

      {/* Uitleg: plaatsen, compileren, chart */}
      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">2. Plaatsen, compileren en op de chart</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-gray-300">
          <li>
            <strong className="text-white">Plaats het .mq5-bestand</strong>
            {os === 'windows' && (
              <> in je MT5 Experts-map, bijv. <code className="rounded bg-dark-700 px-1 font-mono">C:\Users\&lt;gebruiker&gt;\AppData\Roaming\MetaQuotes\Terminal\&lt;ID&gt;\MQL5\Experts\Advisors\</code>. In MT5: File → Open Data Folder → ga naar <code className="rounded bg-dark-700 px-1 font-mono">MQL5\Experts\Advisors</code>.</>
            )}
            {os === 'mac' && (
              <> in de Advisors-map van MT5. In MT5 (Wine): File → Open Data Folder → <code className="rounded bg-dark-700 px-1 font-mono">MQL5\Experts\Advisors</code>. Het fysieke pad is vaak onder <code className="rounded bg-dark-700 px-1 font-mono">~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/...</code>.</>
            )}
          </li>
          <li>
            <strong className="text-white">Compileren:</strong> open het bestand in MetaEditor (F4 in MT5 of dubbelklik op de EA) en druk op <strong>F7</strong>. Er mag geen rode fout meer staan.
          </li>
          <li>
            <strong className="text-white">Bridge-map aanmaken:</strong> in MT5: File → Open Data Folder. Ga naar <code className="rounded bg-dark-700 px-1 font-mono">Terminal\Common\Files</code> (of <code className="rounded bg-dark-700 px-1 font-mono">Terminal/Common/Files</code> op Mac). Maak daar een map <code className="rounded bg-dark-700 px-1 font-mono">MT5_AI_Bot</code>. In de EA laat je <strong>BotFilePath</strong> staan op <code className="rounded bg-dark-700 px-1 font-mono">MT5_AI_Bot/</code>.
          </li>
          <li>
            <strong className="text-white">Op de chart:</strong> sleep <strong>AITradingBot</strong> op een XAUUSD- of GOLD-chart en zet <strong>AutoTrading</strong> aan (groene knop in de toolbar).
          </li>
        </ol>
      </section>

      {/* Waar staat mijn MT5_AI_Bot-map? */}
      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Waar staat mijn MT5_AI_Bot-map?</h2>
        <p className="mt-1 text-sm text-gray-400">
          Dit volledige pad heb je later nodig voor de local agent.
        </p>
        {os === 'windows' && (
          <div className="mt-4 rounded-lg border border-dark-600 bg-dark-800/30 p-4 text-sm">
            <p className="text-gray-300">
              Vaak: <code className="break-all rounded bg-dark-700 px-1 font-mono">%APPDATA%\MetaQuotes\Terminal\Common\Files\MT5_AI_Bot</code>
            </p>
            <p className="mt-2 text-gray-500">
              Of met een concreet Terminal-ID: <code className="break-all rounded bg-dark-700 px-1 font-mono">C:\Users\&lt;jouwgebruiker&gt;\AppData\Roaming\MetaQuotes\Terminal\&lt;ID&gt;\Common\Files\MT5_AI_Bot</code>. Gebruik in MT5 &quot;File → Open Data Folder&quot; om de juiste <code className="rounded bg-dark-700 px-1 font-mono">Terminal\Common\Files</code> te openen; de map <code className="rounded bg-dark-700 px-1 font-mono">MT5_AI_Bot</code> maak je daar zelf.
            </p>
          </div>
        )}
        {os === 'mac' && (
          <div className="mt-4 rounded-lg border border-dark-600 bg-dark-800/30 p-4 text-sm">
            <p className="text-gray-300">
              Bij MT5 via Wine vaak één van:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
              <li><code className="break-all rounded bg-dark-700 px-1 font-mono">~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/user/AppData/Roaming/MetaQuotes/Terminal/Common/Files/MT5_AI_Bot</code></li>
              <li><code className="break-all rounded bg-dark-700 px-1 font-mono">~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/Public/AppData/Roaming/MetaQuotes/Terminal/Common/Files/MT5_AI_Bot</code></li>
            </ul>
            <p className="mt-2 text-gray-500">
              Het kan per Wine-build verschillen. Gebruik in MT5 &quot;File → Open Data Folder&quot; en ga naar <code className="rounded bg-dark-700 px-1 font-mono">Terminal/Common/Files</code>; maak daar de map <code className="rounded bg-dark-700 px-1 font-mono">MT5_AI_Bot</code>. Het volledige pad dat je daar ziet, vul je later in de local agent in.
            </p>
          </div>
        )}
      </section>

      {/* Agent-token + Local agent */}
      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">3. Agent-token (voor de local agent)</h2>
        <p className="mt-1 text-sm text-gray-400">
          De local agent heeft een token nodig om met je account te verbinden. Genereer hier een token en vul die in de agent in. Bewaar het token veilig; bij een nieuwe generatie werkt het oude token niet meer.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generateAgentToken}
            disabled={agentTokenLoading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {agentTokenLoading ? 'Bezig…' : 'Genereer agent-token'}
          </button>
          {agentTokenError && (
            <p className="text-sm text-amber-400" role="alert">{agentTokenError}</p>
          )}
        </div>
        {agentToken && (
          <div className="mt-4 rounded-lg border border-dark-600 bg-dark-800/30 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Token (eenmalig zichtbaar – kopieer nu)</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-dark-700 px-2 py-1 font-mono text-sm text-gray-200">
                {agentToken}
              </code>
              <button
                type="button"
                onClick={copyAgentToken}
                className="rounded border border-dark-500 px-3 py-1 text-sm text-gray-300 hover:bg-dark-600"
              >
                Kopiëren
              </button>
            </div>
          </div>
        )}

        <h3 className="mt-6 text-base font-semibold text-white">Local agent (koppeling met www.aitrading.software)</h3>
        <p className="mt-1 text-sm text-gray-400">
          Om live te handelen vanaf het dashboard moet op je PC de <strong>local agent</strong> draaien. Die leest en schrijft de MT5_AI_Bot-map en praat met de API.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-white">Optie A: Electron-app (aanbevolen – geen Node nodig)</h4>
        <p className="mt-1 text-sm text-gray-400">
          Desktop-app met icoon in het systeemvak. Werkt op Windows en Mac; grotere download dan de kleine .exe hieronder.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={AGENT_ELECTRON_DOWNLOADS.windows.url}
            download
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            {AGENT_ELECTRON_DOWNLOADS.windows.label}
          </a>
          <a
            href={AGENT_ELECTRON_DOWNLOADS.mac.url}
            download
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            {AGENT_ELECTRON_DOWNLOADS.mac.label}
          </a>
        </div>

        <h4 className="mt-6 text-sm font-semibold text-white">Optie B: Kleine .exe / binary (geen Node nodig)</h4>
        <p className="mt-1 text-sm text-gray-400">
          Eén bestand per platform; geen systeemvak-icoon. Alleen beschikbaar als de build succesvol is gedraaid.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={AGENT_DOWNLOADS.windows.url}
            download
            className="inline-flex rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-dark-600"
          >
            {AGENT_DOWNLOADS.windows.label}
          </a>
          <a
            href={AGENT_DOWNLOADS.macIntel.url}
            download
            className="inline-flex rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-dark-600"
          >
            {AGENT_DOWNLOADS.macIntel.label}
          </a>
          <a
            href={AGENT_DOWNLOADS.macArm.url}
            download
            className="inline-flex rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-dark-600"
          >
            {AGENT_DOWNLOADS.macArm.label}
          </a>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Geldt voor zowel de Electron-app als de kleine .exe/binary.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-300">
          <li>Zet het gedownloade bestand (of de uitgepakte app) in een map. Bij <strong>Electron</strong>: maak een <code className="rounded bg-dark-700 px-1 font-mono">.env</code> – <strong>Windows:</strong> in dezelfde map als de .exe; <strong>Mac:</strong> in <code className="rounded bg-dark-700 px-1 font-mono">~/Library/Application Support/AITrading Agent/</code> (map opent via de app of maak die map zelf aan).</li>
          <li>Maak in <strong>dezelfde map als het programma</strong> een bestand <code className="rounded bg-dark-700 px-1 font-mono">.env</code> met:
            <pre className="mt-2 overflow-x-auto rounded bg-dark-800 p-3 font-mono text-xs text-gray-300">
{`API_URL=https://www.aitrading.software
AGENT_TOKEN=<je zojuist gegenereerde token>
MT5_BOT_PATH=<volledig pad naar je MT5_AI_Bot-map>`}
            </pre>
          </li>
          <li>
            <strong className="text-white">Electron (Windows/Mac):</strong> start de app (dubbelklik). Het icoon verschijnt in het systeemvak; rechtermuisklik om af te sluiten.
          </li>
          <li>
            <strong className="text-white">Kleine .exe (Windows):</strong> dubbelklik op <code className="rounded bg-dark-700 px-1 font-mono">AITradingAgent-win-x64.exe</code> of start vanuit een opdrachtprompt.
          </li>
          <li>
            <strong className="text-white">Kleine binary (Mac):</strong> open Terminal, ga naar de map, <code className="rounded bg-dark-700 px-1 font-mono">chmod +x AITradingAgent-macos-arm64</code> (of <code className="rounded bg-dark-700 px-1 font-mono">-macos-x64</code>) en <code className="rounded bg-dark-700 px-1 font-mono">./AITradingAgent-macos-arm64</code>.
          </li>
        </ol>

        <h4 className="mt-6 text-sm font-semibold text-white">Optie C: Met Node.js</h4>
        <p className="mt-1 text-sm text-gray-400">
          Als je Node.js al hebt: kopieer de map <code className="rounded bg-dark-700 px-1 font-mono">agent/</code> uit het project, maak daar een <code className="rounded bg-dark-700 px-1 font-mono">.env</code> en run <code className="rounded bg-dark-700 px-1 font-mono">node index.js</code>.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          Na het starten toont het dashboard je live status en kun je orders vanaf de site plaatsen. Laat de agent en MT5 (met de EA op de chart) aanstaan.
        </p>
      </section>

      <p className="text-sm text-gray-500">
        Sleep de EA op een XAUUSD/GOLD-chart en zet AutoTrading aan. Daarna de local agent starten (zie hierboven) om te koppelen met www.aitrading.software.
      </p>
    </div>
  )
}
