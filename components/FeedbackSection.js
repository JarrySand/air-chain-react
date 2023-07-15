import React from 'react';

const FeedbackSection = () => (
    <div className="feedback-section">
        <h2 id="feedback">We'd love to hear your feedback</h2>
        <p>Your input helps us improve. Please take a moment to share your thoughts on our platform.</p>
        <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSf1OZuDeuVU9Q6wnRQVEZ46jOlWEgXbnoQ2QYPsay5BxiuSmQ/viewform" 
            target="_blank" 
            rel="noopener noreferrer"
            className="feedback-button"
        >
            Leave Feedback
        </a>
    </div>
);

export default FeedbackSection;
