/**
 * serializeBigInt - Reusable helper to recursively convert BigInt values to strings
 * 
 * ethers v6 returns JavaScript BigInt values for uint256 and other integer types.
 * JSON.stringify() does not know how to serialize BigInt, causing:
 *   TypeError: Do not know how to serialize a BigInt
 * 
 * This helper recursively walks any value (primitive, object, array) and converts
 * every BigInt to a string. It also deeply converts nested structures.
 * 
 * Usage:
 *   import serializeBigInt from '../utils/serializeBigInt';
 *   const data = serializeBigInt(contractResult);
 */

/**
 * Recursively convert all BigInt values in a data structure to strings.
 * Preserves all other types as-is.
 * 
 * @param {*} value - Any JavaScript value (primitive, object, array, BigInt, etc.)
 * @returns {*} - The same data with all BigInt values converted to strings
 */
function serializeBigInt(value) {
  // Handle BigInt directly
  if (typeof value === 'bigint') {
    return value.toString();
  }

  // Handle arrays (including nested)
  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  // Handle objects (including plain objects, but NOT null)
  if (value !== null && typeof value === 'object') {
    // Handle special object types that should not be recursed into
    if (
      value instanceof Date ||
      value instanceof Blob ||
      value instanceof File ||
      value instanceof RegExp
    ) {
      return value;
    }

    // Check if it's a BigInt wrapper object (unlikely but safe)
    if (typeof value.valueOf === 'function' && typeof value.valueOf() === 'bigint') {
      return value.valueOf().toString();
    }

    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = serializeBigInt(value[key]);
    }
    return result;
  }

  // Primitives (string, number, boolean, null, undefined, symbol) pass through
  return value;
}

/**
 * JSON.stringify wrapper that safely handles BigInt values.
 * Use this instead of JSON.stringify() anywhere contract data may be serialized.
 * 
 * @param {*} value - Value to serialize
 * @param {*} replacer - Optional standard JSON.stringify replacer
 * @param {number|string} space - Optional spacing parameter
 * @returns {string} - JSON string with BigInt converted to strings
 */
export function safeStringify(value, replacer = null, space = undefined) {
  return JSON.stringify(serializeBigInt(value), replacer, space);
}

/**
 * JSON.parse wrapper that attempts to restore string numbers back to numbers
 * where safe. This is a best-effort recovery for serialized BigInt strings.
 * Note: Large uint256 values (> Number.MAX_SAFE_INTEGER) remain as strings to
 * avoid precision loss.
 * 
 * @param {string} text - JSON string
 * @param {*} reviver - Optional standard JSON.parse reviver
 * @returns {*} - Parsed value
 */
export function safeParse(text, reviver = undefined) {
  return JSON.parse(text, (key, value) => {
    // If there's a custom reviver, call it first
    if (typeof reviver === 'function') {
      value = reviver(key, value);
    }
    
    // Attempt to restore safe integer strings back to numbers
    if (typeof value === 'string' && /^-?\d+$/.test(value)) {
      const num = Number(value);
      if (Number.isSafeInteger(num) && num.toString() === value) {
        return num;
      }
      // Keep large numbers as strings to avoid precision loss
      return value;
    }
    
    return value;
  });
}

export default serializeBigInt;