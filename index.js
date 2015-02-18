'use strict';

var fs = require('fs');
var htmlparser = require('htmlparser2');
var domUtils = require('domutils');
var Promise = require('bluebird');
var CSSselect = require('CSSselect');
var assign = require('object-assign');

Promise.promisifyAll(fs);

var common = require('./common');

var html = module.exports = assign(common, {

	parse: function( stream, cb, options, parserOptions ){
		var handler = new htmlparser.DomHandler(options),
			parser = new htmlparser.Parser(handler, parserOptions);

		stream.pipe(parser);
		stream.on('end', function(){
			cb(handler.dom);
		});
	},

	parseString: function( htmlString, options, parserOptions ){
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

		return html.create('fragment', {
			children: handler.dom,
		});
	},

	parseFile: function( file, options, parserOptions, cb ){
		return fs.readFileAsync(file, 'utf8').then(function( markup ){
			return html.parseString(markup, options, parserOptions);
		})
			.nodeify(cb);
	},

	parseFileSync: function( file, options, parserOptions ){
		return html.parseString(fs.readFileSync(file, 'utf8'), options, parserOptions);
	},

	getInner: function( dom ){
		return dom.children ? dom.children.map(html.getOuter, html).join('') : '';
	},

	getOuter: function( dom ){
		if (dom.type === 'text')
			return dom.data;

		if (dom.render === false)
			return;

		if (dom.type === 'comment')
			return '<!--' + dom.data + '-->';

		if (dom.type === 'directive')
			return '<' + dom.data + '>';

		if (dom.type === 'cdata')
			return '<!CDATA ' + html.getInner(dom) + ']]>';

		if (dom.type === 'fragment')
			return dom.children.length === 0 ? '' : html.getInner(dom);

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
						ret += '="' + html.escape(value) + '"';
					}
				}
			}
		}

		if (html.emptyTags[dom.name] && dom.children.length === 0)
			return ret + ' />';
		else
			return ret + '>' + html.getInner(dom) + '</' + dom.name + '>';
	},

	getAttribute: function( node, attr ){
		return node.attribs && node.attribs[attr] || null;
	},

	setAttribute: function( node, attr, value ){
		if (!node.attribs)
			node.attribs = {};

		if (!value && html.booleanAttribs[attr])
			return html.removeAttribute(node, attr);

		return node.attribs[attr] = value;
	},

	removeAttribute: function( node, attr ){
		return !node.attribs || delete node.attribs[attr];
	},

	getValue: function( node ){
		return html.getAttribute(node, 'value');
	},

	_setValue: function( node, value ){
		return html.setAttribute(node, 'value', value);
	},

	setStyle: function( node, name, value ){
		if (typeof name === 'object' || value) {
			var style = parseStyle(html.getAttribute(node, 'style'));

			if (value)
				style[name] = value;
			else
				assign(style, name);

			html.setAttribute(node, 'style', renderStyle(style));

			return value || name;
		} else {
			return html.setAttribute('style', name);
		}
	},

	getStyle: function( node, name ){
		var style = parseStyle(html.getAttribute(node, 'style'));

		return name ? style[name] : style;
	},

	getChecked: function( node ){
		return html.getAttribute(node, 'checked');
	},

	setChecked: function( node, value ){
		return html.getAttribute(node, 'checked', !!value);
	},

	getText: function( node ){
		if (node.type === 'text')
			return html.unescape(node.data);
		else if (node.children)
			return node.children.map(html.getText, html).join('');
		else
			return '';
	},

	setText: function( node, text ){
		if (node.type === 'text')
			node.data = html.escape(text);
		else
			node.children = [ html.create('text', {
				data: html.escape(text),
			}) ];

		return text;
	},

	splice: function( nodes, index, howMany, newNodes ){
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

	firstChild: function( node ){
		return node.children[0];
	},

	lastChild: function( node ){
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

	empty: function( node ){
		node.children = [];

		if (node.type === 'text')
			node.data = '';
	},

	_create: function( type, config ){
		if (!html.type[type]) {
			if (!config)
				config = {
					name: type,
				};
			else
				config.name = type;

			type = html.type.tag;
		}

		return assign({
			type: type,
			attribs: {},
			children: [],
			next: null,
			prev: null,
			parent: null,
			data: {},
		}, config);
	},

	addEventListener: function( node, event, fn, selector ){
		// events are noop on the server
	},

	removeEventListener: function( node, event, fn ){
		// events are noop on the server
	},

	dispatchEvent: function( event ){
		// noop (preventDefault, stopPropagation)
	},

	findOne: CSSselect.selectOne,
	findAll: CSSselect.selectAll,
	selectorCompile: CSSselect.compile,
	matches: CSSselect.is,

	isNode: function( node ){
		return !!node.type;
	},

	typeOf: function( node ){
		return node.type;
	},

	nameOf: function( node ){
		return node.name.toLowerCase();
	},

});

function parseStyle( str ){
	if (!str)
		return {};

	var style = {};
	var pairs = str.split(';');
	var pair;

	for (var i = pairs.length - 1;i >= 0;i--) {
		pair = pairs[i].split(/[\s]*:[\s]*/);
		style[pair[0]] = pair[1];
	}

	return style;
}

function renderStyle( style ){
	var str = '';
	var properties = Object.keys(style);

	for (var i = properties.length - 1;i >= 0;i--)
		str += properties[i] + ':' + style[properties[i]] + ';';

	return str;
}
