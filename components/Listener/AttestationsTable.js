import React from 'react';

function AttestationsTable({ attestations, showDetails, toggleDetails, getRadioStationName, easScanUrl }) {
  return (
    <div>
      <h2 id="attestations">Attestations ({attestations.length}):</h2>
      <table>
        <thead>
          <tr>
            <th>Radio Station</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {attestations.map(attestation => (
            <React.Fragment key={attestation.id}>
              <tr>
                <td>{getRadioStationName(attestation.attester)}</td>
                <td>
                  Station Name: {attestation.decodedData.stationName} <br/>
                  Date: {attestation.decodedData.date} <br/>
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
  );
}

export default AttestationsTable;
