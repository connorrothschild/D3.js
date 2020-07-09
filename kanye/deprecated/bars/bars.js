d3.csv('bars_data.csv', function(error, data) {
	data.forEach(function(d) {
		d.track_name = d.track_name;
		d.valence = +d.valence;
	});

	data = data.filter(function(d) {
		return d.album_name == 'JESUS IS KING';
	});

	data.sort(function(a, b) {
		return d3.descending(a.valence, b.valence);
	});

	console.log(data);

	//set up svg using margin conventions - we'll need plenty of room on the left for labels
	var margin = {
		top    : 15,
		right  : 40,
		bottom : 15,
		left   : 150
	};

	var w = window.innerWidth * 0.9;
	var h = window.innerHeight * 0.9;

	var width = w - margin.left - margin.right,
		height = h - margin.top - margin.bottom;

	var svg = d3
		.select('#graphic')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var xBarScale = d3.scale.linear().range([ 0, width ]).domain([
		0,
		d3.max(data, function(d) {
			return d.valence;
		})
	]);

	var yBarScale = d3.scale.ordinal().rangeRoundBands([ height, 0 ], 0.05).domain(
		data.map(function(d) {
			return d.track_name;
		})
	);

	//make y axis to show bar names
	var yAxisBar = d3.svg
		.axis()
		.scale(yBarScale)
		//no tick marks
		.tickSize(0)
		.orient('left');

	var gy = svg.append('g').attr('class', 'y axis').call(yAxisBar);

	var bars = svg.selectAll('.bar').data(data).enter().append('g');

	//append rects
	bars
		.append('rect')
		.attr('class', 'bar')
		.attr('y', function(d) {
			return yBarScale(d.track_name);
		})
		.attr('height', yBarScale.rangeBand())
		.attr('x', 0)
		.attr('width', 0)
		.transition()
		.duration(1000)
		.attr('width', function(d) {
			return xBarScale(d.valence);
		});

	//add a value label to the right of each bar
	bars
		.append('text')
		.attr('class', 'label')
		//y position of the label is halfway down the bar
		.attr('y', function(d) {
			return yBarScale(d.track_name) + yBarScale.rangeBand() / 2 + 4;
		})
		.attr('x', 0)
		.transition()
		.duration(1000)
		//x position is 3 pixels to the right of the bar
		.attr('x', function(d) {
			return xBarScale(d.valence) + 5;
		})
		.text(function(d) {
			return d.valence;
		});
});
