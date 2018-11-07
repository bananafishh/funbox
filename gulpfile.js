'use strict';

const gulp = require('gulp');
const pug = require('gulp-pug');

const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCSS = require('gulp-clean-css');

const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

const remember = require('gulp-remember');
const del = require('del');
const args = require('yargs').argv;
const gulpif = require('gulp-if');
const plumber = require('gulp-plumber');
const server = require('browser-sync').create();

const srcPath = './source/';
const buildPath = './build/';


// Сборка pug
gulp.task('markup', () => {
  return gulp.src(srcPath + 'pages/**/*.pug')
    .pipe(pug())
    .pipe(gulp.dest(buildPath))
});


// Сборка стилей
gulp.task('styles', () => {
  return gulp.src(srcPath + 'styles/main.scss')
    .pipe(plumber())
    .pipe(gulpif(!args.production, sourcemaps.init()))
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(!args.production, sourcemaps.write('.')))
    .pipe(gulp.dest(buildPath + 'styles/'))
    .pipe(server.stream());
});


// Сборка скриптов
gulp.task('scripts', () => {
  return gulp.src(srcPath + '/**/*.js', {since: gulp.lastRun('scripts')})
    .pipe(plumber())
    .pipe(gulpif(!args.production, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(args.production, uglify()))
    .pipe(remember('scripts'))
    .pipe(concat('main.js'))
    .pipe(gulpif(!args.production, sourcemaps.write('.')))
    .pipe(gulp.dest(buildPath + 'scripts/'));
});


// Копирование шрифтов
gulp.task('fonts', () => {
  return gulp.src(srcPath + 'fonts/**/*.{woff,woff2}', {since: gulp.lastRun('fonts')})
    .pipe(gulp.dest(buildPath + 'fonts/'));
});


// Копирование изображений
gulp.task('images', () => {
  return gulp.src(srcPath + 'img/*', {since: gulp.lastRun('images')})
    .pipe(gulp.dest(buildPath + 'img/'));
});


// Удаление содержимого папки сборки
gulp.task('clean', () => {
  return del(buildPath + '**');
});


// Сборка всего проекта
gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('styles', 'scripts', 'fonts', 'images'),
  'markup'
));


// Следим за изменениями, перезагружаем браузер
gulp.task('serve', gulp.series('build', () => {
  server.init({
    server: 'build',
    open: true
  });

  gulp.watch(srcPath + '**/*.pug', gulp.series('markup', reload));
  gulp.watch(srcPath + '**/*.scss', gulp.series('styles'));
  gulp.watch(srcPath + '/**/*.js', gulp.series('scripts', reload));
  gulp.watch(srcPath + 'img/*', gulp.series('images'), reload);
}));

function reload(done) {
  server.reload();
  done();
}
