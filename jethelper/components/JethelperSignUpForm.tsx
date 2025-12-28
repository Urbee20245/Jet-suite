import React, { useState } from 'react';

interface SignUpFormProps {
  onSubmit: (name: string, email: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit to Formspree
      const response = await fetch('https://formspree.io/f/mbdjloja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          name, 
          email,
          source: 'JetSuite Chat',
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Call the parent onSubmit to show coupon
        onSubmit(name, email);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1E293B',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0',
      border: '1px solid #334155',
    }}>
      <h3 style={{ 
        color: 'white', 
        marginBottom: '16px',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        Get Your 20% Discount Code
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#9CA3AF',
            fontSize: '14px',
            marginBottom: '6px'
          }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            color: '#9CA3AF',
            fontSize: '14px',
            marginBottom: '6px'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          />
        </div>
        
        {error && (
          <div style={{
            color: '#EF4444',
            fontSize: '14px',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px'
          }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Get My 20% Discount Code'}
        </button>
        
        <p style={{
          color: '#6B7280',
          fontSize: '12px',
          marginTop: '12px',
          lineHeight: '1.4'
        }}>
          Your information is secure. The discount code is valid for 1 business and remains active as long as your subscription is maintained.
        </p>
      </form>
    </div>
  );
};
        </div>
    );
};
