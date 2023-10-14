// Set up onload event.
document.addEventListener( 'DOMContentLoaded', () => {
	// Get form.
	const form = document.querySelector( '#dlx-pmpro-turnstile-preview-form' );

	// Attach to submit button.
	form.addEventListener( 'submit', ( e ) => {
		e.preventDefault();

		// Get the submit button.
		const submitButton = form.querySelector( 'input[type="submit"]' );

		// Disable the submit button.
		submitButton.setAttribute( 'disabled', 'disabled' );

		// Get the token.
		const turnstileToken = document.querySelector( 'input[name="cf-turnstile-response"]' );
		if ( ! turnstileToken ) {
			const alert = document.createElement( 'div' );
			alert.classList.add( 'notice' );
			alert.classList.add( 'notice-error' );
			alert.innerHTML = '<p>Error! We could not get the Turnstile token. Please close this modal and try with a different key.</p>';

			// Replace placeholder with alert.
			const noticePlaceholder = document.querySelector( '#notice-placeholder' );
			noticePlaceholder.replaceWith( alert );

			// Remove the submit button.
			submitButton.remove();
			return;
		}

		// Append token to form action URL.
		const url = new URL( form.action );
		url.searchParams.append( 'turnstyleToken', turnstileToken.value );

		// Perform fetch request.
		fetch( url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				action: 'dlx_pmpro_turnstile_admin_preview_validate',
				turnStyleToken: turnstileToken.value,
			},
		} ).then( ( response ) => {
			if ( response.ok ) {
				// Let's add an inline alert after the submit button.
				const alert = document.createElement( 'div' );
				alert.classList.add( 'notice' );
				alert.classList.add( 'notice-success' );
				alert.innerHTML = '<p><strong>Success!</strong> Everything is working. Please close this modal and save your changes.</p>';
				// Get the notice placeholder.
				const noticePlaceholder = document.querySelector( '#notice-placeholder' );

				// Replace placeholder with alert.
				noticePlaceholder.replaceWith( alert );

				// Remove the submit button.
				submitButton.remove();
				return response.json();
			}

			const alert = document.createElement( 'div' );
			alert.classList.add( 'notice' );
			alert.classList.add( 'notice-error' );
			alert.innerHTML = '<p><strong>Error!</strong> Turnstile couldn\'t verify you as human. Please close this modal and try again. If there is still an error, there may be an issue with your Turnstile keys.</p>';

			const noticePlaceholder = document.querySelector( '#notice-placeholder' );
			noticePlaceholder.replaceWith( alert );

			// Remove the submit button.
			submitButton.remove();
		}
		).catch( ( error ) => {
			console.error( error );
		} );
	} );
} );

window.onLoadDLXPMProPreviewCallback = () => {
	const widgetId = turnstile.render( '#dlx-pmpro-turnstile-placeholder', {
		sitekey: dlxCF.siteKey,
		retry: 'never',
		callback: ( token ) => {
			// Re-enable the submit button.
			const submitButton = document.querySelector( '#dlx-pmpro-turnstile-preview-form input[type="submit"]' );
			submitButton.removeAttribute( 'disabled' );

			setTimeout( () => {
				// Reset the widget.
				// eslint-disable-next-line no-undef
				turnstile.reset( widgetId );
			}, 300000 ); // 300 seconds (5 mins).
		},
		size: dlxCF.size, /* can be compact|normal. */
		theme: dlxCF.theme, /* can be light, dark, auto */
		language: dlxCF.language,
		appearance: dlxCF.appearance,
	} );
};
