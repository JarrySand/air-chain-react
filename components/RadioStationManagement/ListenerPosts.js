import React from 'react';

const ListenerPosts = ({ posts, radioStation, recipientAddress, onSelectPost, onCreateAttestation }) => {
    if (!radioStation || !recipientAddress || !posts || posts.length === 0) {
        return null;
    }

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
                                        onChange={(e) => onSelectPost({ ...post, participationType: e.target.value })}>
                                        <option value="Selected post">Selected post</option>
                                        <option value="The best post of the day">The best post of the day</option>
                                        <option value="The best post of the year">The best post of the year</option>
                                    </select>
                                </td>
                                <td><button onClick={() => onCreateAttestation(post)}>Attest</button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ListenerPosts;
