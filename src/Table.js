/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const StatusCodeError = require('./StatusCodeError.js');

class Table {
  constructor(oneDrive, prefix, name, log) {
    this._oneDrive = oneDrive;
    this._prefix = prefix;
    this._name = name;
    this._log = log;
  }

  async rename(name) {
    // TODO: check name for allowed characters and length
    try {
      const client = await this._oneDrive.getClient();
      const result = await client({
        uri: this.uri,
        method: 'PATCH',
        body: {
          name,
        },
        json: true,
        headers: {
          'content-type': 'application/json',
        },
      });
      this._name = name;
      return result;
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getHeaderNames() {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client.get(`${this.uri}/headerRowRange`);
      return result.values[0];
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getRows() {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client.get(`${this.uri}/rows`);
      return result.value.map((v) => v.values[0]);
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getRowsAsObjects() {
    const { log } = this;
    try {
      const client = await this._oneDrive.getClient();
      this.log.debug(`get columns from ${this.uri}/columns`);
      const result = await client.get(`${this.uri}/columns`);
      const columnNames = result.value.map(({ name }) => name);
      log.debug(`got column names: ${columnNames}`);

      const rowValues = result.value[0].values
        .map((_, rownum) => columnNames.reduce((row, name, column) => {
          const [value] = result.value[column].values[rownum];
          // eslint-disable-next-line no-param-reassign
          row[name] = value;
          return row;
        }, {}));

      // discard the first row
      rowValues.shift();
      return rowValues;
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getRow(index) {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client.get(`${this.uri}/rows/itemAt(index=${index})`);
      return result.values[0];
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async addRow(values) {
    const result = await this.addRows([values]);
    return result;
  }

  async addRows(values) {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client({
        uri: `${this.uri}/rows/add`,
        method: 'POST',
        body: {
          index: null,
          values,
        },
        json: true,
        headers: {
          'content-type': 'application/json',
        },
      });
      return result.index;
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async replaceRow(index, values) {
    try {
      const client = await this._oneDrive.getClient();
      await client({
        uri: `${this.uri}/rows/itemAt(index=${index})`,
        method: 'PATCH',
        body: {
          values: [values],
        },
        json: true,
        headers: {
          'content-type': 'application/json',
        },
      });
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async deleteRow(index) {
    try {
      const client = await this._oneDrive.getClient();
      await client({
        uri: `${this.uri}/rows/itemAt(index=${index})`,
        method: 'DELETE',
      });
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getRowCount() {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client.get(`${this.uri}/dataBodyRange?$select=rowCount`);
      return result.rowCount;
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  async getColumn(name) {
    try {
      const client = await this._oneDrive.getClient();
      const result = await client.get(`${this.uri}/columns('${name}')`);
      return result.values;
    } catch (e) {
      this.log.error(StatusCodeError.getActualError(e));
      throw new StatusCodeError(e.message, e.statusCode || 500);
    }
  }

  get uri() {
    return `${this._prefix}/${this._name}`;
  }

  get log() {
    return this._log;
  }
}

module.exports = Table;
