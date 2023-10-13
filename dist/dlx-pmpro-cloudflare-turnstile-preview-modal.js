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
    var turnstileToken = document.querySelector('input[name="cf-turnstile-response"]');
    if (!turnstileToken) {
      // todo - show error.
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
        console.log('success');
        return response.json();
      }

      // Failed.
      // todo - show error.
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
      setTimeout(function () {
        // Reset the widget.
        // eslint-disable-next-line no-undef
        turnstile.reset(widgetId);
      }, 300000); // 300 seconds (5 mins).
    },

    // This is when I have to register the layout.
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