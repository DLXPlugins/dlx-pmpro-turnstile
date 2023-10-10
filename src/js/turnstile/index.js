/**
 * Turnstile JS functionality.
 */

/**
 * This is the main callback for Cloudflare.
 */
window.onLoadDLXPMProTurnstileCallback = () => {
	// Get the submit button. If not found, bail.
	const submitButtonSelector = '.login-submit input[type="submit"], #pmpro_submit_span input[type="submit"], #loginform input[type="submit"]';

	const submitButton = document.querySelector( submitButtonSelector );
	if ( null === submitButton ) {
		return;
	}

	// Mark submit button as disabled.
	submitButton.setAttribute( 'disabled', 'disabled' );

	// Now get the main form.
	const pmproForm = submitButton.closest( 'form' );
	if ( null === pmproForm ) {
		return;
	}

	// Check that turnstile is present.
	if ( typeof turnstile === 'undefined' ) {
		return;
	}

	/**
	 * This is the callback for when the user has filled out the textarea.
	 * We wait until the textarea is filled out to load turnstile to avoid the 300 second timeout of the token.
	 */
	const turnstileBeginRender = () => {
		// Now init turnstile.
		let retries = 1;
		const maxRetries = 5;
		// eslint-disable-next-line no-undef
		const widgetId = turnstile.render( '#dlx-pmpro-turnstile', {
			sitekey: dlxPMPRoTurnstile.siteKey,
			retry: 'never',
			callback: ( token ) => {
				// Re-enable the submit button.
				submitButton.removeAttribute( 'disabled' );
				setTimeout( () => {
					// Reset the widget.
					// eslint-disable-next-line no-undef
					turnstile.reset( widgetId );
				}, 300000 ); // 300 seconds (5 mins).
			},
			'error-callback': ( error ) => {
				// if crashed, retry.
				if ( 'crashed' === error ) {
					if ( retries < maxRetries ) {
						console.error( 'Turnstile seems not be available. Retrying. (From Cloudflare Turnstile - DLXPMProTurnstile)' );
						document.querySelector( '#dlx-pmpro-turnstile' ).insertAdjacentHTML( 'beforeend', '<div class="pmpro_message pmpro_error pmpro_captcha_verification_error">There has been an error communicating with Cloudflare Turnstile (Retrying...).</div>' );
						// eslint-disable-next-line no-undef
						turnstile.reset( widgetId );
					} else {
						document.querySelector( '#dlx-pmpro-turnstile' ).insertAdjacentHTML( 'beforeend', '<div class="pmpro_message pmpro_error pmpro_captcha_verification_error">Could not communicate with Cloudflare Turnstile.</div>' );
						console.error( 'Turnstile seems not be available. Max retries reached. (From Cloudflare Turnstile - DLXPMProTurnstile)' );
					}
					retries += 1;
					return;
				}

				// Tokens can be returned in 000*** format.

				// If interactive challenge failed, reuse the retries var.
				const retryChallengeCodes = [
					'102',
					'103',
					'104',
					'106',
				]; // From: https://developers.cloudflare.com/turnstile/reference/client-side-errors

				// If interactive challenge failed, check challenge code at beginning of token. Reuse max retries var.
				if ( retryChallengeCodes.includes( error.substring( 0, 3 ) ) ) {
					if ( retries < maxRetries ) {
						console.error( 'Turnstile interactive challenge failed. Retrying. (From Cloudflare Turnstile - DLXPMProTurnstile)' );
						document.querySelector( '#dlx-pmpro-turnstile' ).insertAdjacentHTML( 'beforeend', '<div class="pmpro_message pmpro_error pmpro_captcha_verification_error">There has been an error communicating with Cloudflare Turnstile (Retrying...).</div>' );
						// eslint-disable-next-line no-undef
						turnstile.reset( widgetId );
					} else {
						document.querySelector( '#dlx-pmpro-turnstile' ).insertAdjacentHTML( 'beforeend', '<div class="pmpro_message pmpro_error pmpro_captcha_verification_error">Could not communicate with Cloudflare Turnstile.</div>' );
						console.error( 'Turnstile interactive challenge failed. Max retries reached. (From Cloudflare Turnstile - DLXPMProTurnstile)' );
					}
					retries += 1;
					return;
				}

				// Otherwise display user failed challenge error.
				document.querySelector( '#dlx-pmpro-turnstile' ).insertAdjacentHTML( 'beforeend', '<div class="pmpro_message pmpro_error pmpro_captcha_verification_error">You could not be verified as human.</div>' );

				// Remove error after 10 seconds.
				setTimeout( () => {
					document.querySelector( '.pmpro_captcha_verification_error' ).remove();
				}, 10000 );
			},
			size: dlxPMPRoTurnstile.widgetSize, /* can be compact|normal. */
			theme: dlxPMPRoTurnstile.widgetTheme, /* can be light, dark, auto */
			language: dlxPMPRoTurnstile.language,
			appearance: dlxPMPRoTurnstile.widgetAppearance, /* can be always|execute|`interaction-only` */
		} );
	};

	// Set up the textarea event. Render Turnstile immediately.
	turnstileBeginRender();
};
