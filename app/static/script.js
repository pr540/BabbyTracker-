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
            default:
                message = 'Action completed';
        }

        showToast(message, icon);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

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

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    requestNotificationPermission();
    setupVoiceRecorder();
});

// Handle Profile Toggles
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('settings-toggle')) {
        e.target.classList.toggle('active');
        const label = e.target.parentElement.querySelector('.settings-label').innerText;
        showToast(`${label} updated`, 'fa-gear');
    }
});
