export const htmlContent = (email: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Chat Room</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }
            
            .header h1 {
                font-size: 2.2rem;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .welcome-message {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .welcome-message h2 {
                color: #333;
                font-size: 1.8rem;
                margin-bottom: 15px;
            }
            
            .welcome-message p {
                color: #666;
                font-size: 1.1rem;
                margin-bottom: 20px;
            }
            
            .email-highlight {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
            }
            
            .features {
                margin: 30px 0;
            }
            
            .feature-item {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
           .feature-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                text-align: center;
                line-height: 40px;
                margin-right: 15px;
                color: white;
                font-weight: bold;
                font-size: 18px;
                flex-shrink: 0;
                vertical-align: top;
            }
            .feature-text h3 {
                color: #333;
                font-size: 1.1rem;
                margin-bottom: 5px;
            }
            
            .feature-text p {
                color: #666;
                font-size: 0.9rem;
            }
            
            .cta-button {
                text-align: center;
                margin: 30px 0;
            }
            
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 1.1rem;
                transition: transform 0.3s ease;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 10px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #667eea;
                text-decoration: none;
                font-weight: 500;
            }
            
            /* Mobile Responsive */
            @media only screen and (max-width: 600px) {
                body {
                    padding: 10px;
                }
                
                .header {
                    padding: 30px 15px;
                }
                
                .header h1 {
                    font-size: 1.8rem;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .welcome-message h2 {
                    font-size: 1.5rem;
                }
                
                .welcome-message p {
                    font-size: 1rem;
                }
                
                .feature-item {
                    flex-direction: column;
                    text-align: center;
                }
                
                .feature-icon {
                    margin-right: 0;
                    margin-bottom: 10px;
                }
                
                .btn {
                    padding: 12px 25px;
                    font-size: 1rem;
                }
                
                .footer {
                    padding: 20px 15px;
                }
            }
            
            @media only screen and (max-width: 400px) {
                .header h1 {
                    font-size: 1.6rem;
                }
                
                .welcome-message h2 {
                    font-size: 1.3rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    font-size: 0.9rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🎉 Welcome to Chat Room!</h1>
                <p>Your journey into amazing conversations starts here</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    <h2>Hello there! 👋</h2>
                    <p>Thank you for joining our community, <span class="email-highlight">${email}</span>!</p>
                    <p>We're excited to have you on board and can't wait for you to explore all the amazing features we have prepared for you.</p>
                </div>
                
                <div class="features">
                    <div class="feature-item">
                        <div class="feature-icon">💬</div>
                        <div class="feature-text">
                            <h3>Real-time Messaging</h3>
                            <p>Connect instantly with people from around the world</p>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">🔒</div>
                        <div class="feature-text">
                            <h3>Secure & Private</h3>
                            <p>Your conversations are protected with end-to-end encryption</p>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">🌍</div>
                        <div class="feature-text">
                            <h3>Global Community</h3>
                            <p>Join rooms with people who share your interests</p>
                        </div>
                    </div>
                </div>
                
                <div class="cta-button">
                    <a href="#" class="btn">Start Chatting Now</a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Need help?</strong> Our support team is always here to assist you.</p>
                <p>Contact us at support@chatroom.com</p>
                
                <div class="social-links">
                    <a href="#">Privacy Policy</a> |
                    <a href="#">Terms of Service</a> |
                    <a href="#">Support</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 0.8rem; color: #999;">
                    © 2024 Chat Room. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
