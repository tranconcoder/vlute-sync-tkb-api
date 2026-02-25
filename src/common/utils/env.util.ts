import { EnvKey } from '@/configs/env.config';

export class EnvUtil {
  /**
   * Retrieves an environment variable by its key, with optional validation and default value.
   *
   * @param {EnvKey} key - The environment variable key.
   * @param {boolean} [isRequired=false] - Whether the variable must be present. Throws an error if required and missing.
   * @param defaultValue - The default value to return if the variable is missing.
   * @param transform - Optional function to transform/cast the string value (e.g. Number, Boolean).
   * @returns The environment variable value (transformed if transform is provided), or the default value.
   * @throws {Error} If the environment variable is required and missing, or if no valid or default value is found.
   */
  public static getEnv<T = string>(
    key: EnvKey,
    isRequired: boolean = false,
    defaultValue?: T extends string ? string : T,
    transform?: (value: string) => T,
  ): T {
    const value = process.env[key];

    if (value && value.trim().length)
      return transform ? transform(value) : (value as T);
    if (isRequired) throw new Error(`Not found env for key "${key}"`);
    if (defaultValue !== undefined) return defaultValue as T;

    throw new Error(`Not found value or default value for key "${key}"`);
  }
}
