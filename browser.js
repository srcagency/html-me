'use strict';

var extend = require('extend');

var common = require('./common');

var html = module.exports = extend({}, common, {

	_create: function( type, config ) {
		var node;

		if (type === 'text') {
			node = document.createTextNode(config && config.data);
		} else if (type === 'comment') {
			node = document.createComment(config && config.data);
		} else if (type === 'fragment') {
			node = document.createDocumentFragment();
		} else {
			node = document.createElement((config && config.name) || (type === 'tag' && 'div') || type);

			if (config && config.attribs) {
				for (var attr in config.attribs) {
					if (config.attribs.hasOwnProperty(attr))
						node.setAttribute(attr, config.attribs[attr]);
				}
			}
		}

		return node;
	},

	replace: function( node, replaceWith ) {
		if (!node.parentNode)
			return;

		node.parentNode.replaceChild(replaceWith, node);
	},

	children: function( node ) {
		return node.childNodes;
	},

	firstChild: function( node ) {
		return node.firstChild;
	},

	lastChild: function( node ) {
		return node.lastChild;
	},

	empty: function( node ) {
		if (node.textContent)
			node.textContent = null;

		for (var i = node.childNodes.length-1;i >= 0;i--)
			node.removeChild(node.childNodes[i]);
	},

	prependChild: function( node, childNode ) {
		var firstChild = html.firstChild(node);

		if (firstChild)
			return node.insertBefore(childNode, firstChild);

		return node.appendChild(node, childNode);
	},

	appendChild: function( node, childNode ) {
		return node.appendChild(childNode);
	},

	removeChild: function( node, childNode ) {
		return node.removeChild(childNode);
	},

	remove: function( node ){
		return node.parentNode && node.parentNode.removeChild(node);
	},

	getText: function( node ) {
		return node.textContent;
	},

	setText: function( node, text ) {
		return node.textContent = text;
	},

	getAttribute: function( node, attr ) {
		return node.getAttribute(attr);
	},

	setAttribute: function( node, attr, value ) {
		if (!value && this.booleanAttribs[attr])
			return this.removeAttribute(node, attr);
		else
			return node.setAttribute(attr, value);
	},

	removeAttribute: function( node, attr ) {
		return node.removeAttribute(attr);
	},

	addClass: function( node, className ) {
		if (html.isNodes(node))
			Array.prototype.forEach.call(node, function( node ){
				html.addClass(node, className);
			});
		else if (Array.isArray(className))
			className.forEach(function( className ){
				html.addClass(node, className);
			});
		else
			node.classList.add(className);
	},

	removeClass: function( node, className ) {
		if (html.isNodes(node))
			Array.prototype.forEach.call(node, function( node ){
				html.removeClass(node, className);
			});
		else if (Array.isArray(className))
			className.forEach(function( className ){
				html.removeClass(node, className);
			});
		else
			node.classList.remove(className);
	},

	setStyle: function( node, style, value ){
		if (typeof node === 'object')
			return this.setstyles(node, style);

		return node.style[style] = value;
	},

	setStyles: function( node, styles ){
		var keys = Object.keys(styles);
		for (var i = 0;i < keys.length;i++)
			node.style[keys[i]] = styles[keys[i]];
	},

	getValue: function( node ) {
		return node.value;
	},

	setValue: function( node, value ) {
		return node.value = value;
	},

	addEventListener: function( node, event, fn ) {
		if (html.isNodes(node)) {
			Array.prototype.forEach.call(node, function( node ){
				html.addEventListener(node, event, fn);
			});
		} else if (Array.isArray(event))
			event.forEach(function( event ){
				html.addEventListener(node, event, fn);
			});
		else
			node.addEventListener(event, fn);
	},

	parseString: function( htmlString, options ) {
		// fragments does not support innerHtml
		var host = html.create('tag', { name: 'div' });

		host.innerHTML = htmlString;

		if (options && options.single)
			return host.firstChild;

		var fragment = html.create('fragment');

		for (var i = 0;i < host.childNodes.length;i++)
			fragment.appendChild(host.childNodes[i]);

		return fragment;
	},

	findOne: function( query, nodes ) {
		if (!nodes)
			return document.querySelector(query);

		if (!html.isNodes(nodes))
			return nodes.querySelector(query);
		else
			return nodes.reduce(function( r, node ){ r.push(html.findOne(query, node)); }, []);
	},

	findAll: function( query, nodes ) {
		if (!nodes)
			return document.querySelectorAll(query);

		if (!html.isNodes(nodes))
			return nodes.querySelectorAll(query);
		else
			return nodes.reduce(function( r, node ){ Array.prototype.push.apply(r, html.findAll(query, node)); }, []);
	},

	isNodes: function( nodes ) {
		return Array.isArray(nodes) || nodes instanceof NodeList;
	},

});