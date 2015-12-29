module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    livereload: false,
                    base: 'app/', 
                    port: 8080,
                    open: 'http://localhost:8080/index.html',
                    middleware: function (connect, options) {

                        // bug in connect 0.7+ , https://github.com/drewzboto/grunt-connect-proxy/issues/65
                        options.base = options.base[0];

                        var config = [];

                        // RewriteRules support
                        config.push(require('grunt-connect-rewrite/lib/utils').rewriteRequest);

                        if (!Array.isArray(options.base)) {
                            options.base = [options.base];
                        }

                        var directory = options.directory || options.base[options.base.length - 1];
                        options.base.forEach(function (base) {
                            // Serve static files.
                            config.push(connect.static(base));
                        });

                        // Make directory browse-able.
                        config.push(connect.directory(directory));

                        return config;

                    }
                }
            }
        },
		watch: {
			options: {
				livereload: false,
			}
		}
    });
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['connect', 'watch']);
};
