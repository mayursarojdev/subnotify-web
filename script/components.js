export default {
  fatalErrorAlert() {
    return `<div
    class="alert alert-danger card p-5 fatal-error-alert"
    role="alert"
  >
    <h4 class="alert-heading pb-2">☠️Oops!</h4>
    <p>Some error occured, We couldnt fetch posts from reddit.</p>
    <p>Please try again after some time.</p>
  </div>`;
  },
};
