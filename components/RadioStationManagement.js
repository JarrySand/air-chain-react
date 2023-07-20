import React, { useState, useEffect } from 'react';
import { useSigner, useAddress } from "@thirdweb-dev/react";
import { ethers } from 'ethers';
import { db } from '../utils/firebase';
import { collection, addDoc, where, query, getDocs, updateDoc, onSnapshot, doc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { getAttestationsByAttester } from '../utils/easscan';
import RadioStationManagementNavBar from './RadioStationManagement/NavBar';
import SettingsDropdown from './RadioStationManagement/SettingDropdown';
import WalletConnector from './General/WalletConnector';
import ListenerPosts from './RadioStationManagement/ListenerPosts';
import FeedbackSection from './General/FeedbackSection';
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
          setRecipientAddress(checksumAddress);
      
          console.log('Set signer to: ', signer);
          console.log('Set recipient address to: ', checksumAddress);
      
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        } finally {
          setLoading(false); 
        }
    };
      
    const signUpRadioStation = async () => {
        setLoadingOperation(true); 
        const radioStationName = radioStationSignUpForm.name;
        if (radioStationName) {
            const radioStationData = {
                name: radioStationName,
                walletAddress: recipientAddress,
            };
            await addDoc(collection(db, "radioStations"), radioStationData);
            setRadioStation(radioStationData);
        }
        setLoadingOperation(false); 
    }
    
    const loginRadioStation = async (address) => {
        setLoadingOperation(true); 
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
        setLoadingOperation(false); 
    }

    const toggleDetails = (id) => {
        setShowDetails(prevDetails => ({ ...prevDetails, [id]: !prevDetails[id] }));
    };

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
            {loading || loadingOperation ? (  
                <div>Loading...</div>
            ) : (
                <div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)'}}>on AIR/CHAIN</h1>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <SettingsDropdown
                                db={db}
                                radioStation={radioStation}
                                setRadioStation={setRadioStation}
                                backToMain={backToMain}
                                recipientAddress={recipientAddress}
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
                            signer={signer}
                            EASContractAddress={EASContractAddress}
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
