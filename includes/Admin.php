<?php
/**
 * Admin class.
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

/**
 * Admin class.
 */
class Admin {

	/**
	 * Class runner.
	 */
	public function run() {
		// Init the admin menu.
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );

		// Enqueue scripts for the admin page.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// For redirecting from options screen to settings screen.
		add_action( 'current_screen', array( $this, 'redirect_to_settings' ) );

		// For retrieving the options.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_get_options', array( $this, 'ajax_get_options' ) );

		// For saving the options.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_save_options', array( $this, 'ajax_save_options' ) );

		// For resetting the options.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_reset_options', array( $this, 'ajax_reset_options' ) );

		// For getting license options.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_license_get_options', array( $this, 'ajax_license_get_options' ) );

		// For revoking a license.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_revoke_license', array( $this, 'ajax_revoke_license' ) );

		// For saving a license.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_save_license', array( $this, 'ajax_save_license' ) );

		// For initializing EDD license.
		add_action( 'admin_init', array( $this, 'init_license_system' ) );

		// For initializing settings links on the plugins screen.
		add_action( 'admin_init', array( $this, 'init_settings_links' ) );

		// For the admin preview.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_admin_preview', array( $this, 'ajax_admin_preview' ) );

		// For admin preview submit action.
		add_action( 'wp_ajax_dlx_pmpro_turnstile_admin_preview_validate', array( $this, 'ajax_admin_preview_validate' ) );
	}

	/**
	 * Validate a form submitted in the preview modal.
	 */
	public function ajax_admin_preview_validate() {
		// Do permissions check.
		$nonce = filter_input( INPUT_GET, 'nonce', FILTER_DEFAULT );
		if ( ! \wp_verify_nonce( $nonce, 'dlx-pmpro-turnstile-admin-preview-iframe') || ! current_user_can( 'manage_options' ) ) {
			\wp_send_json_error( array() );
		}

		// Get secret key.
		$secret_key = filter_input( INPUT_GET, 'secretKey', FILTER_DEFAULT );

		// Get token.
		$token = filter_input( INPUT_GET, 'turnstyleToken', FILTER_DEFAULT );

		$can_proceed = false;

		// Make sure token is valid.
		if ( $token ) {

			$cloudflare_endpoint_api = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

			// Build data envelope.
			$data = array(
				'secret'   => sanitize_text_field( $secret_key ),
				'response' => sanitize_text_field( $token ),
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

			// Success!
			if ( $can_proceed ) {
				\wp_send_json_success( array() );
			}
		}
		\wp_send_json_error( array() );
	}

	/**
	 * Redirect to settings screen. This menu is only for the options settings screen.
	 *
	 * @param object $screen The current screen object.
	 */
	public function redirect_to_settings( $screen ) {
		if ( 'settings_page_dlx-pmpro-turnstile-options' === $screen->id ) {
			\wp_safe_redirect( Functions::get_settings_url() );
			exit;
		}
	}

	/**
	 * Let's get the preview template.
	 */
	public function ajax_admin_preview() {
		// We're getting the template.
		$template_path = Functions::get_plugin_dir( 'templates/admin-preview.php' );
		if ( \file_exists( $template_path ) ) {
			include $template_path;
		}
		exit;
	}

	/**
	 * Initialize the setting links for the plugin page.
	 */
	public function init_settings_links() {
		$prefix = Functions::is_multisite() ? 'network_admin_' : '';
		add_action( $prefix . 'plugin_action_links_' . plugin_basename( DLX_PMPRO_TURNSTILE_FILE ), array( $this, 'plugin_settings_link' ) );
	}

	/**
	 * Adds plugin settings page link to plugin links in WordPress Dashboard Plugins Page
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Uses $prefix . "plugin_action_links_$plugin_file" action.
	 * @return array Array of settings
	 */
	public function plugin_settings_link( $settings ) {
		$setting_links = array(
			'settings' => sprintf( '<a href="%s">%s</a>', esc_url( Functions::get_settings_url() ), esc_html__( 'Settings', 'dlx-pmpro-turnstile' ) ),
			'docs'     => sprintf( '<a href="%s">%s</a>', esc_url( 'https://docs.dlxplugins.com/' ), esc_html__( 'Docs', 'dlx-pmpro-turnstile' ) ),
			'site'     => sprintf( '<a href="%s" style="color: #f60098;">%s</a>', esc_url( 'https://dlxplugins.com/plugins/pmpro-turnstile/' ), esc_html__( 'Plugin Home', 'dlx-pmpro-turnstile' ) ),
		);
		if ( ! is_array( $settings ) ) {
			return $setting_links;
		} else {
			return array_merge( $setting_links, $settings );
		}
	}

	/**
	 * Ajax revoke license.
	 */
	public function ajax_revoke_license() {
		if ( ! wp_verify_nonce( filter_input( INPUT_POST, 'nonce', FILTER_DEFAULT ), 'dlx-pmpro-turnstile-admin-license-revoke' ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array() );
		}

		$form_data = filter_input( INPUT_POST, 'formData', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
		if ( ! $form_data ) {
			wp_send_json_error( array() );
		}
		$form_data = Functions::sanitize_array_recursive( $form_data );

		// Get license.
		$license_key    = $form_data['licenseKey'] ?? '';
		$license_helper = new Plugin_License( $license_key );
		$response       = $license_helper->perform_action( 'deactivate_license', $license_key, true );

		// Overrride options.
		$options = Options::get_options();

		// Clear options.
		$options['licenseValid']     = false;
		$options['licenseActivated'] = false;
		$options['licenseKey']       = '';
		$options['licenseData']      = false;

		Options::update_options( $options );
		if ( $response['license_errors'] ) {
			$license_helper->set_activated_status( false );
			wp_send_json_error( $response );
		}

		$license_helper->set_activated_status( false );
		$options['licenseValid']     = false;
		$options['licenseActivated'] = false;
		$options['licenseKey']       = '';
		$options['licenseData']      = false;

		// Update options (force).
		Options::update_options( $options );

		wp_send_json_success( $options );
	}

	/**
	 * Save/Check a license key.
	 */
	public function ajax_save_license() {
		if ( ! wp_verify_nonce( filter_input( INPUT_POST, 'nonce', FILTER_DEFAULT ), 'dlx-pmpro-turnstile-admin-license-save' ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array() );
		}

		$form_data = filter_input( INPUT_POST, 'formData', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );
		if ( ! $form_data ) {
			wp_send_json_error( array() );
		}
		$form_data = Functions::sanitize_array_recursive( $form_data );

		// Get license.
		$license_key    = $form_data['licenseKey'] ?? '';
		$license_helper = new Plugin_License( $license_key );
		$response       = $license_helper->perform_action( 'activate_license', $license_key, true );

		if ( $response['license_errors'] ) {
			$license_helper->set_activated_status( false );
			wp_send_json_error( $response );
		}

		// Get latest options.
		$options                = Options::get_options( true );
		$options['licenseKey']  = $license_key;
		$options['licenseData'] = get_site_transient( 'dlxpmprocf_core_license_check', array() );
		wp_send_json_success( $options );
	}

	/**
	 * Allow for automatic updates.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function init_license_system() {
		$options = Options::get_options();

		$license_valid = $options['licenseValid'] ?? '';
		if ( isset( $options['licenseKey'] ) && 'valid' === $license_valid ) {
			// setup the updater.
			$edd_updater = new Plugin_Updater(
				'https://dlxplugins.com',
				__FILE__,
				array(
					'version' => Functions::get_plugin_version(),
					'license' => $options['licenseKey'],
					'item_id' => DLX_PMPRO_TURNSTILE_PRODUCT_ID,
					'author'  => 'Ronald Huereca',
					'beta'    => true,
					'url'     => home_url(),
				)
			);
		}
	}

	/**
	 * Get license options via Ajax.
	 */
	public function ajax_license_get_options() {
		// Get nonce.
		$nonce = sanitize_text_field( filter_input( INPUT_POST, 'nonce', FILTER_DEFAULT ) );

		// Verify nonce.
		$nonce_action = 'dlx-pmpro-turnstile-admin-license-get';
		if ( ! wp_verify_nonce( $nonce, $nonce_action ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array(
					'message'     => __( 'Nonce or permission verification failed.', 'dlx-pmpro-turnstile' ),
					'type'        => 'error',
					'dismissable' => true,
					'title'       => __( 'Error', 'dlx-pmpro-turnstile' ),
				)
			);
		}
		$options                = Options::get_options( true );
		$options['licenseData'] = get_site_transient( 'dlxpmprocf_core_license_check', array() );
		wp_send_json_success( $options );
	}

	/**
	 * Save the options via Ajax.
	 */
	public function ajax_save_options() {
		// Get form data.
		$form_data = filter_input( INPUT_POST, 'formData', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );

		$nonce = $form_data['saveNonce'] ?? false;
		if ( ! wp_verify_nonce( $nonce, 'dlx-pmpro-turnstile-admin-save-options' ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array(
					'message'     => __( 'Nonce or permission verification failed.', 'dlx-pmpro-turnstile' ),
					'type'        => 'critical',
					'dismissable' => true,
					'title'       => __( 'Error', 'dlx-pmpro-turnstile' ),
				)
			);
		}

		// Get array values.
		$form_data = Functions::sanitize_array_recursive( $form_data );

		// Update options.
		Options::update_options( $form_data );

		// Send success message.
		wp_send_json_success(
			array(
				'message'     => __( 'Options saved.', 'dlx-pmpro-turnstile' ),
				'type'        => 'success',
				'dismissable' => true,
			)
		);
	}

	/**
	 * Reset the options.
	 */
	public function ajax_reset_options() {
		// Get form data.
		$form_data = filter_input( INPUT_POST, 'formData', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );

		$nonce = $form_data['resetNonce'] ?? false;
		if ( ! wp_verify_nonce( $nonce, 'dlx-pmpro-turnstile-admin-reset-options' ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array(
					'message'     => __( 'Nonce or permission verification failed.', 'dlx-pmpro-turnstile' ),
					'type'        => 'error',
					'dismissable' => true,
					'title'       => __( 'Error', 'dlx-pmpro-turnstile' ),
				)
			);
		}

		// Get existing options.
		$options = Options::get_options();

		// Get defaults and reset.
		$default_options = Options::get_defaults();

		// Don't reset license.
		$license_keys = array(
			'licenseKey',
			'licenseValid',
			'licenseActivated',
			'licenseData',
		);
		foreach ( $license_keys as $license_key ) {
			$default_options[ $license_key ] = $options[ $license_key ];
		}

		Options::update_options( $default_options );

		// Pull in nonces to default options before returning.
		$default_options['saveNonce']  = $options['saveNonce'];
		$default_options['resetNonce'] = $options['resetNonce'];

		// Format empty arrays into false. This is so they can be reset at the form level.
		$default_options['membershipLevelsToExclude'] = false;
		$default_options['checkoutLevelsToExclude']   = false;

		// Send success message.
		wp_send_json_success(
			array(
				'message'     => __( 'Options reset.', 'dlx-pmpro-turnstile' ),
				'type'        => 'success',
				'dismissable' => true,
				'formData'    => $default_options,
			)
		);
	}

	/**
	 * Retrieve options via Ajax.
	 */
	public function ajax_get_options() {
		// Get nonce.
		$nonce = sanitize_text_field( filter_input( INPUT_POST, 'nonce', FILTER_DEFAULT ) );

		// Verify nonce.
		$nonce_action = 'dlx-pmpro-turnstile-admin-get-options';
		if ( ! wp_verify_nonce( $nonce, $nonce_action ) || ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array(
					'message'     => __( 'Nonce or permission verification failed.', 'dlx-pmpro-turnstile' ),
					'type'        => 'error',
					'dismissable' => true,
					'title'       => __( 'Error', 'dlx-pmpro-turnstile' ),
				)
			);
		}
		$options = Options::get_options();
		wp_send_json_success( $options );
	}

	/**
	 * Add the admin menu.
	 */
	public function add_admin_menu() {
		add_submenu_page(
			'pmpro-dashboard',
			__( 'Turnstile', 'pmpro-turnstile' ),
			__( 'Turnstile', 'pmpro-turnstile' ),
			'manage_options',
			'dlx-pmpro-turnstile',
			array( $this, 'admin_page' ),
			4
		);
		add_options_page(
			__( 'PMPro Turnstile', 'pmpro-turnstile' ),
			__( 'PMPro Turnstile', 'pmpro-turnstile' ),
			'manage_options',
			'dlx-pmpro-turnstile-options',
			'__return_false'
		);
	}

	/**
	 * Enqueue scripts for the admin page.
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_scripts( $hook ) {
		if ( 'memberships_page_dlx-pmpro-turnstile' !== $hook ) {
			return;
		}

		$current_tab = Functions::get_admin_tab();
		if ( null === $current_tab || 'settings' === $current_tab ) {
			// Enqueue main scripts.
			wp_enqueue_script(
				'dlx-pmpro-turnstile-admin',
				Functions::get_plugin_url( 'dist/dlx-pmpro-cloudflare-turnstile-admin.js' ),
				array(),
				Functions::get_plugin_version(),
				true
			);

			// Get all public membership levels for Paid Memberships Pro.
			$levels = pmpro_getAllLevels( true, true );

			wp_localize_script(
				'dlx-pmpro-turnstile-admin',
				'dlxPMProTurnstileAdmin',
				array(
					'getNonce'   => wp_create_nonce( 'dlx-pmpro-turnstile-admin-get-options' ),
					'saveNonce'  => wp_create_nonce( 'dlx-pmpro-turnstile-admin-save-options' ),
					'resetNonce' => wp_create_nonce( 'dlx-pmpro-turnstile-admin-reset-options' ),
					'previewNonce' => wp_create_nonce( 'dlx-pmpro-turnstile-admin-preview' ),
					'ajaxurl'	=> admin_url( 'admin-ajax.php' ),
					'levels'     => $levels,
				)
			);
		} elseif ( 'license' === $current_tab ) {
			wp_enqueue_script(
				'dlx-pmpro-turnstile-admin-license',
				Functions::get_plugin_url( 'dist/dlx-pmpro-cloudflare-turnstile-admin-license.js' ),
				array(),
				Functions::get_plugin_version(),
				true
			);
			wp_localize_script(
				'dlx-pmpro-turnstile-admin-license',
				'dlxPMProTurnstileAdminLicense',
				array(
					'getNonce'    => wp_create_nonce( 'dlx-pmpro-turnstile-admin-license-get' ),
					'saveNonce'   => wp_create_nonce( 'dlx-pmpro-turnstile-admin-license-save' ),
					'revokeNonce' => wp_create_nonce( 'dlx-pmpro-turnstile-admin-license-revoke' ),
				)
			);
		} elseif ( 'help' === $current_tab ) {
			wp_enqueue_script(
				'dlx-pmpro-turnstile-admin-help',
				Functions::get_plugin_url( 'dist/dlx-pmpro-cloudflare-turnstile-admin-help.js' ),
				array(),
				Functions::get_plugin_version(),
				true
			);
		}

		// Enqueue admin styles.
		wp_enqueue_style(
			'dlx-pmpro-turnstile-admin-css',
			Functions::get_plugin_url( 'dist/dlx-pmpro-cloudflare-turnstile-admin.css' ),
			array(),
			Functions::get_plugin_version(),
			'all'
		);
	}

	/**
	 * Render the admin page.
	 */
	public function admin_page() {
		?>
		<div class="dlx-pmpro-turnstile-admin-wrap">
			<header class="dlx-pmpro-turnstile-admin-header">
				<div class="dlx-pmpro-turnstile-logo">
					<h2 id="dlx-pmpro-turnstile-admin-header">
						<img src="<?php echo esc_url( Functions::get_plugin_url( 'assets/dlx-pmpro-banner.png' ) ); ?>" alt="PMPro Turnstile" />
					</h2>
				</div>
			</header>
			<?php
			$current_tab        = Functions::get_admin_tab();
			$settings_tab_class = array( 'nav-tab' );
			if ( null === $current_tab || 'settings' === $current_tab ) {
				$settings_tab_class[] = 'nav-tab-active';
			}
			$license_tab_class = array( 'nav-tab' );
			if ( 'license' === $current_tab ) {
				$license_tab_class[] = 'nav-tab-active';
			}
			$help_tab_class = array( 'nav-tab' );
			if ( 'help' === $current_tab ) {
				$help_tab_class[] = 'nav-tab-active';
			}
			?>
			<main class="dlx-pmpro-turnstile-admin-body-wrapper">
				<div class="has-admin-container-body">
					<nav class="nav-tab-wrapper">
						<a  class="<?php echo esc_attr( implode( ' ', $settings_tab_class ) ); ?>" href="<?php echo esc_url( Functions::get_settings_url() ); ?>"><?php esc_html_e( 'Settings', 'dlx-pmpro-turnstile' ); ?></a>
						<a  class="<?php echo esc_attr( implode( ' ', $license_tab_class ) ); ?>" href="<?php echo esc_url( Functions::get_settings_url( 'license' ) ); ?>"><?php esc_html_e( 'License', 'dlx-pmpro-turnstile' ); ?></a>
						<a  class="<?php echo esc_attr( implode( ' ', $help_tab_class ) ); ?>" href="<?php echo esc_url( Functions::get_settings_url( 'help' ) ); ?>"><?php esc_html_e( 'Help', 'dlx-pmpro-turnstile' ); ?></a>
					</nav>
				</div>
				<div class="dlx-pmpro-turnstile-body__content">
					<?php
					if ( null === $current_tab || 'settings' === $current_tab ) {
						?>
							<div id="dlx-pmpro-turnstile"></div>
						<?php
					} elseif ( 'license' === $current_tab ) {
						?>
							<div id="dlx-pmpro-turnstile-license"></div>
						<?php
					} elseif ( 'help' === $current_tab ) {
						?>
							<div id="dlx-pmpro-turnstile-help"></div>
						<?php
					}
					?>
				</div>
			</main>
		</div>
		<?php
	}
}
