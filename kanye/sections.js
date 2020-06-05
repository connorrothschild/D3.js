/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
	// constants to define the size
	// and margins of the vis area.
	var radius = 12;

	var margin = { top: radius * 5 + 30, left: 170, bottom: 50, right: 40 },
		width = 900 - margin.left - margin.right,
		// width = +jz.str.keepNumber(d3.select('#vis').style('width')) - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;
	// ,
	// svg = d3
	// 	.select('svg')
	// 	.append('svg')
	// 	.attr('width', width + margin.left + margin.right)
	// 	.attr('height', height + margin.top + margin.bottom)
	// 	.append('g')
	// 	.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

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

	var x = d3.scaleLinear().rangeRound([ 0, width ]);

	var y = d3.scaleBand().rangeRound([ 0, height ]);

	var x_axis = d3.axisBottom(x).tickSizeOuter(0).ticks(10);

	var y_axis_left = d3.axisLeft(y).tickSize(0);

	var y_axis_right = d3.axisRight(y).tickSizeOuter(0).tickSizeInner(-width);

	// We will set the domain when the
	// data is processed.
	// @v4 using new scale names
	var xBarScale = d3.scaleLinear().range([ 0, width ]);

	// You could probably get fancy and
	// use just one axis, modifying the
	// scale, but I will use two separate
	// ones to keep things easy.
	// @v4 using new axis name
	var xAxisBar = d3.axisBottom().scale(xBarScale);

	// The bar chart display is horizontal
	// so we can use an ordinal scale
	// to get width and y locations.
	// @v4 using new scale type
	var yBarScale = d3.scaleBand().paddingInner(0.08).range([ 0, height ]);

	var barColors = d3.scaleOrdinal(d3.schemeCategory10);
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

			getData(data);
			setupVis(data);

			setupSections();
		});
	};

	/**
	 * setupVis - creates initial elements for all
	 * sections of the visualization.
	 *
	 */
	var setupVis = function(data) {
		console.log(data);
		console.log(reduced);
		console.log(averages_data);

		// images //

		g
			.append('svg:image')
			.attr('class', 'kanye-image')
			.attr('x', width / 3)
			.attr('y', height / 4)
			.attr('width', 200)
			.attr('height', 200)
			.attr('xlink:href', 'images/kanye.png')
			.attr('opacity', 0);

		g
			.append('svg:image')
			.attr('class', 'album-image')
			.attr('x', width / 5)
			.attr('y', height / 4)
			.attr('width', 400)
			.attr('height', 400)
			.attr('xlink:href', 'images/albums.png')
			.attr('opacity', 0);

		// beeswarm //

		tip = d3.select('#vis').append('g').attr('class', 'tip').attr('opacity', 0);

		var album_names = jz.arr.sortBy(averages_data, 'danceability', 'desc');

		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);
		x.domain([ 0, 1 ]);
		x_axis.tickSizeInner(-height + y.bandwidth() / 2 - 3);

		// g.append('text').attr('class', 'title').attr('x', width / 2).attr('y', height / 3).text('TESTING');

		g
			.append('g')
			.attr('class', 'axis y left')
			.call(y_axis_left)
			.selectAll('.tick text')
			// .attr('dx', +radius)
			// correct:
			.attr('dx', -radius)
			.attr('dy', y.bandwidth() / 5)
			.attr('opacity', 0);

		g
			.append('g')
			.attr('class', 'axis y right')
			.attr('transform', 'translate(' + width + ', 0)')
			.call(
				y_axis_right.tickFormat(function(d) {
					return album_names
						.filter(function(c) {
							return c.album_name == d;
						})[0]
						.danceability.toFixed(2);
				})
			)
			.selectAll('.tick text')
			.attr('dx', radius)
			.attr('fill', 'black')
			.attr('opacity', 0);

		g
			.append('g')
			.attr('class', 'axis x')
			.attr('transform', 'translate(0, ' + height + ')')
			.call(x_axis)
			.attr('opacity', 0);

		forceSim();

		draw();

		// window.addEventListener('resize', function() {
		// 	// all of these things need to be updated on resize
		// 	width = +jz.str.keepNumber(d3.select('svg').style('width')) - margin.left - margin.right;

		// 	d3
		// 		.select('.axis.y.right')
		// 		.attr('transform', 'translate(' + width + ', 0)')
		// 		.call(y_axis_right.tickSizeInner(-width));

		// 	x.rangeRound([ 0, width ]);

		// 	forceSim();

		// 	d3.select('.x.axis').call(x_axis);

		// 	draw();
		// });

		function draw() {
			// color = d3
			// 	.scaleLinear()
			// 	.domain(
			// 		d3.extent(data, function(d) {
			// 			return d.x;
			// 		})
			// 	)
			// 	.range([ 'steelblue', 'brown' ])
			// 	.interpolate(d3.interpolateHsl);

			color = d3.scaleLinear().domain([ 0, 1 ]).range([ 'steelblue', 'brown' ]).interpolate(d3.interpolateHsl);

			// hover
			hover_circle = g
				.selectAll('circle')
				.data(data)
				.enter()
				.append('circle')
				.attr('r', radius)
				.attr('fill', function(d) {
					return color(d.danceability);
				})
				.attr('opacity', 0)
				.attr('stroke', 'black')
				.attr('cx', function(d) {
					return x(d.danceability);
				})
				.attr('cy', function(d) {
					return y(d.album_name) + y.bandwidth() / 2;
				})
				.on('mouseover', function(d) {
					tip.html(
						"<span style = 'font-weight:bold'>" +
							d.track_name +
							' | ' +
							d.album_name +
							'</span><hr>Danceability: ' +
							d.danceability.toFixed(2)
					);
					tip
						.style('left', d3.select(this).attr('cx') + 'px')
						.style('top', d3.select(this).attr('cy') + 'px')
						.style('opacity', 1);
				})
				.on('mouseout', function(d) {
					tip.style('opacity', 0);
				});
		}

		function forceSim() {
			simulation = d3
				.forceSimulation(data)
				.force(
					'y',
					d3
						.forceY(function(d) {
							return y(d.album_name) + y.bandwidth() / 2;
						})
						.strength(1)
				)
				.force(
					'x',
					d3
						.forceX(function(d) {
							return x(d.danceability);
						})
						.strength(1)
				)
				.force('collide', d3.forceCollide(radius + 1))
				.stop();

			for (var i = 0; i < 167; ++i) simulation.tick();
		}

		//https://bl.ocks.org/tomshanley/raw/e1f2a325793bc9e76fbfaa58ea6a6d15/2c781f3e92ea3f697ab3df8e990291ea6abbf2d1/roi-pre.js
		//https://bl.ocks.org/tomshanley/raw/e1f2a325793bc9e76fbfaa58ea6a6d15/2c781f3e92ea3f697ab3df8e990291ea6abbf2d1/
		avgLines = g.selectAll('.avg-lines').data(averages_data).enter().append('g').attr('class', 'avg-line');
		// .attr("transform", function(d) { return "translate("+ xScale(d.value) + "," + yScale(d.key) + ")"; });

		color_lines = d3
			.scaleLinear()
			.domain(
				d3.extent(data, function(d) {
					return d.danceability;
				})
			)
			.range([ 'steelblue', 'brown' ])
			.interpolate(d3.interpolateHsl);

		avgLines = avgLines
			.append('line')
			.attr('x1', function(d) {
				return x(d.danceability);
			})
			.attr('x2', function(d) {
				return x(d.danceability);
			})
			.attr('y1', function(d) {
				return y(d.album_name) + y.bandwidth() - 30;
			})
			.attr('y2', function(d) {
				return y(d.album_name) + y.bandwidth() - 10;
			})
			.attr('stroke', 'black')
			.attr('stroke-linecap', 'round')
			// .attr('stroke', function(d) { return color_lines(d.duration_min)})
			.attr('stroke-width', '5px')
			.attr('opacity', 0);

		svg
			.append('text')
			.attr('text-anchor', 'end')
			.attr('class', 'x axis title')
			// .attr('transform', 'translate(' + width + ', 0)')
			.attr('x', width * 1.25)
			.attr('y', height + margin.top + 35)
			.text('');

		// avgLines.append("text")
		// .text(function(d) { return d.duration_min.toFixed(2); } )
		// .attr("x", function(d) {return x(d.duration_min)} )
		// .attr("y", function(d){ return y(d.album_name) + y.bandwidth()} );

		// barchart
		// @v4 Using .merge here to ensure
		// new and old data have same attrs applied
		var bars = g.selectAll('.bar').data(
			data.filter(function(d) {
				return d.album_name == 'JESUS IS KING';
			})
		);

		var barsE = bars.enter().append('rect').attr('class', 'bar');
		bars = bars
			.merge(barsE)
			.attr('x', 0)
			.attr('y', function(d) {
				return yBarScale(d.track_name);
			})
			.attr('fill', function(d) {
				return barColors(d.track_name);
			})
			.attr('width', 0)
			.attr('height', yBarScale.bandwidth());
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
		activateFunctions[0] = showTitle;
		activateFunctions[1] = showAlbums;
		activateFunctions[2] = showAcousticness;
		activateFunctions[3] = showDanceability;
		activateFunctions[4] = showValence;
		activateFunctions[5] = focusKillingYou;
		activateFunctions[6] = focusKillingYou;
		activateFunctions[7] = focusBreatheIn;
		activateFunctions[8] = focusBreatheIn;
		activateFunctions[9] = showBar;
		activateFunctions[10] = splitSongs;
		activateFunctions[11] = showBar;
		// activateFunctions[12] = focusJesusIsKing;
		// activateFunctions[13] = focusJesusIsKing;

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
		for (var i = 0; i < 13; i++) {
			updateFunctions[i] = function() {};
		}
		//updateFunctions[7] = updateCough;
	};

	/**
   **/

	function showTitle() {
		hover_circle.on('mouseover', tip.style('opacity', 0));

		g.selectAll('.kanye-image').transition().duration(1000).attr('opacity', 1);
		g.selectAll('.album-image').transition().duration(1000).attr('opacity', 0);

		g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 0);
		g.selectAll('.tick text').transition().duration(1000).attr('opacity', 0);
		avgLines.transition().duration(1000).attr('opacity', 0);
		hover_circle.transition().duration(1000).attr('opacity', 0);
		d3.selectAll('.x.axis.title').transition().duration(1000).text('');
	}

	function showAlbums() {
		hover_circle.on('mouseover', tip.style('opacity', 0));

		g.selectAll('.kanye-image').transition().duration(1000).attr('opacity', 0);
		g.selectAll('.album-image').transition().duration(1000).attr('opacity', 1);

		g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 0);
		g.selectAll('.tick text').transition().duration(1000).attr('opacity', 0);
		avgLines.transition().duration(1000).attr('opacity', 0);
		hover_circle.transition().duration(1000).attr('opacity', 0);
		d3.selectAll('.x.axis.title').transition().duration(1000).text('');
	}

	function showAcousticness() {
		// REMOVE OLD
		g.selectAll('.kanye-image').transition().duration(1000).attr('opacity', 0);
		g.selectAll('.album-image').transition().duration(1000).attr('opacity', 0);

		// UPDATE AXES
		g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 1);
		g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 1);
		g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 1);
		g.selectAll('.tick text').transition().duration(1000).attr('opacity', 1);

		//
		album_names = jz.arr.sortBy(averages_data, 'acousticness', 'desc');
		console.log(album_names);
		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);

		x.domain([
			d3.min(data_full, function(d) {
				return d.acousticness * 0.9;
			}),
			d3.max(data_full, function(d) {
				return d.acousticness * 1.1;
			})
		]);

		g.selectAll('g.axis.y.right').call(
			y_axis_right.tickFormat(function(d) {
				return album_names
					.filter(function(c) {
						return c.album_name == d;
					})[0]
					.acousticness.toFixed(2);
			})
		);
		g.selectAll('g.axis.y.left').call(y_axis_left);
		g.selectAll('g.axis.x').call(x_axis);

		// //update all circles to new positions
		hover_circle
			.transition()
			.duration(1000)
			.attr('cx', function(d) {
				return x(d.acousticness);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.acousticness);
			})
			.attr('opacity', 0.55)
			.attr('r', radius);

		hover_circle.on('mouseover', function(d) {
			tip.html(
				"<span style = 'font-weight:bold'>" +
					d.track_name +
					' | ' +
					d.album_name +
					'</span><hr>Acousticness: ' +
					d.acousticness.toFixed(2)
			);
			tip
				.style('left', d3.select(this).attr('cx') + 'px')
				.style('top', d3.select(this).attr('cy') + 'px')
				.style('opacity', 1);
		});

		avgLines
			.transition()
			.duration(1000)
			.attr('x1', function(d) {
				return x(d.acousticness);
			})
			.attr('x2', function(d) {
				return x(d.acousticness);
			})
			.attr('y1', function(d) {
				return y(d.album_name) + y.bandwidth() - 30;
			})
			.attr('y2', function(d) {
				return y(d.album_name) + y.bandwidth() - 10;
			})
			.attr('opacity', 1);

		d3.selectAll('.x.axis.title').transition().duration(1000).text('Acousticness');
	}

	function showDanceability() {
		g.selectAll('.kanye-image').transition().duration(1000).attr('opacity', 0);

		album_names = jz.arr.sortBy(averages_data, 'danceability', 'desc');
		console.log(album_names);
		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);

		x.domain([
			d3.min(data_full, function(d) {
				return d.danceability * 0.9;
			}),
			d3.max(data_full, function(d) {
				return d.danceability * 1.1;
			})
		]);

		g.selectAll('g.axis.y.right').call(
			y_axis_right.tickFormat(function(d) {
				return album_names
					.filter(function(c) {
						return c.album_name == d;
					})[0]
					.danceability.toFixed(2);
			})
		);
		g.selectAll('g.axis.y.left').call(y_axis_left);
		g.selectAll('g.axis.x').call(x_axis);

		hover_circle
			.transition()
			.duration(1000)
			.attr('opacity', 0.55)
			.attr('cx', function(d) {
				return x(d.danceability);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.danceability);
			})
			.attr('r', radius);

		hover_circle.on('mouseover', function(d) {
			tip.html(
				"<span style = 'font-weight:bold'>" +
					d.track_name +
					' | ' +
					d.album_name +
					'</span><hr>Danceability: ' +
					d.danceability.toFixed(2)
			);
			tip
				.style('left', d3.select(this).attr('cx') + 'px')
				.style('top', d3.select(this).attr('cy') + 'px')
				.style('opacity', 1);
		});

		avgLines
			.transition()
			.duration(1000)
			.attr('x1', function(d) {
				return x(d.danceability);
			})
			.attr('x2', function(d) {
				return x(d.danceability);
			})
			.attr('y1', function(d) {
				return y(d.album_name) + y.bandwidth() - 30;
			})
			.attr('y2', function(d) {
				return y(d.album_name) + y.bandwidth() - 10;
			})
			.attr('opacity', 1);

		d3.selectAll('.x.axis.title').transition().duration(1000).text('Danceability');
	}

	function showValence() {
		g.selectAll('.kanye-image').transition().duration(1000).attr('opacity', 0);

		album_names = jz.arr.sortBy(averages_data, 'valence', 'desc');
		console.log(album_names);
		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);

		x.domain([
			d3.min(data_full, function(d) {
				return d.valence * 0.9;
			}),
			d3.max(data_full, function(d) {
				return d.valence * 1.1;
			})
		]);

		g.selectAll('g.axis.y.right').call(
			y_axis_right.tickFormat(function(d) {
				return album_names
					.filter(function(c) {
						return c.album_name == d;
					})[0]
					.valence.toFixed(2);
			})
		);
		g.selectAll('g.axis.y.left').call(y_axis_left);
		g.selectAll('g.axis.x').call(x_axis);

		hover_circle
			.transition()
			.duration(1000)
			.attr('opacity', 0.55)
			.attr('cx', function(d) {
				return x(d.valence);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.valence);
			})
			.attr('r', radius);

		hover_circle.on('mouseover', function(d) {
			tip.html(
				"<span style = 'font-weight:bold'>" +
					d.track_name +
					' | ' +
					d.album_name +
					'</span><hr>Valence: ' +
					d.valence.toFixed(2)
			);
			tip
				.style('left', d3.select(this).attr('cx') + 'px')
				.style('top', d3.select(this).attr('cy') + 'px')
				.style('opacity', 1);
		});

		avgLines
			.transition()
			.duration(1000)
			.attr('x1', function(d) {
				return x(d.valence);
			})
			.attr('x2', function(d) {
				return x(d.valence);
			})
			.attr('y1', function(d) {
				return y(d.album_name) + y.bandwidth() - 30;
			})
			.attr('y2', function(d) {
				return y(d.album_name) + y.bandwidth() - 10;
			})
			.attr('opacity', 1);

		d3.selectAll('.x.axis.title').transition().duration(1000).text('Valence');
	}

	function focusJesusIsKing() {
		g.selectAll('circle').transition().duration(1000).attr('r', radius).attr('opacity', function(d) {
			return d.album_name == 'JESUS IS KING' ? 0.55 : 0.05;
		});

		hover_circle.on('mouseover', function(d) {
			tip.html(
				"<span style = 'font-weight:bold'>" +
					d.track_name +
					' | ' +
					d.album_name +
					'</span><hr>Valence: ' +
					d.valence.toFixed(2)
			);
			tip
				.style('left', d3.select(this).attr('cx') + 'px')
				.style('top', d3.select(this).attr('cy') + 'px')
				.style('opacity', 1);
		});

		hover_circle
			.transition()
			.duration(1000)
			.attr('opacity', 0.55)
			.attr('cx', function(d) {
				return x(d.valence);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.valence);
			})
			.attr('r', radius);

		g.selectAll('g.axis.y.right').call(
			y_axis_right.tickFormat(function(d) {
				return album_names
					.filter(function(c) {
						return c.album_name == d;
					})[0]
					.valence.toFixed(2);
			})
		);
		g.selectAll('g.axis.y.left').call(y_axis_left);
		g.selectAll('g.axis.x').call(x_axis);

		// hover_circle.on('mouseover', tip.style('opacity', 1));

		g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 1);
		g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 1);
		g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 1);
		g.selectAll('.tick text').transition().duration(1000).attr('opacity', 1);
		avgLines.transition().duration(1000).attr('opacity', 1);
		d3.selectAll('.x.axis.title').transition().duration(1000).text('Valence');
	}

	function focusKillingYou() {
		// showValence();

		hover_circle
			.transition()
			.duration(1000)
			.attr('opacity', 0.55)
			.attr('cx', function(d) {
				return x(d.valence);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.valence);
			})
			.attr('opacity', function(d) {
				return d.track_name == 'I Thought About Killing You' ? 0.55 : 0.05;
			})
			.attr('r', function(d) {
				return d.track_name == 'I Thought About Killing You' ? 30 : radius;
			});
		avgLines.transition().duration(1000).attr('opacity', 0);
	}

	function focusBreatheIn() {
		hover_circle
			.transition()
			.duration(1000)
			.attr('opacity', 0.55)
			.attr('cx', function(d) {
				return x(d.valence);
			})
			.attr('cy', function(d) {
				return y(d.album_name) + y.bandwidth() / 2;
			})
			.attr('fill', function(d) {
				return color(d.valence);
			})
			.attr('opacity', function(d) {
				return d.track_name == 'Breathe In Breathe Out' ? 0.55 : 0.05;
			})
			.attr('r', function(d) {
				return d.track_name == 'Breathe In Breathe Out' ? 30 : radius;
			});

		avgLines.transition().duration(1000).attr('opacity', 0);
	}

	function splitSongs() {
		hover_circle.on('mouseover', tip.style('opacity', 0));

		g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 0);
		g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 0);
		g.selectAll('.tick text').transition().duration(1000).attr('opacity', 0);
		avgLines.transition().duration(1000).attr('opacity', 0);

		g.selectAll('circle').transition().duration(1000).attr('opacity', 0);

		d3.selectAll('.x.axis.title').transition().duration(1000).text('');

		data_JIK = data_full.filter(function(d) {
			return d.album_name == 'JESUS IS KING';
		});
		console.log(data_JIK);
	}

	/**
   * showBar - barchart
   *
   * hides: beeswarm
   * shows: barchart
   *
   */
	function showBar() {
		d3.csv('data/bars_data.csv', function(error, data) {
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

			// //set up svg using margin conventions - we'll need plenty of room on the left for labels
			// var margin = {
			// 	top    : 15,
			// 	right  : 40,
			// 	bottom : 15,
			// 	left   : 150
			// };

			// var margin = { top: radius * 5 + 30, left: 170, bottom: 50, right: 40 },
			// 	width = 900 - margin.left - margin.right,
			// 	// width = +jz.str.keepNumber(d3.select('#vis').style('width')) - margin.left - margin.right,
			// 	height = 600 - margin.top - margin.bottom;

			// svg = d3
			// 	.select('#vis')
			// 	.append('svg')
			// 	.attr('width', width + margin.left + margin.right)
			// 	.attr('height', height + margin.top + margin.bottom)
			// 	.append('g')
			// 	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var xBarScale = d3.scaleLinear().range([ 0, width ]).domain([
				0,
				d3.max(data, function(d) {
					return d.valence;
				})
			]);

			var yBarScale = d3.scaleBand().rangeRound([ height, 0 ], 0.05).domain(
				data.map(function(d) {
					return d.track_name;
				})
			);

			//make y axis to show bar names
			var yAxisBar = d3.axisLeft().scale(yBarScale).tickSize(0);

			var gy = svg.append('g').attr('class', 'y axis').call(yAxisBar);

			var bars = svg.selectAll('.bar').data(data).enter().append('g');

			console.log(bars);

			//append rects
			bars
				.append('rect')
				.attr('class', 'bar')
				.attr('y', function(d) {
					return yBarScale(d.track_name);
				})
				.attr('height', y.bandwidth())
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
					return yBarScale(d.track_name) + y.bandwidth() / 2 + 4;
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

			console.log(bars);
		});

		// // OLD
		// // ensure bar axis is set
		// showAxis(xAxisBar);
		// g.selectAll('g.axis.x').transition().duration(1000).attr('opacity', 0);
		// g.selectAll('g.axis.y.right').transition().duration(1000).attr('opacity', 0);
		// g.selectAll('g.axis.y.left').transition().duration(1000).attr('opacity', 0);
		// g.selectAll('.tick text').transition().duration(1000).attr('opacity', 0);
		// avgLines.transition().duration(1000).attr('opacity', 0);
		// g.selectAll('circle').transition().duration(1000).attr('opacity', 0);
		// d3.selectAll('.x.axis.title').transition().duration(1000).text('');
		// xBarScale.domain([ 0, 1 ]);
		// var album_names = jz.arr.sortBy(
		// 	data_full.filter(function(d) {
		// 		return d.album_name == 'JESUS IS KING';
		// 	}),
		// 	'valence',
		// 	'desc'
		// );
		// console.log(album_names);
		// yBarScale.domain(
		// 	album_names.map(function(d) {
		// 		return d.track_name;
		// 	})
		// );
		// g.selectAll('.bar').transition().duration(1000).attr('width', function(d) {
		// 	return xBarScale(d.valence);
		// });
		// g.selectAll('.bar-text').transition().duration(600).delay(1200).attr('opacity', 1);
	}

	/**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
	function showAxis(axis) {
		g.select('g.axis.x').call(axis).transition().duration(500).style('opacity', 1);
	}

	/**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

	function getData(data) {
		data.forEach(function(d) {
			d.album_release_year = +d.album_release_year;
			d.danceability = +d.danceability;
			d.tempo = +d.tempo;
			d.energy = +d.energy;
			d.loudness = +d.loudness;
			d.mode = +d.mode;
			d.speechiness = +d.speechiness;
			d.acousticness = +d.acousticness;
			d.instrumentalness = +d.instrumentalness;
			d.liveness = +d.liveness;
			d.valence = +d.valence;
			d.duration_ms = +d.duration_ms;
			d.duration_sec = +d.duration_ms / 1000;
			d.duration_min = +d.duration_sec / 60;
			d.key = +d.key;
			return d;
		});

		data_full = data;
		// the following groups by album name and spits out average danceability, tempo, etc.
		// it allows for better ordering on the y axis
		// https://stackoverflow.com/questions/51040651/group-by-and-calculate-mean-average-of-properties-in-a-javascript-array
		// Calculate the sums and group data (while tracking count)
		reduced = data.reduce(function(m, d) {
			if (!m[d.album_name]) {
				m[d.album_name] = { ...d, count: 1 };
				return m;
			}
			m[d.album_name].danceability += d.danceability;
			m[d.album_name].tempo += d.tempo;
			m[d.album_name].energy += d.energy;
			m[d.album_name].loudness += d.loudness;
			m[d.album_name].mode += d.mode;
			m[d.album_name].speechiness += d.speechiness;
			m[d.album_name].acousticness += d.acousticness;
			m[d.album_name].instrumentalness += d.instrumentalness;
			m[d.album_name].liveness += d.liveness;
			m[d.album_name].valence += d.valence;
			m[d.album_name].key += d.key;
			m[d.album_name].duration_min += d.duration_min;
			m[d.album_name].count += 1;
			return m;
		}, {});

		averages_data = Object.keys(reduced).map(function(k) {
			const item = reduced[k];
			return {
				album_name       : item.album_name,
				tempo            : item.tempo / item.count,
				danceability     : item.danceability / item.count,
				energy           : item.energy / item.count,
				loudness         : item.loudness / item.count,
				mode             : item.mode / item.count,
				speechiness      : item.speechiness / item.count,
				acousticness     : item.acousticness / item.count,
				instrumentalness : item.instrumentalness / item.count,
				liveness         : item.liveness / item.count,
				valence          : item.valence / item.count,
				key              : item.key / item.count,
				duration_min     : item.duration_min / item.count
			};
		});
	}

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
d3.csv('data/song_data.csv', display);
