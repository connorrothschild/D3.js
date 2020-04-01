let dimensions = {
	width  : window.innerWidth * 0.8,
	height : 400,
	margin : {
		top    : 15,
		right  : 15,
		bottom : 65,
		left   : 60
	}
};
dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

// 3. Draw canvas

const svg = d3.select('#my_dataviz').append('svg').attr('width', dimensions.width).attr('height', dimensions.height);

const bounds = svg.append('g').attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

bounds
	.append('defs')
	.append('clipPath')
	.attr('id', 'bounds-clip-path')
	.append('rect')
	.attr('width', dimensions.boundedWidth)
	.attr('height', dimensions.boundedHeight);

const clip = bounds.append('g').attr('clip-path', 'url(#bounds-clip-path)');

//Read the data
d3.csv('data-cleaning/data/final/data.csv', function(data) {
	data.forEach(function(d) {
		d.week = d.week;
		d.things_to_do_inside_united_states = +d.things_to_do_inside_united_states;
		d.toilet_paper_united_states = +d.toilet_paper_united_states;
		d.banana_bread_united_states = +d.banana_bread_united_states;
		d.unemployment_united_states = +d.unemployment_united_states;
		d.flight_cancellation_united_states = +d.flight_cancellation_united_states;
		d.how_to_help_the_elderly_united_states = +d.how_to_help_the_elderly_united_states;
		d.where_to_donate_united_states = +d.where_to_donate_united_states;
		d.how_to_cut_your_own_hair_united_states = +d.how_to_cut_your_own_hair_united_states;
		d.at_home_workout_united_states = +d.at_home_workout_united_states;
		d.can_i_see_my_boyfriend_during_social_distancing_united_states = +d.can_i_see_my_boyfriend_during_social_distancing_united_states;
		d.zoom_worldwide = +d.zoom_worldwide;
		d.work_from_home_united_states = +d.work_from_home_united_states;
		d.delivery_united_states = +d.delivery_united_states;
		d.buy_gun_united_states = +d.buy_gun_united_states;
		d.hydroxychloroquine_united_states = +d.hydroxychloroquine_united_states;
	});

	const xAccessor = (d) => new Date(d.week);
	var yAccessor = (d) => d.things_to_do_inside_united_states;

	console.table(data);

	// List of groups (here I have one group per column)
	var allGroup = [
		'things_to_do_inside_united_states',
		'toilet_paper_united_states',
		'banana_bread_united_states',
		'unemployment_united_states',
		'flight_cancellation_united_states',
		'how_to_help_the_elderly_united_states',
		'where_to_donate_united_states',
		'how_to_cut_your_own_hair_united_states',
		'at_home_workout_united_states',
		'can_i_see_my_boyfriend_during_social_distancing_united_states',
		'zoom_worldwide',
		'work_from_home_united_states',
		'delivery_united_states',
		'buy_gun_united_states',
		'hydroxychloroquine_united_states'
	];

	// add the options to the button
	d3
		.select('#selectButton')
		.selectAll('myOptions')
		.data(allGroup)
		.enter()
		.append('option')
		.text(function(d) {
			return d.replace(/_/g, ' ').replace('united states', '').replace('worldwide', '');
		}) // text showed in the menu
		.attr('value', function(d) {
			return d;
		}); // corresponding value returned by the button

	// A color scale: one color for each group
	var myColor = d3.scaleOrdinal().domain(allGroup).range(d3.schemeSet2);

	var mindate = new Date('2019-04-07'),
		maxdate = new Date('2020-03-14');

	var x = d3
		.scaleTime()
		.domain([ mindate, maxdate ]) // values between for month of january
		.range([ 0, dimensions.boundedWidth ]);

	bounds
		.append('g')
		.attr('transform', 'translate(0,' + dimensions.boundedHeight + ')')
		.call(d3.axisBottom(x))
		.attr('class', 'x axis')
		.selectAll('text')
		.attr('class', 'text')
		.attr('dy', '.5em')
		.attr('dx', '.5em')
		.attr('transform', 'rotate(45)')
		.style('text-anchor', 'start');

	// Add Y axis
	const y = d3.scaleLinear().domain([ 0, 100 ]).range([ dimensions.boundedHeight, 0 ]);

	bounds.append('g').call(d3.axisLeft(y)).attr('class', 'y axis');

	// Initialize line with group a
	const line = bounds
		.append('g')
		.append('path')
		.datum(data)
		.attr(
			'd',
			d3
				.line()
				.x(function(d) {
					return x(new Date(d.week));
				})
				.y(function(d) {
					return y(d.things_to_do_inside_united_states);
				})
		)
		.attr('stroke', function(d) {
			return myColor('things_to_do_inside_united_states');
		})
		.style('stroke-width', 4)
		.style('fill', 'none');

	const listeningRect = bounds
		.append('rect')
		.data(data)
		.attr('class', 'listening-rect')
		.attr('width', dimensions.boundedWidth)
		.attr('height', dimensions.boundedHeight)
		.on('mousemove', function() {
			const mousePosition = d3.mouse(this);
			onMouseMove(mousePosition, data);
		})
		.on('mouseleave', onMouseLeave);

	const tooltip = d3.select('#tooltip');
	const tooltipCircle = bounds
		.append('circle')
		.attr('class', 'tooltip-circle')
		.attr('r', 4)
		.attr('stroke', '#af9358')
		.attr('fill', 'white')
		.attr('stroke-width', 2)
		.style('opacity', 0);

	svg.on('click', function() {
		selectedGroup = allGroup[Math.floor(Math.random() * allGroup.length)];
		console.log(selectedGroup);
		update(selectedGroup);

		url = selectedGroup.replace(/_/g, '+').replace('united+states', '').replace('worldwide', '');

		d3
			.select('#group')
			.text(selectedGroup.replace(/_/g, ' ').replace('united states', '').replace('worldwide', ''))
			.on('click', function() {
				window.open('https://www.google.com/search?client=firefox-b-1-d&q=' + url);
			});
	});

	function onMouseMove(mousePosition, data) {
		// const mousePosition = d3.mouse(this);
		const hoveredDate = x.invert(mousePosition[0]);

		const getDistanceFromHoveredDate = (d) => Math.abs(xAccessor(d) - hoveredDate);
		const closestIndex = d3.scan(data, (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b));
		const closestDataPoint = data[closestIndex];

		const closestXValue = xAccessor(closestDataPoint);
		const closestYValue = yAccessor(closestDataPoint);

		const formatDate = d3.timeFormat('%A, %B %-d, %Y');
		tooltip.select('#date').text(formatDate(closestXValue));

		tooltip.select('#interest').text(closestYValue);

		const xTip = x(closestXValue) + dimensions.margin.left;
		const yTip = y(closestYValue) + dimensions.margin.top;

		tooltip.style('transform', `translate(` + `calc(-50% + ${xTip}px),` + `calc(-100% + ${yTip}px)` + `)`);

		tooltip.style('opacity', 1);

		tooltipCircle.attr('cx', x(closestXValue)).attr('cy', y(closestYValue)).style('opacity', 1);
	}

	function onMouseLeave() {
		tooltip.style('opacity', 0);
		tooltipCircle.style('opacity', 0);
	}

	// A function that update the chart
	function update(selectedGroup) {
		// Create new data with the selection?
		var dataFilter = data.map(function(d) {
			return { week: new Date(d.week), value: d[selectedGroup] };
		});

		const yAccessor2 = (d) => d.value;

		// Give these new data to update line
		line
			.datum(dataFilter)
			.transition()
			.duration(1000)
			.attr(
				'd',
				d3
					.line()
					.x(function(d) {
						return x(d.week);
					})
					.y(function(d) {
						return y(d.value);
					})
			)
			.attr('stroke', function(d) {
				return myColor(selectedGroup);
			});

		listeningRect
			.on('mousemove', function() {
				const mousePosition = d3.mouse(this);

				// const mousePosition = d3.mouse(this);
				const hoveredDate = x.invert(mousePosition[0]);

				const getDistanceFromHoveredDate = (d) => Math.abs(xAccessor(d) - hoveredDate);
				const closestIndex = d3.scan(
					dataFilter,
					(a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
				);
				const closestDataPoint = dataFilter[closestIndex];

				const closestXValue = xAccessor(closestDataPoint);
				const closestYValue = yAccessor2(closestDataPoint);

				const formatDate = d3.timeFormat('%A, %B %-d, %Y');
				tooltip.select('#date').text(formatDate(closestXValue));

				tooltip.select('#interest').text(closestYValue);

				const xTip = x(closestXValue) + dimensions.margin.left;
				const yTip = y(closestYValue) + dimensions.margin.top;

				tooltip.style('transform', `translate(` + `calc(-50% + ${xTip}px),` + `calc(-100% + ${yTip}px)` + `)`);

				tooltip.style('opacity', 1);

				tooltipCircle.attr('cx', x(closestXValue)).attr('cy', y(closestYValue)).style('opacity', 1);
			})
			.on('mouseleave', onMouseLeave);
	}

	// When the button is changed, run the updateChart function
	d3.select('#selectButton').on('change', function(d) {
		// recover the option that has been chosen
		var selectedOption = d3.select(this).property('value');
		// run the updateChart function with this selected option
		update(selectedOption);
	});
});
