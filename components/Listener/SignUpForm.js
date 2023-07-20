import React from 'react';

function SignUpForm({ signUpForm, setSignUpForm, signUp }) {
  return (
    <form 
      className="form" 
      onSubmit={signUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '60%',  // Adjust this as per your needs
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div 
        className="form-group"
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '1rem',
          width: '100%'
        }}
      >
        <label 
          htmlFor="penName"
          style={{
            color: 'var(--primary-color)',
            marginBottom: '0.5rem',
            textAlign: 'center', // to center align the label text
            fontSize: '2em' 
          }}
        >
          Set your penname and start posting!
        </label>
        <input
          id="penName"
          type="text"
          value={signUpForm.penName}
          onChange={(e) =>
            setSignUpForm({ ...signUpForm, penName: e.target.value })
          }
          style={{
            fontFamily: 'var(--primary-font)',
            color: 'var(--primary-color)',
            backgroundColor: 'var(--secondary-bg-color)',
            border: '2px solid',
            borderColor: '#ffffff #000000 #000000 #ffffff',
            boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            borderRadius: '4px',
            padding: '8px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default SignUpForm;
