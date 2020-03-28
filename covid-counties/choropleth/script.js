var svg = d3
	.select('svg')
	.attr('class', 'my_chart')
	.attr('height', 600)
	.attr('width', 960)
	// resize plot when window is resized (see below)
	.call(responsivefy);

var path = d3.geoPath();
var format = d3.format('');
var height = 600;
var width = 960;

// thanks to https://brendansudol.com/writing/responsive-d3 for this function!
function responsivefy(svg) {
	// container will be the DOM element
	// that the svg is appended to
	// we then measure the container
	// and find its aspect ratio
	const container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style('width'), 10),
		height = parseInt(svg.style('height'), 10),
		aspect = width / height;

	// set viewBox attribute to the initial size
	// control scaling with preserveAspectRatio
	// resize svg on inital page load
	svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMinYMid').call(resize);

	// add a listener so the chart will be resized
	// when the window resizes
	// multiple listeners for the same event type
	// requires a namespace, i.e., 'click.foo'
	// api docs: https://goo.gl/F3ZCFr
	d3.select(window).on('resize.' + container.attr('id'), resize);

	// this is the code that resizes the chart
	// it will be called on load
	// and in response to window resizes
	// gets the width of the container
	// and resizes the svg to fill it
	// while maintaining a consistent aspect ratio
	function resize() {
		const w = parseInt(container.style('width'));
		svg.attr('width', w);
		svg.attr('height', Math.round(w / aspect));
	}
}

function dateFunction(date) {
	var formatTime = d3.timeFormat('%B %d, %Y');
	return formatTime(new Date(date));
}

function dateFunctionNoYear(date) {
	var formatTime = d3.timeFormat('%B %d');
	return formatTime(new Date(date));
}

var radius = d3.scaleSqrt().domain([ 0, 5000 ]).range([ 0, 25 ]);

// options for color scheme: https://github.com/d3/d3-scale-chromatic
var colorScheme = d3.schemeBlues[5];
// colorScheme.unshift("#eee");

const logScale = d3.scaleLog().domain([ 10, 10000 ]);

// building the legend at the top
var color = d3.scaleSequential((d) => d3.interpolateReds(logScale(d)));
// var x = d3.scaleLinear()
//   .domain(d3.extent(color.domain()))
//   // the range specifies the x position of the legend
//   .rangeRound([600,860]);

var g = svg.append('g').attr('transform', 'translate(0,40)');

// g
//     // .attr('class', 'legend')
//       // .attr('transform', 'translate(' + margin + ',' +  (2 * margin + i * 3 * barHeight) + ')')
//     .selectAll('rect')
//     .data(color.range().map(function(d){ return color.invertExtent(d); }))
//       .enter()
//       .append('rect')
//       // .attr('y', 0)
//       .attr("x", function(d){ return x(d[0]); })
//       .attr("width", 10)
//       .attr('height', 10)
//       .attr('fill', color)

// g.append('text')
//     .text('Logarithmic')
//     .attr('x', 0)
//     .attr('y', -10)
//     .attr('fill', '#333')
var log = d3.scaleLog().domain([ 10, 100, 1000, 10000 ]).range([ '#FFF5F0', '#FCB094', '#9F2E22', '#67000D' ]);

var svg = d3.select('svg');

svg.append('g').attr('class', 'legendLog').attr('transform', 'translate(715,60)');

var logLegend = d3.legendColor().cells([ 10, 100, 1000, 10000 ]).scale(log);

logLegend.labelFormat(d3.format('.0f')).title('Confimed Cases');

svg.select('.legendLog').call(logLegend);

// // legend boxes
// g.selectAll("rect")
//   .data(color.range().map(function(d){ return color.invertExtent(d); }))
//   .enter()
//   .append("rect")
//     .attr("height", 8)
//     .attr("x", function(d){ return x(d[0]); })
//     .attr("width", function(d){ return x(d[1]) - x(d[0]); })
//     .attr("fill", function(d){ return color(d[0]); });

// // legend title
// g.append("text")
//   .attr("class", "caption")
//   .attr("x", x.range()[0])
//   .attr("y", -6)
//   .attr("fill", "#000")
//   .attr("text-anchor", "start")
//   .attr("font-weight", 30)
//   .text("Number of Confirmed Cases");

// // legend ticks
// g.call(d3.axisBottom(x)
//   .tickSize(13)
//   .tickFormat(format)
//   .tickValues(color.range().slice(1).map(function(d){ return color.invertExtent(d)[0]; })))
//   .select(".domain")
//   .remove();

// create tooltip
var div = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

// label positions
labely = height - 50;
labelx = width - 280;

// Add the year label; the value is set on transition.
var label = svg
	.append('text')
	.attr('class', 'year label')
	.attr('text-anchor', 'middle')
	// position the label
	.attr('y', labely)
	.attr('x', labelx)
	.text(dateFunction('2020-01-22'));

var helperlabel = svg
	.append('text')
	.attr('class', 'helper label')
	.attr('text-anchor', 'middle')
	// position the label
	.attr('y', labely + 20)
	.attr('x', labelx)
	.text('Hover to change date');

queue()
	// read in JSON which includes all of the complicated shape data for states/counties/etc.
	.defer(d3.json, 'https://d3js.org/us-10m.v1.json')
	// .defer(d3.csv, "us-counties.csv")
	.defer(d3.csv, 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
	.await(ready);

function ready(error, us, overdoses) {
	if (error) throw error;

	var currentDate = dateFunction('2020-01-22');
	var rateById = {};
	var nameById = {};

	overdoses.forEach(function(d) {
		d.cases = +d.cases;
		rateById[d.fips] = +d.cases;
		nameById[d.fips] = d.county;
		d.date_old = d.date;
		d.date = dateFunction(d.date);
	});

	console.log(overdoses);

	//  color.domain([0, d3.max(overdoses, function(d) {return d.cases})])

	// Add an overlay for the year label.
	var box = label.node().getBBox();

	var overlay = svg
		.append('rect')
		.attr('class', 'overlay')
		.attr('x', box.x)
		.attr('y', box.y)
		.attr('width', box.width)
		.attr('height', box.height)
		.on('mouseover', enableInteraction);

	var tool_tip = d3
		.tip()
		.attr('class', 'd3-tip')
		// if the mouse position is greater than 650 (~ Kentucky/Missouri),
		// offset tooltip to the left instead of the right
		// credit https://stackoverflow.com/questions/28536367/in-d3-js-how-to-adjust-tooltip-up-and-down-based-on-the-screen-position
		.offset(function() {
			if (current_position[0] > 650) {
				return [ -30, -240 ];
			} else {
				return [ 5, 30 ];
			}
		})
		.html("<div id='tipDiv'></div>");

	svg.call(tool_tip);

	// Start a transition that interpolates the data based on year.
	svg.transition().duration(10000).ease(d3.easeLinear).tween('date', tweenDate);

	counties = svg
		.append('g')
		.attr('class', 'counties')
		.selectAll('path')
		.data(topojson.feature(us, us.objects.counties).features)
		.enter()
		.append('path')
		.attr('d', path)
		.attr('stroke', 'grey')
		.attr('stroke-width', 0.1)
		.call(style, currentDate)
		// appending svg inside of tooltip for year by year change.
		// h/t https://bl.ocks.org/maelafifi/ee7fecf90bb5060d5f9a7551271f4397
		// h/t https://stackoverflow.com/questions/43904643/add-chart-to-tooltip-in-d3
		.on('mouseover', function(d) {
			// define and store the mouse position. this is used to define
			// tooltip offset, seen above.
			current_position = d3.mouse(this);
			// console.log(current_position[0]);

			current_county = nameById[d.id];

			tool_tip.show();
			var tipSVG = d3.select('#tipDiv').append('svg').attr('width', 220).attr('height', 55);

			tipSVG
				.append('circle')
				.attr('fill', function() {
					return color(rateById[d.id]);
				})
				.attr('stroke', 'black')
				.attr('cx', 180)
				.attr('cy', 30)
				.attr('r', function() {
					return radius(rateById[d.id]);
				});

			tipSVG
				.append('text')
				.text(function() {
					if (current_county == undefined) {
						return '';
					} else {
						return rateById[d.id] + ' confirmed cases';
					}
				}) // .transition()
				// .duration(1000)
				.attr('x', 0)
				.attr('y', 55);

			tipSVG
				.append('text')
				.attr('class', 'county-name')
				.text(function() {
					if (current_county == undefined) {
						return 'No cases';
					} else {
						return current_county + ' County';
					}
				})
				// .transition()
				// .duration(1000)
				.attr('x', 0)
				.attr('y', 20);
		})
		.on('mouseout', tool_tip.hide)
		.call(style, currentDate);

	function style(counties, date) {
		newoverdoses = interpolateData(date);

		var rateById = {};
		var nameById = {};

		newoverdoses.forEach(function(d) {
			d.cases = +d.cases;
			rateById[d.fips] = +d.cases;
			nameById[d.fips] = d.county;
			// d.date = d.date;
		});

		console.log(newoverdoses);

		// add fill according to death rates, for each id (state)
		counties.style('fill', function(d) {
			if (rateById[d.id] != null) {
				return color(rateById[d.id]);
			} else {
				return 'white';
			}
		});

		// create nation
		svg
			.append('path')
			.datum(topojson.feature(us, us.objects.nation))
			.attr('class', 'land')
			.attr('d', path)
			.attr('fill', 'none')
			.attr('stroke', 'grey')
			.attr('stroke-width', 0.2);

		// create the actual state objects
		svg
			.append('path')
			.datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
			.attr('fill', 'none')
			.attr('stroke', 'grey')
			.attr('stroke-width', 0.15)
			.attr('stroke-linejoin', 'round')
			.attr('d', path);
	}

	// after the transition finishes, mouseover to change  year.
	function enableInteraction() {
		var dateScale = d3
			.scaleLinear()
			.domain(
				d3.extent(overdoses, function(d) {
					return new Date(d.date);
				})
			)
			.range([ box.x + 10, box.x + box.width - 10 ])
			.clamp(true);

		// Cancel the current transition, if any.
		svg.transition().duration(0);

		overlay
			.on('mouseover', mouseover)
			.on('mouseout', mouseout)
			.on('mousemove', mousemove)
			.on('touchmove', mousemove);

		function mouseover() {
			label.classed('active', true);
		}
		function mouseout() {
			label.classed('active', false);
		}
		function mousemove() {
			displayDate(dateScale.invert(d3.mouse(this)[0]));
		}
	}

	// Tweens the entire chart by first tweening the year, and then the data.
	// For the interpolated data, the dots and label are redrawn.
	function tweenDate() {
		var date = d3.interpolate(new Date('2020-01-22'), new Date('2020-03-26'));
		return function(t) {
			displayDate(date(t));
		};
	}

	// Updates the display to show the specified year.
	function displayDate(date) {
		currentDate = date;
		counties.call(style, date);
		label.text(dateFunctionNoYear(date));
	}

	// Interpolates the dataset for the given (fractional) year.
	function interpolateData(date) {
		return overdoses.filter(function(row) {
			return row['date'] == dateFunction(date);
			// return new Date(row.date) === new Date(date);
		});
	}
}
