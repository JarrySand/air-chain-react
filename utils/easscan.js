// src/utils/easscan.js
import { Buffer } from 'buffer';

const API_URL = "https://sepolia.easscan.org/graphql";

function decodeAttestationData(hexData) {
  const dataBuffer = Buffer.from(hexData.slice(2), "hex");

  if (dataBuffer.length < 16) {
    console.error('Received data is too short. Expected at least 16 bytes');
    return null;
  }

  const offsetStationName = dataBuffer.readUInt32BE(0);

  if (offsetStationName + 4 > dataBuffer.length) {
    console.error('Invalid station name offset. Check the input data');
    return null;
  }

  const stationNameLength = dataBuffer.readUInt32BE(offsetStationName);

  if (offsetStationName + 4 + stationNameLength > dataBuffer.length) {
    console.error('Invalid station name length. Check the input data');
    return null;
  }

  const stationName = dataBuffer
    .slice(offsetStationName + 4, offsetStationName + 4 + stationNameLength)
    .toString("utf8")
    .replace(/\0/g, ''); // Remove null bytes

  const date = dataBuffer.readBigUInt64BE(offsetStationName + 4 + stationNameLength);

  const offsetParticipationType = offsetStationName + 4 + stationNameLength + 8;

  if (offsetParticipationType + 4 > dataBuffer.length) {
    console.error('Invalid participation type offset. Check the input data');
    return null;
  }

  const participationTypeLength = dataBuffer.readUInt32BE(offsetParticipationType);

  if (offsetParticipationType + 4 + participationTypeLength > dataBuffer.length) {
    console.error('Invalid participation type length. Check the input data');
    return null;
  }

  const participationType = dataBuffer
    .slice(offsetParticipationType + 4, offsetParticipationType + 4 + participationTypeLength)
    .toString("utf8")
    .replace(/\0/g, ''); // Remove null bytes

  return {
    stationName,
    date: Number(date),
    participationType,
  };
}





export async function getAttestationsByRecipient(recipient) {
    const query = `
        query AttestationsByRecipient($recipient: String!) {
            attestations(
            where: { recipient: { equals: $recipient } },
            orderBy: { time: desc }
            ) {
            id
            attester
            recipient
            refUID
            revocable
            revocationTime
            expirationTime
            data
            }
        }
    `;

  const variables = {
    recipient,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  return data.data.attestations.map(attestation => ({
    ...attestation,
    decodedData: decodeAttestationData(attestation.data),
  }));
}

export async function getAttestationsByAttester(attester) {
  const query = `
    query AttestationsByAttester($attester: String!) {
      attestations(
        where: { attester: { equals: $attester } },
        orderBy: { time: desc }
      ) {
        id
        attester
        recipient
        refUID
        revocable
        revocationTime
        expirationTime
        data
      }
    }
  `;

  const variables = {
    attester,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  return data.data.attestations.map(attestation => ({
    ...attestation,
    decodedData: decodeAttestationData(attestation.data),
  }));
}
