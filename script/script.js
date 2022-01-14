import RedditAPI from "./RedditAPI.js";
import Components from "./components.js";

const Reddit = new RedditAPI();

// DOM
const $cardsSection = document.querySelector(".cards-section");
const $postCards = document.querySelector(".post-cards");
const $cardLoading = document.querySelector(".card-loading");
const $subredditInput = document.querySelector(".subreddit-input");
const $sortSelect = document.querySelector(".sort-select");
const $intervalInput = document.querySelector(".interval-input");
const $settingsForm = document.querySelector(".settings-form");

function getPostTemplate(post) {
  // extract details
  const { author, score, title, permalink } = post;
  // Other details
  let type = (post.media || {}).type || "link";
  const url = (post.source || {}).url || "";
  const preview = (post.preview || {}).url || "";

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

  // generate urlString (Article source)
  // trim url
  const urlTrimLength = 105;
  const trimmedUrl =
    url.length > urlTrimLength ? url.slice(0, urlTrimLength) + "..." : url;
  const urlString =
    url && !isMediaPost
      ? `<li>
  🌐<span class="fw-bold">Article:</span>
  <a
    href="${url}"
    target="blank"
    >${trimmedUrl}</a
  >
</li>`
      : "";

  // generate previewString
  // trim preview
  const previewTrimLength = 90;
  const trimmedPreview =
    preview.length > previewTrimLength
      ? preview.slice(0, previewTrimLength) + "..."
      : preview;
  const previewString =
    preview && isMediaPost
      ? `<li>🖼️<span class="fw-bold">Preview: </span><a
      href="${preview}"
      target="blank"
      >${trimmedPreview}</a
    ></li>`
      : "";

  // get text of text post
  let textString = type === "Text" ? Reddit.rtjsonToText(post) : "";
  // trim length
  const textTrimLength = 550;
  if (textString.length > textTrimLength) {
    textString = textString.slice(0, textTrimLength);
    textString += "...";
  }
  // replace /n with <br>
  textString = textString.replace(/(\n)+/g, "<br/><br/>");

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
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

async function fetchAndShowUpdate() {
  // fetch post
  const subPosts = await Reddit.fetchSubredditPosts(subreddit, {
    sort,
    limit: 5,
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

  // check if it is new post
  const alreadyShowed = (showedPosts[subreddit] || []).includes(postToShow.id);

  if (!alreadyShowed) {
    $cardLoading.classList.remove("d-none");

    if ($postCards.children.length > 0) {
      // fake loading card
      await sleep(2000);
    }
    // Insert into dom
    $postCards.insertAdjacentHTML("afterbegin", getPostTemplate(postToShow));

    // add it to showedPosts
    if (!showedPosts[subreddit]) showedPosts[subreddit] = [];
    showedPosts[subreddit].push(postToShow.id);
  } else console.log("No new updates available");

  // remove loading
  $cardLoading.classList.add("d-none");
}

async function startUpdatesInterval() {
  // To clear all previous intervals
  clearInterval(intervalTimer);
  await fetchAndShowUpdate();

  intervalTimer = setInterval(async () => {
    await fetchAndShowUpdate();
  }, interval * 60000);
}

// setting functions
function updateSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}
function getSettings() {
  return JSON.parse(localStorage.getItem("settings"));
}
function settingsUpdateSuccess() {
  // TODO: Success toast
  console.log("Settings update successful");
}

// set default settings if not set
if (!getSettings()) {
  const defaultSettings = {
    subreddit: "technology",
    sort: "new",
    interval: 2, //in minutes
  };
  updateSettings(defaultSettings);
}

// state
let { subreddit, sort, interval } = getSettings();
let intervalTimer = null;
// For tracking posts
const showedPosts = {};

// Event listeners
// On update settings
$settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const subredditName = $settingsForm.subredditName.value;
  const sortType = $settingsForm.sortType.value;
  const updatesInterval = parseInt($settingsForm.updatesInterval.value);

  // TODO: validation

  const newSettings = {
    subreddit: subredditName,
    sort: sortType,
    interval: updatesInterval, //in minutes
  };
  updateSettings(newSettings);

  // update state
  subreddit = subredditName;
  sort = sortType;
  interval = updatesInterval;

  // settings update successful
  settingsUpdateSuccess();

  // start new setInterval
  startUpdatesInterval();
});

//update settings input dom with saved settings
$subredditInput.value = subreddit;
$sortSelect.value = sort;
$intervalInput.value = interval;

// Check if reddit response error
setTimeout(() => {
  if (
    !$postCards.children.length &&
    !$cardLoading.classList.contains("d-none")
  ) {
    // Still loading and no post cards on page
    $cardLoading.classList.add("d-none");
    $postCards.insertAdjacentHTML("afterbegin", Components.fatalErrorAlert());
  }
}, 10000);

startUpdatesInterval();
