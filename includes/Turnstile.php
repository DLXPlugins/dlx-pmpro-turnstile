<?php
/**
 * Turnstile related APIs and frontend output.
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

/**
 * Turnstile class.
 */
class Turnstile {

	/**
	 * Whether or not the login_form action has been called already.
	 *
	 * @var bool
	 */
	public static $has_wp_login_form_output = false;

	/**
	 * Class runner.
	 */
	public function run() {
		// Add Turnstile before the checkout button on checkout pages.
		add_action( 'pmpro_checkout_before_submit_button', array( $this, 'output_turnstile_html' ) );

		// Enqueue scripts on the login page.
		add_action( 'login_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Add turnstile to the main wp login form.
		add_action( 'login_form', array( $this, 'output_turnstile_html' ) );

		// Add turnstile to the main wp password reset form.
		add_action( 'lostpassword_form', array( $this, 'output_turnstile_html' ) );

		// Hook into checkout process and check Turnstile token.
		add_action( 'pmpro_checkout_before_processing', array( $this, 'check_turnstile_token' ), 1 ); // Run super early.

		// Hook into bottom of login page.
		add_filter( 'login_form_middle', array( $this, 'return_turnstile_html' ) );

		// Check turnstile token for login authentication.
		add_filter( 'wp_authenticate_user', array( $this, 'check_turnstile_token' ), 1, 2 ); // Run super early.

		// Add turnstile output to footer if on login page.
		add_action( 'wp_footer', array( $this, 'maybe_output_footer_html' ) );

		// For intercepting lost password requests.
		add_filter( 'allow_password_reset', array( $this, 'allow_password_reset' ), 10, 2 );

		// Init in to add PMPro error messages if password reset fails.
		add_action( 'the_content', array( $this, 'output_password_reset_failure' ) );
	}

	/**
	 * Set error messages if password reset fails.
	 */
	public function output_password_reset_failure( $content ) {
		global $pmpro_msg, $pmpro_msgt, $pmpro_error_fields;

		$action = filter_input( INPUT_GET, 'action', FILTER_DEFAULT );
		$errors = filter_input( INPUT_GET, 'errors', FILTER_DEFAULT );

		if ( 'reset_pass' === $action && 'no_password_reset' === $errors ) {
			ob_start();
			?>
				<div class="pmpro_message pmpro_error">
					<?php echo esc_html__( 'Captcha Verification failed. Please try again.', 'pmpro-turnstile' ); ?>
				</div>
			<?php
			$content = ob_get_clean() . $content;
		}
		return $content;
	}

	/**
	 * Allow password reset.
	 *
	 * @param bool $allow    Whether to allow the password to be reset. Default true.
	 * @param int  $user_id  The ID of the user attempting to reset a password.
	 *
	 * @return bool true or false.
	 */
	public function allow_password_reset( $allow, $user_id ) {
		if ( Functions::can_show_turnstile() ) {
			$token_check = $this->check_turnstile_token();
			if ( \is_wp_error( $token_check ) || ! $token_check ) {
				return false;
			} else {
				return true;
			}
		}
		return $allow;
	}

	/**
	 * Maybe output Turnstile HTML for pmpro's lost password form.
	 */
	public function maybe_output_footer_html() {
		if ( Functions::can_show_turnstile() ) {
			$this->output_turnstile_html();
		}
	}

	/**
	 * Check the Turnstile token.
	 *
	 * @param \WP_User $user_object The user object.
	 * @param string   $password    The user's password.
	 *
	 * @return bool true or false if token succeeded.
	 */
	public function check_turnstile_token( $user_object = null, $password = '' ) {
		if ( Functions::can_show_turnstile() ) {
			// Get options.
			$options = Options::get_options();

			// Guilty until proven innocent.
			$can_proceed = false;

			// If there's a turnstile token, I suppose that means we should validate it.
			$maybe_token = filter_input( INPUT_POST, 'cf-turnstile-response', FILTER_DEFAULT );

			// Make sure token is valid.
			if ( $maybe_token ) {

				$cloudflare_endpoint_api = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

				/**
				 * Always passes: 1x0000000000000000000000000000000AA
				 * Always fails: 2x0000000000000000000000000000000AA
				 */
				$secret_key = $options['secretKey'] ?? '';

				// Build data envelope.
				$data = array(
					'secret'   => $secret_key,
					'response' => sanitize_text_field( $maybe_token ),
				);

				$args = array(
					'body'      => $data,
					'method'    => 'POST',
					'sslverify' => true,
				);

				$response = wp_remote_post( esc_url( $cloudflare_endpoint_api ), $args );

				// If error, show response.
				if ( is_wp_error( $response ) ) {
					$can_proceed = false;
				}

				// Get body.
				$body = json_decode( wp_remote_retrieve_body( $response ), true );

				$is_success = $body['success'] ?? false;
				// If not a success, error.
				if ( $can_proceed && ! $is_success ) {
					$can_proceed = false;
				} elseif ( $can_proceed && $is_success ) {
					$can_proceed = true;
				} else {
					$can_proceed = false;
				}
			}
		}

		// Can we go?
		if ( true === $can_proceed ) {
			return $can_proceed;
		}

		// If not, cloudflare validation failed. Set globals.
		global $pmpro_msg, $pmpro_msgt, $pmpro_error_fields;

		// Set error message. Verification failed.
		$pmpro_msg          = __( 'Verification failed. Please try again.', 'pmpro-turnstile' );
		$pmpro_msgt         = 'pmpro_error';
		$pmpro_error_fields = array( 'cf-turnstile-response' );

		return false;
	}

	/**
	 * Output Turnstile HTML.
	 */
	public function output_turnstile_html() {
		// If we can't show Turnstile, bail.
		if ( ! Functions::can_show_turnstile() ) {
			return;
		}

		// Prevent from being triggered twice.
		if ( true === self::$has_wp_login_form_output ) {
			return;
		}
		self::$has_wp_login_form_output = true;

		$this->enqueue_scripts();
		echo '<div id="dlx-pmpro-turnstile"></div>';
	}

	/**
	 * Output Turnstile HTML.
	 */
	public function return_turnstile_html() {
		// If we can't show Turnstile, bail.
		if ( ! Functions::can_show_turnstile() ) {
			return;
		}

		// Check for errors on login page.
		global $pmpro_msg, $pmpro_msgt, $pmpro_error_fields;

		// If action `pmpro-turnstile-error` is set, show error.
		$pmpro_turnstile_error = filter_input( INPUT_GET, 'action', FILTER_DEFAULT );
		if ( $pmpro_turnstile_error ) {
			// Build PMPRo compatible error message.
			$verification_message = __( 'Cloudflare Turnstile verification failed. Please try again.', 'dlx-pmpro-turnstile' );

			$html  = '<div id="pmpro_message" class="pmpro_message pmpro_error">';
			$html .= esc_html( $verification_message );
			$html .= '</div>';
		}
		$this->enqueue_scripts();
		return $html . '<div id="dlx-pmpro-turnstile"></div>';
	}

	/**
	 * Enqueue turnstile scripts.
	 */
	public function enqueue_scripts() {
		// Retrieve options.
		$options = Options::get_options();

		// Enqueue Turnstile script.
		wp_enqueue_script(
			'dlx-pmpro-turnstile-js',
			Functions::get_plugin_url( 'dist/dlx-pmpro-cloudflare-turnstile.js' ),
			array(),
			Functions::get_plugin_version(),
			true
		);
		wp_localize_script(
			'dlx-pmpro-turnstile-js',
			'dlxPMPRoTurnstile',
			array(
				'enabled'          => (bool) $options['enabled'],
				'siteKey'          => $options['siteKey'],
				'language'         => $options['language'],
				'widgetTheme'      => $options['widgetTheme'],
				'widgetAppearance' => $options['widgetAppearance'],
				'widgetSize'       => $options['widgetSize'],
			)
		);

		// Enqueue challenge script.
		wp_enqueue_script(
			'dlx-pmpro-turnstile-cf',
			'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onLoadDLXPMProTurnstileCallback',
			array( 'dlx-pmpro-turnstile-js' ),
			Functions::get_plugin_version(),
			true
		);
	}
}
