import React from 'react';

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h1>EchoChat</h1>
                </div>
                <div className="splash-loader">
                    <div className="loader-bar"></div>
                </div>
                <div className="splash-footer">
                    <div className="encryption-text">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        End-to-end encrypted
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
