const dLogFs = require('fs');
const dLogPath = require('path');
const dLogDir = dLogPath.join(require('electron').app.getPath('userData'), 'logs');
const dLogFile = dLogPath.join(dLogDir, 'main-' + new Date().toISOString().slice(0, 10) + '.log');
function dLogWrite(line) {
    try {
        if (!dLogFs.existsSync(dLogDir)) dLogFs.mkdirSync(dLogDir, { recursive: true });
        if (dLogFs.existsSync(dLogFile) && dLogFs.statSync(dLogFile).size > 5 * 1024 * 1024) {
            dLogFs.renameSync(dLogFile, dLogFile + '.1');
        }
        dLogFs.appendFileSync(dLogFile, line + '\n', 'utf8');
    } catch (e) { }
}
const dLogTs = () => new Date().toISOString();
function dLogFmt(args) {
    if (!args || typeof args.map !== 'function') args = [args];
    return args.map((a) => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || a.message;
        try { return JSON.stringify(a); } catch (e) { return String(a); }
    }).join(' ');
}
['log', 'info', 'warn', 'error'].forEach((m) => {
    const orig = console[m] ? console[m].bind(console) : null;
    console[m] = function () {
        dLogWrite(dLogTs() + ' [' + m + '] ' + dLogFmt(Array.from(arguments)));
        if (orig) orig.apply(console, arguments);
    };
});
process.on('uncaughtException', (e) => dLogWrite(dLogTs() + ' [fatal] uncaughtException ' + (e && e.stack || e)));
process.on('unhandledRejection', (e) => dLogWrite(dLogTs() + ' [fatal] unhandledRejection ' + (e && e.stack || e)));
dLogWrite(dLogTs() + ' [boot] ==== AirBeats started (pid ' + process.pid + ') ====');
console.log('[log] file -> ' + dLogFile);

const a0_0x5e1154=a0_0x404f;function a0_0x404f(_0x351342,_0x17e364){_0x351342=_0x351342-0x6b;const _0x28fe9c=a0_0x28fe();let _0x404fd4=_0x28fe9c[_0x351342];return _0x404fd4;}(function(_0x18a4ea,_0x524053){const _0x44e5e2=a0_0x404f,_0x5800a7=_0x18a4ea();while(!![]){try{const _0x57c26b=parseInt(_0x44e5e2(0x70))/0x1+parseInt(_0x44e5e2(0xa0))/0x2+-parseInt(_0x44e5e2(0xac))/0x3+parseInt(_0x44e5e2(0xa8))/0x4+parseInt(_0x44e5e2(0xaa))/0x5+-parseInt(_0x44e5e2(0x8b))/0x6*(parseInt(_0x44e5e2(0x7b))/0x7)+-parseInt(_0x44e5e2(0x7f))/0x8;if(_0x57c26b===_0x524053)break;else _0x5800a7['push'](_0x5800a7['shift']());}catch(_0x4a1231){_0x5800a7['push'](_0x5800a7['shift']());}}}(a0_0x28fe,0xdc3b0));const {app,BrowserWindow,ipcMain,shell}=require(a0_0x5e1154(0x6b)),path=require(a0_0x5e1154(0xa3)),{spawn}=require(a0_0x5e1154(0xaf)),http=require(a0_0x5e1154(0xa4));let mainWindow,dynamicIslandWindow=null,serverProcess;
// last island payload, replayed on did-finish-load (the island window is
// created async, so the first update used to arrive before it existed)
let a0_0xLastIslandData=null;function a0_0xServerUrl(){let _0xP=8000;try{const _0xFs=require('fs'),_0xPath=require('path');const _0xCands=[];if(process.resourcesPath)_0xCands.push(_0xPath.join(process.resourcesPath,'port.txt'));_0xCands.push(_0xPath.join(__dirname,'port.txt'));_0xCands.push(_0xPath.join(__dirname,'..','dist','server','port.txt'));_0xCands.push(_0xPath.join(__dirname,'..','port.txt'));for(const _0xC of _0xCands){try{const _0xV=parseInt(_0xFs.readFileSync(_0xC,'utf8').trim(),10);if(_0xV>0&&_0xV<65536){_0xP=_0xV;break;}}catch(_0xE){}}}catch(_0xE){}return 'http://127.0.0.1:'+_0xP;}function startServer(_0x1726a9){const _0x31483a=a0_0x5e1154,_0x12ada7=app[_0x31483a(0xab)],_0x26843f=_0x12ada7?path['join'](process['resourcesPath'],_0x31483a(0x85),_0x31483a(0x80)):path[_0x31483a(0x7e)](__dirname,'..',_0x31483a(0xb0),'server',_0x31483a(0x80));serverProcess=spawn(_0x26843f,[],{'windowsHide':!![],'stdio':_0x31483a(0xa6)}),serverProcess['on'](_0x31483a(0x9e),_0x45ef38=>{const _0x21fd6b=_0x31483a;console[_0x21fd6b(0x9e)]('Failed\x20to\x20start\x20server:',_0x45ef38);});const _0x2ecd72=()=>{const _0x10be6d=_0x31483a,_0x139ab7=http[_0x10be6d(0x6d)](a0_0xServerUrl(),_0x4a375a=>{const _0x3a42e3=_0x10be6d;_0x4a375a[_0x3a42e3(0x9b)]===0xc8||_0x4a375a[_0x3a42e3(0x9b)]===0x194?_0x1726a9():setTimeout(_0x2ecd72,0xc8);});_0x139ab7['on'](_0x10be6d(0x9e),()=>{setTimeout(_0x2ecd72,0xc8);}),_0x139ab7[_0x10be6d(0x86)]();};_0x2ecd72();}function createWindow(){const _0x45a272=a0_0x5e1154;mainWindow=new BrowserWindow({'fullscreen':!![],'autoHideMenuBar':!![],'webPreferences':{'nodeIntegration':![],'contextIsolation':!![],'preload':path[_0x45a272(0x7e)](__dirname,_0x45a272(0x90)),'partition':_0x45a272(0x79),'devTools':![]},'icon':path['join'](__dirname,_0x45a272(0x9d))}),mainWindow[_0x45a272(0x6c)](a0_0xServerUrl()),mainWindow['on'](_0x45a272(0xb3),()=>{const _0x1a9ec1=_0x45a272;mainWindow=null,dynamicIslandWindow&&!dynamicIslandWindow[_0x1a9ec1(0xb2)]()&&dynamicIslandWindow[_0x1a9ec1(0xae)]();});}function createDynamicIsland(){const _0x5b1b6b=a0_0x5e1154,{screen:_0x1d7df6}=require(_0x5b1b6b(0x6b)),_0x13a96b=_0x1d7df6['getPrimaryDisplay'](),{width:_0x32a7a5}=_0x13a96b[_0x5b1b6b(0x7c)];dynamicIslandWindow=new BrowserWindow({'width':0x190,'height':0x78,'x':Math[_0x5b1b6b(0x8d)]((_0x32a7a5-0x190)/0x2),'y':0xa,'transparent':!![],'frame':![],'alwaysOnTop':!![],'skipTaskbar':!![],'resizable':![],'hasShadow':![],'focusable':!![],'type':_0x5b1b6b(0x8e),'webPreferences':{'nodeIntegration':![],'contextIsolation':!![],'preload':path[_0x5b1b6b(0x7e)](__dirname,'dynamic-preload.js'),'devTools':![]}})
/* The island is a media overlay, so it should be reachable from anywhere.
   With alwaysOnTop alone GNOME keeps it pinned to whatever workspace it was
   created on, and moving the app to another workspace left it behind. */
dynamicIslandWindow['setVisibleOnAllWorkspaces'](!![],{'visibleOnFullScreen':!![]}),
dynamicIslandWindow['on'](_0x5b1b6b(0x82),()=>{const _0x5ad165=_0x5b1b6b;dynamicIslandWindow&&!dynamicIslandWindow[_0x5ad165(0xb2)]()&&dynamicIslandWindow['webContents']['send'](_0x5ad165(0xa5));}),dynamicIslandWindow[_0x5b1b6b(0xa9)](path[_0x5b1b6b(0x7e)](__dirname,'dynamic-island.html')),dynamicIslandWindow['webContents']['on']('did-finish-load',()=>{if(a0_0xLastIslandData&&dynamicIslandWindow&&!dynamicIslandWindow.isDestroyed()){dynamicIslandWindow.webContents.send('track-updated',a0_0xLastIslandData);}}),dynamicIslandWindow['on']('closed',()=>{dynamicIslandWindow=null;});}app[a0_0x5e1154(0xa2)]()[a0_0x5e1154(0x9c)](()=>{const _0x4fd5f3=a0_0x5e1154;app['on'](_0x4fd5f3(0x6f),(_0x7ddbce,_0x4455b2)=>{const _0x283d69=_0x4fd5f3;_0x4455b2[_0x283d69(0xa1)](null),_0x4455b2[_0x283d69(0xb1)]['on'](_0x283d69(0x97),(_0xeb6e09,_0x37e28f)=>{const _0x27b1c6=_0x283d69;(_0x37e28f['key']==='F12'||_0x37e28f[_0x27b1c6(0x7a)]&&_0x37e28f[_0x27b1c6(0x6e)]&&_0x37e28f[_0x27b1c6(0x91)]['toLowerCase']()==='i')&&_0xeb6e09[_0x27b1c6(0x71)]();});}),ipcMain['on']('window-close',()=>{const _0x4eda54=_0x4fd5f3;if(mainWindow)mainWindow[_0x4eda54(0xae)]();}),ipcMain['on'](_0x4fd5f3(0x92),()=>{const _0x1975ae=_0x4fd5f3;if(mainWindow)mainWindow[_0x1975ae(0x8f)]();}),ipcMain['on'](_0x4fd5f3(0xad),()=>{const _0x48dc32=_0x4fd5f3;if(mainWindow)mainWindow['setFullScreen'](!mainWindow[_0x48dc32(0x72)]());}),ipcMain['on'](_0x4fd5f3(0x89),(_0x364eae,_0x4832fe)=>{const _0x3e60fd=_0x4fd5f3;a0_0xLastIslandData=_0x4832fe;dynamicIslandWindow&&!dynamicIslandWindow[_0x3e60fd(0xb2)]()&&dynamicIslandWindow[_0x3e60fd(0xb1)][_0x3e60fd(0x74)](_0x3e60fd(0xb4),_0x4832fe);}),ipcMain['on']('island-action',(_0x545bf5,_0x44037a)=>{const _0x20ffcd=_0x4fd5f3;mainWindow&&!mainWindow[_0x20ffcd(0xb2)]()&&mainWindow[_0x20ffcd(0xb1)][_0x20ffcd(0x74)](_0x20ffcd(0x84),_0x44037a);}),ipcMain['on'](_0x4fd5f3(0x88),(_0x1ea4d1,_0x5b1dc7)=>{const _0x83f13b=_0x4fd5f3;if(dynamicIslandWindow&&!dynamicIslandWindow[_0x83f13b(0xb2)]()){const {screen:_0xa03689}=require('electron'),{width:_0x37356a}=_0xa03689[_0x83f13b(0x96)]()['workAreaSize'];dynamicIslandWindow[_0x83f13b(0x7d)]({'x':Math[_0x83f13b(0x8d)]((_0x37356a-0x1c2)/0x2),'y':0xa,'width':0x1c2,'height':0x104}),dynamicIslandWindow[_0x83f13b(0xb1)]['send'](_0x83f13b(0x98)),_0x5b1dc7&&dynamicIslandWindow[_0x83f13b(0x93)]();}}),ipcMain['on'](_0x4fd5f3(0x8a),()=>{const _0x48edbf=_0x4fd5f3;dynamicIslandWindow&&!dynamicIslandWindow[_0x48edbf(0xb2)]()&&setTimeout(()=>{const _0x51513b=_0x48edbf;if(dynamicIslandWindow&&!dynamicIslandWindow[_0x51513b(0xb2)]()){const {screen:_0x2ff63a}=require(_0x51513b(0x6b)),{width:_0x69d761}=_0x2ff63a[_0x51513b(0x96)]()[_0x51513b(0x7c)];dynamicIslandWindow[_0x51513b(0x7d)]({'x':Math['round']((_0x69d761-0xc8)/0x2),'y':0xa,'width':0xc8,'height':0x64});}},0x190);}),ipcMain['on'](_0x4fd5f3(0xa7),(_0x2f4898,_0x287f8f)=>{const _0x5a01c5=_0x4fd5f3;_0x287f8f?!dynamicIslandWindow&&createDynamicIsland():dynamicIslandWindow&&!dynamicIslandWindow['isDestroyed']()&&(dynamicIslandWindow[_0x5a01c5(0xae)](),dynamicIslandWindow=null);}),ipcMain[_0x4fd5f3(0x73)](_0x4fd5f3(0x8c),()=>app[_0x4fd5f3(0x78)]()),ipcMain['on']('open-external',(_0x5804a2,_0x48f525)=>shell[_0x4fd5f3(0x75)](_0x48f525)),startServer(()=>{createWindow(),createDynamicIsland();}),app['on']('activate',function(){const _0x232ded=_0x4fd5f3;BrowserWindow['getAllWindows']()[_0x232ded(0x83)]===0x0&&(createWindow(),createDynamicIsland());});}),app['on'](a0_0x5e1154(0x99),()=>{const _0x471beb=a0_0x5e1154;if(serverProcess){serverProcess[_0x471beb(0x76)](_0x471beb(0x9a));if(process['platform']==='win32'){const {exec:_0x1f9aeb}=require(_0x471beb(0xaf));_0x1f9aeb(_0x471beb(0x77)+serverProcess['pid']+_0x471beb(0x9f),_0x23ea6f=>{});}}}),app['on'](a0_0x5e1154(0x94),function(){const _0x2cde71=a0_0x5e1154;process[_0x2cde71(0x81)]!==_0x2cde71(0x87)&&app['quit']();});function a0_0x28fe(){const _0x4ec7e2=['path','http','do-shrink','ignore','toggle-dynamic-island','4192900CXCYqN','loadFile','5282020SAUbJY','isPackaged','5137140nqXIfs','window-toggle-fullscreen','close','child_process','dist','webContents','isDestroyed','closed','track-updated','electron','loadURL','get','shift','browser-window-created','229809fGHTsg','preventDefault','isFullScreen','handle','send','openExternal','kill','taskkill\x20/pid\x20','getVersion','persist:musicapp','control','3334499NsnOGQ','workAreaSize','setBounds','join','269424EjUmbq','server.exe','platform','blur','length','island-action','server','end','darwin','island-expand','update-dynamic-island','island-shrink','12uKxicC','get-app-version','round','toolbar','minimize','preload.js','key','window-minimize','focus','window-all-closed','http://127.0.0.1:8000','getPrimaryDisplay','before-input-event','do-expand','will-quit','SIGKILL','statusCode','then','icon.png','error','\x20/T\x20/F','2532796JWirLZ','setMenu','whenReady'];a0_0x28fe=function(){return _0x4ec7e2;};return a0_0x28fe();}
const { ipcMain: ipcMain2, BrowserWindow: BrowserWindow2, dialog: dialog2 } = require('electron');
ipcMain2.on('download-req', async (e, { url, filename }) => {
    const win = BrowserWindow2.fromWebContents(e.sender);
    if (!win) return;
    const { filePath } = await dialog2.showSaveDialog(win, {
        defaultPath: filename,
        filters: [{ name: 'Audio', extensions: ['m4a'] }]
    });
    if (filePath) {
        win.webContents.session.once('will-download', (event, item, webContents) => {
            item.setSavePath(filePath);
        });
        win.webContents.downloadURL(url);
    }
});

const { ipcMain: dIpc, BrowserWindow: dWin } = require('electron');
const dFs = require('fs');
const { DiscordRpc } = require('./discord-rpc');

function dAppId() {
    try {
        const f = dLogPath.join(app.getPath('userData'), 'discord.json');
        const j = JSON.parse(dFs.readFileSync(f, 'utf8'));
        if (j.applicationId) return String(j.applicationId).trim();
    } catch (err) { }
    return (process.env.DISCORD_APPLICATION_ID || '').trim();
}
function dStatus() {
    try {
        const f = dLogPath.join(app.getPath('userData'), 'discord.json');
        const j = JSON.parse(dFs.readFileSync(f, 'utf8'));
        if (j.status) return String(j.status).trim();
    } catch (err) { }
    return 'online';
}
const dRpc = new DiscordRpc(dAppId(), dStatus());
let dToken = null;
let dUserInfo = null;
let dLoginWin = null;
let dPoll = null;

const dStoreFile = () => require('path').join(app.getPath('userData'), 'discord.json');

function dLoadToken() {
    try { return JSON.parse(dFs.readFileSync(dStoreFile(), 'utf8')).token || null; }
    catch (e) { return null; }
}
function dSaveToken(t) {
    try {
        let cur = {};
        try { cur = JSON.parse(dFs.readFileSync(dStoreFile(), 'utf8')); } catch (err) { }
        dFs.writeFileSync(dStoreFile(), JSON.stringify({ ...cur, token: t }), 'utf8');
    }
    catch (e) { console.log('[discord] save failed', e.message); }
}

const D_EXTRACT = `(async function(){
  function clean(t){ return (t==null?'':String(t)).trim().replace(/^[\x22\x27]|[\x22\x27]$/g,''); }
  function looks(t){ return /^(mfa\.)?[\w-]{20,}\.[\w-]{6,}\.[\w-]{20,}$/.test(t); }
  try { if (window.__airbeatsDiscordToken) return window.__airbeatsDiscordToken; } catch(e){}
  try {
    var ls = window.localStorage;
    for (var i = 0; i < ls.length; i++) { var v = clean(ls.getItem(i)); if (looks(v)) return v; }
  } catch(e){}
  return '';
})()`;

function dNotifyMain(payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('discord-status', payload);
    }
}

async function dSyncLiveStatus() {
    const live = await dRpc.fetchStatus();
    if (live) dRpc.status = live;
    return dRpc.status;
}

async function dUseToken(token) {
    dToken = token;
    dSaveToken(token);
    try {
        const info = await dRpc.getUserInfo(token);
        dUserInfo = info;
        dRpc.connect(token);
        await dSyncLiveStatus();
        dNotifyMain({ ok: true, user: info, tokenSaved: true });
        return info;
    } catch (e) {
        dToken = null;
        dRpc.disconnect();
        dNotifyMain({ ok: false, error: e.message });
        throw e;
    }
}

async function dClearDiscordSession() {
    try {
        const s = require('electron').session.fromPartition('persist:discord');
        await s.clearStorageData({ origins: ['https://discord.com'] });
        await s.clearCache();
        return true;
    } catch (err) { return false; }
}
function dCreateLoginWindow() {
    if (dLoginWin && !dLoginWin.isDestroyed()) { dLoginWin.focus(); return; }
    dLoginWin = new dWin({
        width: 900, height: 760, autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: false, nodeIntegration: false,
            sandbox: false,
            partition: 'persist:discord', devTools: false,
            preload: require('path').join(__dirname, 'discord-login-preload.js')
        }
    });
    dLoginWin.on('closed', () => { dLoginWin = null; clearInterval(dPoll); dPoll = null; });

    let tried = false;
    const attempt = async () => {
        if (tried || !dLoginWin || dLoginWin.isDestroyed()) return;
        const url = dLoginWin.webContents.getURL();
        if (!/discord\.com\/(app|channels)/.test(url)) return;
        tried = true;
        try {
            const t = await dLoginWin.webContents.executeJavaScript(D_EXTRACT, true);
            if (t && t.length > 30) {
                await dUseToken(t);
                dLoginWin.close();
            } else {
                tried = false;
                dNotifyMain({ ok: false, error: 'Token not found. Paste it using the option below.' });
            }
        } catch (e) {
            tried = false;
            dNotifyMain({ ok: false, error: 'Login failed: ' + e.message });
        }
    };
    dLoginWin.webContents.on('did-navigate', () => setTimeout(attempt, 2500));
    dLoginWin.webContents.on('did-navigate-in-page', () => setTimeout(attempt, 2500));
    dLoginWin.webContents.on('did-finish-load', () => setTimeout(attempt, 4000));

    if (dPoll) clearInterval(dPoll);
    dPoll = setInterval(async () => {
        if (!dLoginWin || dLoginWin.isDestroyed()) { clearInterval(dPoll); dPoll = null; return; }
        const url = dLoginWin.webContents.getURL();
        if (!/discord\.com\/(app|channels)/.test(url)) return;
        try {
            const t = await dLoginWin.webContents.executeJavaScript('window.__airbeatsDiscordToken || ""', true);
            if (t && t.length > 30) {
                clearInterval(dPoll); dPoll = null;
                await dUseToken(t);
                dLoginWin.close();
            }
        } catch (e) { }
    }, 1000);

    dClearDiscordSession().then(() => {
        if (dLoginWin && !dLoginWin.isDestroyed()) dLoginWin.loadURL('https://discord.com/login');
    });
}

const D_DUMP = `(async function(){
  var out = [];
  out.push('URL: ' + location.href);
  try {
    var ls = window.localStorage;
    out.push('--- localStorage (' + ls.length + ' keys) ---');
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i), v = String(ls.getItem(k) || '');
      out.push('  [' + k + '] len=' + v.length + ' :: ' + v.slice(0, 80));
    }
  } catch(e) { out.push('localStorage ERR ' + e.message); }
  try {
    var dbs = await indexedDB.databases();
    out.push('--- IndexedDB (' + dbs.length + ' dbs) ---');
    for (var d = 0; d < dbs.length; d++) {
      var name = dbs[d].name;
      out.push(' DB: ' + name);
      await new Promise(function(res){
        var rq = indexedDB.open(name);
        rq.onerror = function(){ out.push('   (open failed)'); res(); };
        rq.onsuccess = function(){
          var db = rq.result;
          var stores = Array.prototype.slice.call(db.objectStoreNames);
          out.push('   stores: ' + stores.join(', '));
          var pending = stores.length;
          if (!pending) return res();
          stores.forEach(function(sn){
            try {
              var cur = db.transaction(sn,'readonly').objectStore(sn).openCursor();
              var n = 0;
              cur.onsuccess = function(){
                var row = cur.result;
                if (!row || n >= 12) { if (--pending === 0) res(); return; }
                var v = '';
                try { v = typeof row.value === 'string' ? row.value : JSON.stringify(row.value); } catch(e){ v = '[unreadable]'; }
                out.push('     ' + sn + ' / ' + row.key + ' :: ' + String(v).slice(0,120));
                n++; row.continue();
              };
              cur.onerror = function(){ if (--pending === 0) res(); };
            } catch(e) { out.push('     ' + sn + ' ERR ' + e.message); if (--pending === 0) res(); }
          });
        };
      });
    }
  } catch(e) { out.push('IndexedDB ERR ' + e.message); }
  return out.join(String.fromCharCode(10));
})()`;

dIpc.on('discord-login-dump', async () => {
    if (!dLoginWin || dLoginWin.isDestroyed()) return;
    try {
        const dump = await dLoginWin.webContents.executeJavaScript(D_DUMP, true);
        require('fs').writeFileSync('/tmp/discord-debug.txt', dump, 'utf8');
        console.log('[discord] dump written');
        dNotifyMain({ ok: false, error: 'Debug dump saved to /tmp/discord-debug.txt' });
    } catch (e) {
        console.log('[discord] dump failed', e.message);
        dNotifyMain({ ok: false, error: 'Dump failed: ' + e.message });
    }
});

dIpc.handle('discord-get-state', async () => {
    console.log('[discord] getState asked, token=' + !!dToken);
    if (!dToken) return { ok: false, status: dRpc.status };
    try {
        if (!dUserInfo) dUserInfo = await dRpc.getUserInfo(dToken);
        await dSyncLiveStatus();
        return { ok: true, user: dUserInfo, status: dRpc.status };
    } catch (e) {
        dToken = null;
        dRpc.disconnect();
        return { ok: false, error: e.message };
    }
});

dIpc.on('discord-log', (e, msg) => console.log('[renderer] ' + msg));

let dQuitting = false;
function dFlushPresence(done) {
    try {
        if (dRpc && dRpc.connected) {
            dRpc.clearActivity();
            setTimeout(() => { try { dRpc.disconnect(); } catch (e) {} done(); }, 400);
            return;
        }
    } catch (e) { }
    setTimeout(done, 0);
}
app.on('before-quit', (e) => {
    if (dQuitting) return;
    dQuitting = true;
    e.preventDefault();
    dFlushPresence(() => app.quit());
});
app.on('window-all-closed', () => {
    dFlushPresence(() => { app.quit(); });
});

dIpc.on('discord-login-open', () => dCreateLoginWindow());
dIpc.handle('discord-token-paste', async (e, token) => {
    const t = String(token || '').trim().replace(/^["']|["']$/g, '');
    if (t.length < 30) throw new Error('Token is too short');
    return await dUseToken(t);
});
dIpc.handle('discord-logout', async () => {
    dRpc.clearActivity();
    dRpc.disconnect();
    dToken = null;
    dUserInfo = null;
    try {
        let cur = {};
        try { cur = JSON.parse(dFs.readFileSync(dStoreFile(), 'utf8')); } catch (err) { }
        delete cur.token;
        dFs.writeFileSync(dStoreFile(), JSON.stringify(cur), 'utf8');
    } catch (err) { }
    if (dLoginWin && !dLoginWin.isDestroyed()) { dLoginWin.close(); dLoginWin = null; }
    clearInterval(dPoll); dPoll = null;
    await dClearDiscordSession();
    dNotifyMain({ ok: false, loggedOut: true });
    return true;
});
dIpc.handle('discord-set-status', async (e, s) => {
    const r = await dRpc.setStatus(s);
    try {
        let cur = {};
        try { cur = JSON.parse(dFs.readFileSync(dStoreFile(), 'utf8')); } catch (err) { }
        dFs.writeFileSync(dStoreFile(), JSON.stringify({ ...cur, status: r.status }), 'utf8');
    } catch (err) { }
    return r;
});
// The island window is resized to the pill's real box on every state change
// (+ small pads for margin/shadow), so transparent margins never swallow
// clicks meant for elements around the island.
let a0LastIslandState = null;
function a0IslandDims(state) {
    const opts = a0IslandReadOpts() || {};
    const table = {
        small: { min: [122, 32], exp: [330, 160] },
        medium: { min: [140, 36], exp: [380, 180] },
        large: { min: [168, 44], exp: [430, 200] }
    };
    const t = table[opts.size] || table.medium;
    return state === 'expanded' ? t.exp : t.min;
}
function a0IslandHug(state) {
    if (!dynamicIslandWindow || dynamicIslandWindow.isDestroyed()) return;
    try {
        const { screen } = require('electron');
        const b = screen.getPrimaryDisplay().bounds;
        const opts = a0IslandReadOpts() || {};
        const pos = opts.position || 'center';
        const dims = a0IslandDims(state);
        const PAD_X = 14, PAD_TOP = 10, PAD_BOTTOM = 24;
        const w = dims[0] + PAD_X * 2;
        const h = PAD_TOP + dims[1] + PAD_BOTTOM;
        let x;
        if (pos === 'left') x = b.x;
        else if (pos === 'right') x = b.x + b.width - w;
        else x = b.x + Math.round((b.width - w) / 2);
        dynamicIslandWindow.setBounds({ x, y: b.y + PAD_TOP, width: w, height: h });
    } catch (err) { }
}
function a0IslandApplyState(state) {
    if (!dynamicIslandWindow || dynamicIslandWindow.isDestroyed()) return;
    try { dynamicIslandWindow.setIgnoreMouseEvents(state === 'hidden', { forward: true }); } catch (err) { }
    if (state === 'expanded') {
        a0IslandHug('expanded');
    } else if (state === 'minimized' && a0LastIslandState === 'expanded') {
        // Shrink animation: keep the big window until the pill has animated
        // down, then hug the smaller box.
        a0IslandHug('expanded');
        setTimeout(() => {
            try {
                if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed() && a0LastIslandState === 'minimized') a0IslandHug('minimized');
            } catch (err) { }
        }, 430);
    } else {
        a0IslandHug('minimized');
    }
    a0LastIslandState = state;
}
dIpc.on('island-state', (e, state) => {
    a0IslandApplyState(String(state || 'hidden'));
});

// Dynamic Island appearance options, persisted in userData/island-options.json
// and pushed to the island window.
const a0IslandOptsFile = dLogPath.join(require('electron').app.getPath('userData'), 'island-options.json');
function a0IslandReadOpts() {
    try { return JSON.parse(dFs.readFileSync(a0IslandOptsFile, 'utf8')); } catch (e) { return null; }
}
function a0IslandSendOpts() {
    if (!dynamicIslandWindow || dynamicIslandWindow.isDestroyed()) return;
    try { dynamicIslandWindow.webContents.send('island-options', a0IslandReadOpts() || {}); } catch (e) { }
}
dIpc.on('island-set-options', (e, opts) => {
    try { dFs.writeFileSync(a0IslandOptsFile, JSON.stringify(opts || {}), 'utf8'); } catch (err) { }
    a0IslandSendOpts();
});
dIpc.handle('island-get-options', () => a0IslandReadOpts() || {});
app.on('browser-window-created', (e, win) => {
    win.webContents.on('did-finish-load', () => {
        try {
            if (win.webContents.getURL().indexOf('dynamic-island') !== -1) {
                a0IslandSendOpts();
                // Start click-through + hugged so the island never blocks
                // clicks before its first state message arrives.
                try { win.setIgnoreMouseEvents(true, { forward: true }); } catch (err) { }
                a0IslandHug('minimized');
            }
        } catch (err) { }
    });
});

dIpc.on('discord-activity', (e, data) => {
    if (!dToken) { console.log('[discord] activity dropped, no token'); return; }
    console.log('[discord] activity details=' + JSON.stringify((data||{}).details)
        + ' connected=' + dRpc.connected);
    dRpc.setActivity(data || {}).then((ok) => console.log('[discord] setActivity -> ' + ok))
        .catch((err) => console.log('[discord] activity err ' + err.message));
});

try {
    const saved = dLoadToken();
    if (saved) {
        dToken = saved;
        dRpc.getUserInfo(saved)
            .then(async (info) => { dRpc.connect(saved); await dSyncLiveStatus(); dNotifyMain({ ok: true, user: info, tokenSaved: true }); })
            .catch((err) => { console.log('[discord] resume failed', err.message); dToken = null; });
    }
} catch (e) { }


const { URLSearchParams } = require('url');

const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://127.0.0.1:4173/callback';

function _readEnvFile(key) {
    try {
        const fs = require('fs');
        const file = require('path').join(__dirname, '.env');
        if (!fs.existsSync(file)) return null;
        for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
            if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
        }
    } catch (e) { }
    return null;
}

function getDiscordConfig() {
    return {
        client_id: process.env.DISCORD_CLIENT_ID || _readEnvFile('DISCORD_CLIENT_ID'),
        client_secret: process.env.DISCORD_CLIENT_SECRET || _readEnvFile('DISCORD_CLIENT_SECRET'),
    };
}

async function exchangeCode(code) {
    const { client_id, client_secret } = getDiscordConfig();
    if (!client_id || !client_secret) {
        throw new Error('Discord OAuth2 not configured. Set DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET in .env or env.');
    }
    const r = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id,
            client_secret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: DISCORD_REDIRECT_URI,
        }).toString(),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
        const msg = j.error_description || j.error || `HTTP ${r.status}`;
        throw new Error(`Discord token exchange failed: ${msg}`);
    }
    return j;
}

let loginServer = null;
let loginResolve = null;
let loginReject = null;

function startOAuth(webContents) {
    return new Promise((resolve, reject) => {
        loginResolve = resolve;
        loginReject = reject;
        let server;
        const onListen = () => {
            const port = server.address().port;
            const oauthUrl = `https://discord.com/oauth2/authorize?${new URLSearchParams({
                client_id: getDiscordConfig().client_id,
                redirect_uri: DISCORD_REDIRECT_URI,
                response_type: 'code',
                scope: 'identify rpc.activities.write',
            }).toString()}`;
            webContents.send('discord-login-opened', { url: oauthUrl, port });
        };
        server = http.createServer((req, res) => {
            try {
                const url = new URL(req.url, `http://127.0.0.1:${req.socket.localPort}`);
                if (url.pathname === '/callback') {
                    const code = url.searchParams.get('code');
                    if (code) {
                        exchangeCode(code).then(({ access_token }) => {
                            
                            server.close();
                            resolve(access_token);
                        }).catch((err) => {
                            server.close();
                            reject(err);
                        });
                    } else {
                        res.writeHead(400).end('No code');
                    }
                } else {
                    res.writeHead(404).end('Not found');
                }
            } catch (e) {
                res.writeHead(500).end(e.message);
            }
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                server.close();
                startOAuth(webContents).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
        server.listen(4173, '127.0.0.1', onListen);
    });
}

dIpc.handle('discord-login-start', async (e) => {
    const tok = await startOAuth(e.sender);
    await dUseToken(tok);
    return tok;
});

dIpc.handle('discord-login-callback', async (e, code) => {
    const tok = await exchangeCode(code);
    await dUseToken(tok);
    return tok;


});



const { ipcMain: ytIpc, BrowserWindow: ytWin } = require('electron');

const YT_LOGIN_URL = 'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmusic.youtube.com';
const YT_LOGIN_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function ytPostLogin(cookie, visitorData) {
    return new Promise((resolve) => {
        const body = JSON.stringify({ input: cookie, visitorData: visitorData || '' });
        const target = new URL(a0_0xServerUrl() + '/api/yt/login');
        const req = http.request({
            hostname: target.hostname,
            port: target.port,
            path: target.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            let text = '';
            res.on('data', (chunk) => { text += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(text)); } catch (err) { resolve({ success: false, error: 'invalid response' }); }
            });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.write(body);
        req.end();
    });
}

function ytReadCookies(sess) {
    return sess.cookies.get({ domain: 'youtube.com' }).then((cookies) => {
        const jar = {};
        cookies.forEach((c) => { if (c.name && c.value && jar[c.name] === undefined) jar[c.name] = c.value; });
        if (!jar.SAPISID) return null;
        return Object.keys(jar).map((k) => k + '=' + jar[k]).join('; ');
    }).catch(() => null);
}

ytIpc.handle('yt-open-login', () => new Promise((resolve) => {
    const win = new ytWin({
        width: 1000,
        height: 780,
        title: 'Sign in to YouTube Music',
        autoHideMenuBar: true,
        webPreferences: {
            partition: 'yt-login',
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false
        }
    });
    win.setMenuBarVisibility(false);
    win.webContents.setUserAgent(YT_LOGIN_UA);
    let done = false;
    let activeCookie = null;
    let lastTryAt = 0;
    let inFlight = false;
    const finish = (result) => {
        if (done) return;
        done = true;
        clearInterval(poll);
        if (!win.isDestroyed()) win.close();
        resolve(result);
    };
    const poll = setInterval(async () => {
        if (done || inFlight || win.isDestroyed()) return;
        const cookie = await ytReadCookies(win.webContents.session);
        if (!cookie) return;
        if (cookie === activeCookie && Date.now() - lastTryAt < 15000) return;
        activeCookie = cookie;
        lastTryAt = Date.now();
        inFlight = true;
        try {
            const visitorData = await win.webContents.executeJavaScript(
                "(function(){try{var c=window.ytcfg;var y=window.yt&&window.yt.config_;var v=c&&c.get&&c.get('VISITOR_DATA')||y&&y.VISITOR_DATA;return v||null}catch(e){return null}})()"
            ).catch(() => null);
            const result = await ytPostLogin(cookie, visitorData);
            if (result && result.success) finish({ ok: true, account: result.data });
        } finally {
            inFlight = false;
        }
    }, 2000);
    win.on('closed', () => finish({ ok: false }));
    win.loadURL(YT_LOGIN_URL);
}));
