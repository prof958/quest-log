import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';

type AuthFlowState = 'login' | 'signup';

export const AuthFlow: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthFlowState>('login');

  const showSignUp = () => setCurrentView('signup');
  const showLogin = () => setCurrentView('login');

  switch (currentView) {
    case 'signup':
      return <SignUpScreen onBackToLogin={showLogin} />;
    case 'login':
    default:
      return <LoginScreen onShowSignUp={showSignUp} />;
  }
};