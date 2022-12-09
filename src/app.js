// src/app.js

import { Auth, getUser } from './auth';
import { getFragmentById, getUserFragments, postFragment, deleteFragment } from './api';
import { create, registerPlugin } from 'filepond';
import 'filepond/dist/filepond.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

// Get our UI elements
// Auth Elements (login, logout, etc)
const loginBtn = document.querySelector('#login');
const logoutBtn = document.querySelector('#logout');
const userSection = document.querySelector('#user');

// CREATE: Fragment form and fragment metadata elements
const fragmentForm = document.querySelector('#fragment-form'); // form where we POST fragment data
const fragmentInput = document.querySelector('#fragment-data-input'); // ENTER fragment data here
const fragmentType = document.querySelector('#create-fragment-type'); // SELECT fragment type here

const submitFragmentFileBtn = document.querySelector('#submit-fragment-file-btn');

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
    // clear the form
    fragmentInput.value = '';
  };

  const input = document.querySelector('input[type="file"]');

  registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

  const pond = create(input, {
    acceptedFileTypes: ['text/html', 'text/plain', 'text/markdown', 'application/json', 'image/*'],
  });

  let fileDropBox = '';
  // listen for addfile event
  pond.on('addfile', (error, file) => {
    if (error) {
      console.log(`Error posting the file: ${error}`);
      return;
    }
    console.table(`File added with content type ${file.fileType}, and size ${file.fileSize}`);

    // disable input and dropdown menu
    fragmentInput.disabled = true;
    fragmentType.disabled = true;

    fileDropBox = file;
  });

  submitFragmentFileBtn.onclick = async (e) => {
    e.preventDefault();
    // if file is not uploaded yet focus on the filepond
    // read the file and check if it is a image or text
    const fileReader = new FileReader();

    if (fileDropBox.fileType.includes('image')) {
      fileReader.readAsArrayBuffer(fileDropBox.file);
    } else {
      fileReader.readAsText(fileDropBox.file);
    }

    fileReader.onload = async () => {
      const fragmentType = fileDropBox.fileType;
      // if the file is an image, the data is a base64 string
      const fragmentData = fileReader.result;

      await postFragment(user, fragmentData, fragmentType);

      readFragmentsIntoCard();
      //window.location.reload(); // this is to prevent user from posting the same file again

      console.log(`Posted fragment of type ${fragmentType}`);
    };
    fileReader.onerror = (error) => {
      console.log(`Error reading the file: ${error}`);
    };

    pond.removeFiles();

    console.log('File to be posted', fileDropBox);
  };

  function readFragmentsIntoCard() {
    const listOfFragments = getUserFragments(user, true);
    listOfFragments.then((data) => {
      const fragmentCards = document.querySelector('#fragmentCards');
      fragmentCards.innerHTML = '';
      data.fragments.forEach((fragment) => {
        const fragmentDiv = document.createElement('div');

        fragmentDiv.style =
          'border: 1px solid black; margin: 10px; padding: 10px; width: 100%; overflow: scroll; display: inline-block; vertical-align: top; text-align: left; background-color: #f2f2f2; border-radius: 20px; color: #000000; font-size: 1rem; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); font-family: "Courier New", Courier, monospace; font-weight: 700; line-height: 1.5; letter-spacing: 0.00938em;';
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
        deleteButton.innerText = 'Delete Fragment';
        deleteButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
        deleteButton.onclick = async () => {
          await deleteFragment(user, fragment.id);
          readFragmentsIntoCard();
        };
        fragmentDiv.appendChild(deleteButton);

        // add view button to view fragment on each click hide and show fragment content
        const viewButton = document.createElement('button');
        viewButton.className = 'btn btn-primary';
        viewButton.innerText = 'View Content';
        viewButton.style = 'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
        // check if fragment is text/* or application/json
        if (fragment.type.includes('text/') || fragment.type.includes('json')) {
          viewButton.onclick = async () => {
            const fragmentContentDiv = document.createElement('div');

            fragmentContentDiv.style =
              'margin: 10px; padding: 10px; width: 90%; overflow: scroll; vertical-align: top; text-align: left; background-color: #f2f2f2; color: #000000; border-top: 4px solid black; display: inline-block;';

            const fragmentDataDiv = document.createElement('div');
            fragmentDataDiv.style = 'display: inline-block; width: 100%;';
            const fragmentData = document.createElement('span');
            fragmentData.innerText = `Current fragment data: `;
            const fragmentDataBadge = document.createElement('span');
            fragmentDataBadge.className = 'badge badge-secondary';
            fragmentDataBadge.innerText = await getFragmentById(user, fragment.id, '');
            fragmentDataBadge.style = 'padding: 4px; font-size: .9rem;';
            fragmentData.appendChild(fragmentDataBadge);
            fragmentDataDiv.appendChild(fragmentData);
            fragmentContentDiv.appendChild(fragmentDataDiv);

            // put br
            fragmentContentDiv.appendChild(document.createElement('br'));

            // add a dropdown to select content type (text, html, markdown, json)
            const fragmentContentTypeDiv = document.createElement('div');
            fragmentContentTypeDiv.style =
              'display: inline-block; width: 90%; margin: 10px; padding: 10px; color: #000000; ';
            const fragmentContentType = document.createElement('span');
            fragmentContentType.innerText = `Select content type to view: `;
            const fragmentContentTypeSelect = document.createElement('select');
            fragmentContentTypeSelect.className = 'form-control';
            fragmentContentTypeSelect.style = 'width: 100%; display: inline-block;';
            const fragmentContentTypeOptionText = document.createElement('option');
            fragmentContentTypeOptionText.innerText = 'text/plain';
            fragmentContentTypeOptionText.value = '.txt';
            fragmentContentTypeSelect.appendChild(fragmentContentTypeOptionText);
            const fragmentContentTypeOptionMarkdown = document.createElement('option');
            fragmentContentTypeOptionMarkdown.innerText = 'text/markdown';
            fragmentContentTypeOptionMarkdown.value = '.md';
            fragmentContentTypeSelect.appendChild(fragmentContentTypeOptionMarkdown);
            const fragmentContentTypeOptionHTML = document.createElement('option');
            fragmentContentTypeOptionHTML.innerText = 'text/html';
            fragmentContentTypeOptionHTML.value = '.html';
            fragmentContentTypeSelect.appendChild(fragmentContentTypeOptionHTML);
            const fragmentContentTypeOptionJSON = document.createElement('option');
            fragmentContentTypeOptionJSON.innerText = 'application/json';
            fragmentContentTypeOptionJSON.value = '.json';
            fragmentContentTypeSelect.appendChild(fragmentContentTypeOptionJSON);
            fragmentContentType.appendChild(fragmentContentTypeSelect);
            fragmentContentTypeDiv.appendChild(fragmentContentType);
            fragmentContentDiv.appendChild(fragmentContentTypeDiv);

            // add button to convert fragment content to selected content type
            const fragmentConvertButton = document.createElement('button');
            fragmentConvertButton.className = 'btn btn-primary';
            fragmentConvertButton.innerText = 'Convert';
            fragmentConvertButton.style =
              'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
            fragmentConvertButton.onclick = async () => {
              const fragmentData = await getFragmentById(
                user,
                fragment.id,
                fragmentContentTypeSelect.value,
                ''
              );
              // if fragment data is null, show error
              if (
                !fragmentData ||
                fragmentData === null ||
                fragmentData === undefined ||
                fragmentData === ''
              ) {
                // show error
                const fragmentConvertedContentDiv = document.createElement('div');
                fragmentConvertedContentDiv.style = `margin: 10px; padding: 10px; width: 90%; overflow: scroll; vertical-align: top; text-align: left; background-color: #f2f2f2; color: #000000; border-top: 4px solid black; display: inline-block;`;

                //fragmentConvertedContentBadge.innerText = `Error: ${fragmentData}`;
                fragmentConvertedContentDiv.innerText = `Error: unsupported content type conversion`;
                fragmentContentDiv.appendChild(fragmentConvertedContentDiv);
                return;
              }

              // create a new div to show converted content
              const fragmentConvertedContentDiv = document.createElement('div');
              fragmentConvertedContentDiv.style =
                'margin: 10px; padding: 10px; width: 90%; overflow: scroll; vertical-align: top; text-align: left; background-color: #f2f2f2; color: #000000; border-top: 4px solid black; display: inline-block;';
              const fragmentConvertedContent = document.createElement('span');
              fragmentConvertedContent.innerText = `Converted fragment data: `;
              const fragmentConvertedContentBadge = document.createElement('span');
              fragmentConvertedContentBadge.className = 'badge badge-secondary';
              fragmentConvertedContentBadge.innerText = fragmentData;
              fragmentConvertedContentBadge.style = 'padding: 4px; font-size: .9rem;';
              fragmentConvertedContent.appendChild(fragmentConvertedContentBadge);
              fragmentConvertedContentDiv.appendChild(fragmentConvertedContent);
              fragmentContentDiv.appendChild(fragmentConvertedContentDiv);
            };

            // add button to CLOSE fragmentContentDiv
            const closeFragmentContentDivButton = document.createElement('button');
            closeFragmentContentDivButton.className = 'btn btn-danger';
            closeFragmentContentDivButton.innerText = 'Close window';
            closeFragmentContentDivButton.style =
              'float: right; margin: 7px; padding: 7px; font-size: .9rem;';
            closeFragmentContentDivButton.onclick = async () => {
              fragmentContentDiv.style.display = 'none';
              viewButton.disabled = false;
            };
            fragmentContentDiv.appendChild(closeFragmentContentDivButton);
            fragmentContentDiv.appendChild(fragmentConvertButton);

            // show fragment content
            fragmentDiv.appendChild(fragmentContentDiv);
            fragmentDiv.appendChild(document.createElement('br'));
            // disable view button
            viewButton.disabled = true;
          };
        }
        // check if fragment is image/*
        else if (fragment.type.includes('image')) {
          // create a new div to show image content with popup

          viewButton.onclick = async () => {
            const fragmentImageModalDiv = document.createElement('div');
            fragmentImageModalDiv.className = 'modal fade';
            fragmentImageModalDiv.id = `fragmentImageModal`;
            fragmentImageModalDiv.setAttribute('tabindex', '-1');
            fragmentImageModalDiv.setAttribute('role', 'dialog');
            fragmentImageModalDiv.setAttribute('aria-labelledby', 'fragmentImageModalLabel');
            fragmentImageModalDiv.setAttribute('aria-hidden', 'true');
            fragmentImageModalDiv.style = 'display: none;';
            const fragmentImageModalDialogDiv = document.createElement('div');
            fragmentImageModalDialogDiv.className = 'modal-dialog';
            fragmentImageModalDialogDiv.setAttribute('role', 'document');
            const fragmentImageModalContentDiv = document.createElement('div');
            fragmentImageModalContentDiv.className = 'modal-content';

            const fragmentImageModalBodyDiv = document.createElement('div');
            fragmentImageModalBodyDiv.className = 'modal-body';
            const fragmentImageModalBodyImage = document.createElement('img');
            fragmentImageModalBodyImage.src = await getFragmentById(user, fragment.id, ''); // <=  API call to get img data
            fragmentImageModalBodyImage.style = 'width: 100%;';
            // underneath the image, add dropdown menu to view image in different formats
            const fragmentImageModalBodyImageDropdownDiv = document.createElement('div');
            fragmentImageModalBodyImageDropdownDiv.className = 'dropdown';
            fragmentImageModalBodyImageDropdownDiv.style = 'float: right; margin: 7px;';
            // select element
            const fragmentImageModalBodyImageDropdownSelect = document.createElement('select');
            fragmentImageModalBodyImageDropdownSelect.className = 'custom-select';
            fragmentImageModalBodyImageDropdownSelect.style = 'width: 100px;';
            // add label to select element
            const fragmentImageModalBodyImageDropdownLabel = document.createElement('label');
            fragmentImageModalBodyImageDropdownLabel.innerText = 'View in other formats: ';
            //fragmentImageModalBodyImageDropdownLabel.style = 'font-size: .9rem; ';
            /* display inline */
            fragmentImageModalBodyImageDropdownLabel.style = 'display: inline; font-size: .9rem; ';
            fragmentImageModalBodyImageDropdownDiv.appendChild(
              fragmentImageModalBodyImageDropdownLabel
            );
            fragmentImageModalBodyImageDropdownDiv.appendChild(
              fragmentImageModalBodyImageDropdownSelect
            );
            // add options to select element

            // options
            const fragmentImageModalBodyImageDropdownSelectOption1 =
              document.createElement('option');
            fragmentImageModalBodyImageDropdownSelectOption1.value = '.png';
            fragmentImageModalBodyImageDropdownSelectOption1.innerText = 'PNG';
            fragmentImageModalBodyImageDropdownSelectOption1.selected = true;
            const fragmentImageModalBodyImageDropdownSelectOption2 =
              document.createElement('option');
            fragmentImageModalBodyImageDropdownSelectOption2.value = '.jpeg';
            fragmentImageModalBodyImageDropdownSelectOption2.innerText = 'JPEG';
            // add webp and png options too

            const fragmentImageModalBodyImageDropdownSelectOption3 =
              document.createElement('option');
            fragmentImageModalBodyImageDropdownSelectOption3.value = '.webp';
            fragmentImageModalBodyImageDropdownSelectOption3.innerText = 'WEBP';

            const fragmentImageModalBodyImageDropdownSelectOption4 =
              document.createElement('option');
            fragmentImageModalBodyImageDropdownSelectOption4.value = '.gif';
            fragmentImageModalBodyImageDropdownSelectOption4.innerText = 'GIF';

            fragmentImageModalBodyImageDropdownSelect.appendChild(
              fragmentImageModalBodyImageDropdownSelectOption1
            );
            fragmentImageModalBodyImageDropdownSelect.appendChild(
              fragmentImageModalBodyImageDropdownSelectOption2
            );
            fragmentImageModalBodyImageDropdownSelect.appendChild(
              fragmentImageModalBodyImageDropdownSelectOption3
            );
            fragmentImageModalBodyImageDropdownSelect.appendChild(
              fragmentImageModalBodyImageDropdownSelectOption4
            );

            fragmentImageModalBodyImageDropdownDiv.appendChild(
              fragmentImageModalBodyImageDropdownSelect
            );
            fragmentImageModalBodyDiv.appendChild(fragmentImageModalBodyImageDropdownDiv);

            fragmentImageModalBodyImageDropdownSelect.onchange = async () => {
              fragmentImageModalBodyImage.src = await getFragmentById(
                user,
                fragment.id,
                fragmentImageModalBodyImageDropdownSelect.value
              );
              console.log(fragmentImageModalBodyImageDropdownSelect.value);
            };

            fragmentImageModalBodyDiv.appendChild(fragmentImageModalBodyImage);
            const fragmentImageModalFooterDiv = document.createElement('div');
            fragmentImageModalFooterDiv.className = 'modal-footer';

            const fragmentImageModalFooterCloseButton = document.createElement('button');
            fragmentImageModalFooterCloseButton.className = 'btn btn-secondary';
            fragmentImageModalFooterCloseButton.innerText = 'Close';

            fragmentImageModalFooterDiv.appendChild(fragmentImageModalFooterCloseButton);
            fragmentImageModalContentDiv.appendChild(fragmentImageModalBodyDiv);
            fragmentImageModalContentDiv.appendChild(fragmentImageModalFooterDiv);
            fragmentImageModalDialogDiv.appendChild(fragmentImageModalContentDiv);
            fragmentImageModalDiv.appendChild(fragmentImageModalDialogDiv);
            fragmentDiv.appendChild(fragmentImageModalDiv);

            fragmentImageModalDiv.style.display = 'block';
            fragmentImageModalDiv.className += ' show';
            fragmentImageModalDiv.setAttribute('aria-modal', 'true');
            fragmentImageModalDiv.setAttribute('style', 'display: block; padding-right: 17px;');
            /* center on the screen */
            fragmentImageModalDiv.style.top = '50%';
            fragmentImageModalDiv.style.left = '50%';
            fragmentImageModalDiv.style.transform = 'translate(-50%, -50%)';
            fragmentImageModalDiv.style.position = 'fixed';
            fragmentImageModalDiv.style.zIndex = '1050';
            fragmentImageModalDiv.style.overflow = 'auto';

            fragmentImageModalDiv.setAttribute('role', 'dialog');
            fragmentImageModalDiv.setAttribute('tabindex', '-1');
            fragmentImageModalDiv.setAttribute('aria-labelledby', 'fragmentImageModalLabel');
            fragmentImageModalDiv.setAttribute('aria-hidden', 'true');

            const fragmentImageModalBackdropDiv = document.createElement('div');
            fragmentImageModalBackdropDiv.className = 'modal-backdrop fade show';
            fragmentImageModalBackdropDiv.setAttribute('style', 'height: 100vh;');

            fragmentImageModalFooterCloseButton.onclick = async () => {
              fragmentImageModalDiv.style.display = 'none';
              fragmentImageModalDiv.className = 'modal fade';
              fragmentImageModalDiv.setAttribute('aria-modal', 'false');
              fragmentImageModalDiv.setAttribute('style', 'display: none;');
              fragmentImageModalDiv.setAttribute('role', 'dialog');
              fragmentImageModalDiv.setAttribute('tabindex', '-1');
              fragmentImageModalDiv.setAttribute('aria-labelledby', 'fragmentImageModalLabel');
              fragmentImageModalDiv.setAttribute('aria-hidden', 'true');
              fragmentImageModalBackdropDiv.remove();
              viewButton.disabled = false;
            };

            document.body.appendChild(fragmentImageModalBackdropDiv);
            // disable view button
          };
        }

        fragmentDiv.appendChild(viewButton);
        fragmentCards.appendChild(fragmentDiv);
      });
    });
  }
  readFragmentsIntoCard();
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
