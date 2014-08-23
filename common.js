'use strict';

var numpad = require('numpad');

var html = module.exports = {

	// create node with API

	create: function( type, config ){
		if (!type)
			return html._create('fragment');

		if (typeof type === 'object') {
			config = type;
			config.name = config.name || 'div';
			return html._create('tag', config);
		}

		return html._create(type, config);
	},

	// node(s) from HTML

	parse: notImplemented,
	parseString: notImplemented,
	parseFile: notImplemented,
	parseFileSync: notImplemented,

	// node(s) to HTML

	render: function( nodes ){
		if (!Array.isArray(nodes))
			nodes = [ nodes ];

		return nodes.map(html.getOuter, html).join('');
	},

	getHtml: function( nodes ){
		return html.render(nodes);
	},

	getInner: notImplemented,	// get inner HTML of a single node
	getOuter: notImplemented,	// get out HTML of a single node

	// relationship to parent

	parent: notImplemented,

	append: notImplemented,
	prepend: notImplemented,

	replace: notImplemented,
	remove: notImplemented,

	splice: notImplemented,

	// children

	children: notImplemented,

	firstChild: notImplemented,
	lastChild: notImplemented,

	empty: notImplemented,

	appendChildren: function( node, childNodes ){
		Array.prototype.forEach.call(childNodes, html.appendChild.bind(html, node));
	},

	prependChildren: function( node, childNodes ){
		Array.prototype.forEach.call(childNodes, html.prependChild.bind(html, node));
	},

	prependChild: notImplemented,
	appendChild: notImplemented,
	removeChild: notImplemented,

	// text (special type of children)

	text: function( node, value ){
		if (typeof value === 'undefined')
			return html.getText(node);
		else
			return html.setText(node, value);
	},

	getText: notImplemented,
	setText: notImplemented,

	// attributes

	attr: attribute,
	attribute: attribute,

	setAttribute: notImplemented,
	getAttribute: notImplemented,

	setAttributes: function( node, attributes ){
		var attributeNames = Object.keys(attributes);

		for (var i = attributeNames.length-1;i > -1;i--)
			html.setAttribute(attributeNames[i], attributes[attributeNames[i]]);
	},

	// classes (special type of attribute)

	addClass: notImplemented,
	removeClass: notImplemented,

	// value (special type of attribute)

	value: function( node, value ){
		if (value === undefined)
			return html.getValue(node);
		else
			return html.setValue(node, value);
	},

	getValue: notImplemented,
	setValue: function( node, value ){
		if (value instanceof Date) {
			var type = html.getAttribute(node, 'type');

			if (type === 'date')
				value = toHtmlDate(value);
			else if (type === 'time')
				value = toHtmlTime(value);
		}

		return node.value = value;
	},
	_setValue: notImplemented,

	// checked (special type of attribute)

	checked: function( node, value ){
		if (value === undefined)
			return html.getChecked(node);
		else
			return html.setChecked(node, value);
	},

	getChecked: notImplemented,
	setChecked: notImplemented,

	// style (special type of attribute)

	style: function( node, name, value ){
		if (!value && typeof name !== 'object')
			return html.getStyle(node, name);
		else
			return html.setStyle(node, name, value);
	},

	getStyle: notImplemented,
	setStyle: notImplemented,

	// events

	addEventListener: notImplemented,
	removeEventListener: notImplemented,

	// querying

	findOne: notImplemented,
	findAll: notImplemented,
	selectorCompile: notImplemented,
	matches: notImplemented,
	is: function(){ return html.matches.call(html, arguments); },

	closest: function( node, selector, context ){
		for (var cNode = node;cNode && cNode !== context;cNode = html.parent(cNode)){
			if (html.matches(cNode, selector))
				return cNode;
		}
	},

	// helpers

	// determine whether nodes are traversable
	isNodes: function( nodes ){
		return Array.isArray(nodes);
	},

	nodeType: function( node ){ return html.typeOf(node); },
	typeOf: notImplemented,
	nameOf: notImplemented,

	type: {
		text: 'text',
		comment: 'comment',
		directive: 'directive',
		cdata: 'cdata',
		fragment: 'fragment',
		tag: 'tag',
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
		selected: true,
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
		embed: true,
	},

	escapeCharacters: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#039;',
	},

	escape: function( text ){
		return text.replace(/[&<>"']/g, function( text ){
			return html.escapeCharacters[text];
		});
	},

	unescape: function( text ){
		for (var char in html.escapeCharacters)
			text = text.replace(html.escapeCharacters[char], char);

		return text;
	},

};

function notImplemented(){
	throw new Error('function not implemented in this version');
}

function attribute( node, attr, value ){
	if (value === undefined)
		return html.getAttribute(node, attr);
	else
		return html.setAttribute(node, attr, value);
}

function pad2( num ){
	return numpad(num, 2);
}

function toHtmlDate( date ){
	return [ date.getFullYear(), date.getMonth() + 1, date.getDate() ]
		.map(pad2)
		.join('-');
}

function toHtmlTime( date ){
	return [ date.getHours(), date.getMinutes() ]
		.map(pad2)
		.join(':');
}
