export interface AutoprefixerOptions {
  /** environment for `Browserslist` */
  env?: string;

  /** should Autoprefixer use Visual Cascade, if CSS is uncompressed */
  cascade?: boolean;

  /** should Autoprefixer add prefixes. */
  add?: boolean;

  /** should Autoprefixer [remove outdated] prefixes */
  remove?: boolean;

  /** should Autoprefixer add prefixes for @supports parameters. */
  supports?: boolean;

  /** should Autoprefixer add prefixes for flexbox properties */
  flexbox?: boolean | "no-2009";

  /** should Autoprefixer add IE 10-11 prefixes for Grid Layout properties */
  grid?: boolean | "autoplace" | "no-autoplace";

  /** custom usage statistics for > 10% in my stats browsers query */
  stats?: {
    [browser: string]: {
      [version: string]: number;
    };
  };

  /**
   * list of queries for target browsers.
   * Try to not use it.
   * The best practice is to use `.browserslistrc` config or `browserslist` key in `package.json`
   * to share target browsers with Babel, ESLint and Stylelint
   */
  overrideBrowserslist?: string | string[];

  /** do not raise error on unknown browser version in `Browserslist` config. */
  ignoreUnknownVersions?: boolean;
}

export interface TailwindPluginOptions {
  autoprefixer?: AutoprefixerOptions;
}
