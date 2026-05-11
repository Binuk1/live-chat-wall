import { useEffect } from 'react';

/**
 * DevToolsWarning - Security warning for browser console
 * Displays a styled warning to deter users from pasting malicious code
 */
function DevToolsWarning() {
  useEffect(() => {
    // Only run in production to avoid cluttering dev console
    if (import.meta.env.DEV) return;

    const styles = [
      'font-size: 24px',
      'font-weight: bold',
      'color: #ff6b6b',
      'text-shadow: 2px 2px 0 #c92a2a',
      'padding: 10px',
    ].join(';');

    const warningStyles = [
      'font-size: 14px',
      'color: #e8590c',
      'font-weight: 600',
    ].join(';');

    const normalStyles = [
      'font-size: 13px',
      'color: #495057',
    ].join(';');

    const bulletStyles = [
      'font-size: 13px',
      'color: #339af0',
      'font-weight: 500',
    ].join(';');

    console.log('%c⚠️ SECURITY WARNING ⚠️', styles);
    console.log('%cThis is a browser feature intended for developers.', warningStyles);
    console.log('%cIf someone told you to paste code here, it is a SCAM!', warningStyles);
    console.log('%cPasting unknown code can compromise your account and data.', normalStyles);
    console.log('%c\nFor your security:', normalStyles);
    console.log('%c• Never paste code you don\'t understand', bulletStyles);
    console.log('%c• Never share your login credentials', bulletStyles);
    console.log('%c• Report suspicious activity to moderators', bulletStyles);
    console.log('%c\nStay safe! 🛡️', normalStyles);
  }, []);

  // This component doesn't render anything to the DOM
  return null;
}

export default DevToolsWarning;
