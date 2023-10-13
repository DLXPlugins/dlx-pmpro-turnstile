// eslint-disable-next-line no-unused-vars
import React, { Suspense, useState } from 'react';
import {
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useForm, Controller, useWatch, useFormState } from 'react-hook-form';
import { useAsyncResource } from 'use-async-resource';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpenReader as BookOpenReader, faPlugCircleBolt as PlugCircleBolt, faHandsHoldingHeart as HoldingHeart, faEnvelope as Envelope, faTriangleExclamation as TriangleExclamation, faCircleCheck as CircleCheck, faBookmark as Bookmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleExclamation as CircularExclamation } from '@fortawesome/free-solid-svg-icons/faCircleExclamation';

// Local imports.
import Notice from '../../components/Notice';

const Help = ( props ) => {
	return (
		<>
			<div className="dlx-admin-panel-area">
				<div className="dlx-pmpro-turnstile-admin-content-heading">
					<h1><span className="dlx-pmpro-turnstile-content-heading-text">{ __( 'Help and Support', 'dlx-pmpro-turnstile' ) }</span></h1>
					<p className="description">
						{
							__( 'Do you need help getting set up? We have some useful articles to help you along, and here to help if you get stuck.', 'dlx-pmpro-turnstile' )
						}
					</p>
				</div>
				<div className="dlx-admin-content-support-row">
					<h3 className="dlx-admin-content-subheading">
						{ __( 'Documentation and Overview', 'dlx-pmpro-turnstile' ) }
					</h3>
					<p className="description">
						{ __(
							'The documentation for PMPro Turnstile is designed to get you up and running fast.',
							'dlx-pmpro-turnstile',
						) }
					</p>
					<div className="dlx-admin-component-row dlx-admin-component-row-button no-flex">
						<Button
							className="dlx-button dlx__btn-secondary"
							href="https://docs.dlxplugins.com/v/dlx-comments/"
							target="_blank"
							rel="noopener noreferrer"
							icon={ () => <FontAwesomeIcon icon={ Bookmark } style={ { color: 'currentColor' } } /> }
						>
							{ __( 'Visit the Documentation', 'dlx-pmpro-turnstile' ) }
						</Button>
					</div>
				</div>
				<div className="dlx-admin-content-support-row">
					<h3 className="dlx-admin-content-subheading">
						{ __( 'Support and Help', 'dlx-pmpro-turnstile' ) }
					</h3>
					<p className="description">
						{ __(
							'Get the help you need, either through Slack or via email.',
							'dlx-pmpro-turnstile',
						) }
					</p>
					<div className="dlx-admin-component-row dlx-admin-component-row-button">
						<Button
							className="dlx-button dlx__btn-secondary"
							href="https://dlxplugins.com/support/"
							target="_blank"
							rel="noopener noreferrer"
							icon={ () => <FontAwesomeIcon icon={ Envelope } style={ { color: 'currentColor' } } /> }
						>
							{ __( 'Use the Support Form', 'dlx-pmpro-turnstile' ) }
						</Button>
					</div>
				</div>
				<div className="dlx-admin-content-support-row">
					<h3 className="dlx-admin-content-subheading">
						{ __( 'More From DLX Plugins', 'dlx-pmpro-turnstile' ) }
					</h3>
					<p className="description">
						{ __(
							'Check out more plugins and plugin tutorials from DLX Plugins.',
							'dlx-pmpro-turnstile',
						) }
					</p>
					<div className="dlx-admin-component-row dlx-admin-component-row-button no-flex">
						<Button
							className="dlx-button dlx__btn-secondary dlx-button-zap"
							href="https://wordpress.org/support/plugin/dlx-pmpro-turnstile/"
							target="_blank"
							rel="noopener noreferrer"
							icon={ () => <FontAwesomeIcon icon={ PlugCircleBolt } style={ { color: 'currentColor' } } /> }
						>
							{ __( 'View Deluxe Plugins', 'dlx-pmpro-turnstile' ) }
						</Button>
						<Button
							className="dlx-button dlx__btn-secondary"
							href="https://dlxplugins.com/support/"
							target="_blank"
							rel="noopener noreferrer"
							icon={ () => <FontAwesomeIcon icon={ BookOpenReader } style={ { color: 'currentColor' } } /> }
						>
							{ __( 'DLX Plugin Tutorials', 'dlx-pmpro-turnstile' ) }
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default Help;
