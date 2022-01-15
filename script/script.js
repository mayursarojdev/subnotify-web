import RedditAPI from "./RedditAPI.js";
import Components from "./components.js";
import {
  isValidSortType,
  isValidInterval,
  isValidSubredditName,
  settingsInputvalidation,
} from "./validation.js";

const Reddit = new RedditAPI();

// DOM
const $cardsSection = document.querySelector(".cards-section");
const $postCards = document.querySelector(".post-cards");

const $cardLoading = document.querySelector(".card-loading");
const $subredditInput = document.querySelector(".subreddit-input");
const $subredditNameValidation = document.querySelector(
  ".subredditNameValidation"
);
const $sortSelect = document.querySelector(".sort-select");
const $sortTypeValidation = document.querySelector(".sortTypeValidation");
const $intervalInput = document.querySelector(".interval-input");
const $intervalValidation = document.querySelector(".intervalValidation");
const $settingsForm = document.querySelector(".settings-form");

// Adding components to dom
$cardsSection.insertAdjacentHTML("afterbegin", Components.fatalErrorAlert());
const $fatalErrorAlert = document.querySelector(".fatal-error-alert");

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

  const subredditString = `<li class="fw-bold">🚩r/<a href="https://www.reddit.com/r/${subreddit}" target='blank'>${subreddit}</a></li>`;
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

  const props = {
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
  };
  return Components.postCard(props);
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
  // remove fatal-alert
  $fatalErrorAlert.classList.add("d-none");
}

async function startUpdatesInterval() {
  // Validate settings in localstorage
  validateAndSetLSSettings();

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
function validateAndSetLSSettings() {
  const defaultSettings = {
    subreddit: "technology",
    sort: "new",
    interval: 2, //in minutes
  };
  const { subreddit, sort, interval } = getSettings() || {};
  // validations
  const validatedSettings = {};
  // only checking if subreddit not empty to avoid extra Reddit api call
  if (!subreddit) validatedSettings.subreddit = defaultSettings.subreddit;
  else validatedSettings.subreddit = subreddit;

  if (!isValidSortType(sort).isValid)
    validatedSettings.sort = defaultSettings.sort;
  else validatedSettings.sort = sort;

  if (!isValidInterval(interval).isValid)
    validatedSettings.interval = defaultSettings.interval;
  else validatedSettings.interval = interval;

  updateSettings(validatedSettings);
}

validateAndSetLSSettings();

// state
let { subreddit, sort, interval } = getSettings();
let intervalTimer = null;
// For tracking posts
const showedPosts = {};

// Event listeners
// On update settings
$settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const subredditName = $settingsForm.subredditName.value;
  const sortType = $settingsForm.sortType.value;
  const updatesInterval = parseInt($settingsForm.updatesInterval.value);

  // validate user input settings
  const validationSuccess = await settingsInputvalidation(
    subredditName,
    sortType,
    updatesInterval,
    {
      $sortTypeValidation,
      $sortSelect,
      $intervalValidation,
      $intervalInput,
      $subredditNameValidation,
      $subredditInput,
    }
  );
  if (!validationSuccess) return;

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
    $fatalErrorAlert.classList.remove("d-none");
  }
}, 20000);

startUpdatesInterval();
