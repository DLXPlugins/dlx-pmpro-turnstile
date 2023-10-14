<?php
/**
 * Admin Bar class.
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

/**
 * Admin_Bar class.
 */
class Admin_Bar {

	/**
	 * Class runner.
	 */
	public function run() {
		// Init the admin bar.
		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_menu' ), 1000 );
	}

	/**
	 * Add the admin bar menu.
	 *
	 * @param WP_Admin_Bar $admin_bar Admin bar reference.
	 */
	public function add_admin_bar_menu( $admin_bar ) {
		$options             = Options::get_options();
		$menu_helper_enabled = (bool) $options['enableMenuHelper'];
		if ( false === $menu_helper_enabled ) {
			return;
		}

		// Check permissions.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// This setting is only applicable on the PMPro checkout page. Bail if not on checkout.
		if ( ! is_page( pmpro_getOption( 'checkout_page_id' ) ) ) {
			// Only add the main node.
			$admin_bar->add_node(
				array(
					'id'     => 'dlx-pmpro-turnstile-menu',
					'parent' => 'paid-memberships-pro',
					'title'  => __( 'Turnstile', 'dlx-pmpro-turnstile' ),
					'href'   => Functions::get_settings_url(),
				)
			);
			return;
		}

		// Get turnstile enabled option url.
		$enable_turnstile_url = add_query_arg(
			array(
				'enable_turnstile' => '1',
				'nonce'            => wp_create_nonce( 'dlx-pmpro-turnstile-enable' ),
			)
		);

		// Get turnstile disabled option URL.
		$disable_turnstile_url = add_query_arg(
			array(
				'enable_turnstile' => '0',
				'nonce'            => wp_create_nonce( 'dlx-pmpro-turnstile-disable' ),
			)
		);

		// Enable Cloudflare menu.
		$admin_bar->add_node(
			array(
				'id'     => 'dlx-pmpro-turnstile-menu',
				'parent' => 'paid-memberships-pro',
				'title'  => __( 'Turnstile', 'dlx-pmpro-turnstile' ),
				'href'   => '',
			)
		);

		// Add settings URL child node.
		$admin_bar->add_node(
			array(
				'id'     => 'dlx-pmpro-turnstile-menu-settings',
				'parent' => 'dlx-pmpro-turnstile-menu',
				'title'  => __( 'Settings', 'dlx-pmpro-turnstile' ),
				'href'   => Functions::get_settings_url(),
			)
		);

		// Add child nodes.
		$admin_bar->add_node(
			array(
				'id'     => 'dlx-pmpro-turnstile-menu-enable',
				'parent' => 'dlx-pmpro-turnstile-menu',
				'title'  => __( 'Simulate Enabled', 'dlx-pmpro-turnstile' ),
				'href'   => $enable_turnstile_url,
			)
		);
		$admin_bar->add_node(
			array(
				'id'     => 'dlx-pmpro-turnstile-menu-disable',
				'parent' => 'dlx-pmpro-turnstile-menu',
				'title'  => __( 'Simulate Disabled', 'dlx-pmpro-turnstile' ),
				'href'   => $disable_turnstile_url,
			)
		);
	}
}
