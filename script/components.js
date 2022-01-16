export default {
  fatalErrorAlert() {
    return `<div
    class="alert alert-danger card p-5 fatal-error-alert d-none shadow-sm"
    role="alert"
  >
    <h4 class="alert-heading pb-2">☠️Oops!</h4>
    <p>Some error occured, We couldnt fetch posts from reddit.</p>
    <p>Please try again after some time.</p>
  </div>`;
  },
  noPostOnSubredditAlert() {
    return `<div
    class="alert alert-warning card p-5 noPostOnSubredditAlert d-none shadow-sm"
    role="alert"
  >
    <h4 class="alert-heading pb-2">
      ⚠️No posts are currently available on this subreddit
    </h4>
    <p>All new updates will be shown after they are available.</p>
  </div>`;
  },

  postCard(props) {
    const {
      title,
      subreddit,
      author,
      type,
      score,
      url,
      trimmedUrl,
      isMediaPost,
      preview,
      trimmedPreview,
      text,
      permalink,
    } = props;
    return `<div class="card shadow-sm overflow-hidden p-0 mb-4 d-flex flex-row">
    <div class="card-left d-none ${preview ? "d-sm-block" : ""} ">
    <a
      href="${preview}"
      target="blank"
    >
      <img
        src="${preview}"
        class="card-img-top"
        alt="Post thumbnail"
        title="Click to preview the thumbnail"
    /></a>
    </div>

    <div class="card-right d-flex p-4 py-3 ${!preview ? "w-100" : ""}">
      <div class="card-body d-flex flex-column justify-content-around">
        <!-- post title -->
        <h5 class="card-title fw-bold">
          ${title}
        </h5>

        <!-- post info -->
        <ul>
        <li class="fw-bold">🚩r/<a href="https://www.reddit.com/r/${subreddit}" target='blank'>${subreddit}</a></li>

        <li>🙂<span class="fw-bold">OP: </span><a href="https://www.reddit.com/u/${author}" target='blank'>${author}</a></li>

        ${type ? `<li>⚡<span class="fw-bold">Type: </span>${type}</li>` : ""}

        <li>⬆️<span class="fw-bold">Votes: </span>${score}</li>

        ${
          url && !isMediaPost
            ? `<li>
        🌐<span class="fw-bold">Article:</span>
        <a
          href="${url}"
          target="blank"
          >${trimmedUrl}</a
        >
      </li>`
            : ""
        }

        ${
          preview && isMediaPost
            ? `<li>🖼️<span class="fw-bold">Preview: </span><a
            href="${preview}"
            target="blank"
            >${trimmedPreview}</a
          ></li>`
            : ""
        }
        </ul>

        <!-- if post type is text show below -->
       <p class="card-text pt-2 m-0">
        ${text}
      </p>

        <!-- call to action -->
        <div class="card-links pt-4">
          <a
            href="${permalink}"
            class="card-link btn btn-sm btn-primary fw-bold"
            target="blank"
            >🔴 View on reddit</a
          >
          <a
            href="#"
            class="save-post card-link btn btn-sm btn-outline-info fw-bold"
            >🔖 Save post</a
          >
        </div>
      </div>
    </div>
  </div>`;
  },
};
