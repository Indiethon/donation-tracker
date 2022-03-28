const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./db/replicants');
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

class Replicant extends EventEmitter {

  constructor(name, options = {}, startup = Boolean) {
    super();
    this.name = name;
    this.options = options;
    this.__value = undefined;
    if (startup) {
      fs.readFile(path.join(__rootdir, `db/replicants/${this.name}.rep`), (err, data) => {
        if (err) throw new Error('Cannot read replicant file.')
        this.__value = JSON.parse(data);
      })
    }
    else {
      this.__value = (options !== undefined && options.defaultValue !== undefined) ? options.defaultValue : {};
      fs.writeFile(path.join(__rootdir, `db/replicants/${this.name}.rep`), JSON.stringify(this.__value), (err) => {
        if (err) throw new Error(`Error when setting new value to replicant ${this.name}.`)
      });
    };
    this.emit('change', this.__value, undefined)
  }

  get value() {
    return this.__value;
  }

  set value(newVal) {
    if (this.__value === newVal) return console.debug('Value unchanged, assignment rejected.');
    let oldVal = this.__value;
    this.__value = newVal;
    fs.writeFile(path.join(__rootdir, `db/replicants/${this.name}.rep`), JSON.stringify(newVal), (err) => {
      if (err) throw new Error(`Error when setting new value to replicant ${this.name}.`)
    });
    this.emit('change', newVal, oldVal)
  }
}

module.exports = Replicant;