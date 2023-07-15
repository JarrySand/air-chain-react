// src/utils/easscan.js
import Web3 from 'web3';

const API_URL = "https://sepolia.easscan.org/graphql";

function decodeAttestationData(hexData) {
  const web3 = new Web3();

  const abi = ['string[]', 'uint64', 'string'];
  const decodedData = web3.eth.abi.decodeParameters(abi, hexData);

  // Assuming the string[] is of length 1, based on your example
  const stationName = decodedData[0][0];
  const date = decodedData[1];
  const participationType = decodedData[2];

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
