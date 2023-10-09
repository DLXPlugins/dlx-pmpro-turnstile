<?php
/**
 * Enqueue scripts and styles.
 *
 * @package PMProTurnstile
 */

namespace DLXPlugins\PMProTurnstile;

/**
 * Enqueue class.
 */
class Enqueue {

	/**
	 * Class runner.
	 */
	public function run() {
		add_action( 'pmpro_checkout_before_submit_button', array( $this, 'enqueue_cloudflare_script' ) );
	}

	/**
	 * Enqueue the Cloudflare Turnstile script in the footer.
	 */
	public function enqueue_cloudflare_script() {
		// Get current page for Paid Memberships Pro.
		global $pmpro_pages;
		$current_page = get_queried_object_id();

		// If we can't show Turnstile, bail.
		if ( ! Functions::can_show_turnstile() ) {
			return;
		}
	}
}
