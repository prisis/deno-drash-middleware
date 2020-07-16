import { Drash } from "../deps.ts";

enum ReferrerPolicy {
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
};

interface Configs {
  "X-XSS-Protection": boolean
  "Referrer-Policy": ReferrerPolicy,
  "X-Content-Type-Options": boolean
  hsts: {
    maxAge: boolean | number,
    includeSubDomains: boolean,
    preload: boolean
  },
  "X-Powered-By": boolean
  "X-Frame-Options": "DENY" | "SAMEORIGIN" | boolean | string, // eg ALLOW-FROM www.example.com
  expectCt: {
    enforce: boolean,
    maxAge: string,
    reportUri: string
  },
  "X-DNS-Prefetch-Control": boolean,
  "Content-Security-Policy": string
}

/**
 * A logger middleware inspired by https://www.npmjs.com/package/morgan.
 *
 * @param configs - See IDexterConfigs
 */
export function Armor(
  configs?: Configs,
) {

  // Default configs when no `configs` param is passed in
  const defaultConfigs = {
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    hsts: {
      maxAge: "5184000", // 60 days
      includeSubDomains: "includeSubDomains"
    },
    "X-Powered-By": false, // False for removing the header
    "X-Frame-Options": "SAMEORIGIN",
    "X-DNS-Prefetch-Control": false
  };

  /**
   * The middleware function that's called by Drash.
   *
   * @param request - The request object.
   * @param response - (optional) The response object.
   */
  function armor(
    request: Drash.Http.Request,
    response?: Drash.Http.Response,
  ): void {

    // If there is no response, then we know this is occurring before the request
    if (!response) {
      // But we don't care about this. We want to set the headers on the response
      // So yeet this conditional
    }

    // If there is a response, then we know this is occurring after the request
    if (response) {

      // Set "X-XSS-Protection" header. See https://helmetjs.github.io/docs/xss-filter/
      if (configs["X-XSS-Protection"] !== false) {
        response.headers.set("X-XSS-Protection", defaultConfigs["X-XSS-Protection"])
      }

      // Set "Referrer-Policy" header if passed in. See https://helmetjs.github.io/docs/referrer-policy/
      if (configs["Referrer-Policy"]) {
        response.headers.set("Referrer-Policy", configs["Referrer-Policy"])
      }

      // Set the "X-Content-Type-Options" header. See https://helmetjs.github.io/docs/dont-sniff-mimetype/
      if (configs["X-Content-Type-Options"] !== false) {
        response.headers.set("X-Content-Type-Options", defaultConfigs["X-Content-Type-Options"])
      }

      // Set the "Strict-Transport-Security" header. See https://helmetjs.github.io/docs/hsts/
      let hstsHeader = ""
      if (configs.hsts.maxAge) { // if set to a number
        hstsHeader += "max-age=" + configs.hsts.maxAge
      } else if (configs.hsts.maxAge !== false) { // not disabled
        hstsHeader += "max-age=" + defaultConfigs.hsts.maxAge
      }
      if (hstsHeader && configs.hsts.includeSubDomains === true) {
        hstsHeader += "; includeSubDomains"
      } else if (hstsHeader && configs.hsts.includeSubDomains  !== false) {
        hstsHeader += "; includeSubDomains"
      }
      if (hstsHeader && configs.hsts.preload === true) {
        hstsHeader += "; preload"
      } else if (hstsHeader && configs.hsts.preload !== false) {
        hstsHeader += "; preload"
      }
      response.headers.set("Strict-Transport-Policy", hstsHeader)

      // Delete the "X-Powered-By" header. See https://helmetjs.github.io/docs/hide-powered-by/
      if (configs["X-Powered-By"] !== true && defaultConfigs["X-Powered-By"] === false) {
        response.headers.delete("X-Powered-By")
      }

      // Set the "X-Frame-Options" header. See https://helmetjs.github.io/docs/frameguard/
      if (configs["X-Frame-Options"]) {
        response.headers.set("X-Frame-Options", configs["X-Frame-Options"])
      } else {
        response.headers.set("X-Frame-Options", defaultConfigs["X-Frame-Options"])
      }

      // Set the "Expect-CT" header. See https://helmetjs.github.io/docs/expect-ct/
      let expectCtHeader = ""
      if (configs.expectCt.maxAge) {
        expectCtHeader += "max-age=" + configs.expectCt.maxAge
      }
      if (expectCtHeader && configs.expectCt.enforce === true) {
        expectCtHeader += "; enforce"
      }
      if (expectCtHeader && configs.expectCt.reportUri) {
        expectCtHeader += "; " + configs.expectCt.reportUri
      }

      // Set the "X-DNS-Prefetch-Control" header. See https://helmetjs.github.io/docs/dns-prefetch-control/
      if (configs["X-DNS-Prefetch-Control"] === true) {
        response.headers.set("X-DNS-Prefetch-Control", "on")
      } else {
        response.headers.set("X-DNS-Prefetch-Control", "off")
      }

      // Set the "Content-Security-Policy" header. See https://helmetjs.github.io/docs/csp/
      if (configs["Content-Security-Policy"]) {
        response.headers.set("Content-Security-Policy", configs["Content-Security-Policy"])
      }

    }
  }

  // Expose the configs in case the user wants to do anything with them
  armor.configs = configs;

  return armor;
}
