// ht https://bl.ocks.org/SpaceActuary/d6b5ca8e5fb17842d652d0de21e88a05
// ht http://bl.ocks.org/eesur/be2abfb3155a38be4de4

// create the option inputs for the datalist above.
// this relies on a clean list of (non-duplicated) department names.
// from https://stackoverflow.com/questions/36804916/create-elements-for-datalist-in-d3
d3
	// .csv('https://raw.githubusercontent.com/connorrothschild/police-killings/master/data/department_data.csv')
	.csv('data/department_data.csv')
	.row(function(d) {
		return d.all_agencies;
	})
	.get(function(rows) {
		d3
			.select('#departments')
			.selectAll('option')
			.data(function(d) {
				return rows;
			}) // performing a data join
			.enter() // extracting the entering selection
			.append('option') // adding an option to the selection of options
			.attr('value', function(d) {
				return d;
			});
	});

// console.clear();

function responsivefy(svg) {
	// get container + svg aspect ratio
	var container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style('width')),
		height = parseInt(svg.style('height')),
		aspect = width / height;

	// add viewBox and preserveAspectRatio properties,
	// and call resize so that svg resizes on inital page load
	svg.attr('viewBox', '0 0 ' + width + ' ' + height).attr('perserveAspectRatio', 'xMinYMid').call(resize);

	// to register multiple listeners for same event type,
	// you need to add namespace, i.e., 'click.foo'
	// necessary if you call invoke this function for multiple svgs
	// api docs: https://github.com/mbostock/d3/wiki/Selections#on
	d3.select(window).on('resize.' + container.attr('id'), resize);

	// get width of container and resize svg to fit it
	function resize() {
		var targetWidth = parseInt(container.style('width'));
		svg.attr('width', targetWidth);
		svg.attr('height', Math.round(targetWidth / aspect));
	}
}

w = window.innerWidth * 0.9;
h = window.innerHeight * 0.6;

// console.log('Width: ' + window.innerWidth);

// map colors to race
var color = d3
	.scaleOrdinal()
	.domain([
		'Black',
		'White',
		'Asian',
		'Hispanic',
		'Unknown Race',
		'Unknown race',
		'Pacific Islander',
		'Native American'
	])
	.range([ '#BE3137', '#FFC600', '#59B359', '#4E070C', '#7B48AD', '#7B48AD', '#E96200', '#5F96CE' ]);

// define some forceDiagram parameters
var centerScale = d3.scalePoint().padding(0.8).range([ 0, w ]);
var forceStrength = 0.2;

// define svg
var svg = d3.select('svg').attr('width', w).attr('height', h).call(responsivefy);

// functions based on length etc, which change circle parameters, text, etc. according to length (number of people)
chargeStrength = function(length) {
	if (length > 120) {
		return -5;
	} else if (length > 100) {
		return -10;
	} else if (length > 60) {
		return -15;
	} else {
		return -20;
	}
};

// i should use a switch statement but its 1am
radiusFunction = function(length) {
	if (window.innerWidth < 1000) {
		// console.log('Small screen');
		if (length > 120) {
			return window.innerWidth / 100;
		} else if (length > 100) {
			return window.innerWidth / 80;
		} else if (length > 80) {
			return window.innerWidth / 75;
		} else if (length > 60) {
			return window.innerWidth / 70;
		} else if (length > 40) {
			return window.innerWidth / 65;
		} else if (length > 20) {
			return window.innerWidth / 50;
		} else if (length > 10) {
			return window.innerWidth / 45;
		} else if (length > 5) {
			return window.innerWidth / 2.255;
		} else if (length <= 5) {
			return window.innerWidth / 2.25;
		}
	} else {
		// console.log('Big screen');
		if (length > 1000) {
			return h / 150;
		} else if (length > 500) {
			return h / 100;
		} else if (length > 250) {
			return h / 75;
		} else if (length > 100) {
			return h / 50;
		} else if (length > 80) {
			return h / 45;
		} else if (length > 60) {
			return h / 40;
		} else if (length > 40) {
			return h / 25;
		} else if (length > 20) {
			return h / 22.5;
		} else if (length > 10) {
			return h / 25;
		} else if (length > 5) {
			return h / 15;
		} else if (length <= 5) {
			return h / 10;
		}
	}
};

locFunction = function(selected_loc) {
	if (selected_loc.trim() == '') {
		return 'Houston Police Department (TX)';
	} else {
		return selected_loc;
	}
};

personFunction = function(length) {
	if (length == 1) {
		return ' person';
	} else {
		return ' people';
	}
};

oneOfThemFunction = function(length) {
	if (length == 1) {
		return ' was that person.';
	} else {
		return ' was one of them.';
	}
};

pronounFunction = function(sex) {
	if (sex == 'Male') {
		return 'He was';
	} else if (sex == 'Female') {
		return 'She was';
	} else {
		return 'They were';
	}
};

ageFunction = function(age) {
	if (isNaN(age)) {
		return 'an unknown age ';
	} else if (age == 0) {
		return 'an unknown age ';
	} else {
		return 'a ' + age + ' year old ';
	}
};

// // h/t https://stackoverflow.com/questions/20438352/how-to-convert-date-to-words-in-html
var months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

dateFunction = function(date_str) {
	// remove timezone
	date_str = date_str.replace('T', '-');
	temp_date = date_str.split('-');
	return months[Number(temp_date[1] - 1)] + ' ' + temp_date[2] + ', ' + temp_date[0];
};

var radius = radiusFunction(length);
console.log(radius);

var body = d3.select('body');

var defs = svg.append('defs');

var labelPos = 35;

// // add the tooltip area to the webpage
var tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

// // define a function that moves circles to the front on hover
// // h/t https://gist.github.com/trtg/3922684
d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};

// create empty csv
var csv;

var selected_loc = 'Houston Police Department (TX)';

// d3.csv('https://raw.githubusercontent.com/connorrothschild/police-killings/master/data/cleaned_data.csv', function(
d3.csv('data/cleaned_data.csv', function(data) {
	// put all data in a csv (for later filtering)
	csv = data;

	var stateSelector = document.getElementById('stateText');
	var stateSelectorOptions = document.getElementById('stateSelector');
	var departmentSelector = document.getElementById('departmentSelector');

	d3.select('#departmentSelector').on('change', function() {
		// on selecting a department, undo anything and change css for state selector

		document.getElementById('stateSelector').selectedIndex = 0;
		stateSelector.style.color = 'grey';
		stateSelector.style.opacity = '.8';

		// and restore css of this selector!
		departmentSelector.style.color = 'black';
		departmentSelector.style.opacity = '1';

		var selected_loc = locFunction(this.value);
		applyFilter(selected_loc);
	});

	d3.select('#stateSelector').on('change', function() {
		// on selecting a department, undo anything and change css for state selector
		stateSelector.style.color = 'black';
		stateSelector.style.opacity = '1';

		// and restore css of this selector!
		document.getElementById('departmentSelector').value = '';
		departmentSelector.style.color = 'grey';
		departmentSelector.style.opacity = '.8';

		// finally, on state select, create a variable for the long state name, not abbreviation
		longStateName = stateSelectorOptions.options[stateSelectorOptions.selectedIndex].text;

		var selected_loc = this.value;
		applyStateFilter(selected_loc);
	});

	//// call this whenever the filter changes
	function applyFilter(selected_loc) {
		// change button selection to "all"
		// unselect all buttons
		d3.selectAll('.button').classed('active', false);
		// define button as first ('all)')
		var button = d3.select('.button');
		// set it as the active button
		button.classed('active', true);
		// hide titles
		hideTitles();

		// redefine selected location, city, etc./
		var selected_loc = selected_loc;
		// var selected_city = selected_loc.split(',')[0];
		// console.log(selected_loc);
		// console.log(selected_city);

		// filter the data
		data = csv.filter(function(d) {
			return d['Agency responsible for death'].includes(selected_loc);
		});
		// console.table(data);
		// console.log(data.length);

		// redefine length, radius
		var length = data.length;
		var radius = radiusFunction(length);

		// redefine data
		data.forEach(function(d) {
			d.Age = +d.Age;
			d.r = radius;
			d.x = w / 2;
			d.y = h / 2.25;
		});

		function namePlural(length) {
			if (length > 1) {
				return 'names';
			} else {
				return 'name';
			}
		}

		// change top level text
		d3
			.select('.subtitle')
			.html(
				'From 2013-2020, the ' +
					selected_loc +
					' killed ' +
					'<u>' +
					length +
					personFunction(length) +
					'</u>.' +
					'<br> Do you know their ' +
					namePlural(length) +
					'?'
			);
		d3.select('.thirdtitle').html('Click for more information on an incident.');

		var simulation = d3
			.forceSimulation(data)
			.force(
				'collide',
				d3.forceCollide(function(d) {
					return d.r;
				})
			)
			.force('charge', d3.forceManyBody().strength(chargeStrength(length)))
			// center the circles
			.force('y', d3.forceY().y(h / 2.25))
			.force('x', d3.forceX().x(w / 2))
			.on('tick', ticked);

		var body = d3.select('body');

		var defs = svg.append('defs');

		var patterns = defs
			.selectAll('circle')
			.data(data)
			.enter()
			.append('pattern')
			.attr('id', function(d) {
				return d.ID;
			})
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('patternContentUnits', 'objectBoundingBox');

		var images = patterns
			.append('svg:image')
			.attr('xlink:href', function(d) {
				//// UNCOMMENT TO RESTORE IMAGES
				// if (d.Image !== '') {
				// 	return d.Image;
				// } else {
				return 'images/default.jpg';
				// }
			})
			// if image is undefined, return default
			// https://stackoverflow.com/questions/39988146/how-to-catch-svg-image-fail-to-load-in-d3
			.on('error', function(d) {
				this.setAttribute('href', 'images/default.jpg');
			})
			.attr('width', 1)
			.attr('height', 1);

		var circles = svg
			.selectAll('circle')
			.data(data)
			.enter()
			.append('svg:circle')
			.attr('class', 'circle')
			.attr('r', function(d, i) {
				return d.r;
			})
			.attr('cx', function(d, i) {
				return d.x;
			})
			.attr('cy', function(d, i) {
				return d.y;
			})
			//// UNCOMMENT TO RESTORE IMAGES
			//// append images to circles. see https://www.youtube.com/watch?v=FUJjNG4zkWY&t=261s
			// .attr('fill', function(d) {
			// 	return 'url(#' + d.ID + ')';
			// })
			.style('stroke', function(d, i) {
				return color(d.Race);
			})
			// alt: return color(d.ID);})
			.style('stroke-width', 2)
			.style('pointer-events', 'all');

		// make the image grow a little on mouse over and add the text details on click
		setEvents = circles
			// change top level text on click
			.on('click', function(d) {
				d3.select('.subtitle').html(function() {
					// introducing a function for conditional formatting of .subtitle
					// https://stackoverflow.com/questions/34454246/d3-js-conditional-tooltip-html
					if (d.Name == 'Name withheld by police') {
						return (
							'From 2013-2020, the' +
							selected_loc +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							"This victim's name was withheld by police."
						);
					} else {
						return (
							'From 2013-2020, then' +
							selected_loc +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							'<span style = "font-weight:600">' +
							d.Name +
							'</span>' +
							oneOfThemFunction(length)
						);
					}
				});
				d3.select('.thirdtitle').html(function() {
					// same as above
					if (d.Name == 'Name withheld by police') {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of this victim⇢</a>'
						);
					} else {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of ' +
							d.Name +
							' ⇢</a>'
						);
					}
				});
			})
			.on('mouseenter', function() {
				d3
					.select(this) // select element in current context
					.moveToFront() // defined above! move it to the front
					.transition()
					.delay(150)
					.attr('r', function(d, i) {
						return radiusFunction(length) * 3;
					}); // change the radius
			})
			.on('mouseleave', function() {
				d3.select(this).transition().attr('r', function(d, i) {
					return d.r;
				}); // set back to normal radius
			})
			.on('mouseover', function(d) {
				tooltip.transition().delay(150).duration(500).style('opacity', 1);
				// the following creates a sentence like:
				/* James E. Lewis  was a 44 year old Black male.
          He was killed by gunshot and taser by the Springfield Police Department on January 1, 2017. */
				tooltip
					.html(
						'<span style = "font-weight:600">' +
						d.Name +
						'</span> ' + // James E. Lewis
						' was ' +
						ageFunction(d.Age) + // was a 44 year old
						d.Race + // Black
						' ' +
						d.Sex.toLowerCase() +
						'.' + // male.
						'<br>' +
						pronounFunction(d.Sex) +
						' killed by ' + // He was killed by
						d['Cause of death'].toLowerCase().replace(',', ' and') + //gunshot and taser
						' by the ' +
						d['Agencies responsible for death'].replace(',', ' and') + // by the Springfield Police Department
							' on ' +
							dateFunction(d.Date) +
							'.'
					) // on January 1, 2017.
					.style('left', d3.event.pageX + 30 + 'px')
					.style('top', d3.event.pageY - 30 + 'px');
			})
			.on('mouseout', function(d) {
				tooltip.transition().duration(500).style('opacity', 0);
			});

		function ticked() {
			// console.log("tick")
			// console.log(data.map(function(d){ return d.x; }));
			circles
				.attr('cx', function(d) {
					return d.x;
				})
				.attr('cy', function(d) {
					return d.y;
				});
		}

		function groupBubbles() {
			hideTitles();

			// @v4 Reset the 'x' force to draw the bubbles to the center.
			simulation
				// .forceSimulation(data)
				// .force(
				// 	'collide',
				// 	d3.forceCollide(function(d) {
				// 		return d.r;
				// 	})
				// )
				// .force('charge', d3.forceManyBody().strength(chargeStrength(length)))
				// center the circles
				// .force('y', d3.forceY().y(h / 2.25))
				.force('x', d3.forceX().x(w / 2));
			// .on('tick', ticked);

			// @v4 We can reset the alpha value and restart the simulation
			simulation.alpha(1).restart();
		}

		function splitBubbles(byVar) {
			centerScale.domain(
				data.map(function(d) {
					return d[byVar];
				})
			);

			if (byVar == 'all') {
				groupBubbles();
			} else {
				showTitles(byVar, centerScale);

				// @v4 Reset the 'x' force to draw the bubbles to their centers
				simulation.force(
					'x',
					d3.forceX().strength(forceStrength).x(function(d) {
						return centerScale(d[byVar]);
					})
				);

				// @v4 We can reset the alpha value and restart the simulation
				simulation.alpha(1).restart();
			}
		}

		function hideTitles() {
			svg.selectAll('.title').remove();
			svg.selectAll('.rect').remove();
		}

		function showTitles(byVar, scale) {
			var titles = svg.selectAll('.title').data(scale.domain());
			var rects = svg.selectAll('.rect').data(scale.domain());

			rects
				.enter()
				.append('rect')
				.attr('class', 'rect')
				.merge(rects)
				.attr('x', function(d) {
					return scale(d);
				})
				.attr('y', labelPos)
				.attr('transform', 'translate(-55,-14)')
				.attr('width', 110)
				.attr('height', 20)
				.style('fill', '#E5E5E3')
				.style('opacity', 1);
			// .style('stroke-width', 0.5)
			// .style('stroke', 'black');

			rects.moveToFront();

			titles
				.enter()
				.append('text')
				.attr('class', 'title')
				.merge(titles)
				.attr('x', function(d) {
					return scale(d);
				})
				.attr('y', labelPos)
				.attr('text-anchor', 'middle')
				.text(function(d) {
					return d;
				});

			titles.moveToFront();
			// .call(wrap, 30);
			// to do: add # of obs after text (e.g. "Unarmed (6 people)")

			titles.exit().remove();
			rects.exit().remove();
		}

		function setupButtons() {
			d3.selectAll('.button').on('click', function() {
				// Remove active class from all buttons
				d3.selectAll('.button').classed('active', false);
				// Find the button just clicked
				var button = d3.select(this);

				// Set it as the active button
				button.classed('active', true);

				// Get the id of the button
				var buttonId = button.attr('id');

				// console.log(buttonId);
				// Toggle the bubble chart based on
				// the currently clicked button.
				splitBubbles(buttonId);
			});
		}

		setupButtons();

		var t = d3.transition().duration(750);

		// this is where we style/update the new circles
		var circles = d3.selectAll('circle');

		circles.data(data).exit().remove();

		circles
			.transition(t)
			.attr('fill', function(d) {
				return 'url(#' + d.ID + ')';
			})
			//// debug: .attr("r", function(d){ return d.r*5; })
			.style('stroke', function(d, i) {
				return color(d.Race);
			})
			.attr('r', function(d) {
				return d.r;
			});

		circles = circles.enter().append('circle').merge(circles);

		circles
			// change top level text on click
			.on('click', function(d) {
				d3.select('.subtitle').html(function() {
					// introducing a function for conditional formatting of .subtitle
					// https://stackoverflow.com/questions/34454246/d3-js-conditional-tooltip-html
					if (d.Name == 'Name withheld by police') {
						return (
							'From 2013-2020, the ' +
							selected_loc +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							"This victim's name was withheld by police."
						);
					} else {
						return (
							'From 2013-2020, the' +
							selected_loc +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							'<span style = "font-weight:600">' +
							d.Name +
							'</span>' +
							oneOfThemFunction(length)
						);
					}
				});
				d3.select('.thirdtitle').html(function() {
					// same as above
					if (d.Name == 'Name withheld by police') {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of this victim⇢</a>'
						);
					} else {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of ' +
							d.Name +
							' ⇢</a>'
						);
					}
				});
			})
			.on('mouseenter', function() {
				// select element in current context
				d3.select(this).moveToFront().transition().attr('r', function(d, i) {
					return radiusFunction(length) * 3;
				});
			})
			// set back
			.on('mouseleave', function() {
				d3.select(this).transition().attr('r', function(d, i) {
					return d.r;
				});
			});

		// console.table(circles);

		// update patterns (ids for each)
		patterns.data(data).exit().remove();

		patterns.transition(t).attr('id', function(d) {
			return d.ID;
		});

		patterns = patterns.enter().append('pattern').merge(patterns);

		// console.table(patterns);

		// update images
		images.data(data).exit().remove();

		images.transition(t).attr('xlink:href', function(d) {
			//// UNCOMMENT TO RESOTRE IMAGES
			// if (d.Image !== '') {
			// 	return d.Image;
			// } else {
			return 'images/default.jpg';
			// }
		});

		images = images.enter().append('svg:image').merge(images);

		// console.table(images);

		// Update and restart the simulation.
		// https://bl.ocks.org/mbostock/1095795
		simulation.nodes(data).on('tick', ticked).alpha(1).restart();
	}

	//// call this whenever the filter changes
	function applyStateFilter(selected_loc) {
		// change button selection to "all"
		// unselect all buttons
		d3.selectAll('.button').classed('active', false);
		// define button as first ('all)')
		var button = d3.select('.button');
		// set it as the active button
		button.classed('active', true);
		// hide titles
		hideTitles();

		// redefine selected location, city, etc./
		var selected_loc = selected_loc;
		// var selected_city = selected_loc.split(',')[0];
		// console.log(selected_loc);
		// console.log(selected_city);

		// filter the data
		data = csv.filter(function(d) {
			return d.State == selected_loc;
		});
		// console.table(data);
		// console.log(data.length);

		// redefine length, radius
		var length = data.length;
		console.log(length);
		var radius = radiusFunction(length);
		console.log(radius);

		// redefine data
		data.forEach(function(d) {
			d.Age = +d.Age;
			d.r = radius;
			d.x = w / 2;
			d.y = h / 2.25;
		});

		function namePlural(length) {
			if (length > 1) {
				return 'names';
			} else {
				return 'name';
			}
		}

		// change top level text
		d3
			.select('.subtitle')
			.html(
				'From 2013-2020, ' +
					'police in ' +
					longStateName +
					' killed ' +
					'<u>' +
					length +
					personFunction(length) +
					'</u>.' +
					'<br> Do you know their ' +
					namePlural(length) +
					'?'
			);
		d3.select('.thirdtitle').html('Click for more information on an incident.');

		var simulation = d3
			.forceSimulation(data)
			.force(
				'collide',
				d3.forceCollide(function(d) {
					return d.r;
				})
			)
			.force('charge', d3.forceManyBody().strength(chargeStrength(length)))
			.force('y', d3.forceY().y(h / 2.25))
			.force('x', d3.forceX().x(w / 2))
			.on('tick', ticked);

		var body = d3.select('body');

		var defs = svg.append('defs');

		var patterns = defs
			.selectAll('circle')
			.data(data)
			.enter()
			.append('pattern')
			.attr('id', function(d) {
				return d.ID;
			})
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('patternContentUnits', 'objectBoundingBox');

		var images = patterns
			.append('svg:image')
			.attr('xlink:href', function(d) {
				//// UNCOMMENT TO RESTORE IMAGES
				// if (d.Image !== '') {
				// 	return d.Image;
				// } else {
				return 'images/default.jpg';
				// }
			})
			// if image is undefined, return default
			// https://stackoverflow.com/questions/39988146/how-to-catch-svg-image-fail-to-load-in-d3
			.on('error', function(d) {
				this.setAttribute('href', 'images/default.jpg');
			})
			.attr('width', 1)
			.attr('height', 1);

		var circles = svg
			.selectAll('circle')
			.data(data)
			.enter()
			.append('svg:circle')
			.attr('class', 'circle')
			.attr('r', function(d, i) {
				return d.r;
			})
			.attr('cx', function(d, i) {
				return d.x;
			})
			.attr('cy', function(d, i) {
				return d.y;
			})
			//// UNCOMMENT TO RESTORE IMAGES
			//// append images to circles. see https://www.youtube.com/watch?v=FUJjNG4zkWY&t=261s
			// .attr('fill', function(d) {
			// 	return 'url(#' + d.ID + ')';
			// })
			.style('stroke', function(d, i) {
				return color(d.Race);
			})
			// alt: return color(d.ID);})
			.style('stroke-width', 2)
			.style('pointer-events', 'all');

		// make the image grow a little on mouse over and add the text details on click
		setEvents = circles
			// change top level text on click
			.on('click', function(d) {
				d3.select('.subtitle').html(function() {
					// introducing a function for conditional formatting of .subtitle
					// https://stackoverflow.com/questions/34454246/d3-js-conditional-tooltip-html
					if (d.Name == 'Name withheld by police') {
						return (
							'From 2013-2020, the ' +
							longStateName +
							' police killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							"This victim's name was withheld by police."
						);
					} else {
						return (
							'From 2013-2020, the ' +
							longStateName +
							' police killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							'<span style = "font-weight:600">' +
							d.Name +
							'</span>' +
							oneOfThemFunction(length)
						);
					}
				});
				d3.select('.thirdtitle').html(function() {
					// same as above
					if (d.Name == 'Name withheld by police') {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of this victim⇢</a>'
						);
					} else {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of ' +
							d.Name +
							' ⇢</a>'
						);
					}
				});
			})
			.on('mouseenter', function() {
				d3
					.select(this) // select element in current context
					.moveToFront() // defined above! move it to the front
					.transition()
					.delay(150)
					.attr('r', function(d, i) {
						return radiusFunction(length) * 3;
					}); // change the radius
			})
			.on('mouseleave', function() {
				d3.select(this).transition().attr('r', function(d, i) {
					return d.r;
				}); // set back to normal radius
			})
			.on('mouseover', function(d) {
				tooltip.transition().delay(150).duration(500).style('opacity', 1);
				// the following creates a sentence like:
				/* James E. Lewis  was a 44 year old Black male.
          He was killed by gunshot and taser by the Springfield Police Department on January 1, 2017. */
				tooltip
					.html(
						'<span style = "font-weight:600">' +
						d.Name +
						'</span> ' + // James E. Lewis
						' was ' +
						ageFunction(d.Age) + // was a 44 year old
						d.Race + // Black
						' ' +
						d.Sex.toLowerCase() +
						'.' + // male.
						'<br>' +
						pronounFunction(d.Sex) +
						' killed by ' + // He was killed by
						d['Cause of death'].toLowerCase().replace(',', ' and') + //gunshot and taser
						' by the ' +
						d['Agencies responsible for death'].replace(',', ' and') + // by the Springfield Police Department
							' on ' +
							dateFunction(d.Date) +
							'.'
					) // on January 1, 2017.
					.style('left', d3.event.pageX + 30 + 'px')
					.style('top', d3.event.pageY - 30 + 'px');
			})
			.on('mouseout', function(d) {
				tooltip.transition().duration(500).style('opacity', 0);
			});

		function ticked() {
			// console.log("tick")
			// console.log(data.map(function(d){ return d.x; }));
			circles
				.attr('cx', function(d) {
					return d.x;
				})
				.attr('cy', function(d) {
					return d.y;
				});
		}

		function groupBubbles() {
			hideTitles();

			// @v4 Reset the 'x' force to draw the bubbles to the center.
			simulation
				// .forceSimulation(data)
				// .force(
				// 	'collide',
				// 	d3.forceCollide(function(d) {
				// 		return d.r;
				// 	})
				// )
				// .force('charge', d3.forceManyBody().strength(chargeStrength(length)))
				// center the circles
				// .force('y', d3.forceY().y(h / 2.25))
				.force('x', d3.forceX().x(w / 2));
			// .on('tick', ticked);

			// @v4 We can reset the alpha value and restart the simulation
			simulation.alpha(1).restart();
		}

		function splitBubbles(byVar) {
			centerScale.domain(
				data.map(function(d) {
					return d[byVar];
				})
			);

			if (byVar == 'all') {
				groupBubbles();
			} else {
				showTitles(byVar, centerScale);

				// @v4 Reset the 'x' force to draw the bubbles to their centers
				simulation.force(
					'x',
					d3.forceX().strength(forceStrength).x(function(d) {
						return centerScale(d[byVar]);
					})
				);

				// @v4 We can reset the alpha value and restart the simulation
				simulation.alpha(1).restart();
			}
		}

		function hideTitles() {
			svg.selectAll('.title').remove();
			svg.selectAll('.rect').remove();
		}

		function showTitles(byVar, scale) {
			var titles = svg.selectAll('.title').data(scale.domain());
			var rects = svg.selectAll('.rect').data(scale.domain());

			rects
				.enter()
				.append('rect')
				.attr('class', 'rect')
				.merge(rects)
				.attr('x', function(d) {
					return scale(d);
				})
				.attr('y', labelPos)
				.attr('transform', 'translate(-55,-14)')
				.attr('width', 110)
				.attr('height', 20)
				.style('fill', '#E5E5E3')
				.style('opacity', 1);
			// .style('stroke-width', 0.5)
			// .style('stroke', 'black');

			rects.moveToFront();

			titles
				.enter()
				.append('text')
				.attr('class', 'title')
				.merge(titles)
				.attr('x', function(d) {
					return scale(d);
				})
				.attr('y', labelPos)
				.attr('text-anchor', 'middle')
				.text(function(d) {
					return d;
				});

			titles.moveToFront();
			// .call(wrap, 30);
			// to do: add # of obs after text (e.g. "Unarmed (6 people)")

			titles.exit().remove();
			rects.exit().remove();
		}

		function setupButtons() {
			d3.selectAll('.button').on('click', function() {
				// Remove active class from all buttons
				d3.selectAll('.button').classed('active', false);
				// Find the button just clicked
				var button = d3.select(this);

				// Set it as the active button
				button.classed('active', true);

				// Get the id of the button
				var buttonId = button.attr('id');

				// console.log(buttonId);
				// Toggle the bubble chart based on
				// the currently clicked button.
				splitBubbles(buttonId);
			});
		}

		setupButtons();

		var t = d3.transition().duration(750);

		// this is where we style/update the new circles
		var circles = d3.selectAll('circle');

		circles.data(data).exit().remove();

		circles
			.transition(t)
			.attr('fill', function(d) {
				return 'url(#' + d.ID + ')';
			})
			//// debug: .attr("r", function(d){ return d.r*5; })
			.style('stroke', function(d, i) {
				return color(d.Race);
			})
			.attr('r', function(d) {
				return d.r;
			});

		circles = circles.enter().append('circle').merge(circles);

		circles
			// change top level text on click
			.on('click', function(d) {
				d3.select('.subtitle').html(function() {
					// introducing a function for conditional formatting of .subtitle
					// https://stackoverflow.com/questions/34454246/d3-js-conditional-tooltip-html
					if (d.Name == 'Name withheld by police') {
						return (
							'From 2013-2020, police in ' +
							longStateName +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							"This victim's name was withheld by police."
						);
					} else {
						return (
							'From 2013-2020, police in ' +
							longStateName +
							' killed ' +
							'<u>' +
							length +
							personFunction(length) +
							'</u>.' +
							'<br>' +
							'<span style = "font-weight:600">' +
							d.Name +
							'</span>' +
							oneOfThemFunction(length)
						);
					}
				});
				d3.select('.thirdtitle').html(function() {
					// same as above
					if (d.Name == 'Name withheld by police') {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of this victim⇢</a>'
						);
					} else {
						return (
							'Take me to a ' +
							"<a href='" +
							d.Link +
							"', target = '_blank'>" +
							'news article describing the death of ' +
							d.Name +
							' ⇢</a>'
						);
					}
				});
			})
			.on('mouseenter', function() {
				// select element in current context
				d3.select(this).moveToFront().transition().attr('r', function(d, i) {
					return radiusFunction(length) * 3;
				});
			})
			// set back
			.on('mouseleave', function() {
				d3.select(this).transition().attr('r', function(d, i) {
					return d.r;
				});
			});

		// console.table(circles);

		// update patterns (ids for each)
		patterns.data(data).exit().remove();

		patterns.transition(t).attr('id', function(d) {
			return d.ID;
		});

		patterns = patterns.enter().append('pattern').merge(patterns);

		// console.table(patterns);

		// update images
		images.data(data).exit().remove();

		images.transition(t).attr('xlink:href', function(d) {
			//// UNCOMMENT TO RESTORE IMAGES
			// if (d.Image !== '') {
			// 	return d.Image;
			// } else {
			return 'images/default.jpg';
			// }
		});

		images = images.enter().append('svg:image').merge(images);

		// console.table(images);

		// Update and restart the simulation.
		// https://bl.ocks.org/mbostock/1095795
		simulation.nodes(data).on('tick', ticked).alpha(1).restart();
	}

	// default on load
	applyFilter('Houston Police Department (TX)');
});
