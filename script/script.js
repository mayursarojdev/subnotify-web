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
$cardsSection.insertAdjacentHTML(
  "afterbegin",
  Components.noPostOnSubredditAlert()
);
const $fatalErrorAlert = document.querySelector(".fatal-error-alert");
const $noPostOnSubredditAlert = document.querySelector(
  ".noPostOnSubredditAlert"
);

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

  // generate urlString (Article source)
  // trim url
  const urlTrimLength = 105;
  const trimmedUrl =
    url.length > urlTrimLength ? url.slice(0, urlTrimLength) + "..." : url;

  // generate previewString
  // trim preview
  const previewTrimLength = 90;
  const trimmedPreview =
    preview.length > previewTrimLength
      ? preview.slice(0, previewTrimLength) + "..."
      : preview;

  // get text of text post
  let text = type === "Text" ? Reddit.rtjsonToText(post) : "";
  // trim length
  const textTrimLength = 550;
  if (text.length > textTrimLength) {
    text = text.slice(0, textTrimLength);
    text += "...";
  }
  // replace /n with <br>
  text = text.replace(/(\n)+/g, "<br/><br/>");

  const props = {
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

function showLoading() {
  $cardLoading.classList.remove("d-none");
  // track time of loading
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    // Still loading and no new post
    hideLoading();
    $fatalErrorAlert.classList.remove("d-none");
  }, loadingTimelimit);
}
function hideLoading() {
  $cardLoading.classList.add("d-none");
  clearTimeout(loadingTimeout);
}

async function fetchAndShowUpdate() {
  function postIsShowed(post) {
    return (showedPosts[subreddit] || []).includes(post.id);
  }

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

  // filter out showed post ids
  let postIdsToShow = postIds.filter((postId) => !postIsShowed(posts[postId]));

  // slice noOfPosts to show
  postIdsToShow = postIdsToShow.slice(0, noOfNewPostsToShow);
  // reverse the array so old posts are inserted first and new post cards are inserted over it
  postIdsToShow.reverse();

  // check if previous post cards exist
  const postCardsExists = $postCards.children.length > 0;

  // check if subreddit has posts
  const noPostOnSubreddit = !postCardsExists && !postIdsToShow.length;
  if (noPostOnSubreddit) $noPostOnSubredditAlert.classList.remove("d-none");

  if (postIdsToShow.length) {
    // new updates available
    showLoading();
    if (postCardsExists) {
      // fake loading card
      await sleep(2000);
    }
    // loop over all new updates and show in dom
    for (let postIdToShow of postIdsToShow) {
      const postToShow = posts[postIdToShow];
      // Insert into dom
      $postCards.insertAdjacentHTML("afterbegin", getPostTemplate(postToShow));

      // add it to showedPosts
      if (!showedPosts[subreddit]) showedPosts[subreddit] = [];
      showedPosts[subreddit].push(postToShow.id);
    }

    // remove no posts alert after postcard inserted
    $noPostOnSubredditAlert.classList.add("d-none");
  } else console.log("No new updates available");

  // remove loading
  hideLoading();
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
function fillSettingsInput(subreddit, sort, interval) {
  $subredditInput.value = subreddit;
  $sortSelect.value = sort;
  $intervalInput.value = interval;
}

validateAndSetLSSettings();

// state
let { subreddit, sort, interval } = getSettings();
let intervalTimer = null;
let loadingTimeout = null;
// For tracking posts
const showedPosts = {};

// app setting
const loadingTimelimit = 10000; // show fatalerror if loading time exceeds
const noOfNewPostsToShow = 3; // no of new posts to show at a time

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
fillSettingsInput(subreddit, sort, interval);

showLoading();
startUpdatesInterval();
