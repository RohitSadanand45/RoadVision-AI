// App Logic

// Check Auth - Try Supabase session first, fallback to localStorage
let user = JSON.parse(localStorage.getItem('user'));

// Verify Supabase session on load
(async function checkAuth() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
            // Update local user from Supabase session
            user = {
                name: session.user.user_metadata.name || session.user.email.split('@')[0],
                email: session.user.email,
                district: session.user.user_metadata.district || '',
                mandal: session.user.user_metadata.mandal || '',
                mobile: session.user.user_metadata.mobile || ''
            };
            localStorage.setItem('user', JSON.stringify(user));
            document.getElementById('user-name').textContent = user.name;
        } else if (!user) {
            // No Supabase session and no local user
            window.location.href = 'auth.html';
            return;
        } else {
            // Has local user but no Supabase session — use local data
            document.getElementById('user-name').textContent = user.name;
        }
    } catch (err) {
        console.error('Auth check failed:', err);
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        document.getElementById('user-name').textContent = user.name;
    }
})();

async function logout() {
    try {
        await window.supabaseClient.auth.signOut();
    } catch (err) {
        console.error('Logout error:', err);
    }
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
    const address = document.getElementById('form-address').value;
    const text = `To,\nThe Commissioner,\nGreater Hyderabad Municipal Corporation,\n\nSubject: Complaint regarding ${result.type} at ${address}\n\nRespected Sir/Madam,\n\nI would like to bring to your notice a ${result.severity} severity ${result.type} detected at ${address}. \n\nAI Analysis Details:\n- Issue: ${result.type}\n- Severity: ${result.severity}\n- Confidence: ${result.confidence}%\n- Location: ${address}\n\nPlease take necessary action.\n\nSincerely,\n${user.name}\n${user.email}`;
    document.getElementById('letter-preview').value = text;
}

// Auto-capture location data when address is entered
document.addEventListener('DOMContentLoaded', function () {
    const addressField = document.getElementById('form-address');
    if (addressField) {
        addressField.addEventListener('change', function () {
            // Automatically update location in the letter preview whenever address changes
            const analysisResult = {
                type: document.getElementById('form-type').value,
                severity: document.getElementById('form-severity').value,
                confidence: document.getElementById('res-conf')?.innerText || '0%'
            };
            if (analysisResult.type) {
                generateLetterPreview(analysisResult);
            }
        });
    }
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            // Mock Reverse Geocoding
            document.getElementById('form-address').value = "Jubilee Hills, Road No. 45, Hyderabad";
            // Trigger change event to auto-update location in letter
            document.getElementById('form-address').dispatchEvent(new Event('change'));
        }, () => {
            alert("Location access denied. Please enter manually.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

async function handleComplaintSubmit(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    // 1. Generate Complaint Data (was in MockAPI)
    const severity = document.getElementById('form-severity').value;
    let eta = "7 Days";
    let dept = "GHMC";

    if (severity === 'High') { eta = "24-48 Hours"; dept = "Emergency R&B Team"; }
    else if (severity === 'Medium') { eta = "5 Days"; dept = "Municipal Corp"; }

    const newComplaint = {
        id: `SRVY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        email: user.email,
        userName: user.name,
        type: document.getElementById('form-type').value,
        severity: severity,
        address: document.getElementById('form-address').value,
        department: dept,
        eta: eta,
        status: 'Submitted',
        date: new Date().toLocaleDateString()
    };

    try {
        // 2. Save to Supabase
        if (window.saveComplaint) {
            await window.saveComplaint(newComplaint);
        } else {
            console.error("saveComplaint function not found. Is api.js loaded?");
            alert("System Error: Could not connect to database.");
            btn.innerHTML = originalText;
            return;
        }

        // 3. Keep LocalStorage Sync for UI (Legacy Support)
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        complaints.unshift(newComplaint);
        localStorage.setItem('complaints', JSON.stringify(complaints));

        // 4. Store complaint for download option
        window.lastSubmittedComplaint = newComplaint;

        // 5. Show Success Modal with Download Option
        showComplaintSuccessModal(newComplaint);

        // 6. Reset Form
        document.getElementById('complaint-section').classList.add('hidden');
        document.getElementById('analysis-view').classList.add('hidden');
        document.getElementById('drop-zone').parentElement.classList.remove('hidden');

    } catch (err) {
        console.error("Submission error:", err);
        alert("Failed to submit complaint. Please try again.");
    } finally {
        btn.innerHTML = originalText;
    }
}

// Show Success Modal with Download Option
function showComplaintSuccessModal(complaint) {
    const modal = document.createElement('div');
    modal.id = 'success-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <i class="fa-solid fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 15px;"></i>
                <h2 style="color: #1f2937; margin: 0 0 10px 0;">Complaint Registered Successfully!</h2>
                <p style="color: #666; margin: 0; font-size: 0.95rem;">Your complaint has been submitted to the concerned department.</p>
            </div>

            <div style="
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            ">
                <p style="margin: 0; color: #1e40af; font-weight: bold; font-size: 0.9rem;">
                    📋 Complaint ID: <span style="font-family: monospace;">${complaint.id}</span>
                </p>
                <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 0.85rem;">
                    ⏱️ Expected Resolution: ${complaint.eta}
                </p>
            </div>

            <div style="margin: 25px 0;">
                <button onclick="downloadComplaintFormPDF(window.lastSubmittedComplaint)" style="
                    width: 100%;
                    padding: 12px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                    <i class="fa-solid fa-download"></i> Download Complaint Form (PDF)
                </button>

                <button onclick="closeSuccessModal()" style="
                    width: 100%;
                    padding: 12px;
                    background: #e5e7eb;
                    color: #1f2937;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                    Continue
                </button>
            </div>

            <p style="color: #666; font-size: 0.85rem; text-align: center; margin: 15px 0 0 0;">
                You will receive updates via email at <strong>${complaint.email}</strong>
            </p>
        </div>

        <style>
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;

    document.body.appendChild(modal);
}

// Close Success Modal
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => {
            modal.remove();
            switchTab('track');
        }, 300);
    }
}

// Download Complaint Form as Professional PDF
function downloadComplaintFormPDF(complaint) {
    const letterContent = document.getElementById('letter-preview').value;
    
    // Create HTML content for PDF
    const htmlContent = `
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header-title {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
                margin: 0;
            }
            .header-subtitle {
                font-size: 14px;
                color: #666;
                margin: 5px 0 0 0;
            }
            .complaint-id {
                background: #eff6ff;
                padding: 10px;
                border-left: 4px solid #3b82f6;
                margin-bottom: 20px;
                font-weight: bold;
                color: #1e40af;
            }
            .section {
                margin-bottom: 20px;
            }
            .section-title {
                background: #1e40af;
                color: white;
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
                border-radius: 3px;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            .detail-item {
                background: #f9fafb;
                padding: 10px;
                border-radius: 3px;
                border-left: 3px solid #3b82f6;
            }
            .detail-label {
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
                font-weight: bold;
                margin-bottom: 3px;
            }
            .detail-value {
                font-size: 13px;
                color: #1f2937;
                font-weight: 500;
            }
            .letter-content {
                background: #f9fafb;
                padding: 15px;
                border-radius: 3px;
                line-height: 1.6;
                font-size: 12px;
                color: #374151;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .severity-high {
                color: #dc2626;
                font-weight: bold;
            }
            .severity-medium {
                color: #f59e0b;
                font-weight: bold;
            }
            .severity-low {
                color: #10b981;
                font-weight: bold;
            }
            .footer {
                border-top: 2px solid #e5e7eb;
                margin-top: 30px;
                padding-top: 15px;
                font-size: 11px;
                color: #666;
                text-align: center;
            }
            .footer-contact {
                margin-top: 10px;
                font-weight: bold;
            }
            .status-badge {
                display: inline-block;
                background: #dbeafe;
                color: #1e40af;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <p class="header-title"> RoadVision AI - Complaint Form</p>
            <p class="header-subtitle">Official Road Infrastructure Issue Complaint</p>
        </div>

        <div class="complaint-id">
            📋 Complaint ID: ${complaint.id} | Date: ${complaint.date}
        </div>

        <div class="section">
            <div class="section-title">📌 COMPLAINANT INFORMATION</div>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Name</div>
                    <div class="detail-value">${complaint.userName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${complaint.email}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🚨 ISSUE DETAILS</div>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Issue Type</div>
                    <div class="detail-value">${complaint.type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Severity Level</div>
                    <div class="detail-value ${complaint.severity === 'High' ? 'severity-high' : complaint.severity === 'Medium' ? 'severity-medium' : 'severity-low'}">${complaint.severity}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location / Address</div>
                    <div class="detail-value">${complaint.address}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Department Assigned</div>
                    <div class="detail-value">${complaint.department}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Expected Resolution Time</div>
                    <div class="detail-value">${complaint.eta}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div><span class="status-badge">${complaint.status}</span></div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📄 FORMAL COMPLAINT LETTER</div>
            <div class="letter-content">${letterContent}</div>
        </div>

        <div class="section">
            <div class="section-title">ℹ️ IMPORTANT INFORMATION</div>
            <div style="font-size: 12px; line-height: 1.8; color: #374151;">
                <p>✓ Please keep this complaint form safe for your records.</p>
                <p>✓ Your Complaint ID is <strong>${complaint.id}</strong>. Use this ID to track your complaint status on the portal.</p>
                <p>✓ Expected resolution time: <strong>${complaint.eta}</strong></p>
                <p>✓ For urgent matters (High severity), immediate action will be taken by: <strong>${complaint.department}</strong></p>
                <p>✓ You will receive updates via email at <strong>${complaint.email}</strong></p>
                <p>✓ AI Confidence in issue detection: High (98%+)</p>
            </div>
        </div>

        <div class="footer">
            <p>Generated by RoadVision AI - Smart Infrastructure Portal</p>
            <p class="footer-contact">📧 support@roadvision.ai | 🌐 https://roadvision.ai</p>
            <p style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                This is an official complaint record. The information provided herein is true to the best of my knowledge and belief.
            </p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF using html2pdf
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const opt = {
        margin: 10,
        filename: `Complaint_${complaint.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
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

