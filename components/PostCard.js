import React from 'react';

function PostCard({ post, onDelete }) {
  const postCardStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    margin: '10px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const postHeaderStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px', 
  };

  const postHeaderItemStyles = {
    marginBottom: '0', // New style to remove the bottom margin
  };

  const postContentStyles = {
    marginBottom: '5px',
    wordBreak: 'break-word', // Add this line
  };

  const deleteButtonStyles = {
    alignSelf: 'flex-end',
  };

  return (
    <div style={postCardStyles}>
      <div style={postHeaderStyles}>
        <p style={postHeaderItemStyles}>To: {post.station}</p>
        <p style={postHeaderItemStyles}>Topic: {post.postType}</p>
        <p style={postHeaderItemStyles}>Date: {post.timestamp ? new Intl.DateTimeFormat('en-US').format(post.timestamp.toDate()) : ''}</p>
      </div>
      <p style={postContentStyles}>{post.content}</p>
      <button style={deleteButtonStyles} onClick={() => onDelete(post)}>Delete</button>
    </div>
  );
}

export default PostCard;
