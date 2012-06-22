graphModel = function(columns,options) {
	var options = options || {}
	this.value = options.value || 'value'
	this.label = options.label || 'label'
	this.width = {
		total: options.width || 700,
		left: 20,	
		right: 0
	}
	this.height = {
		total: options.height || 300,
		top: 30,
		bottom: 20
	}
	this.width.inner = this.width.total - this.width.left-this.width.right,
	this.height.inner = this.height.total - this.height.top-this.height.bottom,
	this.yTicks = {
		frequency: 3,
		width:8,
		left: 6,
		line: function(points) {
			return new Kinetic.Line({
				points: points,
				stroke: "#999",
				strokeWidth: 1,
				lineCap: "round",
				lineJoin: "round"
			});
		},
		label: function(x,y,label,width) {
			return new Kinetic.Text({
				x: x,
				y: y,
				width: width,
				text: label,
				fontSize: "6",
				fontStyle: 'normal',
				textFill: "#747474",
				textStrokeWidth: 0,
				align: 'right',
				textStroke: '#747474',
				verticalAlign: 'top'
			});
		}
	}
	var axis = function(points) {
		return new Kinetic.Line({
			points: points,
			stroke: "#999",
			strokeWidth: 2,
			lineCap: "round",
			lineJoin: "round"
		});
	}
	var goalLine = function(points) {
		return new Kinetic.Line({
			points: points,
			stroke: "#226",
			alpha: 0.8,
			strokeWidth: 4,
			lineCap: "round",
			lineJoin: "round"
		});
	}
	
	this.graphLayer = new Kinetic.Layer()
	this.axisLayer = new Kinetic.Layer()

	this.columns = ko.observableArray([])
	this.columns.max = ko.computed( function() { 
		var columns = ko.toJS(this.columns)
		return Math.ceil( Math.max.apply( Math, columns.map( function(el) { return el.value }) ) / 10 ) * 10 // Rounds up to nearest 10
	},this)
	this.columns.width = ko.computed( function() { 
		var columns = ko.toJS(this.columns)
		return this.width.inner / ( (columns.length+1)*.5+columns.length)
	},this)
	this.columns.model = function(value,label) {
		this.label_temporary = label
		this.label = ko.computed( function() { return ko.toJS(this.label_temporary) },this)
		this.value_temporary = value
		this.value = ko.computed( function() { return ko.toJS(this.value_temporary) },this)
	}
	this.columns.rectangle = function(obj) {
		var rect = new Kinetic.Rect({
			x: obj.x,
			y: obj.y,
			width: obj.width,
			height: obj.height,
			fill: "#622",
			stroke: "#333",
			strokeWidth: 2
		});
		rect.setShadow({
			color: '#333',
			blur: 4,
			offset: [2, -2],
			alpha: 0.5
		});
		rect.on('mouseover mousedown', function(evt) {
			evt.shape.attrs.alpha = .5
			evt.srcElement.style.cursor = 'pointer'
			obj.tooltip.show()
			evt.shape.parent.draw()
		})
		rect.on('mouseout', function(evt) { 
			messageLayer.clear()
			evt.shape.attrs.alpha = 1
			evt.srcElement.style.cursor = ''
			obj.tooltip.hide()
			evt.shape.parent.draw()
		})
		return rect;
	}
	this.columns.text = function(obj) {
		return new Kinetic.Text({
			x: obj.x,
			y: obj.y,
			width: obj.width || 'auto',
			text: obj.text,
			fontSize: "10",
			fontStyle: 'normal',
			textStrokeWidth: 0,
			align: obj.align || 'left',
			textStroke: obj.textStroke || '#747474',
			verticalAlign: 'top',
			stroke: obj.stroke || "",
			fill: obj.fill || "",
			padding: obj.padding || 0,
		})
	}
	this.ready = ko.observable(false) // hold off rendering rectangles till everything is added

	ko.bindingHandlers.gfGraph = { init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
		var graph = valueAccessor()
		if( element.id == '' ) {
			element.id = 'gfGraph_'+new Date().getTime()
		}
		graph.stage = new Kinetic.Stage({
			container: element.id,
			width: graph.width.total,
			height: graph.height.total
		})
		graph.stage.add(graph.graphLayer);
		graph.stage.add(graph.axisLayer);
		graph.stage.add(graph.messageLayer);
		element.className += ' gfGraph'
		graph.ready(true)
	}}

}}