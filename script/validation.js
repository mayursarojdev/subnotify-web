import RedditAPI from "./RedditAPI.js";
const Reddit = new RedditAPI();

// validation functions
function isValidSortType(sortType) {
  const validSortTypes = ["new", "hot", "rising"];
  const isValid = validSortTypes.includes(sortType);
  let msg;
  if (!isValid) msg = "Invalid sort type";

  return { isValid, msg };
}
function isValidInterval(interval) {
  const isValid = !isNaN(interval) && interval >= 1;
  let msg = "Invalid interval time";

  return { isValid, msg };
}
async function isValidSubredditName(subredditName) {
  let msg;
  let isValid;
  const isEmpty = subredditName === "";
  if (isEmpty) {
    isValid = false;
    msg = "Field cannot be empty!";
    return { isValid, msg };
  }
  // if field not empty check if subreddit exists
  isValid = await Reddit.isValidSubreddit(subredditName);
  if (!isValid) msg = "Invalid subreddit name";

  return { isValid, msg };
}
async function settingsInputvalidation(
  subredditName,
  sortType,
  updatesInterval,
  inputDOM
) {
  let {
    $sortTypeValidation,
    $sortSelect,
    $intervalValidation,
    $intervalInput,
    $subredditNameValidation,
    $subredditInput,
  } = inputDOM;
  // clear all msg of previous validation
  $sortSelect.classList.remove("is-invalid");
  $intervalInput.classList.remove("is-invalid");
  $subredditInput.classList.remove("is-invalid");

  // sort validation
  const { isValid: isValidSort, msg: sortValidationMsg } =
    isValidSortType(sortType);
  if (!isValidSort) {
    $sortTypeValidation.innerText = sortValidationMsg;
    $sortSelect.classList.add("is-invalid");
    return false;
  }
  // interval validation
  const { isValid: isValidIntervalTime, msg: intervalValidationMsg } =
    isValidInterval(updatesInterval);
  if (!isValidIntervalTime) {
    $intervalValidation.innerText = intervalValidationMsg;
    $intervalInput.classList.add("is-invalid");
    return false;
  }
  // subreddit validation
  const { isValid: isValidSubreddit, msg: subValidationMsg } =
    await isValidSubredditName(subredditName);
  if (!isValidSubreddit) {
    $subredditNameValidation.innerText = subValidationMsg;
    $subredditInput.classList.add("is-invalid");
    return false;
  }

  return true;
}

export {
  isValidSortType,
  isValidInterval,
  isValidSubredditName,
  settingsInputvalidation,
};
