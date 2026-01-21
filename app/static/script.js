document.addEventListener('DOMContentLoaded', function () {
    // Initialize Chart if on analysis page
    const ctx = document.getElementById('activityChart');
    if (ctx) {
        const labels = JSON.parse(ctx.dataset.labels);
        const sleepData = JSON.parse(ctx.dataset.sleep);
        const cryData = JSON.parse(ctx.dataset.cry);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Hours',
                    data: sleepData,
                    backgroundColor: '#8B5CF6',
                    borderRadius: 4
                }, {
                    label: 'Cries',
                    data: cryData,
                    backgroundColor: '#EC4899',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Apply data-progress widths
    document.querySelectorAll('[data-progress]').forEach(el => {
        el.style.width = el.dataset.progress + '%';
    });

    // Handle Toast Notifications
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status) {
        let message = '';
        let icon = 'fa-check-circle';

        switch (status) {
            case 'sleep_started':
                message = 'Sleep session started';
                icon = 'fa-moon';
                break;
            case 'sleep_ended':
                message = 'Sleep session ended';
                icon = 'fa-sun';
                break;
            case 'cry_logged':
                message = 'Cry event logged';
                icon = 'fa-clipboard-check';
                break;
            case 'task_updated':
                message = 'Daily task updated';
                icon = 'fa-calendar-check';
                break;
            case 'task_created':
                message = 'New baby task created';
                icon = 'fa-plus-circle';
                break;
            case 'task_skipped':
                message = 'Task skipped';
                icon = 'fa-circle-xmark';
                break;
            case 'baby_updated':
                message = 'Baby details updated';
                icon = 'fa-baby';
                break;
            default:
                message = 'Action completed';
        }

        showToast(message, icon);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // OTP Timer Logic
    const timerDisplay = document.getElementById('otpTimer');
    if (timerDisplay) {
        let timeLeft = 30;
        const interval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerDisplay.parentElement.innerHTML = 'Didn\'t receive? <a href="/login" style="color:var(--primary)">Resend</a>';
            }
        }, 1000);
    }
});

function switchMainTab(screenId) {
    document.querySelectorAll('.main-screen').forEach(el => el.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';

    document.querySelectorAll('.main-tabs .tab').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function showToast(message, iconClass = 'fa-check-circle') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Alert sound if it's a critical monitor alert
    if (iconClass === 'fa-triangle-exclamation') {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play blocked"));
    }

    // Remove after 4 seconds for monitors
    const duration = iconClass === 'fa-triangle-exclamation' ? 6000 : 3000;

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Connection Monitoring
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    const status = document.getElementById('syncStatus');
    if (!status) return;

    if (navigator.onLine) {
        status.classList.remove('offline');
        status.innerHTML = '<i class="fa-solid fa-cloud-check"></i> <span>Connected</span>';
        syncOfflineData();
    } else {
        status.classList.add('offline');
        status.innerHTML = '<i class="fa-solid fa-cloud-slash"></i> <span>Offline Mode</span>';
    }
}

// Offline Storage Logic
const OFFLINE_QUEUE_KEY = 'baby_tracker_offline_queue';

function queueOfflineAction(url, body) {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push({ url, body, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    showToast('Action saved offline', 'fa-cloud');
}

async function syncOfflineData() {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    showToast(`Syncing ${queue.length} items...`, 'fa-sync fa-spin');

    for (const item of queue) {
        try {
            await fetch(item.url, {
                method: 'POST',
                body: item.body
            });
        } catch (err) {
            console.error('Sync failed for item', err);
        }
    }

    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    showToast('All data synced!', 'fa-cloud-check');
    setTimeout(() => window.location.reload(), 1500);
}

// Intercept Forms for Offline Support
document.addEventListener('submit', function (e) {
    if (!navigator.onLine) {
        const form = e.target;
        if (form.method.toLowerCase() === 'post') {
            e.preventDefault();
            const formData = new FormData(form);
            queueOfflineAction(form.action, formData);
        }
    }
});

// Notifications
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

function sendAlert(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2919/2919600.png'
        });
    }
}

function setupVoiceRecorder() {
    const btn = document.getElementById('voiceBtn');
    if (!btn) return;

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    btn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append("audio", audioBlob);

                    const response = await fetch('/voice-log', { method: 'POST', body: formData });
                    if (response.ok) {
                        showToast('Voice recorded successfully', 'fa-microphone');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        showToast('Failed to save recording', 'fa-times');
                    }
                    audioChunks = [];
                };
                mediaRecorder.start();
                isRecording = true;
                btn.classList.add('recording');
                btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Recording';
            } catch (err) {
                showToast('Microphone access needed', 'fa-exclamation');
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            btn.classList.remove('recording');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Voice Tracker';
        }
    });
}

async function setupMonitorMode() {
    const btn = document.getElementById('toggleMonitorBtn');
    const label = document.getElementById('monitorLabel');
    if (!btn) return;

    let isMonitoring = false;
    let audioContext;
    let analyser;
    let microphone;
    let scriptProcessor;
    let lastAlertTime = 0;

    // Logic to automatically start monitoring if sleep just started
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'sleep_started') {
        setTimeout(() => {
            if (btn && !isMonitoring) btn.click();
        }, 500);
    }

    btn.addEventListener('click', async () => {
        if (!isMonitoring) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 1024;

                microphone.connect(analyser);
                analyser.connect(scriptProcessor);
                scriptProcessor.connect(audioContext.destination);

                scriptProcessor.onaudioprocess = () => {
                    const bufferLength = analyser.frequencyBinCount;
                    const array = new Uint8Array(bufferLength);
                    analyser.getByteFrequencyData(array);

                    // Baby cry frequency range: ~400Hz to ~3000Hz
                    // For 44.1kHz sample rate, 1024 FFT: 
                    // Bin size = 44100 / 1024 = 43Hz per bin.
                    // Start bin (400Hz) = 400 / 43 = ~10
                    // End bin (3000Hz) = 3000 / 43 = ~70

                    let values = 0;
                    let babyBinsCount = 0;
                    for (let i = 10; i < 70; i++) {
                        values += array[i];
                        babyBinsCount++;
                    }
                    const babyAverage = values / babyBinsCount;

                    // Noise floor check
                    let noiseFloor = 0;
                    for (let i = 0; i < 10; i++) noiseFloor += array[i]; // Lower frequencies (pet barks, rumbles)
                    const noiseAverage = noiseFloor / 10;

                    // Threshold: Baby sound must be significantly louder than noise floor
                    if (babyAverage > 35 && babyAverage > (noiseAverage * 1.5)) {
                        const now = Date.now();
                        if (now - lastAlertTime > 15000) {
                            lastAlertTime = now;
                            handleCryAlert(babyAverage);
                        }
                    }
                };

                isMonitoring = true;
                btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Monitoring';
                btn.classList.add('active');
                label.innerText = 'Monitoring... Leave app open.';
                showToast('Night Monitor Active', 'fa-moon');
            } catch (err) {
                showToast('Microphone access needed', 'fa-exclamation');
            }
        } else {
            stopMonitoring();
        }
    });

    function stopMonitoring() {
        if (scriptProcessor) scriptProcessor.disconnect();
        if (microphone) microphone.disconnect();
        if (audioContext) audioContext.close();
        isMonitoring = false;
        btn.innerHTML = '<i class="fa-solid fa-power-off"></i> Start Monitoring';
        btn.classList.remove('active');
        label.innerText = 'Monitoring for cries & wakeups';
    }

    async function handleCryAlert(volume) {
        const modal = document.getElementById('emergencyAlert');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('alertDetails').innerText = `Volume level: ${Math.round(volume)}. Baby might be awake!`;
        }

        showToast('BABY CRY DETECTED!', 'fa-triangle-exclamation');
        sendAlert('Baby Alert', 'Baby-specific frequency sound detected.');

        const formData = new FormData();
        formData.append("intensity", `Auto Detect (Baby Voice Pattern)`);

        try {
            await fetch('/cry', { method: 'POST', body: formData });
        } catch (e) {
            queueOfflineAction('/cry', formData);
        }
    }
}

function dismissAlert() {
    const modal = document.getElementById('emergencyAlert');
    if (modal) modal.classList.remove('show');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    requestNotificationPermission();
    setupVoiceRecorder();
    setupMonitorMode();

    // Apply data-progress widths for the dashboard
    document.querySelectorAll('[data-progress]').forEach(el => {
        el.style.width = el.dataset.progress + '%';
    });
});

// Handle Profile Toggles
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('settings-toggle')) {
        e.target.classList.toggle('active');
        const label = e.target.parentElement.querySelector('.settings-label').innerText;
        showToast(`${label} updated`, 'fa-gear');
    }
});
