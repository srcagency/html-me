'use strict';

var numpad = require('numpad');

var html = module.exports = {

	// create node with API

	create: function( type, config ) {
		if (!type)
			return this._create('fragment');

		if (typeof type === 'object') {
			config = type;
			config.name = config.name || 'div';
			return this._create('tag', config);
		}

		return this._create(type, config);
	},

	// node(s) from HTML

	parse: notImplemented,
	parseString: notImplemented,
	parseFile: notImplemented,
	parseFileSync: notImplemented,

	// node(s) to HTML

	render: notImplemented,		// render one or more nodes to HTML
	getHtml: notImplemented,	// alias of render
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
		Array.prototype.forEach.call(childNodes, this.appendChild.bind(this, node));
	},

	prependChildren: function( node, childNodes ){
		Array.prototype.forEach.call(childNodes, this.prependChild.bind(this, node));
	},

	prependChild: notImplemented,
	appendChild: notImplemented,
	removeChild: notImplemented,

	// text (special type of children)

	text: function( node, value ){
		if (typeof value === 'undefined')
			return this.getText(node);
		else
			return this.setText(node, value);
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
			this.setAttribute(attributeNames[i], attributes[attributeNames[i]]);
	},

	// classes (special type of attribute)

	addClass: notImplemented,
	removeClass: notImplemented,

	// value (special type of attribute)

	value: function( node, value ){
		if (value === undefined)
			return this.getValue(node);
		else
			return this.setValue(node, value);
	},

	getValue: notImplemented,
	setValue: function( node, value ) {
		if (value instanceof Date) {
			var type = this.getAttribute(node, 'type');

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
			return this.getChecked(node);
		else
			return this.setChecked(node, value);
	},

	getChecked: notImplemented,
	setChecked: notImplemented,

	// querying

	findOne: notImplemented,
	findAll: notImplemented,
	selectorCompile: notImplemented,
	matches: notImplemented,
	is: function(){ return this.matches.call(this, arguments); },

	closest: function( node, selector, context ){
		for (var cNode = node;cNode && cNode !== context;cNode = this.parent(cNode)){
			if (this.matches(cNode, selector))
				return cNode;
		}
	},

	// helpers

	// determine whether nodes are traversable
	isNodes: function( nodes ){
		return Array.isArray(nodes);
	},

	nodeType: function( node ){ return this.typeOf(node); },
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

	escapeCharacters: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#039;',
	},

	escape: function( text ){
		var html = this;
		return text.replace(/[&<>"']/g, function( text ){
			return html.escapeCharacters[text];
		});
	},

	unescape: function( text ){
		for (var char in this.escapeCharacters)
			text = text.replace(this.escapeCharacters[char], char);

		return text;
	},

};

function notImplemented(){
	throw new Error('function not implemented in this version');
}

function attribute( node, attr, value ){
	if (value === undefined)
		return this.getAttribute(node, attr);
	else
		return this.setAttribute(node, attr, value);
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
