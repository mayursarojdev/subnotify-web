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

  postCard(props) {
    const {
      preview,
      title,
      subredditString,
      OPString,
      typeString,
      votesString,
      urlString,
      previewString,
      textString,
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

    <div class="card-right p-4 py-3 ${!preview ? "w-100" : ""}">
      <div class="card-body">
        <!-- post title -->
        <h5 class="card-title fw-bold">
          ${title}
        </h5>

        <!-- post info -->
        <ul>
          ${subredditString}
          ${OPString}
          ${typeString}
          ${votesString}
          ${urlString}
          ${previewString}
        </ul>

        <!-- if post type is text show below -->
       <p class="card-text">
        ${textString}
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
