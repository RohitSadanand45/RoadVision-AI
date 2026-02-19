/**
 * MOCK API & UTILS
 * Simulates Backend logic for AI, Database, and Auth
 */

const MockAPI = {

    // Simulate AI Analysis
    analyzeMedia: async (file) => {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                // Randomize result for demo purposes
                const scenarios = [
                    { type: 'Pothole', severity: 'High', confidence: 96, color: '#ef4444', desc: 'Deep pothole detected on main carriage way. Risk of vehicle damage.' },
                    { type: 'Waterlogging', severity: 'Medium', confidence: 89, color: '#fbbf24', desc: 'Stagnant water accumulation detected. Drainage inspection recommended.' },
                    { type: 'Road Crack', severity: 'Low', confidence: 92, color: '#3b82f6', desc: 'Surface cracking visible. Preventive maintenance suggested.' },
                    { type: 'No Issue', severity: 'Safe', confidence: 99, color: '#10b981', desc: 'Road surface appears clear and safe.' }
                ];

                // Pick random scenario (exclude 'No Issue' more often for better demo)
                const result = scenarios[Math.floor(Math.random() * (scenarios.length > 1 ? 3 : 1))];

                resolve(result);
            }, 2500); // 2.5s simulated delay
        });
    },

    // Simulate Complaint Submission
    submitComplaint: (data) => {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');

        // Generate ID
        const id = `SRVY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Determine Logic based on Severity
        let eta = "7 Days";
        let dept = "GHMC";

        if (data.severity === 'High') { eta = "24-48 Hours"; dept = "Emergency R&B Team"; }
        else if (data.severity === 'Medium') { eta = "5 Days"; dept = "Municipal Corp"; }

        const newComplaint = {
            id: id,
            ...data,
            status: 'Submitted',
            department: dept,
            eta: eta,
            date: new Date().toLocaleDateString()
        };

        complaints.unshift(newComplaint);
        localStorage.setItem('complaints', JSON.stringify(complaints));

        return newComplaint;
    },

    // Get Complaint by ID
    getComplaint: (id) => {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        return complaints.find(c => c.id === id);
    },

    // Get User Stats
    getStats: (userEmail) => {
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const userComplaints = userEmail ? complaints.filter(c => c.email === userEmail) : complaints;

        return {
            total: userComplaints.length,
            pending: userComplaints.filter(c => c.status !== 'Resolved').length,
            resolved: userComplaints.filter(c => c.status === 'Resolved').length
        };
    }
};

