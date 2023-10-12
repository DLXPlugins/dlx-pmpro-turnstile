import React from 'react';

import { createRoot } from 'react-dom/client';
import License from './License';

const container = document.getElementById( 'dlx-pmpro-turnstile-license' );
const root = createRoot( container );
root.render(
	<React.StrictMode>
		<License />
	</React.StrictMode>
);
