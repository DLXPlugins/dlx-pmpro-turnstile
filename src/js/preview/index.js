// Set up onload event.
document.addEventListener( 'DOMContentLoaded', () => {
	// Get form.
	const form = document.querySelector( '#dlx-pmpro-turnstile-preview-form' );

	// Attach to submit button.
	form.addEventListener( 'submit', ( e ) => {
		e.preventDefault();

		const turnstileToken = document.querySelector( 'input[name="cf-turnstile-response"]' );
		if ( ! turnstileToken ) {
			// todo - show error.
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
				console.log( 'success' );
				return response.json();
			}

			// Failed.
			// todo - show error.
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
			setTimeout( () => {
				// Reset the widget.
				// eslint-disable-next-line no-undef
				turnstile.reset( widgetId );
			}, 300000 ); // 300 seconds (5 mins).
		},// This is when I have to register the layout.
		size: dlxCF.size, /* can be compact|normal. */
		theme: dlxCF.theme, /* can be light, dark, auto */
		language: dlxCF.language,
		appearance: dlxCF.appearance,
	} );
};
