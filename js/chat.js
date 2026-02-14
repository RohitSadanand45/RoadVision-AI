const chatData = {
    intents: {
        greetings: {
            patterns: ["hi", "hello", "hey", "good morning", "good evening"],
            responses: ["Hello! How can I assist you with Smart Road Vision today?", "Hi there! I'm here to help you with road complaints.", "Greetings! meaningful citizen."]
        },
        complaint_status: {
            patterns: ["status", "track", "check complaint", "where is my complaint"],
            responses: ["You can track your complaint status in the 'Track' section of your dashboard using your Complaint ID."]
        },
        report_issue: {
            patterns: ["report", "complain", "pothole", "bad road", "upload"],
            responses: ["To report an issue, log in and use the 'Analyze' tab to upload a photo or video of the road defect."]
        },
        emergency: {
            patterns: ["emergency", "accident", "urgent", "danger"],
            responses: ["If this is a life-threatening emergency, please call 100 or 108 immediately. For road hazards, please mark it as 'High Severity' in the app."]
        },
        default: {
            responses: ["I'm still learning. Could you please rephrase that? I can help with reporting issues and tracking status.", "I didn't quite catch that. You can ask me about reporting potholes or checking complaint status."]
        }
    }
};

class Chatbot {
    constructor() {
        this.chatWindow = document.getElementById('chat-window');
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.toggleBtn = document.getElementById('chatbot-toggle');
        this.closeBtn = document.getElementById('chat-close');
        this.sendBtn = document.getElementById('chat-send');

        this.isOpen = false;
        this.init();
    }

    init() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat());
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });

        // Initial Greeting
        setTimeout(() => {
            this.addMessage("Hello! I'm your AI Road Assistant. How can I help you today?", 'bot');
        }, 1000);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatWindow.classList.add('active');
            this.toggleBtn.classList.add('hidden');
        } else {
            this.chatWindow.classList.remove('active');
            this.toggleBtn.classList.remove('hidden');
        }
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        // User Message
        this.addMessage(text, 'user');
        this.input.value = '';

        // Simulate AI Thinking
        this.showTyping();

        // Process Response
        setTimeout(() => {
            this.removeTyping();
            const response = this.getBotResponse(text);
            this.addMessage(response, 'bot');
        }, 1500);
    }

    getBotResponse(text) {
        text = text.toLowerCase();
        let response = null;

        for (const intent in chatData.intents) {
            const data = chatData.intents[intent];
            if (data.patterns && data.patterns.some(p => text.includes(p))) {
                response = data.responses[Math.floor(Math.random() * data.responses.length)];
                break;
            }
        }

        return response || chatData.intents.default.responses[Math.floor(Math.random() * chatData.intents.default.responses.length)];
    }

    addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message animate-fade-in`;
        div.innerHTML = `
            <div class="message-content">
                ${text}
            </div>
            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    showTyping() {
        const div = document.createElement('div');
        div.className = 'message bot-message typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
});
