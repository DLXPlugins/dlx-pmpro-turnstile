import React from 'react';

import { createRoot } from 'react-dom/client';
import Main from './views/Main';

const container = document.getElementById( 'dlx-pmpro-turnstile' );
const root = createRoot( container );
root.render(
	<React.StrictMode>
		<Main />
	</React.StrictMode>
);
