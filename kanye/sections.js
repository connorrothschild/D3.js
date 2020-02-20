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

	var margin = { top: radius * 5 + 10, left: 190, bottom: 30, right: 40 },
		width = 900 - margin.left - margin.right,
		// width = +jz.str.keepNumber(d3.select('#wrapper').style('width')) - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom,
		svg = d3
			.select('svg')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

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
		// axis

		tip = d3.select('svg').append('div').attr('class', 'tip');

		min_danceability = d3.min(data, function(d) {
			return d.danceability * 0.9;
		});
		max_danceability = d3.max(data, function(d) {
			return d.danceability * 1.1;
		});
		min_acousticness = d3.min(data, function(d) {
			return d.acousticness * 0.9;
		});
		max_acousticness = d3.max(data, function(d) {
			return d.acousticness * 1.1;
		});

		var album_names = jz.arr.sortBy(averages_data, 'danceability', 'desc');

		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);
		x.domain([ min_danceability, max_danceability ]);
		x_axis.tickSizeInner(-height + y.bandwidth() / 2 - 3);

		svg
			.append('g')
			.attr('class', 'axis y left')
			.call(y_axis_left)
			.selectAll('.tick text')
			.attr('dx', +radius)
			// correct:
			// .attr('dx', -radius)
			.attr('dy', y.bandwidth() - 50);

		svg
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
			.attr('fill', 'black');

		svg.append('g').attr('class', 'axis x').attr('transform', 'translate(0, ' + height + ')').call(x_axis);
		// .selectAll('.tick line')
		// .style('display', 'none');

		forceSim();

		draw();

		window.addEventListener('resize', function() {
			// all of these things need to be updated on resize
			width = +jz.str.keepNumber(d3.select('svg').style('width')) - margin.left - margin.right;

			d3
				.select('.axis.y.right')
				.attr('transform', 'translate(' + width + ', 0)')
				.call(y_axis_right.tickSizeInner(-width));

			x.rangeRound([ 0, width ]);

			forceSim();

			d3.select('.x.axis').call(x_axis);

			draw();
		});

		function draw() {
			color = d3
				.scaleLinear()
				.domain(
					d3.extent(data, function(d) {
						return d.x;
					})
				)
				.range([ 'steelblue', 'brown' ])
				.interpolate(d3.interpolateHsl);

			// hover
			hover_circle = svg
				.selectAll('circle')
				.data(data)
				.enter()
				.append('circle')
				.attr('r', radius)
				.attr('fill', function(d) {
					return color(d.x);
				})
				.attr('opacity', 0.6)
				.attr('stroke', 'black')
				.attr('cx', function(d) {
					return x(d.danceability);
				})
				.attr('cy', function(d) {
					return y(d.album_name) + y.bandwidth() / 2;
				})
				.on('mouseover', function(d) {
					tip.html(
						"<span style = 'font-weight:bold'>" + d.track_name + '</span><hr>' + d.danceability.toFixed(2)
					);

					console.log(d.track_name);

					// d3.select(".circle-" + d.data.slug).attr("r", radius * 2.5).moveToFront();
					// d3.select(".circle-bg-" + d.data.slug).style("fill-opacity", 0).attr("r", radius * 2.5).style("stroke-width", 3).moveToFront();

					tip_width = +jz.str.keepNumber(tip.style('width'));
					tip_height = +jz.str.keepNumber(tip.style('height'));

					circle_node = d3.select(this).node().getBoundingClientRect();
					circle_left = circle_node.left;
					circle_top = circle_node.top;

					tip_left = circle_left - tip_width / 2 + radius;
					tip_top = circle_top - radius - tip_height;

					tip.style('left', 0 + 'px').style('top', 100 + 'px').style('opacity', 1);
				})
				.on('mouseout', function(d) {
					// d3.select(".circle-" + d.data.slug).attr("r", radius);
					// d3.select(".circle-bg-" + d.data.slug).style("fill-opacity", .3).attr("r", radius).style("stroke-width", 1);

					tip.style('opacity', 0);
				});

			// svg.selectAll('circle').transition().duration(1000).style('opacity', 0)
			// svg.selectAll('circle').transition().duration(10000).attr("cx", function(d) {return x(d.tempo)})
			// svg.selectAll('circle').transition().duration(1000).attr('opacity', function(d) {return d.album_name == "JESUS IS KING" ? .55 : 0})
		}

		function forceSim() {
			var simulation = d3
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

			for (var i = 0; i < 182; ++i) simulation.tick();
		}

		//https://bl.ocks.org/tomshanley/raw/e1f2a325793bc9e76fbfaa58ea6a6d15/2c781f3e92ea3f697ab3df8e990291ea6abbf2d1/roi-pre.js
		//https://bl.ocks.org/tomshanley/raw/e1f2a325793bc9e76fbfaa58ea6a6d15/2c781f3e92ea3f697ab3df8e990291ea6abbf2d1/
		avgLines = svg.selectAll('.avg-lines').data(averages_data).enter().append('g').attr('class', 'avg-line');
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
			.attr('opacity', 0.9);

		// avgLines.append("text")
		// .text(function(d) { return d.duration_min.toFixed(2); } )
		// .attr("x", function(d) {return x(d.duration_min)} )
		// .attr("y", function(d){ return y(d.album_name) + y.bandwidth()} );
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
		activateFunctions[0] = showAcousticness;
		activateFunctions[1] = showDanceability;
		activateFunctions[2] = showAcousticness;
		activateFunctions[3] = showDanceability;
		activateFunctions[4] = showAcousticness;
		activateFunctions[5] = showDanceability;
		activateFunctions[6] = showAcousticness;
		activateFunctions[7] = showDanceability;
		activateFunctions[8] = showAcousticness;
		activateFunctions[9] = showDanceability;
		activateFunctions[10] = showAcousticness;
		activateFunctions[11] = showDanceability;
		activateFunctions[12] = showAcousticness;
		activateFunctions[13] = showDanceability;

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

	function showAcousticness() {
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
				return color(d.x);
			});

		hover_circle.on('mouseover', function(d) {
			tip.html("<span style = 'font-weight:bold'>" + d.track_name + '</span><hr>' + d.acousticness.toFixed(2));
			tip.style('left', 0 + 'px').style('top', 100 + 'px').style('opacity', 1);
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
			});

		album_names = jz.arr.sortBy(averages_data, 'acousticness', 'desc');
		console.log(album_names);
		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);

		x.domain([ min_acousticness, max_acousticness ]);

		svg.selectAll('g.axis.y.right').call(y_axis_right);
		svg.selectAll('g.axis.y.left').call(y_axis_left);
		svg.selectAll('g.axis.x').call(x_axis);
	}

	function showDanceability() {
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
				return color(d.x);
			});

		hover_circle.on('mouseover', function(d) {
			tip.html("<span style = 'font-weight:bold'>" + d.track_name + '</span><hr>' + d.danceability.toFixed(2));
			tip.style('left', 0 + 'px').style('top', 100 + 'px').style('opacity', 1);
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
			});

		album_names = jz.arr.sortBy(averages_data, 'danceability', 'desc');
		console.log(album_names);
		y.domain(
			album_names.map(function(d) {
				return d.album_name;
			})
		);

		x.domain([ min_danceability, max_danceability ]);

		svg.selectAll('g.axis.y.right').call(y_axis_right);
		svg.selectAll('g.axis.y.left').call(y_axis_left);
		svg.selectAll('g.axis.x').call(x_axis);
	}

	function focusKanye() {
		svg.selectAll('circle').transition().duration(1000).attr('opacity', function(d) {
			return d.album_name == 'JESUS IS KING' ? 0.55 : 0.05;
		});
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
