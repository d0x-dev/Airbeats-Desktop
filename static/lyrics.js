
function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function renderLyrics(parsedLines, loader) {
    if (loader) loader.remove();
    const lyricsContainer = document.getElementById('lyricsContent');
    lyricsContainer.style.display = 'block';
    lyricsContainer.innerHTML = '';
    lyricsData = parsedLines;

    parsedLines.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.id = 'lyric-line-' + index;
        lineDiv.className = 'lyric-line';
        lineDiv.style.marginBottom = '24px';
        lineDiv.style.fontSize = '24px';
        lineDiv.style.fontWeight = '700';
        lineDiv.style.color = 'rgba(255,255,255,0.3)';
        lineDiv.style.transition = 'all 0.3s ease';
        lineDiv.style.cursor = 'pointer';
        
        lineDiv.onclick = () => {
            const audio = document.getElementById('audioElement');
            if(audio) audio.currentTime = line.begin / 1000;
        };

        line.words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'lyric-word';
            wordSpan.setAttribute('data-begin', word.begin);
            
            // Calculate end time: use word.end if provided, otherwise fallback
            let endTime = word.end;
            if (!endTime) {
                endTime = line.end;
                if (wordIndex < line.words.length - 1) {
                    endTime = line.words[wordIndex + 1].begin;
                }
            }
            wordSpan.setAttribute('data-end', endTime);
            wordSpan.textContent = word.text + (wordIndex < line.words.length - 1 ? ' ' : '');
            
            // Base styling for butterfly effect
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'pre'; // preserve spaces
            // Instead of CSS transitions, we will smoothly animate via requestAnimationFrame
            
            lineDiv.appendChild(wordSpan);
        });

        lyricsContainer.appendChild(lineDiv);
    });
}

function showLyricsError(msg, loader) {
    if(loader) loader.remove();
    const lyricsError = document.getElementById('lyricsError');
    lyricsError.style.display = 'flex';
    lyricsError.innerHTML = '<i class="fas fa-music" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i><p style="text-align:center;">' + msg + '</p>';
}

// Global Lyrics State
let lyricsData = [];
let isLyricsOpen = false;
let lyricsAnimationFrame = null;
let lastAudioTimeMs = 0;
let lastTimeUpdateReal = 0;

let currentLyricsFetchId = 0;

async function fetchLyricsData(song, forceRefresh = false) {
    if (!song) return;
    
    currentLyricsFetchId++;
    const fetchId = currentLyricsFetchId;
    
    const lyricsContainer = document.getElementById('lyricsContent');
    const lyricsError = document.getElementById('lyricsError');
    
    lyricsContainer.innerHTML = '';
    lyricsContainer.style.display = 'none';
    lyricsError.style.display = 'none';
    lyricsData = [];
    
    // Remove any existing loaders
    document.querySelectorAll('#lyricsLottieLoader').forEach(el => el.remove());
    
    const loader = document.createElement('div');
    loader.id = 'lyricsLottieLoader';
    loader.style.width = '100px';
    loader.style.height = '100px';
    loader.style.margin = 'auto';
    lyricsContainer.parentNode.insertBefore(loader, lyricsContainer);
    
    if (typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: loader,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/static/loader.json'
        });
    }
    
    const rawArtists = typeof song.primaryArtists === 'string' ? song.primaryArtists : (song.artists?.primary?.map(a => a.name).join(', ') || '');
    const artists = decodeHtml(rawArtists);
    
    let cleanName = decodeHtml(song.name || song.title || '');
    cleanName = cleanName.replace(/\(feat\..*?\)/i, '').trim();
    
    try {
        const url = new URL('/api/lyrics', window.location.origin);
        url.searchParams.append("s", cleanName);
        url.searchParams.append("a", artists);
        if (song.duration) url.searchParams.append("d", song.duration.toString());
        if (forceRefresh) url.searchParams.append("force", "1");
        
        const response = await fetch(url.toString(), { cache: 'no-store' });
        
        // If a new fetch was started while we were waiting, ignore this response
        if (fetchId !== currentLyricsFetchId) {
            loader.remove();
            return;
        }
        
        if (!response.ok) {
            showLyricsError('No synchronized lyrics found.', loader);
            return;
        }
        
        const parsedData = await response.json();
        
        if (fetchId !== currentLyricsFetchId) {
            loader.remove();
            return;
        }
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
            renderLyrics(parsedData, loader);
        } else {
            showLyricsError('No synchronized lyrics found.', loader);
        }
    } catch(e) {
        if (fetchId === currentLyricsFetchId) {
            showLyricsError('An error occurred loading lyrics.', loader);
        } else {
            loader.remove();
        }
    }
}

function updateLyricsSync() {
    const audio = document.getElementById('audioElement');
    if (!audio || !isLyricsOpen || !lyricsData.length) {
        lyricsAnimationFrame = requestAnimationFrame(updateLyricsSync);
        return;
    }
    
    let audioTimeMs = Math.floor(audio.currentTime * 1000);
    if (!audio.paused && !audio.seeking && audio.duration) {
        if (audioTimeMs !== lastAudioTimeMs) {
            lastAudioTimeMs = audioTimeMs;
            lastTimeUpdateReal = performance.now();
        }
        audioTimeMs = lastAudioTimeMs + (performance.now() - lastTimeUpdateReal);
    } else {
        lastAudioTimeMs = audioTimeMs;
        lastTimeUpdateReal = performance.now();
    }
    const currentTimeMs = Math.floor(audioTimeMs);
    const lyricsContainer = document.getElementById('lyricsContent');
    
    // Update left panel slider & play/pause icon
    const lyricsWaveformActive = document.getElementById('lyricsWaveformActive');
    const playBtnIcon = document.getElementById('lyricsLeftPlayBtn');
    if (lyricsWaveformActive && audio.duration) {
        lyricsWaveformActive.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    }
    if (playBtnIcon) {
        if (audio.paused) {
            playBtnIcon.innerHTML = '<i class="fas fa-play" style="margin-left: 4px;"></i>';
        } else {
            playBtnIcon.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    lyricsData.forEach((line, index) => {
        const lineDiv = document.getElementById('lyric-line-' + index);
        if (!lineDiv) return;
        
        const isCurrentLine = currentTimeMs >= line.begin && currentTimeMs <= line.end;
        const isPastLine = currentTimeMs > line.end;
        
        if (isCurrentLine) {
            lineDiv.style.color = 'rgba(255,255,255,1)';
            lineDiv.style.transform = 'scale(1.05)';
            
            const offsetTop = lineDiv.offsetTop;
            const containerHeight = lyricsContainer.clientHeight;
            const scrollPos = offsetTop - (containerHeight / 2) + 20;
            
            if (Math.abs(lyricsContainer.scrollTop - scrollPos) > 5) {
                lyricsContainer.scrollTo({ top: scrollPos, behavior: 'smooth' });
            }
        } else if (isPastLine) {
            lineDiv.style.color = 'rgba(255,255,255,0.5)';
            lineDiv.style.transform = 'scale(1)';
        } else {
            lineDiv.style.color = 'rgba(255,255,255,0.3)';
            lineDiv.style.transform = 'scale(1)';
        }
        
        if (isCurrentLine) {
            const wordSpans = lineDiv.getElementsByClassName('lyric-word');
            for (let i = 0; i < wordSpans.length; i++) {
                const wordSpan = wordSpans[i];
                const wordBegin = parseInt(wordSpan.getAttribute('data-begin'));
                const wordEnd = parseInt(wordSpan.getAttribute('data-end'));
                const wordDuration = Math.max(1, wordEnd - wordBegin);
                
                if (currentTimeMs >= wordEnd) {
                    // isWordComplete
                    wordSpan.style.background = 'none';
                    wordSpan.style.webkitTextFillColor = 'rgba(255,255,255,1)';
                    wordSpan.style.textShadow = 'none';
                    wordSpan.style.transform = 'translateY(0px) scale(1)';
                } else if (currentTimeMs >= wordBegin && currentTimeMs < wordEnd) {
                    // isWordActive
                    let progress = (currentTimeMs - wordBegin) / wordDuration;
                    if (progress < 0) progress = 0;
                    if (progress > 1) progress = 1;
                    
                    // Butterfly Bounce & Float
                    const sinProgress = Math.sin(progress * Math.PI);
                    const wordScale = 1 + (0.015 * sinProgress);
                    const targetFloat = -4 * sinProgress;
                    
                    // Butterfly Glow
                    const glowProgress = Math.min(1, progress * 2);
                    const glowAlpha = glowProgress * 0.45;
                    const glowRadius = glowProgress * 12;
                    
                    // Liquid Sweep Mask (Gradient)
                    const percent = Math.min(100, Math.max(0, progress * 100));
                    const blurStart = Math.max(0, percent - 5);
                    const blurEnd = Math.min(100, percent + 5);
                    wordSpan.style.background = `linear-gradient(to right, rgba(255,255,255,1) ${blurStart}%, rgba(255,255,255,0.4) ${blurEnd}%)`;
                    wordSpan.style.webkitBackgroundClip = 'text';
                    wordSpan.style.webkitTextFillColor = 'transparent';
                    
                    wordSpan.style.textShadow = `0 0 ${glowRadius}px rgba(255,255,255,${glowAlpha})`;
                    wordSpan.style.transform = `translateY(${targetFloat}px) scale(${wordScale})`;
                } else {
                    // future word
                    wordSpan.style.background = 'none';
                    wordSpan.style.webkitTextFillColor = 'rgba(255,255,255,0.4)';
                    wordSpan.style.textShadow = 'none';
                    wordSpan.style.transform = 'translateY(0px) scale(1)';
                }
            }
        } else {
            const wordSpans = lineDiv.getElementsByClassName('lyric-word');
            for (let i = 0; i < wordSpans.length; i++) {
                const wordSpan = wordSpans[i];
                wordSpan.style.background = 'none';
                wordSpan.style.webkitTextFillColor = isPastLine ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
                wordSpan.style.textShadow = 'none';
                wordSpan.style.transform = 'translateY(0px) scale(1)';
            }
        }
    });
    
    lyricsAnimationFrame = requestAnimationFrame(updateLyricsSync);
}

function updateLeftPanel(song) {
    if (!song) return;
    const titleText = decodeHtml(song.name || song.title || 'Unknown');
    if (titleText.length > 25) {
        document.getElementById('lyricsLeftTitle').innerHTML = `<marquee behavior="scroll" direction="left" scrollamount="4">${titleText}</marquee>`;
    } else {
        document.getElementById('lyricsLeftTitle').textContent = titleText;
    }
    
    document.getElementById('lyricsLeftArtist').innerHTML = window.getClickableArtistsHtml ? window.getClickableArtistsHtml(song) : (typeof song.primaryArtists === 'string' ? song.primaryArtists : (song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist'));
    
    const imgArray = song.image || [];
    let imgUrl = (imgArray.find && imgArray.find(i=>i.quality==='500x500')?.url) || imgArray[imgArray.length-1]?.url || imgArray[0]?.url || '';
    if (imgUrl) {
        imgUrl = imgUrl.replace(/=w\d+-h\d+.*/, '=w1080-h1080-l90-rj');
    }
    document.getElementById('lyricsLeftCover').src = imgUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

const lyricsProgress = document.getElementById('lyricsProgressBarContainer');
if (lyricsProgress) {
    lyricsProgress.addEventListener('click', (e) => {
        const rect = lyricsProgress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const audio = document.getElementById('audioElement');
        if (audio && audio.duration) {
            audio.currentTime = percent * audio.duration;
        }
    });
}

function initLyricsWaveform() {
    const waveformGray = document.getElementById('lyricsWaveformGray');
    const progressBar = document.getElementById('lyricsProgressBarContainer');
    if (waveformGray && progressBar) {
        let html = '';
        const pattern = [50, 70, 50, 95, 65, 50, 85, 45, 55, 70, 50, 80, 60, 50, 75, 95, 85, 80, 55, 75, 85, 80, 50, 90, 80, 50, 95, 85, 50, 80, 65, 50, 85, 95, 55, 65, 45, 55, 75, 50, 85, 70, 55, 45, 75, 65, 45, 55, 90, 55, 50, 85, 95, 70, 55, 50, 90, 65, 50, 75, 85, 55, 50, 90, 95, 65, 45, 55, 80, 60, 45, 65, 90, 75, 50, 85, 95, 60, 50, 70, 80, 55, 45, 90, 95, 65, 50, 60, 75, 55, 45, 85, 70, 50, 60, 80, 95, 60, 50, 90];
        for(let i=0; i<100; i++) {
            let h = pattern[i % pattern.length];
            html += `<div class="wave-bar" style="height: ${h}%"></div>`;
        }
        waveformGray.innerHTML = html;
        document.getElementById('lyricsWaveformActive').innerHTML = html;
    }
}
initLyricsWaveform();

window.toggleLyrics = function() {
    const overlay = document.getElementById('lyricsOverlay');
    isLyricsOpen = !isLyricsOpen;
    
    const lyricsBtn = document.getElementById('lyricsBtn');
    if (lyricsBtn) {
        if(isLyricsOpen) lyricsBtn.classList.add('active-icon');
        else lyricsBtn.classList.remove('active-icon');
    }
    
    if (isLyricsOpen) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('open'), 10);
        
        const currentSong = window.getCurrentTrack ? window.getCurrentTrack() : null;
        if (currentSong) {
            updateLeftPanel(currentSong);
            const currentTitle = document.getElementById('lyricsTitle')?.getAttribute('data-song-id');
            if (currentTitle !== currentSong.id) {
                if (document.getElementById('lyricsTitle')) {
                    document.getElementById('lyricsTitle').setAttribute('data-song-id', currentSong.id);
                }
                fetchLyricsData(currentSong);
            }
        }
        
        updateLyricsSync();
    } else {
        isLyricsOpen = false;
        document.getElementById('lyricsOverlay').style.display = 'none';
        document.getElementById('lyricsOverlay').classList.remove('open');
        cancelAnimationFrame(lyricsAnimationFrame);
    }
};

window.forceRefreshLyrics = () => {
    const track = window.getCurrentTrack && window.getCurrentTrack();
    if (track) {
        document.getElementById('lyricsContent').style.display = 'none';
        document.getElementById('lyricsError').style.display = 'none';
        fetchLyricsData(track, true);
    }
};

window.onSongChangeForLyrics = function(newSong) {
    if (isLyricsOpen) {
        updateLeftPanel(newSong);
        if (document.getElementById('lyricsTitle')) {
            document.getElementById('lyricsTitle').setAttribute('data-song-id', newSong.id);
        }
        fetchLyricsData(newSong);
    }
};

window.closeLyrics = window.toggleLyrics;
