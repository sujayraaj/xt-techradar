const gulp = require("gulp");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
gulp.task("scripts", () => {
  gulp
    .src(["app/*.js"])
    .pipe(
      babel({
        presets: ["env"]
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest("dist"));
});
// Copy other files
gulp.task("copy", () => {
  gulp.src("app/*.css").pipe(gulp.dest("dist"));
  gulp.src("app/*.html").pipe(gulp.dest("dist"));
  gulp.src("app/assets/**/*").pipe(gulp.dest("dist/assets"));
});

gulp.task("copy-data", () => {
  gulp.src("data/*.json").pipe(gulp.dest("functions/data"));
});

gulp.task("default", ["scripts", "copy", "copy-data"], () => {});
