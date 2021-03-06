/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Internal error class
 * @private
 */
class StatusCodeError extends Error {
  /**
   * Converts a request-promise error to a status code error w/o revealing too much details.
   * @param {Error} e The original error
   * @returns {StatusCodeError} status code error
   */
  static fromError(e) {
    const err = new StatusCodeError(e.msg, e.statusCode || 500);
    const details = StatusCodeError.getActualError(e);
    if (details) {
      delete details.options;
      delete details.request;
      delete details.response;
      if (Object.keys(details).length) {
        err.details = details;
      }
    }
    return err;
  }

  /**
   * Returns the actual error, recursively descending through all error properties.
   *
   * @param {Error} e error caught
   */
  static getActualError(e) {
    let error = e;
    while (error.error) {
      error = error.error;
    }
    return error;
  }

  constructor(msg, statusCode) {
    super(msg);
    this.statusCode = statusCode;
  }
}

module.exports = StatusCodeError;
