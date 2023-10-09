<?php
/**
 * Plugin Name:       Paid Memberships Pro - Add Cloudflare Turnstile
 * Plugin URI:        https://dlxplugins.com/plugins/pmpro-turnstile/
 * Description:       Add Cloudflare Turnstile to your PMPro login and checkout forms.
 * Version:           1.0.0
 * Requires at least: 6.1
 * Requires PHP:      7.2
 * Author:            DLX Plugins
 * Author URI:        https://dlxplugins.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       alerts-dlx
 * Domain Path:       /languages
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

define( 'DLX_PMPRO_TURNSTILE_VERSION', '1.0.0' );
define( 'DLX_PMPRO_TURNSTILE_FILE', __FILE__ );

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

add_action(
	'plugins_loaded',
	function () {
		$pmpro_turnstile = PMPROTurnstile::get_instance();
		$pmpro_turnstile->plugins_loaded();
	}
);

add_action(
	'login_init',
	function () {
		$pmpro_turnstile = PMPROTurnstile::get_instance();
		$pmpro_turnstile->login_init();
	}
);
