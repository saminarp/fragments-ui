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

  function readFragmentsIntoCard() {
    const listOfFragments = getUserFragments(user, true);
    listOfFragments.then((data) => {
      const fragmentCards = document.querySelector('#fragmentCards');
      fragmentCards.innerHTML = '';
      data.fragments.forEach((fragment) => {
        const fragmentDiv = document.createElement('div');

        fragmentDiv.style =
          'border: 1px solid black; margin: 10px; padding: 10px; width: 100%; overflow: scroll; display: inline-block; vertical-align: top; text-align: left; background-color: #f2f2f2; border-radius: 5px; color: #000000;';
        // FRAGMENT ID
        const fragmentId = document.createElement('span');
        fragmentId.innerText = `Fragment ID: `;

        // create span element in p element to display fragment id
        const fragmentIdBadge = document.createElement('span');
        fragmentIdBadge.className = 'badge badge-secondary';
        fragmentIdBadge.innerText = fragment.id;
        fragmentIdBadge.style = 'padding: 4px; font-size: .9rem;';
        fragmentId.appendChild(fragmentIdBadge);
        fragmentDiv.appendChild(fragmentId);
        // put br
        fragmentDiv.appendChild(document.createElement('br'));
        const fragmentType = document.createElement('span');
        fragmentType.innerText = `Fragment Type: `;
        const fragmentTypeBadge = document.createElement('span');
        if (fragment.type == 'text/plain') {
          fragmentTypeBadge.className = 'badge badge-secondary ';
        } else if (fragment.type.includes('markdown')) {
          fragmentTypeBadge.className = 'badge badge-primary';
        } else if (fragment.type.includes('html')) {
          fragmentTypeBadge.className = 'badge badge-danger';
        } else if (fragment.type.includes('json')) {
          fragmentTypeBadge.className = 'badge badge-warning';
        } else if (fragment.type.includes('image')) {
          fragmentTypeBadge.className = 'badge badge-success';
        } else {
          fragmentTypeBadge.className = 'badge badge-light';
        }
        fragmentTypeBadge.innerText = fragment.type;
        fragmentTypeBadge.style = 'padding: 4px; font-size: .9rem;';
        fragmentType.appendChild(fragmentTypeBadge);
        fragmentDiv.appendChild(fragmentType);

        // put br
        fragmentDiv.appendChild(document.createElement('br'));
        // FRAGMENT SIZE
        const fragmentSize = document.createElement('span');
        fragmentSize.innerText = `Fragment Size: `;
        const fragmentSizeBadge = document.createElement('span');
        fragmentSizeBadge.className = 'badge badge-secondary';
        fragmentSizeBadge.innerText = fragment.size;
        fragmentSize.appendChild(fragmentSizeBadge);
        fragmentDiv.appendChild(fragmentSize);
        // put br
        fragmentDiv.appendChild(document.createElement('br'));

        // created date
        // turn date into readable format
        const createdDate = new Date(fragment.created);
        const createdDateFormatted = createdDate.toLocaleString();
        const createdDateSpan = document.createElement('span');
        createdDateSpan.innerText = `Created: ${createdDateFormatted} `;
        fragmentDiv.appendChild(createdDateSpan);
        // put br
        fragmentDiv.appendChild(document.createElement('br'));

        // last modified date
        // turn date into readable format
        const lastModifiedDate = new Date(fragment.updated);
        const lastModifiedDateFormatted = lastModifiedDate.toLocaleString();
        const lastModifiedDateSpan = document.createElement('span');
        lastModifiedDateSpan.innerText = `Last Modified: ${lastModifiedDateFormatted} `;
        fragmentDiv.appendChild(lastModifiedDateSpan);
        // put br
        fragmentDiv.appendChild(document.createElement('br'));

        // add delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.innerText = 'Delete';
        deleteButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
        deleteButton.onclick = async () => {
          await deleteFragment(user, fragment.id);
          readFragmentsIntoCard();
        };
        fragmentDiv.appendChild(deleteButton);

        // add convert button
        const convertButton = document.createElement('button');
        convertButton.className = 'btn btn-primary';
        convertButton.innerText = 'Convert';
        convertButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
        convertButton.onclick = async () => {
          // provide dropdown menu to select type to convert to
          // types are text/plain, text/markdown, text/html, application/json,
          const convertFragmentType = document.createElement('select');
          convertFragmentType.className = 'form-control';
          convertFragmentType.style = 'width: 100%; margin: 7px; padding: 7px; font-size: .9rem;';
          convertFragmentType.id = 'convertFragmentType';
          const convertFragmentTypeOption1 = document.createElement('option');
          convertFragmentTypeOption1.value = '.txt';
          convertFragmentTypeOption1.innerText = 'text/plain';

          const convertFragmentTypeOption2 = document.createElement('option');
          convertFragmentTypeOption2.value = '.md';
          convertFragmentTypeOption2.innerText = 'text/markdown';

          const convertFragmentTypeOption3 = document.createElement('option');
          convertFragmentTypeOption3.value = '.html';
          convertFragmentTypeOption3.innerText = 'text/html';

          const convertFragmentTypeOption4 = document.createElement('option');
          convertFragmentTypeOption4.value = '.json';
          convertFragmentTypeOption4.innerText = 'application/json';

          convertFragmentType.appendChild(convertFragmentTypeOption1);
          convertFragmentType.appendChild(convertFragmentTypeOption2);
          convertFragmentType.appendChild(convertFragmentTypeOption3);
          convertFragmentType.appendChild(convertFragmentTypeOption4);

          fragmentDiv.appendChild(convertFragmentType);

          // add convert button
          const convertButton = document.createElement('button');
          convertButton.className = 'btn btn-primary';
          convertButton.innerText = 'Convert';
          convertButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
          convertButton.onclick = async () => {
            let convertedData = await getFragmentOP(user, fragment.id, convertFragmentType.value);
            // display converted data in a popup
            // if converteddata is undefined, then set error message to convertedData
            if (convertedData === undefined) {
              convertedData = 'Error: Could not convert fragment - Unsupported conversion type';
            }

            const convertedDataPopup = document.createElement('div');
            convertedDataPopup.className = 'card';
            convertedDataPopup.style = 'width: 100%; margin: 7px; padding: 7px; font-size: .9rem;';
            convertedDataPopup.innerText = convertedData;
            fragmentDiv.appendChild(convertedDataPopup);

            // add close button
            const closeButton = document.createElement('button');
            closeButton.className = 'btn btn-danger';
            closeButton.innerText = 'Close';
            closeButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
            closeButton.onclick = async () => {
              convertedDataPopup.remove();
              closeButton.remove();
            };

            fragmentDiv.appendChild(closeButton);
          };
          fragmentDiv.appendChild(convertButton);

          // show
        };
        fragmentDiv.appendChild(convertButton);

        fragmentCards.appendChild(fragmentDiv);
      });
    });
  }
  readFragmentsIntoCard();
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
