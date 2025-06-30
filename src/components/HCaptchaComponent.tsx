
import React from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

const HCaptchaComponent = ({ onVerify, onError, onExpire }: HCaptchaComponentProps) => {
  const siteKey = '3b44032c-8648-406c-b16e-2a5c0ce29b4c';

  return (
    <div className="flex justify-center my-4">
      <HCaptcha
        sitekey={siteKey}
        onVerify={(token) => onVerify(token)}
        onError={(err) => onError?.(err)}
        onExpire={() => onExpire?.()}
        theme="dark"
      />
    </div>
  );
};

export default HCaptchaComponent;
