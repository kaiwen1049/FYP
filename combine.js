(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
  'use strict';
  
  var R = typeof Reflect === 'object' ? Reflect : null
  var ReflectApply = R && typeof R.apply === 'function'
    ? R.apply
    : function ReflectApply(target, receiver, args) {
      return Function.prototype.apply.call(target, receiver, args);
    }
  
  var ReflectOwnKeys
  if (R && typeof R.ownKeys === 'function') {
    ReflectOwnKeys = R.ownKeys
  } else if (Object.getOwnPropertySymbols) {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
      return Object.getOwnPropertyNames(target)
        .concat(Object.getOwnPropertySymbols(target));
    };
  } else {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
      return Object.getOwnPropertyNames(target);
    };
  }
  
  function ProcessEmitWarning(warning) {
    if (console && console.warn) console.warn(warning);
  }
  
  var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
    return value !== value;
  }
  
  function EventEmitter() {
    EventEmitter.init.call(this);
  }
  module.exports = EventEmitter;
  module.exports.once = once;
  
  // Backwards-compat with node 0.10.x
  EventEmitter.EventEmitter = EventEmitter;
  
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._eventsCount = 0;
  EventEmitter.prototype._maxListeners = undefined;
  
  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  var defaultMaxListeners = 10;
  
  function checkListener(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
    }
  }
  
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
      }
      defaultMaxListeners = arg;
    }
  });
  
  EventEmitter.init = function() {
  
    if (this._events === undefined ||
        this._events === Object.getPrototypeOf(this)._events) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    }
  
    this._maxListeners = this._maxListeners || undefined;
  };
  
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
    }
    this._maxListeners = n;
    return this;
  };
  
  function _getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }
  
  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return _getMaxListeners(this);
  };
  
  EventEmitter.prototype.emit = function emit(type) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    var doError = (type === 'error');
  
    var events = this._events;
    if (events !== undefined)
      doError = (doError && events.error === undefined);
    else if (!doError)
      return false;
  
    // If there is no 'error' event listener then throw.
    if (doError) {
      var er;
      if (args.length > 0)
        er = args[0];
      if (er instanceof Error) {
        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw er; // Unhandled 'error' event
      }
      // At least give some kind of context to the user
      var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
      err.context = er;
      throw err; // Unhandled 'error' event
    }
  
    var handler = events[type];
  
    if (handler === undefined)
      return false;
  
    if (typeof handler === 'function') {
      ReflectApply(handler, this, args);
    } else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        ReflectApply(listeners[i], this, args);
    }
  
    return true;
  };
  
  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;
  
    checkListener(listener);
  
    events = target._events;
    if (events === undefined) {
      events = target._events = Object.create(null);
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener !== undefined) {
        target.emit('newListener', type,
                    listener.listener ? listener.listener : listener);
  
        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }
  
    if (existing === undefined) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
        // If we've already got an array, just append.
      } else if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
  
      // Check for listener leak
      m = _getMaxListeners(target);
      if (m > 0 && existing.length > m && !existing.warned) {
        existing.warned = true;
        // No error code for this since it is a Warning
        // eslint-disable-next-line no-restricted-syntax
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + String(type) + ' listeners ' +
                            'added. Use emitter.setMaxListeners() to ' +
                            'increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        ProcessEmitWarning(w);
      }
    }
  
    return target;
  }
  
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };
  
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  
  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
  
  function onceWrapper() {
    if (!this.fired) {
      this.target.removeListener(this.type, this.wrapFn);
      this.fired = true;
      if (arguments.length === 0)
        return this.listener.call(this.target);
      return this.listener.apply(this.target, arguments);
    }
  }
  
  function _onceWrap(target, type, listener) {
    var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
    var wrapped = onceWrapper.bind(state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
  }
  
  EventEmitter.prototype.once = function once(type, listener) {
    checkListener(listener);
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };
  
  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
  
  // Emits a 'removeListener' event if and only if the listener was removed.
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var list, events, position, i, originalListener;
  
        checkListener(listener);
  
        events = this._events;
        if (events === undefined)
          return this;
  
        list = events[type];
        if (list === undefined)
          return this;
  
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          position = -1;
  
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
  
          if (position < 0)
            return this;
  
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
  
          if (list.length === 1)
            events[type] = list[0];
  
          if (events.removeListener !== undefined)
            this.emit('removeListener', type, originalListener || listener);
        }
  
        return this;
      };
  
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  
  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var listeners, events, i;
  
        events = this._events;
        if (events === undefined)
          return this;
  
        // not listening for removeListener, no need to emit
        if (events.removeListener === undefined) {
          if (arguments.length === 0) {
            this._events = Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== undefined) {
            if (--this._eventsCount === 0)
              this._events = Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
  
        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = Object.create(null);
          this._eventsCount = 0;
          return this;
        }
  
        listeners = events[type];
  
        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners !== undefined) {
          // LIFO order
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
  
        return this;
      };
  
  function _listeners(target, type, unwrap) {
    var events = target._events;
  
    if (events === undefined)
      return [];
  
    var evlistener = events[type];
    if (evlistener === undefined)
      return [];
  
    if (typeof evlistener === 'function')
      return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  
    return unwrap ?
      unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
  }
  
  EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
  };
  
  EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
  };
  
  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };
  
  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;
  
    if (events !== undefined) {
      var evlistener = events[type];
  
      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener !== undefined) {
        return evlistener.length;
      }
    }
  
    return 0;
  }
  
  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
  };
  
  function arrayClone(arr, n) {
    var copy = new Array(n);
    for (var i = 0; i < n; ++i)
      copy[i] = arr[i];
    return copy;
  }
  
  function spliceOne(list, index) {
    for (; index + 1 < list.length; index++)
      list[index] = list[index + 1];
    list.pop();
  }
  
  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }
  
  function once(emitter, name) {
    return new Promise(function (resolve, reject) {
      function errorListener(err) {
        emitter.removeListener(name, resolver);
        reject(err);
      }
  
      function resolver() {
        if (typeof emitter.removeListener === 'function') {
          emitter.removeListener('error', errorListener);
        }
        resolve([].slice.call(arguments));
      };
  
      eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
      if (name !== 'error') {
        addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
      }
    });
  }
  
  function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
    if (typeof emitter.on === 'function') {
      eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
    }
  }
  
  function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
    if (typeof emitter.on === 'function') {
      if (flags.once) {
        emitter.once(name, listener);
      } else {
        emitter.on(name, listener);
      }
    } else if (typeof emitter.addEventListener === 'function') {
      // EventTarget does not have `error` event semantics like Node
      // EventEmitters, we do not listen for `error` events here.
      emitter.addEventListener(name, function wrapListener(arg) {
        // IE does not have builtin `{ once: true }` support so we
        // have to do it manually.
        if (flags.once) {
          emitter.removeEventListener(name, wrapListener);
        }
        listener(arg);
      });
    } else {
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
    }
  }
  
  },{}],2:[function(require,module,exports){
  // shim for using process in browser
  var process = module.exports = {};
  
  // cached from whatever global is present so that test runners that stub it
  // don't break things.  But we need to wrap it in a try catch in case it is
  // wrapped in strict mode code which doesn't define any globals.  It's inside a
  // function because try/catches deoptimize in certain engines.
  
  var cachedSetTimeout;
  var cachedClearTimeout;
  
  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
      throw new Error('clearTimeout has not been defined');
  }
  (function () {
      try {
          if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout;
          } else {
              cachedSetTimeout = defaultSetTimout;
          }
      } catch (e) {
          cachedSetTimeout = defaultSetTimout;
      }
      try {
          if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout;
          } else {
              cachedClearTimeout = defaultClearTimeout;
          }
      } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
      }
  } ())
  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch(e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch(e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }
  
  
  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }
  
  
  
  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  
  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }
  
  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;
  
      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }
  
  process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  };
  
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  process.versions = {};
  
  function noop() {}
  
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.prependListener = noop;
  process.prependOnceListener = noop;
  
  process.listeners = function (name) { return [] }
  
  process.binding = function (name) {
      throw new Error('process.binding is not supported');
  };
  
  process.cwd = function () { return '/' };
  process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
  };
  process.umask = function() { return 0; };
  
  },{}],3:[function(require,module,exports){
  const create360Viewer = require('360-image-viewer');
  const dragDrop = require('drag-drop');
  
  const dropRegion = document.querySelector('#drop-region');
  
  // Get a canvas of some sort, e.g. fullscreen or embedded in a site
  const canvas = createCanvas({
    canvas: document.querySelector('#canvas'),
    // without this, the canvas defaults to full-screen
    // viewport: [ 20, 20, 500, 256 ]
  });
  
  // Get the max image size possible
  const imageUrl = getImageURL();
  
  // whether to always rotate the view
  const autoSpin = false;
  
  // Load your image
  const image = new Image();
  image.src = imageUrl;
  image.onload = () => {
    // Setup the 360 viewer
    const viewer = create360Viewer({
      image: image,
      canvas: canvas
    });
  
    setupDragDrop(canvas, viewer);
  
    // Start canvas render loop
    viewer.start();
  
    viewer.on('tick', (dt) => {
      if (autoSpin && !viewer.controls.dragging) {
        viewer.controls.theta -= dt * 0.00005;
      }
    });
  };
  
  // Utility to create a device pixel scaled canvas
  function createCanvas (opt = {}) {
    // default to full screen (no width/height specified)
    const viewport = opt.viewport || [ 0, 0, 720, 500 ];
  
    const canvas = opt.canvas || document.createElement('canvas');
    canvas.style.top = `${viewport[0]}px`;
    canvas.style.left = `${viewport[1]}px`;
  
    // Resize the canvas with the proper device pixel ratio
    const resizeCanvas = () => {
      // default to fullscreen if viewport width/height is unspecified
      const width = typeof viewport[2] === 'number' ? viewport[2] : window.innerWidth;
      const height = typeof viewport[3] === 'number' ? viewport[3] : window.innerHeight;
      const dpr = window.devicePixelRatio;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
  
    // Ensure the grab cursor appears even when the mouse is outside the window
    const setupGrabCursor = () => {
      canvas.addEventListener('mousedown', () => {
        document.documentElement.classList.remove('grabbing');
        document.documentElement.classList.add('grabbing');
      });
      window.addEventListener('mouseup', () => {
        document.documentElement.classList.remove('grabbing');
      });
    };
  
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setupGrabCursor();
    return canvas;
  }
  
  function getImageURL () {
      var imagename = document.getElementById("imagename").value;
      console.log(imagename);
      let imageUrl = imagename;
    return imageUrl;
  }
  
  function setupDragDrop (canvas, viewer) {
    dragDrop(canvas, {
      onDragEnter: () => {
        
      },
      onDragLeave: () => {
        dropRegion.style.display = 'none';
      },
      onDrop: (files) => {
        var img = new Image();
        img.onload = () => {
          viewer.texture(img);
        };
        img.onerror = () => {
          alert('Could not load image!');
        };
        img.crossOrigin = 'Anonymous';
        img.src = URL.createObjectURL(files[0]);
      }
    });
  }
  },{"360-image-viewer":4,"drag-drop":12}],4:[function(require,module,exports){
  var createSphere = require('primitive-sphere');
  var createControls = require('orbit-controls');
  var createCamera = require('perspective-camera');
  var createRegl = require('regl');
  var createLoop = require('raf-loop');
  var defined = require('defined');
  var assign = require('object-assign');
  
  // Generate some vertex data for a UV sphere
  // This can be re-used instead of computed each time
  var sphere;
  
  module.exports = create360Viewer;
  function create360Viewer (opt) {
    opt = opt || {};
  
    var canvas = opt.canvas || document.createElement('canvas');
  
    if (!sphere) {
      sphere = createSphere(1, {
        segments: 64
      });
    }
  
    // Create a new regl instance
    var regl = createRegl({
      canvas: canvas
    });
  
    // Our perspective camera will hold projection/view matrices
    var camera = createCamera({
      fov: defined(opt.fov, 45 * Math.PI / 180),
      near: 0.1,
      far: 10
    })
  
    // The mouse/touch input controls for the orbiting in 360
    var controls = createControls(assign({}, opt, {
      element: canvas,
      parent: window,
      rotateSpeed: defined(opt.rotateSpeed, 0.75 / (Math.PI * 2)),
      damping: defined(opt.damping, 0.35),
      zoom: false,
      pinch: false,
      distance: 0
    }));
  
    // settings for gl.clear
    var clearOpts = {
      color: [ 0, 0, 0, 0 ],
      depth: 1
    };
  
    var gl = regl._gl;
    var destroyed = false;
  
    // allow HTMLImageElement or unspecified image
    var texture = regl.texture(getTextureParams(opt.image))
  
    // We create a new "mesh" that represents our 360 textured sphere
    var drawMesh = regl({
      // The uniforms for this shader
      uniforms: {
        // Creates a GPU texture from our Image
        map: texture,
        // Camera matrices will have to be passed into this mesh
        projection: regl.prop('projection'),
        view: regl.prop('view')
      },
      // The fragment shader
      frag: [
        'precision highp float;',
        'uniform sampler2D map;',
        'uniform vec4 color;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 uv = 1.0 - vUv;',
        '  gl_FragColor = texture2D(map, uv);',
        '}',
      ].join('\n'),
      // The vertex shader
      vert: [
        'precision highp float;',
        'attribute vec3 position;',
        'attribute vec2 uv;',
        'uniform mat4 projection;',
        'uniform mat4 view;',
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projection * view * vec4(position.xyz, 1.0);',
        '}'
      ].join('\n'),
      // The attributes of the mesh, position and uv (texture coordinate)
      attributes: {
        position: regl.buffer(sphere.positions),
        uv: regl.buffer(sphere.uvs)
      },
      // The indices of the mesh
      elements: regl.elements(sphere.cells)
    });
  
    var api = createLoop(render);
  
    api.clearColor = opt.clearColor || clearOpts.color;
    api.canvas = canvas;
    api.enableControls = controls.enable;
    api.disableControls = controls.disable;
    api.destroy = destroy;
    api.render = render;
  
    api.texture = function (opt) {
      texture(getTextureParams(opt));
    };
  
    api.controls = controls;
    api.camera = camera;
    api.gl = gl;
  
    // render first frame
    render();
  
    return api;
  
    function getTextureParams (image) {
      var defaults = {
        min: 'linear',
        mag: 'linear'
      };
      if (image instanceof Image || image instanceof HTMLImageElement ||
        image instanceof HTMLMediaElement || image instanceof HTMLVideoElement) {
        var size = image.width * image.height;
        return assign(defaults, {
          data: size > 0 ? image : null
        });
      } else {
        return assign(defaults, image);
      }
    }
  
    function destroy () {
      destroyed = true;
      api.stop();
      controls.disable();
      regl.destroy();
    }
  
    function render () {
      if (destroyed) return;
  
      // poll for GL changes
      regl.poll()
  
      var width = gl.drawingBufferWidth;
      var height = gl.drawingBufferHeight;
  
      // clear contents of the drawing buffer
      clearOpts.color = api.clearColor;
      regl.clear(clearOpts);
  
      // update input controls and copy into our perspective camera
      controls.update();
      controls.copyInto(camera.position, camera.direction, camera.up);
  
      // update camera viewport and matrices
      camera.viewport[0] = 0;
      camera.viewport[1] = 0;
      camera.viewport[2] = width;
      camera.viewport[3] = height;
      camera.update();
  
      // draw our 360 sphere with the new camera matrices
      drawMesh({
        projection: camera.projection,
        view: camera.view
      });
  
      // flush all pending webgl calls
      gl.flush()
    }
  }
  
  },{"defined":10,"object-assign":42,"orbit-controls":43,"perspective-camera":47,"primitive-sphere":52,"raf-loop":55,"regl":62}],5:[function(require,module,exports){
  var unproject = require('camera-unproject')
  var set = require('gl-vec3/set')
  var sub = require('gl-vec3/subtract')
  var normalize = require('gl-vec3/normalize')
  
  module.exports = createPickRay
  function createPickRay(origin, direction, point, viewport, invProjView) {
    set(origin, point[0], point[1], 0)
    set(direction, point[0], point[1], 1)
    unproject(origin, origin, viewport, invProjView)
    unproject(direction, direction, viewport, invProjView)
    sub(direction, direction, origin)
    normalize(direction, direction)
    
  }
  },{"camera-unproject":7,"gl-vec3/normalize":28,"gl-vec3/set":31,"gl-vec3/subtract":33}],6:[function(require,module,exports){
  var transformMat4 = require('gl-vec4/transformMat4')
  var set = require('gl-vec4/set')
  
  var NEAR_RANGE = 0
  var FAR_RANGE = 1
  var tmp4 = [0, 0, 0, 0]
  
  module.exports = cameraProject
  function cameraProject (out, vec, viewport, combinedProjView) {
    var vX = viewport[0],
      vY = viewport[1],
      vWidth = viewport[2],
      vHeight = viewport[3],
      n = NEAR_RANGE,
      f = FAR_RANGE
  
    // convert: clip space -> NDC -> window coords
    // implicit 1.0 for w component
    set(tmp4, vec[0], vec[1], vec[2], 1.0)
  
    // transform into clip space
    transformMat4(tmp4, tmp4, combinedProjView)
  
    // now transform into NDC
    var w = tmp4[3]
    if (w !== 0) { // how to handle infinity here?
      tmp4[0] = tmp4[0] / w
      tmp4[1] = tmp4[1] / w
      tmp4[2] = tmp4[2] / w
    }
  
    // and finally into window coordinates
    // the foruth component is (1/clip.w)
    // which is the same as gl_FragCoord.w
    out[0] = vX + vWidth / 2 * tmp4[0] + (0 + vWidth / 2)
    out[1] = vY + vHeight / 2 * tmp4[1] + (0 + vHeight / 2)
    out[2] = (f - n) / 2 * tmp4[2] + (f + n) / 2
    out[3] = w === 0 ? 0 : 1 / w
    return out
  }
  
  },{"gl-vec4/set":37,"gl-vec4/transformMat4":38}],7:[function(require,module,exports){
  var transform = require('./lib/projectMat4')
  
  module.exports = unproject
  
  /**
   * Unproject a point from screen space to 3D space.
   * The point should have its x and y properties set to
   * 2D screen space, and the z either at 0 (near plane)
   * or 1 (far plane). The provided matrix is assumed to already
   * be combined, i.e. projection * view.
   *
   * After this operation, the out vector's [x, y, z] components will
   * represent the unprojected 3D coordinate.
   *
   * @param  {vec3} out               the output vector
   * @param  {vec3} vec               the 2D space vector to unproject
   * @param  {vec4} viewport          screen x, y, width and height in pixels
   * @param  {mat4} invProjectionView combined projection and view matrix
   * @return {vec3}                   the output vector
   */
  function unproject (out, vec, viewport, invProjectionView) {
    var viewX = viewport[0],
      viewY = viewport[1],
      viewWidth = viewport[2],
      viewHeight = viewport[3]
  
    var x = vec[0],
      y = vec[1],
      z = vec[2]
    x = x - viewX
    y = viewHeight - y - 1
    y = y - viewY
  
    out[0] = (2 * x) / viewWidth - 1
    out[1] = (2 * y) / viewHeight - 1
    out[2] = 2 * z - 1
    return transform(out, out, invProjectionView)
  }
  
  },{"./lib/projectMat4":8}],8:[function(require,module,exports){
  module.exports = project
  
  /**
   * Multiplies the input vec by the specified matrix, 
   * applying a W divide, and stores the result in out 
   * vector. This is useful for projection,
   * e.g. unprojecting a 2D point into 3D space.
   *
   * @method  prj
   * @param {vec3} out the output vector
   * @param {vec3} vec the input vector to project
   * @param {mat4} m the 4x4 matrix to multiply with 
   * @return {vec3} the out vector
   */
  function project (out, vec, m) {
    var x = vec[0],
      y = vec[1],
      z = vec[2],
      a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
      a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
      a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
      a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]
  
    var lw = 1 / (x * a03 + y * a13 + z * a23 + a33)
    out[0] = (x * a00 + y * a10 + z * a20 + a30) * lw
    out[1] = (x * a01 + y * a11 + z * a21 + a31) * lw
    out[2] = (x * a02 + y * a12 + z * a22 + a32) * lw
    return out
  }
  
  },{}],9:[function(require,module,exports){
  module.exports = clamp
  
  function clamp(value, min, max) {
    return min < max
      ? (value < min ? min : value > max ? max : value)
      : (value < max ? max : value > min ? min : value)
  }
  
  },{}],10:[function(require,module,exports){
  module.exports = function () {
      for (var i = 0; i < arguments.length; i++) {
          if (arguments[i] !== undefined) return arguments[i];
      }
  };
  
  },{}],11:[function(require,module,exports){
  module.exports = defaultProperty
  
  function defaultProperty (get, set) {
    return {
      configurable: true,
      enumerable: true,
      get: get,
      set: set
    }
  }
  
  },{}],12:[function(require,module,exports){
  /*! drag-drop. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
  module.exports = dragDrop
  module.exports.processItems = processItems
  
  const parallel = require('run-parallel')
  
  function dragDrop (elem, listeners) {
    if (typeof elem === 'string') {
      const selector = elem
      elem = window.document.querySelector(elem)
      if (!elem) {
        throw new Error(`"${selector}" does not match any HTML elements`)
      }
    }
  
    if (!elem) {
      throw new Error(`"${elem}" is not a valid HTML element`)
    }
  
    if (typeof listeners === 'function') {
      listeners = { onDrop: listeners }
    }
  
    elem.addEventListener('dragenter', onDragEnter, false)
    elem.addEventListener('dragover', onDragOver, false)
    elem.addEventListener('dragleave', onDragLeave, false)
    elem.addEventListener('drop', onDrop, false)
  
    let isEntered = false
    let numIgnoredEnters = 0
  
    // Function to remove drag-drop listeners
    return function cleanup () {
      removeDragClass()
      elem.removeEventListener('dragenter', onDragEnter, false)
      elem.removeEventListener('dragover', onDragOver, false)
      elem.removeEventListener('dragleave', onDragLeave, false)
      elem.removeEventListener('drop', onDrop, false)
    }
  
    function isEventHandleable (event) {
      if (event.dataTransfer.items || event.dataTransfer.types) {
        // Only add "drag" class when `items` contains items that are able to be
        // handled by the registered listeners (files vs. text)
        const items = Array.from(event.dataTransfer.items)
        const types = Array.from(event.dataTransfer.types)
  
        let fileItems
        let textItems
        if (items.length) {
          fileItems = items.filter(item => { return item.kind === 'file' })
          textItems = items.filter(item => { return item.kind === 'string' })
        } else if (types.length) {
          // event.dataTransfer.items is empty during 'dragover' in Safari, so use
          // event.dataTransfer.types as a fallback
          fileItems = types.filter(item => item === 'Files')
          textItems = types.filter(item => item.startsWith('text/'))
        } else {
          return false
        }
  
        if (fileItems.length === 0 && !listeners.onDropText) return false
        if (textItems.length === 0 && !listeners.onDrop) return false
        if (fileItems.length === 0 && textItems.length === 0) return false
  
        return true
      }
      return false
    }
  
    function onDragEnter (event) {
      event.stopPropagation()
      event.preventDefault()
  
      if (!isEventHandleable(event)) return
  
      if (isEntered) {
        numIgnoredEnters += 1
        return false // early return
      }
  
      isEntered = true
  
      if (listeners.onDragEnter) {
        listeners.onDragEnter(event)
      }
  
      addDragClass()
  
      return false
    }
  
    function onDragOver (event) {
      event.stopPropagation()
      event.preventDefault()
  
      if (!isEventHandleable(event)) return
  
      if (listeners.onDragOver) {
        listeners.onDragOver(event)
      }
  
      event.dataTransfer.dropEffect = 'copy'
  
      return false
    }
  
    function onDragLeave (event) {
      event.stopPropagation()
      event.preventDefault()
  
      if (!isEventHandleable(event)) return
  
      if (numIgnoredEnters > 0) {
        numIgnoredEnters -= 1
        return false
      }
  
      isEntered = false
  
      if (listeners.onDragLeave) {
        listeners.onDragLeave(event)
      }
  
      removeDragClass()
  
      return false
    }
  
    function onDrop (event) {
      event.stopPropagation()
      event.preventDefault()
  
      if (listeners.onDragLeave) {
        listeners.onDragLeave(event)
      }
  
      removeDragClass()
  
      isEntered = false
      numIgnoredEnters = 0
  
      const pos = {
        x: event.clientX,
        y: event.clientY
      }
  
      // text drop support
      const text = event.dataTransfer.getData('text')
      if (text && listeners.onDropText) {
        listeners.onDropText(text, pos)
      }
  
      // File drop support. The `dataTransfer.items` API supports directories, so we
      // use it instead of `dataTransfer.files`, even though it's much more
      // complicated to use.
      // See: https://github.com/feross/drag-drop/issues/39
      if (listeners.onDrop && event.dataTransfer.items) {
        processItems(event.dataTransfer.items, (err, files, directories) => {
          if (err) {
            // TODO: A future version of this library might expose this somehow
            console.error(err)
            return
          }
  
          if (files.length === 0) return
  
          const fileList = event.dataTransfer.files
  
          // TODO: This callback has too many arguments, and the order is too
          // arbitrary. In next major version, it should be cleaned up.
          listeners.onDrop(files, pos, fileList, directories)
        })
      }
  
      return false
    }
  
    function addDragClass () {
      elem.classList.add('drag')
    }
  
    function removeDragClass () {
      elem.classList.remove('drag')
    }
  }
  
  function processItems (items, cb) {
    // Handle directories in Chrome using the proprietary FileSystem API
    items = Array.from(items).filter(item => {
      return item.kind === 'file'
    })
  
    if (items.length === 0) {
      cb(null, [], [])
    }
  
    parallel(items.map(item => {
      return cb => {
        processEntry(item.webkitGetAsEntry(), cb)
      }
    }), (err, results) => {
      // This catches permission errors with file:// in Chrome
      if (err) {
        cb(err)
        return
      }
  
      const entries = results.flat(Infinity)
  
      const files = entries.filter(item => {
        return item.isFile
      })
  
      const directories = entries.filter(item => {
        return item.isDirectory
      })
  
      cb(null, files, directories)
    })
  }
  
  function processEntry (entry, cb) {
    let entries = []
  
    if (entry.isFile) {
      entry.file(file => {
        file.fullPath = entry.fullPath // preserve path for consumer
        file.isFile = true
        file.isDirectory = false
        cb(null, file)
      }, err => {
        cb(err)
      })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      readEntries(reader)
    }
  
    function readEntries (reader) {
      reader.readEntries(currentEntries => {
        if (currentEntries.length > 0) {
          entries = entries.concat(Array.from(currentEntries))
          readEntries(reader) // continue reading entries until `readEntries` returns no more
        } else {
          doneEntries()
        }
      })
    }
  
    function doneEntries () {
      parallel(entries.map(entry => {
        return cb => {
          processEntry(entry, cb)
        }
      }), (err, results) => {
        if (err) {
          cb(err)
        } else {
          results.push({
            fullPath: entry.fullPath,
            name: entry.name,
            isFile: false,
            isDirectory: true
          })
          cb(null, results)
        }
      })
    }
  }
  
  },{"run-parallel":64}],13:[function(require,module,exports){
  module.exports = identity;
  
  /**
   * Set a mat4 to the identity matrix
   *
   * @param {mat4} out the receiving matrix
   * @returns {mat4} out
   */
  function identity(out) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
  };
  },{}],14:[function(require,module,exports){
  module.exports = invert;
  
  /**
   * Inverts a mat4
   *
   * @param {mat4} out the receiving matrix
   * @param {mat4} a the source matrix
   * @returns {mat4} out
   */
  function invert(out, a) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
          a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
          a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
          a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
  
          b00 = a00 * a11 - a01 * a10,
          b01 = a00 * a12 - a02 * a10,
          b02 = a00 * a13 - a03 * a10,
          b03 = a01 * a12 - a02 * a11,
          b04 = a01 * a13 - a03 * a11,
          b05 = a02 * a13 - a03 * a12,
          b06 = a20 * a31 - a21 * a30,
          b07 = a20 * a32 - a22 * a30,
          b08 = a20 * a33 - a23 * a30,
          b09 = a21 * a32 - a22 * a31,
          b10 = a21 * a33 - a23 * a31,
          b11 = a22 * a33 - a23 * a32,
  
          // Calculate the determinant
          det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  
      if (!det) { 
          return null; 
      }
      det = 1.0 / det;
  
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  
      return out;
  };
  },{}],15:[function(require,module,exports){
  var identity = require('./identity');
  
  module.exports = lookAt;
  
  /**
   * Generates a look-at matrix with the given eye position, focal point, and up axis
   *
   * @param {mat4} out mat4 frustum matrix will be written into
   * @param {vec3} eye Position of the viewer
   * @param {vec3} center Point the viewer is looking at
   * @param {vec3} up vec3 pointing up
   * @returns {mat4} out
   */
  function lookAt(out, eye, center, up) {
      var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
          eyex = eye[0],
          eyey = eye[1],
          eyez = eye[2],
          upx = up[0],
          upy = up[1],
          upz = up[2],
          centerx = center[0],
          centery = center[1],
          centerz = center[2];
  
      if (Math.abs(eyex - centerx) < 0.000001 &&
          Math.abs(eyey - centery) < 0.000001 &&
          Math.abs(eyez - centerz) < 0.000001) {
          return identity(out);
      }
  
      z0 = eyex - centerx;
      z1 = eyey - centery;
      z2 = eyez - centerz;
  
      len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
      z0 *= len;
      z1 *= len;
      z2 *= len;
  
      x0 = upy * z2 - upz * z1;
      x1 = upz * z0 - upx * z2;
      x2 = upx * z1 - upy * z0;
      len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
      if (!len) {
          x0 = 0;
          x1 = 0;
          x2 = 0;
      } else {
          len = 1 / len;
          x0 *= len;
          x1 *= len;
          x2 *= len;
      }
  
      y0 = z1 * x2 - z2 * x1;
      y1 = z2 * x0 - z0 * x2;
      y2 = z0 * x1 - z1 * x0;
  
      len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
      if (!len) {
          y0 = 0;
          y1 = 0;
          y2 = 0;
      } else {
          len = 1 / len;
          y0 *= len;
          y1 *= len;
          y2 *= len;
      }
  
      out[0] = x0;
      out[1] = y0;
      out[2] = z0;
      out[3] = 0;
      out[4] = x1;
      out[5] = y1;
      out[6] = z1;
      out[7] = 0;
      out[8] = x2;
      out[9] = y2;
      out[10] = z2;
      out[11] = 0;
      out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
      out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
      out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
      out[15] = 1;
  
      return out;
  };
  },{"./identity":13}],16:[function(require,module,exports){
  module.exports = multiply;
  
  /**
   * Multiplies two mat4's
   *
   * @param {mat4} out the receiving matrix
   * @param {mat4} a the first operand
   * @param {mat4} b the second operand
   * @returns {mat4} out
   */
  function multiply(out, a, b) {
      var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
          a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
          a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
          a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  
      // Cache only the current line of the second matrix
      var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
      out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  
      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  
      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  
      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      return out;
  };
  },{}],17:[function(require,module,exports){
  module.exports = perspective;
  
  /**
   * Generates a perspective projection matrix with the given bounds
   *
   * @param {mat4} out mat4 frustum matrix will be written into
   * @param {number} fovy Vertical field of view in radians
   * @param {number} aspect Aspect ratio. typically viewport width/height
   * @param {number} near Near bound of the frustum
   * @param {number} far Far bound of the frustum
   * @returns {mat4} out
   */
  function perspective(out, fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2),
          nf = 1 / (near - far);
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[14] = (2 * far * near) * nf;
      out[15] = 0;
      return out;
  };
  },{}],18:[function(require,module,exports){
  module.exports = rotateY;
  
  /**
   * Rotates a matrix by the given angle around the Y axis
   *
   * @param {mat4} out the receiving matrix
   * @param {mat4} a the matrix to rotate
   * @param {Number} rad the angle to rotate the matrix by
   * @returns {mat4} out
   */
  function rotateY(out, a, rad) {
      var s = Math.sin(rad),
          c = Math.cos(rad),
          a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3],
          a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
  
      if (a !== out) { // If the source and destination differ, copy the unchanged rows
          out[4]  = a[4];
          out[5]  = a[5];
          out[6]  = a[6];
          out[7]  = a[7];
          out[12] = a[12];
          out[13] = a[13];
          out[14] = a[14];
          out[15] = a[15];
      }
  
      // Perform axis-specific matrix multiplication
      out[0] = a00 * c - a20 * s;
      out[1] = a01 * c - a21 * s;
      out[2] = a02 * c - a22 * s;
      out[3] = a03 * c - a23 * s;
      out[8] = a00 * s + a20 * c;
      out[9] = a01 * s + a21 * c;
      out[10] = a02 * s + a22 * c;
      out[11] = a03 * s + a23 * c;
      return out;
  };
  },{}],19:[function(require,module,exports){
  module.exports = rotateZ;
  
  /**
   * Rotates a matrix by the given angle around the Z axis
   *
   * @param {mat4} out the receiving matrix
   * @param {mat4} a the matrix to rotate
   * @param {Number} rad the angle to rotate the matrix by
   * @returns {mat4} out
   */
  function rotateZ(out, a, rad) {
      var s = Math.sin(rad),
          c = Math.cos(rad),
          a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3],
          a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
  
      if (a !== out) { // If the source and destination differ, copy the unchanged last row
          out[8]  = a[8];
          out[9]  = a[9];
          out[10] = a[10];
          out[11] = a[11];
          out[12] = a[12];
          out[13] = a[13];
          out[14] = a[14];
          out[15] = a[15];
      }
  
      // Perform axis-specific matrix multiplication
      out[0] = a00 * c + a10 * s;
      out[1] = a01 * c + a11 * s;
      out[2] = a02 * c + a12 * s;
      out[3] = a03 * c + a13 * s;
      out[4] = a10 * c - a00 * s;
      out[5] = a11 * c - a01 * s;
      out[6] = a12 * c - a02 * s;
      out[7] = a13 * c - a03 * s;
      return out;
  };
  },{}],20:[function(require,module,exports){
  module.exports = invert
  
  /**
   * Calculates the inverse of a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {quat} a quat to calculate inverse of
   * @returns {quat} out
   */
  function invert (out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
      dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3,
      invDot = dot ? 1.0 / dot : 0
  
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0
  
    out[0] = -a0 * invDot
    out[1] = -a1 * invDot
    out[2] = -a2 * invDot
    out[3] = a3 * invDot
    return out
  }
  
  },{}],21:[function(require,module,exports){
  /**
   * Normalize a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {quat} a quaternion to normalize
   * @returns {quat} out
   * @function
   */
  module.exports = require('gl-vec4/normalize')
  
  },{"gl-vec4/normalize":36}],22:[function(require,module,exports){
  module.exports = distance
  
  /**
   * Calculates the euclidian distance between two vec2's
   *
   * @param {vec2} a the first operand
   * @param {vec2} b the second operand
   * @returns {Number} distance between a and b
   */
  function distance(a, b) {
      var x = b[0] - a[0],
          y = b[1] - a[1]
      return Math.sqrt(x*x + y*y)
  }
  },{}],23:[function(require,module,exports){
  module.exports = add;
  
  /**
   * Adds two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {vec3} out
   */
  function add(out, a, b) {
      out[0] = a[0] + b[0]
      out[1] = a[1] + b[1]
      out[2] = a[2] + b[2]
      return out
  }
  },{}],24:[function(require,module,exports){
  module.exports = copy;
  
  /**
   * Copy the values from one vec3 to another
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the source vector
   * @returns {vec3} out
   */
  function copy(out, a) {
      out[0] = a[0]
      out[1] = a[1]
      out[2] = a[2]
      return out
  }
  },{}],25:[function(require,module,exports){
  module.exports = cross;
  
  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {vec3} out
   */
  function cross(out, a, b) {
      var ax = a[0], ay = a[1], az = a[2],
          bx = b[0], by = b[1], bz = b[2]
  
      out[0] = ay * bz - az * by
      out[1] = az * bx - ax * bz
      out[2] = ax * by - ay * bx
      return out
  }
  },{}],26:[function(require,module,exports){
  module.exports = dot;
  
  /**
   * Calculates the dot product of two vec3's
   *
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {Number} dot product of a and b
   */
  function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }
  },{}],27:[function(require,module,exports){
  module.exports = length;
  
  /**
   * Calculates the length of a vec3
   *
   * @param {vec3} a vector to calculate length of
   * @returns {Number} length of a
   */
  function length(a) {
      var x = a[0],
          y = a[1],
          z = a[2]
      return Math.sqrt(x*x + y*y + z*z)
  }
  },{}],28:[function(require,module,exports){
  module.exports = normalize;
  
  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a vector to normalize
   * @returns {vec3} out
   */
  function normalize(out, a) {
      var x = a[0],
          y = a[1],
          z = a[2]
      var len = x*x + y*y + z*z
      if (len > 0) {
          //TODO: evaluate use of glm_invsqrt here?
          len = 1 / Math.sqrt(len)
          out[0] = a[0] * len
          out[1] = a[1] * len
          out[2] = a[2] * len
      }
      return out
  }
  },{}],29:[function(require,module,exports){
  module.exports = scale;
  
  /**
   * Scales a vec3 by a scalar number
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the vector to scale
   * @param {Number} b amount to scale the vector by
   * @returns {vec3} out
   */
  function scale(out, a, b) {
      out[0] = a[0] * b
      out[1] = a[1] * b
      out[2] = a[2] * b
      return out
  }
  },{}],30:[function(require,module,exports){
  module.exports = scaleAndAdd;
  
  /**
   * Adds two vec3's after scaling the second operand by a scalar value
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @param {Number} scale the amount to scale b by before adding
   * @returns {vec3} out
   */
  function scaleAndAdd(out, a, b, scale) {
      out[0] = a[0] + (b[0] * scale)
      out[1] = a[1] + (b[1] * scale)
      out[2] = a[2] + (b[2] * scale)
      return out
  }
  },{}],31:[function(require,module,exports){
  module.exports = set;
  
  /**
   * Set the components of a vec3 to the given values
   *
   * @param {vec3} out the receiving vector
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} out
   */
  function set(out, x, y, z) {
      out[0] = x
      out[1] = y
      out[2] = z
      return out
  }
  },{}],32:[function(require,module,exports){
  module.exports = squaredDistance;
  
  /**
   * Calculates the squared euclidian distance between two vec3's
   *
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {Number} squared distance between a and b
   */
  function squaredDistance(a, b) {
      var x = b[0] - a[0],
          y = b[1] - a[1],
          z = b[2] - a[2]
      return x*x + y*y + z*z
  }
  },{}],33:[function(require,module,exports){
  module.exports = subtract;
  
  /**
   * Subtracts vector b from vector a
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {vec3} out
   */
  function subtract(out, a, b) {
      out[0] = a[0] - b[0]
      out[1] = a[1] - b[1]
      out[2] = a[2] - b[2]
      return out
  }
  },{}],34:[function(require,module,exports){
  module.exports = transformMat4;
  
  /**
   * Transforms the vec3 with a mat4.
   * 4th vector component is implicitly '1'
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the vector to transform
   * @param {mat4} m matrix to transform with
   * @returns {vec3} out
   */
  function transformMat4(out, a, m) {
      var x = a[0], y = a[1], z = a[2],
          w = m[3] * x + m[7] * y + m[11] * z + m[15]
      w = w || 1.0
      out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w
      out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w
      out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
      return out
  }
  },{}],35:[function(require,module,exports){
  module.exports = transformQuat;
  
  /**
   * Transforms the vec3 with a quat
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the vector to transform
   * @param {quat} q quaternion to transform with
   * @returns {vec3} out
   */
  function transformQuat(out, a, q) {
      // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations
  
      var x = a[0], y = a[1], z = a[2],
          qx = q[0], qy = q[1], qz = q[2], qw = q[3],
  
          // calculate quat * vec
          ix = qw * x + qy * z - qz * y,
          iy = qw * y + qz * x - qx * z,
          iz = qw * z + qx * y - qy * x,
          iw = -qx * x - qy * y - qz * z
  
      // calculate result * inverse quat
      out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
      out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
      out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
      return out
  }
  },{}],36:[function(require,module,exports){
  module.exports = normalize
  
  /**
   * Normalize a vec4
   *
   * @param {vec4} out the receiving vector
   * @param {vec4} a vector to normalize
   * @returns {vec4} out
   */
  function normalize (out, a) {
    var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3]
    var len = x * x + y * y + z * z + w * w
    if (len > 0) {
      len = 1 / Math.sqrt(len)
      out[0] = x * len
      out[1] = y * len
      out[2] = z * len
      out[3] = w * len
    }
    return out
  }
  
  },{}],37:[function(require,module,exports){
  module.exports = set
  
  /**
   * Set the components of a vec4 to the given values
   *
   * @param {vec4} out the receiving vector
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @param {Number} w W component
   * @returns {vec4} out
   */
  function set (out, x, y, z, w) {
    out[0] = x
    out[1] = y
    out[2] = z
    out[3] = w
    return out
  }
  
  },{}],38:[function(require,module,exports){
  module.exports = transformMat4
  
  /**
   * Transforms the vec4 with a mat4.
   *
   * @param {vec4} out the receiving vector
   * @param {vec4} a the vector to transform
   * @param {mat4} m matrix to transform with
   * @returns {vec4} out
   */
  function transformMat4 (out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3]
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w
    return out
  }
  
  },{}],39:[function(require,module,exports){
  if (typeof Object.create === 'function') {
    // implementation from standard node.js 'util' module
    module.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        })
      }
    };
  } else {
    // old school shim for old browsers
    module.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor
        var TempCtor = function () {}
        TempCtor.prototype = superCtor.prototype
        ctor.prototype = new TempCtor()
        ctor.prototype.constructor = ctor
      }
    }
  }
  
  },{}],40:[function(require,module,exports){
  var rootPosition = { left: 0, top: 0 }
  
  module.exports = mouseEventOffset
  function mouseEventOffset (ev, target, out) {
    target = target || ev.currentTarget || ev.srcElement
    if (!Array.isArray(out)) {
      out = [ 0, 0 ]
    }
    var cx = ev.clientX || 0
    var cy = ev.clientY || 0
    var rect = getBoundingClientOffset(target)
    out[0] = cx - rect.left
    out[1] = cy - rect.top
    return out
  }
  
  function getBoundingClientOffset (element) {
    if (element === window ||
        element === document ||
        element === document.body) {
      return rootPosition
    } else {
      return element.getBoundingClientRect()
    }
  }
  
  },{}],41:[function(require,module,exports){
  'use strict'
  
  var toPX = require('to-px')
  
  module.exports = mouseWheelListen
  
  function mouseWheelListen(element, callback, noScroll) {
    if(typeof element === 'function') {
      noScroll = !!callback
      callback = element
      element = window
    }
    var lineHeight = toPX('ex', element)
    var listener = function(ev) {
      if(noScroll) {
        ev.preventDefault()
      }
      var dx = ev.deltaX || 0
      var dy = ev.deltaY || 0
      var dz = ev.deltaZ || 0
      var mode = ev.deltaMode
      var scale = 1
      switch(mode) {
        case 1:
          scale = lineHeight
        break
        case 2:
          scale = window.innerHeight
        break
      }
      dx *= scale
      dy *= scale
      dz *= scale
      if(dx || dy || dz) {
        return callback(dx, dy, dz, ev)
      }
    }
    element.addEventListener('wheel', listener)
    return listener
  }
  
  },{"to-px":65}],42:[function(require,module,exports){
  /*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  */
  
  'use strict';
  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;
  
  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError('Object.assign cannot be called with null or undefined');
    }
  
    return Object(val);
  }
  
  function shouldUseNative() {
    try {
      if (!Object.assign) {
        return false;
      }
  
      // Detect buggy property enumeration order in older V8 versions.
  
      // https://bugs.chromium.org/p/v8/issues/detail?id=4118
      var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
      test1[5] = 'de';
      if (Object.getOwnPropertyNames(test1)[0] === '5') {
        return false;
      }
  
      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test2 = {};
      for (var i = 0; i < 10; i++) {
        test2['_' + String.fromCharCode(i)] = i;
      }
      var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
        return test2[n];
      });
      if (order2.join('') !== '0123456789') {
        return false;
      }
  
      // https://bugs.chromium.org/p/v8/issues/detail?id=3056
      var test3 = {};
      'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
        test3[letter] = letter;
      });
      if (Object.keys(Object.assign({}, test3)).join('') !==
          'abcdefghijklmnopqrst') {
        return false;
      }
  
      return true;
    } catch (err) {
      // We don't expect any of the above to throw, but better to be safe.
      return false;
    }
  }
  
  module.exports = shouldUseNative() ? Object.assign : function (target, source) {
    var from;
    var to = toObject(target);
    var symbols;
  
    for (var s = 1; s < arguments.length; s++) {
      from = Object(arguments[s]);
  
      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }
  
      if (getOwnPropertySymbols) {
        symbols = getOwnPropertySymbols(from);
        for (var i = 0; i < symbols.length; i++) {
          if (propIsEnumerable.call(from, symbols[i])) {
            to[symbols[i]] = from[symbols[i]];
          }
        }
      }
    }
  
    return to;
  };
  
  },{}],43:[function(require,module,exports){
  var defined = require('defined')
  var clamp = require('clamp')
  
  var inputEvents = require('./lib/input')
  var quatFromVec3 = require('quat-from-unit-vec3')
  var quatInvert = require('gl-quat/invert')
  
  var glVec3 = {
    length: require('gl-vec3/length'),
    add: require('gl-vec3/add'),
    subtract: require('gl-vec3/subtract'),
    transformQuat: require('gl-vec3/transformQuat'),
    copy: require('gl-vec3/copy'),
    normalize: require('gl-vec3/normalize'),
    cross: require('gl-vec3/cross')
  }
  
  var Y_UP = [0, 1, 0]
  var EPSILON = Math.pow(2, -23)
  var tmpVec3 = [0, 0, 0]
  
  module.exports = createOrbitControls
  function createOrbitControls (opt) {
    opt = opt || {}
  
    var inputDelta = [0, 0, 0] // x, y, zoom
    var offset = [0, 0, 0]
  
    var upQuat = [0, 0, 0, 1]
    var upQuatInverse = upQuat.slice()
    var _phi = defined(opt.phi, Math.PI / 2)
    var _theta = opt.theta || 0
  
    var controls = {
      update: update,
      copyInto: copyInto,
  
      position: opt.position ? opt.position.slice() : [0, 0, 1],
      direction: [0, 0, -1],
      up: opt.up ? opt.up.slice() : [0, 1, 0],
  
      target: opt.target ? opt.target.slice() : [0, 0, 0],
      distance: defined(opt.distance, 1),
      damping: defined(opt.damping, 0.25),
      rotateSpeed: defined(opt.rotateSpeed, 0.28),
      zoomSpeed: defined(opt.zoomSpeed, 0.0075),
      pinchSpeed: defined(opt.pinchSpeed, 0.0075),
  
      pinch: opt.pinching !== false,
      zoom: opt.zoom !== false,
      rotate: opt.rotate !== false,
  
      phiBounds: opt.phiBounds || [0, Math.PI],
      thetaBounds: opt.thetaBounds || [-Infinity, Infinity],
      distanceBounds: opt.distanceBounds || [0, Infinity]
    }
  
    // Compute distance if not defined in user options
    if (typeof opt.distance !== 'number') {
      glVec3.subtract(tmpVec3, controls.position, controls.target)
      controls.distance = glVec3.length(tmpVec3)
    }
  
    var input = inputEvents({
      parent: opt.parent || window,
      element: opt.element,
      rotate: opt.rotate !== false ? inputRotate : null,
      zoom: opt.zoom !== false ? inputZoom : null,
      pinch: opt.pinch !== false ? inputPinch : null
    })
  
    controls.enable = input.enable
    controls.disable = input.disable
  
    Object.defineProperties(controls, {
      phi: {
        get: function () { return _phi },
        set: function (v) {
          _phi = v
          applyPhiTheta()
        }
      },
      theta: {
        get: function () { return _theta },
        set: function (v) {
          _theta = v
          applyPhiTheta()
        }
      },
      dragging: {
        get: function () { return input.isDragging() }
      },
      pinching: {
        get: function () { return input.isPinching() }
      }
    })
  
    // Apply an initial phi and theta
    applyPhiTheta()
  
    return controls
  
    function inputRotate (dx, dy) {
      var PI2 = Math.PI * 2
      inputDelta[0] -= PI2 * dx * controls.rotateSpeed
      inputDelta[1] -= PI2 * dy * controls.rotateSpeed
    }
  
    function inputZoom (delta) {
      inputDelta[2] += delta * controls.zoomSpeed
    }
  
    function inputPinch (delta) {
      inputDelta[2] -= delta * controls.pinchSpeed
    }
  
    function updateDirection () {
      var cameraUp = controls.up || Y_UP
      quatFromVec3(upQuat, cameraUp, Y_UP)
      quatInvert(upQuatInverse, upQuat)
  
      var distance = controls.distance
  
      glVec3.subtract(offset, controls.position, controls.target)
      glVec3.transformQuat(offset, offset, upQuat)
  
      var theta = Math.atan2(offset[0], offset[2])
      var phi = Math.atan2(Math.sqrt(offset[0] * offset[0] + offset[2] * offset[2]), offset[1])
  
      theta += inputDelta[0]
      phi += inputDelta[1]
  
      theta = clamp(theta, controls.thetaBounds[0], controls.thetaBounds[1])
      phi = clamp(phi, controls.phiBounds[0], controls.phiBounds[1])
      phi = clamp(phi, EPSILON, Math.PI - EPSILON)
  
      distance += inputDelta[2]
      distance = clamp(distance, controls.distanceBounds[0], controls.distanceBounds[1])
  
      var radius = Math.abs(distance) <= EPSILON ? EPSILON : distance
      offset[0] = radius * Math.sin(phi) * Math.sin(theta)
      offset[1] = radius * Math.cos(phi)
      offset[2] = radius * Math.sin(phi) * Math.cos(theta)
  
      _phi = phi
      _theta = theta
      controls.distance = distance
  
      glVec3.transformQuat(offset, offset, upQuatInverse)
      glVec3.add(controls.position, controls.target, offset)
      camLookAt(controls.direction, cameraUp, controls.position, controls.target)
    }
  
    function update () {
      updateDirection()
      var damp = typeof controls.damping === 'number' ? controls.damping : 1
      for (var i = 0; i < inputDelta.length; i++) {
        inputDelta[i] *= 1 - damp
      }
    }
  
    function copyInto (position, direction, up) {
      if (position) glVec3.copy(position, controls.position)
      if (direction) glVec3.copy(direction, controls.direction)
      if (up) glVec3.copy(up, controls.up)
    }
  
    function applyPhiTheta () {
      var phi = controls.phi
      var theta = controls.theta
      theta = clamp(theta, controls.thetaBounds[0], controls.thetaBounds[1])
      phi = clamp(phi, controls.phiBounds[0], controls.phiBounds[1])
      phi = clamp(phi, EPSILON, Math.PI - EPSILON)
  
      var dist = Math.max(EPSILON, controls.distance)
      controls.position[0] = dist * Math.sin(phi) * Math.sin(theta)
      controls.position[1] = dist * Math.cos(phi)
      controls.position[2] = dist * Math.sin(phi) * Math.cos(theta)
      glVec3.add(controls.position, controls.position, controls.target)
  
      updateDirection()
    }
  }
  
  function camLookAt (direction, up, position, target) {
    glVec3.copy(direction, target)
    glVec3.subtract(direction, direction, position)
    glVec3.normalize(direction, direction)
  }
  
  },{"./lib/input":44,"clamp":9,"defined":10,"gl-quat/invert":20,"gl-vec3/add":23,"gl-vec3/copy":24,"gl-vec3/cross":25,"gl-vec3/length":27,"gl-vec3/normalize":28,"gl-vec3/subtract":33,"gl-vec3/transformQuat":35,"quat-from-unit-vec3":53}],44:[function(require,module,exports){
  var mouseWheel = require('mouse-wheel')
  var eventOffset = require('mouse-event-offset')
  var createPinch = require('touch-pinch')
  
  module.exports = inputEvents
  function inputEvents (opt) {
    var element = opt.element || window
    var parent = opt.parent || element
    var mouseStart = [0, 0]
    var dragging = false
    var tmp = [0, 0]
    var tmp2 = [0, 0]
    var pinch
  
    var zoomFn = opt.zoom
    var rotateFn = opt.rotate
    var pinchFn = opt.pinch
    var mouseWheelListener
    var enabled = false
    enable()
  
    return {
      isDragging: function () {
        return dragging
      },
      isPinching: isPinching,
      enable: enable,
      disable: disable
    }
  
    function enable () {
      if (enabled) return
      enabled = true
      if (zoomFn) {
        mouseWheelListener = mouseWheel(element, function (dx, dy) {
          zoomFn(dy)
        }, true)
      }
  
      if (rotateFn) {
        element.addEventListener('mousedown', onInputDown, false)
  
        // for dragging to work outside canvas bounds,
        // mouse move/up events have to be added to parent, i.e. window
        parent.addEventListener('mousemove', onInputMove, false)
        parent.addEventListener('mouseup', onInputUp, false)
      }
  
      if (rotateFn || pinchFn) {
        pinch = createPinch(element)
  
        // don't allow simulated mouse events
        element.addEventListener('touchstart', preventDefault, false)
  
        if (rotateFn) {
          element.addEventListener('touchmove', onTouchMove, false)
          pinch.on('place', onPinchPlace)
          pinch.on('lift', onPinchLift)
        }
        if (pinchFn) {
          pinch.on('change', onPinchChange)
        }
      }
    }
  
    function disable () {
      if (!enabled) return
      enabled = false
      if (mouseWheelListener) {
        element.removeEventListener('wheel', mouseWheelListener)
      }
      if (pinch) {
        pinch.disable()
        element.removeEventListener('touchstart', preventDefault, false)
        if (rotateFn) {
          element.removeEventListener('touchmove', onTouchMove, false)
        }
      }
      if (rotateFn) {
        parent.removeEventListener('mousedown', onInputDown, false)
        parent.removeEventListener('mousemove', onInputMove, false)
        parent.removeEventListener('mouseup', onInputUp, false)
      }
    }
  
    function preventDefault (ev) {
      ev.preventDefault()
    }
  
    function onTouchMove (ev) {
      if (!dragging || isPinching()) return
  
      // find currently active finger
      for (var i = 0; i < ev.changedTouches.length; i++) {
        var changed = ev.changedTouches[i]
        var idx = pinch.indexOfTouch(changed)
        // if pinch is disabled but rotate enabled,
        // only allow first finger to affect rotation
        var allow = pinchFn ? idx !== -1 : idx === 0
        if (allow) {
          onInputMove(changed)
          break
        }
      }
    }
  
    function onPinchPlace (newFinger, lastFinger) {
      dragging = !isPinching()
      if (dragging) {
        var firstFinger = lastFinger || newFinger
        onInputDown(firstFinger)
      }
    }
  
    function onPinchLift (lifted, remaining) {
      // if either finger is down, consider it dragging
      var sum = pinch.fingers.reduce(function (sum, item) {
        return sum + (item ? 1 : 0)
      }, 0)
      dragging = pinchFn && sum >= 1
  
      if (dragging && remaining) {
        eventOffset(remaining, element, mouseStart)
      }
    }
  
    function isPinching () {
      return pinch.pinching && pinchFn
    }
  
    function onPinchChange (current, prev) {
      pinchFn(current - prev)
    }
  
    function onInputDown (ev) {
      eventOffset(ev, element, mouseStart)
      if (insideBounds(mouseStart)) {
        dragging = true
      }
    }
  
    function onInputUp () {
      dragging = false
    }
  
    function onInputMove (ev) {
      var end = eventOffset(ev, element, tmp)
      if (pinch && isPinching()) {
        mouseStart = end
        return
      }
      if (!dragging) return
      var rect = getClientSize(tmp2)
      var dx = (end[0] - mouseStart[0]) / rect[0]
      var dy = (end[1] - mouseStart[1]) / rect[1]
      rotateFn(dx, dy)
      mouseStart[0] = end[0]
      mouseStart[1] = end[1]
    }
  
    function insideBounds (pos) {
      if (element === window ||
          element === document ||
          element === document.body) {
        return true
      } else {
        var rect = element.getBoundingClientRect()
        return pos[0] >= 0 && pos[1] >= 0 &&
          pos[0] < rect.width && pos[1] < rect.height
      }
    }
  
    function getClientSize (out) {
      var source = element
      if (source === window ||
          source === document ||
          source === document.body) {
        source = document.documentElement
      }
      out[0] = source.clientWidth
      out[1] = source.clientHeight
      return out
    }
  }
  
  },{"mouse-event-offset":40,"mouse-wheel":41,"touch-pinch":66}],45:[function(require,module,exports){
  module.exports = function parseUnit(str, out) {
      if (!out)
          out = [ 0, '' ]
  
      str = String(str)
      var num = parseFloat(str, 10)
      out[0] = num
      out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
      return out
  }
  },{}],46:[function(require,module,exports){
  (function (process){(function (){
  // Generated by CoffeeScript 1.12.2
  (function() {
    var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;
  
    if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
      module.exports = function() {
        return performance.now();
      };
    } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
      module.exports = function() {
        return (getNanoSeconds() - nodeLoadTime) / 1e6;
      };
      hrtime = process.hrtime;
      getNanoSeconds = function() {
        var hr;
        hr = hrtime();
        return hr[0] * 1e9 + hr[1];
      };
      moduleLoadTime = getNanoSeconds();
      upTime = process.uptime() * 1e9;
      nodeLoadTime = moduleLoadTime - upTime;
    } else if (Date.now) {
      module.exports = function() {
        return Date.now() - loadTime;
      };
      loadTime = Date.now();
    } else {
      module.exports = function() {
        return new Date().getTime() - loadTime;
      };
      loadTime = new Date().getTime();
    }
  
  }).call(this);
  
  
  
  }).call(this)}).call(this,require('_process'))
  },{"_process":2}],47:[function(require,module,exports){
  module.exports = require('./lib/camera-perspective')
  
  },{"./lib/camera-perspective":50}],48:[function(require,module,exports){
  var assign = require('object-assign')
  var Ray = require('ray-3d')
  
  var cameraProject = require('camera-project')
  var cameraUnproject = require('camera-unproject')
  var cameraLookAt = require('./camera-look-at')
  var cameraPickRay = require('camera-picking-ray')
  
  var add = require('gl-vec3/add')
  var multiply4x4 = require('gl-mat4/multiply')
  var invert4x4 = require('gl-mat4/invert')
  var identity4x4 = require('gl-mat4/identity')
  var setVec3 = require('gl-vec3/set')
  
  // this could also be useful for a orthographic camera
  module.exports = function cameraBase (opt) {
    opt = opt || {}
  
    var camera = {
      projection: identity4x4([]),
      view: identity4x4([]),
      position: opt.position || [0, 0, 0],
      direction: opt.direction || [0, 0, -1],
      up: opt.up || [0, 1, 0],
      viewport: opt.viewport || [ -1, -1, 1, 1 ],
      projView: identity4x4([]),
      invProjView: identity4x4([])
    }
  
    function update () {
      multiply4x4(camera.projView, camera.projection, camera.view)
      var valid = invert4x4(camera.invProjView, camera.projView)
      if (!valid) {
        throw new Error('camera projection * view is non-invertible')
      }
    }
  
    function lookAt (target) {
      cameraLookAt(camera.direction, camera.up, camera.position, target)
      return camera
    }
  
    function identity () {
      setVec3(camera.position, 0, 0, 0)
      setVec3(camera.direction, 0, 0, -1)
      setVec3(camera.up, 0, 1, 0)
      identity4x4(camera.view)
      identity4x4(camera.projection)
      identity4x4(camera.projView)
      identity4x4(camera.invProjView)
      return camera
    }
  
    function translate (vec) {
      add(camera.position, camera.position, vec)
      return camera
    }
  
    function createPickingRay (mouse) {
      var ray = new Ray()
      cameraPickRay(ray.origin, ray.direction, mouse, camera.viewport, camera.invProjView)
      return ray
    }
  
    function project (point) {
      return cameraProject([], point, camera.viewport, camera.projView)
    }
  
    function unproject (point) {
      return cameraUnproject([], point, camera.viewport, camera.invProjView)
    }
  
    return assign(camera, {
      translate: translate,
      identity: identity,
      lookAt: lookAt,
      createPickingRay: createPickingRay,
      update: update,
      project: project,
      unproject: unproject
    })
  }
  
  },{"./camera-look-at":49,"camera-picking-ray":5,"camera-project":6,"camera-unproject":7,"gl-mat4/identity":13,"gl-mat4/invert":14,"gl-mat4/multiply":16,"gl-vec3/add":23,"gl-vec3/set":31,"object-assign":51,"ray-3d":57}],49:[function(require,module,exports){
  // could be modularized...
  var cross = require('gl-vec3/cross')
  var sub = require('gl-vec3/subtract')
  var normalize = require('gl-vec3/normalize')
  var copy = require('gl-vec3/copy')
  var dot = require('gl-vec3/dot')
  var scale = require('gl-vec3/scale')
  
  var tmp = [0, 0, 0]
  var epsilon = 0.000000001
  
  // modifies direction & up vectors in place
  module.exports = function (direction, up, position, target) {
    sub(tmp, target, position)
    normalize(tmp, tmp)
    var isZero = tmp[0] === 0 && tmp[1] === 0 && tmp[2] === 0
    if (!isZero) {
      var d = dot(tmp, up)
      if (Math.abs(d - 1) < epsilon) { // collinear
        scale(up, direction, -1)
      } else if (Math.abs(d + 1) < epsilon) { // collinear opposite
        copy(up, direction)
      }
      copy(direction, tmp)
  
      // normalize up vector
      cross(tmp, direction, up)
      normalize(tmp, tmp)
  
      cross(up, tmp, direction)
      normalize(up, up)
    }
  }
  
  },{"gl-vec3/copy":24,"gl-vec3/cross":25,"gl-vec3/dot":26,"gl-vec3/normalize":28,"gl-vec3/scale":29,"gl-vec3/subtract":33}],50:[function(require,module,exports){
  var create = require('./camera-base')
  var assign = require('object-assign')
  var defined = require('defined')
  
  var perspective = require('gl-mat4/perspective')
  var lookAt4x4 = require('gl-mat4/lookAt')
  var add = require('gl-vec3/add')
  
  module.exports = function cameraPerspective (opt) {
    opt = opt || {}
  
    var camera = create(opt)
    camera.fov = defined(opt.fov, Math.PI / 4)
    camera.near = defined(opt.near, 1)
    camera.far = defined(opt.far, 100)
  
    var center = [0, 0, 0]
  
    var updateCombined = camera.update
  
    function update () {
      var aspect = camera.viewport[2] / camera.viewport[3]
  
      // build projection matrix
      perspective(camera.projection, camera.fov, aspect, Math.abs(camera.near), Math.abs(camera.far))
  
      // build view matrix
      add(center, camera.position, camera.direction)
      lookAt4x4(camera.view, camera.position, center, camera.up)
  
      // update projection * view and invert
      updateCombined()
      return camera
    }
  
    // set it up initially from constructor options
    update()
    return assign(camera, {
      update: update
    })
  }
  
  },{"./camera-base":48,"defined":10,"gl-mat4/lookAt":15,"gl-mat4/perspective":17,"gl-vec3/add":23,"object-assign":51}],51:[function(require,module,exports){
  'use strict';
  
  function ToObject(val) {
    if (val == null) {
      throw new TypeError('Object.assign cannot be called with null or undefined');
    }
  
    return Object(val);
  }
  
  module.exports = Object.assign || function (target, source) {
    var from;
    var keys;
    var to = ToObject(target);
  
    for (var s = 1; s < arguments.length; s++) {
      from = arguments[s];
      keys = Object.keys(Object(from));
  
      for (var i = 0; i < keys.length; i++) {
        to[keys[i]] = from[keys[i]];
      }
    }
  
    return to;
  };
  
  },{}],52:[function(require,module,exports){
  var identity = require('gl-mat4/identity')
  var rotateY = require('gl-mat4/rotateY')
  var rotateZ = require('gl-mat4/rotateZ')
  
  var scale = require('gl-vec3/scale')
  var transformMat4 = require('gl-vec3/transformMat4')
  var normalize = require('gl-vec3/normalize')
  
  var matRotY = identity([])
  var matRotZ = identity([])
  var up = [0, 1, 0]
  var tmpVec3 = [0, 0, 0]
  
  module.exports = primitiveSphere
  function primitiveSphere (radius, opt) {
    opt = opt || {}
    radius = typeof radius !== 'undefined' ? radius : 1
    var segments = typeof opt.segments !== 'undefined' ? opt.segments : 32
  
    var totalZRotationSteps = 2 + segments
    var totalYRotationSteps = 2 * totalZRotationSteps
  
    var indices = []
    var positions = []
    var normals = []
    var uvs = []
  
    for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
      var normalizedZ = zRotationStep / totalZRotationSteps
      var angleZ = (normalizedZ * Math.PI)
  
      for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
        var normalizedY = yRotationStep / totalYRotationSteps
        var angleY = normalizedY * Math.PI * 2
  
        identity(matRotZ)
        rotateZ(matRotZ, matRotZ, -angleZ)
  
        identity(matRotY)
        rotateY(matRotY, matRotY, angleY)
  
        transformMat4(tmpVec3, up, matRotZ)
        transformMat4(tmpVec3, tmpVec3, matRotY)
  
        scale(tmpVec3, tmpVec3, -radius)
        positions.push(tmpVec3.slice())
  
        normalize(tmpVec3, tmpVec3)
        normals.push(tmpVec3.slice())
  
        uvs.push([ normalizedY, normalizedZ ])
      }
  
      if (zRotationStep > 0) {
        var verticesCount = positions.length
        var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1)
        for (; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
          indices.push([
            firstIndex,
            firstIndex + 1,
            firstIndex + totalYRotationSteps + 1
          ])
          indices.push([
            firstIndex + totalYRotationSteps + 1,
            firstIndex + 1,
            firstIndex + totalYRotationSteps + 2
          ])
        }
      }
    }
  
    return {
      cells: indices,
      positions: positions,
      normals: normals,
      uvs: uvs
    }
  }
  
  },{"gl-mat4/identity":13,"gl-mat4/rotateY":18,"gl-mat4/rotateZ":19,"gl-vec3/normalize":28,"gl-vec3/scale":29,"gl-vec3/transformMat4":34}],53:[function(require,module,exports){
  // Original implementation:
  // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
  
  var dot = require('gl-vec3/dot')
  var set = require('gl-vec3/set')
  var normalize = require('gl-quat/normalize')
  var cross = require('gl-vec3/cross')
  
  var tmp = [0, 0, 0]
  var EPS = 1e-6
  
  module.exports = quatFromUnitVec3
  function quatFromUnitVec3 (out, a, b) {
    // assumes a and b are normalized
    var r = dot(a, b) + 1
    if (r < EPS) {
      /* If u and v are exactly opposite, rotate 180 degrees
       * around an arbitrary orthogonal axis. Axis normalisation
       * can happen later, when we normalise the quaternion. */
      r = 0
      if (Math.abs(a[0]) > Math.abs(a[2])) {
        set(tmp, -a[1], a[0], 0)
      } else {
        set(tmp, 0, -a[2], a[1])
      }
    } else {
      /* Otherwise, build quaternion the standard way. */
      cross(tmp, a, b)
    }
  
    out[0] = tmp[0]
    out[1] = tmp[1]
    out[2] = tmp[2]
    out[3] = r
    normalize(out, out)
    return out
  }
  
  },{"gl-quat/normalize":21,"gl-vec3/cross":25,"gl-vec3/dot":26,"gl-vec3/set":31}],54:[function(require,module,exports){
  (function (global){(function (){
  /*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
  let promise
  
  module.exports = typeof queueMicrotask === 'function'
    ? queueMicrotask.bind(typeof window !== 'undefined' ? window : global)
    // reuse resolved promise, and allocate it lazily
    : cb => (promise || (promise = Promise.resolve()))
      .then(cb)
      .catch(err => setTimeout(() => { throw err }, 0))
  
  }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{}],55:[function(require,module,exports){
  var inherits = require('inherits')
  var EventEmitter = require('events').EventEmitter
  var now = require('right-now')
  var raf = require('raf')
  
  module.exports = Engine
  function Engine(fn) {
      if (!(this instanceof Engine)) 
          return new Engine(fn)
      this.running = false
      this.last = now()
      this._frame = 0
      this._tick = this.tick.bind(this)
  
      if (fn)
          this.on('tick', fn)
  }
  
  inherits(Engine, EventEmitter)
  
  Engine.prototype.start = function() {
      if (this.running) 
          return
      this.running = true
      this.last = now()
      this._frame = raf(this._tick)
      return this
  }
  
  Engine.prototype.stop = function() {
      this.running = false
      if (this._frame !== 0)
          raf.cancel(this._frame)
      this._frame = 0
      return this
  }
  
  Engine.prototype.tick = function() {
      this._frame = raf(this._tick)
      var time = now()
      var dt = time - this.last
      this.emit('tick', dt)
      this.last = time
  }
  },{"events":1,"inherits":39,"raf":56,"right-now":63}],56:[function(require,module,exports){
  (function (global){(function (){
  var now = require('performance-now')
    , root = typeof window === 'undefined' ? global : window
    , vendors = ['moz', 'webkit']
    , suffix = 'AnimationFrame'
    , raf = root['request' + suffix]
    , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]
  
  for(var i = 0; !raf && i < vendors.length; i++) {
    raf = root[vendors[i] + 'Request' + suffix]
    caf = root[vendors[i] + 'Cancel' + suffix]
        || root[vendors[i] + 'CancelRequest' + suffix]
  }
  
  // Some versions of FF have rAF but not cAF
  if(!raf || !caf) {
    var last = 0
      , id = 0
      , queue = []
      , frameDuration = 1000 / 60
  
    raf = function(callback) {
      if(queue.length === 0) {
        var _now = now()
          , next = Math.max(0, frameDuration - (_now - last))
        last = next + _now
        setTimeout(function() {
          var cp = queue.slice(0)
          // Clear queue here to prevent
          // callbacks from appending listeners
          // to the current frame's queue
          queue.length = 0
          for(var i = 0; i < cp.length; i++) {
            if(!cp[i].cancelled) {
              try{
                cp[i].callback(last)
              } catch(e) {
                setTimeout(function() { throw e }, 0)
              }
            }
          }
        }, Math.round(next))
      }
      queue.push({
        handle: ++id,
        callback: callback,
        cancelled: false
      })
      return id
    }
  
    caf = function(handle) {
      for(var i = 0; i < queue.length; i++) {
        if(queue[i].handle === handle) {
          queue[i].cancelled = true
        }
      }
    }
  }
  
  module.exports = function(fn) {
    // Wrap in a new function to prevent
    // `cancel` potentially being assigned
    // to the native rAF function
    return raf.call(root, fn)
  }
  module.exports.cancel = function() {
    caf.apply(root, arguments)
  }
  module.exports.polyfill = function(object) {
    if (!object) {
      object = root;
    }
    object.requestAnimationFrame = raf
    object.cancelAnimationFrame = caf
  }
  
  }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{"performance-now":46}],57:[function(require,module,exports){
  var intersectRayTriangle = require('ray-triangle-intersection')
  var intersectRayPlane = require('ray-plane-intersection')
  var intersectRaySphere = require('ray-sphere-intersection')
  var intersectRayBox = require('ray-aabb-intersection')
  var copy3 = require('gl-vec3/copy')
  
  var tmpTriangle = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]
  
  var tmp3 = [0, 0, 0]
  
  module.exports = Ray
  function Ray (origin, direction) {
    this.origin = origin || [ 0, 0, 0 ]
    this.direction = direction || [ 0, 0, -1 ]
  }
  
  Ray.prototype.set = function (origin, direction) {
    this.origin = origin
    this.direction = direction
  }
  
  Ray.prototype.copy = function (other) {
    copy3(this.origin, other.origin)
    copy3(this.direction, other.direction)
  }
  
  Ray.prototype.clone = function () {
    var other = new Ray()
    other.copy(this)
    return other
  }
  
  Ray.prototype.intersectsSphere = function (center, radius) {
    return intersectRaySphere(tmp3, this.origin, this.direction, center, radius)
  }
  
  Ray.prototype.intersectsPlane = function (normal, distance) {
    return intersectRayPlane(tmp3, this.origin, this.direction, normal, distance)
  }
  
  Ray.prototype.intersectsTriangle = function (triangle) {
    return intersectRayTriangle(tmp3, this.origin, this.direction, triangle)
  }
  
  Ray.prototype.intersectsBox = function (aabb) {
    return intersectRayBox(tmp3, this.origin, this.direction, aabb)
  }
  
  Ray.prototype.intersectsTriangleCell = function (cell, positions) {
    var a = cell[0], b = cell[1], c = cell[2]
    tmpTriangle[0] = positions[a]
    tmpTriangle[1] = positions[b]
    tmpTriangle[2] = positions[c]
    return this.intersectsTriangle(tmpTriangle)
  }
  
  },{"gl-vec3/copy":24,"ray-aabb-intersection":58,"ray-plane-intersection":59,"ray-sphere-intersection":60,"ray-triangle-intersection":61}],58:[function(require,module,exports){
  module.exports = intersection
  module.exports.distance = distance
  
  function intersection (out, ro, rd, aabb) {
    var d = distance(ro, rd, aabb)
    if (d === Infinity) {
      out = null
    } else {
      out = out || []
      for (var i = 0; i < ro.length; i++) {
        out[i] = ro[i] + rd[i] * d
      }
    }
  
    return out
  }
  
  function distance (ro, rd, aabb) {
    var dims = ro.length
    var lo = -Infinity
    var hi = +Infinity
  
    for (var i = 0; i < dims; i++) {
      var dimLo = (aabb[0][i] - ro[i]) / rd[i]
      var dimHi = (aabb[1][i] - ro[i]) / rd[i]
  
      if (dimLo > dimHi) {
        var tmp = dimLo
        dimLo = dimHi
        dimHi = tmp
      }
  
      if (dimHi < lo || dimLo > hi) {
        return Infinity
      }
  
      if (dimLo > lo) lo = dimLo
      if (dimHi < hi) hi = dimHi
    }
  
    return lo > hi ? Infinity : lo
  }
  
  },{}],59:[function(require,module,exports){
  var dot = require('gl-vec3/dot')
  var add = require('gl-vec3/add')
  var scale = require('gl-vec3/scale')
  var copy = require('gl-vec3/copy')
  
  module.exports = intersectRayPlane
  
  var v0 = [0, 0, 0]
  
  function intersectRayPlane(out, origin, direction, normal, dist) {
    var denom = dot(direction, normal)
    if (denom !== 0) {
      var t = -(dot(origin, normal) + dist) / denom
      if (t < 0) {
        return null
      }
      scale(v0, direction, t)
      return add(out, origin, v0)
    } else if (dot(normal, origin) + dist === 0) {
      return copy(out, origin)
    } else {
      return null
    }
  }
  
  },{"gl-vec3/add":23,"gl-vec3/copy":24,"gl-vec3/dot":26,"gl-vec3/scale":29}],60:[function(require,module,exports){
  var squaredDist = require('gl-vec3/squaredDistance')
  var dot = require('gl-vec3/dot')
  var sub = require('gl-vec3/subtract')
  var scaleAndAdd = require('gl-vec3/scaleAndAdd')
  var scale = require('gl-vec3/scale')
  var add = require('gl-vec3/add')
  
  var tmp = [0, 0, 0]
  
  module.exports = intersectRaySphere
  function intersectRaySphere (out, origin, direction, center, radius) {
    sub(tmp, center, origin)
    var len = dot(direction, tmp)
    if (len < 0) { // sphere is behind ray
      return null
    }
  
    scaleAndAdd(tmp, origin, direction, len)
    var dSq = squaredDist(center, tmp)
    var rSq = radius * radius
    if (dSq > rSq) {
      return null
    }
  
    scale(out, direction, len - Math.sqrt(rSq - dSq))
    return add(out, out, origin)
  }
  
  },{"gl-vec3/add":23,"gl-vec3/dot":26,"gl-vec3/scale":29,"gl-vec3/scaleAndAdd":30,"gl-vec3/squaredDistance":32,"gl-vec3/subtract":33}],61:[function(require,module,exports){
  var cross = require('gl-vec3/cross');
  var dot = require('gl-vec3/dot');
  var sub = require('gl-vec3/subtract');
  
  var EPSILON = 0.000001;
  var edge1 = [0,0,0];
  var edge2 = [0,0,0];
  var tvec = [0,0,0];
  var pvec = [0,0,0];
  var qvec = [0,0,0];
  
  module.exports = intersectTriangle;
  
  function intersectTriangle (out, pt, dir, tri) {
      sub(edge1, tri[1], tri[0]);
      sub(edge2, tri[2], tri[0]);
      
      cross(pvec, dir, edge2);
      var det = dot(edge1, pvec);
      
      if (det < EPSILON) return null;
      sub(tvec, pt, tri[0]);
      var u = dot(tvec, pvec);
      if (u < 0 || u > det) return null;
      cross(qvec, tvec, edge1);
      var v = dot(dir, qvec);
      if (v < 0 || u + v > det) return null;
      
      var t = dot(edge2, qvec) / det;
      out[0] = pt[0] + t * dir[0];
      out[1] = pt[1] + t * dir[1];
      out[2] = pt[2] + t * dir[2];
      return out;
  }
  
  },{"gl-vec3/cross":25,"gl-vec3/dot":26,"gl-vec3/subtract":33}],62:[function(require,module,exports){
  (function(U,X){"object"===typeof exports&&"undefined"!==typeof module?module.exports=X():"function"===typeof define&&define.amd?define(X):U.createREGL=X()})(this,function(){function U(a,b){this.id=Eb++;this.type=a;this.data=b}function X(a){if(0===a.length)return[];var b=a.charAt(0),c=a.charAt(a.length-1);if(1<a.length&&b===c&&('"'===b||"'"===b))return['"'+a.substr(1,a.length-2).replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"'];if(b=/\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(a))return X(a.substr(0,
  b.index)).concat(X(b[1])).concat(X(a.substr(b.index+b[0].length)));b=a.split(".");if(1===b.length)return['"'+a.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"'];a=[];for(c=0;c<b.length;++c)a=a.concat(X(b[c]));return a}function cb(a){return"["+X(a).join("][")+"]"}function db(a,b){if("function"===typeof a)return new U(0,a);if("number"===typeof a||"boolean"===typeof a)return new U(5,a);if(Array.isArray(a))return new U(6,a.map(function(a,e){return db(a,b+"["+e+"]")}));if(a instanceof U)return a}function Fb(){var a=
  {"":0},b=[""];return{id:function(c){var e=a[c];if(e)return e;e=a[c]=b.length;b.push(c);return e},str:function(a){return b[a]}}}function Gb(a,b,c){function e(){var b=window.innerWidth,e=window.innerHeight;a!==document.body&&(e=a.getBoundingClientRect(),b=e.right-e.left,e=e.bottom-e.top);f.width=c*b;f.height=c*e;A(f.style,{width:b+"px",height:e+"px"})}var f=document.createElement("canvas");A(f.style,{border:0,margin:0,padding:0,top:0,left:0});a.appendChild(f);a===document.body&&(f.style.position="absolute",
  A(a.style,{margin:0,padding:0}));var d;a!==document.body&&"function"===typeof ResizeObserver?(d=new ResizeObserver(function(){setTimeout(e)}),d.observe(a)):window.addEventListener("resize",e,!1);e();return{canvas:f,onDestroy:function(){d?d.disconnect():window.removeEventListener("resize",e);a.removeChild(f)}}}function Hb(a,b){function c(c){try{return a.getContext(c,b)}catch(f){return null}}return c("webgl")||c("experimental-webgl")||c("webgl-experimental")}function eb(a){return"string"===typeof a?
  a.split():a}function fb(a){return"string"===typeof a?document.querySelector(a):a}function Ib(a){var b=a||{},c,e,f,d;a={};var p=[],n=[],u="undefined"===typeof window?1:window.devicePixelRatio,t=!1,w=function(a){},k=function(){};"string"===typeof b?c=document.querySelector(b):"object"===typeof b&&("string"===typeof b.nodeName&&"function"===typeof b.appendChild&&"function"===typeof b.getBoundingClientRect?c=b:"function"===typeof b.drawArrays||"function"===typeof b.drawElements?(d=b,f=d.canvas):("gl"in
  b?d=b.gl:"canvas"in b?f=fb(b.canvas):"container"in b&&(e=fb(b.container)),"attributes"in b&&(a=b.attributes),"extensions"in b&&(p=eb(b.extensions)),"optionalExtensions"in b&&(n=eb(b.optionalExtensions)),"onDone"in b&&(w=b.onDone),"profile"in b&&(t=!!b.profile),"pixelRatio"in b&&(u=+b.pixelRatio)));c&&("canvas"===c.nodeName.toLowerCase()?f=c:e=c);if(!d){if(!f){c=Gb(e||document.body,w,u);if(!c)return null;f=c.canvas;k=c.onDestroy}void 0===a.premultipliedAlpha&&(a.premultipliedAlpha=!0);d=Hb(f,a)}return d?
  {gl:d,canvas:f,container:e,extensions:p,optionalExtensions:n,pixelRatio:u,profile:t,onDone:w,onDestroy:k}:(k(),w("webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org"),null)}function Jb(a,b){function c(b){b=b.toLowerCase();var c;try{c=e[b]=a.getExtension(b)}catch(f){}return!!c}for(var e={},f=0;f<b.extensions.length;++f){var d=b.extensions[f];if(!c(d))return b.onDestroy(),b.onDone('"'+d+'" extension is not supported by the current WebGL context, try upgrading your system or a different browser'),
  null}b.optionalExtensions.forEach(c);return{extensions:e,restore:function(){Object.keys(e).forEach(function(a){if(e[a]&&!c(a))throw Error("(regl): error restoring extension "+a);})}}}function J(a,b){for(var c=Array(a),e=0;e<a;++e)c[e]=b(e);return c}function gb(a){var b,c;b=(65535<a)<<4;a>>>=b;c=(255<a)<<3;a>>>=c;b|=c;c=(15<a)<<2;a>>>=c;b|=c;c=(3<a)<<1;return b|c|a>>>c>>1}function hb(){function a(a){a:{for(var b=16;268435456>=b;b*=16)if(a<=b){a=b;break a}a=0}b=c[gb(a)>>2];return 0<b.length?b.pop():
  new ArrayBuffer(a)}function b(a){c[gb(a.byteLength)>>2].push(a)}var c=J(8,function(){return[]});return{alloc:a,free:b,allocType:function(b,c){var d=null;switch(b){case 5120:d=new Int8Array(a(c),0,c);break;case 5121:d=new Uint8Array(a(c),0,c);break;case 5122:d=new Int16Array(a(2*c),0,c);break;case 5123:d=new Uint16Array(a(2*c),0,c);break;case 5124:d=new Int32Array(a(4*c),0,c);break;case 5125:d=new Uint32Array(a(4*c),0,c);break;case 5126:d=new Float32Array(a(4*c),0,c);break;default:return null}return d.length!==
  c?d.subarray(0,c):d},freeType:function(a){b(a.buffer)}}}function da(a){return!!a&&"object"===typeof a&&Array.isArray(a.shape)&&Array.isArray(a.stride)&&"number"===typeof a.offset&&a.shape.length===a.stride.length&&(Array.isArray(a.data)||M(a.data))}function ib(a,b,c,e,f,d){for(var p=0;p<b;++p)for(var n=a[p],u=0;u<c;++u)for(var t=n[u],w=0;w<e;++w)f[d++]=t[w]}function jb(a,b,c,e,f){for(var d=1,p=c+1;p<b.length;++p)d*=b[p];var n=b[c];if(4===b.length-c){var u=b[c+1],t=b[c+2];b=b[c+3];for(p=0;p<n;++p)ib(a[p],
  u,t,b,e,f),f+=d}else for(p=0;p<n;++p)jb(a[p],b,c+1,e,f),f+=d}function Fa(a){return Ga[Object.prototype.toString.call(a)]|0}function kb(a,b){for(var c=0;c<b.length;++c)a[c]=b[c]}function lb(a,b,c,e,f,d,p){for(var n=0,u=0;u<c;++u)for(var t=0;t<e;++t)a[n++]=b[f*u+d*t+p]}function Kb(a,b,c,e){function f(b){this.id=u++;this.buffer=a.createBuffer();this.type=b;this.usage=35044;this.byteLength=0;this.dimension=1;this.dtype=5121;this.persistentData=null;c.profile&&(this.stats={size:0})}function d(b,c,l){b.byteLength=
  c.byteLength;a.bufferData(b.type,c,l)}function p(a,b,c,h,g,q){a.usage=c;if(Array.isArray(b)){if(a.dtype=h||5126,0<b.length)if(Array.isArray(b[0])){g=mb(b);for(var r=h=1;r<g.length;++r)h*=g[r];a.dimension=h;b=Sa(b,g,a.dtype);d(a,b,c);q?a.persistentData=b:E.freeType(b)}else"number"===typeof b[0]?(a.dimension=g,g=E.allocType(a.dtype,b.length),kb(g,b),d(a,g,c),q?a.persistentData=g:E.freeType(g)):M(b[0])&&(a.dimension=b[0].length,a.dtype=h||Fa(b[0])||5126,b=Sa(b,[b.length,b[0].length],a.dtype),d(a,b,c),
  q?a.persistentData=b:E.freeType(b))}else if(M(b))a.dtype=h||Fa(b),a.dimension=g,d(a,b,c),q&&(a.persistentData=new Uint8Array(new Uint8Array(b.buffer)));else if(da(b)){g=b.shape;var m=b.stride,r=b.offset,e=0,f=0,t=0,n=0;1===g.length?(e=g[0],f=1,t=m[0],n=0):2===g.length&&(e=g[0],f=g[1],t=m[0],n=m[1]);a.dtype=h||Fa(b.data)||5126;a.dimension=f;g=E.allocType(a.dtype,e*f);lb(g,b.data,e,f,t,n,r);d(a,g,c);q?a.persistentData=g:E.freeType(g)}else b instanceof ArrayBuffer&&(a.dtype=5121,a.dimension=g,d(a,b,
  c),q&&(a.persistentData=new Uint8Array(new Uint8Array(b))))}function n(c){b.bufferCount--;e(c);a.deleteBuffer(c.buffer);c.buffer=null;delete t[c.id]}var u=0,t={};f.prototype.bind=function(){a.bindBuffer(this.type,this.buffer)};f.prototype.destroy=function(){n(this)};var w=[];c.profile&&(b.getTotalBufferSize=function(){var a=0;Object.keys(t).forEach(function(b){a+=t[b].stats.size});return a});return{create:function(k,e,d,h){function g(b){var m=35044,k=null,e=0,d=0,f=1;Array.isArray(b)||M(b)||da(b)||
  b instanceof ArrayBuffer?k=b:"number"===typeof b?e=b|0:b&&("data"in b&&(k=b.data),"usage"in b&&(m=ob[b.usage]),"type"in b&&(d=Ia[b.type]),"dimension"in b&&(f=b.dimension|0),"length"in b&&(e=b.length|0));q.bind();k?p(q,k,m,d,f,h):(e&&a.bufferData(q.type,e,m),q.dtype=d||5121,q.usage=m,q.dimension=f,q.byteLength=e);c.profile&&(q.stats.size=q.byteLength*ha[q.dtype]);return g}b.bufferCount++;var q=new f(e);t[q.id]=q;d||g(k);g._reglType="buffer";g._buffer=q;g.subdata=function(b,c){var k=(c||0)|0,e;q.bind();
  if(M(b)||b instanceof ArrayBuffer)a.bufferSubData(q.type,k,b);else if(Array.isArray(b)){if(0<b.length)if("number"===typeof b[0]){var h=E.allocType(q.dtype,b.length);kb(h,b);a.bufferSubData(q.type,k,h);E.freeType(h)}else if(Array.isArray(b[0])||M(b[0]))e=mb(b),h=Sa(b,e,q.dtype),a.bufferSubData(q.type,k,h),E.freeType(h)}else if(da(b)){e=b.shape;var d=b.stride,f=h=0,l=0,O=0;1===e.length?(h=e[0],f=1,l=d[0],O=0):2===e.length&&(h=e[0],f=e[1],l=d[0],O=d[1]);e=Array.isArray(b.data)?q.dtype:Fa(b.data);e=E.allocType(e,
  h*f);lb(e,b.data,h,f,l,O,b.offset);a.bufferSubData(q.type,k,e);E.freeType(e)}return g};c.profile&&(g.stats=q.stats);g.destroy=function(){n(q)};return g},createStream:function(a,b){var c=w.pop();c||(c=new f(a));c.bind();p(c,b,35040,0,1,!1);return c},destroyStream:function(a){w.push(a)},clear:function(){S(t).forEach(n);w.forEach(n)},getBuffer:function(a){return a&&a._buffer instanceof f?a._buffer:null},restore:function(){S(t).forEach(function(b){b.buffer=a.createBuffer();a.bindBuffer(b.type,b.buffer);
  a.bufferData(b.type,b.persistentData||b.byteLength,b.usage)})},_initBuffer:p}}function Lb(a,b,c,e){function f(a){this.id=u++;n[this.id]=this;this.buffer=a;this.primType=4;this.type=this.vertCount=0}function d(e,d,f,h,g,q,r){e.buffer.bind();var m;d?((m=r)||M(d)&&(!da(d)||M(d.data))||(m=b.oes_element_index_uint?5125:5123),c._initBuffer(e.buffer,d,f,m,3)):(a.bufferData(34963,q,f),e.buffer.dtype=m||5121,e.buffer.usage=f,e.buffer.dimension=3,e.buffer.byteLength=q);m=r;if(!r){switch(e.buffer.dtype){case 5121:case 5120:m=
  5121;break;case 5123:case 5122:m=5123;break;case 5125:case 5124:m=5125}e.buffer.dtype=m}e.type=m;d=g;0>d&&(d=e.buffer.byteLength,5123===m?d>>=1:5125===m&&(d>>=2));e.vertCount=d;d=h;0>h&&(d=4,h=e.buffer.dimension,1===h&&(d=0),2===h&&(d=1),3===h&&(d=4));e.primType=d}function p(a){e.elementsCount--;delete n[a.id];a.buffer.destroy();a.buffer=null}var n={},u=0,t={uint8:5121,uint16:5123};b.oes_element_index_uint&&(t.uint32=5125);f.prototype.bind=function(){this.buffer.bind()};var w=[];return{create:function(a,
  b){function l(a){if(a)if("number"===typeof a)h(a),g.primType=4,g.vertCount=a|0,g.type=5121;else{var b=null,c=35044,e=-1,f=-1,k=0,n=0;if(Array.isArray(a)||M(a)||da(a))b=a;else if("data"in a&&(b=a.data),"usage"in a&&(c=ob[a.usage]),"primitive"in a&&(e=Ta[a.primitive]),"count"in a&&(f=a.count|0),"type"in a&&(n=t[a.type]),"length"in a)k=a.length|0;else if(k=f,5123===n||5122===n)k*=2;else if(5125===n||5124===n)k*=4;d(g,b,c,e,f,k,n)}else h(),g.primType=4,g.vertCount=0,g.type=5121;return l}var h=c.create(null,
  34963,!0),g=new f(h._buffer);e.elementsCount++;l(a);l._reglType="elements";l._elements=g;l.subdata=function(a,b){h.subdata(a,b);return l};l.destroy=function(){p(g)};return l},createStream:function(a){var b=w.pop();b||(b=new f(c.create(null,34963,!0,!1)._buffer));d(b,a,35040,-1,-1,0,0);return b},destroyStream:function(a){w.push(a)},getElements:function(a){return"function"===typeof a&&a._elements instanceof f?a._elements:null},clear:function(){S(n).forEach(p)}}}function pb(a){for(var b=E.allocType(5123,
  a.length),c=0;c<a.length;++c)if(isNaN(a[c]))b[c]=65535;else if(Infinity===a[c])b[c]=31744;else if(-Infinity===a[c])b[c]=64512;else{qb[0]=a[c];var e=Mb[0],f=e>>>31<<15,d=(e<<1>>>24)-127,e=e>>13&1023;b[c]=-24>d?f:-14>d?f+(e+1024>>-14-d):15<d?f+31744:f+(d+15<<10)+e}return b}function ma(a){return Array.isArray(a)||M(a)}function na(a){return"[object "+a+"]"}function rb(a){return Array.isArray(a)&&(0===a.length||"number"===typeof a[0])}function sb(a){return Array.isArray(a)&&0!==a.length&&ma(a[0])?!0:!1}
  function ea(a){return Object.prototype.toString.call(a)}function Ua(a){if(!a)return!1;var b=ea(a);return 0<=Nb.indexOf(b)?!0:rb(a)||sb(a)||da(a)}function tb(a,b){36193===a.type?(a.data=pb(b),E.freeType(b)):a.data=b}function Ja(a,b,c,e,f,d){a="undefined"!==typeof F[a]?F[a]:Q[a]*wa[b];d&&(a*=6);if(f){for(e=0;1<=c;)e+=a*c*c,c/=2;return e}return a*c*e}function Ob(a,b,c,e,f,d,p){function n(){this.format=this.internalformat=6408;this.type=5121;this.flipY=this.premultiplyAlpha=this.compressed=!1;this.unpackAlignment=
  1;this.colorSpace=37444;this.channels=this.height=this.width=0}function u(a,b){a.internalformat=b.internalformat;a.format=b.format;a.type=b.type;a.compressed=b.compressed;a.premultiplyAlpha=b.premultiplyAlpha;a.flipY=b.flipY;a.unpackAlignment=b.unpackAlignment;a.colorSpace=b.colorSpace;a.width=b.width;a.height=b.height;a.channels=b.channels}function t(a,b){if("object"===typeof b&&b){"premultiplyAlpha"in b&&(a.premultiplyAlpha=b.premultiplyAlpha);"flipY"in b&&(a.flipY=b.flipY);"alignment"in b&&(a.unpackAlignment=
  b.alignment);"colorSpace"in b&&(a.colorSpace=Pb[b.colorSpace]);"type"in b&&(a.type=N[b.type]);var c=a.width,g=a.height,e=a.channels,d=!1;"shape"in b?(c=b.shape[0],g=b.shape[1],3===b.shape.length&&(e=b.shape[2],d=!0)):("radius"in b&&(c=g=b.radius),"width"in b&&(c=b.width),"height"in b&&(g=b.height),"channels"in b&&(e=b.channels,d=!0));a.width=c|0;a.height=g|0;a.channels=e|0;c=!1;"format"in b&&(c=b.format,g=a.internalformat=C[c],a.format=P[g],c in N&&!("type"in b)&&(a.type=N[c]),c in v&&(a.compressed=
  !0),c=!0);!d&&c?a.channels=Q[a.format]:d&&!c&&a.channels!==Ma[a.format]&&(a.format=a.internalformat=Ma[a.channels])}}function w(b){a.pixelStorei(37440,b.flipY);a.pixelStorei(37441,b.premultiplyAlpha);a.pixelStorei(37443,b.colorSpace);a.pixelStorei(3317,b.unpackAlignment)}function k(){n.call(this);this.yOffset=this.xOffset=0;this.data=null;this.needsFree=!1;this.element=null;this.needsCopy=!1}function B(a,b){var c=null;Ua(b)?c=b:b&&(t(a,b),"x"in b&&(a.xOffset=b.x|0),"y"in b&&(a.yOffset=b.y|0),Ua(b.data)&&
  (c=b.data));if(b.copy){var g=f.viewportWidth,e=f.viewportHeight;a.width=a.width||g-a.xOffset;a.height=a.height||e-a.yOffset;a.needsCopy=!0}else if(!c)a.width=a.width||1,a.height=a.height||1,a.channels=a.channels||4;else if(M(c))a.channels=a.channels||4,a.data=c,"type"in b||5121!==a.type||(a.type=Ga[Object.prototype.toString.call(c)]|0);else if(rb(c)){a.channels=a.channels||4;g=c;e=g.length;switch(a.type){case 5121:case 5123:case 5125:case 5126:e=E.allocType(a.type,e);e.set(g);a.data=e;break;case 36193:a.data=
  pb(g)}a.alignment=1;a.needsFree=!0}else if(da(c)){g=c.data;Array.isArray(g)||5121!==a.type||(a.type=Ga[Object.prototype.toString.call(g)]|0);var e=c.shape,d=c.stride,h,r,m,q;3===e.length?(m=e[2],q=d[2]):q=m=1;h=e[0];r=e[1];e=d[0];d=d[1];a.alignment=1;a.width=h;a.height=r;a.channels=m;a.format=a.internalformat=Ma[m];a.needsFree=!0;h=q;c=c.offset;m=a.width;q=a.height;r=a.channels;for(var x=E.allocType(36193===a.type?5126:a.type,m*q*r),I=0,ja=0;ja<q;++ja)for(var ka=0;ka<m;++ka)for(var Va=0;Va<r;++Va)x[I++]=
  g[e*ka+d*ja+h*Va+c];tb(a,x)}else if(ea(c)===Wa||ea(c)===Xa||ea(c)===vb)ea(c)===Wa||ea(c)===Xa?a.element=c:a.element=c.canvas,a.width=a.element.width,a.height=a.element.height,a.channels=4;else if(ea(c)===wb)a.element=c,a.width=c.width,a.height=c.height,a.channels=4;else if(ea(c)===xb)a.element=c,a.width=c.naturalWidth,a.height=c.naturalHeight,a.channels=4;else if(ea(c)===yb)a.element=c,a.width=c.videoWidth,a.height=c.videoHeight,a.channels=4;else if(sb(c)){g=a.width||c[0].length;e=a.height||c.length;
  d=a.channels;d=ma(c[0][0])?d||c[0][0].length:d||1;h=Oa.shape(c);m=1;for(q=0;q<h.length;++q)m*=h[q];m=E.allocType(36193===a.type?5126:a.type,m);Oa.flatten(c,h,"",m);tb(a,m);a.alignment=1;a.width=g;a.height=e;a.channels=d;a.format=a.internalformat=Ma[d];a.needsFree=!0}}function l(b,c,g,d,h){var m=b.element,f=b.data,r=b.internalformat,q=b.format,l=b.type,x=b.width,I=b.height;w(b);m?a.texSubImage2D(c,h,g,d,q,l,m):b.compressed?a.compressedTexSubImage2D(c,h,g,d,r,x,I,f):b.needsCopy?(e(),a.copyTexSubImage2D(c,
  h,g,d,b.xOffset,b.yOffset,x,I)):a.texSubImage2D(c,h,g,d,x,I,q,l,f)}function h(){return J.pop()||new k}function g(a){a.needsFree&&E.freeType(a.data);k.call(a);J.push(a)}function q(){n.call(this);this.genMipmaps=!1;this.mipmapHint=4352;this.mipmask=0;this.images=Array(16)}function r(a,b,c){var g=a.images[0]=h();a.mipmask=1;g.width=a.width=b;g.height=a.height=c;g.channels=a.channels=4}function m(a,b){var c=null;if(Ua(b))c=a.images[0]=h(),u(c,a),B(c,b),a.mipmask=1;else if(t(a,b),Array.isArray(b.mipmap))for(var g=
  b.mipmap,e=0;e<g.length;++e)c=a.images[e]=h(),u(c,a),c.width>>=e,c.height>>=e,B(c,g[e]),a.mipmask|=1<<e;else c=a.images[0]=h(),u(c,a),B(c,b),a.mipmask=1;u(a,a.images[0])}function z(b,c){for(var g=b.images,d=0;d<g.length&&g[d];++d){var h=g[d],m=c,f=d,r=h.element,q=h.data,l=h.internalformat,x=h.format,I=h.type,ja=h.width,ka=h.height;w(h);r?a.texImage2D(m,f,x,x,I,r):h.compressed?a.compressedTexImage2D(m,f,l,ja,ka,0,q):h.needsCopy?(e(),a.copyTexImage2D(m,f,x,h.xOffset,h.yOffset,ja,ka,0)):a.texImage2D(m,
  f,x,ja,ka,0,x,I,q||null)}}function Ha(){var a=L.pop()||new q;n.call(a);for(var b=a.mipmask=0;16>b;++b)a.images[b]=null;return a}function nb(a){for(var b=a.images,c=0;c<b.length;++c)b[c]&&g(b[c]),b[c]=null;L.push(a)}function Z(){this.magFilter=this.minFilter=9728;this.wrapT=this.wrapS=33071;this.anisotropic=1;this.genMipmaps=!1;this.mipmapHint=4352}function G(a,b){"min"in b&&(a.minFilter=R[b.min],0<=Qb.indexOf(a.minFilter)&&!("faces"in b)&&(a.genMipmaps=!0));"mag"in b&&(a.magFilter=V[b.mag]);var c=
  a.wrapS,g=a.wrapT;if("wrap"in b){var e=b.wrap;"string"===typeof e?c=g=la[e]:Array.isArray(e)&&(c=la[e[0]],g=la[e[1]])}else"wrapS"in b&&(c=la[b.wrapS]),"wrapT"in b&&(g=la[b.wrapT]);a.wrapS=c;a.wrapT=g;"anisotropic"in b&&(a.anisotropic=b.anisotropic);if("mipmap"in b){c=!1;switch(typeof b.mipmap){case "string":a.mipmapHint=y[b.mipmap];c=a.genMipmaps=!0;break;case "boolean":c=a.genMipmaps=b.mipmap;break;case "object":a.genMipmaps=!1,c=!0}!c||"min"in b||(a.minFilter=9984)}}function H(c,g){a.texParameteri(g,
  10241,c.minFilter);a.texParameteri(g,10240,c.magFilter);a.texParameteri(g,10242,c.wrapS);a.texParameteri(g,10243,c.wrapT);b.ext_texture_filter_anisotropic&&a.texParameteri(g,34046,c.anisotropic);c.genMipmaps&&(a.hint(33170,c.mipmapHint),a.generateMipmap(g))}function O(b){n.call(this);this.mipmask=0;this.internalformat=6408;this.id=Y++;this.refCount=1;this.target=b;this.texture=a.createTexture();this.unit=-1;this.bindCount=0;this.texInfo=new Z;p.profile&&(this.stats={size:0})}function xa(b){a.activeTexture(33984);
  a.bindTexture(b.target,b.texture)}function ya(){var b=W[0];b?a.bindTexture(b.target,b.texture):a.bindTexture(3553,null)}function D(b){var c=b.texture,g=b.unit,e=b.target;0<=g&&(a.activeTexture(33984+g),a.bindTexture(e,null),W[g]=null);a.deleteTexture(c);b.texture=null;b.params=null;b.pixels=null;b.refCount=0;delete ia[b.id];d.textureCount--}var y={"don't care":4352,"dont care":4352,nice:4354,fast:4353},la={repeat:10497,clamp:33071,mirror:33648},V={nearest:9728,linear:9729},R=A({mipmap:9987,"nearest mipmap nearest":9984,
  "linear mipmap nearest":9985,"nearest mipmap linear":9986,"linear mipmap linear":9987},V),Pb={none:0,browser:37444},N={uint8:5121,rgba4:32819,rgb565:33635,"rgb5 a1":32820},C={alpha:6406,luminance:6409,"luminance alpha":6410,rgb:6407,rgba:6408,rgba4:32854,"rgb5 a1":32855,rgb565:36194},v={};b.ext_srgb&&(C.srgb=35904,C.srgba=35906);b.oes_texture_float&&(N.float32=N["float"]=5126);b.oes_texture_half_float&&(N.float16=N["half float"]=36193);b.webgl_depth_texture&&(A(C,{depth:6402,"depth stencil":34041}),
  A(N,{uint16:5123,uint32:5125,"depth stencil":34042}));b.webgl_compressed_texture_s3tc&&A(v,{"rgb s3tc dxt1":33776,"rgba s3tc dxt1":33777,"rgba s3tc dxt3":33778,"rgba s3tc dxt5":33779});b.webgl_compressed_texture_atc&&A(v,{"rgb atc":35986,"rgba atc explicit alpha":35987,"rgba atc interpolated alpha":34798});b.webgl_compressed_texture_pvrtc&&A(v,{"rgb pvrtc 4bppv1":35840,"rgb pvrtc 2bppv1":35841,"rgba pvrtc 4bppv1":35842,"rgba pvrtc 2bppv1":35843});b.webgl_compressed_texture_etc1&&(v["rgb etc1"]=36196);
  var F=Array.prototype.slice.call(a.getParameter(34467));Object.keys(v).forEach(function(a){var b=v[a];0<=F.indexOf(b)&&(C[a]=b)});var ta=Object.keys(C);c.textureFormats=ta;var aa=[];Object.keys(C).forEach(function(a){aa[C[a]]=a});var K=[];Object.keys(N).forEach(function(a){K[N[a]]=a});var fa=[];Object.keys(V).forEach(function(a){fa[V[a]]=a});var Da=[];Object.keys(R).forEach(function(a){Da[R[a]]=a});var ua=[];Object.keys(la).forEach(function(a){ua[la[a]]=a});var P=ta.reduce(function(a,c){var g=C[c];
  6409===g||6406===g||6409===g||6410===g||6402===g||34041===g||b.ext_srgb&&(35904===g||35906===g)?a[g]=g:32855===g||0<=c.indexOf("rgba")?a[g]=6408:a[g]=6407;return a},{}),J=[],L=[],Y=0,ia={},ga=c.maxTextureUnits,W=Array(ga).map(function(){return null});A(O.prototype,{bind:function(){this.bindCount+=1;var b=this.unit;if(0>b){for(var c=0;c<ga;++c){var g=W[c];if(g){if(0<g.bindCount)continue;g.unit=-1}W[c]=this;b=c;break}p.profile&&d.maxTextureUnits<b+1&&(d.maxTextureUnits=b+1);this.unit=b;a.activeTexture(33984+
  b);a.bindTexture(this.target,this.texture)}return b},unbind:function(){--this.bindCount},decRef:function(){0>=--this.refCount&&D(this)}});p.profile&&(d.getTotalTextureSize=function(){var a=0;Object.keys(ia).forEach(function(b){a+=ia[b].stats.size});return a});return{create2D:function(b,c){function e(a,b){var c=f.texInfo;Z.call(c);var g=Ha();"number"===typeof a?"number"===typeof b?r(g,a|0,b|0):r(g,a|0,a|0):a?(G(c,a),m(g,a)):r(g,1,1);c.genMipmaps&&(g.mipmask=(g.width<<1)-1);f.mipmask=g.mipmask;u(f,
  g);f.internalformat=g.internalformat;e.width=g.width;e.height=g.height;xa(f);z(g,3553);H(c,3553);ya();nb(g);p.profile&&(f.stats.size=Ja(f.internalformat,f.type,g.width,g.height,c.genMipmaps,!1));e.format=aa[f.internalformat];e.type=K[f.type];e.mag=fa[c.magFilter];e.min=Da[c.minFilter];e.wrapS=ua[c.wrapS];e.wrapT=ua[c.wrapT];return e}var f=new O(3553);ia[f.id]=f;d.textureCount++;e(b,c);e.subimage=function(a,b,c,d){b|=0;c|=0;d|=0;var m=h();u(m,f);m.width=0;m.height=0;B(m,a);m.width=m.width||(f.width>>
  d)-b;m.height=m.height||(f.height>>d)-c;xa(f);l(m,3553,b,c,d);ya();g(m);return e};e.resize=function(b,c){var g=b|0,d=c|0||g;if(g===f.width&&d===f.height)return e;e.width=f.width=g;e.height=f.height=d;xa(f);for(var h=0;f.mipmask>>h;++h){var m=g>>h,x=d>>h;if(!m||!x)break;a.texImage2D(3553,h,f.format,m,x,0,f.format,f.type,null)}ya();p.profile&&(f.stats.size=Ja(f.internalformat,f.type,g,d,!1,!1));return e};e._reglType="texture2d";e._texture=f;p.profile&&(e.stats=f.stats);e.destroy=function(){f.decRef()};
  return e},createCube:function(b,c,e,f,q,n){function k(a,b,c,g,e,d){var f,ca=y.texInfo;Z.call(ca);for(f=0;6>f;++f)D[f]=Ha();if("number"===typeof a||!a)for(a=a|0||1,f=0;6>f;++f)r(D[f],a,a);else if("object"===typeof a)if(b)m(D[0],a),m(D[1],b),m(D[2],c),m(D[3],g),m(D[4],e),m(D[5],d);else if(G(ca,a),t(y,a),"faces"in a)for(a=a.faces,f=0;6>f;++f)u(D[f],y),m(D[f],a[f]);else for(f=0;6>f;++f)m(D[f],a);u(y,D[0]);y.mipmask=ca.genMipmaps?(D[0].width<<1)-1:D[0].mipmask;y.internalformat=D[0].internalformat;k.width=
  D[0].width;k.height=D[0].height;xa(y);for(f=0;6>f;++f)z(D[f],34069+f);H(ca,34067);ya();p.profile&&(y.stats.size=Ja(y.internalformat,y.type,k.width,k.height,ca.genMipmaps,!0));k.format=aa[y.internalformat];k.type=K[y.type];k.mag=fa[ca.magFilter];k.min=Da[ca.minFilter];k.wrapS=ua[ca.wrapS];k.wrapT=ua[ca.wrapT];for(f=0;6>f;++f)nb(D[f]);return k}var y=new O(34067);ia[y.id]=y;d.cubeCount++;var D=Array(6);k(b,c,e,f,q,n);k.subimage=function(a,b,c,e,f){c|=0;e|=0;f|=0;var d=h();u(d,y);d.width=0;d.height=0;
  B(d,b);d.width=d.width||(y.width>>f)-c;d.height=d.height||(y.height>>f)-e;xa(y);l(d,34069+a,c,e,f);ya();g(d);return k};k.resize=function(b){b|=0;if(b!==y.width){k.width=y.width=b;k.height=y.height=b;xa(y);for(var c=0;6>c;++c)for(var g=0;y.mipmask>>g;++g)a.texImage2D(34069+c,g,y.format,b>>g,b>>g,0,y.format,y.type,null);ya();p.profile&&(y.stats.size=Ja(y.internalformat,y.type,k.width,k.height,!1,!0));return k}};k._reglType="textureCube";k._texture=y;p.profile&&(k.stats=y.stats);k.destroy=function(){y.decRef()};
  return k},clear:function(){for(var b=0;b<ga;++b)a.activeTexture(33984+b),a.bindTexture(3553,null),W[b]=null;S(ia).forEach(D);d.cubeCount=0;d.textureCount=0},getTexture:function(a){return null},restore:function(){for(var b=0;b<ga;++b){var c=W[b];c&&(c.bindCount=0,c.unit=-1,W[b]=null)}S(ia).forEach(function(b){b.texture=a.createTexture();a.bindTexture(b.target,b.texture);for(var c=0;32>c;++c)if(0!==(b.mipmask&1<<c))if(3553===b.target)a.texImage2D(3553,c,b.internalformat,b.width>>c,b.height>>c,0,b.internalformat,
  b.type,null);else for(var g=0;6>g;++g)a.texImage2D(34069+g,c,b.internalformat,b.width>>c,b.height>>c,0,b.internalformat,b.type,null);H(b.texInfo,b.target)})},refresh:function(){for(var b=0;b<ga;++b){var c=W[b];c&&(c.bindCount=0,c.unit=-1,W[b]=null);a.activeTexture(33984+b);a.bindTexture(3553,null);a.bindTexture(34067,null)}}}}function Rb(a,b,c,e,f,d){function p(a,b,c){this.target=a;this.texture=b;this.renderbuffer=c;var g=a=0;b?(a=b.width,g=b.height):c&&(a=c.width,g=c.height);this.width=a;this.height=
  g}function n(a){a&&(a.texture&&a.texture._texture.decRef(),a.renderbuffer&&a.renderbuffer._renderbuffer.decRef())}function u(a,b,c){a&&(a.texture?a.texture._texture.refCount+=1:a.renderbuffer._renderbuffer.refCount+=1)}function t(b,c){c&&(c.texture?a.framebufferTexture2D(36160,b,c.target,c.texture._texture.texture,0):a.framebufferRenderbuffer(36160,b,36161,c.renderbuffer._renderbuffer.renderbuffer))}function w(a){var b=3553,c=null,g=null,e=a;"object"===typeof a&&(e=a.data,"target"in a&&(b=a.target|
  0));a=e._reglType;"texture2d"===a?c=e:"textureCube"===a?c=e:"renderbuffer"===a&&(g=e,b=36161);return new p(b,c,g)}function k(a,b,c,g,d){if(c)return a=e.create2D({width:a,height:b,format:g,type:d}),a._texture.refCount=0,new p(3553,a,null);a=f.create({width:a,height:b,format:g});a._renderbuffer.refCount=0;return new p(36161,null,a)}function B(a){return a&&(a.texture||a.renderbuffer)}function l(a,b,c){a&&(a.texture?a.texture.resize(b,c):a.renderbuffer&&a.renderbuffer.resize(b,c),a.width=b,a.height=c)}
  function h(){this.id=G++;H[this.id]=this;this.framebuffer=a.createFramebuffer();this.height=this.width=0;this.colorAttachments=[];this.depthStencilAttachment=this.stencilAttachment=this.depthAttachment=null}function g(a){a.colorAttachments.forEach(n);n(a.depthAttachment);n(a.stencilAttachment);n(a.depthStencilAttachment)}function q(b){a.deleteFramebuffer(b.framebuffer);b.framebuffer=null;d.framebufferCount--;delete H[b.id]}function r(b){var g;a.bindFramebuffer(36160,b.framebuffer);var e=b.colorAttachments;
  for(g=0;g<e.length;++g)t(36064+g,e[g]);for(g=e.length;g<c.maxColorAttachments;++g)a.framebufferTexture2D(36160,36064+g,3553,null,0);a.framebufferTexture2D(36160,33306,3553,null,0);a.framebufferTexture2D(36160,36096,3553,null,0);a.framebufferTexture2D(36160,36128,3553,null,0);t(36096,b.depthAttachment);t(36128,b.stencilAttachment);t(33306,b.depthStencilAttachment);a.checkFramebufferStatus(36160);a.isContextLost();a.bindFramebuffer(36160,z.next?z.next.framebuffer:null);z.cur=z.next;a.getError()}function m(a,
  b){function c(a,b){var f,d=0,h=0,m=!0,q=!0;f=null;var l=!0,n="rgba",t="uint8",p=1,G=null,fa=null,z=null,O=!1;if("number"===typeof a)d=a|0,h=b|0||d;else if(a){"shape"in a?(h=a.shape,d=h[0],h=h[1]):("radius"in a&&(d=h=a.radius),"width"in a&&(d=a.width),"height"in a&&(h=a.height));if("color"in a||"colors"in a)f=a.color||a.colors,Array.isArray(f);if(!f){"colorCount"in a&&(p=a.colorCount|0);"colorTexture"in a&&(l=!!a.colorTexture,n="rgba4");if("colorType"in a&&(t=a.colorType,!l))if("half float"===t||"float16"===
  t)n="rgba16f";else if("float"===t||"float32"===t)n="rgba32f";"colorFormat"in a&&(n=a.colorFormat,0<=Ha.indexOf(n)?l=!0:0<=v.indexOf(n)&&(l=!1))}if("depthTexture"in a||"depthStencilTexture"in a)O=!(!a.depthTexture&&!a.depthStencilTexture);"depth"in a&&("boolean"===typeof a.depth?m=a.depth:(G=a.depth,q=!1));"stencil"in a&&("boolean"===typeof a.stencil?q=a.stencil:(fa=a.stencil,m=!1));"depthStencil"in a&&("boolean"===typeof a.depthStencil?m=q=a.depthStencil:(z=a.depthStencil,q=m=!1))}else d=h=1;var P=
  null,Z=null,H=null,A=null;if(Array.isArray(f))P=f.map(w);else if(f)P=[w(f)];else for(P=Array(p),f=0;f<p;++f)P[f]=k(d,h,l,n,t);d=d||P[0].width;h=h||P[0].height;G?Z=w(G):m&&!q&&(Z=k(d,h,O,"depth","uint32"));fa?H=w(fa):q&&!m&&(H=k(d,h,!1,"stencil","uint8"));z?A=w(z):!G&&!fa&&q&&m&&(A=k(d,h,O,"depth stencil","depth stencil"));m=null;for(f=0;f<P.length;++f)u(P[f],d,h),P[f]&&P[f].texture&&(q=Ya[P[f].texture._texture.format]*Pa[P[f].texture._texture.type],null===m&&(m=q));u(Z,d,h);u(H,d,h);u(A,d,h);g(e);
  e.width=d;e.height=h;e.colorAttachments=P;e.depthAttachment=Z;e.stencilAttachment=H;e.depthStencilAttachment=A;c.color=P.map(B);c.depth=B(Z);c.stencil=B(H);c.depthStencil=B(A);c.width=e.width;c.height=e.height;r(e);return c}var e=new h;d.framebufferCount++;c(a,b);return A(c,{resize:function(a,b){var g=Math.max(a|0,1),f=Math.max(b|0||g,1);if(g===e.width&&f===e.height)return c;for(var d=e.colorAttachments,h=0;h<d.length;++h)l(d[h],g,f);l(e.depthAttachment,g,f);l(e.stencilAttachment,g,f);l(e.depthStencilAttachment,
  g,f);e.width=c.width=g;e.height=c.height=f;r(e);return c},_reglType:"framebuffer",_framebuffer:e,destroy:function(){q(e);g(e)},use:function(a){z.setFBO({framebuffer:c},a)}})}var z={cur:null,next:null,dirty:!1,setFBO:null},Ha=["rgba"],v=["rgba4","rgb565","rgb5 a1"];b.ext_srgb&&v.push("srgba");b.ext_color_buffer_half_float&&v.push("rgba16f","rgb16f");b.webgl_color_buffer_float&&v.push("rgba32f");var Z=["uint8"];b.oes_texture_half_float&&Z.push("half float","float16");b.oes_texture_float&&Z.push("float",
  "float32");var G=0,H={};return A(z,{getFramebuffer:function(a){return"function"===typeof a&&"framebuffer"===a._reglType&&(a=a._framebuffer,a instanceof h)?a:null},create:m,createCube:function(a){function b(a){var g,f={color:null},d=0,h=null;g="rgba";var q="uint8",r=1;if("number"===typeof a)d=a|0;else if(a){"shape"in a?d=a.shape[0]:("radius"in a&&(d=a.radius|0),"width"in a?d=a.width|0:"height"in a&&(d=a.height|0));if("color"in a||"colors"in a)h=a.color||a.colors,Array.isArray(h);h||("colorCount"in
  a&&(r=a.colorCount|0),"colorType"in a&&(q=a.colorType),"colorFormat"in a&&(g=a.colorFormat));"depth"in a&&(f.depth=a.depth);"stencil"in a&&(f.stencil=a.stencil);"depthStencil"in a&&(f.depthStencil=a.depthStencil)}else d=1;if(h)if(Array.isArray(h))for(a=[],g=0;g<h.length;++g)a[g]=h[g];else a=[h];else for(a=Array(r),h={radius:d,format:g,type:q},g=0;g<r;++g)a[g]=e.createCube(h);f.color=Array(a.length);for(g=0;g<a.length;++g)r=a[g],d=d||r.width,f.color[g]={target:34069,data:a[g]};for(g=0;6>g;++g){for(r=
  0;r<a.length;++r)f.color[r].target=34069+g;0<g&&(f.depth=c[0].depth,f.stencil=c[0].stencil,f.depthStencil=c[0].depthStencil);if(c[g])c[g](f);else c[g]=m(f)}return A(b,{width:d,height:d,color:a})}var c=Array(6);b(a);return A(b,{faces:c,resize:function(a){var g=a|0;if(g===b.width)return b;var e=b.color;for(a=0;a<e.length;++a)e[a].resize(g);for(a=0;6>a;++a)c[a].resize(g);b.width=b.height=g;return b},_reglType:"framebufferCube",destroy:function(){c.forEach(function(a){a.destroy()})}})},clear:function(){S(H).forEach(q)},
  restore:function(){z.cur=null;z.next=null;z.dirty=!0;S(H).forEach(function(b){b.framebuffer=a.createFramebuffer();r(b)})}})}function Za(){this.w=this.z=this.y=this.x=this.state=0;this.buffer=null;this.size=0;this.normalized=!1;this.type=5126;this.divisor=this.stride=this.offset=0}function Sb(a,b,c,e,f){function d(a){if(a!==h.currentVAO){var c=b.oes_vertex_array_object;a?c.bindVertexArrayOES(a.vao):c.bindVertexArrayOES(null);h.currentVAO=a}}function p(c){if(c!==h.currentVAO){if(c)c.bindAttrs();else for(var e=
  b.angle_instanced_arrays,f=0;f<k.length;++f){var d=k[f];d.buffer?(a.enableVertexAttribArray(f),a.vertexAttribPointer(f,d.size,d.type,d.normalized,d.stride,d.offfset),e&&d.divisor&&e.vertexAttribDivisorANGLE(f,d.divisor)):(a.disableVertexAttribArray(f),a.vertexAttrib4f(f,d.x,d.y,d.z,d.w))}h.currentVAO=c}}function n(){S(l).forEach(function(a){a.destroy()})}function u(){this.id=++B;this.attributes=[];var a=b.oes_vertex_array_object;this.vao=a?a.createVertexArrayOES():null;l[this.id]=this;this.buffers=
  []}function t(){b.oes_vertex_array_object&&S(l).forEach(function(a){a.refresh()})}var w=c.maxAttributes,k=Array(w);for(c=0;c<w;++c)k[c]=new Za;var B=0,l={},h={Record:Za,scope:{},state:k,currentVAO:null,targetVAO:null,restore:b.oes_vertex_array_object?t:function(){},createVAO:function(a){function b(a){var g={},e=c.attributes;e.length=a.length;for(var d=0;d<a.length;++d){var h=a[d],k=e[d]=new Za,l=h.data||h;if(Array.isArray(l)||M(l)||da(l)){var n;c.buffers[d]&&(n=c.buffers[d],M(l)&&n._buffer.byteLength>=
  l.byteLength?n.subdata(l):(n.destroy(),c.buffers[d]=null));c.buffers[d]||(n=c.buffers[d]=f.create(h,34962,!1,!0));k.buffer=f.getBuffer(n);k.size=k.buffer.dimension|0;k.normalized=!1;k.type=k.buffer.dtype;k.offset=0;k.stride=0;k.divisor=0;k.state=1;g[d]=1}else f.getBuffer(h)?(k.buffer=f.getBuffer(h),k.size=k.buffer.dimension|0,k.normalized=!1,k.type=k.buffer.dtype,k.offset=0,k.stride=0,k.divisor=0,k.state=1):f.getBuffer(h.buffer)?(k.buffer=f.getBuffer(h.buffer),k.size=(+h.size||k.buffer.dimension)|
  0,k.normalized=!!h.normalized||!1,k.type="type"in h?Ia[h.type]:k.buffer.dtype,k.offset=(h.offset||0)|0,k.stride=(h.stride||0)|0,k.divisor=(h.divisor||0)|0,k.state=1):"x"in h&&(k.x=+h.x||0,k.y=+h.y||0,k.z=+h.z||0,k.w=+h.w||0,k.state=2)}for(a=0;a<c.buffers.length;++a)!g[a]&&c.buffers[a]&&(c.buffers[a].destroy(),c.buffers[a]=null);c.refresh();return b}var c=new u;e.vaoCount+=1;b.destroy=function(){for(var a=0;a<c.buffers.length;++a)c.buffers[a]&&c.buffers[a].destroy();c.buffers.length=0;c.destroy()};
  b._vao=c;b._reglType="vao";return b(a)},getVAO:function(a){return"function"===typeof a&&a._vao?a._vao:null},destroyBuffer:function(b){for(var c=0;c<k.length;++c){var e=k[c];e.buffer===b&&(a.disableVertexAttribArray(c),e.buffer=null)}},setVAO:b.oes_vertex_array_object?d:p,clear:b.oes_vertex_array_object?n:function(){}};u.prototype.bindAttrs=function(){for(var c=b.angle_instanced_arrays,e=this.attributes,f=0;f<e.length;++f){var d=e[f];d.buffer?(a.enableVertexAttribArray(f),a.bindBuffer(34962,d.buffer.buffer),
  a.vertexAttribPointer(f,d.size,d.type,d.normalized,d.stride,d.offset),c&&d.divisor&&c.vertexAttribDivisorANGLE(f,d.divisor)):(a.disableVertexAttribArray(f),a.vertexAttrib4f(f,d.x,d.y,d.z,d.w))}for(c=e.length;c<w;++c)a.disableVertexAttribArray(c)};u.prototype.refresh=function(){var a=b.oes_vertex_array_object;a&&(a.bindVertexArrayOES(this.vao),this.bindAttrs(),h.currentVAO=this)};u.prototype.destroy=function(){if(this.vao){var a=b.oes_vertex_array_object;this===h.currentVAO&&(h.currentVAO=null,a.bindVertexArrayOES(null));
  a.deleteVertexArrayOES(this.vao);this.vao=null}l[this.id]&&(delete l[this.id],--e.vaoCount)};return h}function Tb(a,b,c,e){function f(a,b,c,e){this.name=a;this.id=b;this.location=c;this.info=e}function d(a,b){for(var c=0;c<a.length;++c)if(a[c].id===b.id){a[c].location=b.location;return}a.push(b)}function p(c,g,e){e=35632===c?t:w;var d=e[g];if(!d){var f=b.str(g),d=a.createShader(c);a.shaderSource(d,f);a.compileShader(d);e[g]=d}return d}function n(a,b){this.id=l++;this.fragId=a;this.vertId=b;this.program=
  null;this.uniforms=[];this.attributes=[];this.refCount=1;e.profile&&(this.stats={uniformsCount:0,attributesCount:0})}function u(c,g,k){var l;l=p(35632,c.fragId);var m=p(35633,c.vertId);g=c.program=a.createProgram();a.attachShader(g,l);a.attachShader(g,m);if(k)for(l=0;l<k.length;++l)m=k[l],a.bindAttribLocation(g,m[0],m[1]);a.linkProgram(g);m=a.getProgramParameter(g,35718);e.profile&&(c.stats.uniformsCount=m);var n=c.uniforms;for(l=0;l<m;++l)if(k=a.getActiveUniform(g,l))if(1<k.size)for(var t=0;t<k.size;++t){var u=
  k.name.replace("[0]","["+t+"]");d(n,new f(u,b.id(u),a.getUniformLocation(g,u),k))}else d(n,new f(k.name,b.id(k.name),a.getUniformLocation(g,k.name),k));m=a.getProgramParameter(g,35721);e.profile&&(c.stats.attributesCount=m);c=c.attributes;for(l=0;l<m;++l)(k=a.getActiveAttrib(g,l))&&d(c,new f(k.name,b.id(k.name),a.getAttribLocation(g,k.name),k))}var t={},w={},k={},B=[],l=0;e.profile&&(c.getMaxUniformsCount=function(){var a=0;B.forEach(function(b){b.stats.uniformsCount>a&&(a=b.stats.uniformsCount)});
  return a},c.getMaxAttributesCount=function(){var a=0;B.forEach(function(b){b.stats.attributesCount>a&&(a=b.stats.attributesCount)});return a});return{clear:function(){var b=a.deleteShader.bind(a);S(t).forEach(b);t={};S(w).forEach(b);w={};B.forEach(function(b){a.deleteProgram(b.program)});B.length=0;k={};c.shaderCount=0},program:function(b,e,d,f){var l=k[e];l||(l=k[e]={});var p=l[b];if(p&&(p.refCount++,!f))return p;var v=new n(e,b);c.shaderCount++;u(v,d,f);p||(l[b]=v);B.push(v);return A(v,{destroy:function(){v.refCount--;
  if(0>=v.refCount){a.deleteProgram(v.program);var b=B.indexOf(v);B.splice(b,1);c.shaderCount--}0>=l[v.vertId].refCount&&(a.deleteShader(w[v.vertId]),delete w[v.vertId],delete k[v.fragId][v.vertId]);Object.keys(k[v.fragId]).length||(a.deleteShader(t[v.fragId]),delete t[v.fragId],delete k[v.fragId])}})},restore:function(){t={};w={};for(var a=0;a<B.length;++a)u(B[a],null,B[a].attributes.map(function(a){return[a.location,a.name]}))},shader:p,frag:-1,vert:-1}}function Ub(a,b,c,e,f,d,p){function n(d){var f;
  f=null===b.next?5121:b.next.colorAttachments[0].texture._texture.type;var k=0,n=0,l=e.framebufferWidth,h=e.framebufferHeight,g=null;M(d)?g=d:d&&(k=d.x|0,n=d.y|0,l=(d.width||e.framebufferWidth-k)|0,h=(d.height||e.framebufferHeight-n)|0,g=d.data||null);c();d=l*h*4;g||(5121===f?g=new Uint8Array(d):5126===f&&(g=g||new Float32Array(d)));a.pixelStorei(3333,4);a.readPixels(k,n,l,h,6408,f,g);return g}function u(a){var c;b.setFBO({framebuffer:a.framebuffer},function(){c=n(a)});return c}return function(a){return a&&
  "framebuffer"in a?u(a):n(a)}}function za(a){return Array.prototype.slice.call(a)}function Aa(a){return za(a).join("")}function Vb(){function a(){var a=[],b=[];return A(function(){a.push.apply(a,za(arguments))},{def:function(){var d="v"+c++;b.push(d);0<arguments.length&&(a.push(d,"="),a.push.apply(a,za(arguments)),a.push(";"));return d},toString:function(){return Aa([0<b.length?"var "+b.join(",")+";":"",Aa(a)])}})}function b(){function b(a,e){d(a,e,"=",c.def(a,e),";")}var c=a(),d=a(),e=c.toString,
  f=d.toString;return A(function(){c.apply(c,za(arguments))},{def:c.def,entry:c,exit:d,save:b,set:function(a,d,e){b(a,d);c(a,d,"=",e,";")},toString:function(){return e()+f()}})}var c=0,e=[],f=[],d=a(),p={};return{global:d,link:function(a){for(var b=0;b<f.length;++b)if(f[b]===a)return e[b];b="g"+c++;e.push(b);f.push(a);return b},block:a,proc:function(a,c){function d(){var a="a"+e.length;e.push(a);return a}var e=[];c=c||0;for(var f=0;f<c;++f)d();var f=b(),B=f.toString;return p[a]=A(f,{arg:d,toString:function(){return Aa(["function(",
  e.join(),"){",B(),"}"])}})},scope:b,cond:function(){var a=Aa(arguments),c=b(),d=b(),e=c.toString,f=d.toString;return A(c,{then:function(){c.apply(c,za(arguments));return this},"else":function(){d.apply(d,za(arguments));return this},toString:function(){var b=f();b&&(b="else{"+b+"}");return Aa(["if(",a,"){",e(),"}",b])}})},compile:function(){var a=['"use strict";',d,"return {"];Object.keys(p).forEach(function(b){a.push('"',b,'":',p[b].toString(),",")});a.push("}");var b=Aa(a).replace(/;/g,";\n").replace(/}/g,
  "}\n").replace(/{/g,"{\n");return Function.apply(null,e.concat(b)).apply(null,f)}}}function Qa(a){return Array.isArray(a)||M(a)||da(a)}function zb(a){return a.sort(function(a,c){return"viewport"===a?-1:"viewport"===c?1:a<c?-1:1})}function K(a,b,c,e){this.thisDep=a;this.contextDep=b;this.propDep=c;this.append=e}function sa(a){return a&&!(a.thisDep||a.contextDep||a.propDep)}function v(a){return new K(!1,!1,!1,a)}function L(a,b){var c=a.type;if(0===c)return c=a.data.length,new K(!0,1<=c,2<=c,b);if(4===
  c)return c=a.data,new K(c.thisDep,c.contextDep,c.propDep,b);if(5===c)return new K(!1,!1,!1,b);if(6===c){for(var e=c=!1,f=!1,d=0;d<a.data.length;++d){var p=a.data[d];1===p.type?f=!0:2===p.type?e=!0:3===p.type?c=!0:0===p.type?(c=!0,p=p.data,1<=p&&(e=!0),2<=p&&(f=!0)):4===p.type&&(c=c||p.data.thisDep,e=e||p.data.contextDep,f=f||p.data.propDep)}return new K(c,e,f,b)}return new K(3===c,2===c,1===c,b)}function Wb(a,b,c,e,f,d,p,n,u,t,w,k,B,l,h){function g(a){return a.replace(".","_")}function q(a,b,c){var d=
  g(a);La.push(a);Ca[d]=pa[d]=!!c;qa[d]=b}function r(a,b,c){var d=g(a);La.push(a);Array.isArray(c)?(pa[d]=c.slice(),Ca[d]=c.slice()):pa[d]=Ca[d]=c;ra[d]=b}function m(){var a=Vb(),c=a.link,d=a.global;a.id=na++;a.batchId="0";var e=c(ub),f=a.shared={props:"a0"};Object.keys(ub).forEach(function(a){f[a]=d.def(e,".",a)});var g=a.next={},h=a.current={};Object.keys(ra).forEach(function(a){Array.isArray(pa[a])&&(g[a]=d.def(f.next,".",a),h[a]=d.def(f.current,".",a))});var ba=a.constants={};Object.keys(Na).forEach(function(a){ba[a]=
  d.def(JSON.stringify(Na[a]))});a.invoke=function(b,d){switch(d.type){case 0:var e=["this",f.context,f.props,a.batchId];return b.def(c(d.data),".call(",e.slice(0,Math.max(d.data.length+1,4)),")");case 1:return b.def(f.props,d.data);case 2:return b.def(f.context,d.data);case 3:return b.def("this",d.data);case 4:return d.data.append(a,b),d.data.ref;case 5:return d.data.toString();case 6:return d.data.map(function(c){return a.invoke(b,c)})}};a.attribCache={};var va={};a.scopeAttrib=function(a){a=b.id(a);
  if(a in va)return va[a];var d=t.scope[a];d||(d=t.scope[a]=new ga);return va[a]=c(d)};return a}function z(a){var b=a["static"];a=a.dynamic;var c;if("profile"in b){var d=!!b.profile;c=v(function(a,b){return d});c.enable=d}else if("profile"in a){var e=a.profile;c=L(e,function(a,b){return a.invoke(b,e)})}return c}function E(a,b){var c=a["static"],d=a.dynamic;if("framebuffer"in c){var e=c.framebuffer;return e?(e=n.getFramebuffer(e),v(function(a,b){var c=a.link(e),d=a.shared;b.set(d.framebuffer,".next",
  c);d=d.context;b.set(d,".framebufferWidth",c+".width");b.set(d,".framebufferHeight",c+".height");return c})):v(function(a,b){var c=a.shared;b.set(c.framebuffer,".next","null");c=c.context;b.set(c,".framebufferWidth",c+".drawingBufferWidth");b.set(c,".framebufferHeight",c+".drawingBufferHeight");return"null"})}if("framebuffer"in d){var f=d.framebuffer;return L(f,function(a,b){var c=a.invoke(b,f),d=a.shared,e=d.framebuffer,c=b.def(e,".getFramebuffer(",c,")");b.set(e,".next",c);d=d.context;b.set(d,".framebufferWidth",
  c+"?"+c+".width:"+d+".drawingBufferWidth");b.set(d,".framebufferHeight",c+"?"+c+".height:"+d+".drawingBufferHeight");return c})}return null}function F(a,b,c){function d(a){if(a in e){var c=e[a];a=!0;var g=c.x|0,x=c.y|0,h,k;"width"in c?h=c.width|0:a=!1;"height"in c?k=c.height|0:a=!1;return new K(!a&&b&&b.thisDep,!a&&b&&b.contextDep,!a&&b&&b.propDep,function(a,b){var d=a.shared.context,e=h;"width"in c||(e=b.def(d,".","framebufferWidth","-",g));var f=k;"height"in c||(f=b.def(d,".","framebufferHeight",
  "-",x));return[g,x,e,f]})}if(a in f){var ca=f[a];a=L(ca,function(a,b){var c=a.invoke(b,ca),d=a.shared.context,e=b.def(c,".x|0"),f=b.def(c,".y|0"),g=b.def('"width" in ',c,"?",c,".width|0:","(",d,".","framebufferWidth","-",e,")"),c=b.def('"height" in ',c,"?",c,".height|0:","(",d,".","framebufferHeight","-",f,")");return[e,f,g,c]});b&&(a.thisDep=a.thisDep||b.thisDep,a.contextDep=a.contextDep||b.contextDep,a.propDep=a.propDep||b.propDep);return a}return b?new K(b.thisDep,b.contextDep,b.propDep,function(a,
  b){var c=a.shared.context;return[0,0,b.def(c,".","framebufferWidth"),b.def(c,".","framebufferHeight")]}):null}var e=a["static"],f=a.dynamic;if(a=d("viewport")){var g=a;a=new K(a.thisDep,a.contextDep,a.propDep,function(a,b){var c=g.append(a,b),d=a.shared.context;b.set(d,".viewportWidth",c[2]);b.set(d,".viewportHeight",c[3]);return c})}return{viewport:a,scissor_box:d("scissor.box")}}function Z(a,b){var c=a["static"];if("string"===typeof c.frag&&"string"===typeof c.vert){if(0<Object.keys(b.dynamic).length)return null;
  var c=b["static"],d=Object.keys(c);if(0<d.length&&"number"===typeof c[d[0]]){for(var e=[],f=0;f<d.length;++f)e.push([c[d[f]]|0,d[f]]);return e}}return null}function G(a,c,d){function e(a){if(a in f){var c=b.id(f[a]);a=v(function(){return c});a.id=c;return a}if(a in g){var d=g[a];return L(d,function(a,b){var c=a.invoke(b,d);return b.def(a.shared.strings,".id(",c,")")})}return null}var f=a["static"],g=a.dynamic,h=e("frag"),ba=e("vert"),va=null;sa(h)&&sa(ba)?(va=w.program(ba.id,h.id,null,d),a=v(function(a,
  b){return a.link(va)})):a=new K(h&&h.thisDep||ba&&ba.thisDep,h&&h.contextDep||ba&&ba.contextDep,h&&h.propDep||ba&&ba.propDep,function(a,b){var c=a.shared.shader,d;d=h?h.append(a,b):b.def(c,".","frag");var e;e=ba?ba.append(a,b):b.def(c,".","vert");return b.def(c+".program("+e+","+d+")")});return{frag:h,vert:ba,progVar:a,program:va}}function H(a,b){function c(a,b){if(a in e){var d=e[a]|0;return v(function(a,c){b&&(a.OFFSET=d);return d})}if(a in f){var x=f[a];return L(x,function(a,c){var d=a.invoke(c,
  x);b&&(a.OFFSET=d);return d})}return b&&g?v(function(a,b){a.OFFSET="0";return 0}):null}var e=a["static"],f=a.dynamic,g=function(){if("elements"in e){var a=e.elements;Qa(a)?a=d.getElements(d.create(a,!0)):a&&(a=d.getElements(a));var b=v(function(b,c){if(a){var d=b.link(a);return b.ELEMENTS=d}return b.ELEMENTS=null});b.value=a;return b}if("elements"in f){var c=f.elements;return L(c,function(a,b){var d=a.shared,e=d.isBufferArgs,d=d.elements,f=a.invoke(b,c),g=b.def("null"),e=b.def(e,"(",f,")"),f=a.cond(e).then(g,
  "=",d,".createStream(",f,");")["else"](g,"=",d,".getElements(",f,");");b.entry(f);b.exit(a.cond(e).then(d,".destroyStream(",g,");"));return a.ELEMENTS=g})}return null}(),h=c("offset",!0);return{elements:g,primitive:function(){if("primitive"in e){var a=e.primitive;return v(function(b,c){return Ta[a]})}if("primitive"in f){var b=f.primitive;return L(b,function(a,c){var d=a.constants.primTypes,e=a.invoke(c,b);return c.def(d,"[",e,"]")})}return g?sa(g)?g.value?v(function(a,b){return b.def(a.ELEMENTS,".primType")}):
  v(function(){return 4}):new K(g.thisDep,g.contextDep,g.propDep,function(a,b){var c=a.ELEMENTS;return b.def(c,"?",c,".primType:",4)}):null}(),count:function(){if("count"in e){var a=e.count|0;return v(function(){return a})}if("count"in f){var b=f.count;return L(b,function(a,c){return a.invoke(c,b)})}return g?sa(g)?g?h?new K(h.thisDep,h.contextDep,h.propDep,function(a,b){return b.def(a.ELEMENTS,".vertCount-",a.OFFSET)}):v(function(a,b){return b.def(a.ELEMENTS,".vertCount")}):v(function(){return-1}):
  new K(g.thisDep||h.thisDep,g.contextDep||h.contextDep,g.propDep||h.propDep,function(a,b){var c=a.ELEMENTS;return a.OFFSET?b.def(c,"?",c,".vertCount-",a.OFFSET,":-1"):b.def(c,"?",c,".vertCount:-1")}):null}(),instances:c("instances",!1),offset:h}}function O(a,b){var c=a["static"],d=a.dynamic,e={};La.forEach(function(a){function b(g,x){if(a in c){var h=g(c[a]);e[f]=v(function(){return h})}else if(a in d){var I=d[a];e[f]=L(I,function(a,b){return x(a,b,a.invoke(b,I))})}}var f=g(a);switch(a){case "cull.enable":case "blend.enable":case "dither":case "stencil.enable":case "depth.enable":case "scissor.enable":case "polygonOffset.enable":case "sample.alpha":case "sample.enable":case "depth.mask":return b(function(a){return a},
  function(a,b,c){return c});case "depth.func":return b(function(a){return ab[a]},function(a,b,c){return b.def(a.constants.compareFuncs,"[",c,"]")});case "depth.range":return b(function(a){return a},function(a,b,c){a=b.def("+",c,"[0]");b=b.def("+",c,"[1]");return[a,b]});case "blend.func":return b(function(a){return[Ea["srcRGB"in a?a.srcRGB:a.src],Ea["dstRGB"in a?a.dstRGB:a.dst],Ea["srcAlpha"in a?a.srcAlpha:a.src],Ea["dstAlpha"in a?a.dstAlpha:a.dst]]},function(a,b,c){function d(a,e){return b.def('"',
  a,e,'" in ',c,"?",c,".",a,e,":",c,".",a)}a=a.constants.blendFuncs;var e=d("src","RGB"),f=d("dst","RGB"),e=b.def(a,"[",e,"]"),g=b.def(a,"[",d("src","Alpha"),"]"),f=b.def(a,"[",f,"]");a=b.def(a,"[",d("dst","Alpha"),"]");return[e,f,g,a]});case "blend.equation":return b(function(a){if("string"===typeof a)return[W[a],W[a]];if("object"===typeof a)return[W[a.rgb],W[a.alpha]]},function(a,b,c){var d=a.constants.blendEquations,e=b.def(),f=b.def();a=a.cond("typeof ",c,'==="string"');a.then(e,"=",f,"=",d,"[",
  c,"];");a["else"](e,"=",d,"[",c,".rgb];",f,"=",d,"[",c,".alpha];");b(a);return[e,f]});case "blend.color":return b(function(a){return J(4,function(b){return+a[b]})},function(a,b,c){return J(4,function(a){return b.def("+",c,"[",a,"]")})});case "stencil.mask":return b(function(a){return a|0},function(a,b,c){return b.def(c,"|0")});case "stencil.func":return b(function(a){return[ab[a.cmp||"keep"],a.ref||0,"mask"in a?a.mask:-1]},function(a,b,c){a=b.def('"cmp" in ',c,"?",a.constants.compareFuncs,"[",c,".cmp]",
  ":",7680);var d=b.def(c,".ref|0");b=b.def('"mask" in ',c,"?",c,".mask|0:-1");return[a,d,b]});case "stencil.opFront":case "stencil.opBack":return b(function(b){return["stencil.opBack"===a?1029:1028,Ra[b.fail||"keep"],Ra[b.zfail||"keep"],Ra[b.zpass||"keep"]]},function(b,c,d){function e(a){return c.def('"',a,'" in ',d,"?",f,"[",d,".",a,"]:",7680)}var f=b.constants.stencilOps;return["stencil.opBack"===a?1029:1028,e("fail"),e("zfail"),e("zpass")]});case "polygonOffset.offset":return b(function(a){return[a.factor|
  0,a.units|0]},function(a,b,c){a=b.def(c,".factor|0");b=b.def(c,".units|0");return[a,b]});case "cull.face":return b(function(a){var b=0;"front"===a?b=1028:"back"===a&&(b=1029);return b},function(a,b,c){return b.def(c,'==="front"?',1028,":",1029)});case "lineWidth":return b(function(a){return a},function(a,b,c){return c});case "frontFace":return b(function(a){return Ab[a]},function(a,b,c){return b.def(c+'==="cw"?2304:2305')});case "colorMask":return b(function(a){return a.map(function(a){return!!a})},
  function(a,b,c){return J(4,function(a){return"!!"+c+"["+a+"]"})});case "sample.coverage":return b(function(a){return["value"in a?a.value:1,!!a.invert]},function(a,b,c){a=b.def('"value" in ',c,"?+",c,".value:1");b=b.def("!!",c,".invert");return[a,b]})}});return e}function M(a,b){var c=a["static"],d=a.dynamic,e={};Object.keys(c).forEach(function(a){var b=c[a],d;if("number"===typeof b||"boolean"===typeof b)d=v(function(){return b});else if("function"===typeof b){var f=b._reglType;if("texture2d"===f||
  "textureCube"===f)d=v(function(a){return a.link(b)});else if("framebuffer"===f||"framebufferCube"===f)d=v(function(a){return a.link(b.color[0])})}else ma(b)&&(d=v(function(a){return a.global.def("[",J(b.length,function(a){return b[a]}),"]")}));d.value=b;e[a]=d});Object.keys(d).forEach(function(a){var b=d[a];e[a]=L(b,function(a,c){return a.invoke(c,b)})});return e}function S(a,c){var d=a["static"],e=a.dynamic,g={};Object.keys(d).forEach(function(a){var c=d[a],e=b.id(a),x=new ga;if(Qa(c))x.state=1,
  x.buffer=f.getBuffer(f.create(c,34962,!1,!0)),x.type=0;else{var h=f.getBuffer(c);if(h)x.state=1,x.buffer=h,x.type=0;else if("constant"in c){var I=c.constant;x.buffer="null";x.state=2;"number"===typeof I?x.x=I:Ba.forEach(function(a,b){b<I.length&&(x[a]=I[b])})}else{var h=Qa(c.buffer)?f.getBuffer(f.create(c.buffer,34962,!1,!0)):f.getBuffer(c.buffer),k=c.offset|0,l=c.stride|0,m=c.size|0,ka=!!c.normalized,n=0;"type"in c&&(n=Ia[c.type]);c=c.divisor|0;x.buffer=h;x.state=1;x.size=m;x.normalized=ka;x.type=
  n||h.dtype;x.offset=k;x.stride=l;x.divisor=c}}g[a]=v(function(a,b){var c=a.attribCache;if(e in c)return c[e];var d={isStream:!1};Object.keys(x).forEach(function(a){d[a]=x[a]});x.buffer&&(d.buffer=a.link(x.buffer),d.type=d.type||d.buffer+".dtype");return c[e]=d})});Object.keys(e).forEach(function(a){var b=e[a];g[a]=L(b,function(a,c){function d(a){c(h[a],"=",e,".",a,"|0;")}var e=a.invoke(c,b),f=a.shared,g=a.constants,x=f.isBufferArgs,f=f.buffer,h={isStream:c.def(!1)},I=new ga;I.state=1;Object.keys(I).forEach(function(a){h[a]=
  c.def(""+I[a])});var k=h.buffer,l=h.type;c("if(",x,"(",e,")){",h.isStream,"=true;",k,"=",f,".createStream(",34962,",",e,");",l,"=",k,".dtype;","}else{",k,"=",f,".getBuffer(",e,");","if(",k,"){",l,"=",k,".dtype;",'}else if("constant" in ',e,"){",h.state,"=",2,";","if(typeof "+e+'.constant === "number"){',h[Ba[0]],"=",e,".constant;",Ba.slice(1).map(function(a){return h[a]}).join("="),"=0;","}else{",Ba.map(function(a,b){return h[a]+"="+e+".constant.length>"+b+"?"+e+".constant["+b+"]:0;"}).join(""),"}}else{",
  "if(",x,"(",e,".buffer)){",k,"=",f,".createStream(",34962,",",e,".buffer);","}else{",k,"=",f,".getBuffer(",e,".buffer);","}",l,'="type" in ',e,"?",g.glTypes,"[",e,".type]:",k,".dtype;",h.normalized,"=!!",e,".normalized;");d("size");d("offset");d("stride");d("divisor");c("}}");c.exit("if(",h.isStream,"){",f,".destroyStream(",k,");","}");return h})});return g}function D(a,b){var c=a["static"],d=a.dynamic;if("vao"in c){var e=c.vao;null!==e&&null===t.getVAO(e)&&(e=t.createVAO(e));return v(function(a){return a.link(t.getVAO(e))})}if("vao"in
  d){var f=d.vao;return L(f,function(a,b){var c=a.invoke(b,f);return b.def(a.shared.vao+".getVAO("+c+")")})}return null}function y(a){var b=a["static"],c=a.dynamic,d={};Object.keys(b).forEach(function(a){var c=b[a];d[a]=v(function(a,b){return"number"===typeof c||"boolean"===typeof c?""+c:a.link(c)})});Object.keys(c).forEach(function(a){var b=c[a];d[a]=L(b,function(a,c){return a.invoke(c,b)})});return d}function la(a,b,d,e,f){function h(a){var b=m[a];b&&($a[a]=b)}var k=Z(a,b),l=E(a,f),m=F(a,l,f),n=H(a,
  f),$a=O(a,f),p=G(a,f,k);h("viewport");h(g("scissor.box"));var q=0<Object.keys($a).length,l={framebuffer:l,draw:n,shader:p,state:$a,dirty:q,scopeVAO:null,drawVAO:null,useVAO:!1,attributes:{}};l.profile=z(a,f);l.uniforms=M(d,f);l.drawVAO=l.scopeVAO=D(a,f);if(!l.drawVAO&&p.program&&!k&&c.angle_instanced_arrays){var r=!0;a=p.program.attributes.map(function(a){a=b["static"][a];r=r&&!!a;return a});if(r&&0<a.length){var w=t.getVAO(t.createVAO(a));l.drawVAO=new K(null,null,null,function(a,b){return a.link(w)});
  l.useVAO=!0}}k?l.useVAO=!0:l.attributes=S(b,f);l.context=y(e,f);return l}function V(a,b,c){var d=a.shared.context,e=a.scope();Object.keys(c).forEach(function(f){b.save(d,"."+f);var g=c[f].append(a,b);Array.isArray(g)?e(d,".",f,"=[",g.join(),"];"):e(d,".",f,"=",g,";")});b(e)}function R(a,b,c,d){var e=a.shared,f=e.gl,g=e.framebuffer,h;Ka&&(h=b.def(e.extensions,".webgl_draw_buffers"));var k=a.constants,e=k.drawBuffer,k=k.backBuffer;a=c?c.append(a,b):b.def(g,".next");d||b("if(",a,"!==",g,".cur){");b("if(",
  a,"){",f,".bindFramebuffer(",36160,",",a,".framebuffer);");Ka&&b(h,".drawBuffersWEBGL(",e,"[",a,".colorAttachments.length]);");b("}else{",f,".bindFramebuffer(",36160,",null);");Ka&&b(h,".drawBuffersWEBGL(",k,");");b("}",g,".cur=",a,";");d||b("}")}function T(a,b,c){var d=a.shared,e=d.gl,f=a.current,h=a.next,k=d.current,l=d.next,m=a.cond(k,".dirty");La.forEach(function(b){b=g(b);if(!(b in c.state)){var d,I;if(b in h){d=h[b];I=f[b];var n=J(pa[b].length,function(a){return m.def(d,"[",a,"]")});m(a.cond(n.map(function(a,
  b){return a+"!=="+I+"["+b+"]"}).join("||")).then(e,".",ra[b],"(",n,");",n.map(function(a,b){return I+"["+b+"]="+a}).join(";"),";"))}else d=m.def(l,".",b),n=a.cond(d,"!==",k,".",b),m(n),b in qa?n(a.cond(d).then(e,".enable(",qa[b],");")["else"](e,".disable(",qa[b],");"),k,".",b,"=",d,";"):n(e,".",ra[b],"(",d,");",k,".",b,"=",d,";")}});0===Object.keys(c.state).length&&m(k,".dirty=false;");b(m)}function N(a,b,c,d){var e=a.shared,f=a.current,g=e.current,h=e.gl;zb(Object.keys(c)).forEach(function(e){var k=
  c[e];if(!d||d(k)){var l=k.append(a,b);if(qa[e]){var m=qa[e];sa(k)?l?b(h,".enable(",m,");"):b(h,".disable(",m,");"):b(a.cond(l).then(h,".enable(",m,");")["else"](h,".disable(",m,");"));b(g,".",e,"=",l,";")}else if(ma(l)){var n=f[e];b(h,".",ra[e],"(",l,");",l.map(function(a,b){return n+"["+b+"]="+a}).join(";"),";")}else b(h,".",ra[e],"(",l,");",g,".",e,"=",l,";")}})}function C(a,b){oa&&(a.instancing=b.def(a.shared.extensions,".angle_instanced_arrays"))}function Q(a,b,c,d,e){function f(){return"undefined"===
  typeof performance?"Date.now()":"performance.now()"}function g(a){r=b.def();a(r,"=",f(),";");"string"===typeof e?a(n,".count+=",e,";"):a(n,".count++;");l&&(d?(t=b.def(),a(t,"=",q,".getNumPendingQueries();")):a(q,".beginQuery(",n,");"))}function h(a){a(n,".cpuTime+=",f(),"-",r,";");l&&(d?a(q,".pushScopeStats(",t,",",q,".getNumPendingQueries(),",n,");"):a(q,".endQuery();"))}function k(a){var c=b.def(p,".profile");b(p,".profile=",a,";");b.exit(p,".profile=",c,";")}var m=a.shared,n=a.stats,p=m.current,
  q=m.timer;c=c.profile;var r,t;if(c){if(sa(c)){c.enable?(g(b),h(b.exit),k("true")):k("false");return}c=c.append(a,b);k(c)}else c=b.def(p,".profile");m=a.block();g(m);b("if(",c,"){",m,"}");a=a.block();h(a);b.exit("if(",c,"){",a,"}")}function U(a,b,c,d,e){function f(a){switch(a){case 35664:case 35667:case 35671:return 2;case 35665:case 35668:case 35672:return 3;case 35666:case 35669:case 35673:return 4;default:return 1}}function g(c,d,e){function f(){b("if(!",n,".buffer){",l,".enableVertexAttribArray(",
  m,");}");var c=e.type,g;g=e.size?b.def(e.size,"||",d):d;b("if(",n,".type!==",c,"||",n,".size!==",g,"||",q.map(function(a){return n+"."+a+"!=="+e[a]}).join("||"),"){",l,".bindBuffer(",34962,",",ja,".buffer);",l,".vertexAttribPointer(",[m,g,c,e.normalized,e.stride,e.offset],");",n,".type=",c,";",n,".size=",g,";",q.map(function(a){return n+"."+a+"="+e[a]+";"}).join(""),"}");oa&&(c=e.divisor,b("if(",n,".divisor!==",c,"){",a.instancing,".vertexAttribDivisorANGLE(",[m,c],");",n,".divisor=",c,";}"))}function k(){b("if(",
  n,".buffer){",l,".disableVertexAttribArray(",m,");",n,".buffer=null;","}if(",Ba.map(function(a,b){return n+"."+a+"!=="+p[b]}).join("||"),"){",l,".vertexAttrib4f(",m,",",p,");",Ba.map(function(a,b){return n+"."+a+"="+p[b]+";"}).join(""),"}")}var l=h.gl,m=b.def(c,".location"),n=b.def(h.attributes,"[",m,"]");c=e.state;var ja=e.buffer,p=[e.x,e.y,e.z,e.w],q=["buffer","normalized","offset","stride"];1===c?f():2===c?k():(b("if(",c,"===",1,"){"),f(),b("}else{"),k(),b("}"))}var h=a.shared;d.forEach(function(d){var h=
  d.name,k=c.attributes[h],l;if(k){if(!e(k))return;l=k.append(a,b)}else{if(!e(Bb))return;var m=a.scopeAttrib(h);l={};Object.keys(new ga).forEach(function(a){l[a]=b.def(m,".",a)})}g(a.link(d),f(d.info.type),l)})}function ta(a,c,d,e,f){for(var g=a.shared,h=g.gl,k,l=0;l<e.length;++l){var m=e[l],n=m.name,p=m.info.type,q=d.uniforms[n],m=a.link(m)+".location",r;if(q){if(!f(q))continue;if(sa(q)){n=q.value;if(35678===p||35680===p)p=a.link(n._texture||n.color[0]._texture),c(h,".uniform1i(",m,",",p+".bind());"),
  c.exit(p,".unbind();");else if(35674===p||35675===p||35676===p)n=a.global.def("new Float32Array(["+Array.prototype.slice.call(n)+"])"),q=2,35675===p?q=3:35676===p&&(q=4),c(h,".uniformMatrix",q,"fv(",m,",false,",n,");");else{switch(p){case 5126:k="1f";break;case 35664:k="2f";break;case 35665:k="3f";break;case 35666:k="4f";break;case 35670:k="1i";break;case 5124:k="1i";break;case 35671:k="2i";break;case 35667:k="2i";break;case 35672:k="3i";break;case 35668:k="3i";break;case 35673:k="4i";break;case 35669:k=
  "4i"}c(h,".uniform",k,"(",m,",",ma(n)?Array.prototype.slice.call(n):n,");")}continue}else r=q.append(a,c)}else{if(!f(Bb))continue;r=c.def(g.uniforms,"[",b.id(n),"]")}35678===p?c("if(",r,"&&",r,'._reglType==="framebuffer"){',r,"=",r,".color[0];","}"):35680===p&&c("if(",r,"&&",r,'._reglType==="framebufferCube"){',r,"=",r,".color[0];","}");n=1;switch(p){case 35678:case 35680:p=c.def(r,"._texture");c(h,".uniform1i(",m,",",p,".bind());");c.exit(p,".unbind();");continue;case 5124:case 35670:k="1i";break;
  case 35667:case 35671:k="2i";n=2;break;case 35668:case 35672:k="3i";n=3;break;case 35669:case 35673:k="4i";n=4;break;case 5126:k="1f";break;case 35664:k="2f";n=2;break;case 35665:k="3f";n=3;break;case 35666:k="4f";n=4;break;case 35674:k="Matrix2fv";break;case 35675:k="Matrix3fv";break;case 35676:k="Matrix4fv"}c(h,".uniform",k,"(",m,",");if("M"===k.charAt(0)){var m=Math.pow(p-35674+2,2),t=a.global.def("new Float32Array(",m,")");Array.isArray(r)?c("false,(",J(m,function(a){return t+"["+a+"]="+r[a]}),
  ",",t,")"):c("false,(Array.isArray(",r,")||",r," instanceof Float32Array)?",r,":(",J(m,function(a){return t+"["+a+"]="+r+"["+a+"]"}),",",t,")")}else 1<n?c(J(n,function(a){return Array.isArray(r)?r[a]:r+"["+a+"]"})):c(r);c(");")}}function aa(a,b,c,d){function e(f){var g=m[f];return g?g.contextDep&&d.contextDynamic||g.propDep?g.append(a,c):g.append(a,b):b.def(l,".",f)}function f(){function a(){c(w,".drawElementsInstancedANGLE(",[p,q,u,r+"<<(("+u+"-5121)>>1)",t],");")}function b(){c(w,".drawArraysInstancedANGLE(",
  [p,r,q,t],");")}n?B?a():(c("if(",n,"){"),a(),c("}else{"),b(),c("}")):b()}function g(){function a(){c(k+".drawElements("+[p,q,u,r+"<<(("+u+"-5121)>>1)"]+");")}function b(){c(k+".drawArrays("+[p,r,q]+");")}n?B?a():(c("if(",n,"){"),a(),c("}else{"),b(),c("}")):b()}var h=a.shared,k=h.gl,l=h.draw,m=d.draw,n=function(){var e=m.elements,f=b;if(e){if(e.contextDep&&d.contextDynamic||e.propDep)f=c;e=e.append(a,f)}else e=f.def(l,".","elements");e&&f("if("+e+")"+k+".bindBuffer(34963,"+e+".buffer.buffer);");return e}(),
  p=e("primitive"),r=e("offset"),q=function(){var e=m.count,f=b;if(e){if(e.contextDep&&d.contextDynamic||e.propDep)f=c;e=e.append(a,f)}else e=f.def(l,".","count");return e}();if("number"===typeof q){if(0===q)return}else c("if(",q,"){"),c.exit("}");var t,w;oa&&(t=e("instances"),w=a.instancing);var u=n+".type",B=m.elements&&sa(m.elements);oa&&("number"!==typeof t||0<=t)?"string"===typeof t?(c("if(",t,">0){"),f(),c("}else if(",t,"<0){"),g(),c("}")):f():g()}function X(a,b,c,d,e){b=m();e=b.proc("body",e);
  oa&&(b.instancing=e.def(b.shared.extensions,".angle_instanced_arrays"));a(b,e,c,d);return b.compile().body}function fa(a,b,c,d){C(a,b);c.useVAO?c.drawVAO?b(a.shared.vao,".setVAO(",c.drawVAO.append(a,b),");"):b(a.shared.vao,".setVAO(",a.shared.vao,".targetVAO);"):(b(a.shared.vao,".setVAO(null);"),U(a,b,c,d.attributes,function(){return!0}));ta(a,b,c,d.uniforms,function(){return!0});aa(a,b,b,c)}function Da(a,b){var c=a.proc("draw",1);C(a,c);V(a,c,b.context);R(a,c,b.framebuffer);T(a,c,b);N(a,c,b.state);
  Q(a,c,b,!1,!0);var d=b.shader.progVar.append(a,c);c(a.shared.gl,".useProgram(",d,".program);");if(b.shader.program)fa(a,c,b,b.shader.program);else{c(a.shared.vao,".setVAO(null);");var e=a.global.def("{}"),f=c.def(d,".id"),g=c.def(e,"[",f,"]");c(a.cond(g).then(g,".call(this,a0);")["else"](g,"=",e,"[",f,"]=",a.link(function(c){return X(fa,a,b,c,1)}),"(",d,");",g,".call(this,a0);"))}0<Object.keys(b.state).length&&c(a.shared.current,".dirty=true;")}function ua(a,b,c,d){function e(){return!0}a.batchId=
  "a1";C(a,b);U(a,b,c,d.attributes,e);ta(a,b,c,d.uniforms,e);aa(a,b,b,c)}function P(a,b,c,d){function e(a){return a.contextDep&&g||a.propDep}function f(a){return!e(a)}C(a,b);var g=c.contextDep,h=b.def(),k=b.def();a.shared.props=k;a.batchId=h;var l=a.scope(),m=a.scope();b(l.entry,"for(",h,"=0;",h,"<","a1",";++",h,"){",k,"=","a0","[",h,"];",m,"}",l.exit);c.needsContext&&V(a,m,c.context);c.needsFramebuffer&&R(a,m,c.framebuffer);N(a,m,c.state,e);c.profile&&e(c.profile)&&Q(a,m,c,!1,!0);d?(c.useVAO?c.drawVAO?
  e(c.drawVAO)?m(a.shared.vao,".setVAO(",c.drawVAO.append(a,m),");"):l(a.shared.vao,".setVAO(",c.drawVAO.append(a,l),");"):l(a.shared.vao,".setVAO(",a.shared.vao,".targetVAO);"):(l(a.shared.vao,".setVAO(null);"),U(a,l,c,d.attributes,f),U(a,m,c,d.attributes,e)),ta(a,l,c,d.uniforms,f),ta(a,m,c,d.uniforms,e),aa(a,l,m,c)):(b=a.global.def("{}"),d=c.shader.progVar.append(a,m),k=m.def(d,".id"),l=m.def(b,"[",k,"]"),m(a.shared.gl,".useProgram(",d,".program);","if(!",l,"){",l,"=",b,"[",k,"]=",a.link(function(b){return X(ua,
  a,c,b,2)}),"(",d,");}",l,".call(this,a0[",h,"],",h,");"))}function da(a,b){function c(a){return a.contextDep&&e||a.propDep}var d=a.proc("batch",2);a.batchId="0";C(a,d);var e=!1,f=!0;Object.keys(b.context).forEach(function(a){e=e||b.context[a].propDep});e||(V(a,d,b.context),f=!1);var g=b.framebuffer,h=!1;g?(g.propDep?e=h=!0:g.contextDep&&e&&(h=!0),h||R(a,d,g)):R(a,d,null);b.state.viewport&&b.state.viewport.propDep&&(e=!0);T(a,d,b);N(a,d,b.state,function(a){return!c(a)});b.profile&&c(b.profile)||Q(a,
  d,b,!1,"a1");b.contextDep=e;b.needsContext=f;b.needsFramebuffer=h;f=b.shader.progVar;if(f.contextDep&&e||f.propDep)P(a,d,b,null);else if(f=f.append(a,d),d(a.shared.gl,".useProgram(",f,".program);"),b.shader.program)P(a,d,b,b.shader.program);else{d(a.shared.vao,".setVAO(null);");var g=a.global.def("{}"),h=d.def(f,".id"),k=d.def(g,"[",h,"]");d(a.cond(k).then(k,".call(this,a0,a1);")["else"](k,"=",g,"[",h,"]=",a.link(function(c){return X(P,a,b,c,2)}),"(",f,");",k,".call(this,a0,a1);"))}0<Object.keys(b.state).length&&
  d(a.shared.current,".dirty=true;")}function ea(a,c){function d(b){var g=c.shader[b];g&&e.set(f.shader,"."+b,g.append(a,e))}var e=a.proc("scope",3);a.batchId="a2";var f=a.shared,g=f.current;V(a,e,c.context);c.framebuffer&&c.framebuffer.append(a,e);zb(Object.keys(c.state)).forEach(function(b){var d=c.state[b].append(a,e);ma(d)?d.forEach(function(c,d){e.set(a.next[b],"["+d+"]",c)}):e.set(f.next,"."+b,d)});Q(a,e,c,!0,!0);["elements","offset","count","instances","primitive"].forEach(function(b){var d=
  c.draw[b];d&&e.set(f.draw,"."+b,""+d.append(a,e))});Object.keys(c.uniforms).forEach(function(d){var g=c.uniforms[d].append(a,e);Array.isArray(g)&&(g="["+g.join()+"]");e.set(f.uniforms,"["+b.id(d)+"]",g)});Object.keys(c.attributes).forEach(function(b){var d=c.attributes[b].append(a,e),f=a.scopeAttrib(b);Object.keys(new ga).forEach(function(a){e.set(f,"."+a,d[a])})});c.scopeVAO&&e.set(f.vao,".targetVAO",c.scopeVAO.append(a,e));d("vert");d("frag");0<Object.keys(c.state).length&&(e(g,".dirty=true;"),
  e.exit(g,".dirty=true;"));e("a1(",a.shared.context,",a0,",a.batchId,");")}function ha(a){if("object"===typeof a&&!ma(a)){for(var b=Object.keys(a),c=0;c<b.length;++c)if(Y.isDynamic(a[b[c]]))return!0;return!1}}function ia(a,b,c){function d(a,b){g.forEach(function(c){var d=e[c];Y.isDynamic(d)&&(d=a.invoke(b,d),b(m,".",c,"=",d,";"))})}var e=b["static"][c];if(e&&ha(e)){var f=a.global,g=Object.keys(e),h=!1,k=!1,l=!1,m=a.global.def("{}");g.forEach(function(b){var c=e[b];if(Y.isDynamic(c))"function"===typeof c&&
  (c=e[b]=Y.unbox(c)),b=L(c,null),h=h||b.thisDep,l=l||b.propDep,k=k||b.contextDep;else{f(m,".",b,"=");switch(typeof c){case "number":f(c);break;case "string":f('"',c,'"');break;case "object":Array.isArray(c)&&f("[",c.join(),"]");break;default:f(a.link(c))}f(";")}});b.dynamic[c]=new Y.DynamicVariable(4,{thisDep:h,contextDep:k,propDep:l,ref:m,append:d});delete b["static"][c]}}var ga=t.Record,W={add:32774,subtract:32778,"reverse subtract":32779};c.ext_blend_minmax&&(W.min=32775,W.max=32776);var oa=c.angle_instanced_arrays,
  Ka=c.webgl_draw_buffers,pa={dirty:!0,profile:h.profile},Ca={},La=[],qa={},ra={};q("dither",3024);q("blend.enable",3042);r("blend.color","blendColor",[0,0,0,0]);r("blend.equation","blendEquationSeparate",[32774,32774]);r("blend.func","blendFuncSeparate",[1,0,1,0]);q("depth.enable",2929,!0);r("depth.func","depthFunc",513);r("depth.range","depthRange",[0,1]);r("depth.mask","depthMask",!0);r("colorMask","colorMask",[!0,!0,!0,!0]);q("cull.enable",2884);r("cull.face","cullFace",1029);r("frontFace","frontFace",
  2305);r("lineWidth","lineWidth",1);q("polygonOffset.enable",32823);r("polygonOffset.offset","polygonOffset",[0,0]);q("sample.alpha",32926);q("sample.enable",32928);r("sample.coverage","sampleCoverage",[1,!1]);q("stencil.enable",2960);r("stencil.mask","stencilMask",-1);r("stencil.func","stencilFunc",[519,0,-1]);r("stencil.opFront","stencilOpSeparate",[1028,7680,7680,7680]);r("stencil.opBack","stencilOpSeparate",[1029,7680,7680,7680]);q("scissor.enable",3089);r("scissor.box","scissor",[0,0,a.drawingBufferWidth,
  a.drawingBufferHeight]);r("viewport","viewport",[0,0,a.drawingBufferWidth,a.drawingBufferHeight]);var ub={gl:a,context:B,strings:b,next:Ca,current:pa,draw:k,elements:d,buffer:f,shader:w,attributes:t.state,vao:t,uniforms:u,framebuffer:n,extensions:c,timer:l,isBufferArgs:Qa},Na={primTypes:Ta,compareFuncs:ab,blendFuncs:Ea,blendEquations:W,stencilOps:Ra,glTypes:Ia,orientationType:Ab};Ka&&(Na.backBuffer=[1029],Na.drawBuffer=J(e.maxDrawbuffers,function(a){return 0===a?[0]:J(a,function(a){return 36064+a})}));
  var na=0;return{next:Ca,current:pa,procs:function(){var a=m(),b=a.proc("poll"),d=a.proc("refresh"),f=a.block();b(f);d(f);var g=a.shared,h=g.gl,k=g.next,l=g.current;f(l,".dirty=false;");R(a,b);R(a,d,null,!0);var n;oa&&(n=a.link(oa));c.oes_vertex_array_object&&d(a.link(c.oes_vertex_array_object),".bindVertexArrayOES(null);");for(var p=0;p<e.maxAttributes;++p){var q=d.def(g.attributes,"[",p,"]"),r=a.cond(q,".buffer");r.then(h,".enableVertexAttribArray(",p,");",h,".bindBuffer(",34962,",",q,".buffer.buffer);",
  h,".vertexAttribPointer(",p,",",q,".size,",q,".type,",q,".normalized,",q,".stride,",q,".offset);")["else"](h,".disableVertexAttribArray(",p,");",h,".vertexAttrib4f(",p,",",q,".x,",q,".y,",q,".z,",q,".w);",q,".buffer=null;");d(r);oa&&d(n,".vertexAttribDivisorANGLE(",p,",",q,".divisor);")}d(a.shared.vao,".currentVAO=null;",a.shared.vao,".setVAO(",a.shared.vao,".targetVAO);");Object.keys(qa).forEach(function(c){var e=qa[c],g=f.def(k,".",c),m=a.block();m("if(",g,"){",h,".enable(",e,")}else{",h,".disable(",
  e,")}",l,".",c,"=",g,";");d(m);b("if(",g,"!==",l,".",c,"){",m,"}")});Object.keys(ra).forEach(function(c){var e=ra[c],g=pa[c],m,n,p=a.block();p(h,".",e,"(");ma(g)?(e=g.length,m=a.global.def(k,".",c),n=a.global.def(l,".",c),p(J(e,function(a){return m+"["+a+"]"}),");",J(e,function(a){return n+"["+a+"]="+m+"["+a+"];"}).join("")),b("if(",J(e,function(a){return m+"["+a+"]!=="+n+"["+a+"]"}).join("||"),"){",p,"}")):(m=f.def(k,".",c),n=f.def(l,".",c),p(m,");",l,".",c,"=",m,";"),b("if(",m,"!==",n,"){",p,"}"));
  d(p)});return a.compile()}(),compile:function(a,b,c,d,e){var f=m();f.stats=f.link(e);Object.keys(b["static"]).forEach(function(a){ia(f,b,a)});Xb.forEach(function(b){ia(f,a,b)});var g=la(a,b,c,d,f);Da(f,g);ea(f,g);da(f,g);return A(f.compile(),{destroy:function(){g.shader.program.destroy()}})}}}function Cb(a,b){for(var c=0;c<a.length;++c)if(a[c]===b)return c;return-1}var A=function(a,b){for(var c=Object.keys(b),e=0;e<c.length;++e)a[c[e]]=b[c[e]];return a},Eb=0,Y={DynamicVariable:U,define:function(a,
  b){return new U(a,cb(b+""))},isDynamic:function(a){return"function"===typeof a&&!a._reglType||a instanceof U},unbox:db,accessor:cb},bb={next:"function"===typeof requestAnimationFrame?function(a){return requestAnimationFrame(a)}:function(a){return setTimeout(a,16)},cancel:"function"===typeof cancelAnimationFrame?function(a){return cancelAnimationFrame(a)}:clearTimeout},Db="undefined"!==typeof performance&&performance.now?function(){return performance.now()}:function(){return+new Date},E=hb();E.zero=
  hb();var Yb=function(a,b){var c=1;b.ext_texture_filter_anisotropic&&(c=a.getParameter(34047));var e=1,f=1;b.webgl_draw_buffers&&(e=a.getParameter(34852),f=a.getParameter(36063));var d=!!b.oes_texture_float;if(d){d=a.createTexture();a.bindTexture(3553,d);a.texImage2D(3553,0,6408,1,1,0,6408,5126,null);var p=a.createFramebuffer();a.bindFramebuffer(36160,p);a.framebufferTexture2D(36160,36064,3553,d,0);a.bindTexture(3553,null);if(36053!==a.checkFramebufferStatus(36160))d=!1;else{a.viewport(0,0,1,1);a.clearColor(1,
  0,0,1);a.clear(16384);var n=E.allocType(5126,4);a.readPixels(0,0,1,1,6408,5126,n);a.getError()?d=!1:(a.deleteFramebuffer(p),a.deleteTexture(d),d=1===n[0]);E.freeType(n)}}n=!0;"undefined"!==typeof navigator&&(/MSIE/.test(navigator.userAgent)||/Trident\//.test(navigator.appVersion)||/Edge/.test(navigator.userAgent))||(n=a.createTexture(),p=E.allocType(5121,36),a.activeTexture(33984),a.bindTexture(34067,n),a.texImage2D(34069,0,6408,3,3,0,6408,5121,p),E.freeType(p),a.bindTexture(34067,null),a.deleteTexture(n),
  n=!a.getError());return{colorBits:[a.getParameter(3410),a.getParameter(3411),a.getParameter(3412),a.getParameter(3413)],depthBits:a.getParameter(3414),stencilBits:a.getParameter(3415),subpixelBits:a.getParameter(3408),extensions:Object.keys(b).filter(function(a){return!!b[a]}),maxAnisotropic:c,maxDrawbuffers:e,maxColorAttachments:f,pointSizeDims:a.getParameter(33901),lineWidthDims:a.getParameter(33902),maxViewportDims:a.getParameter(3386),maxCombinedTextureUnits:a.getParameter(35661),maxCubeMapSize:a.getParameter(34076),
  maxRenderbufferSize:a.getParameter(34024),maxTextureUnits:a.getParameter(34930),maxTextureSize:a.getParameter(3379),maxAttributes:a.getParameter(34921),maxVertexUniforms:a.getParameter(36347),maxVertexTextureUnits:a.getParameter(35660),maxVaryingVectors:a.getParameter(36348),maxFragmentUniforms:a.getParameter(36349),glsl:a.getParameter(35724),renderer:a.getParameter(7937),vendor:a.getParameter(7936),version:a.getParameter(7938),readFloat:d,npotTextureCube:n}},M=function(a){return a instanceof Uint8Array||
  a instanceof Uint16Array||a instanceof Uint32Array||a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array||a instanceof Float32Array||a instanceof Float64Array||a instanceof Uint8ClampedArray},S=function(a){return Object.keys(a).map(function(b){return a[b]})},Oa={shape:function(a){for(var b=[];a.length;a=a[0])b.push(a.length);return b},flatten:function(a,b,c,e){var f=1;if(b.length)for(var d=0;d<b.length;++d)f*=b[d];else f=0;c=e||E.allocType(c,f);switch(b.length){case 0:break;case 1:e=
  b[0];for(b=0;b<e;++b)c[b]=a[b];break;case 2:e=b[0];b=b[1];for(d=f=0;d<e;++d)for(var p=a[d],n=0;n<b;++n)c[f++]=p[n];break;case 3:ib(a,b[0],b[1],b[2],c,0);break;default:jb(a,b,0,c,0)}return c}},Ga={"[object Int8Array]":5120,"[object Int16Array]":5122,"[object Int32Array]":5124,"[object Uint8Array]":5121,"[object Uint8ClampedArray]":5121,"[object Uint16Array]":5123,"[object Uint32Array]":5125,"[object Float32Array]":5126,"[object Float64Array]":5121,"[object ArrayBuffer]":5121},Ia={int8:5120,int16:5122,
  int32:5124,uint8:5121,uint16:5123,uint32:5125,"float":5126,float32:5126},ob={dynamic:35048,stream:35040,"static":35044},Sa=Oa.flatten,mb=Oa.shape,ha=[];ha[5120]=1;ha[5122]=2;ha[5124]=4;ha[5121]=1;ha[5123]=2;ha[5125]=4;ha[5126]=4;var Ta={points:0,point:0,lines:1,line:1,triangles:4,triangle:4,"line loop":2,"line strip":3,"triangle strip":5,"triangle fan":6},qb=new Float32Array(1),Mb=new Uint32Array(qb.buffer),Qb=[9984,9986,9985,9987],Ma=[0,6409,6410,6407,6408],Q={};Q[6409]=Q[6406]=Q[6402]=1;Q[34041]=
  Q[6410]=2;Q[6407]=Q[35904]=3;Q[6408]=Q[35906]=4;var Wa=na("HTMLCanvasElement"),Xa=na("OffscreenCanvas"),vb=na("CanvasRenderingContext2D"),wb=na("ImageBitmap"),xb=na("HTMLImageElement"),yb=na("HTMLVideoElement"),Nb=Object.keys(Ga).concat([Wa,Xa,vb,wb,xb,yb]),wa=[];wa[5121]=1;wa[5126]=4;wa[36193]=2;wa[5123]=2;wa[5125]=4;var F=[];F[32854]=2;F[32855]=2;F[36194]=2;F[34041]=4;F[33776]=.5;F[33777]=.5;F[33778]=1;F[33779]=1;F[35986]=.5;F[35987]=1;F[34798]=1;F[35840]=.5;F[35841]=.25;F[35842]=.5;F[35843]=.25;
  F[36196]=.5;var T=[];T[32854]=2;T[32855]=2;T[36194]=2;T[33189]=2;T[36168]=1;T[34041]=4;T[35907]=4;T[34836]=16;T[34842]=8;T[34843]=6;var Zb=function(a,b,c,e,f){function d(a){this.id=t++;this.refCount=1;this.renderbuffer=a;this.format=32854;this.height=this.width=0;f.profile&&(this.stats={size:0})}function p(b){var c=b.renderbuffer;a.bindRenderbuffer(36161,null);a.deleteRenderbuffer(c);b.renderbuffer=null;b.refCount=0;delete w[b.id];e.renderbufferCount--}var n={rgba4:32854,rgb565:36194,"rgb5 a1":32855,
  depth:33189,stencil:36168,"depth stencil":34041};b.ext_srgb&&(n.srgba=35907);b.ext_color_buffer_half_float&&(n.rgba16f=34842,n.rgb16f=34843);b.webgl_color_buffer_float&&(n.rgba32f=34836);var u=[];Object.keys(n).forEach(function(a){u[n[a]]=a});var t=0,w={};d.prototype.decRef=function(){0>=--this.refCount&&p(this)};f.profile&&(e.getTotalRenderbufferSize=function(){var a=0;Object.keys(w).forEach(function(b){a+=w[b].stats.size});return a});return{create:function(b,c){function l(b,c){var d=0,e=0,k=32854;
  "object"===typeof b&&b?("shape"in b?(e=b.shape,d=e[0]|0,e=e[1]|0):("radius"in b&&(d=e=b.radius|0),"width"in b&&(d=b.width|0),"height"in b&&(e=b.height|0)),"format"in b&&(k=n[b.format])):"number"===typeof b?(d=b|0,e="number"===typeof c?c|0:d):b||(d=e=1);if(d!==h.width||e!==h.height||k!==h.format)return l.width=h.width=d,l.height=h.height=e,h.format=k,a.bindRenderbuffer(36161,h.renderbuffer),a.renderbufferStorage(36161,k,d,e),f.profile&&(h.stats.size=T[h.format]*h.width*h.height),l.format=u[h.format],
  l}var h=new d(a.createRenderbuffer());w[h.id]=h;e.renderbufferCount++;l(b,c);l.resize=function(b,c){var d=b|0,e=c|0||d;if(d===h.width&&e===h.height)return l;l.width=h.width=d;l.height=h.height=e;a.bindRenderbuffer(36161,h.renderbuffer);a.renderbufferStorage(36161,h.format,d,e);f.profile&&(h.stats.size=T[h.format]*h.width*h.height);return l};l._reglType="renderbuffer";l._renderbuffer=h;f.profile&&(l.stats=h.stats);l.destroy=function(){h.decRef()};return l},clear:function(){S(w).forEach(p)},restore:function(){S(w).forEach(function(b){b.renderbuffer=
  a.createRenderbuffer();a.bindRenderbuffer(36161,b.renderbuffer);a.renderbufferStorage(36161,b.format,b.width,b.height)});a.bindRenderbuffer(36161,null)}}},Ya=[];Ya[6408]=4;Ya[6407]=3;var Pa=[];Pa[5121]=1;Pa[5126]=4;Pa[36193]=2;var Ba=["x","y","z","w"],Xb="blend.func blend.equation stencil.func stencil.opFront stencil.opBack sample.coverage viewport scissor.box polygonOffset.offset".split(" "),Ea={0:0,1:1,zero:0,one:1,"src color":768,"one minus src color":769,"src alpha":770,"one minus src alpha":771,
  "dst color":774,"one minus dst color":775,"dst alpha":772,"one minus dst alpha":773,"constant color":32769,"one minus constant color":32770,"constant alpha":32771,"one minus constant alpha":32772,"src alpha saturate":776},ab={never:512,less:513,"<":513,equal:514,"=":514,"==":514,"===":514,lequal:515,"<=":515,greater:516,">":516,notequal:517,"!=":517,"!==":517,gequal:518,">=":518,always:519},Ra={0:0,zero:0,keep:7680,replace:7681,increment:7682,decrement:7683,"increment wrap":34055,"decrement wrap":34056,
  invert:5386},Ab={cw:2304,ccw:2305},Bb=new K(!1,!1,!1,function(){}),$b=function(a,b){function c(){this.endQueryIndex=this.startQueryIndex=-1;this.sum=0;this.stats=null}function e(a,b,d){var e=p.pop()||new c;e.startQueryIndex=a;e.endQueryIndex=b;e.sum=0;e.stats=d;n.push(e)}if(!b.ext_disjoint_timer_query)return null;var f=[],d=[],p=[],n=[],u=[],t=[];return{beginQuery:function(a){var c=f.pop()||b.ext_disjoint_timer_query.createQueryEXT();b.ext_disjoint_timer_query.beginQueryEXT(35007,c);d.push(c);e(d.length-
  1,d.length,a)},endQuery:function(){b.ext_disjoint_timer_query.endQueryEXT(35007)},pushScopeStats:e,update:function(){var a,c;a=d.length;if(0!==a){t.length=Math.max(t.length,a+1);u.length=Math.max(u.length,a+1);u[0]=0;var e=t[0]=0;for(c=a=0;c<d.length;++c){var l=d[c];b.ext_disjoint_timer_query.getQueryObjectEXT(l,34919)?(e+=b.ext_disjoint_timer_query.getQueryObjectEXT(l,34918),f.push(l)):d[a++]=l;u[c+1]=e;t[c+1]=a}d.length=a;for(c=a=0;c<n.length;++c){var e=n[c],h=e.startQueryIndex,l=e.endQueryIndex;
  e.sum+=u[l]-u[h];h=t[h];l=t[l];l===h?(e.stats.gpuTime+=e.sum/1E6,p.push(e)):(e.startQueryIndex=h,e.endQueryIndex=l,n[a++]=e)}n.length=a}},getNumPendingQueries:function(){return d.length},clear:function(){f.push.apply(f,d);for(var a=0;a<f.length;a++)b.ext_disjoint_timer_query.deleteQueryEXT(f[a]);d.length=0;f.length=0},restore:function(){d.length=0;f.length=0}}};return function(a){function b(){if(0===C.length)z&&z.update(),aa=null;else{aa=bb.next(b);w();for(var a=C.length-1;0<=a;--a){var c=C[a];c&&
  c(G,null,0)}l.flush();z&&z.update()}}function c(){!aa&&0<C.length&&(aa=bb.next(b))}function e(){aa&&(bb.cancel(b),aa=null)}function f(a){a.preventDefault();e();S.forEach(function(a){a()})}function d(a){l.getError();g.restore();D.restore();O.restore();y.restore();L.restore();V.restore();J.restore();z&&z.restore();R.procs.refresh();c();T.forEach(function(a){a()})}function p(a){function b(a,c){var d={},e={};Object.keys(a).forEach(function(b){var f=a[b];if(Y.isDynamic(f))e[b]=Y.unbox(f,b);else{if(c&&
  Array.isArray(f))for(var g=0;g<f.length;++g)if(Y.isDynamic(f[g])){e[b]=Y.unbox(f,b);return}d[b]=f}});return{dynamic:e,"static":d}}function c(a){for(;n.length<a;)n.push(null);return n}var d=b(a.context||{},!0),e=b(a.uniforms||{},!0),f=b(a.attributes||{},!1);a=b(function(a){function b(a){if(a in c){var d=c[a];delete c[a];Object.keys(d).forEach(function(b){c[a+"."+b]=d[b]})}}var c=A({},a);delete c.uniforms;delete c.attributes;delete c.context;delete c.vao;"stencil"in c&&c.stencil.op&&(c.stencil.opBack=
  c.stencil.opFront=c.stencil.op,delete c.stencil.op);b("blend");b("depth");b("cull");b("stencil");b("polygonOffset");b("scissor");b("sample");"vao"in a&&(c.vao=a.vao);return c}(a),!1);var g={gpuTime:0,cpuTime:0,count:0},h=R.compile(a,f,e,d,g),k=h.draw,l=h.batch,m=h.scope,n=[];return A(function(a,b){var d;if("function"===typeof a)return m.call(this,null,a,0);if("function"===typeof b)if("number"===typeof a)for(d=0;d<a;++d)m.call(this,null,b,d);else if(Array.isArray(a))for(d=0;d<a.length;++d)m.call(this,
  a[d],b,d);else return m.call(this,a,b,0);else if("number"===typeof a){if(0<a)return l.call(this,c(a|0),a|0)}else if(Array.isArray(a)){if(a.length)return l.call(this,a,a.length)}else return k.call(this,a)},{stats:g,destroy:function(){h.destroy()}})}function n(a,b){var c=0;R.procs.poll();var d=b.color;d&&(l.clearColor(+d[0]||0,+d[1]||0,+d[2]||0,+d[3]||0),c|=16384);"depth"in b&&(l.clearDepth(+b.depth),c|=256);"stencil"in b&&(l.clearStencil(b.stencil|0),c|=1024);l.clear(c)}function u(a){C.push(a);c();
  return{cancel:function(){function b(){var a=Cb(C,b);C[a]=C[C.length-1];--C.length;0>=C.length&&e()}var c=Cb(C,a);C[c]=b}}}function t(){var a=Q.viewport,b=Q.scissor_box;a[0]=a[1]=b[0]=b[1]=0;G.viewportWidth=G.framebufferWidth=G.drawingBufferWidth=a[2]=b[2]=l.drawingBufferWidth;G.viewportHeight=G.framebufferHeight=G.drawingBufferHeight=a[3]=b[3]=l.drawingBufferHeight}function w(){G.tick+=1;G.time=v();t();R.procs.poll()}function k(){y.refresh();t();R.procs.refresh();z&&z.update()}function v(){return(Db()-
  E)/1E3}a=Ib(a);if(!a)return null;var l=a.gl,h=l.getContextAttributes();l.isContextLost();var g=Jb(l,a);if(!g)return null;var q=Fb(),r={vaoCount:0,bufferCount:0,elementsCount:0,framebufferCount:0,shaderCount:0,textureCount:0,cubeCount:0,renderbufferCount:0,maxTextureUnits:0},m=g.extensions,z=$b(l,m),E=Db(),F=l.drawingBufferWidth,K=l.drawingBufferHeight,G={tick:0,time:0,viewportWidth:F,viewportHeight:K,framebufferWidth:F,framebufferHeight:K,drawingBufferWidth:F,drawingBufferHeight:K,pixelRatio:a.pixelRatio},
  H=Yb(l,m),O=Kb(l,r,a,function(a){return J.destroyBuffer(a)}),J=Sb(l,m,H,r,O),M=Lb(l,m,O,r),D=Tb(l,q,r,a),y=Ob(l,m,H,function(){R.procs.poll()},G,r,a),L=Zb(l,m,H,r,a),V=Rb(l,m,H,y,L,r),R=Wb(l,q,m,H,O,M,y,V,{},J,D,{elements:null,primitive:4,count:-1,offset:0,instances:-1},G,z,a),q=Ub(l,V,R.procs.poll,G,h,m,H),Q=R.next,N=l.canvas,C=[],S=[],T=[],U=[a.onDestroy],aa=null;N&&(N.addEventListener("webglcontextlost",f,!1),N.addEventListener("webglcontextrestored",d,!1));var X=V.setFBO=p({framebuffer:Y.define.call(null,
  1,"framebuffer")});k();h=A(p,{clear:function(a){if("framebuffer"in a)if(a.framebuffer&&"framebufferCube"===a.framebuffer_reglType)for(var b=0;6>b;++b)X(A({framebuffer:a.framebuffer.faces[b]},a),n);else X(a,n);else n(null,a)},prop:Y.define.bind(null,1),context:Y.define.bind(null,2),"this":Y.define.bind(null,3),draw:p({}),buffer:function(a){return O.create(a,34962,!1,!1)},elements:function(a){return M.create(a,!1)},texture:y.create2D,cube:y.createCube,renderbuffer:L.create,framebuffer:V.create,framebufferCube:V.createCube,
  vao:J.createVAO,attributes:h,frame:u,on:function(a,b){var c;switch(a){case "frame":return u(b);case "lost":c=S;break;case "restore":c=T;break;case "destroy":c=U}c.push(b);return{cancel:function(){for(var a=0;a<c.length;++a)if(c[a]===b){c[a]=c[c.length-1];c.pop();break}}}},limits:H,hasExtension:function(a){return 0<=H.extensions.indexOf(a.toLowerCase())},read:q,destroy:function(){C.length=0;e();N&&(N.removeEventListener("webglcontextlost",f),N.removeEventListener("webglcontextrestored",d));D.clear();
  V.clear();L.clear();y.clear();M.clear();O.clear();J.clear();z&&z.clear();U.forEach(function(a){a()})},_gl:l,_refresh:k,poll:function(){w();z&&z.update()},now:v,stats:r});a.onDone(null,h);return h}});
  
  },{}],63:[function(require,module,exports){
  (function (global){(function (){
  module.exports =
    global.performance &&
    global.performance.now ? function now() {
      return performance.now()
    } : Date.now || function now() {
      return +new Date
    }
  
  }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{}],64:[function(require,module,exports){
  /*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
  module.exports = runParallel
  
  const queueMicrotask = require('queue-microtask')
  
  function runParallel (tasks, cb) {
    let results, pending, keys
    let isSync = true
  
    if (Array.isArray(tasks)) {
      results = []
      pending = tasks.length
    } else {
      keys = Object.keys(tasks)
      results = {}
      pending = keys.length
    }
  
    function done (err) {
      function end () {
        if (cb) cb(err, results)
        cb = null
      }
      if (isSync) queueMicrotask(end)
      else end()
    }
  
    function each (i, err, result) {
      results[i] = result
      if (--pending === 0 || err) {
        done(err)
      }
    }
  
    if (!pending) {
      // empty
      done(null)
    } else if (keys) {
      // object
      keys.forEach(function (key) {
        tasks[key](function (err, result) { each(key, err, result) })
      })
    } else {
      // array
      tasks.forEach(function (task, i) {
        task(function (err, result) { each(i, err, result) })
      })
    }
  
    isSync = false
  }
  
  },{"queue-microtask":54}],65:[function(require,module,exports){
  'use strict'
  
  var parseUnit = require('parse-unit')
  
  module.exports = toPX
  
  var PIXELS_PER_INCH = getSizeBrutal('in', document.body) // 96
  
  
  function getPropertyInPX(element, prop) {
    var parts = parseUnit(getComputedStyle(element).getPropertyValue(prop))
    return parts[0] * toPX(parts[1], element)
  }
  
  //This brutal hack is needed
  function getSizeBrutal(unit, element) {
    var testDIV = document.createElement('div')
    testDIV.style['height'] = '128' + unit
    element.appendChild(testDIV)
    var size = getPropertyInPX(testDIV, 'height') / 128
    element.removeChild(testDIV)
    return size
  }
  
  function toPX(str, element) {
    if (!str) return null
  
    element = element || document.body
    str = (str + '' || 'px').trim().toLowerCase()
    if(element === window || element === document) {
      element = document.body
    }
  
    switch(str) {
      case '%':  //Ambiguous, not sure if we should use width or height
        return element.clientHeight / 100.0
      case 'ch':
      case 'ex':
        return getSizeBrutal(str, element)
      case 'em':
        return getPropertyInPX(element, 'font-size')
      case 'rem':
        return getPropertyInPX(document.body, 'font-size')
      case 'vw':
        return window.innerWidth/100
      case 'vh':
        return window.innerHeight/100
      case 'vmin':
        return Math.min(window.innerWidth, window.innerHeight) / 100
      case 'vmax':
        return Math.max(window.innerWidth, window.innerHeight) / 100
      case 'in':
        return PIXELS_PER_INCH
      case 'cm':
        return PIXELS_PER_INCH / 2.54
      case 'mm':
        return PIXELS_PER_INCH / 25.4
      case 'pt':
        return PIXELS_PER_INCH / 72
      case 'pc':
        return PIXELS_PER_INCH / 6
      case 'px':
        return 1
    }
  
    // detect number of units
    var parts = parseUnit(str)
    if (!isNaN(parts[0]) && parts[1]) {
      var px = toPX(parts[1], element)
      return typeof px === 'number' ? parts[0] * px : null
    }
  
    return null
  }
  
  },{"parse-unit":45}],66:[function(require,module,exports){
  var getDistance = require('gl-vec2/distance')
  var EventEmitter = require('events').EventEmitter
  var dprop = require('dprop')
  var eventOffset = require('mouse-event-offset')
  
  module.exports = touchPinch
  function touchPinch (target) {
    target = target || window
  
    var emitter = new EventEmitter()
    var fingers = [ null, null ]
    var activeCount = 0
  
    var lastDistance = 0
    var ended = false
    var enabled = false
  
    // some read-only values
    Object.defineProperties(emitter, {
      pinching: dprop(function () {
        return activeCount === 2
      }),
  
      fingers: dprop(function () {
        return fingers
      })
    })
  
    enable()
    emitter.enable = enable
    emitter.disable = disable
    emitter.indexOfTouch = indexOfTouch
    return emitter
  
    function indexOfTouch (touch) {
      var id = touch.identifier
      for (var i = 0; i < fingers.length; i++) {
        if (fingers[i] &&
          fingers[i].touch &&
          fingers[i].touch.identifier === id) {
          return i
        }
      }
      return -1
    }
  
    function enable () {
      if (enabled) return
      enabled = true
      target.addEventListener('touchstart', onTouchStart, false)
      target.addEventListener('touchmove', onTouchMove, false)
      target.addEventListener('touchend', onTouchRemoved, false)
      target.addEventListener('touchcancel', onTouchRemoved, false)
    }
  
    function disable () {
      if (!enabled) return
      enabled = false
      activeCount = 0
      fingers[0] = null
      fingers[1] = null
      lastDistance = 0
      ended = false
      target.removeEventListener('touchstart', onTouchStart, false)
      target.removeEventListener('touchmove', onTouchMove, false)
      target.removeEventListener('touchend', onTouchRemoved, false)
      target.removeEventListener('touchcancel', onTouchRemoved, false)
    }
  
    function onTouchStart (ev) {
      for (var i = 0; i < ev.changedTouches.length; i++) {
        var newTouch = ev.changedTouches[i]
        var id = newTouch.identifier
        var idx = indexOfTouch(id)
  
        if (idx === -1 && activeCount < 2) {
          var first = activeCount === 0
  
          // newest and previous finger (previous may be undefined)
          var newIndex = fingers[0] ? 1 : 0
          var oldIndex = fingers[0] ? 0 : 1
          var newFinger = new Finger()
  
          // add to stack
          fingers[newIndex] = newFinger
          activeCount++
  
          // update touch event & position
          newFinger.touch = newTouch
          eventOffset(newTouch, target, newFinger.position)
  
          var oldTouch = fingers[oldIndex] ? fingers[oldIndex].touch : undefined
          emitter.emit('place', newTouch, oldTouch)
  
          if (!first) {
            var initialDistance = computeDistance()
            ended = false
            emitter.emit('start', initialDistance)
            lastDistance = initialDistance
          }
        }
      }
    }
  
    function onTouchMove (ev) {
      var changed = false
      for (var i = 0; i < ev.changedTouches.length; i++) {
        var movedTouch = ev.changedTouches[i]
        var idx = indexOfTouch(movedTouch)
        if (idx !== -1) {
          changed = true
          fingers[idx].touch = movedTouch // avoid caching touches
          eventOffset(movedTouch, target, fingers[idx].position)
        }
      }
  
      if (activeCount === 2 && changed) {
        var currentDistance = computeDistance()
        emitter.emit('change', currentDistance, lastDistance)
        lastDistance = currentDistance
      }
    }
  
    function onTouchRemoved (ev) {
      for (var i = 0; i < ev.changedTouches.length; i++) {
        var removed = ev.changedTouches[i]
        var idx = indexOfTouch(removed)
  
        if (idx !== -1) {
          fingers[idx] = null
          activeCount--
          var otherIdx = idx === 0 ? 1 : 0
          var otherTouch = fingers[otherIdx] ? fingers[otherIdx].touch : undefined
          emitter.emit('lift', removed, otherTouch)
        }
      }
  
      if (!ended && activeCount !== 2) {
        ended = true
        emitter.emit('end')
      }
    }
  
    function computeDistance () {
      if (activeCount < 2) return 0
      return getDistance(fingers[0].position, fingers[1].position)
    }
  }
  
  function Finger () {
    this.position = [0, 0]
    this.touch = null
  }
  
  },{"dprop":11,"events":1,"gl-vec2/distance":22,"mouse-event-offset":40}]},{},[3]);
  