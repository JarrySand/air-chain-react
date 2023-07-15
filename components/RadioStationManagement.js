import React, { useState, useEffect } from 'react';
import { useSigner, useAddress } from "@thirdweb-dev/react";
import { ethers } from 'ethers';
import { db } from '../utils/firebase';
import { collection, addDoc, where, query, getDocs, updateDoc, onSnapshot, doc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { getAttestationsByAttester } from '../utils/easscan';
import RadioStationManagementNavBar from './RadioStationManagement/RadioStationManagementNavBar';
import SettingsDropdown from './RadioStationManagement/RadioStationManagementSettingDropdown';
import WalletConnector from './WalletConnector';
import ListenerPosts from './RadioStationManagement/ListenerPosts';
import FeedbackSection from './FeedbackSection';
import IssuedAttestations from './RadioStationManagement/IssuedAttestations';
import SignUpRadioStation from './RadioStationManagement/SignUpRadioStation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

const RadioStationManagement = () => {
    const [recipientAddress, setRecipientAddress] = useState(null);
    const [radioStationSignUpForm, setRadioStationSignUpForm] = useState({ name: '' });
    const [radioStation, setRadioStation] = useState(null);
    const [radioStationPosts, setRadioStationPosts] = useState([]);
    const [selectedParticipationType, setSelectedParticipationType] = useState(null);
    const [attestations, setAttestations] = useState([]);
    const [showDetails, setShowDetails] = useState({});
    const [users, setUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingOperation, setLoadingOperation] = useState(false);

    const address = useAddress();
    const signer = useSigner();


    useEffect(() => {
        if (recipientAddress) {
            loginRadioStation(recipientAddress);
        }
    }, [recipientAddress]);

    useEffect(() => {
        if (radioStation) {
            fetchPosts();
        }
    }, [radioStation]);

    useEffect(() => {
        if (recipientAddress) {
            const fetchAttestations = async () => {
                const attestationsData = await getAttestationsByAttester(recipientAddress);
                setAttestations(attestationsData);
            };
            fetchAttestations();
        }
    }, [recipientAddress]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersData = usersSnapshot.docs.map(doc => doc.data());
            setUsers(usersData);
        };
        fetchUsers();
    }, []);


    const handleRadioStationNameChange = (event) => {
        setRadioStationSignUpForm({ name: event.target.value });
    }

    const fetchPosts = async () => {
        const postsCollection = collection(db, "listenerPosts");
        const q = query(postsCollection, where("station", "==", radioStation.name), orderBy("timestamp", "desc"));
        const postsSnapshot = await getDocs(q);
        const posts = postsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setRadioStationPosts(posts);
    };    

    const onWalletConnect = ({ address, signer }) => {
        console.log('onWalletConnect called');
        setLoading(true); 
        try {
          const checksumAddress = ethers.utils.getAddress(address);
          // here you no longer need to call signer(signer); just use the signer directly
          setRecipientAddress(checksumAddress);
      
          console.log('Set signer to: ', signer);
          console.log('Set recipient address to: ', checksumAddress);
      
          // remove this line
          // loginRadioStation(checksumAddress); // login when address is connected
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        } finally {
          setLoading(false); // Set loading state to false when wallet connection finishes (regardless of success or failure)
        }
    };
      
    const signUpRadioStation = async () => {
        setLoadingOperation(true); // Set loadingOperation to true at the start of the operation
        const radioStationName = radioStationSignUpForm.name;
        if (radioStationName) {
            const radioStationData = {
                name: radioStationName,
                walletAddress: recipientAddress,
            };
            await addDoc(collection(db, "radioStations"), radioStationData);
            setRadioStation(radioStationData);
        }
        setLoadingOperation(false); // Set loadingOperation to false when the operation is done
    }
    
    const loginRadioStation = async (address) => {
        setLoadingOperation(true); // Set loadingOperation to true at the start of the operation
        const q = query(
            collection(db, "radioStations"),
            where("walletAddress", "==", address)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await signUpRadioStation();
        } else {
            const radioStationData = snapshot.docs[0].data();
            setRadioStation(radioStationData);
        }
        setLoadingOperation(false); // Set loadingOperation to false when the operation is done
    }
    
    const createAttestation = async (post) => {
        if(!radioStation || !post || !post.participationType) {
            console.error('Invalid data, cannot create attestation');
            return;
        }
    
        const eas = new EAS(EASContractAddress);
        eas.connect(signer);
    
        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2); 
        const day = ("0" + date.getDate()).slice(-2);
        const formattedDate = year + month + day; 
    
        const schemaEncoder = new SchemaEncoder("string[] RadioStationName,uint64 Date,string TypeofParticipation");
        const encodedData = schemaEncoder.encodeData([
            { name: "RadioStationName", value: [radioStation.name], type: "string[]" },
            { name: "Date", value: Number(formattedDate), type: "uint64" },
            { name: "TypeofParticipation", value: post.participationType, type: "string" },
        ]);
    
        const schemaUID = "0x2a98ae55558be4e173402dbb3a2cbd38e1be1b815988cfb6faab22ffe6d45fc7";
    
        const tx = await eas.attest({
            schema: schemaUID,
            data: {
                recipient: post.walletAddress,
                expirationTime: 0,
                revocable: true,
                data: encodedData,
            },
        });
    
        const newAttestationUID = await tx.wait();
        console.log("New attestation UID:", newAttestationUID);
    }

    // New function for toggling details
    const toggleDetails = (id) => {
        setShowDetails(prevDetails => ({ ...prevDetails, [id]: !prevDetails[id] }));
    };

    // New function for generating EASscan URL
    const easScanUrl = (id) => `https://sepolia.easscan.org/attestation/view/${id}`;

    const getRecipientName = (recipientAddress) => {
        const user = users.find(user => user.walletAddress === recipientAddress);
        return user ? user.penName : 'Unknown Recipient';
    };
    
    const goToSettings = () => {
        setShowSettings(true);
    };

    const backToMain = () => {
        setShowSettings(false);
    };
    
    return (
        <div>
            <WalletConnector onConnect={onWalletConnect} style={{ position: 'absolute', top: 0, left: 0 }} />
            {loading || loadingOperation ? (  // Check for both loading and loadingOperation
                <div>Loading...</div>
            ) : (
                <div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)'}}>on AIR/CHAIN</h1>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                style={{ border: 'none', background: 'none', marginRight: '10px' }} 
                                onClick={() => window.open(`/radio-station/${recipientAddress}`, '_blank')}
                            >
                                <FontAwesomeIcon icon={faEye} style={{ fontSize: '12px', color: 'white', backgroundColor: 'grey', padding: '5px', borderRadius: '50%', marginTop: '0px' }} />
                            </button>
                            <SettingsDropdown
                                db={db}
                                radioStation={radioStation}
                                setRadioStation={setRadioStation}
                                backToMain={backToMain}
                            />
                        </div>
                    </div>
    
                    <RadioStationManagementNavBar
                        recipientAddress={recipientAddress}
                        radioStation={radioStation}
                        radioStationPosts={radioStationPosts}
                        attestations={attestations}
                    />
    
                    {radioStation && recipientAddress && radioStationPosts.length > 0 && (
                            <ListenerPosts
                                radioStation={radioStation}
                                recipientAddress={recipientAddress}
                                posts={radioStationPosts}
                                onSelectParticipationType={setSelectedParticipationType}
                                onCreateAttestation={createAttestation}
                            />
                        )
                    }
        
                    {!radioStation && recipientAddress &&
                        <SignUpRadioStation 
                            radioStationSignUpForm={radioStationSignUpForm} 
                            handleRadioStationNameChange={handleRadioStationNameChange} 
                            signUpRadioStation={signUpRadioStation}
                        />
                    }
    
                    {attestations.length > 0 && (
                        <IssuedAttestations 
                        attestations={attestations} 
                        getRecipientName={getRecipientName} 
                        toggleDetails={toggleDetails} 
                        showDetails={showDetails} 
                        easScanUrl={easScanUrl} />
                    )}
    
                    <FeedbackSection />
                </div>
            )}
        </div>
    );    
};

export default RadioStationManagement;
