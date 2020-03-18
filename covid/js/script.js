window.onload = function() {
	var container = document.getElementById('chart');

	// Mike Bostock "margin conventions"
	var margin = { top: 40, right: 20, bottom: 10, left: 100 },
		width = container.clientWidth - margin.left - margin.right,
		height = container.clientHeight - margin.top - margin.bottom;

	// var x = d3.scale.ordinal().rangeRoundBands([ 0, width ], 0.1);

	// var y = d3.scale.linear().range([ height, 0 ]);

	var yScale = d3.scale.ordinal().rangeRoundBands([ height, 0 ], 0.1);

	var xScale = d3.scale.linear().range([ 0, width ]);

	// the final line sets the transform on <g>, not on <svg>
	var svg = d3
		.select('#chart')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var numCountries = 50;

	// svg
	// 	.append('g')
	// 	.append('text') // just for the title (ticks are automatic)
	// 	.attr('class', 'x label')
	// 	// .attr('transform', 'rotate(-90)') // rotate the text!
	// 	.attr('y', 0)
	// 	.attr('x', 50)
	// 	.style('text-anchor', 'end')
	// 	.text('Cases');

	d3.json('https://corona.lmao.ninja/countries', function(data) {
		csv = data;

		data.sort(function(x, y) {
			return d3.descending(x.cases, y.cases);
		});

		data = csv.slice(0, numCountries);

		console.log(data);

		d3.select('#numCountries').on('input', function() {
			numCountries = +this.value;
			d3.select('#numCountries-value').text(numCountries);
			console.log(numCountries);
			data = csv.slice(0, numCountries);
			redraw(data);
		});

		draw(data, numCountries);

		window.addEventListener('resize', function() {
			redraw(data);
		});
	});

	function createAxis() {
		var yAxis = d3.svg.axis().scale(yScale).orient('left');

		var xAxis = d3.svg.axis().scale(xScale).orient('top').tickFormat(function(d) {
			return d;
		});

		svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,0)');

		svg.append('g').attr('class', 'y axis');

		svg.select('.x.axis').attr('transform', 'translate(0,0)').call(xAxis);

		svg.select('.y.axis').call(yAxis);
	}

	function draw(data, numCountries) {
		data.slice(0, numCountries);

		console.log(data);

		d3
			.select('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		yScale.rangeRoundBands([ 0, height ], 0.1).domain(
			data.map(function(d) {
				return d.country;
			})
		);

		xScale.range([ 0, width ]).domain([
			0,
			d3.max(data, function(d) {
				return d.cases;
			})
		]);

		// THIS IS THE ACTUAL WORK!
		var bars = svg.selectAll('.bar').data(data, function(d) {
			return d.country;
		});

		// var tool_tip = d3
		// 	.tip()
		// 	.attr('class', 'd3-tip')
		// 	// if the mouse position is greater than 650 (~ Kentucky/Missouri),
		// 	// offset tooltip to the left instead of the right
		// 	// credit https://stackoverflow.com/questions/28536367/in-d3-js-how-to-adjust-tooltip-up-and-down-based-on-the-screen-position
		// 	.offset(function() {
		// 		if (current_position[0] > 650) {
		// 			return [ -20, -120 ];
		// 		} else {
		// 			return [ 20, 120 ];
		// 		}
		// 	})
		// 	.html("<p>Outcomes: </p><div id='tipDiv'></div>");

		// svg.call(tool_tip);

		// data that needs DOM = enter() (a set/selection, not an event!)
		bars
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', xScale(0))
			.attr('width', 0)
			.transition()
			.delay(function(d, i) {
				return i * 25;
			})
			.duration(250)
			.attr('x', 0)
			.attr('width', function(d) {
				return xScale(d.cases);
			})
			.attr('y', function(d) {
				return yScale(d.country);
			})
			.attr('height', yScale.rangeBand());

		// bars
		// 	.on('mouseover', function(d) {
		// 		// define and store the mouse position. this is used to define
		// 		// tooltip offset, seen above.
		// 		current_position = d3.mouse(this);
		// 		//console.log(current_position[0])

		// 		current_country = d.country;
		// 		countryData = data.filter(function(d) {
		// 			return d.country == current_country;
		// 		});

		// 		tool_tip.show();
		// 		var tipSVG = d3.select('#tipDiv').append('svg').attr('width', 220).attr('height', 55);

		// 		var x = d3.scaleBand().rangeRound([ 0, width ]).padding(0.1);

		// 		var y = d3.scaleLinear().rangeRound([ height, 0 ]);

		// 		x.domain([ d.deaths, d.recovered, d.critical ]);
		// 		y.domain([ 0, d.cases ]);

		// 		tipSVG
		// 			.append('rect')
		// 			.datum(countryData)
		// 			.attr('x', function(d) {
		// 				return x(d.Run);
		// 			})
		// 			.attr('y', function(d) {
		// 				return y(Number(d.Speed));
		// 			})
		// 			.attr('width', x.bandwidth())
		// 			.attr('height', function(d) {
		// 				return height - y(Number(d.Speed));
		// 			});
		// 	})
		// 	.on('mouseout', tool_tip.hide);

		// D3 Axis - renders a d3 scale in SVG
		createAxis();
	}

	function redraw(data) {
		width = container.clientWidth - margin.left - margin.right;
		height = container.clientHeight - margin.top - margin.bottom;

		d3
			.select('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		yScale.rangeRoundBands([ 0, height ], 0.1).domain(
			data.map(function(d) {
				return d.country;
			})
		);

		xScale.range([ 0, width ]).domain([
			0,
			d3.max(data, function(d) {
				return d.cases;
			})
		]);

		// THIS IS THE ACTUAL WORK!
		var bars = svg.selectAll('.bar').data(data, function(d) {
			return d.country;
		});

		// data that needs DOM = enter() (a set/selection, not an event!)
		bars.enter().append('rect').attr('class', 'bar');

		bars.exit().transition().duration(300).attr('x', 0).attr('width', 0).style('fill-opacity', 1e-6).remove();

		// the "UPDATE" set:
		bars
			.attr('x', 0)
			.attr('width', function(d) {
				return xScale(d.cases);
			})
			.attr('y', function(d) {
				return yScale(d.country);
			})
			.attr('height', yScale.rangeBand());

		// D3 Axis - renders a d3 scale in SVG
		createAxis();
	}
};
