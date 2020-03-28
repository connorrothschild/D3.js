var svg = d3.select('svg').attr('class', 'my_chart').attr('height', 600).attr('width', 960).call(responsivefy);

var path = d3.geoPath();
var radius = d3.scaleSqrt().domain([ 0, 5000 ]).range([ 0, 50 ]);
var format = d3.format('');
var height = 600;
var width = 960;

// thanks to https://brendansudol.com/writing/responsive-d3 for this function!
function responsivefy(svg) {
	const container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style('width'), 10),
		height = parseInt(svg.style('height'), 10),
		aspect = width / height;

	svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMinYMid').call(resize);

	d3.select(window).on('resize.' + container.attr('id'), resize);

	function resize() {
		const w = parseInt(container.style('width'));
		svg.attr('width', w);
		svg.attr('height', Math.round(w / aspect));
	}
}

var g = svg.append('g').attr('transform', 'translate(0,40)');

queue()
	.defer(d3.json, 'https://d3js.org/us-10m.v1.json')
	// .defer(d3.csv, "us-counties.csv")
	.defer(d3.csv, 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv')
	.await(ready);

function ready(error, us, covid_data) {
	if (error) throw error;

	var rateById = {};
	var nameById = {};

	covid_data.forEach(function(d) {
		d.cases = +d.cases;
		rateById[d.fips] = +d.cases;
		nameById[d.fips] = d.county;
	});

	counties = svg
		.append('g')
		.attr('class', 'counties')
		.selectAll('path')
		.data(topojson.feature(us, us.objects.counties).features)
		.enter()
		.append('path')
		.attr('d', path)
		.attr('stroke', 'grey')
		.attr('stroke-width', 0)
		.attr('stroke-linejoin', 'round');

	counties.style('fill', '#F2F2F2');

	// create nation
	svg
		.append('path')
		.datum(topojson.feature(us, us.objects.nation))
		.attr('class', 'land')
		.attr('d', path)
		.attr('fill', 'none');

	// create states
	states = svg
		.append('path')
		.datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
		.attr('fill', 'none')
		.attr('stroke', 'grey')
		.attr('stroke-width', 0.2)
		.attr('stroke-linejoin', 'round')
		.attr('d', path);

	// create bubbles
	svg
		.append('g')
		.attr('class', 'bubble')
		.selectAll('circle')
		.data(
			topojson.feature(us, us.objects.counties).features.sort(function(a, b) {
				return b.cases - a.cases;
			})
		)
		.enter()
		.append('circle')
		.attr('transform', function(d) {
			return 'translate(' + path.centroid(d) + ')';
		})
		.attr('r', function(d) {
			return radius(rateById[d.id]);
		})
		.attr('fill', '#EB9898')
		.attr('opacity', 0.4)
		.attr('stroke', '#8b0000');
}
