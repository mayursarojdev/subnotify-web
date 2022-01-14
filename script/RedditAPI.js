export default class RedditAPI {
  constructor() {
    this.APIBaseUrl = "https://gateway.reddit.com/desktopapi/v1";
    this.APIBaseParams =
      "rtj=only&redditWebClient=web2x&app=web2x-client-production&";
  }

  _objToUrlParams(obj) {
    let urlParams = ``;
    for (let key in obj) {
      urlParams += `${key}=${obj[key]}&`;
    }

    return urlParams;
  }

  _genSubredditAPIUrl(subredditName, params) {
    const subredditBaseUrl = `${this.APIBaseUrl}/subreddits`;
    let subredditAPIUrl = `${subredditBaseUrl}/${subredditName}?${
      this.APIBaseParams
    }${this._objToUrlParams(params)}`;

    return subredditAPIUrl;
  }

  // Public methods
  async fetchSubredditPosts(subredditName, params) {
    const { sort } = params;
    const subredditAPIUrl = this._genSubredditAPIUrl(subredditName, params);

    // Make api call
    try {
      const postsResp = await axios.get(subredditAPIUrl);
      return postsResp.data;
    } catch (error) {
      return {};
    }
  }

  filterOutPromotionalPosts(postIds, posts) {
    // removing ads, promoted posts
    // filtering ids array
    let filteredPostIds = postIds.filter((id) => id.length < 15);

    // filtering posts object
    // convert posts object into entries array, [0: key, 1: value]
    const postsEntries = Object.entries(posts);
    const filteredPostsEntries = postsEntries.filter((entry) =>
      filteredPostIds.includes(entry[0])
    );
    // convert entries array back to obj
    let filteredPosts = Object.fromEntries(filteredPostsEntries);

    return { postIds: filteredPostIds, posts: filteredPosts };
  }

  filterOutPinnedPosts(postIds, posts) {
    // convert posts object into entries array, [0: key, 1: value]
    const postsEntries = Object.entries(posts);
    const pinnedPostIds = [];
    const filteredPostsEntries = [];

    postsEntries.forEach((entry) => {
      if (entry[1].isStickied) pinnedPostIds.push(entry[0]);
      else filteredPostsEntries.push(entry);
    });

    // convert entries array back to obj
    let filteredPosts = Object.fromEntries(filteredPostsEntries);

    // Remove all postIds that belong to pinned posts
    const filteredPostIds = postIds.filter((postId) => {
      return !pinnedPostIds.includes(postId);
    });

    return { postIds: filteredPostIds, posts: filteredPosts };
  }

  async fetchSubredditInfo(subredditName) {
    const fetchedPosts = await this.fetchSubredditPosts(subredditName, {
      limit: 1,
    });
    const subredditInfo = fetchedPosts.subredditAboutInfo;
    if (subredditInfo != undefined) {
      // returning the nested object
      return subredditInfo[Object.keys(subredditInfo)[0]];
    } else {
      return null;
    }
  }

  async isValidSubreddit(subredditName) {
    return (await this.fetchSubredditInfo(subredditName)) ? true : false;
  }
}
