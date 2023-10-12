// eslint-disable-next-line no-unused-vars
import React, { Suspense, useState } from 'react';
import {
	Button,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useForm, Controller, useWatch, useFormState } from 'react-hook-form';
import { useAsyncResource } from 'use-async-resource';
import { KeyRound, BadgeCheck, EyeOff, View, AlertCircle, Loader2 } from 'lucide-react';
import classNames from 'classnames';

// Local imports.
import SendCommand from '../../utils/SendCommand';
import Notice from '../../components/Notice';

const retrieveOptions = () => {
	return SendCommand( 'dlx_pmpro_turnstile_license_get_options', {
		nonce: dlxPMProTurnstileAdminLicense.getNonce,
	} );
};

const License = ( props ) => {
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

	const [ showSecret, setShowSecret ] = useState( data.licenseActivated ? false : true );
	const [ licenseData, setLicenseData ] = useState( data.licenseData );
	const [ saving, setSaving ] = useState( false );
	const [ isSaved, setIsSaved ] = useState( false );
	const [ betaSaving, setBetaSaving ] = useState( false );
	const [ betaEnabled, setBetaEnabled ] = useState( data.beta );
	const [ revokingLicense, setRevokingLicense ] = useState( false );
	const [ isRevoked, setIsRevoked ] = useState( false );
	const [ validLicense, setValidLicense ] = useState( data.licenseKey );
	const [ licenseActivated, setLicenseActivated ] = useState( data.licenseActivated );

	const hasErrors = () => {
		return Object.keys( errors ).length > 0;
	};

	const {
		control,
		handleSubmit,
		getValues,
		reset,
		setError,
		trigger,
		setValue,
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
			saveNonce: dlxPMProTurnstileAdminLicense.saveNonce,
			revokeNonce: dlxPMProTurnstileAdminLicense.revokeNonce,
			licenseActivated: data.licenseActivated,
			licenseKey: data.licenseKey,
			priceId: data.priceId,
		},
	} );

	console.log( licenseData );

	const formValues = useWatch( { control } );
	const { errors, isDirty, dirtyFields } = useFormState( {
		control,
	} );
	

	const onSubmit = ( formData ) => {
		setSaving( true );
		SendCommand( 'dlx_pmpro_turnstile_save_license', {
			nonce: dlxPMProTurnstileAdminLicense.saveNonce,
			formData,
		} )
			.then( ( ajaxResponse ) => {
				const ajaxData = ajaxResponse.data.data;
				const ajaxSuccess = ajaxResponse.data.success;

				setLicenseData( ajaxData );
				if ( ajaxSuccess ) {
					if ( ajaxData.licenseActivated ) {
						setLicenseActivated( true );
					} else {
						setLicenseActivated( false );
					}

					setIsSaved( true );

					// Reset count.
					setTimeout( () => {
						setIsSaved( false );
					}, 3000 );
				} else {
					// Error stuff.
					setError( 'licenseKey', {
						type: 'validate',
						message: ajaxData.message,
					} );
				}
			} )
			.catch( ( ajaxResponse ) => {} )
			.then( ( ajaxResponse ) => {
				setSaving( false );
			} );
	};

	const revokeLicense = ( e ) => {
		setRevokingLicense( true );
		SendCommand( 'dlx_pmpro_turnstile_revoke_license', {
			nonce: dlxPMProTurnstileAdminLicense.revokeNonce,
			formData: formValues,
		} )
			.then( ( ajaxResponse ) => {
				const ajaxData = ajaxResponse.data.data;
				const ajaxSuccess = ajaxResponse.data.success;
				if ( ajaxSuccess ) {
					// // Reset count.
					setLicenseActivated( false );
					setIsRevoked( true );
					setValue( 'licenseKey', '' );
					setTimeout( () => {
						setIsRevoked( false );
					}, 3000 );
				} else {
					setError( 'licenseKey', {
						type: 'validate',
						message: __(
							'Revoking the license resulted in an error and could not be deactivated. Please reactivate the license and try again.',
							'dlx-pmpro-turnstile'
						),
					} );
					setLicenseActivated( false );
				}
			} )
			.catch( ( ajaxResponse ) => {} )
			.then( ( ajaxResponse ) => {
				setRevokingLicense( false );
			} );
	};

	/**
	 * Retrieve a license type for a user.
	 *
	 * @return {string} License type.
	 */
	const getLicenseType = () => {
		switch ( getValues( 'priceId' ) ) {
			case '1':
				return 'Free Tier';
			case '2':
				return 'Freelancer';
			case '3':
				return 'Agency';
			case '4':
				return 'Unlimited';
			default:
				return 'Subscriber';
		}
	};

	/**
	 * Retrieve a license notice.
	 *
	 * @return {React.ReactElement} Notice.
	 */
	const getLicenseNotice = () => {
		if ( getValues( 'licenseActivated' ) ) {
			return (
				<Notice
					message={ __( 'Your license is valid. Thank you so much for purchasing a license.', 'dlx-pmpro-turnstile' ) }
					status="success"
					politeness="polite"
					icon={ () => <BadgeCheck fill="none" color="currentColor" /> }
				/>
			);
		}
		return (
			<Notice
				message={ __(
					'Please enter a valid license to receive support and updates.',
					'dlx-pmpro-turnstile'
				) }
				status="warning"
				politeness="polite"
				icon={ () => <KeyRound fill="none" color="#333333" /> }
			/>
		);
	};

	const getSaveButton = () => {
		let saveText = __( 'Save License', 'dlx-pmpro-turnstile' );
		let saveTextLoading = __( 'Saving…', 'dlx-pmpro-turnstile' );

		if ( ! getValues( 'licenseActivated' ) ) {
			saveText = __( 'Activate License', 'dlx-pmpro-turnstile' );
			saveTextLoading = __( 'Activating…', 'dlx-pmpro-turnstile' );
		}
		return (
			<>
				<Button
					className={ classNames(
						'qdlx__btn qdlx__btn-primary qdlx__btn--icon-right',
						{ 'has-error': hasErrors() },
						{ 'has-icon': saving },
						{ 'is-saving': { saving } }
					) }
					type="submit"
					text={ saving ? saveTextLoading : saveText }
					icon={ saving ? () => <Loader2 color="currentColor" fill="none" /> : false }
					iconSize="18"
					iconPosition="right"
					disabled={ saving || revokingLicense }
				/>
			</>
		);
	};

	return (
		<>
			<div className="dlx-pmpro-turnstile-admin-content-heading">
				<h1><span className="dlx-pmpro-turnstile-content-heading-text">{ __( 'License', 'dlx-pmpro-turnstile' ) }</span></h1>
				{
					getLicenseNotice()
				}
			</div>
			{ /* eslint-disable-next-line no-unused-vars */ }
			<form onSubmit={ handleSubmit( onSubmit ) }>
				<div className="dlx-admin__license--wrapper is-required">
					<div className="dlx-admin__license--input-wrapper">
						<Controller
							name="licenseKey"
							control={ control }
							rules={ {
								required: true,
								pattern: /^[0-9A-Za-z]+$/i,
								validate: true,
							} }
							render={ ( { field: { onChange, value } } ) => (
								<TextControl
									value={ value }
									label={ __( 'License Key', 'dlx-pmpro-turnstile' ) }
									id="search-dlx-pmpro-turnstile-license-secret"
									className={ classNames(
										'dlx-admin__text-control-license',
										{
											'has-error':
												'pattern' === errors.licenseKey?.type ||
												'required' === errors.licenseKey?.type || 'validate' === errors.licenseKey?.type,
											'is-required': true,
										}
									) }
									onChange={ onChange }
									disabled={ getValues( 'licenseActivated' ) }
									aria-required="true"
									help={ __(
										'Entering a license will enable support and updates.',
										'dlx-pmpro-turnstile'
									) }
									type={ showSecret ? 'text' : 'password' }
								/>
							) }
						/>
						<div className="dlx-admin__license--input-preview">
							<input
								id="dlx-pmpro-turnstile-license-show-hide"
								type="checkbox"
								aria-label={ __(
									'Click to Show or Hide the License',
									'dlx-pmpro-turnstile'
								) }
								onClick={ () => {
									if ( showSecret ) {
										setShowSecret( false );
									} else {
										setShowSecret( true );
									}
								} }
								title={
									showSecret
										? __( 'Hide License', 'dlx-pmpro-turnstile' )
										: __( 'Show License', 'dlx-pmpro-turnstile' )
								}
							/>
							<label htmlFor="dlx-pmpro-turnstile-license-show-hide not-is-required">
								<span className="dlx-pmpro-turnstile-license-show-hide--label">
									{ __( 'Click to Show or Hide the License', 'dlx-pmpro-turnstile' ) }
								</span>
								<span className="dlx-pmpro-turnstile-license-show-hide--icon">
									{ ! showSecret ? (
										<Button
											label={ __( 'Show License', 'dlx-pmpro-turnstile' ) }
											size={ 20 }
											icon={ () => <View fill="none" color="currentColor" /> }
											className="button-reset"
										/>
									) : (
										<Button
											label={ __( 'Hide License', 'dlx-pmpro-turnstile' ) }
											size={ 20 }
											icon={ () => <EyeOff fill="none" color="currentColor" /> }
											className="button-reset"
										/>
									) }
								</span>
							</label>
						</div>
						{ 'required' === errors.sceLicense?.type && (
							<Notice
								message={ __( 'This field is a required field.' ) }
								status="error"
								politeness="assertive"
								inline={ true }
								icon={ () => <AlertCircle fill="none" color="currentColor" /> }
							/>
						) }
						{ 'pattern' === errors.sceLicense?.type && (
							<Notice
								message={ __(
									'It appears there are invalid characters in the license.'
								) }
								status="error"
								politeness="assertive"
								inline={ true }
								icon={ () => <AlertCircle fill="none" color="currentColor" /> }
							/>
						) }
						{ 'validate' === errors.sceLicense?.type && (
							<Notice
								message={ errors.sceLicense.message }
								status="error"
								politeness="assertive"
								inline={ true }
								icon={ () => <AlertCircle fill="none" color="currentColor" /> }
							/>
						) }
					</div>
					<div className="dlx-admin__tabs--content-actions dlx-admin-buttons">
						{ ! getValues( 'licenseActivated' ) && getSaveButton() }
						{ getValues( 'licenseActivated' ) && (
							<Button
								className={ classNames(
									'qdlx__btn qdlx__btn-danger qdlx__btn--icon-right',
									{ 'has-icon': revokingLicense },
									{ 'is-resetting': { revokingLicense } }
								) }
								type="button"
								text={
									revokingLicense
										? __( 'Revoking License…', 'dlx-pmpro-turnstile' )
										: __( 'Revoke License', 'dlx-pmpro-turnstile' )
								}
								icon={ revokingLicense ? () => <Loader2 color="currentColor" fill="none" /> : false }
								iconSize="18"
								iconPosition="right"
								disabled={ saving || revokingLicense }
								onClick={ ( e ) => {
									setRevokingLicense( true );
									revokeLicense( e );
								} }
							/>
						) }
					</div>
					{ hasErrors() && (
						<Notice
							message={ __(
								'There are form validation errors. Please correct them above.',
								'dlx-pmpro-turnstile'
							) }
							status="error"
							politeness="polite"
						/>
					) }
					{ isSaved && (
						<Notice
							message={ __( 'Your settings have been saved.', 'dlx-pmpro-turnstile' ) }
							status="success"
							politeness="assertive"
						/>
					) }
					{ isRevoked && (
						<Notice
							message={ __(
								'Your license has been deactivated for this site.',
								'dlx-pmpro-turnstile'
							) }
							status="success"
							politeness="assertive"
						/>
					) }
				</div>
				{ licenseActivated && (
					<>
						<div className="sce-admin-panel-area">
							<div className="sce-panel-row">
								<div className="sce-admin__tabs--content-wrap">
									<div className="sce-admin__tabs--content-panel">
										<div className="sce-admin__tabs--content-heading">
											<h2>
												<span className="sce-admin__heading--text">
													{ __( 'License Information', 'dlx-pmpro-turnstile' ) }
												</span>
											</h2>
										</div>
										<div className="sce-admin__tabs--content-inner">
											<table className="dlx-pmpro-turnstile-table dlx-pmpro-turnstile-table--responsive dlx-pmpro-turnstile-table--license-ui">
												<thead>
													<tr>
														<th scope="col">{ __( 'Item Name', 'dlx-pmpro-turnstile' ) }</th>
														<th scope="col">{ __( 'License Type', 'dlx-pmpro-turnstile' ) }</th>
														<th scope="col">
															{ __( 'License Activations', 'dlx-pmpro-turnstile' ) }
														</th>
														<th scope="col">{ __( 'Expires On', 'dlx-pmpro-turnstile' ) }</th>
														<th scope="col">{ __( 'Days Left', 'dlx-pmpro-turnstile' ) }</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td data-header="Item Name">
															<p>{ licenseData.item_name }</p>
														</td>
														<td data-header="License Type">
															<p>{ getLicenseType() }</p>
														</td>
														<td data-header="License Activations">
															<p>
																<span className="">
																	{ licenseData.site_count } of{ ' ' }
																	{ licenseData.license_limit === 0
																		? __( 'Unlimited', 'dlx-pmpro-turnstile' )
																		: licenseData.license_limit }
																</span>
															</p>
														</td>
														<td data-header="Expires On">
															<p>{ licenseData.expires }</p>
														</td>
														<td data-header="Days Left">
															<p>{ licenseData.expires_human_time_diff }</p>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				) }
			</form>
		</>
	);
};

export default License;
