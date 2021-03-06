
/**
 * Dependencies
 */

var previous = require('previous-sibling');
var template = require('./template.html');
var next = require('next-sibling');
var debounce = require('debounce');
var Pillbox = require('pillbox');
var classes = require('classes');
var Emitter = require('emitter');
var keyname = require('keyname');
var events = require('events');
var domify = require('domify');
var query = require('query');
var bind = require('bind');
var trim = require('trim');
var each = require('each');
var tpl = domify(template);

/**
 * [We clobber Pillbox#add to add a11y markup.]
 *
 * Add `tag`.
 *
 * @param {String} tag
 * @return {Pillbox} self
 * @api public
 */

Pillbox.prototype.add = function(tag) {
  var self = this;
  tag = trim(tag);

  // blank
  if ('' == tag) return;

  // exists
  if (this.tags.has(tag)) return;

  // lowercase
  if (this.options.lowercase) tag = tag.toLowerCase();

  // add it
  this.tags.add(tag);

  // list item
  var span = document.createElement('span');
  span.setAttribute('data', tag);
  span.appendChild(document.createTextNode(tag));
  span.onclick = function(e) {
    e.preventDefault();
    self.input.focus();
  };

  // delete link
  var del = document.createElement('a');
  del.appendChild(document.createTextNode('✕'));
  del.href = '#';
  del.setAttribute('role', 'button');
  del.setAttribute('title', 'remove ' + tag);
  del.onclick = bind(this, this.remove, tag);
  span.appendChild(del);

  this.el.insertBefore(span, this.input);
  this.emit('add', tag);

  return this;
};

/**
 * Export `Select`
 */

module.exports = Select;

/**
 * Initialize `Select`.
 *
 * @api public
 */

function Select(){
  if (!(this instanceof Select)) return new Select;
  this.el = tpl.cloneNode(true);
  this.classes = classes(this.el);
  this.opts = query('.select-options', this.el);
  this.dropdown = query('.select-dropdown', this.el);
  this.input = query('.select-input', this.el);
  this.inputEvents = events(this.input, this);
  this.docEvents = events(document, this);
  this.events = events(this.el, this);
  this._selected = [];
  this.options = {};
  this.bind();
}

/**
 * Mixins.
 */

Emitter(Select.prototype);

/**
 * Bind internal events.
 *
 * The dropdown is only entered
 * when "down" is pressed.
 *
 * @return {Select}
 * @api private
 */

Select.prototype.bind = function () {
  this.events.bind('click .select-box', 'focus');
  this.events.bind('mouseover .select-option');
  var onsearch = this.onsearch.bind(this);
  this.input.onkeyup = debounce(onsearch, 300);
  this.docEvents.bind('touchstart', 'blur');
  this.inputEvents.bind('focus', 'show');
  this.inputEvents.bind('keyup', 'enterList');
  this.events.bind('touchstart');
  this.inputEvents.bind('blur');
  this.events.bind('keydown');
  return this;
};

/**
 * Unbind internal events.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.unbind = function(){
  this.inputEvents.unbind();
  this.docEvents.unbind();
  this.events.unbind();
  return this;
};

/**
 * Set the select label.
 *
 * @param {String} label
 * @return {Select}
 * @api public
 */

Select.prototype.label = function(label){
  this._label = label;
  this.input.placeholder = label;
  return this;
};

/**
 * Allow multiple.
 *
 * Adds a listener that adds title attributes
 * and role="button" to pills' close ("x") links
 * when new pills are added.
 *
 * @param {String} label
 * @param {Object} opts
 * @return {Select}
 * @api public
 */

Select.prototype.multiple = function(label, opts){
  if (this._multiple) return;
  this._multiple = true;
  this.classes.remove('select-single');
  this.classes.add('select-multiple');
  this.box = new Pillbox(this.input, opts);
  this.box.events.unbind('keydown');
  this.box.on('remove', this.deselect.bind(this));
  return this;
};

/**
 * Add an option with `name` and `value`.
 *
 * @param {String|Object} name
 * @param {Mixed} value
 * @return {Select}
 * @api public
 */

Select.prototype.add = function(name, value){
  var opt = option.apply(null, arguments);
  opt.el.onmousedown = this.select.bind(this, name);
  this.opts.appendChild(opt.el);
  this.options[opt.name] = opt;
  this.emit('add', opt);
  return this;
};

/**
 * Remove an option with `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.remove = function(name){
  name = name.toLowerCase();
  var opt = this.get(name);
  this.emit('remove', opt);
  this.opts.removeChild(opt.el);

  // selected
  if (opt.selected) {
    this.deselect(opt.name);
  }

  delete this.options[name];

  return this;
};

/**
 * Remove all options.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.empty = function(){
  each(this.options, this.remove.bind(this));
  return this;
};

/**
 * Select `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.select = function(name){
  var opt = this.get(name);

  // state
  if (!this.classes.has('selected')) {
    this.classes.add('selected');
  }

  // select
  this.emit('select', opt);
  opt.selected = true;

  // hide
  opt.el.setAttribute('hidden', '');
  classes(opt.el).add('selected');

  // multiple
  if (this._multiple) {
    this.box.add(opt.label);
    this._selected.push(opt);
    this.input.value = '';
    this.dehighlight();
    this.change();
    this.hide();
    return this;
  }

  // single
  var prev = this._selected[0];
  if (prev) this.deselect(prev.name);
  this._selected = [opt];
  this.input.value = opt.label;
  this.hide();
  this.change();
  return this;
};

/**
 * Deselect `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.deselect = function(name){
  var opt = this.get(name);

  // deselect
  this.emit('deselect', opt);
  opt.selected = false;
  this.announce(name + ' removed');

  // show
  opt.el.removeAttribute('hidden');
  classes(opt.el).remove('selected');

  // multiple
  if (this._multiple) {
    this.box.remove(opt.label);
    var i = this._selected.indexOf(opt);
    if (!~i) return this;
    this._selected.splice(i, 1);
    this.change();
    return this;
  }

  // deselect
  this.classes.remove('selected');

  // single
  this.label(this._label);
  this._selected = [];
  this.change();
  return this;
};

/**
 * Get an option `name` or dropdown.
 *
 * @param {String} name
 * @return {Element}
 * @api public
 */

Select.prototype.get = function(name){
  if ('string' == typeof name) {
    name = name.toLowerCase();
    var opt = this.options[name];
    if (!opt) throw new Error('option "' + name + '" does not exist');
    return opt;
  }

  return { el: this.dropdown };
};

/**
 * Show options or `name`
 *
 * Prevents list options from being highlighted
 * by default. Triggers a polite announcement
 * regarding the number of options available.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.show = function (name) {
  var opt = this.get(name);

  // visible
  if (this.visible(name)) return this;

  // clear any currently selected/highlighted options
  var highlighted = query('.select-option.highlighted', this.opts);
  if (highlighted) {
    classes(highlighted).remove('highlighted');
  }

  this.announceList();

  // show
  opt.el.removeAttribute('hidden');

  // focus
  if (!this._multiple && !this._searchable) {
    this.el.focus();
  }

  // option
  if ('string' == typeof name) return this;

  // show
  this.emit('show');
  this.classes.add('open');

  return this;
};

/**
 * Hide options or `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.hide = function(name){
  var opt = this.get(name);
  opt.el.setAttribute('hidden', '');
  if ('string' == typeof name) return this;
  this.emit('hide');
  this.classes.remove('open');
  this.showAll();
  return this;
};

/**
 * On "down" press when the input is focused,
 * highlight the first available list option.
 *
 * @param {Event} e
 * @return {Select}
 * @api public
 */

Select.prototype.enterList = function (e) {
  if (keyname(e.which) == 'down' &&
      !e.altKey &&
      !query('.select-option.highlighted')) {

    var el = query('.select-option:not([hidden]):not(.selected)', this.opts);
    if (el) this.highlight(el);
  }
};

/**
 * Check if options or `name` is visible.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

Select.prototype.visible = function(name){
  return ! this.get(name).el.hasAttribute('hidden');
};

/**
 * Toggle show / hide with optional `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.toggle = function(name){
  if ('string' != typeof name) name = null;

  return this.visible(name)
    ? this.hide(name)
    : this.show(name);
};

/**
 * Disable `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.disable = function(name){
  var opt = this.get(name);
  opt.el.setAttribute('disabled', true);
  opt.disabled = true;
  return this;
};

/**
 * Enable `name`.
 *
 * @param {String} name
 * @return {Select}
 * @api public
 */

Select.prototype.enable = function(name){
  var opt = this.get(name);
  opt.el.removeAttribute('disabled');
  opt.disabled = false;
  return this;
};

/**
 * Set / get the selected options.
 *
 * @param {Array} opts
 * @return {Select}
 * @api public
 */

Select.prototype.selected = function(arr){
  if (1 == arguments.length) {
    arr.forEach(this.select, this);
    return this;
  }

  return this._selected;
};

/**
 * Get the values.
 *
 * @return {Array}
 * @api public
 */

Select.prototype.values = function(){
  return this._selected.map(function(opt){
    return opt.value;
  });
};

/**
 * Search `term`.
 *
 * Prevents the first match from being
 * automatically highlighted. Announces
 * the presence of available dropdown
 * options.
 *
 * @param {String} term
 * @return {Search}
 * @api public
 */

Select.prototype.search = function(term){
  var expr = term.toLowerCase();
  var opts = this.options;
  var self = this;
  var found = 0;

  // show
  if (!this.visible()) {
    this.show();
  }

  // custom search
  this.emit('search', term, opts);

  // abort
  if (this.hasListeners('search')) return this;

  // search
  each(opts, function(name, opt){
    if (opt.disabled) return;
    if (opt.selected) return;

    if (~name.indexOf(expr)) {
      self.show(name);
    } else {
      self.hide(opt.name);
    }
  });

  // all done
  return this.emit('found', found);
};

/**
 * Highlight the given `name`.
 *
 * Transfers the value of the highlighted option
 * into the input. Adds an id to the active option
 * for "aria-activedescendant" association.
 *
 * @param {String|Element} el
 * @return {Select}
 * @api private
 */

Select.prototype.highlight = function (el) {
  if ('string' == typeof el) el = this.get(el).el;
  this.dehighlight();
  classes(el).add('highlighted');
  el.id = 'typeselect-active';
  this.active = el;
  // set the input's value to
  // the name of the current option
  this.input.value = this.active.getAttribute('data-name');
  return this;
};

/**
 * De-highlight.
 *
 * Removes the id attribute from the element
 * to break aria-activedescendant association.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.dehighlight = function () {
  if (!this.active) return this;
  classes(this.active).remove('highlighted');
  this.active.removeAttribute('id');
  this.active = null;
  return this;
};

/**
 * Focus input.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.focus = function(){
  this.input.focus();
  return this;
};

/**
 * Blur input.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.blur = function(){
  this.input.blur();
  return this;
};

/**
 * Highlight next element.
 *
 * @api private
 */

Select.prototype.next = function(){
  if (!this.active) return;
  var el = next(this.active, ':not([hidden]):not(.selected)');
  el = el || query('.select-option:not([hidden])', this.opts);
  if (el) this.highlight(el);
};

/**
 * Highlight previous element.
 *
 * @api private
 */

Select.prototype.previous = function(){
  if (!this.active) return;
  var el = previous(this.active, ':not([hidden]):not(.selected)');
  el = el || query.all('.select-option:not([hidden])', this.el);
  if (el.length) el = el[el.length - 1];
  if (el.className) this.highlight(el);
};

/**
 * on-input
 *
 * @param {Event} e
 * @api private
 */

Select.prototype.onsearch = function(e){
  var key = keyname(e.which);

  // ignore
  if ('down' == key) return;
  if ('up' == key) return;
  if ('enter' == key) return;
  if ('left' == key) return;
  if ('right' == key) return;

  // search
  if (e.target.value) {
    this.search(e.target.value);
  } else {
    this.showAll();
  }
};

/**
 * on-keydown.
 *
 * Clears the highlighted option when backspace
 * and character-keys are pressed.
 *
 * @param {Event} e
 * @api private
 */

Select.prototype.onkeydown = function(e){
  var visible = this.visible();
  var box = this.box;

  // actions
  switch (keyname(e.which)) {
    case 'down':
      e.preventDefault();
      visible
        ? this.next()
        : this.show();
      break;
    case 'up':
      e.preventDefault();
      visible
        ? this.previous()
        : this.show();
      break;
    case 'esc':
      this.hide();
      this.input.value = '';
      break;
    case 'enter':
      if (!this.active || !visible) return;
      var name = this.active.getAttribute('data-name');
      this.select(name);
      this.announce(name + ' selected');
      break;
    case 'backspace':
      this.dehighlight();
      this.announceList();
      if (box) return box.onkeydown(e);
      var all = this._selected;
      var item = all[all.length - 1];
      if (!item) return;
      this.deselect(item.name);
      break;
    default:
      this.dehighlight();
  }
};

/**
 * on-mouseover
 *
 * @param {Event} e
 * @api private
 */

Select.prototype.onmouseover = function(e){
  var name = e.target.getAttribute('data-name');
  this.highlight(name);
};

/**
 * Emit change.
 *
 * @api private
 */

Select.prototype.change = function(){
  this.emit('change', this);
};

/**
 * on-blur.
 *
 * @param {Event} e
 * @api public
 */

Select.prototype.onblur = function(e){
  this.showAll();
  this.hide();

  if (this._multiple) {
    this.input.value = '';
  } else if (!this._selected.length) {
    this.input.value = '';
  }
};

/**
 * Show all options.
 *
 * @return {Select}
 * @api private
 */

Select.prototype.showAll = function(){
  var els = query.all('[hidden]:not(.selected)', this.opts);

  for (var i = 0; i < els.length; ++i) {
    els[i].removeAttribute('hidden');
  }

  return this;
};

/**
 * on-touchstart.
 *
 * @param {Event} e
 * @api public
 */

Select.prototype.ontouchstart = function(e){
  e.stopImmediatePropagation();
};

/**
 * Creates a liveregion for option announcements.
 *
 * @return {Select}
 * @api public
 */

Select.prototype.liveregion = function () {
  var log = document.createElement('div');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-atomic', 'true');
  log.setAttribute('aria-relevant', 'text');
  this.input.parentNode.appendChild(log);
  return this;
};

/**
 * Updates the content of the log to announce
 * the number of suggestions available.
 *
 * @api public
 */

Select.prototype.announceList = debounce(function () {
  var log = query('[role=log]');
  var availOpts = query.all('.select-option:not([hidden])', this.opts);
  if (log && availOpts.length) {
    log.innerHTML = availOpts.length + ' options available. Press down.';
  }
}, 1500);

/**
 * Politely announce a message in the live region.
 *
 * @param {String} msg
 * @api public
 */

Select.prototype.announce = function (msg) {
  if (typeof msg != 'string') return;
  var log = query('[role=log]');
  log.innerHTML = msg;
};

/**
 * Create an option.
 *
 * @param {String|Object} obj
 * @param {Mixed} value
 * @param {Element} el
 * @return {Object}
 * @api private
 */

function option(obj, value, el){
  if ('string' == typeof obj) {
    return option({
      value: value,
      name: obj,
      el: el
    });
  }

  // option
  obj.label = obj.name;
  obj.name = obj.name.toLowerCase();
  obj.value = obj.value == null
    ? obj.name
    : obj.value;

  // element
  if (!obj.el) {
    obj.el = document.createElement('li');
    obj.el.setAttribute('role', 'option');
    obj.el.textContent = obj.label;
  }

  // domify
  if ('string' == typeof obj.el) {
    obj.el = domify(obj.el);
  }

  // setup element
  obj.el.setAttribute('data-name', obj.name);
  classes(obj.el).add('select-option');
  classes(obj.el).add('show');

  // opt
  return obj;
}
