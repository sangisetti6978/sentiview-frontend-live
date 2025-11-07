// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Backend server URL

// --- Sentiment Analysis Words ---
const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'fantastic', 'wonderful', 'nice', 'love', 'perfect'];
const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'unacceptable', 'wrong'];

// --- Global State ---
let authToken = localStorage.getItem('authToken');
let feedbacks = []; // This will now be populated from the API

// --- DOM Elements ---
const loginForm = document.getElementById('loginForm');
const loginLink = document.getElementById('loginLink');
const logoutBtn = document.getElementById('logoutBtn');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const feedbackModal = document.getElementById('feedbackModal');
const closeModal = document.getElementById('closeModal');
const feedbackForm = document.getElementById('feedbackForm');
const exportBtn = document.getElementById('exportBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    if (window.location.pathname.includes('feedback.html')) {
        fetchFeedbacks();
    }
    
    if (window.location.pathname.includes('analytics.html')) {
        fetchFeedbacksForAnalytics();
    }
});

// --- AUTHENTICATION LOGIC ---
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Using signup endpoint for simplicity. You can create a separate login form if needed.
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                window.location.href = 'dashboard.html';
            } else {
                alert(data.msg || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Please try again.');
        }
    });
}

if (loginLink) {
    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('This would switch to a login form. For now, just sign up again.');
    });
}

function checkLoginStatus() {
    if (!authToken && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    });
}

// --- FEEDBACK MODAL & RATING LOGIC ---
if (submitFeedbackBtn) {
    submitFeedbackBtn.addEventListener('click', function() {
        feedbackModal.style.display = 'flex';
    });
}

if (closeModal) {
    closeModal.addEventListener('click', function() {
        feedbackModal.style.display = 'none';
    });
}

window.addEventListener('click', function(e) {
    if (e.target === feedbackModal) {
        feedbackModal.style.display = 'none';
    }
});

const ratingStars = document.querySelectorAll('.rating-input i');
let selectedRating = 0;

if (ratingStars.length > 0) {
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            updateRatingDisplay();
        });
        star.addEventListener('mouseenter', function() {
            const hoverRating = parseInt(this.getAttribute('data-rating'));
            highlightStars(hoverRating);
        });
    });
    document.querySelector('.rating-input').addEventListener('mouseleave', function() {
        updateRatingDisplay();
    });
}

function updateRatingDisplay() {
    highlightStars(selectedRating);
}

function highlightStars(rating) {
    ratingStars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

// --- SENTIMENT ANALYSIS FUNCTION ---
function analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Count positive words
    positiveWords.forEach(word => {
        if (lowerText.includes(word)) {
            positiveCount++;
        }
    });
    
    // Count negative words
    negativeWords.forEach(word => {
        if (lowerText.includes(word)) {
            negativeCount++;
        }
    });
    
    // Determine sentiment based on word counts
    if (positiveCount > negativeCount) {
        return 'positive';
    } else if (negativeCount > positiveCount) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

// --- API INTERACTIONS ---
async function fetchFeedbacks() {
    try {
        const response = await fetch(`${API_BASE_URL}/feedback`);
        feedbacks = await response.json();
        loadFeedbacks();
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
    }
}

if (feedbackForm) {
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productName = document.getElementById('productSelect').value;
        const customerName = document.getElementById('customerName').value;
        const feedbackText = document.getElementById('feedbackText').value;
        
        // Analyze sentiment based on the feedback text, not the rating
        const sentiment = analyzeSentiment(feedbackText);

        try {
            const response = await fetch(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName,
                    customerName,
                    rating: selectedRating,
                    feedback: feedbackText,
                    sentiment
                }),
            });

            if (response.ok) {
                feedbackForm.reset();
                selectedRating = 0;
                updateRatingDisplay();
                feedbackModal.style.display = 'none';
                alert('Thank you for your feedback!');
                // Refresh feedbacks if on the feedback page
                if (window.location.pathname.includes('feedback.html')) {
                    fetchFeedbacks();
                }
            } else {
                alert('Failed to submit feedback.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Please try again.');
        }
    });
}

// --- FEEDBACK TABLE & EXPORT ---
function loadFeedbacks() {
    const tableBody = document.getElementById('feedbackTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    feedbacks.forEach(feedback => {
        const row = document.createElement('tr');
        const sentimentClass = feedback.sentiment === 'positive' ? 'sentiment-positive' : 
                              feedback.sentiment === 'negative' ? 'sentiment-negative' : 
                              'sentiment-neutral';
        
        // Check if we're on the analytics page
        const isAnalyticsPage = window.location.pathname.includes('analytics.html');
        
        if (isAnalyticsPage) {
            // For analytics page, don't show the star rating
            row.innerHTML = `
                <td>${new Date(feedback.date).toLocaleDateString()}</td>
                <td>${feedback.productName}</td>
                <td>${feedback.customerName}</td>
                <td>${feedback.feedback}</td>
                <td class="${sentimentClass}">${feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1)}</td>
            `;
        } else {
            // For other pages (like feedback.html), show the star rating
            row.innerHTML = `
                <td>${new Date(feedback.date).toLocaleDateString()}</td>
                <td>${feedback.productName}</td>
                <td>${feedback.customerName}</td>
                <td>${generateStars(feedback.rating)}</td>
                <td>${feedback.feedback}</td>
                <td class="${sentimentClass}">${feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1)}</td>
            `;
        }
        
        tableBody.appendChild(row);
    });
}

function generateStars(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<i class="${i <= rating ? 'fas' : 'far'} fa-star" style="color: #ffc107;"></i>`;
    }
    return starsHTML;
}

if (exportBtn) {
    exportBtn.addEventListener('click', function() {
        let csvContent = "Date,Product Name,Customer Name,Rating,Feedback,Sentiment\n";
        
        feedbacks.forEach(feedback => {
            csvContent += `${new Date(feedback.date).toLocaleDateString()},${feedback.productName},${feedback.customerName},${feedback.rating},"${feedback.feedback}",${feedback.sentiment}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'feedbacks.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    });
}

// --- SEARCH & OTHER UI LOGIC ---
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const productName = card.querySelector('h3').textContent.toLowerCase();
            const productDescription = card.querySelector('p').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-product')) {
        window.location.href = 'product.html';
    }
    if (e.target.classList.contains('customer-reviews')) {
        alert('Customer reviews would be displayed here');
    }
});

// --- ANALYTICS LOGIC ---
async function fetchFeedbacksForAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/feedback`);
        feedbacks = await response.json();
        
        // Re-analyze sentiment for all feedbacks based on text
        feedbacks.forEach(feedback => {
            feedback.sentiment = analyzeSentiment(feedback.feedback);
        });
        
        updateAnalyticsData();
        // Load feedbacks without star rating for analytics page
        loadFeedbacks();
        // The chart.js file will now use the updated global 'feedbacks' array
        if (typeof renderCharts === 'function') {
            renderCharts();
        }
    } catch (error) {
        console.error('Error fetching feedbacks for analytics:', error);
    }
}

function updateAnalyticsData() {
    let positiveCount = feedbacks.filter(f => f.sentiment === 'positive').length;
    let negativeCount = feedbacks.filter(f => f.sentiment === 'negative').length;
    let neutralCount = feedbacks.filter(f => f.sentiment === 'neutral').length;
    const totalCount = feedbacks.length;
    
    const positiveCard = document.querySelector('.stat-card.positive');
    const negativeCard = document.querySelector('.stat-card.negative');
    const neutralCard = document.querySelector('.stat-card.neutral');
    
    if (positiveCard) {
        positiveCard.querySelector('.stat-number').textContent = positiveCount;
        positiveCard.querySelector('.stat-percentage').textContent = totalCount > 0 ? 
            `${Math.round(positiveCount / totalCount * 100)}%` : '0%';
    }
    
    if (negativeCard) {
        negativeCard.querySelector('.stat-number').textContent = negativeCount;
        negativeCard.querySelector('.stat-percentage').textContent = totalCount > 0 ? 
            `${Math.round(negativeCount / totalCount * 100)}%` : '0%';
    }
    
    if (neutralCard) {
        neutralCard.querySelector('.stat-number').textContent = totalCount;
        neutralCard.querySelector('.stat-percentage').textContent = '100%';
    }
    
    return {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
    };
}