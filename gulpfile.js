// --------------------------------
// 			Modules
// --------------------------------
const 
  gulp = require('gulp'),
  shell = require('gulp-shell')
	jshint = require ('gulp-jshint'),
	concat = require('gulp-concat'),
	stripDebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	sass = require('gulp-sass'),
	notify = require('gulp-notify'),
	gutil = require('gulp-util'),
	rename = require('gulp-rename'),
	autoprefixer = require('autoprefixer'),
	postCss = require('gulp-postcss'),
	mqPacker = require('css-mqpacker'),
	pxToRem = require('postcss-pxtorem'),
	sourceMaps = require('gulp-sourcemaps'),
	cssNano = require('gulp-cssnano'),
	browserSync = require('browser-sync').create(),
	watch = require('gulp-watch'),
	fs = require("fs"),
  cacheBuster = require("postcss-cachebuster"),
  directory = require('./cert')


// --------------------------------
// 			Setup
// --------------------------------
var storeName = 'DBNY',
	projectName = storeName.toLowerCase().replace(/\s/g, '-'),
	url = 'https://dbny-code-test.myshopify.com/', // Note: Url must be the actual shop url for BrowserSync to work properly
	jsfiles = [
			'src/js/libs/jquery-2.2.4.min.js',
			'src/js/libs/*.js',
			'src/js/modules/*.js'
		],
    devProcessors = [
	        autoprefixer(),
	        pxToRem({ rootValue: 16, replace: true, mediaQuery: true }),
          cacheBuster({cssPath: '/assets', type:'mtime'})
		],
	prodProcessors = [
			pxToRem({rootValue: 16, replace: true, mediaQuery: true}),
			mqPacker({sort: true}),
	        cacheBuster({cssPath: '/assets', type:'mtime'})
		];


// --------------------------------
// 			Tasks
// --------------------------------

// JS -------------
gulp.task('js:hint', function(){
	gutil.log(gutil.colors.blue('--> Validating JS '));
	gulp.src(['src/js/modules/*.js'])
 		.pipe(jshint())
		.pipe(notify(function(file){
			return (file.jshint.success) ? false : file.relative + ' has errors!';
		}))
		.pipe(jshint.reporter('jshint-stylish', { verbose: true }));
});
gulp.task('js:concat', function(){
	gutil.log(gutil.colors.blue('--> Concatenating JS '));
	gulp.src(jsfiles)
		.pipe(concat(projectName + '.min.js'))
		.pipe(gulp.dest('assets/'))
	    .pipe(browserSync.stream())
	    .pipe(notify({ title: storeName + ' JS', message: 'Browser Refreshed' }));
});
gulp.task('js:uglify', function(){
	gutil.log(gutil.colors.blue('--> Uglifying JS '));
	gulp.src(jsfiles)
		.pipe(concat(projectName + '.js'))
		.pipe(stripDebug())
		.pipe(uglify())
		.pipe(gulp.dest('assets/'))
	    .pipe(notify({ title: storeName + ' JS', message: 'Uglified' }));
});


// CSS ------------
gulp.task('css:postsass', function(){
	gutil.log(gutil.colors.blue('--> Compiling CSS Stuffs '));
	gulp.src('stylesheets/*.scss')
		.pipe(sourceMaps.init())
		.pipe(sass().on('error', handleSassError))
		.pipe(postCss(devProcessors))
		.pipe(sourceMaps.write())
		.pipe(rename(projectName + '.scss.liquid'))
		.pipe(gulp.dest('assets/'))
		.pipe(browserSync.stream())
		.pipe(notify({ title: storeName + ' CSS', message: 'CSS Refreshed' }))
    .pipe(shell(['theme watch']))
});
gulp.task('css:post_build', function(){
	gutil.log(gutil.colors.blue('--> Making CSS Stuffs Smaller '));
	gulp.src('stylesheets/*.scss')
		.pipe(sass().on('error', handleSassError))
		.pipe(postCss(prodProcessors))
		.pipe(cssNano({autoprefixer: { add: true }}))
		.pipe(rename(projectName + '.scss.liquid'))
		.pipe(gulp.dest('assets/'))
		.pipe(notify({ title: 'dbny-code-test' + ' CSS', message: 'CSS Refreshed' }));
});

// --------------------------------
// 			Helpers
// --------------------------------

function handleSassError(err){
	gutil.log(gutil.colors.bold.white.bgRed('\n \n [SASS] ERROR \n'));
	console.error('', err.message);
	return notify({
		title: 'Sass Error',
		message: 'Error on line ' + err.line + ' of ' + err.file
	}).write(err);
}


// --------------------------------
// 			Executables
// --------------------------------

// Command: `gulp`
gulp.task('default', ['css:postsass'], function() {
	fs.readFile('config.yml', 'utf-8', function(err, _data) {
		browserSync.init({
		    proxy: url + '?preview_theme_id=24704057388' ,
		    open: false,
		    xip: false, // turn this on if using typekit, point your typekit to xip.io
		    ghostMode: { // turn this off if you don't want people on the same IP scrolling on you
		        clicks: true,
		        forms: true,
		        scroll: true
		    },
        https: {
          key: `${directory.cert}/localhost.key`,
          cert: `${directory.cert}/localhost.crt`
        }
		});
	});

	// watch for changes in src
	// gulp.watch('src/js/**/*.js', ['js:hint', 'js:concat']);

	// watch for sass changes
	gulp.watch('stylesheets/*.scss', ['css:postsass']);

});

// Command: `gulp build`
gulp.task('build', ['css:post_build'], function(){
	gulp.src('gulpfile.js').pipe(notify({
		title: 'Build Scripts',
		message: 'Finished!'
	}))
})
