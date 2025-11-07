// Add this function to analyze sentiment based on words
function analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'fantastic', 'wonderful', 'nice', 'love', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'unacceptable', 'wrong'];
    
    // Convert text to lowercase and split into words
    const words = text.toLowerCase().split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Count positive and negative words
    words.forEach(word => {
        if (positiveWords.includes(word)) {
            positiveCount++;
        } else if (negativeWords.includes(word)) {
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

function renderCharts() {
    const sentimentData = updateAnalyticsData();
    
    const pieCtx = document.getElementById('pieChart');
    const barCtx = document.getElementById('barChart');
    if (window.pieChartInstance) window.pieChartInstance.destroy();
    if (window.barChartInstance) window.barChartInstance.destroy();
    if(pieCtx) {
        window.pieChartInstance = new Chart(pieCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Positive', 'Negative', 'Neutral'],
                datasets: [{
                    data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
                    backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round(value / total * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    if(barCtx) {
        window.barChartInstance = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Positive', 'Negative', 'Neutral'],
                datasets: [{
                    label: 'Number of Feedbacks',
                    data: [sentimentData.positive, sentimentData.negative, sentimentData.neutral],
                    backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// This will be called from main.js after fetching data
// document.addEventListener('DOMContentLoaded', renderCharts); // No longer needed here