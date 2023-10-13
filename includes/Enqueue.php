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
		add_action( 'login_head', array( $this, 'print_login_styles' ) );
	}

	/**
	 * Print login styles.
	 */
	public function print_login_styles() {
		?>
		<style>
		#dlx-pmpro-turnstile iframe {
			width: 100% !important;
			padding-bottom: 10px;
		}
		</style>
		<?php
	}
}
