<?php
/**
 * Plugin Name:       Paid Memberships Pro - Add Cloudflare Turnstile
 * Plugin URI:        https://dlxplugins.com/plugins/pmpro-turnstile/
 * Description:       Add Cloudflare Turnstile to your PMPro login and checkout forms.
 * Version:           1.0.7
 * Requires at least: 6.1
 * Requires PHP:      7.2
 * Author:            DLX Plugins
 * Author URI:        https://dlxplugins.com/plugins/pmpro-turnstile/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       alerts-dlx
 * Domain Path:       /languages
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

define( 'DLX_PMPRO_TURNSTILE_VERSION', '1.0.7' );
define( 'DLX_PMPRO_TURNSTILE_FILE', __FILE__ );
define( 'DLX_PMPRO_TURNSTILE_PRODUCT_ID', 36132 );

// Support for site-level autoloading.
if ( file_exists( __DIR__ . '/lib/autoload.php' ) ) {
	require_once __DIR__ . '/lib/autoload.php';
}

/**
 * Turnstile class.
 */
class PMProTurnstile {

	/**
	 * Holds the class instance.
	 *
	 * @var PMProTurnstile $instance
	 */
	private static $instance = null;

	/**
	 * Return an instance of the class
	 *
	 * Return an instance of the ReflectorDLX Class.
	 *
	 * @since 1.0.0
	 *
	 * @return PMProTurnstile class instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Class initializer.
	 */
	public function plugins_loaded() {
		load_plugin_textdomain(
			'dlx-pmpro-turnstile',
			false,
			basename( __DIR__ ) . '/languages'
		);

		// Enqueue cloudflare scripts.
		$enqueue = new Enqueue();
		$enqueue->run();

		// Set up Turnstile interface and actions.
		$turnstile = new Turnstile();
		$turnstile->run();

		// Set up the admin and options.
		$admin = new Admin();
		$admin->run();

		// Set up admin bar.
		$admin_bar = new Admin_Bar();
		$admin_bar->run();

		/**
		 * When Turnstile can be extended.
		 *
		 * Filter when Turnstile can be extended.
		 *
		 * @since 1.0.0
		 */
		do_action( 'dlx_pmpro_turnstile_loaded' );
	}

	/**
	 * Init all the things.
	 */
	public function login_init() {
		// We're only here for the login portion.
		$turnstile = new Turnstile();
		$turnstile->run();
	}
}

/**
 * Start your engines!
 */
add_action(
	'plugins_loaded',
	function () {
		// Check for pmpro activation.
		if ( ! Functions::is_activated( 'paid-memberships-pro/paid-memberships-pro.php' ) && ! function_exists( 'pmpro_getOption' ) ) {
			return;
		}

		// Begin loading in the plugin.
		$pmpro_turnstile = PMPROTurnstile::get_instance();
		$pmpro_turnstile->plugins_loaded();
	}
);

/**
 * For hooking into the default wp login screen (non-pmpro).
 */
add_action(
	'login_init',
	function () {
		$pmpro_turnstile = PMPROTurnstile::get_instance();
		$pmpro_turnstile->login_init();
	}
);

/* Setup plugin activation and redirection */
register_activation_hook( __FILE__, __NAMESPACE__ . '\on_plugin_activation' );
add_action( 'admin_init', __NAMESPACE__ . '\activate_redirect' );
/**
 * Determine if a user can be redirected or not.
 *
 * @return true if the user can be redirected. false if not.
 */
function can_redirect_on_activation() {
	/**
	 * Filter whether to redirect on plugin activation.
	 *
	 * @param bool $can_redirect Whether to redirect on plugin activation. Pass `false` to prevent redirect.
	 */
	$can_redirect = apply_filters( 'dlxplugins/pmproturnstile/can_redirect', true );
	if ( false === $can_redirect ) {
		return false;
	}

	// If plugin is activated in network admin options, skip redirect.
	if ( is_network_admin() ) {
		return false;
	}

	// Skip redirect if WP_DEBUG is enabled.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		return false;
	}

	// Check for dev mode.
	if ( function_exists( 'wp_get_development_mode' ) ) {
		if ( ! empty( wp_get_development_mode() ) ) {
			return false;
		}
	}

	// Determine if multi-activation is enabled.
	$maybe_multi = filter_input( INPUT_GET, 'activate-multi', FILTER_VALIDATE_BOOLEAN );
	if ( $maybe_multi ) {
		return false;
	}

	// See if cloudflare keys are already set.
	$options    = Options::get_options();
	$site_key   = $options['siteKey'];
	$secret_key = $options['secretKey'];
	if ( ! empty( $site_key ) && ! empty( $secret_key ) ) {
		return false;
	}

	// All is well. Can redirect.
	return true;
}

/**
 * Callback when the plugin is activated.
 */
function on_plugin_activation() {
	if ( can_redirect_on_activation() ) {
		// Add option for whether to redirect.
		add_option( 'dlx_pmpro_turnstile_redirect', sanitize_text_field( __FILE__ ) );
	}
}

/**
 * Redirect in the admin upon plugin activation.
 */
function activate_redirect() {
	if ( can_redirect_on_activation() && is_admin() ) {
		if ( __FILE__ === get_option( 'dlx_pmpro_turnstile_redirect' ) ) {
			delete_option( 'dlx_pmpro_turnstile_redirect' );
			wp_safe_redirect( esc_url_raw( add_query_arg( array( 'first_time_install' => true ), Functions::get_settings_url() ) ) );
			exit;
		}
	}
}
