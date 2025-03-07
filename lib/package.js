(function() {
  var Dependency, Package, Stitch, compilers, eco, fs, stitch, toArray, uglify;

  fs = require('fs');

  eco = require('eco');

  uglify = require('uglify-js');

  compilers = require('./compilers');

  stitch = require('../assets/stitch');

  Dependency = require('./dependency');

  Stitch = require('./stitch');

  toArray = require('./utils').toArray;

  Package = (function() {

    function Package(config) {
      if (config == null) config = {};
      this.identifier = config.identifier;
      this.libs = toArray(config.libs);
      this.paths = toArray(config.paths);
      this.dependencies = toArray(config.dependencies);
    }

    Package.prototype.compileModules = function() {
      this.dependency || (this.dependency = new Dependency(this.dependencies));
      this.stitch = new Stitch(this.paths);
      this.modules = this.dependency.resolve().concat(this.stitch.resolve());
      return stitch({
        identifier: this.identifier,
        modules: this.modules
      });
    };

    Package.prototype.compileLibs = function() {
      var path;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = this.libs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          _results.push(fs.readFileSync(path, 'utf8'));
        }
        return _results;
      }).call(this)).join("\n");
    };

    Package.prototype.compile = function(minify) {
      var result;
      result = [this.compileLibs(), this.compileModules()].join("\n");
      if (minify) result = uglify(result);
      return result;
    };

    Package.prototype._compileDeps = function() {
      this.dependency || (this.dependency = new Dependency(this.dependencies));
      this.modules = this.dependency.resolve();
      return stitch({
        identifier: this.identifier,
        modules: this.modules
      });
    };

    Package.prototype._compileApp = function() {
      this.stitch = new Stitch(this.paths);
      this.modules = this.stitch.resolve();
      return stitch({
        identifier: this.identifier,
        modules: this.modules
      });
    };

    Package.prototype.compileApp = function(minify) {
      var result;
      result = [this._compileApp()].join("\n");
      if (minify) result = uglify(result);
      return result;
    };

    Package.prototype.compileLibrary = function(minify) {
      var result;
      result = [this.compileLibs()].join("\n");
      if (minify) result = uglify(result);
      return result;
    };

    Package.prototype.compileDependencies = function(minify) {
      var result;
      result = [this._compileDeps()].join("\n");
      if (minify) result = uglify(result);
      return result;
    };

    Package.prototype.createServerDev = function(kind) {
      var _this = this;
      return function(env, callback) {
        var content;
        switch (kind) {
          case 'app':
            content = _this.compileApp();
            break;
          case 'lib':
            content = _this.compileLibrary();
            break;
          case 'deps':
            content = _this.compileDependencies();
        }
        return callback(200, {
          'Content-Type': 'text/javascript'
        }, content);
      };
    };

    Package.prototype.createServer = function() {
      var _this = this;
      return function(env, callback) {
        return callback(200, {
          'Content-Type': 'text/javascript'
        }, _this.compile());
      };
    };

    return Package;

  })();

  module.exports = {
    compilers: compilers,
    Package: Package,
    createPackage: function(config) {
      return new Package(config);
    }
  };

}).call(this);
