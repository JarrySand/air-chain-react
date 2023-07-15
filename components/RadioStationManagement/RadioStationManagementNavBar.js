import React from 'react';

const RadioStationManagementNavBar = ({recipientAddress, radioStation, radioStationPosts, attestations}) => {
    return (
        <nav>
            <ul>
                <li id="navFlexContainerLi">
                <div className="nav-flex-container" id="navFlexContainer">
                    {recipientAddress && 
                    <>
                        <div>Your Address:</div>
                        <div title={recipientAddress}>{recipientAddress}</div>
                    </>
                    }
                    {radioStation && radioStation.name && 
                    <>
                        <div>Station name:</div>
                        <div>{radioStation.name}</div>
                    </>
                    }
                </div>
                </li>
                {recipientAddress && radioStationPosts.length > 0 &&
                <li><a href="#listenerPosts">Listener posts</a></li>
                }
                {recipientAddress && attestations.length > 0 && 
                <li><a href="#issuedAttestations">Issued attestations</a></li>
                }
                {recipientAddress && 
                <>
                    <li><a href="#settings">Settings</a></li>
                    <li><a href="#feedback">Feedback</a></li>
                </>
                }
            </ul>
        </nav>
    );
}

export default RadioStationManagementNavBar;