<?php
// abspath check.
if ( ! defined( 'ABSPATH' ) || ! current_user_can( 'manage_options' ) ) {
	exit;
}

// POST variables are in scope here.

$nonce = filter_input( INPUT_GET, 'nonce', FILTER_DEFAULT );
if ( ! wp_verify_nonce( $nonce, 'dlx-pmpro-turnstile-admin-preview' ) ) {
	exit;
}

$site_key          = sanitize_text_field( filter_input( INPUT_GET, 'siteKey', FILTER_DEFAULT ) );
$secret_key        = sanitize_text_field( filter_input( INPUT_GET, 'secretKey', FILTER_DEFAULT ) );
$language          = sanitize_text_field( filter_input( INPUT_GET, 'language', FILTER_DEFAULT ) );
$widget_appearance = sanitize_text_field( filter_input( INPUT_GET, 'widgetAppearance', FILTER_DEFAULT ) );
$widget_theme      = sanitize_text_field( filter_input( INPUT_GET, 'widgetTheme', FILTER_DEFAULT ) );
$widget_size       = sanitize_text_field( filter_input( INPUT_GET, 'widgetSize', FILTER_DEFAULT ) );

// Let's start laying dowm some HTML.
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>PMPro Turnstile Admin Preview</title>
	<style>
		body {
			font-family: Verdana, Geneva, Tahoma, sans-serif;
		}
		h2 {
			font-family:Arial, Helvetica, sans-serif;
			font-size: 26px;
		}
		input[type="submit"] {
			display: inline-block;
			padding: 10px 20px;
			margin-top: 15px;
		}
		.notice {
			margin-top: 15px;
			padding: 8px 10px;
		}
		.notice-success {
			background: #eaf5ea;
			border-left: 4px solid #49a939;
		}
		.notice-error {
			background: #f5e5e4;
			border-left: 4px solid #bc2b2c;
		}
	</style>
</head>
<body>
	<div id="preview-form">
		<?php
		$preview_validate_ajax_url = admin_url( 'admin-ajax.php' );

		// Add secret key to URL.
		$preview_validate_ajax_url = add_query_arg(
			array(
				'action'    => 'dlx_pmpro_turnstile_admin_preview_validate',
				'secretKey' => $secret_key,
				'nonce'     => wp_create_nonce( 'dlx-pmpro-turnstile-admin-preview-iframe' ),
			),
			$preview_validate_ajax_url
		);
		?>
		<form id="dlx-pmpro-turnstile-preview-form" method="POST" action="<?php echo esc_url_raw( $preview_validate_ajax_url ); ?>">
			<h2>Turnstile Preview</h2>
			<p>Please complete the challenge (if any) and submit to test if your keys work.</p>
			<div id="dlx-pmpro-turnstile-placeholder"></div>
			<input type="submit" value="Submit to Test" disabled="disabled" />
		</form>
	</div>
	<?php
		// Enqueue the preview/validation script.
		wp_register_script(
			'dlx-pmpro-turnstile-admin-preview',
			plugins_url( 'dist/dlx-pmpro-cloudflare-turnstile-preview-modal.js', DLX_PMPRO_TURNSTILE_FILE ),
			array(),
			DLX_PMPRO_TURNSTILE_VERSION,
		);
		wp_print_scripts( 'dlx-pmpro-turnstile-admin-preview' );
		wp_enqueue_script(
			'dlx-pmpro-turnstile-cf',
			'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onLoadDLXPMProPreviewCallback',
			array(),
			DLX_PMPRO_TURNSTILE_VERSION,
			true
		);
		wp_localize_script(
			'dlx-pmpro-turnstile-cf',
			'dlxCF',
			array(
				'nonce'      => wp_create_nonce( 'dlx-pmpro-turnstile-admin-preview-submit' ),
				'siteKey'    => $site_key,
				'secretKey'  => $secret_key,
				'language'   => $language,
				'appearance' => $widget_appearance,
				'theme'      => $widget_theme,
				'size'       => $widget_size,
			)
		);
		wp_print_scripts( 'dlx-pmpro-turnstile-cf' );

		?>
</body>
</html>
