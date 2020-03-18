window.onload = function() {
	var container = document.getElementById('chart');

	// Mike Bostock "margin conventions"
	var margin = { top: 40, right: 20, bottom: 10, left: 100 },
		width = container.clientWidth - margin.left - margin.right,
		height = container.clientHeight - margin.top - margin.bottom;

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

	d3.json('testing-data/countries.json', function(data) {
		// d3.json('https://corona.lmao.ninja/countries', function(data) {
		csv = data;

		data.sort(function(x, y) {
			return d3.descending(x.cases, y.cases);
		});

		data = csv.slice(0, numCountries);

		console.log(data);

		d3.select('#numCountries').on(
			'input',
			// add a slight 'debounce' so the transitions are not jittery
			debounce(function() {
				numCountries = +this.value;
				d3.select('#numCountries-value').text(numCountries);
				console.log(numCountries);
				data = csv.slice(0, numCountries);
				redraw(data);
			}, 250)
		);

		draw(data, numCountries);

		window.addEventListener('resize', function() {
			redraw(data);
		});
	});

	function createAxis() {
		var yAxis = d3.svg.axis().scale(yScale).orient('left');

		var xAxis = d3.svg.axis().scale(xScale).orient('top').tickFormat(function(d) {
			return format(d);
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

		var tool_tip = d3
			.tip()
			.attr('class', 'd3-tip')
			.offset([ 0, -50 ])
			// if the mouse position is greater than 650 (~ Kentucky/Missouri),
			// offset tooltip to the left instead of the right
			// credit https://stackoverflow.com/questions/28536367/in-d3-js-how-to-adjust-tooltip-up-and-down-based-on-the-screen-position
			// .offset(function() {
			// 	if (current_position[0] > 650) {
			// 		return [ -20, -120 ];
			// 	} else {
			// 		return [ 20, 120 ];
			// 	}
			// })
			.html("<div id='tipDiv'></div>");

		svg.call(tool_tip);

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

		bars
			.on('mouseover', function(d) {
				// define and store the mouse position. this is used to define
				// tooltip offset, seen above.
				current_position = d3.mouse(this);

				current_country = d.country;

				countryData = data.filter(function(d) {
					return d.country == current_country;
				});

				tool_tip.show();

				var tip_width = width > 1000 ? 400 : width / 1.35,
					tip_height = 200,
					barpadding = 10,
					barheight = tip_height / 4 - barpadding;
				//Make an SVG Container
				var tipSVG = d3.select('#tipDiv').append('svg').attr('width', tip_width).attr('height', tip_height);

				tipSVG
					.append('text')
					.html(d.country + ' has ' + format(d.cases) + ' recorded cases.')
					.attr('class', 'countryText')
					.attr('y', 20);

				tipSVG
					.append('text')
					.html(
						'We know the status of ' +
							format(d.deaths + d.recovered + d.critical) +
							' (' +
							percent((d.deaths + d.recovered + d.critical) / d.cases) +
							'):'
					)
					.attr('class', 'countrySubtext')
					.attr('y', 40);

				// tool_tip_x_scale = d3.scale.linear().range([ 0, tip_width ]).domain([
				// 	0,
				// 	d3.max(countryData, function(d) {
				// 		return Math.max(d.deaths, d.recovered, d.critical);
				// 	})
				// ]);

				tool_tip_x_scale = d3.scale.linear().range([ 0, tip_width ]).domain([
					0,
					d3.max(countryData, function(d) {
						return d.cases;
					})
				]);

				var bar = tipSVG.selectAll('g').data(countryData).enter().append('g');

				bar
					.append('rect')
					.data(countryData)
					.attr('x', 1)
					.attr('y', tip_height * 0.25)
					.attr('width', function(d) {
						return tool_tip_x_scale(d.deaths);
					})
					.attr('height', barheight)
					.attr('fill', '#FF8C02');

				bar
					.append('text')
					.html(function(d) {
						return 'Deaths: ' + format(d.deaths);
					})
					.attr('x', 3)
					.attr('y', tip_height * 0.25 + barpadding * 2.5);

				bar
					.append('rect')
					.data(countryData)
					.attr('class', 'recovered_rectangle')
					.attr('x', 1)
					.attr('y', tip_height * 0.5)
					.attr('width', function(d) {
						return tool_tip_x_scale(d.recovered);
					})
					.attr('height', barheight)
					.attr('fill', '#BD99F6');

				bar
					.append('text')
					.html(function(d) {
						return 'Recovered: ' + format(d.recovered);
					})
					.attr('x', 3)
					.attr('y', tip_height * 0.5 + barpadding * 2.5);

				bar
					.append('rect')
					.data(countryData)
					.attr('x', 1)
					.attr('y', tip_height * 0.75)
					.attr('width', function(d) {
						return tool_tip_x_scale(d.critical);
					})
					.attr('height', barheight)
					.attr('fill', '#97ABC5');

				bar
					.append('text')
					.html(function(d) {
						return 'Critical: ' + format(d.critical);
					})
					.attr('x', 3)
					.attr('y', tip_height * 0.75 + barpadding * 2.5);
			})
			.on('mouseout', tool_tip.hide);

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
