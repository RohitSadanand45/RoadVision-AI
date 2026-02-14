/**
 * Supabase API Layer
 * Uses global window.supabaseClient from superbase.js
 */

async function saveComplaint(complaint) {
    // Map to actual Supabase table columns
    const row = {
        email: complaint.email,
        issue_type: complaint.type,
        severity: complaint.severity,
        address: complaint.address,
        department: complaint.department,
        status: complaint.status
    };

    const { data, error } = await window.supabaseClient
        .from("complaints")
        .insert([row])
        .select();

    if (error) {
        console.error("Supabase error:", error);
        alert("Failed to save complaint: " + error.message);
        return null;
    }

    return data;
}

window.saveComplaint = saveComplaint;
