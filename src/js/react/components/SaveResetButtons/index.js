import React, { useState } from 'react';
import { Loader2, ClipboardCheck } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Button, Snackbar } from '@wordpress/components';
import Notice from '../Notice';
import SendCommand from '../../utils/SendCommand';
import SnackPop from '../SnackPop';

export function onSave( formData, setError ) {

}

export function onReset( { formValues, setError, reset } ) {

}

const SaveResetButtons = ( props ) => {
	// Gather props.
	const {
		formValues,
		setError,
		reset,
		errors,
		isDirty,
		dirtyFields,
		trigger,
	} = props;

	const [ saving, setSaving ] = useState( false );
	const [ resetting, setResetting ] = useState( false );
	const [ isSaved, setIsSaved ] = useState( false );
	const [ isReset, setIsReset ] = useState( false );
	const [ savePromise, setSavePromise ] = useState( null );
	const [ resetPromise, setResetPromise ] = useState( null );

	/**
	 * Save the options by setting promise as state.
	 */
	const saveOptions = async () => {
		const saveOptionsPromise = SendCommand( 'dlx_pmpro_turnstile_save_options', { formData: formValues } );
		setSavePromise( saveOptionsPromise );
		setSaving( true );
		await saveOptionsPromise;
		setSaving( false );
	};

	/**
	 * Reset the options by setting promise as state.
	 */
	const resetOptions = async () => {
		const resetOptionsPromise = SendCommand( 'dlx_pmpro_turnstile_reset_options', { formData: formValues } );
		setResetPromise( resetOptionsPromise );
		setResetting( true );
		const resetResponse = await resetOptionsPromise;
		reset(
			resetResponse.data.data.formData,
			{
				keepErrors: false,
				keepDirty: false,
			},
		);
		setResetting( false );
	};

	const hasErrors = () => {
		return Object.keys( errors ).length > 0;
	};

	const getSaveIcon = () => {
		if ( saving ) {
			return () => <Loader2 />;
		}
		if ( isSaved ) {
			return () => <ClipboardCheck />;
		}
		return false;
	};

	const getSaveText = () => {
		if ( saving ) {
			return __( 'Saving…', 'dlx-pmpro-turnstile' );
		}
		if ( isSaved ) {
			return __( 'Saved', 'dlx-pmpro-turnstile' );
		}
		return __( 'Save Options', 'dlx-pmpro-turnstile' );
	};

	const getResetText = () => {
		if ( resetting ) {
			return __( 'Resetting to Defaults…', 'dlx-pmpro-turnstile' );
		}
		if ( isReset ) {
			return __( 'Options Restored to Defaults', 'dlx-pmpro-turnstile' );
		}
		return __( 'Reset to Defaults', 'dlx-pmpro-turnstile' );
	};

	return (
		<>
			<div className="dlx-pmpro-turnstile-admin-buttons">
				<Button
					className={ classNames(
						'dlx-pmpro__btn dlx-pmpro__btn-primary dlx-pmpro__btn--icon-right',
						{ 'has-error': hasErrors() },
						{ 'has-icon': saving || isSaved },
						{ 'is-saving': saving && ! isSaved },
						{ 'is-saved': isSaved },
					) }
					variant="primary"
					type="button"
					text={ getSaveText() }
					icon={ getSaveIcon() }
					iconSize="18"
					iconPosition="right"
					disabled={ saving }
					onClick={ async ( e ) => {
						e.preventDefault();
						const validationResult = await trigger();
						if ( validationResult ) {
							saveOptions();
						}
					} }
				/>
				<Button
					className={ classNames(
						'dlx-pmpro__btn dlx-pmpro__btn-danger dlx-pmpro__btn--icon-right',
						{ 'has-icon': resetting },
						{ 'is-resetting': { resetting } },
					) }
					variant="secondary"
					type="button"
					text={ getResetText() }
					icon={ resetting ? <Loader2 /> : false }
					iconSize="18"
					iconPosition="right"
					isDestructive={ true }
					disabled={ saving || resetting }
					onClick={ ( e ) => {
						e.preventDefault();
						resetOptions();
					} }
				/>
			</div>
			<div className="dlx-pmpro-turnstile-admin-notices-bottom">
				<SnackPop
					ajaxOptions={ savePromise }
					loadingMessage={ __( 'Saving Options…', 'dlx-pmpro-turnstile' ) }
				/>
				<SnackPop
					ajaxOptions={ resetPromise }
					loadingMessage={ __( 'Resetting to defaults…', 'dlx-pmpro-turnstile' ) }
				/>
				{ hasErrors() && (
					<Notice
						message={ __(
							'There are form validation errors. Please correct them above.',
							'dlx-pmpro-turnstile',
						) }
						status="error"
						politeness="polite"
					/>
				) }
			</div>
		</>
	);
};
export default SaveResetButtons;
