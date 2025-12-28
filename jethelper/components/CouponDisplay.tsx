import React, { useState } from 'react';

interface CouponDisplayProps {
  code: string;
}

export const CouponDisplay: React.FC<CouponDisplayProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1E293B',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0',
      border: '1px solid #334155',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ 
          width: '48px', 
          height: '48px', 
          color: '#10B981',
          margin: '0 auto 12px'
        }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <h3 style={{ 
          color: 'white', 
          marginBottom: '8px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Your Discount Code is Ready!
        </h3>
        
        <p style={{ 
          color: '#9CA3AF',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          Use this code at checkout for 20% off your subscription.
        </p>
      </div>
      
      <div style={{
        backgroundColor: '#0F172A',
        border: '2px dashed #3B82F6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1E293B',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          color: '#60A5FA',
          fontWeight: '600'
        }}>
          COPY CODE
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <code style={{
            color: '#10B981',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '2px',
            fontFamily: 'monospace'
          }}>
            {code}
          </code>
          
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              backgroundColor: copied ? '#10B981' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      
      <div style={{
        color: '#6B7280',
        fontSize: '12px',
        lineHeight: '1.5'
      }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>How to use:</strong>
        </p>
        <ol style={{ 
          textAlign: 'left', 
          paddingLeft: '20px',
          marginBottom: '16px'
        }}>
          <li>Go to the JetSuite checkout page</li>
          <li>Paste <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>{code}</code> in the coupon field</li>
          <li>Complete your subscription</li>
        </ol>
        <p>
          <strong>Note:</strong> This code is valid for 1 business and remains active as long as your subscription is maintained.
        </p>
      </div>
    </div>
  );
};
