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

    const fragId = createFragment.fragment.id;
    const fragLen = createFragment.fragment.size;
    const fragType = createFragment.fragment.type;
    const fragDate = new Date(createFragment.fragment.created).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

    // Each time a fragment is created, we'll create a new card to display the metadata
    const fragmentCard = document.createElement('div');
    fragmentCard.classList.add('card', 'bg-secondary', 'mb-3');
    fragmentCard.style.width = '18rem';
    const fragmentCardHeader = document.createElement('div');
    fragmentCardHeader.classList.add('card-header');
    fragmentCardHeader.innerText = 'Fragment Metadata';

    const fragmentCardBody = document.createElement('div');
    fragmentCardBody.classList.add('card-body');
    const fragmentCardTitle = document.createElement('h4');
    fragmentCardTitle.classList.add('card-title', 'fragmentType');
    fragmentCardTitle.innerText = `Content-Type: ${metadata.type}`;
    const fragmentCardSubtitle = document.createElement('h5');
    fragmentCardSubtitle.classList.add('card-subtitle', 'mb-2', 'fragmentSize');
    fragmentCardSubtitle.innerText = `Size: ${metadata.size} bytes`;
    const fragmentCardText = document.createElement('p');
    fragmentCardText.classList.add('card-text');
    fragmentCardText.innerText = `Created on ${metadata.created}`;
    fragmentCardBody.appendChild(fragmentCardTitle);
    fragmentCardBody.appendChild(fragmentCardSubtitle);
    fragmentCardBody.appendChild(fragmentCardText);
    fragmentCard.appendChild(fragmentCardHeader);
    fragmentCard.appendChild(fragmentCardBody);
    document.querySelector('#fragments').appendChild(fragmentCard);
    // add id
    const fragmentId = document.createElement('p');
    fragmentId.classList.add('card-text', 'fragmentId');
    fragmentId.innerText = `Fragment ID: ${metadata.id}`;
    fragmentCardBody.appendChild(fragmentId);
    fragmentCard.appendChild(fragmentCardBody);
    document.querySelector('#fragments').appendChild(fragmentCard);

    const fragmentData = await getUserFragmentById(user, fragId);
    console.log(fragmentData);
    fragmentCardText.innerText = 'Data: ' + fragmentData;
  }
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
