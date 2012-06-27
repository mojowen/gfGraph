graphModel = function(columns,options) {
	var options = options || {}
	this.line = { 
			inputs: options.line || [],
			points: [],
			obj: new Kinetic.Line({
				points: [],
				stroke: "#226",
				strokeWidth: 2,
				lineCap: "round",
				lineJoin: "round"
			}),
			point: function(x,y,label) { 
				var point = new Kinetic.Circle({
					x: x,
					y: y,
					radius: 2,
					stroke: "#333",
					strokeWidth: 4
				})
				point.hoverIn = function() { 
					point.setRadius(3)
					point.setStrokeWidth(2)
					if( label ) label.show()
					point.parent.draw();
				}
				point.hoverOut = function() {
					if( label ) label.hide()
					point.setRadius(2)
					point.parent.draw()
				}
				if( label) {
					var hover = new Kinetic.Circle({
						x: x,
						y: y,
						radius: 30
					})
					hover.on('mouseover mousedown', function(evt) {
						point.hoverIn()
						evt.srcElement.style.cursor = 'pointer'
					})
					hover.on('mouseout', function(evt) {
						point.hoverOut()
						evt.srcElement.style.cursor = ''
					})
					label.parent.add(hover)
				}
				return point
			},
			label: function(x,y,label) {
				return new Kinetic.Text({
					x: x,
					y: y,
					width: 'auto',
					text: label,
					fontSize: "10",
					fontStyle: 'normal',
					textStrokeWidth: 0,
					align: 'left',
					textStroke: '#333',
					verticalAlign: 'top',
					stroke: "",
					fill: "",
					padding: 0,
				})
			}
		}
	this.value = options.value || 'value'
	this.label = options.label || 'label'
	this.sort = options.sort || this.label
	this.width = {
		total: options.width || 1000,
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
	
	this.lineLayer = new Kinetic.Layer()
	this.graphLayer = new Kinetic.Layer()
	this.axisLayer = new Kinetic.Layer()

	this.columns = ko.observableArray([])
	this.columns.max = ko.computed( function() { 
		var columns = ko.toJS(this.columns),
			y_points = columns.map( function(el) { return el.value }),
			inputs = ko.toJS( this.line.inputs )
		if( inputs.length > 0 ) y_points = y_points.concat( inputs.map( function(el) { var pointValue =  parseFloat(ko.toJS(el.y)); return !isNaN(pointValue) && pointValue > 0 ? pointValue : 0 }) )
		return Math.ceil( Math.max.apply( Math, y_points ) / 10 ) * 10 // Rounds up to nearest 10
	},this)
	this.columns.width = ko.computed( function() { 
		var columns = ko.toJS(this.columns)
		return this.width.inner / ( (columns.length+1)*.5+columns.length)
	},this)
	this.columns.model = function(value,label) {
		this.label_temporary = label || ''
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
			if( obj.point ) obj.point.hoverIn()
			evt.shape.attrs.alpha = .5
			evt.srcElement.style.cursor = 'pointer'
			obj.tooltip.show()
			obj.text.setTextStroke('#226'),
			evt.shape.parent.draw()
		})
		rect.on('mouseout', function(evt) { 
			if( obj.point ) obj.point.hoverOut()
			evt.shape.attrs.alpha = 1
			evt.srcElement.style.cursor = ''
			obj.tooltip.hide()
			obj.text.setTextStroke(obj.textStroke || '#747474')
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
			align: obj.align || 'center',
			textStroke: obj.textStroke || '#747474',
			verticalAlign: 'top',
			stroke: obj.stroke || "",
			fill: obj.fill || "",
			padding: obj.padding || 0,
		})
	}
	this.ready = ko.observable(false) // hold off rendering rectangles till everything is added

	// This is the main rendering unit which controls when the graph is drawn / redrawn
	// Anything that relies a column's value (And by extension, this.column.max ) should live in here
	this.columns.render = ko.computed( function() {
		if( this.ready() && this.columns.max() > 0 ) {
			this.graphLayer.removeChildren()
			this.lineLayer.removeChildren()
			this.line.points = [],
			inputs = ko.toJS( this.line.inputs )

			var columns = ko.toJS(this.columns), all = []
			for (var i=0; i < columns.length; i++) {
				var point = undefined, label = undefined, x = undefined, y = undefined

				// Adding line points
				for (var p=0; p < inputs.length ; p++) {
					var pointValue = parseFloat(ko.toJS(inputs[p].y)),
						pointLabel = ko.toJS(inputs[p].label)
					if( inputs[p].x == columns[i].label && !isNaN( pointValue ) && pointValue > 0 ) {
						x = this.width.left+i*this.columns.width()*1.5+this.columns.width(),
						y = this.height.total-this.height.bottom-this.height.inner * pointValue/this.columns.max()
						this.line.points.push( x, y - 2)
						if( inputs[p].dot ) {
							if( inputs[p].label ) { 
								label = new this.line.label( x - 20, y - 30 , pointLabel )
								label.hide()
								this.lineLayer.add( label )
							}
							point = new this.line.point( x, y - 2 , label )
							this.lineLayer.add( point )
						}
					}
				};


				var tooltip = new this.columns.text({
					x: this.width.left+i*this.columns.width()*1.5+1*this.columns.width() - columns[i].value.toString().length*3 - 2,
					y: this.height.total-this.height.bottom - 18 -this.height.inner * columns[i].value/this.columns.max() -4,
					text: columns[i].value,
					fill: '#222266',
					textStroke: '#fff',
					padding: 4,
					align: 'left'
				})
				tooltip.hide()
				var text = new this.columns.text({
					x: this.width.left+i*this.columns.width()*1.5+1*this.columns.width()-columns[i].label.length*4/3 - 2,
					y: this.height.total-this.height.bottom + 5,
					width: this.columns.width()*1.25,
					text: columns[i].label,
					align: 'left'
				})
				// Determining if the rectangle contains the point
				if( y <  this.height.total-this.height.bottom -this.height.inner * columns[i].value/this.columns.max() ) point = undefined
				var width = this.columns.width() > 100 ? 100 : this.columns.width()
				var rect = new this.columns.rectangle({
					x: this.width.left+i*this.columns.width()*1.5+(this.columns.width()-.5*width),
					y: this.height.total-this.height.bottom,
					width: width,
					height: -this.height.inner * columns[i].value/this.columns.max(),
					tooltip: tooltip,
					text: text,
					point: point
				})

				all.push({ rectangle: rect, text: text })
				this.graphLayer.add(rect)
				this.graphLayer.add(text);
				this.graphLayer.add(tooltip);
			}
			for (var i=0; i < this.yTicks.frequency; i++) { 
				var ypos = this.height.top+i*this.height.inner/this.yTicks.frequency,
					label = (this.yTicks.frequency+1-i) * Math.floor( this.columns.max() / (this.yTicks.frequency+1) * 10 ) /10,
					yLabel = new this.yTicks.label( (this.width.left - this.yTicks.left), ypos - 4, label, this.width.left-this.yTicks.left-this.yTicks.width/2 )
				this.graphLayer.add(yLabel)
			}
			if( this.line.points.length > 0 ) {
				this.line.obj.setPoints( this.line.points )
				this.lineLayer.add( this.line.obj )
			}
			this.lineLayer.draw()
			this.graphLayer.draw()
			return all
		}
	},this)

	var raw_columns = columns
	ko.computed( function() {
		this.columns([])
		var new_columns = ko.toJS(raw_columns), sort = this.sort
		new_columns = new_columns.sort( function(a,b) { return a[sort] >  b[sort] ? 1 : -1 })
		for (var i=0; i < new_columns.length; i++) {
			this.columns.push( new this.columns.model(new_columns[i][this.value],new_columns[i][this.label]))
		};
		
	},this)
	

	// Setting up the axis

	var yAxis = new axis([this.width.left,this.height.total+this.height.top/2,this.width.left,this.height.bottom/2]);
	var xAxis = new axis([this.width.left/2,this.height.total-this.height.bottom,this.width.total-this.width.right/2,this.height.total-this.height.bottom]);
	this.axisLayer.add(yAxis)
	this.axisLayer.add(xAxis)
	for (var i=0; i < this.yTicks.frequency; i++) {
		var ypos = this.height.top+i*this.height.inner/this.yTicks.frequency,
			yTick = new this.yTicks.line([this.width.left-this.yTicks.width/2,ypos,this.width.left+this.yTicks.width/2,ypos])
		this.axisLayer.add(yTick)
	};
	yLabel = new this.yTicks.label( (this.width.left - this.yTicks.left), this.height.total-this.height.bottom+5, '0', this.width.left-this.yTicks.left-this.yTicks.width/2 ),
	this.axisLayer.add(yLabel)


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

		graph.stage.add(graph.lineLayer);
		graph.stage.add(graph.graphLayer);
		graph.stage.add(graph.axisLayer);
		element.className += ' gfGraph'
		graph.ready(true)
	}}

}