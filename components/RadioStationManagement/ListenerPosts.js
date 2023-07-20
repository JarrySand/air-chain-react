import React from 'react';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';

const ListenerPosts = ({ posts, radioStation, recipientAddress, signer, EASContractAddress }) => {
    if (!radioStation || !recipientAddress || !posts || posts.length === 0) {
        return null;
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

    const handleSelectPost = (post, participationType) => {
        const selectedPost = { ...post, participationType };
        createAttestation(selectedPost);
    };

    return (
        <div>
            <h2 id="listenerPosts">Listener Posts for {radioStation.name}:</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Pen Name</th>
                            <th>Type</th>
                            <th>Content</th>
                            <th>Timestamp</th>
                            <th>Participation Type</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post, index) =>
                            <tr key={`post-${index}`}>
                                <td>{post.penName}</td>
                                <td>{post.postType}</td>
                                <td>{post.content}</td>
                                <td>{post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleDateString('en-GB') : ''}</td>
                                <td>
                                    <select id="participationType" name="participationType"
                                        defaultValue="Selected post"
                                        onChange={(e) => handleSelectPost(post, e.target.value)}>
                                        <option value="Selected post">Selected post</option>
                                        <option value="The best post of the day">The best post of the day</option>
                                        <option value="The best post of the year">The best post of the year</option>
                                    </select>
                                </td>
                                <td><button onClick={() => handleSelectPost(post, "Selected post")}>Attest</button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ListenerPosts;
