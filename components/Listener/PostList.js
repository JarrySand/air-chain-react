import React, { useState } from 'react';
import PostCard from './PostCard';

function PostList({ posts, onDelete }) {
  const [visiblePosts, setVisiblePosts] = useState(3); // Default is 4

  const handleShowMore = () => {
    setVisiblePosts(visiblePosts + 3); // Show 4 more posts when "show more" is clicked
  };

  return (
    <div>
      {posts.slice(0, visiblePosts).map((post, index) => (
        <PostCard key={index} post={post} onDelete={onDelete} />
      ))}
      {visiblePosts < posts.length && ( // Only display "show more" button if there are more posts to show
        <button onClick={handleShowMore}>Show more</button>
      )}
    </div>
  );
}

export default PostList;

