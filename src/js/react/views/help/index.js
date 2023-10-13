import React from 'react';

import { createRoot } from 'react-dom/client';
import Help from './Help';

const container = document.getElementById( 'dlx-pmpro-turnstile-help' );
const root = createRoot( container );
root.render(
	<React.StrictMode>
		<Help />
	</React.StrictMode>
);
