import React from 'react';

const IssuedAttestations = ({ attestations, getRecipientName, toggleDetails, showDetails, easScanUrl }) => (
    attestations.length > 0 && (
        <div>
            <h2 id="issuedAttestations">Issued Attestations ({attestations.length}):</h2>
            <table>
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Data</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                {attestations.map((attestation, index) => (
                    <React.Fragment key={`attestation-${index}`}>
                        <tr>
                            <td>{getRecipientName(attestation.recipient)}</td>
                            <td>
                                Station Name: {attestation.decodedData.stationName} <br />
                                Date: {attestation.decodedData.date} <br />
                                Participation Type: {attestation.decodedData.participationType}
                            </td>
                            <td>
                                <button onClick={() => toggleDetails(attestation.id)}>Details</button>
                            </td>
                        </tr>
                        {showDetails[attestation.id] && (
                            <tr>
                                <td colSpan="3">
                                    <strong>ID:</strong> {attestation.id}<br />
                                    <strong>Attester:</strong> {attestation.attester}<br />
                                    <strong>Recipient:</strong> {attestation.recipient}<br />
                                    <strong>RefUID:</strong> {attestation.refUID}<br />
                                    <strong>Revocable:</strong> {attestation.revocable}<br />
                                    <strong>Revocation Time:</strong> {attestation.revocationTime}<br />
                                    <strong>Expiration Time:</strong> {attestation.expirationTime}<br />
                                    <strong>EASscan URL:</strong> <a href={easScanUrl(attestation.id)} target="_blank" rel="noreferrer">{easScanUrl(attestation.id)}</a>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    )
);

export default IssuedAttestations;
