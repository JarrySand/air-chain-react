import React from 'react';

const SignUpRadioStation = ({ radioStationSignUpForm, handleRadioStationNameChange, signUpRadioStation }) => (
    <div>
        <h2>Sign Up</h2>
        <form onSubmit={signUpRadioStation}>
            <label htmlFor="radioStationName">Radio Station Name:</label>
            <input
                type="text"
                id="radioStationName"
                value={radioStationSignUpForm.name}
                onChange={handleRadioStationNameChange}
                required
            />
            <button type="submit">Sign Up</button>
        </form>
    </div>
);

export default SignUpRadioStation;
