<?php
/**
 * Helper functions for the plugin.
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

/**
 * Class Functions
 */
class Functions {

	/**
	 * Checks if the plugin is on a multisite install.
	 *
	 * @since 1.0.0
	 *
	 * @param bool $network_admin Check if in network admin.
	 *
	 * @return true if multisite, false if not.
	 */
	public static function is_multisite( $network_admin = false ) {
		if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
			require_once ABSPATH . '/wp-admin/includes/plugin.php';
		}
		$is_network_admin = false;
		if ( $network_admin ) {
			if ( is_network_admin() ) {
				if ( is_multisite() && is_plugin_active_for_network( self::get_plugin_slug() ) ) {
					return true;
				}
			} else {
				return false;
			}
		}
		if ( is_multisite() && is_plugin_active_for_network( self::get_plugin_slug() ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Checks to see if an asset is activated or not.
	 *
	 * @since 1.0.0
	 *
	 * @param string $path Path to the asset.
	 * @param string $type Type to check if it is activated or not.
	 *
	 * @return bool true if activated, false if not.
	 */
	public static function is_activated( $path, $type = 'plugin' ) {

		// Gets all active plugins on the current site.
		$active_plugins = self::is_multisite() ? get_site_option( 'active_sitewide_plugins' ) : get_option( 'active_plugins', array() );
		if ( in_array( $path, $active_plugins, true ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Determines if Cloudflare turnstile is enabled/can be shown.
	 */
	public static function can_show_turnstile() {
		global $pmpro_pages;

		// Get the current page object.
		$current_page = get_queried_object_id();

		$login_page_id    = self::get_login_page_id();
		$checkout_page_id = self::get_checkout_page_id();

		// Determine if we're on a login or checkout page. If not, bail.
		if ( ! in_array( $current_page, array( $login_page_id, $checkout_page_id ), true ) && ! is_login() ) {
			return false;
		}

		// IF we're on the login page, check if we should show the turnstile.
		if ( $current_page === $login_page_id || is_login() ) { // is_login introduced in WP 6.1.
			$is_turnstile_enabled_on_login = true; // todo: make option.

			// Skip if query var is to exclude turnstile.
			$query_hash = filter_input( INPUT_GET, 'pmpro_turnstile_debug', FILTER_DEFAULT );

			$saved_query_hash = '123';

			$is_cloudflare_debug_enabled = true; // todo: make option.

			// IF debug is on and hashes match, do not show turnstile.
			if ( $is_cloudflare_debug_enabled && $query_hash === $saved_query_hash ) {
				return false;
			}

			// Get the login page context.
			$pmpro_login_page_context = 'pmprologin';
			if ( is_login() ) {
				$pmpro_login_page_context = 'wplogin';
			}

			/**
			 * Filter whether to show the turnstile.
			 *
			 * @since 1.0.0
			 *
			 * @param bool   $can_show Whether to show the turnstile.
			 * @param string $page     The page we're on.
			 */
			return apply_filters( 'dlx_pmpro_turnstile_can_show', true, $pmpro_login_page_context );
		}

		// We are on the checkout page. Let's set some vars.
		$current_user_level           = 0;
		$membership_levels_to_exclude = array(); // todo: make option.
		$is_logged_in                 = \is_user_logged_in();

		// If user is logged in, get level.
		if ( $is_logged_in ) {

			// If admin, bail.
			if ( current_user_can( 'manage_options' ) ) {
				return false;
			}
			$current_user_level = pmpro_getMembershipLevelForUser( get_current_user_id() );
		}

		// If user is logged in and has a level, check if they should be excluded.
		if ( $is_logged_in && ! empty( $current_user_level ) ) {

			// If user has a level, check if they should be excluded.
			if ( in_array( $current_user_level->id, $membership_levels_to_exclude, true ) ) {
				return false;
			}
		}

		// Get the current checkout level.
		global $pmpro_level;
		$checkout_level = absint( $pmpro_level->id ?? 0 );

		// Get checkout levels to exclude.
		$checkout_levels_to_exclude = array(); // todo: make option.

		// If checkout level is in the exclude array, bail.
		if ( in_array( $checkout_level, $checkout_levels_to_exclude, true ) ) {
			return false;
		}

		/**
		 * Filter whether to show the turnstile.
		 *
		 * @since 1.0.0
		 *
		 * @param bool   $can_show Whether to show the turnstile.
		 * @param string $page     The page we're on.
		 */
		return apply_filters( 'dlx_pmpro_turnstile_can_show', true, 'checkout' );
	}

	/**
	 * Retrieve the login page ID.
	 *
	 * @return int The login page ID.
	 */
	public static function get_login_page_id() {
		global $pmpro_pages;
		$login_page_id = $pmpro_pages['login'] ?? 0;
		return absint( $login_page_id );
	}

	/**
	 * Retrieve the checkout page ID.
	 *
	 * @return int The Checkout page ID.
	 */
	public static function get_checkout_page_id() {
		global $pmpro_pages;
		$checkout_page_id = $pmpro_pages['checkout'] ?? 0;
		return absint( $checkout_page_id );
	}

	/**
	 * Return the plugin slug.
	 *
	 * @return string plugin slug.
	 */
	public static function get_plugin_slug() {
		return dirname( plugin_basename( DLX_PMPRO_TURNSTILE_FILE ) );
	}

	/**
	 * Return the version for the plugin.
	 *
	 * @return float version for the plugin.
	 */
	public static function get_plugin_version() {
		return DLX_PMPRO_TURNSTILE_VERSION;
	}

	/**
	 * Returns appropriate html for KSES.
	 *
	 * @param bool $svg Whether to add SVG data to KSES.
	 */
	public static function get_kses_allowed_html( $svg = true ) {
		$allowed_tags = wp_kses_allowed_html();

		$allowed_tags['nav']        = array(
			'class' => array(),
		);
		$allowed_tags['a']['class'] = array();

		if ( ! $svg ) {
			return $allowed_tags;
		}
		$allowed_tags['svg'] = array(
			'xmlns'       => array(),
			'fill'        => array(),
			'viewbox'     => array(),
			'role'        => array(),
			'aria-hidden' => array(),
			'focusable'   => array(),
			'class'       => array(),
		);

		$allowed_tags['path'] = array(
			'd'       => array(),
			'fill'    => array(),
			'opacity' => array(),
		);

		$allowed_tags['g'] = array();

		$allowed_tags['use'] = array(
			'xlink:href' => array(),
		);

		$allowed_tags['symbol'] = array(
			'aria-hidden' => array(),
			'viewBox'     => array(),
			'id'          => array(),
			'xmls'        => array(),
		);

		return $allowed_tags;
	}

	/**
	 * Get the plugin directory for a path.
	 *
	 * @param string $path The path to the file.
	 *
	 * @return string The new path.
	 */
	public static function get_plugin_dir( $path = '' ) {
		$dir = rtrim( plugin_dir_path( DLX_PMPRO_TURNSTILE_FILE ), '/' );
		if ( ! empty( $path ) && is_string( $path ) ) {
			$dir .= '/' . ltrim( $path, '/' );
		}
		return $dir;
	}

	/**
	 * Return a plugin URL path.
	 *
	 * @param string $path Path to the file.
	 *
	 * @return string URL to to the file.
	 */
	public static function get_plugin_url( $path = '' ) {
		$dir = rtrim( plugin_dir_url( DLX_PMPRO_TURNSTILE_FILE ), '/' );
		if ( ! empty( $path ) && is_string( $path ) ) {
			$dir .= '/' . ltrim( $path, '/' );
		}
		return $dir;
	}
}
