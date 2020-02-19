/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
	// constants to define the size
	// and margins of the vis area.
	var width = 960,
		height = 700,
		radius = 10;
	var margin = { top: 0, left: 20, bottom: 40, right: 10 };

	// Keep track of which visualization
	// we are on and which was the last
	// index activated. When user scrolls
	// quickly, we want to call all the
	// activate functions that they pass.
	var lastIndex = -1;
	var activeIndex = 0;

	// main svg used for visualization
	var svg = null;

	// d3 selection that will be used
	// for displaying visualizations
	var g = null;

	var x = d3.scaleLinear();

	var xAxis = d3.axisBottom(x);

	// When scrolling to a new section
	// the activation function for that
	// section is called.
	var activateFunctions = [];
	// If a section has an update function
	// then it is called while scrolling
	// through the section with the current
	// progress through the section.
	var updateFunctions = [];

	/**
	 * chart
	 *
	 * @param selection - the current d3 selection(s)
	 *  to draw the visualization in. For this
	 *  example, we will be drawing it in #vis
	 */
	var chart = function(selection) {
		selection.each(function(data) {
			// create svg and give it a width and height
			svg = d3.select(this).selectAll('svg').data([ data ]);
			var svgE = svg.enter().append('svg');
			// @v4 use merge to combine enter and existing selection
			svg = svg.merge(svgE);

			svg.attr('width', width + margin.left + margin.right);
			svg.attr('height', height + margin.top + margin.bottom);

			svg.append('g');

			// this group element will be used to contain all
			// other elements.
			g = svg.select('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var data = getData(data);

			setupVis(data);

			setupSections();
		});
	};

	/**
	 * setupVis - creates initial elements for all
	 * sections of the visualization.
	 *
	 */
	var setupVis = function(datafile) {
		// axis
		g.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
		g.select('.x.axis').style('opacity', 0);

		sq = 'danceability';

		csv = datafile;

		// filter the data based on the inital value
		var data = csv.filter(function(d) {
			return d.group === sq;
		});

		x
			.domain([
				d3.min(data, function(d) {
					return d.score * 0.9;
				}),
				d3.max(data, function(d) {
					return d.score * 1.1;
				})
			])
			.range([ 0, width ]);

		xAxis.ticks(10, '.2r').tickSizeOuter(0);

		svg.append('g').attr('transform', `translate(0,${height / 1.8})`).call(xAxis);

		console.log(data);

		average = d3.mean(data, function(d) {
			return d.score;
		});

		console.log(average);

		averageAnnotation = svg.append('g').attr('class', 'average-annotation').attr('opacity', 0);

		avg = averageAnnotation.selectAll('g').data([ average ]).enter();

		svg
			.append('line')
			.style('stroke', 'black')
			.attr('y1', 0)
			.attr('y2', height / 1.8)
			.attr('x1', x(average))
			.attr('x2', x(average));
		// .attr("class", "average-line")

		svg
			.append('text')
			.attr('y', 30)
			.attr('x', x(average) / 0.99)
			.html(function(d) {
				return 'Average: ' + d3.format(',.4f')(average);
			})
			.attr('alignment-baseline', 'center');
		// .attr("class", "average-text")

		svg
			.append('text')
			.attr('y', height / 1.5)
			.attr('x', 0)
			.html(function(d) {
				return '&larr; Lower ' + sq;
			})
			.attr('alignment-baseline', 'center')
			.attr('class', 'lower-annotation');

		svg
			.append('text')
			.attr('y', height / 1.5)
			.attr('x', width / 1.2)
			.html(function(d) {
				return 'Higher ' + sq + ' &rarr;';
			})
			.attr('alignment-baseline', 'right')
			.attr('class', 'higher-annotation');

		function tick() {
			d3
				.selectAll('.circ')
				.attr('cx', function(d) {
					return d.x;
				})
				.attr('cy', function(d) {
					return d.y;
				});
		}

		circles = svg.selectAll('.circ').data(data).enter().append('circle');

		circles
			.classed('circ', true)
			.attr('r', radius)
			.attr('class', 'circles-test')
			.attr('cx', function(d) {
				return x(d.score);
			})
			.attr('cy', function() {
				return height / 2;
			})
			.attr('fill', function(d) {
				if (d.album_name == 'JESUS IS KING') {
					return '#0534D7';
				} else {
					return 'grey';
				}
			})
			.on('click', function(d) {
				console.log(d.album_name);
				console.log(d.group);
				console.log(d.score);
			});

		simulation = d3
			.forceSimulation(data)
			.force(
				'x',
				d3
					.forceX(function(d) {
						return x(d.score);
					})
					.strength(0.99)
			)
			.force('y', d3.forceY(height / 2).strength(0.05))
			.force('collide', d3.forceCollide(radius))
			.alphaDecay(0)
			.alpha(0.92)
			.on('tick', tick);
	};

	/**
	 * setupSections - each section is activated
	 * by a separate function. Here we associate
	 * these functions to the sections based on
	 * the section's index.
	 *
	 */
	var setupSections = function() {
		// activateFunctions are called each
		// time the active section changes
		activateFunctions[0] = showStepTwo;
		activateFunctions[1] = showStepTwo;
		activateFunctions[2] = showStepThree;
		activateFunctions[3] = showStepTwo;
		activateFunctions[4] = showStepThree;
		activateFunctions[5] = showStepTwo;
		activateFunctions[6] = showStepThree;
		activateFunctions[7] = showStepTwo;
		activateFunctions[8] = showStepThree;
		activateFunctions[9] = showStepTwo;
		activateFunctions[10] = showStepThree;
		activateFunctions[11] = showStepTwo;
		activateFunctions[12] = showStepThree;
		activateFunctions[13] = showStepTwo;

		// updateFunctions are called while
		// in a particular section to update
		// the scroll progress in that section.
		// Most sections do not need to be updated
		// for all scrolling and so are set to
		// no-op functions.
		// updateFunctions are called whilec
		// in a particular section to update
		// the scroll progress in that section.
		// Most sections do not need to be updated
		// for all scrolling and so are set to
		// no-op functions.
		for (var i = 0; i < 20; i++) {
			updateFunctions[i] = function() {};
		}
		//updateFunctions[7] = updateCough;
	};

	/**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
	function firstBeeswarm() {
		circles.transition().attr('opacity', 1);
	}

	function showStepTwo() {
		// circles.transition().attr('opacity', 1);
		// d3.selectAll('.circles-test').attr('r', 30);

		circles.exit().remove(); //remove unneeded circles

		circles.enter().append('circle').attr('r', 0); //create any new circles needed

		//update all circles to new positions
		circles
			.transition()
			.duration(1000)
			.attr('cx', function(d) {
				return x(d.score);
			})
			.attr('cy', function() {
				return height / 2;
			})
			.attr('fill', function(d) {
				if (d.album_name == 'JESUS IS KING') {
					return '#0534D7';
				} else {
					return 'grey';
				}
			})
			.attr('r', 30);

		d3.selectAll('.lower-annotation').text('Step Two');
	}

	function showStepThree() {
		// circles.transition().attr('opacity', 0);

		// debug
		// d3.selectAll('.circles-test').attr('r', 300);

		sq = 'tempo';
		// refilter the data based on the provided sq value
		var new_data = csv.filter(function(d) {
			return d.group === sq;
		});
		console.log(new_data);
		// data should be tempo now
		d3.selectAll('.circles-test').exit().remove();
		d3.selectAll('.circles-test').data(new_data).enter();

		circles.exit().remove(); //remove unneeded circles

		circles.enter().append('circle').attr('r', 0); //create any new circles needed

		//update all circles to new positions
		circles
			.transition()
			.duration(1000)
			.attr('cx', function(d) {
				return x(d.score);
			})
			.attr('cy', function() {
				return height / 2;
			})
			.attr('fill', function(d) {
				if (d.album_name == 'JESUS IS KING') {
					return '#0534D7';
				} else {
					return 'grey';
				}
			})
			.attr('r', 100);

		d3.selectAll('.lower-annotation').text('Step Three');

		// d3
		// 	.selectAll('.circles-test')
		// 	.transition()
		// 	.duration(500)
		// 	.attr('cx', function(d) {
		// 		return x(d.score);
		// 	})
		// 	.attr('cy', function() {
		// 		return height / 2;
		// 	});
		// 	.attr('opacity', 1);

		// function tick() {
		// 	d3
		// 		.selectAll('.circ')
		// 		.attr('cx', function(d) {
		// 			return d.x;
		// 		})
		// 		.attr('cy', function(d) {
		// 			return d.y;
		// 		});
		// }

		// simulation
		// 	.alpha(0.92)
		// 	.force(
		// 		'x',
		// 		d3
		// 			.forceX(function(d) {
		// 				return x(d.score);
		// 			})
		// 			.strength(0.99)
		// 	)
		// 	.force('y', d3.forceY(height / 2).strength(0.05))
		// 	.restart()
		// 	.on('tick', tick);

		circles.transition().attr('opacity', 1);
	}

	/**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

	/**
   * getWords - maps raw data to
   * array of data objects. There is
   * one data object for each word in the speach
   * data.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param data - data read in from file
   */
	function getData(datafile) {
		csv = datafile;
		return datafile.map(function(d, i) {
			d.score = +d.score;

			console.log(csv);

			sq = 'danceability';

			// filter the data based on the inital value
			data = csv.filter(function(d) {
				return d.group === sq;
			});

			return d;
		});
	}

	/**
   * activate -
   *
   * @param index - index of the activated section
   */
	chart.activate = function(index) {
		activeIndex = index;
		var sign = activeIndex - lastIndex < 0 ? -1 : 1;
		var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
		scrolledSections.forEach(function(i) {
			activateFunctions[i]();
		});
		lastIndex = activeIndex;
	};
	/**
   * update
   *
   * @param index
   * @param progress
   */
	chart.update = function(index, progress) {
		updateFunctions[index](progress);
	};

	// return chart function
	return chart;
};

/**
   * display - called once data
   * has been loaded.
   * sets up the scroller and
   * displays the visualization.
   *
   * @param data - loaded tsv data
   */
function display(data) {
	// create a new plot and
	// display it
	var plot = scrollVis();
	d3.select('#vis').datum(data).call(plot);

	// setup scroll functionality
	var scroll = scroller().container(d3.select('#graphic'));

	// pass in .step selection as the steps
	scroll(d3.selectAll('.step'));

	// setup event handling
	scroll.on('active', function(index) {
		// highlight current step text
		d3.selectAll('.step').style('opacity', function(d, i) {
			return i === index ? 1 : 0.1;
		});

		// activate current section
		plot.activate(index);
	});

	scroll.on('progress', function(index, progress) {
		plot.update(index, progress);
	});
}

// load data and display
d3.csv('long_kanye_data.csv', display);
