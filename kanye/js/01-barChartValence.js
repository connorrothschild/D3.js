function barPlotValence(data, response) {
	/**********************
    ***** BASIC SETUP *****
    **********************/

	// dynamic dimension sizing code adapted from
	// https://github.com/d3/d3-selection/issues/128
	const bbox = d3.select('#chart').node().getBoundingClientRect();

	const width = bbox.width;
	const height = bbox.height;
	const margin = { top: 50, left: 125, right: 50, bottom: 50 };

	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.bottom - margin.top;

	const svg = d3.select('#chart').select('svg');

	const DURATION = 1000;

	/* DATA PREPROCESSING */

	data.forEach(function(d) {
		d.track_name = d.track_name;
		d.valence = +d.valence;
	});

	data = data.sort(function(a, b) {
		return a.valence - b.valence;
	});

	/***********************
    ***** X & Y SCALES *****
    ***********************/

	const xScale = d3
		.scaleLinear()
		.domain([
			0,
			d3.max(data, function(d) {
				return d.valence;
			})
		])
		.range([ 0, plotWidth ]);

	const yScale = d3
		.scaleBand()
		.domain(
			data.map(function(d) {
				return d.track_name;
			})
		)
		.rangeRound([ plotHeight, 0 ])
		.paddingInner(0.1);

	/***************************************
    ***** X AXiS, AXIS LABEL, GRIDLINE *****
    ***************************************/

	svg
		.select('.xAxis')
		.attr('transform', `translate(${margin.left}, ${plotHeight + margin.top})`)
		.call(d3.axisBottom(xScale).tickValues([ 0, 0.2, 0.4, 0.6, 0.8, 1 ]));

	svg.selectAll('.xLabel').data([ { label: 'Valence' } ]).transition().duration(DURATION).text((d) => d.label);

	/***************************************
    ***** Y AXiS, AXIS LABEL, GRIDLINE *****
    ***************************************/

	svg.select('.yAxis').attr('transform', `translate(${margin.left}, ${margin.top})`).call(d3.axisLeft(yScale));

	/****************
    ***** BARS *****
    *****************/

	// Append plot to hold bars
	if (response.direction === 'down') {
		var plot = svg.select('#plot').attr('transform', `translate(${margin.left}, ${margin.top})`);
	} else {
		var plot = svg.select('#plot');

		plot.transition().duration(DURATION).attr('transform', `translate(${margin.left}, ${margin.top})`);
	}

	/**********************
    ***** BARS *****
    **********************/

	if (response.direction === 'down') {
		//append rects
		plot
			.selectAll('.rects')
			.data(data)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('y', function(d) {
				return yScale(d.track_name);
			})
			.attr('height', yScale.bandwidth())
			.attr('x', 0)
			.attr('width', 0)
			.transition()
			.duration(1000)
			.attr('width', function(d) {
				return xScale(d.valence);
			})
			.attr('fill', 'steelblue');

		if (plot.selectAll('.barLabel').empty()) {
			// append text
			plot
				.selectAll('.rects')
				.data(data)
				.enter()
				.append('text')
				.attr('class', 'barLabel')
				//y position of the label is halfway down the bar
				.attr('y', function(d) {
					return yScale(d.track_name) + yScale.bandwidth() / 2 + 4;
				})
				.attr('x', 0)
				.transition()
				.duration(1000)
				//x position is 5 pixels to the right of the bar
				.attr('x', function(d) {
					return xScale(d.valence) + 5;
				})
				.text(function(d) {
					return d.valence;
				});
		}
	} else {
		//append rects
		plot
			.selectAll('.rects')
			.data(data)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('y', function(d) {
				return yScale(d.track_name);
			})
			.attr('height', yScale.bandwidth())
			.attr('x', 0)
			.attr('width', 0)
			.transition()
			.duration(1000)
			.attr('width', function(d) {
				return xScale(d.valence);
			})
			.attr('fill', 'steelblue');

		if (plot.selectAll('.barLabel').empty()) {
			// draw new line labels

			// append text
			plot
				.selectAll('.rects')
				.data(data)
				.enter()
				.append('text')
				.attr('class', 'barLabel')
				//y position of the label is halfway down the bar
				.attr('y', function(d) {
					return yScale(d.track_name) + yScale.bandwidth() / 2 + 4;
				})
				.attr('x', 0)
				.transition()
				.duration(1000)
				//x position is 3 pixels to the right of the bar
				.attr('x', function(d) {
					return xScale(d.valence) + 5;
				})
				.text(function(d) {
					return d.valence;
				});
		}
	}

	/*************************
    ***** TITLE, CAPTION *****
    *************************/

	// Create header grouping
	const header = svg.select('#header');

	// chart title
	header
		.selectAll('.chartTitle')
		.data([ { label: 'Solar panels per capita (as of 2016)' } ])
		.transition()
		.duration(DURATION)
		.text(function(d) {
			return d.label;
		})
		.attr('x', margin.left)
		.attr('y', margin.top - 10)
		.attr('text-anchor', 'start')
		.attr('class', 'chartTitle');

	// Create footer grouping
	const footer = svg.select('#footer');

	// Caption with data source
	footer
		.selectAll('.captionText')
		.data([ { label: 'Data source: NREL (U.S. Dept of Energy), National Cancer Institute' } ])
		.transition()
		.duration(DURATION)
		.text(function(d) {
			return d.label;
		})
		.attr('x', margin.left)
		.attr('y', height - 15)
		.attr('text-anchor', 'start')
		.attr('class', 'captionText');
}
