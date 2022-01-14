import RedditAPI from "./RedditAPI.js";
const Reddit = new RedditAPI();

// DOM
const $cardsSection = document.querySelector(".cards-section");
const $subredditInput = document.querySelector(".subreddit-input");
const $sortSelect = document.querySelector(".sort-select");
const $intervalInput = document.querySelector(".interval-input");

function getPostTemplate(post) {
  // extract details
  const { author, score, title, permalink } = post;
  // Other details
  let type = (post.media || {}).type || "link";
  const url = (post.source || {}).url;
  const preview = (post.preview || {}).url;

  // meaningful type rename
  if (type === "rtjson") type = "text";
  // capitalize first letter of type
  type = type.charAt(0).toUpperCase() + type.slice(1);
  // check if post contains media
  const isMediaPost =
    type === "Image" || type === "Video" || type === "Gallery" ? true : false;

  const OPString = `<li>🙂<span class="fw-bold">OP: </span><a href="https://www.reddit.com/u/${author}" target='blank'>${author}</a></li>`;
  let typeString = type
    ? `<li>⚡<span class="fw-bold">Type: </span>${type}</li>`
    : "";
  const votesString = `<li>⬆️<span class="fw-bold">Votes: </span>${score}</li>`;
  const urlString =
    url && !isMediaPost
      ? `<li>
  🌐<span class="fw-bold">Article:</span>
  <a
    href="${url}"
    target="blank"
    >${url.slice(0, 103) + "..."}</a
  >
</li>`
      : "";

  // generate preview only if preview available
  const previewString =
    preview && isMediaPost
      ? `<li>🖼️<span class="fw-bold">Preview: </span>${preview}</li>`
      : "";

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

  <div class="card-right p-4 py-3">
    <div class="card-body">
      <!-- post title -->
      <h5 class="card-title fw-bold">
        ${title}
      </h5>

      <!-- post info -->
      <ul>
        ${OPString}
        ${typeString}
        ${votesString}
        ${urlString}
        ${previewString}
      </ul>

      <!-- if post type is text show below -->
      <!-- <p class="card-text">
      Some quick example text to build on the card title and make up
      the bulk of the card's content.
    </p> -->

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
}
async function fetchAndShowUpdate() {
  // fetch post
  const subPosts = await Reddit.fetchSubredditPosts(subreddit, {
    sort,
  });

  // remove promotional posts
  const filteredPromotional = Reddit.filterOutPromotionalPosts(
    subPosts.postIds,
    subPosts.posts
  );
  //remove pinned posts
  const { postIds, posts } = Reddit.filterOutPinnedPosts(
    filteredPromotional.postIds,
    filteredPromotional.posts
  );
  //select first post
  const postToShow = posts[postIds[0]];

  // TODO: check if it is new post
  const alreadyShowed = (showedPosts[subreddit] || []).includes(postToShow.id);

  if (!alreadyShowed) {
    // Insert into dom
    $cardsSection.insertAdjacentHTML("afterbegin", getPostTemplate(postToShow));

    // add it to showedPosts
    if (!showedPosts[subreddit]) showedPosts[subreddit] = [];
    showedPosts[subreddit].push(postToShow.id);
  }else console.log('No new updates available');
}
async function startUpdatesInterval() {
  await fetchAndShowUpdate();

  setInterval(async () => {
    await fetchAndShowUpdate();
  }, interval * 60000);
}

// set default settings if not set
if (!localStorage.getItem("settings")) {
  const defaultSettings = JSON.stringify({
    subreddit: "technology",
    sort: "new",
    interval: 2, //in minutes
  });
  localStorage.setItem("settings", defaultSettings);
}

const { subreddit, sort, interval } = JSON.parse(
  localStorage.getItem("settings")
);

//update settings input dom with saved settings
$subredditInput.value = subreddit;
$sortSelect.value = sort;
$intervalInput.value = interval;

const showedPosts = {};

startUpdatesInterval();
