// Airbeats Auth Configuration
const GOOGLE_CLIENT_ID = "1053186786765-aek1r7mbv8f820frnruamp9j22nbcsb4.apps.googleusercontent.com";

window.isGuestMode = false;
let authMode = "LOGIN";

function getEmailFolder(email) {
    return email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
}

window.autoBackup = async function() {
    if (window.isGuestMode) return;
    const email = localStorage.getItem('auth_email');
    if (!email) return;

    const dataToBackup = {
        favoriteSongs: localStorage.getItem('favoriteSongs') || '[]',
        user_playlists: localStorage.getItem('user_playlists') || '[]',
        saved_albums: localStorage.getItem('saved_albums') || '{}',
        subscribedArtists: localStorage.getItem('subscribedArtists') || '[]',
        searchHistory: localStorage.getItem('searchHistory') || '[]',
        playedArtists: localStorage.getItem('playedArtists') || '[]',
        lastPlayedAlbum: localStorage.getItem('lastPlayedAlbum') || 'null',
        airbeats_user_id: localStorage.getItem('airbeats_user_id') || '',
        airbeats_user_name: localStorage.getItem('airbeats_user_name') || '',
        airbeats_user_avatar: localStorage.getItem('airbeats_user_avatar') || ''
    };

    try {
        const res = await fetch(`/api/auth/backup?email=${encodeURIComponent(email)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToBackup)
        });
        if(res.ok) console.log('Cloud backup successful!');
    } catch (e) {
        console.error('Cloud backup failed:', e);
    }
};

window.restoreFromCloud = async function(email) {
    try {
        const res = await fetch(`/api/auth/restore?email=${encodeURIComponent(email)}`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.favoriteSongs) localStorage.setItem('favoriteSongs', data.favoriteSongs);
            if (data.user_playlists) localStorage.setItem('user_playlists', data.user_playlists);
            if (data.saved_albums) localStorage.setItem('saved_albums', data.saved_albums);
            if (data.subscribedArtists) localStorage.setItem('subscribedArtists', data.subscribedArtists);
            if (data.searchHistory) localStorage.setItem('searchHistory', data.searchHistory);
            if (data.playedArtists) localStorage.setItem('playedArtists', data.playedArtists);
            if (data.lastPlayedAlbum) localStorage.setItem('lastPlayedAlbum', data.lastPlayedAlbum);
            if (data.airbeats_user_id) localStorage.setItem('airbeats_user_id', data.airbeats_user_id);
            if (data.airbeats_user_name) localStorage.setItem('airbeats_user_name', data.airbeats_user_name);
            if (data.airbeats_user_avatar) localStorage.setItem('airbeats_user_avatar', data.airbeats_user_avatar);
            console.log('Restored from cloud!');
        } else {
            await window.autoBackup();
        }
        
        // Auto-onboard stats if missing
        if (!localStorage.getItem('airbeats_user_name') && window._auth_provided_name) {
            try {
                const onboardRes = await fetch('/api/stats/onboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: window._auth_provided_name })
                });
                const onboardData = await onboardRes.json();
                if (onboardData.userId) {
                    localStorage.setItem('airbeats_user_id', onboardData.userId);
                    localStorage.setItem('airbeats_user_name', onboardData.name);
                    localStorage.setItem('airbeats_user_avatar', onboardData.profileUrl);
                    await window.autoBackup(); // save it to cloud immediately
                }
            } catch (e) {
                console.error('Auto-onboard failed', e);
            }
        }
        window.location.reload();
    } catch(e) {
        window.location.reload();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById('auth-overlay');
    const btnGoogle = document.getElementById('btn-google-login');
    const btnGuest = document.getElementById('btn-guest-login');
    const btnEmail = document.getElementById('btn-email-login');
    const btnToggle = document.getElementById('btn-toggle-mode');
    
    const inputName = document.getElementById('auth-name');
    const inputEmail = document.getElementById('auth-email');
    const inputPassword = document.getElementById('auth-password');
    const errorDiv = document.getElementById('auth-error');

    const authState = localStorage.getItem('auth_state');
    if (authState === 'guest') {
        window.isGuestMode = true;
        overlay.style.display = 'none';
    } else if (authState === 'logged_in') {
        window.isGuestMode = false;
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'flex';
    }

    btnToggle.addEventListener('click', (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        if (authMode === "LOGIN") {
            authMode = "SIGNUP";
            document.getElementById('auth-title').innerText = "Create an Account";
            document.getElementById('auth-subtitle').innerText = "Sign up to sync your library across devices.";
            inputName.style.display = "block";
            btnEmail.innerText = "Sign Up";
            document.getElementById('auth-toggle-text').innerText = "Already have an account?";
            btnToggle.innerText = "Sign In";
        } else {
            authMode = "LOGIN";
            document.getElementById('auth-title').innerText = "Welcome to Airbeats";
            document.getElementById('auth-subtitle').innerText = "Sign in to sync your library.";
            inputName.style.display = "none";
            btnEmail.innerText = "Sign In";
            document.getElementById('auth-toggle-text').innerText = "Don't have an account?";
            btnToggle.innerText = "Sign Up";
        }
    });

    function showError(msg) {
        errorDiv.innerText = msg;
        errorDiv.style.display = 'block';
        btnEmail.innerText = authMode === "LOGIN" ? "Sign In" : "Sign Up";
        btnEmail.disabled = false;
        btnGoogle.innerText = "Continue with Google";
        btnGoogle.disabled = false;
    }

    btnEmail.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const password = inputPassword.value;
        const name = inputName.value.trim();
        window._auth_provided_name = name || email.split('@')[0];
        
        if (!email || !password) return showError("Please enter email and password.");
        if (authMode === "SIGNUP" && !name) return showError("Please enter your name.");
        
        errorDiv.style.display = 'none';
        btnEmail.innerText = "Please wait...";
        btnEmail.disabled = true;

        try {
            const endpoint = authMode === "LOGIN" ? "login" : "signup";
            const body = authMode === "LOGIN" ? { email, password } : { email, password, name };
            
            const res = await fetch(`/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            if (data.success || data.user) {
                localStorage.setItem('auth_state', 'logged_in');
                localStorage.setItem('auth_email', email);
                window.isGuestMode = false;
                
                btnEmail.innerText = 'Restoring...';
                await window.restoreFromCloud(email);
                overlay.style.display = 'none';
            } else {
                showError(data.error || "Authentication failed.");
            }
        } catch (err) {
            showError("Network error. Please try again.");
        }
    });

    btnGuest.addEventListener('click', () => {
        localStorage.setItem('auth_state', 'guest');
        window.isGuestMode = true;
        overlay.style.display = 'none';
    });

    let tokenClient;
    if (typeof google !== 'undefined' && google.accounts) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    try {
                        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        });
                        const userInfo = await res.json();
                        window._auth_provided_name = userInfo.name || userInfo.email.split('@')[0];
                        
                        if (userInfo.email) {
                            localStorage.setItem('auth_state', 'logged_in');
                            localStorage.setItem('auth_email', userInfo.email);
                            window.isGuestMode = false;
                            btnGoogle.innerHTML = 'Restoring...';
                            await window.restoreFromCloud(userInfo.email);
                            overlay.style.display = 'none';
                        }
                    } catch (err) {
                        showError('Failed to fetch Google profile.');
                    }
                }
            },
        });
    }

    btnGoogle.addEventListener('click', () => {
        if (!tokenClient) return showError("Google Services failed to load.");
        btnGoogle.innerText = "Waiting for Google...";
        tokenClient.requestAccessToken();
    });
});

window.logoutUser = function() {
    localStorage.removeItem('auth_state');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('favoriteSongs');
    localStorage.removeItem('user_playlists');
    localStorage.removeItem('saved_albums');
    localStorage.removeItem('subscribedArtists');
    window.location.reload();
};

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    const trackedKeys = ['favoriteSongs', 'user_playlists', 'saved_albums', 'subscribedArtists', 'searchHistory', 'playedArtists', 'lastPlayedAlbum'];
    if (trackedKeys.includes(key)) {
        if (window.autoBackup && !window.isGuestMode) {
            clearTimeout(window.backupTimeout);
            window.backupTimeout = setTimeout(() => {
                window.autoBackup();
            }, 2000);
        }
    }
};
