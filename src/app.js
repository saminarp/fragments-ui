// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, getUserFragmentById, postFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');

  const fragmentForm = document.querySelector('#fragmentForm');
  const fragmentTextArea = document.querySelector('#fragment-content');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();

  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });
  // Update the UI to welcome the user
  userSection.hidden = false;
  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;
  // Disable the Login button
  loginBtn.disabled = true;
  // Do an authenticated request to the fragments API server and log the result
  getUserFragments(user);

  fragmentForm.addEventListener('submit', fragmentsHandler);

  async function fragmentsHandler(event) {
    event.preventDefault();
    const createFragment = await postFragment(user, 'text/plain', fragmentTextArea.value);
    console.log({ data: createFragment.fragments.fragment });

    const fragId = createFragment.fragments.fragment.id;
    const fragLen = createFragment.fragments.fragment.size;
    const fragType = createFragment.fragments.fragment.type;
    const fragDate = new Date(createFragment.fragments.fragment.created).toLocaleDateString(
      'en-CA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
    /* Fragment metadata to work with in UI */
    const metadata = {
      id: fragId,
      size: fragLen,
      type: fragType,
      created: fragDate,
    };
    console.log(
      `Fragment ${metadata.id} created on ${metadata.created} with ${metadata.size} bytes of ${metadata.type} data`
    );
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
