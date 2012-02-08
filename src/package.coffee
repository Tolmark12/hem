fs           = require('fs')
eco          = require('eco')
uglify       = require('uglify-js')
compilers    = require('./compilers')
stitch       = require('../assets/stitch')
Dependency   = require('./dependency')
Stitch       = require('./stitch')
{toArray}    = require('./utils')

class Package
  constructor: (config = {}) ->
    @identifier   = config.identifier
    @libs         = toArray(config.libs)
    @paths        = toArray(config.paths)
    @dependencies = toArray(config.dependencies)

  compileModules: ->
    @dependency or= new Dependency(@dependencies)
    @stitch       = new Stitch(@paths)
    @modules      = @dependency.resolve().concat(@stitch.resolve())
    stitch(identifier: @identifier, modules: @modules)
    
  compileLibs: ->
    (fs.readFileSync(path, 'utf8') for path in @libs).join("\n")
    
  compile: (minify) ->
    result = [@compileLibs(), @compileModules()].join("\n")
    result = uglify(result) if minify
    result
 
  # ---------------------------------------------- NEW

  # ---------- Helpers..

  _compileDeps: ->
    @dependency or= new Dependency(@dependencies)
    @modules      = @dependency.resolve()
    stitch(identifier: @identifier, modules: @modules)

  _compileApp : ->
    @stitch       = new Stitch(@paths)
    @modules      = @stitch.resolve()
    stitch(identifier: @identifier, modules: @modules)
  
  # ---------- Compiles

  compileApp : (minify) ->
    result = [@_compileApp()].join("\n")
    result = uglify(result) if minify
    result

  compileLibrary : (minify) ->
    result = [@compileLibs()].join("\n")
    result = uglify(result) if minify
    result

  compileDependencies : (minify) ->
    result = [@_compileDeps()].join("\n")
    result = uglify(result) if minify
    result
  
  # ---------- Server
    
  createServerDev : ( kind ) ->
    switch kind
      when 'app'
        content = @compileApp
      when 'lib'
        content = @compileLibrary
      when 'deps' 
        content = @compileDependencies
    
    (env, callback) =>
      callback(200, 
        'Content-Type': 'text/javascript', 
        content())

  # ---------------------------------------------- END NEW

  createServer: ->
    (env, callback) =>
      callback(200, 
        'Content-Type': 'text/javascript', 
        @compile())

module.exports = 
  compilers:  compilers
  Package:    Package
  createPackage: (config) -> 
    new Package(config)