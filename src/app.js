// src/app.js

import { Auth, getUser } from './auth';
import { getFragmentOP, getUserFragments, postFragment, deleteFragment } from './api';

// Get our UI elements
// Auth Elements (login, logout, etc)
const loginBtn = document.querySelector('#login');
const logoutBtn = document.querySelector('#logout');
const userSection = document.querySelector('#user');

// CREATE: Fragment form and fragment metadata elements
const fragmentForm = document.querySelector('#fragment-form'); // form where we POST fragment data
const fragmentInput = document.querySelector('#fragment-data-input'); // ENTER fragment data here
const fragmentType = document.querySelector('#create-fragment-type'); // SELECT fragment type here

// CONVERT: Convert Form and Fragment ID
const convertForm = document.querySelector('#convert-form');
const convertFragmentIdInput = document.querySelector('#convert-fragment-id-input'); // ENTER fragment id here
const convertFragmentType = document.querySelector('#convert-fragment-type'); // SELECT fragment type here

// DELETE: Delete a fragment of a given fragment ID
const deleteForm = document.querySelector('#delete-form');
const deleteFragmentIdInput = document.querySelector('#delete-fragment-id-input');

async function init() {
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  }; // See if we're signed in (i.e., we'll have a `user` object)

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();

  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }
  userSection.hidden = false; // Show the user's username
  console.log('User is signed in', { user });
  userSection.querySelector('.username').innerText = user.username;

  loginBtn.disabled = true;

  // POST a fragment to the API
  fragmentForm.onsubmit = async (e) => {
    console.log('=> From APP JS: fragmentForm.onsubmit');
    e.preventDefault();
    await postFragment(user, fragmentInput.value, fragmentType.value);
    readFragmentsIntoCard();
  };
  // CONVERT a fragment
  convertForm.onsubmit = (e) => {
    e.preventDefault();

    const result = getFragmentOP(
      user,
      convertFragmentIdInput.value,
      convertFragmentType.value,
      false
    );
    console.log(result);
  };

  // DELETE a fragment
  deleteForm.onsubmit = (e) => {
    e.preventDefault();
    deleteFragment(user, deleteFragmentIdInput.value);
    readFragmentsIntoCard();
    // clear
    deleteFragmentIdInput.value = '';
  };

  function readFragmentsIntoCard() {
    const listOfFragments = getUserFragments(user, true);
    listOfFragments.then((data) => {
      const fragmentCards = document.querySelector('#fragmentCards');
      fragmentCards.innerHTML = '';
      data.fragments.forEach((fragment) => {
        const fragmentDiv = document.createElement('div');

        fragmentDiv.style =
          'border: 1px solid black; margin: 10px; padding: 10px; width: 500px; overflow: scroll; display: inline-block; vertical-align: top; text-align: left; background-color: #f2f2f2; border-radius: 5px; color: #000000;';

        fragmentDiv.innerHTML = `Fragment ID:  ${fragment.id} <br> Fragment Type: ${fragment.type}  <br> Fragment Created: ${fragment.created} <br>  Fragment Updated: ${fragment.updated} <br> Fragment Size : ${fragment.size}`;

        fragmentCards.appendChild(fragmentDiv);
      });
    });
  }
  readFragmentsIntoCard();
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
