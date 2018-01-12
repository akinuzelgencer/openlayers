/**
 * @module ol/color
 */
import {assert} from './asserts.js';
import {clamp} from './math.js';


/**
 * This RegExp matches # followed by 3, 4, 6, or 8 hex digits.
 * @const
 * @type {RegExp}
 * @private
 */
const HEX_COLOR_RE_ = /^#(?:[0-9a-f]{3,4}){1,2}$/i;


/**
 * Regular expression for matching potential named color style strings.
 * @const
 * @type {RegExp}
 * @private
 */
const NAMED_COLOR_RE_ = /^([a-z]*)$/i;


/**
 * Return the color as an rgba string.
 * @param {ol.Color|string} color Color.
 * @return {string} Rgba string.
 * @api
 */
export function asString(color) {
  if (typeof color === 'string') {
    return color;
  } else {
    return toString(color);
  }
}

/**
 * Return named color as an rgba string.
 * @param {string} color Named color.
 * @return {string} Rgb string.
 */
function fromNamed(color) {
  const el = document.createElement('div');
  el.style.color = color;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  return rgb;
}


/**
 * @param {string} s String.
 * @return {ol.Color} Color.
 */
export const fromString = (
  function() {

    // We maintain a small cache of parsed strings.  To provide cheap LRU-like
    // semantics, whenever the cache grows too large we simply delete an
    // arbitrary 25% of the entries.

    /**
     * @const
     * @type {number}
     */
    const MAX_CACHE_SIZE = 1024;

    /**
     * @type {Object.<string, ol.Color>}
     */
    const cache = {};

    /**
     * @type {number}
     */
    let cacheSize = 0;

    return (
      /**
       * @param {string} s String.
       * @return {ol.Color} Color.
       */
      function(s) {
        let color;
        if (cache.hasOwnProperty(s)) {
          color = cache[s];
        } else {
          if (cacheSize >= MAX_CACHE_SIZE) {
            let i = 0;
            let key;
            for (key in cache) {
              if ((i++ & 3) === 0) {
                delete cache[key];
                --cacheSize;
              }
            }
          }
          color = fromStringInternal_(s);
          cache[s] = color;
          ++cacheSize;
        }
        return color;
      }
    );

  })();

/**
 * Return the color as an array. This function maintains a cache of calculated
 * arrays which means the result should not be modified.
 * @param {ol.Color|string} color Color.
 * @return {ol.Color} Color.
 * @api
 */
export function asArray(color) {
  if (Array.isArray(color)) {
    return color;
  } else {
    return fromString(/** @type {string} */ (color));
  }
}

/**
 * @param {string} s String.
 * @private
 * @return {ol.Color} Color.
 */
function fromStringInternal_(s) {
  let r, g, b, a, color, parts;

  if (NAMED_COLOR_RE_.exec(s)) {
    s = fromNamed(s);
  }

  if (HEX_COLOR_RE_.exec(s)) { // hex
    const n = s.length - 1; // number of hex digits
    let d; // number of digits per channel
    if (n <= 4) {
      d = 1;
    } else {
      d = 2;
    }
    const hasAlpha = n === 4 || n === 8;
    r = parseInt(s.substr(1 + 0 * d, d), 16);
    g = parseInt(s.substr(1 + 1 * d, d), 16);
    b = parseInt(s.substr(1 + 2 * d, d), 16);
    if (hasAlpha) {
      a = parseInt(s.substr(1 + 3 * d, d), 16);
    } else {
      a = 255;
    }
    if (d == 1) {
      r = (r << 4) + r;
      g = (g << 4) + g;
      b = (b << 4) + b;
      if (hasAlpha) {
        a = (a << 4) + a;
      }
    }
    color = [r, g, b, a / 255];
  } else if (s.indexOf('rgba(') == 0) { // rgba()
    parts = s.slice(5, -1).split(',').map(Number);
    color = normalize(parts);
  } else if (s.indexOf('rgb(') == 0) { // rgb()
    parts = s.slice(4, -1).split(',').map(Number);
    parts.push(1);
    color = normalize(parts);
  } else {
    assert(false, 14); // Invalid color
  }
  return /** @type {ol.Color} */ (color);
}


/**
 * TODO this function is only used in the test, we probably shouldn't export it
 * @param {ol.Color} color Color.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Clamped color.
 */
export function normalize(color, opt_color) {
  const result = opt_color || [];
  result[0] = clamp((color[0] + 0.5) | 0, 0, 255);
  result[1] = clamp((color[1] + 0.5) | 0, 0, 255);
  result[2] = clamp((color[2] + 0.5) | 0, 0, 255);
  result[3] = clamp(color[3], 0, 1);
  return result;
}


/**
 * @param {ol.Color} color Color.
 * @return {string} String.
 */
export function toString(color) {
  let r = color[0];
  if (r != (r | 0)) {
    r = (r + 0.5) | 0;
  }
  let g = color[1];
  if (g != (g | 0)) {
    g = (g + 0.5) | 0;
  }
  let b = color[2];
  if (b != (b | 0)) {
    b = (b + 0.5) | 0;
  }
  const a = color[3] === undefined ? 1 : color[3];
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
