module.exports = function( grunt ) {
	grunt.initConfig( {
		compress: {
			main: {
				options: {
					archive: 'dlx-pmpro-turnstile.zip',
				},
				files: [
					{ src: [ 'dlx-pmpro-turnstile.php' ], dest: '/', filter: 'isFile' }, // includes files in path
					{ src: [ 'readme.txt' ], dest: '/', filter: 'isFile' },
					{ src: [ 'includes/**' ], dest: '/' }, // includes files in path and its subdirs
					{ src: [ 'assets/**' ], dest: '/' },
					{ src: [ 'lib/**' ], dest: '/' }, // includes files in path and its subdirs
					{ src: [ 'dist/**' ], dest: '/' }, // includes files in path and its subdirs
					{ src: [ 'templates/**' ], dest: '/' },
				],
			},
		},
	} );
	grunt.registerTask( 'default', [ 'compress' ] );

	grunt.loadNpmTasks( 'grunt-contrib-compress' );
};
