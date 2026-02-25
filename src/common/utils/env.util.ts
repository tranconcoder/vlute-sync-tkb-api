import { EnvKey } from '../../configs/env.config';

export class EnvUtil {
  /**
   * Retrieves an environment variable by its key, with optional validation and default value.
   *
   * @param {EnvKey} key - The environment variable key.
   * @param {boolean} [isRequired=false] - Whether the variable must be present. Throws an error if required and missing.
   * @param {string} [defaultValue=''] - The default value to return if the variable is missing.
   * @returns {string} The environment variable value, or the default value if defined.
   * @throws {Error} If the environment variable is required and missing, or if no valid or default value is found.
   */
  public static getEnv(
    key: EnvKey,
    isRequired: boolean = false,
    defaultValue: string = '',
  ): string {
    const value = process.env[key];

    if (value && value.trim().length) return value;
    if (isRequired) throw new Error(`Not found env for key "${key}"`);
    if (defaultValue) return defaultValue;

    throw new Error(`Not found value or default value for key "${key}"`);
  }
}
