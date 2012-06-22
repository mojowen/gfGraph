graphModel = function(columns,options) {
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