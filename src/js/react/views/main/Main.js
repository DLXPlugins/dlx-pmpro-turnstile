// eslint-disable-next-line no-unused-vars
import React, { Suspense, useState } from 'react';
import {
	ToggleControl,
	TextControl,
	CheckboxControl,
	BaseControl,
	SelectControl,
	PanelBody,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useForm, Controller, useWatch, useFormState } from 'react-hook-form';
import { useAsyncResource } from 'use-async-resource';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation as TriangleExclamation, faCircleCheck as CircleCheck, faEye } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation as CircularExclamation } from '@fortawesome/free-solid-svg-icons/faCircleExclamation';
import classNames from 'classnames';
import { Fancybox } from '@fancyapps/ui';

// Local imports.
import SendCommand from '../../utils/SendCommand';
import Notice from '../../components/Notice';
import SaveResetButtons from '../../components/SaveResetButtons';

/**
 * Retrieve all levels and format into token format.
 */
const levels = dlxPMProTurnstileAdmin.levels;

// Get levels into name: { id: id, name: name } format.
const levelNamesToIds = [];

// Loop through levels and create an array of objects with name and id.
Object.values( levels ).forEach( ( level ) => {
	levelNamesToIds[ level.name ] = { id: parseInt( level.id ), name: level.name };
} );

const retrieveOptions = () => {
	return SendCommand( 'dlx_pmpro_turnstile_get_options', {
		nonce: dlxPMProTurnstileAdmin.getNonce,
	} );
};

const Main = ( props ) => {
	const [ defaults ] = useAsyncResource(
		retrieveOptions,
		[]
	);
	return (
		<Suspense
			fallback={
				<>
					<h2>{ __( 'Loading…', 'dlx-pmpro-turnstile' ) }</h2>
				</>
			}
		>
			<Interface defaults={ defaults } { ...props } />
		</Suspense>
	);
};

const Interface = ( props ) => {
	const { defaults } = props;
	const response = defaults();
	const { data } = response.data;

	const [ licenseValid ] = useState( data.licenseValid );

	const {
		control,
		handleSubmit,
		getValues,
		reset,
		setError,
		trigger,
	} = useForm( {
		defaultValues: {
			enabled: data.enabled,
			enabledPMProLoginForm: data.enabledPMProLoginForm,
			enabledWPLoginForm: data.enabledWPLoginForm,
			enabledCheckoutForm: data.enabledCheckoutForm,
			siteKey: data.siteKey,
			secretKey: data.secretKey,
			language: data.language,
			widgetAppearance: data.widgetAppearance,
			widgetTheme: data.widgetTheme,
			widgetSize: data.widgetSize,
			enabledWPPasswordResetForm: data.enabledWPPasswordResetForm,
			enabledPMProPasswordForm: data.enabledPMProPasswordForm,
			excludedMembershipLevels: data.excludedMembershipLevels ?? [],
			excludedCheckoutLevels: data.excludedCheckoutLevels ?? [],
			saveNonce: dlxPMProTurnstileAdmin.saveNonce,
			resetNonce: dlxPMProTurnstileAdmin.resetNonce,
			enableMenuHelper: data.enableMenuHelper,
			enableLicenseAlerts: data.enableLicenseAlerts,
			enableQueryBypass: data.enableQueryBypass,
			queryBypassKey: data.queryBypassKey,
			queryBypassValue: data.queryBypassValue,
		},
	} );
	const formValues = useWatch( { control } );
	const { errors, isDirty, dirtyFields } = useFormState( {
		control,
	} );

	// Retrieve a prompt based on the license status.
	const getPrompt = () => {
		// Check to see if the license nag is disabled.
		if ( 'valid' === licenseValid && ! getValues( 'enableLicenseAlerts' ) ) {
			return null;
		}
		if ( 'valid' === licenseValid ) {
			return (
				<Notice
					message={ __( 'Thank you for supporting this plugin. Your license key is active and you are receiving updates and support.', 'dlx-pmpro-turnstile' ) }
					status="success"
					politeness="assertive"
					inline={ false }
					icon={ () => <FontAwesomeIcon icon={ CircleCheck } style={ { color: 'currentColor' } } /> }
				/>
			);
		}
		return (
			<Notice
				message={ __( 'Your license key is not active. Please activate your license key to receive updates and support.', 'dlx-pmpro-turnstile' ) }
				status="warning"
				politeness="assertive"
				inline={ false }
				icon={ () => <FontAwesomeIcon size="1x" icon={ TriangleExclamation } style={ { color: 'currentColor' } } /> }
			/>
		);
	};

	const getPreviewButton = () => {
		const siteKey = getValues( 'siteKey' );
		const secretKey = getValues( 'secretKey' );

		// If both site key and secret key have content, show the preview button.
		if ( siteKey && secretKey ) {
			return (
				<div className="dlx-admin-component-row-button">
					<Button
						label={ __( 'Preview Turnstile', 'dlx-pmpro-turnstile' ) }
						className="dlx-admin__button dlx__btn-white"
						onClick={ () => {
							// Build a URL from admin-ajax.
							const adminAjaxUrl = dlxPMProTurnstileAdmin.ajaxurl; // Can't use global `ajaxurl` here because `ajaxurl` is a relative path.

							// Add query params to adminAjaxUrl.
							const url = new URL( adminAjaxUrl );
							url.searchParams.set( 'action', 'dlx_pmpro_turnstile_admin_preview' );
							url.searchParams.set( 'nonce', dlxPMProTurnstileAdmin.previewNonce );
							url.searchParams.set( 'siteKey', formValues.siteKey );
							url.searchParams.set( 'secretKey', formValues.secretKey );
							url.searchParams.set( 'language', formValues.language );
							url.searchParams.set( 'widgetAppearance', formValues.widgetAppearance );
							url.searchParams.set( 'widgetTheme', formValues.widgetTheme );
							url.searchParams.set( 'widgetSize', formValues.widgetSize );

							// Let's get the URL.
							const iframeAjaxUrl = url.toString();

							// Launch iframe in fancybox.
							Fancybox.show( [ {
								src: iframeAjaxUrl,
								type: 'iframe',
								autoStart: false,
								id: 'dlx-pmpro-turnstile-preview',
							} ] );
						} }
						icon={ <FontAwesomeIcon size="1x" icon={ faEye } style={ { color: 'currentColor' } } /> }
						iconSize="1x"

					>
						{ __( 'Preview', 'dlx-pmpro-turnstile' ) }
					</Button>
				</div>
			);
		}
	};

	// Get a panel body and display the keys within.
	const getKeyDrawer = () => {
		return (
			<>
				<div className="dlx-admin__row">
					<PanelBody
						title={ __( 'Cloudflare Turnstile Test Keys', 'dlx-pmpro-turnstile' ) }
						initialOpen={ false }
					>
						<div className="dlx-panel-body__content">
							<p className="description">
								{ __( 'Use these keys if you need to test Cloudflare locally or as a test.', 'dlx-pmpro-turnstile' ) }
							</p>
							<table className="form-table">
								<thead>
									<tr>
										<th scope="col">{ __( 'Site Key', 'dlx-pmpro-turnstile' ) }</th>
										<th scope="col">{ __( 'Description', 'dlx-pmpro-turnstile' ) }</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>1x00000000000000000000AA</td>
										<td>{ __( 'Always passes', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
									<tr>
										<td>1x00000000000000000000AA</td>
										<td>{ __( 'Always blocks', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
									<tr>
										<td>1x00000000000000000000AA</td>
										<td>{ __( 'Forces interactive challenge', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
								</tbody>
							</table>
							<table className="form-table">
								<thead>
									<tr>
										<th scope="col">{ __( 'Secret Key', 'dlx-pmpro-turnstile' ) }</th>
										<th scope="col">{ __( 'Description', 'dlx-pmpro-turnstile' ) }</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>1x0000000000000000000000000000000AA</td>
										<td>{ __( 'Always passes', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
									<tr>
										<td>2x0000000000000000000000000000000AA</td>
										<td>{ __( 'Always fails', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
									<tr>
										<td>3x0000000000000000000000000000000AA</td>
										<td>{ __( 'Forces "token already spent" error', 'dlx-pmpro-turnstile' ) }</td>
									</tr>
								</tbody>
							</table>
						</div>
					</PanelBody>
				</div>
			</>
		);
	};

	return (
		<>
			<div className="dlx-pmpro-turnstile-admin-content-heading">
				<h1><span className="dlx-pmpro-turnstile-content-heading-text">{ __( 'Turnstile Settings for Paid Membership Pro', 'dlx-pmpro-turnstile' ) }</span></h1>
				<p className="description">
					{
						__( 'Configure the settings for the Cloudflare Turnstile integration with Paid Membership Pro.', 'dlx-pmpro-turnstile' )
					}
				</p>
				{
					getPrompt()
				}
			</div>
			{ /* eslint-disable-next-line no-unused-vars */ }
			<form onSubmit={ handleSubmit( ( formData ) => { } ) }>
				<div id="dlx-pmpro-turnstile-admin-table">
					<table className="form-table form-table-row-sections">
						<tbody>
							<tr>
								<th scope="row">{ __( 'Enable Cloudflare Turnstile', 'dlx-pmpro-turnstile' ) }</th>
								<td>
									<Controller
										name="enabled"
										control={ control }
										render={ ( { field: { onChange, value } } ) => (
											<ToggleControl
												label={ __( 'Enable Cloudflare Turnstile', 'dlx-pmpro-turnstile' ) }
												className="dlx-admin__toggle-control"
												checked={ value }
												onChange={ ( boolValue ) => {
													onChange( boolValue );
												} }
												help={ __(
													'Allow Cloudflare Turnstile to be enabled or disabled site-wide.',
													'dlx-pmpro-turnstile'
												) }
											/>
										) }
									/>
								</td>
							</tr>
							<tr>
								<th scope="row">
									{ __( 'Cloudflare Turnstile Credentials', 'dlx-pmpro-turnstile' ) }
								</th>
								<td>
									<div className="dlx-admin__row">
										<Controller
											name="siteKey"
											control={ control }
											rules={ { required: true } }
											render={ ( { field: { onChange, value } } ) => (
												<>
													<TextControl
														label={ __( 'Site Key', 'dlx-pmpro-turnstile' ) }
														className="dlx-admin__text-control"
														value={ value }
														onChange={ ( stringValue ) => {
															onChange( stringValue );
														} }
														help={ __(
															'Your Cloudflare Turnstile Site Key.',
															'dlx-pmpro-turnstile'
														) }
													/>
													{ 'required' === errors.siteKey?.type && (
														<Notice
															message={ __( 'This field is a required field.', 'dlx-pmpro-turnstile' ) }
															status="error"
															politeness="assertive"
															inline={ true }
															icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
														/>
													) }
												</>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="secretKey"
											rules={ { required: true } }
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<>
													<TextControl
														label={ __( 'Secret Key', 'dlx-pmpro-turnstile' ) }
														className="dlx-admin__text-control"
														value={ value }
														onChange={ ( stringValue ) => {
															onChange( stringValue );
														} }
														help={ __(
															'Your Cloudflare Turnstile Secret Key.',
															'dlx-pmpro-turnstile'
														) }
													/>
													{ 'required' === errors.secretKey?.type && (
														<Notice
															message={ __( 'This field is a required field.', 'dlx-pmpro-turnstile' ) }
															status="error"
															politeness="assertive"
															inline={ true }
															icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
														/>
													) }
												</>
											) }
										/>
									</div>
									{ getPreviewButton() }
									{ getKeyDrawer() }
								</td>
							</tr>
							<tr>
								<th scope="row">
									{ __( 'Appearance', 'dlx-pmpro-turnstile' ) }
								</th>
								<td>
									<div className="dlx-admin__row">
										<Controller
											name="widgetTheme"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<SelectControl
													label={ __( 'Choose a Widget Theme', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__select-control"
													value={ value }
													onChange={ ( stringValue ) => {
														onChange( stringValue );
													} }
													options={ [
														/* light, dark, auto */
														{ label: __( 'Auto', 'dlx-pmpro-turnstile' ), value: 'auto' },
														{ label: __( 'Light', 'dlx-pmpro-turnstile' ), value: 'light' },
														{ label: __( 'Dark', 'dlx-pmpro-turnstile' ), value: 'dark' },
													] }
													help={ __(
														'Your Cloudflare Turnstile Widget Theme. If you select `auto`, the widget will automatically change between light and dark based on the user’s operating system preference.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="widgetAppearance"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<SelectControl
													label={ __( 'Visibility', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__select-control"
													value={ value }
													onChange={ ( stringValue ) => {
														onChange( stringValue );
													} }
													options={ [
														/* light, dark, auto */
														{ label: __( 'Show Always', 'dlx-pmpro-turnstile' ), value: 'always' },
														{ label: __( 'Invisible', 'dlx-pmpro-turnstile' ), value: 'interaction-only' },
													] }
													help={ __(
														'Set whether the widget is visible or invisible. Users can still be presented with a challenge if the widget is invisible.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="widgetSize"
											control={ control }
											rules={ { required: true } }
											render={ ( { field: { onChange, value } } ) => (
												<SelectControl
													label={ __( 'Widget Size', 'dlx-pmpro-turnstile' ) }
													help={ __(
														'Select the size for the widget.',
														'dlx-pmpro-turnstile'
													) }
													value={ value }
													options={ [
														/* normal, compact */
														{ label: __( 'Normal', 'dlx-pmpro-turnstile' ), value: 'normal' },
														{ label: __( 'Compact', 'dlx-pmpro-turnstile' ), value: 'compact' },
													] }
													onChange={ ( widgetSizeValue ) => {
														onChange( widgetSizeValue );
													} }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="language"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<SelectControl
													label={ __( 'Language', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__select-control"
													value={ value }
													onChange={ ( stringValue ) => {
														onChange( stringValue );
													} }
													options={ [

														{ value: 'ar', label: __( 'Arabic', 'dlx-pmpro-turnstile' ) },
														{ value: 'ar-eg', label: __( 'Arabic (Egypt)', 'dlx-pmpro-turnstile' ) },
														{ value: 'zh', label: __( 'Chinese', 'dlx-pmpro-turnstile' ) },
														{ value: 'zh-cn', label: __( 'Chinese (Simplified)', 'dlx-pmpro-turnstile' ) },
														{ value: 'zh-tw', label: __( 'Chinese (Traditional)', 'dlx-pmpro-turnstile' ) },
														{ value: 'nl', label: __( 'Dutch', 'dlx-pmpro-turnstile' ) },
														{ value: 'en', label: __( 'English', 'dlx-pmpro-turnstile' ) },
														{ value: 'fa', label: __( 'Farsi', 'dlx-pmpro-turnstile' ) },
														{ value: 'fr', label: __( 'French', 'dlx-pmpro-turnstile' ) },
														{ value: 'de', label: __( 'German', 'dlx-pmpro-turnstile' ) },
														{ value: 'id', label: __( 'Indonesian', 'dlx-pmpro-turnstile' ) },
														{ value: 'it', label: __( 'Italian', 'dlx-pmpro-turnstile' ) },
														{ value: 'ja', label: __( 'Japanese', 'dlx-pmpro-turnstile' ) },
														{ value: 'ko', label: __( 'Korean', 'dlx-pmpro-turnstile' ) },
														{ value: 'tlh', label: __( 'Klingon', 'dlx-pmpro-turnstile' ) },
														{ value: 'pl', label: __( 'Polish', 'dlx-pmpro-turnstile' ) },
														{ value: 'pt', label: __( 'Portuguese', 'dlx-pmpro-turnstile' ) },
														{ value: 'pt-br', label: __( 'Portuguese (Brazil)', 'dlx-pmpro-turnstile' ) },
														{ value: 'ru', label: __( 'Russian', 'dlx-pmpro-turnstile' ) },
														{ value: 'es', label: __( 'Spanish', 'dlx-pmpro-turnstile' ) },
														{ value: 'tr', label: __( 'Turkish', 'dlx-pmpro-turnstile' ) },
														{ value: 'uk', label: __( 'Ukrainian', 'dlx-pmpro-turnstile' ) },
														{ value: 'uk-ua', label: __( 'Ukrainian (Ukraine)', 'dlx-pmpro-turnstile' ) },
													]
													}
													help={ __(
														'Your Cloudflare Turnstile Language.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
								</td>
							</tr>
							<tr>
								<th scope="row">
									{ __( 'Login Forms', 'dlx-pmpro-turnstile' ) }
								</th>
								<td>
									<div className="dlx-admin__row">
										<Controller
											name="enabledPMProLoginForm"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'PMPro Login Form', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Enable Cloudflare Turnstile on the PMPro Login Form.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="enabledWPLoginForm"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'WP Login Form', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Enable Cloudflare Turnstile on the default WP Login Form.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="enabledPMProPasswordForm"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'PMPro Password Reset Form', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Enable Cloudflare Turnstile on the Paid Memberships Pro password reset screen.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									<div className="dlx-admin__row">
										<Controller
											name="enabledWPPasswordResetForm"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'WP Password Reset Form', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Enable Cloudflare Turnstile on the default password reset screen.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
								</td>
							</tr>
							<tr>
								<th scope="row">
									{ __( 'Checkout Form', 'dlx-pmpro-turnstile' ) }
								</th>
								<td>
									<div className="dlx-admin__row">
										<Controller
											name="enabledCheckoutForm"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'Checkout Form', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Enable Cloudflare Turnstile on the PMPro Checkout Form.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									{ getValues( 'enabledCheckoutForm' ) && (
										<>
											<div className="dlx-admin__row">
												<BaseControl
													id="excludedMembershipLevelsBase"
													label={ __( 'User Membership Levels to Skip', 'dlx-pmpro-turnstile' ) }
													help={ __(
														'If a user is signed in and has one of these membership levels, they will not be shown the Turnstile challenge.',
														'dlx-pmpro-turnstile'
													) }
												>
													{
														Object.values( levelNamesToIds ).map( ( level ) => {
															const levelId = level.id;
															const excludedLevels = getValues( 'excludedMembershipLevels' );
															const currentValue = excludedLevels[ levelId ] ?? false;
															return (
																<Controller
																	key={ levelId }
																	name={ `excludedMembershipLevels[${ levelId }]` }
																	control={ control }
																	render={ ( { field: { onChange } } ) => (
																		<CheckboxControl
																			label={ level.name }
																			className="dlx-admin__checkbox-control"
																			checked={ currentValue }
																			onChange={ ( boolValue ) => {
																				onChange( boolValue );
																			} }
																		/>
																	) }
																/>
															);
														} )
													}
												</BaseControl>
											</div>
											<div className="dlx-admin__row">
												<BaseControl
													id="excludedCheckoutLevelsBase"
													label={ __( 'Checkout Membership Levels to Skip', 'dlx-pmpro-turnstile' ) }
													help={ __(
														'If someone tries to check out with this level, they will not be shown the Turnstile challenge.',
														'dlx-pmpro-turnstile'
													) }
												>
													{
														Object.values( levelNamesToIds ).map( ( level ) => {
															const levelId = level.id;
															const excludedLevels = getValues( 'excludedCheckoutLevels' );
															const currentValue = excludedLevels[ levelId ] ?? false;
															return (
																<Controller
																	key={ levelId }
																	name={ `excludedCheckoutLevels[${ levelId }]` }
																	control={ control }
																	render={ ( { field: { onChange } } ) => (
																		<CheckboxControl
																			label={ level.name }
																			className="dlx-admin__checkbox-control"
																			checked={ currentValue }
																			onChange={ ( boolValue ) => {
																				onChange( boolValue );
																			} }
																		/>
																	) }
																/>
															);
														} )
													}
												</BaseControl>
											</div>
										</>
									) }
								</td>
							</tr>
							<tr>
								<th scope="row">
									{ __( 'Advanced', 'dlx-pmpro-turnstile' ) }
								</th>
								<td>
									<div className="dlx-admin__row">
										<Controller
											name="enableMenuHelper"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'Enable Admin Bar Shortcuts', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Allow a shortcut in the admin bar menu for accessing Turnstile settings.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									{ 'valid' === licenseValid && (
										<div className="dlx-admin__row">
											<Controller
												name="enableLicenseAlerts"
												control={ control }
												render={ ( { field: { onChange, value } } ) => (
													<ToggleControl
														label={ __( 'Disable License Status', 'dlx-pmpro-turnstile' ) }
														className="dlx-admin__toggle-control"
														checked={ value }
														onChange={ ( boolValue ) => {
															onChange( boolValue );
														} }
														help={ __(
															'Disable the license status update notification on this screen.',
															'dlx-pmpro-turnstile'
														) }
													/>
												) }
											/>
										</div>
									) }
									<div className="dlx-admin__row">
										<Controller
											name="enableQueryBypass"
											control={ control }
											render={ ( { field: { onChange, value } } ) => (
												<ToggleControl
													label={ __( 'Enable Query Bypass', 'dlx-pmpro-turnstile' ) }
													className="dlx-admin__toggle-control"
													checked={ value }
													onChange={ ( boolValue ) => {
														onChange( boolValue );
													} }
													help={ __(
														'Allow a query parameter to bypass Turnstile. This is useful for testing or if the Turnstile challenge is not working.',
														'dlx-pmpro-turnstile'
													) }
												/>
											) }
										/>
									</div>
									{ getValues( 'enableQueryBypass' ) && (
										<>
											<div className="dlx-admin__row">
												<Controller
													name="queryBypassKey"
													control={ control }
													rules={ { required: true, pattern: /^[_a-zA-Z]+$/i } }
													render={ ( { field: { onChange, value } } ) => (
														<>
															<TextControl
																label={ __( 'Query Parameter Key', 'dlx-pmpro-turnstile' ) }
																className={ classNames(
																	'dlx-admin__text-control-license',
																	{
																		'has-error':
																			'pattern' === errors.queryBypassKey?.type ||
																			'required' === errors.queryBypassKey?.type || 'validate' === errors.queryBypassKey?.type,
																		'is-required': true,
																	}
																) }
																value={ value }
																onChange={ ( stringValue ) => {
																	onChange( stringValue );
																} }
																help={ __(
																	'The query parameter key to use for bypassing Turnstile. Only letters and underscores are allowed.',
																	'dlx-pmpro-turnstile'
																) }
															/>
															{ 'required' === errors.queryBypassKey?.type && (
																<Notice
																	message={ __( 'This field is a required field.', 'dlx-pmpro-turnstile' ) }
																	status="error"
																	politeness="assertive"
																	inline={ true }
																	icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
																/>
															) }
															{ 'pattern' === errors.queryBypassKey?.type && (
																<Notice
																	message={ __( 'Please do not enter any special characters or numbers as a key.', 'dlx-pmpro-turnstile' ) }
																	status="error"
																	politeness="assertive"
																	inline={ true }
																	icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
																/>
															) }
														</>
													) }
												/>
											</div>
											<div className="dlx-admin__row">
												<Controller
													name="queryBypassValue"
													control={ control }
													rules={ { required: true, pattern: /^[a-zA-Z0-9]+$/i } }
													render={ ( { field: { onChange, value } } ) => (
														<>
															<TextControl
																label={ __( 'Query Parameter Value', 'dlx-pmpro-turnstile' ) }
																className={ classNames(
																	'dlx-admin__text-control-license',
																	{
																		'has-error':
																			'pattern' === errors.queryBypassKey?.type ||
																			'required' === errors.queryBypassKey?.type || 'validate' === errors.queryBypassKey?.type,
																		'is-required': true,
																	}
																) }
																value={ value }
																onChange={ ( stringValue ) => {
																	onChange( stringValue );
																} }
																help={ __(
																	'When a query key and value are used together, Turnstile will be bypassed. Only letters and numbers are allowed.',
																	'dlx-pmpro-turnstile'
																) }
															/>
															{ 'required' === errors.queryBypassValue?.type && (
																<Notice
																	message={ __( 'This field is a required field.', 'dlx-pmpro-turnstile' ) }
																	status="error"
																	politeness="assertive"
																	inline={ true }
																	icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
																/>
															) }
															{ 'pattern' === errors.queryBypassValue?.type && (
																<Notice
																	message={ __( 'Please do not enter any special characters or numbers as a key.', 'dlx-pmpro-turnstile' ) }
																	status="error"
																	politeness="assertive"
																	inline={ true }
																	icon={ () => <FontAwesomeIcon icon={ CircularExclamation } style={ { color: 'currentColor' } } /> }
																/>
															) }
														</>
													) }
												/>
											</div>
										</>
									) }

								</td>
							</tr>
						</tbody>
					</table>
					<SaveResetButtons
						formValues={ formValues }
						setError={ setError }
						reset={ reset }
						errors={ errors }
						isDirty={ isDirty }
						dirtyFields={ dirtyFields }
						trigger={ trigger }
					/>
				</div>
			</form>
		</>
	);
};

export default Main;
