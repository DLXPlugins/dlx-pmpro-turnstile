/******/ (() => { // webpackBootstrap
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {
/*!*********************************!*\
  !*** ./src/js/preview/index.js ***!
  \*********************************/
// Set up onload event.
document.addEventListener('DOMContentLoaded', function () {
  // Get form.
  var form = document.querySelector('#dlx-pmpro-turnstile-preview-form');

  // Attach to submit button.
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get the submit button.
    var submitButton = form.querySelector('input[type="submit"]');

    // Disable the submit button.
    submitButton.setAttribute('disabled', 'disabled');

    // Get the token.
    var turnstileToken = document.querySelector('input[name="cf-turnstile-response"]');
    if (!turnstileToken) {
      var alert = document.createElement('div');
      alert.classList.add('notice');
      alert.classList.add('notice-error');
      alert.innerHTML = '<p>Error! We could not get the Turnstile token. Please close this modal and try with a different key.</p>';
      submitButton.insertAdjacentElement('afterend', alert);

      // Remove the submit button.
      submitButton.remove();
      return;
    }

    // Append token to form action URL.
    var url = new URL(form.action);
    url.searchParams.append('turnstyleToken', turnstileToken.value);

    // Perform fetch request.
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        action: 'dlx_pmpro_turnstile_admin_preview_validate',
        turnStyleToken: turnstileToken.value
      }
    }).then(function (response) {
      if (response.ok) {
        // Let's add an inline alert after the submit button.
        var _alert = document.createElement('div');
        _alert.classList.add('notice');
        _alert.classList.add('notice-success');
        _alert.innerHTML = '<p><strong>Success!</strong> Everything is working. Please close this modal and save your changes.</p>';
        submitButton.insertAdjacentElement('afterend', _alert);

        // Remove the submit button.
        submitButton.remove();
        return response.json();
      }
      var alert = document.createElement('div');
      alert.classList.add('notice');
      alert.classList.add('notice-error');
      alert.innerHTML = '<p><strong>Error!</strong> Turnstile couldn\'t verify you as human. Please close this modal and try again. If there is still an error, there may be an issue with your Turnstile keys.</p>';
      submitButton.insertAdjacentElement('afterend', alert);

      // Remove the submit button.
      submitButton.remove();
    })["catch"](function (error) {
      console.error(error);
    });
  });
});
window.onLoadDLXPMProPreviewCallback = function () {
  var widgetId = turnstile.render('#dlx-pmpro-turnstile-placeholder', {
    sitekey: dlxCF.siteKey,
    retry: 'never',
    callback: function callback(token) {
      // Re-enable the submit button.
      var submitButton = document.querySelector('#dlx-pmpro-turnstile-preview-form input[type="submit"]');
      submitButton.removeAttribute('disabled');
      setTimeout(function () {
        // Reset the widget.
        // eslint-disable-next-line no-undef
        turnstile.reset(widgetId);
      }, 300000); // 300 seconds (5 mins).
    },

    size: dlxCF.size,
    /* can be compact|normal. */
    theme: dlxCF.theme,
    /* can be light, dark, auto */
    language: dlxCF.language,
    appearance: dlxCF.appearance
  });
};
})();

// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*****************************!*\
  !*** ./src/scss/modal.scss ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin

})();

/******/ })()
;
//# sourceMappingURL=dlx-pmpro-cloudflare-turnstile-preview-modal.js.map