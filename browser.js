'use strict';

var extend = require('extend');

var common = require('./common');

var html = module.exports = extend(common, {

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

	getInner: function( node ){
		return node.innerHTML;
	},

	getOuter: function( node ){
		return node.outerHTML;
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

	parent: function( node ){
		return node.parentNode;
	},

	prependChild: function( node, childNode ) {
		var firstChild = html.firstChild(node);

		if (firstChild)
			return node.insertBefore(childNode, firstChild);

		return node.appendChild(childNode);
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
		if (!value && html.booleanAttribs[attr])
			return html.removeAttribute(node, attr);
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

	setStyle: function( node, name, value ){
		if (typeof name === 'object')
			return extend(node.style, name);
		else if (!value)
			return html.setAttribute('style', name);
		else
			return node.style[name] = value;
	},

	getStyle: function( node, name ){
		if (name)
			return node.style[name];
		else
			return node.style;
	},

	getValue: function( node ) {
		return node.value;
	},

	_setValue: function( node, value ) {
		return node.value = value;
	},

	getChecked: function( node ){
		return node.checked;
	},

	setChecked: function( node, value ){
		return node.checked = !!value;
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

	removeEventListener: function( node, event, fn ) {
		if (html.isNodes(node)) {
			Array.prototype.forEach.call(node, function( node ){
				html.removeEventListener(node, event, fn);
			});
		} else if (Array.isArray(event))
			event.forEach(function( event ){
				html.removeEventListener(node, event, fn);
			});
		else
			node.removeEventListener(event, fn);
	},

	parseString: function( htmlString, options ) {
		// fragments does not support innerHtml
		var host = html.create('tag', { name: 'div' });

		host.innerHTML = htmlString;

		if (options) {
			if (options.single)
				return host.firstChild;
			else if (options.multiple)
				return host.childNodes;
		}

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

	matches: function( node, selector ) {
		return (node.matches || node.matchesSelector || node.msMatchesSelector || node.mozMatchesSelector || node.webkitMatchesSelector || node.oMatchesSelector).call(node, selector);
	},

	isNodes: function( nodes ) {
		return Array.isArray(nodes) || nodes instanceof NodeList;
	},

	typeOf: function ( node ) {
		return nodeTypeMap[node.nodeType] || html.type.tag;
	},

	nameOf: function ( node ) {
		return node.nodeName.toLowerCase();
	},

});

var nodeTypeMap = {};

nodeTypeMap[document.TEXT_NODE] = common.type.text;
nodeTypeMap[document.COMMENT_NODE] = common.type.comment;
nodeTypeMap[document.DOCUMENT_TYPE_NODE] = common.type.directive;
nodeTypeMap[document.DOCUMENT_FRAGMENT_NODE] = common.type.fragment;
