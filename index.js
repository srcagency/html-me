'use strict';

var htmlparser	= require('htmlparser2'),
	domUtils	= require('domutils'),
	Promise		= require('bluebird'),
	CSSselect	= require('CSSselect'),
	fs			= require('fs'),
	extend		= require('extend'),
	removeValue	= require('remove-value');

Promise.promisifyAll(fs);

var common = require('./common');

var html = module.exports = extend({}, common, {

	parse: function( stream, cb, options, parserOptions ) {
		var handler = new htmlparser.DomHandler(options),
			parser = new htmlparser.Parser(handler, parserOptions);

		stream.pipe(parser);
		stream.on('end', function(){
			cb(handler.dom);
		});
	},

	parseString: function( htmlString, options, parserOptions ) {
		var handler = new htmlparser.DomHandler(options),
			parser = new htmlparser.Parser(handler, parserOptions);

		parser.write(htmlString);
		parser.done();

		if (options) {
			if (options.single)
				return handler.dom[0];
			else if (options.multiple)
				return handler.dom;
		}

		return this.create('fragment', { children: handler.dom });
	},

	parseFile: function( file, options, parserOptions, cb ) {
		return fs.readFileAsync(file, 'utf8').then(function( markup ){
			return this.parseString(markup, options, parserOptions);
		}).nodeify(cb);
	},

	parseFileSync: function( file, options, parserOptions ) {
		return this.parseString(fs.readFileSync(file, 'utf8'), options, parserOptions);
	},

	getInner: function ( dom ) {
		return dom.children ? dom.children.map(this.getOuter, this).join('') : '';
	},

	getOuter: function( dom ) {
		if (dom.type === 'text')
			return dom.data;

		if (dom.render === false)
			return;

		if (dom.type === 'comment')
			return '<!--' + dom.data + '-->';

		if (dom.type === 'directive')
			return '<' + dom.data + '>';

		if (dom.type === 'cdata')
			return '<!CDATA ' + this.getInner(dom) + ']]>';

		if (dom.type === 'fragment')
			return dom.children.length === 0 ? '' : this.getInner(dom);

		var ret = '<' + dom.name;
		if (dom.attribs) {
			for (var attr in dom.attribs) {
				if (dom.attribs.hasOwnProperty(attr)) {
					ret += ' ' + attr;
					var value = dom.attribs[attr];
					if (value === null) {
						if (!booleanAttribs[attr])
							ret += '=""';
					} else {
						ret += '="' + this.escape(value) + '"';
					}
				}
			}
		}

		if (this.emptyTags[dom.name] && dom.children.length === 0)
			return ret + ' />';
		else
			return ret + '>' + this.getInner(dom) + '</' + dom.name + '>';
	},

	getAttribute: function ( node, attr ) {
		return node.attribs && node.attribs[attr] || null;
	},

	setAttribute: function ( node, attr, value ) {
		if (!node.attribs)
			node.attribs = {};

		if (!value && this.booleanAttribs[attr])
			return this.removeAttribute(node, attr);

		return node.attribs[attr] = value;
	},

	removeAttribute: function ( node, attr ) {
		return !node.attribs || delete node.attribs[attr];
	},

	getValue: function( node ) {
		return this.getAttribute(node, 'value');
	},

	_setValue: function( node, value ) {
		return this.setAttribute(node, 'value', value);
	},

	getChecked: function( node ){
		return this.getAttribute(node, 'checked');
	},

	setChecked: function( node, value ){
		return this.getAttribute(node, 'checked', !!value);
	},

	getText: function( node ) {
		if (node.type === 'text')
			return this.unescape(node.data);
		else if (node.children)
			return node.children.map(this.getText, this).join('');
		else
			return '';
	},

	setText: function( node, text ) {
		if (node.type === 'text')
			node.data = this.escape(text);
		else if (node.children && node.children.length)
			node.children.forEach(function( node ){ this.setText(node, text); }, this);
		else
			node.children = [ this.create('text', { data: this.escape(text) }) ];

		return text;
	},

	splice: function( nodes, index, howMany, newNodes ) {
		if (index >= nodes.length)
			throw 'Index greater than or equal to length';

		var before, after,
			parent = nodes[0] && nodes[0].parent || null;

		if (!Array.isArray(newNodes))
			newNodes = newNodes ? [ newNodes ] : [];

		// insert patch into children array
		Array.prototype.splice.apply(nodes, [ index, howMany ].concat(newNodes));

		// update ``parent``, ``prev`` and ``next`` of bounding nodes and nodes in patch
		for (var i = index, len = newNodes.length+i;i < len;i++) {
			nodes[i].parent = parent;
			nodes[i].prev = nodes[i-1] || null;
			nodes[i].next = nodes[i+1] || null;
		}

		// set ``next`` of the first child before patch
		if ((before = nodes[index-1]))
			before.next = newNodes[0] || nodes[index] || null;

		// set ``prev`` of first child after patch
		if ((after = nodes[index+newNodes.length]))
			after.prev = newNodes[newNodes.length-1] || null;
	},

	firstChild: function( node ) {
		return node.children[0];
	},

	lastChild: function( node ) {
		return node.children[node.children.length - 1];
	},

	parent: function( node ){
		return node.parent;
	},

	replace: domUtils.replaceElement,
	append: domUtils.append,
	appendChild: domUtils.appendChild,
	prepend: domUtils.prepend,
	remove: domUtils.remove,

	empty: function( node ) {
		node.children = [];

		if (node.type === 'text')
			node.data = '';
	},

	_create: function( type, config ) {
		if (!this.type[type]) {
			if (!config)
				config = { name: type };
			else
				config.name = type;

			type = this.type.tag;
		}

		return extend({
			type: type,
			attribs: {},
			children: [],
			next: null,
			prev: null,
			parent: null,
			data: {},
		}, config);
	},

	addEventListener: function( node, event, fn ) {
		if (!node.listeners) {
			node.listeners = {};
			node.listeners[event] = [ fn ];
		} else if (!node.listeners[event]) {
			node.listeners[event] = [ fn ];
		} else if (!~node.listeners[event].indexOf(fn)) {
			node.listeners[event].push(fn);
		}
	},

	removeEventListener: function( node, event, fn ) {
		if (node.listeners && node.listeners[event])
			removeValue(node.listeners[event], fn, 1);
	},

	findOne: CSSselect.selectOne,
	findAll: CSSselect.selectAll,
	selectorCompile: CSSselect.compile,
	matches: CSSselect.is,

	typeOf: function ( node ) {
		return node.type;
	},

	nameOf: function ( node ) {
		return node.name.toLowerCase();
	},

});
