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

function setupVoiceRecorder() {
    const btn = document.getElementById('voiceBtn');
    if (!btn) return;

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    btn.addEventListener('click', async () => {
        if (!isRecording) {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append("audio", audioBlob);

                    // Send to backend
                    const response = await fetch('/voice-log', {
                        method: 'POST',
                        body: formData
                    });

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
                console.error("Mic access denied", err);
                showToast('Microphone access needed', 'fa-exclamation');
            }
        } else {
            // Stop Recording
            mediaRecorder.stop();
            isRecording = false;
            btn.classList.remove('recording');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Voice Tracker';
        }
    });
}
document.addEventListener('DOMContentLoaded', setupVoiceRecorder);
