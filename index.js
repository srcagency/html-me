'use strict';

var htmlparser	= require('htmlparser2'),
	domUtils	= require('domutils'),
	Promise		= require('bluebird'),
	CSSselect	= require('CSSselect'),
	fs			= require('fs'),
	extend		= require('extend');

Promise.promisifyAll(fs);

var html = module.exports = {

	types: {
		Text: 'text',
		Directive: 'directive',
		Comment: 'comment',
		CDATA: 'cdata',
		Tag: 'tag',
	},

	booleanAttribs: {
		async: true,
		autofocus: true,
		autoplay: true,
		checked: true,
		controls: true,
		defer: true,
		disabled: true,
		hidden: true,
		loop: true,
		multiple: true,
		open: true,
		readonly: true,
		required: true,
		scoped: true,
		selected: true
	},

	emptyTags: {
		area: true,
		base: true,
		basefont: true,
		br: true,
		col: true,
		frame: true,
		hr: true,
		img: true,
		input: true,
		isindex: true,
		link: true,
		meta: true,
		param: true,
		embed: true
	},

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

		return handler.dom;
	},

	parseFile: function( file, options, parserOptions, cb ) {
		return fs.readFileAsync(file, 'utf8').then(function( markup ){
			return html.parseString(markup, options, parserOptions);
		}).nodeify(cb);
	},

	parseFileSync: function( file, options, parserOptions ) {
		return html.parseString(fs.readFileSync(file, 'utf8'), options, parserOptions);
	},

	getHtml: function( nodes ) {
		return html.render(nodes);
	},

	render: function( nodes ) {
		if (!Array.isArray(nodes))
			nodes = [ nodes ];

		return nodes.map(html.getOuter).join('');
	},

	getInner: function ( dom ) {
		return dom.children ? dom.children.map(html.getOuter).join('') : '';
	},

	getOuter: function( dom ) {
		if (dom.type === 'text')
			return dom.data;

		if (dom.type === 'comment')
			return '<!--' + dom.data + '-->';

		if (dom.type === 'directive')
			return '<' + dom.data + '>';

		if (dom.type === 'cdata')
			return '<!CDATA ' + html.getInner(dom) + ']]>';

		if (dom.render === false)
			return;

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

	text: function( node, value ) {
		if (value === undefined)
			return html.getText(node);
		else
			return html.setText(node, value);
	},

	getText: function( node ) {
		if (node.type === 'text') {
			return node.data;
		} else if (Array.isArray(node.children)) {
			return node.children.map(getText).join('');
		} else {
			return '';
		}
	},

	setText: function( node, text ) {
		if (node.type === 'text') {
			node.data = html.escape(text);
		} else if (Array.isArray(node.children)) {
			node.children.forEach(function( node ){ html.setText(node, text); });
		}
		return node;
	},

	escapeCharacters: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#039;',
	},

	escape: function( text ) {
		return text.replace(/[&<>"']/g, function( text ){ return html.escapeCharacters[text]; });
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

	create: function( type, config ) {
		return extend({
			type: type,
			attribs: {},
			children: [],
			next: null,
			prev: null,
			parent: null,
			data: {},
			root: null
		}, config);
	},

	findOne: CSSselect.selectOne,
	findAll: CSSselect.selectAll,
	selectorCompile: CSSselect.compile,
	is: CSSselect.is,

};