import React from "react";

const PostForm = ({ user, radioStation, postForm, setPostForm, createPost, postTypeOptions }) => {
  return (
    <>
      <h2 id="makeAPost"> Welcome, {user.penName}. Let's make a post for {radioStation.name}</h2>
      <form onSubmit={createPost} className="form">
        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="postType">Choose a type of post:</label>
            <div className="select-container">
              <select
                id="postType"
                value={postForm.postType}
                required
                onChange={(e) =>
                  setPostForm({ ...postForm, postType: e.target.value })
                }
              >
                <option value="">Select a post type</option>
                {postTypeOptions.map((option, index) => (
                  <option key={index} value={option.name || option}>
                    {option.name || option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="postContent">Post content:</label>
          <textarea
            id="postContent"
            value={postForm.content}
            className="textarea"
            required
            onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
            style={{ width: "100%", height: "200px" }}  // Inline style for demonstration
          />
        </div>
        <button type="submit" className="submit-button">Submit Post</button>
      </form>
    </>
  );
};

export default PostForm;
