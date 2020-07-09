/*

LIBRARIES LOADED IN GLOBAL:
    - d3
    - scrollama
    - intersection-observer
    - stickyfill
    - topojson@3
    - d3-legend
*/

// scollama code heavily adapted from
// https://pudding.cool/process/introducing-scrollama/
// https://raw.githubusercontent.com/jtanwk/us-solar-d3/master/js/script.js

// initial d3 selections for convenience
var container = d3.select('#scroll');
var graphic = container.select('.scroll__graphic');
var chart = graphic.selectAll('.plotArea');
var text = container.select('.scroll__text');
var step = text.selectAll('.step');

// initialize scrollama
var scroller = scrollama();

// resize function to set dimensions on load and on page resize
function handleResize() {
	// 1. update height of step elements for breathing room between steps
	var stepHeight = Math.floor(window.innerHeight * 0.9);
	step.style('height', stepHeight + 'px');

	// 2. update height of graphic element
	var bodyWidth = d3.select('body').node().offsetWidth;

	graphic.style('height', window.innerHeight + 'px');

	// 3. update width of chart by subtracting from text width
	var chartMargin = 10;
	var textWidth = text.node().offsetWidth;
	var chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
	var chartHeight = Math.floor(chartWidth * 0.66);

	chart.style('width', chartWidth + 'px').style('height', chartHeight + 'px');

	// 4. update dimensions of svg element in chart div
	var svg = d3.select('.plotArea is-active').select('svg');

	svg.attr('width', chartWidth + 'px').attr('height', chartHeight + 'px');

	// 5. tell scrollama to update new element dimensions
	scroller.resize();
}

function handleStepEnter(response) {
	// response = { element, direction, index }

	// change class for current text to active
	step.classed('is-active', false);
	step.classed('is-active', function(d, i) {
		return i === response.index;
	});

	// update svgs
	switch (response.index) {
		case 0:
			barPlotValence(bars_data, response);
			break;
		case 1:
			barPlotAcousticness(kanye_data, response);
			break;
		case 2:
			// makePlot2(bars_data, response);
			break;
		case 3:
			// makePlot3(long_kanye_data, response);
			break;
		case 4:
			// toggleChart(response);
			// makePlot4(song_kanye_data, response);
			break;
		case 5:
			// toggleChart(response);
			// enterPlot5(data_5);
			break;
	}

	// redraw chart upon display
	handleResize();
}

function toggleChart(response) {
	chart.classed('is-active', false);

	// if moving down to step 5, switch divs
	if (response.index === 5) {
		// toggle z-index
		chart.classed('is-active', function(d, i) {
			return i === 1;
		});
	} else {
		chart.classed('is-active', function(d, i) {
			return i === 0;
		});

		// reset circles
		d3.select('#mapPlot').select('svg').select('#plot').selectAll('.centroid').attr('opacity', 0);
	}
}

function setupStickyfill() {
	d3.selectAll('.sticky').each(function() {
		Stickyfill.add(this);
	});
}

// run initializer code once on page load
function scroll_init() {
	setupStickyfill();

	// call a resize on load to update width/height/position of elements
	handleResize();

	// setup the scrollama instance and bind scrollama event handlers
	scroller
		.setup({
			container : document.querySelector('#scroll'), // our outermost scrollytelling element
			graphic   : '.scroll__graphic', // the graphic
			text      : '.scroll__text', // the step container
			step      : '.scroll__text .step', // the step elements
			offset    : 0.5, // set the trigger to be 2/3 way down screen
			debug     : false // display the trigger offset for testing
		})
		.onStepEnter(handleStepEnter);

	// setup resize event
	window.addEventListener('resize', handleResize);
}

// LOAD DATA
Promise.all([
	d3.csv('data/bars_data.csv'),
	d3.csv('data/kanye_data.csv'),
	d3.csv('data/song_data.csv'),
	d3.csv('data/long_kanye_data.csv')
])
	.then((results) => {
		// assign separate references for each dataset
		this.bars_data = results[0];
		this.kanye_data = results[1];
		this.song_data = results[2];
		this.long_kanye_data = results[3];

		// topojson code adapted from
		// https://bl.ocks.org/almccon/410b4eb5cad61402c354afba67a878b8
		// and uses https://github.com/topojson/topojson
		// var topology = topojson.feature(results[2], results[2].objects.foo);
		// this.data_5 = topology;

		// Go!
		scroll_init(); // initialize scrollama
		svg_init(); // initialize svg divs, g containers common to all plots
		// makePlot5(data_5); // pre-draw map with invisible circles
	})
	.catch((error) => {
		console.log(error);
		document.getElementById('errMsg').innerHTML = error;
	});

//
