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

}