// AirBeats desktop — logs & crash reports page
// Loaded as a classic script after script.js (desktop-native implementation).

window.airLogsData = null;
window.airLogsFilter = { level: 'all', source: 'all' };

function airIsCrashEntry(entry) {
    const level = String(entry.level || '').toLowerCase();
    if (level === 'critical' || level === 'fatal') return true;
    const message = String(entry.message || '').toLowerCase();
    return message.indexOf('uncaughtexception') !== -1 || message.indexOf('unhandledrejection') !== -1 ||
        message.indexOf('unhandled: ') !== -1 || message.indexOf('crash') !== -1;
}

window.airRefreshCrashBadge = function () {
    fetch('/api/logs?limit=80').then((r) => r.json()).then((res) => {
        const count = (res && res.data && res.data.crashCount) || 0;
        const dot = document.getElementById('navLogsCrashDot');
        if (dot) dot.style.display = count > 0 ? '' : 'none';
    }).catch(() => { });
};

window.airLogsFilterSet = function (kind, value) {
    window.airLogsFilter[kind] = value;
    window.airRenderLogsList();
};

window.airRenderLogsList = function () {
    const holder = document.getElementById('airLogsList');
    if (!holder) return;
    const data = window.airLogsData || { entries: [] };
    const filter = window.airLogsFilter;
    let entries = (data.entries || []).slice();
    if (filter.source !== 'all') entries = entries.filter((e) => (e.source || '') === filter.source);
    if (filter.level === 'errors') entries = entries.filter((e) => ['error', 'critical', 'fatal', 'warning'].indexOf(String(e.level || '').toLowerCase()) !== -1);
    if (filter.level === 'crashes') entries = entries.filter(airIsCrashEntry);
    entries = entries.reverse();
    if (!entries.length) {
        holder.innerHTML = `<div class="air-logs-empty"><i class="fas fa-check-circle" style="color: var(--accent-text); font-size: 34px;"></i><div style="margin-top:10px;">No log entries for this filter</div></div>`;
        return;
    }
    holder.innerHTML = entries.map((e) => {
        const level = String(e.level || 'info').toLowerCase();
        const cls = ['error', 'critical', 'fatal'].indexOf(level) !== -1 ? 'lv-error' : level === 'warning' ? 'lv-warn' : 'lv-info';
        const extra = e.stack ? `<pre class="air-log-stack">${airEsc(e.stack)}</pre>` : '';
        return `<div class="air-log-row ${cls}">
            <div class="air-log-meta">
                <span class="air-log-badge">${airEsc(level)}</span>
                <span class="air-log-src">${airEsc(e.source || 'server')}</span>
                <span class="air-log-ts">${airEsc(e.ts || '')}</span>
            </div>
            <div class="air-log-msg">${airEsc(e.message || '')}</div>
            ${extra}
        </div>`;
    }).join('');
};

window.airLoadLogs = function () {
    const holder = document.getElementById('airLogsList');
    if (holder) holder.innerHTML = window.airDotsHtml('Loading logs\u2026');
    return fetch('/api/logs?limit=400').then((r) => r.json()).then((res) => {
        window.airLogsData = (res && res.data) || { entries: [] };
        const data = window.airLogsData;
        const total = document.getElementById('airLogsTotal');
        const errors = document.getElementById('airLogsErrors');
        const crashes = document.getElementById('airLogsCrashes');
        if (total) total.textContent = (data.entries || []).length;
        if (errors) errors.textContent = data.errorCount || 0;
        if (crashes) crashes.textContent = data.crashCount || 0;
        const dir = document.getElementById('airLogsDir');
        if (dir) dir.textContent = data.logDir || '';
        const dot = document.getElementById('navLogsCrashDot');
        if (dot) dot.style.display = (data.crashCount || 0) > 0 ? '' : 'none';
        window.airRenderLogsList();
    }).catch((e) => {
        if (holder) holder.innerHTML = `<div class="air-logs-empty" style="color: var(--danger);">Failed to load logs: ${airEsc(e.message || e)}</div>`;
    });
};

window.airLogsAsText = function () {
    const data = window.airLogsData || { entries: [] };
    return (data.entries || []).map((e) => {
        const head = '[' + (e.ts || '-') + '] [' + (e.level || 'info') + '] [' + (e.source || 'server') + '] ' + (e.message || '');
        return e.stack ? head + '\n' + e.stack : head;
    }).join('\n');
};

window.airCopyLogs = function () {
    const text = window.airLogsAsText();
    if (!text) { airToast('Nothing to copy'); return; }
    const done = () => airToast(window.t('copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => window.airCopyLogsFallback(text, done));
    } else {
        window.airCopyLogsFallback(text, done);
    }
};

window.airCopyLogsFallback = function (text, done) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done && done();
    } catch (e) { airToast('Copy failed'); }
};

window.airDownloadLogs = function () {
    fetch('/api/logs/download').then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
    }).then((blob) => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = 'airbeats-logs.zip';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
        airToast('Logs saved');
    }).catch((e) => airToast('Download failed: ' + (e.message || e)));
};

window.airClearLogs = function () {
    if (!window.confirm('Clear all logs? This removes server, app and crash logs.')) return;
    fetch('/api/logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main: true }),
    }).then((r) => r.json()).then(() => {
        airToast('Logs cleared');
        return window.airLoadLogs();
    }).catch(() => airToast('Clear failed'));
};

async function renderSettingsLogs() {
    routerView.innerHTML = `
    <div class="air-settings-page">
        <div class="air-settings-head">
            <button class="icon-btn" onclick="window.location.hash = '#settings'"><i class="fas fa-arrow-left"></i></button>
            <h2>${window.t('logs')}</h2>
        </div>
        <section class="air-card">
            <div class="air-stats-row">
                <div class="air-stat"><div class="air-stat-num" id="airLogsTotal">0</div><div class="air-stat-label">Entries</div></div>
                <div class="air-stat"><div class="air-stat-num" style="color:#ffb300;" id="airLogsErrors">0</div><div class="air-stat-label">Errors</div></div>
                <div class="air-stat"><div class="air-stat-num" style="color:#ff5252;" id="airLogsCrashes">0</div><div class="air-stat-label">Crashes</div></div>
            </div>
            <div class="air-chip-group" style="margin-top: 14px;">
                <button class="air-chip" onclick="window.airLoadLogs()"><i class="fas fa-sync-alt"></i> ${window.t('refresh')}</button>
                <button class="air-chip" onclick="window.airCopyLogs()"><i class="fas fa-copy"></i> ${window.t('copy')}</button>
                <button class="air-chip" onclick="window.airDownloadLogs()"><i class="fas fa-download"></i> ${window.t('download')}</button>
                <button class="air-chip danger" onclick="window.airClearLogs()"><i class="fas fa-trash"></i> ${window.t('clear')}</button>
            </div>
            <div class="air-filter-row">
                <select class="air-select" onchange="window.airLogsFilterSet('level', this.value)">
                    <option value="all">All levels</option>
                    <option value="errors">Errors & warnings</option>
                    <option value="crashes">Crashes only</option>
                </select>
                <select class="air-select" onchange="window.airLogsFilterSet('source', this.value)">
                    <option value="all">All sources</option>
                    <option value="server">Server</option>
                    <option value="main">App (main)</option>
                    <option value="client">Client (renderer)</option>
                </select>
            </div>
            <div class="air-log-dir">Log folder: <span id="airLogsDir"></span></div>
        </section>
        <section class="air-card" style="padding: 6px 10px;">
            <div id="airLogsList"></div>
        </section>
        <div style="height: 60px;"></div>
    </div>`;
    await window.airLoadLogs();
}

