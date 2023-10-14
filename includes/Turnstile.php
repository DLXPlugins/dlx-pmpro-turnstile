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

		// Get options.
		$options = Options::get_options();
		// Check if Cloudflare Turnstile is even enabled.
		if ( ! (bool) $options['enabled'] ) {
			// If we're in the admin, bail.
			if ( is_admin() ) {
				return;
			}

			// Check for `enable_turnstile` query var. If it's not set, we bail. We check for permissions later.
			$enable_turnstile = filter_input( INPUT_GET, 'enable_turnstile', FILTER_VALIDATE_BOOLEAN );
			if ( ! $enable_turnstile ) {
				return;
			}
		}

		// Add Turnstile before the checkout button on checkout pages.
		add_action( 'pmpro_checkout_before_submit_button', array( $this, 'output_turnstile_html' ) );

		// Enqueue scripts on the login page.
		add_action( 'login_enqueue_scripts', array( $this, 'maybe_enqueue_scripts' ) );

		// Add turnstile to the main wp login form.
		add_action( 'login_form', array( $this, 'output_turnstile_html' ) );

		// Add turnstile to the main wp password reset form.
		add_action( 'lostpassword_form', array( $this, 'output_turnstile_html' ) );

		// Hook into checkout process and check Turnstile token.
		add_filter( 'pmpro_registration_checks', array( $this, 'pre_check_turnstile_token' ), 20 );

		// Hook into bottom of login page.
		add_filter( 'login_form_middle', array( $this, 'return_turnstile_html' ) );

		// Check turnstile token for login authentication.
		add_filter( 'wp_authenticate_user', array( $this, 'check_turnstile_token' ), 1, 2 ); // Run super late.

		// Add turnstile output to footer if on login page.
		add_action( 'wp_footer', array( $this, 'maybe_output_footer_html' ) );

		// For intercepting lost password requests.
		add_filter( 'allow_password_reset', array( $this, 'allow_password_reset' ), 10, 2 );

		// Init in to add PMPro error messages if password reset fails.
		add_action( 'the_content', array( $this, 'output_password_reset_failure' ) );
	}

	/**
	 * Check the Turnstile token before account creation.
	 *
	 * @param array $can_continue Whether or not to continue with registration.
	 *
	 * @return array $can_continue Whether or not to continue with registration.
	 */
	public function pre_check_turnstile_token( $can_continue ) {
		if ( Functions::can_show_turnstile() ) {
			$token_check = $this->check_turnstile_token();
			if ( null === $token_check ) {
				// This means no user was found, but this means Cloudflare verification passed.
				return true;
			}
			if ( \is_wp_error( $token_check ) || ! $token_check ) {
				$can_continue = false;
				pmpro_setMessage( esc_html__( 'Sorry, we could not verify that you are human...', 'dlx-pmpro-turnstile' ), 'pmpro_error' );

			}
		}
		return $can_continue;
	}

	/**
	 * Set error messages if password reset fails.
	 *
	 * @param string $content The content.
	 *
	 * @return string $content The content.
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
	 * @return bool|null|\WP_User true or false if token succeeded.
	 */
	public function check_turnstile_token( $user_object = null, $password = '' ) {
		// Remove filter to prevent login lockup.
		remove_filter( 'wp_authenticate_user', array( $this, 'check_turnstile_token' ), 100, 2 );

		// Get options.
		$options = Options::get_options();

		// Guilty until proven innocent.
		$can_proceed = false;

		// If there's a turnstile token, I suppose that means we should validate it.
		$maybe_token = filter_input( INPUT_POST, 'cf-turnstile-response', FILTER_DEFAULT );

		// Get WordFence token. Return if found.
		$wf_token = filter_input( INPUT_POST, 'wfls-token', FILTER_DEFAULT );
		if ( $maybe_token && $wf_token && null !== $user_object ) {
			return $user_object;
		}

		// Check for bypass key/values.
		$bypass_enabled = (bool) $options['enableQueryBypass'];
		if ( $bypass_enabled ) {
			$bypass_key          = $options['queryBypassKey'] ?? '';
			$bypass_value        = $options['queryBypassValue'] ?? '';
			$posted_bypass_key   = filter_input( INPUT_POST, 'pmpro_bypass_key', FILTER_DEFAULT );
			$posted_bypass_value = filter_input( INPUT_POST, 'pmpro_bypass_value', FILTER_DEFAULT );

			// If the key and value match, we can bypass.
			if ( $posted_bypass_key === $bypass_key && $posted_bypass_value === $bypass_value ) {
				return $user_object;
			}
		}

		// Check to see if DEBUG contant is set.
		if ( defined( 'PMPRO_TURNSTILE_DISABLE' ) && PMPRO_TURNSTILE_DISABLE ) {
			return $user_object;
		}

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
			if ( ! $is_success ) {
				$can_proceed = false;
			} else {
				$can_proceed = true;
			}
		}

		// Can we go?
		if ( true === $can_proceed ) {
			return $user_object;
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
		if ( ! Functions::can_show_turnstile() ) {
			// If we can't show Turnstile, bail.
			$this->output_query_bypass_values();
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
	 * Output hidden fields for the query bypass.
	 */
	private function output_query_bypass_values() {
		// Check GET vars for query bypass key.
		// Add bypass variables to form.
		$options        = Options::get_options();
		$bypass_enabled = (bool) $options['enableQueryBypass'];
		$bypass_key     = $options['queryBypassKey'] ?? '';
		$bypass_value   = $options['queryBypassValue'] ?? '';

		// Bail early if bypass is not enabled.
		if ( ! $bypass_enabled ) {
			return;
		}

		// Attempt to get the key.
		$maybe_value = filter_input( INPUT_GET, $bypass_key, FILTER_DEFAULT );
		if ( $maybe_value ) {
			if ( $maybe_value === $bypass_value ) {
				// If the key and value match, we can bypass.
				?>
				<input type="hidden" name="pmpro_bypass_key" value="<?php echo esc_attr( $bypass_key ); ?>" />
				<input type="hidden" name="pmpro_bypass_value" value="<?php echo esc_attr( $maybe_value ); ?>" />
				<?php
			}
		}
	}

	/**
	 * Output Turnstile HTML.
	 */
	public function return_turnstile_html() {
		// If we can't show Turnstile, bail.
		if ( ! Functions::can_show_turnstile() ) {
			ob_start();
			$this->output_query_bypass_values();
			$query_vals = ob_get_clean();
			return $query_vals;
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
		return $html . '<div id="dlx-pmpro-turnstile"></div> . $query_vals';
	}

	/**
	 * Maybe enqueue scripts.
	 */
	public function maybe_enqueue_scripts() {
		if ( Functions::can_show_turnstile() ) {
			$this->enqueue_scripts();
		}
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
