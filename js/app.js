// App Logic

// Check Auth
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = 'auth.html';
} else {
    document.getElementById('user-name').textContent = user.name;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Find nav item (simple hack for demo)
    const navItems = document.querySelectorAll('.nav-item');
    if (tabName === 'dashboard') navItems[0].classList.add('active');
    if (tabName === 'analyze') navItems[1].classList.add('active');
    if (tabName === 'track') {
        navItems[2].classList.add('active');
        loadComplaintsTable();
    }

    if (tabName === 'dashboard') loadStats();
}

// Stats Loading
function loadStats() {
    // Pass user email to get personalized stats
    const stats = MockAPI.getStats(user.email);
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-pending').innerText = stats.pending;
    document.getElementById('stat-resolved').innerText = stats.resolved;

    // Load recent list - FILTER by User
    const allComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const userComplaints = allComplaints.filter(c => c.email === user.email);

    const list = document.getElementById('recent-list');
    list.innerHTML = '';

    if (userComplaints.length === 0) {
        list.innerHTML = '<p class="text-muted text-center py-4">No recent complaints found.</p>';
        return;
    }

    userComplaints.slice(0, 3).forEach(c => {
        const div = document.createElement('div');
        div.className = 'glass-card p-3 mb-2 flex justify-between items-center';
        div.style.padding = '12px';
        div.innerHTML = `
            <div>
                <p class="font-bold">${c.type}</p>
                <p class="text-xs text-muted">${c.id} • ${c.date}</p>
            </div>
            <span class="badge ${c.severity === 'High' ? 'badge-critical' : 'badge-pending'}">${c.status}</span>
        `;
        list.appendChild(div);
    });
}

// AI Analysis Logic
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Please upload an image or video file.');
        return;
    }

    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('form-preview-img').src = e.target.result;

        // Show Analysis View
        document.getElementById('drop-zone').parentElement.classList.add('hidden');
        document.getElementById('analysis-view').classList.remove('hidden');
        document.getElementById('analysis-loading').classList.remove('hidden');
        document.getElementById('analysis-result').classList.add('hidden');
        document.getElementById('scan-overlay').classList.remove('hidden');

        // Start Analysis
        performAnalysis(file);
    };
    reader.readAsDataURL(file);
}

async function performAnalysis(file) {
    try {
        const result = await MockAPI.analyzeMedia(file);

        // Hide Loading
        document.getElementById('analysis-loading').classList.add('hidden');
        document.getElementById('scan-overlay').classList.add('hidden');
        document.getElementById('analysis-result').classList.remove('hidden');

        // Update UI
        document.getElementById('res-type').innerText = result.type;
        document.getElementById('res-severity').innerText = result.severity;
        document.getElementById('res-conf').innerText = result.confidence + '%';
        document.getElementById('res-desc').innerText = result.desc;

        // Color Coding
        document.getElementById('res-severity').style.color = result.color;

        // Pre-fill Complain Form
        document.getElementById('form-type').value = result.type;
        document.getElementById('form-severity').value = result.severity;

        // Generate Letter Preview
        generateLetterPreview(result);

    } catch (error) {
        console.error("Analysis Failed", error);
        alert("AI Analysis failed. Please try again.");
        location.reload();
    }
}

function proceedToComplaint() {
    document.getElementById('analysis-view').classList.add('hidden');
    document.getElementById('complaint-section').classList.remove('hidden');
}

function generateLetterPreview(result) {
    const text = `To,\nThe Commissioner,\nGreater Hyderabad Municipal Corporation,\n\nSubject: Complaint regarding ${result.type} at [Location]\n\nRespected Sir/Madam,\n\nI would like to bring to your notice a ${result.severity} severity ${result.type} detected at my location. \n\nAI Analysis Details:\n- Issue: ${result.type}\n- Severity: ${result.severity}\n- Confidence: ${result.confidence}%\n\nPlease take necessary action.\n\nSincerely,\n${user.name}\n${user.email}`;
    document.getElementById('letter-preview').value = text;
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            // Mock Reverse Geocoding
            document.getElementById('form-address').value = "Jubilee Hills, Road No. 45, Hyderabad";
        }, () => {
            alert("Location access denied. Please enter manually.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function handleComplaintSubmit(e) {
    e.preventDefault();
    const data = {
        type: document.getElementById('form-type').value,
        severity: document.getElementById('form-severity').value,
        address: document.getElementById('form-address').value,
        email: user.email, // Attach User Email
        userName: user.name
    };

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    setTimeout(() => {
        const result = MockAPI.submitComplaint(data);
        alert(`Complaint Registered Successfully!\nID: ${result.id}\nETA: ${result.eta}`);
        switchTab('track'); // Go to status list
        btn.innerHTML = 'Submit Complaint';
        // Reset View
        document.getElementById('complaint-section').classList.add('hidden');
        document.getElementById('analysis-view').classList.add('hidden');
        document.getElementById('drop-zone').parentElement.classList.remove('hidden');
    }, 1500);
}

// Tracking List Logic
function loadComplaintsTable() {
    const allComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    // Filter by User
    const userComplaints = allComplaints.filter(c => c.email === user.email);

    const tbody = document.getElementById('complaints-table-body');
    const noMsg = document.getElementById('no-complaints-msg');

    tbody.innerHTML = '';

    if (userComplaints.length === 0) {
        noMsg.classList.remove('hidden');
        return;
    } else {
        noMsg.classList.add('hidden');
    }

    userComplaints.forEach(c => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--glass-border)';
        row.className = 'animate-fade-in';

        let statusClass = 'badge-pending';
        if (c.status === 'Resolved') statusClass = 'badge-resolved';
        if (c.severity === 'High') statusClass = 'badge-critical';

        row.innerHTML = `
            <td style="padding: 12px; color: var(--accent); font-family: monospace;">${c.id}</td>
            <td style="padding: 12px;">${c.type}</td>
            <td style="padding: 12px;">${c.date}</td>
            <td style="padding: 12px;">${c.department}</td>
            <td style="padding: 12px;"><span class="badge ${statusClass}">${c.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Initial Load
loadStats();
