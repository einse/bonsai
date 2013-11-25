define([
  './display_layer',
  './svg_layer',
  './dom_layer',
  './utils'
], function(DisplayLayer, SVGLayer, DOMLayer, utils) {
  'use strict';

  var createSVGElement = utils.createSVGElement;

  /**
   * A DisplayGroup is the renderer's DisplayObject container. A DisplayGroup
   * will contain layers, either SVG or DOM, which will contain the group's
   * children. A DisplayGroup can contain other DisplayGroups.
   * DisplayGroup is generally analogous to `bonsai.Group`
   */
  function DisplayGroup(displayGroup, id) {
    this.id = id;
    this.layers = [];
    this.isDisplayGroup = true;
    this.tx = 0;
    this.ty = 0;
    DisplayLayer.call(this, displayGroup);
    this.appendee = this.dom;
  }

  var proto = DisplayGroup.prototype = Object.create(DisplayLayer.prototype);

  proto._makeDOM = function() {
    var dom = document.createElement('div');
    dom.setAttribute('data-bs-type', 'displayGroup');
    dom.setAttribute('data-bs-id', this.id);
    dom.style.position = 'relative';
    return dom;
  };

  /** 
   * Creates a new layer for resources (containing a Defs element)
   * Also marks that layer as the resources layer with a `isResourcesSVG` flag
   */
  proto.getResourcesSVGLayer = function() {
    var defs = createSVGElement('defs');
    var svgLayer = this.getSVGLayer();
    svgLayer.dom.appendChild(defs);
    svgLayer.defs = defs;
    svgLayer.isResourcesSVG = true;
    return svgLayer;
  };

  /** 
   * Retrieves SVG layer, either if it's already at the top of creates a 
   * new one
   */
  proto.getSVGLayer = function() {
    var topMost = this.layers[this.layers.length - 1];
    if (
      topMost && topMost instanceof SVGLayer &&
      !topMost.isResourcesSVG &&
      // Confirm that topMost is the last-child, e.g. there could be a 
      // display-group there, in which case we want a NEW SVG layer on top
      this.dom.lastChild === topMost.dom
    ) {
      return topMost;
    } else {
      return this.addLayer('svg');
    }
  };

  /** 
   * Retrieves DOM layer, either if it's already at the top of creates a 
   * new one
   */
  proto.getDOMLayer = function() {
    var topMost = this.layers[this.layers.length - 1];
    if (
      topMost && topMost instanceof DOMLayer &&
      // Confirm that topMost is the last-child, e.g. there could be a 
      // display-group there, in which case we want a NEW DOM layer on top
      this.dom.lastChild === topMost.dom
    ) {
      return topMost;
    } else {
      return this.addLayer('dom');
    }
  };

  /** 
   * Executes a callback on every layer of the passed type
   */
  proto.forEachLayerOfType = function(type, callback) {
    for (var i = 0, l = this.layers.length; i < l; ++i) {
      if (this.layers[i].rootLayerType === type) {
        callback(this.layers[i]);
      }
    }
  };

  /** 
   * Removes a layer
   */
  proto.removeLayer = function(layerElement) {
    for (var i = 0, l = this.layers.length; i < l; ++i) {
      if (this.layers[i] === layerElement) {
        this.dom.removeChild(layerElement.dom);
        this.layers.splice(i, 1);
      }
    }
  };

  /**
   * Adds a layer of the passed type
   * Supported types: 'svg', 'dom'
   */
  proto.addLayer = function(type) {
    var newLayer = this.createLayer(type);
    return this.insertLayerBefore(newLayer, null);
  };

  /** 
   * Adds a new layer before another layer
   */
  proto.addLayerBefore = function(type, layer) {
    var newLayer = this.createLayer(type);
    return this.insertLayerBefore(newLayer, layer);
  };

  /** 
   * Adds a new layer after another layer
   */
  proto.addLayerAfter = function(type, layer) {
    var index = this.layers.indexOf(layer);
    return this.addLayerBefore(type, this.layers[index + 1]);
  };

  /** 
   * Creates a layer of the specified type
   */
  proto.createLayer = function(type) {
    if (type === 'dom') {
      return new DOMLayer(this);
    } else if (type === 'svg') {
      return new SVGLayer(this);
    }
  };

  /** 
   * Inserts a layer before another layer
   */
  proto.insertLayerBefore = function(layer, refLayer) {

    if (refLayer) {
      var index = this.layers.indexOf(refLayer);
      this.layers.splice(index, 0, layer);
      this.dom.insertBefore(layer.dom, refLayer.dom);
    } else {
      this.layers.push(layer);
      this.dom.appendChild(layer.dom);
    }

    return layer;

  };

  /** 
   * Inserts a layer after another layer
   */
  proto.insertLayerAfter = function(layer, refLayer) {
    var index = this.layers.indexOf(refLayer);
    return this.insertLayerBefore(layer, this.layers[index + 1]);
  };

  return DisplayGroup;

});