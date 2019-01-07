import React from "react";
import ReactDOM from "react-dom";
import ShadertoyReact from "shadertoy-react";
import math from "mathjs";
const Parser = require("expr-eval").Parser;

// TODO: pass n as a uniform;
// TODO: parse and only execute when it works.

const sliderStyle = {
	width: "100%",
};

const canvasContainerStyle = {
	width: "100%",
	height: "100%",
	display: "flex",
};

const sliderContainerStyle = {
	display: "flex",
	flexDirection: "column",
	margin: "60px 0 40px 30px",
	width: "350px",
};

const exampleStyle = {
	display: "flex",
	justifyContent: "space-between",
	marginBottom: "10px",
};

// cool funcs to try:
//
// rectangular:
// (a^2 + b^2) * x,
// ((a^2 + x^2) + a * b^2) / 10
// ((a + b) ^ 2 - a ^ 2 - b ^ 2) * 1.27
//
// polar:
// (r^ 2 + t) ^ 2 / 1000
// 1000 * t * x

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rowSize: 200,
			recFunc: "(x ^ 2 + y ^ 2) * n",
			polarFunc: "(a ^ 2 + t) ^ 2 / 1000",
			range: 100,
			size: 4,
			polar: false,
		};
		this.parser = new Parser();
	}

	componentDidMount = () => {
		this.setState({ value: this.state.range / 2 }, () => this.updateCanvas());
	};

	onSliderChange = e => {
		this.setState({ value: e.currentTarget.value }, () => this.updateCanvas());
	};

	onFunctionChange = e => {
		this.setState({
			[this.state.polar ? "polarFunc" : "recFunc"]: e.currentTarget.value,
		});
	};

	onRangeChange = e => {
		this.setState({ range: e.currentTarget.value });
	};

	onRefresh = e => {
		if (e.type === "keypress" && e.key !== "Enter") return false;
		this.updateCanvas();
	};

	onPolar = () => {
		this.setState({ polar: !this.state.polar }, () => this.updateCanvas());
	};

	updateCanvas = () => {
		const { size, rowSize, polarFunc, recFunc, range, polar } = this.state;
	};

	render = () => {
		const {
			size,
			rowSize,
			polarFunc,
			recFunc,
			range,
			value,
			polar,
		} = this.state;

		const containerStyle = {
			width: size * rowSize + 30,
			display: "flex",
			margin: "30px",
			fontFamily: "Helvetica",
			fontSize: "12px",
		};

		const yAxisStyle = {
			paddingRight: "5px",
			display: "flex",
			justifyContent: polar ? "center" : "space-between",
			flexDirection: "column",
			textAlign: "right",
			width: "30px",
			height: size * rowSize,
			fontSize: "16px",
			fontWeight: 600,
		};

		const xAxisStyle = {
			width: "100%",
			display: "flex",
			justifyContent: polar ? "center" : "space-between",
			paddingTop: "5px",
			fontSize: "16px",
			fontWeight: 600,
		};

		return (
			<div style={containerStyle}>
				<div style={{ marginRight: "30px" }}>
					<h2>FuncyOrgan</h2>
					<p style={{ width: "100%", fontSize: "14px" }}>
						This is a prototype for a kind of color organ I want to make. Every
						pixel of the grid has a corresponding (a,b) point in rectangular
						coordinates, or (r,t) point in polar coordinates, and displays a
						color plucked from the spectrum by a single integer value, which we
						compute using the function below.
						<br />
						<br />
						Use the input to write a function of 3 variables, using the two
						coordinate variables (a/b or r/t), and an input variable (x), as
						well as any constants. After clicking refresh, each pixel will be
						assigned its own version of this function obtained by plugging in
						its coordinates. This builds a 2 dimensional field of continous
						functions of x with gradually changing parameters. Use the slider to
						change the value for x and evaluate the pixels. The results map to
						integers, which map to colors on the spectrum. Some of the designs
						can be pretty freakin' sweet.
						<br />
						<br />
						Eventually I want a version using actual animation software, and a
						lot more pixels. The slider input is just a placeholder for an audio
						input in phase 2 of this project. I want the values for sound
						frequencies to control the color changes. Also, I might add more
						functions and more inputs to make things even weirder.
					</p>
					<br />
					<p>
						<u>Ex:</u>
					</p>
					<br />
					<div style={exampleStyle}>
						<em>(Rectangular)</em>
						<span style={{ letterSpacing: "1.5px" }}>
							f(x,y,n) = (x^2 + y^2) * n
						</span>
					</div>
					<div style={exampleStyle}>
						<em>(Polar)</em>
						<span style={{ letterSpacing: "1.5px" }}>
							f(r,t,n) = (r^ 2 + t) ^ 2 / 1000
						</span>
					</div>
					<div style={sliderContainerStyle}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<label
								htmlFor="function"
								style={{ paddingRight: "5px", letterSpacing: "1.5px" }}
							>
								<strong>{polar ? "f(r,t,n)=" : "f(x,y,n)="}</strong>
							</label>
							<input
								id="function"
								type="text"
								value={polar ? polarFunc : recFunc}
								style={{ width: "100%" }}
								onChange={this.onFunctionChange}
								onKeyPress={this.onRefresh}
							/>
						</div>
						<div style={{ display: "flex", justifyContent: "flex-end" }}>
							<button onClick={this.onRefresh}>Refresh</button>
							<button onClick={this.onPolar}>
								{polar ? "Rect." : "Polar"}
							</button>
						</div>
					</div>
					<div style={sliderContainerStyle}>
						<label htmlFor="range">x: {value}</label>
						<div style={{ display: "flex" }}>
							<input
								style={sliderStyle}
								type="range"
								min="0"
								max={range}
								onChange={this.onSliderChange}
								defaultValue={value}
								id="range"
							/>
							<input
								type="text"
								value={range}
								onChange={this.onRangeChange}
								onKeyPress={this.onRefresh}
								style={{ width: "50px" }}
							/>
						</div>
						<div style={{ display: "flex", justifyContent: "flex-end" }}>
							<button onClick={this.onRefresh}>Refresh</button>
						</div>
					</div>
				</div>
				<div style={canvasContainerStyle}>
					<div style={yAxisStyle}>
						{!polar && <span>{rowSize}</span>}
						<span>{polar ? "0" : "b"}</span>
						{!polar && <span>0</span>}
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<ShadertoyReact
							fs={buildFragmentShader(exprToGlsl(recFunc))}
							style={{
								width: size * rowSize,
								height: size * rowSize,
							}}
							uniforms={{ uN: { type: "1f", value: value || range / 2 } }}
						/>
						<div style={xAxisStyle}>
							{!polar && <span>0</span>}
							<span>{polar ? "0" : "a"}</span>
							{!polar && <span>{rowSize}</span>}
						</div>
					</div>
				</div>
			</div>
		);
	};
}

export default App;

const opWhiteList = new Set(["+", "-", "*", "/"]);

// Takes notmal math and turns it into GLSL math.
function exprToGlsl(expr) {
	const n = math.parse(expr);

	const buildExpr = n => {
		if (typeof n.value === "number") {
			if (n % 1 !== 0) {
				return n.toString();
			} else {
				return n.toString() + ".";
			}
		} else if (n.name) {
			return n.name;
		} else if (n.fn) {
			if (opWhiteList.has(n.op)) {
				return buildExpr(n.args[0]) + " " + n.op + " " + buildExpr(n.args[1]);
			} else {
				return n.fn + "(" + n.args.map(buildExpr).join(", ") + ")";
			}
		} else if (n.content) {
			return "(" + buildExpr(n.content) + ")";
		} else {
			console.error("Unknown node", n);
		}
	};

	return buildExpr(n);
}

function buildFragmentShader(expr) {
	return `
	#define PI 3.14159265359

	// References:
	// https://www.shadertoy.com/view/ldjcDD

	vec3 hsl2rgb( in vec3 c )
	{
			vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
			return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
	}


	void mainImage( out vec4 fragColor, in vec2 fragCoord )
	{

			// normalized
			vec2 p = vec2(fragCoord.xy / iResolution.xy);

			// Polar coordinates:
			// https://www.shadertoy.com/view/ltlXRf
			vec2 relativePos = fragCoord.xy - (iResolution.xy / 2.0);
			vec2 polar;
			polar.y = sqrt(relativePos.x * relativePos.x + relativePos.y * relativePos.y);
			polar.y /= iResolution.x / 2.0;
			polar.y = 1.0 - polar.y;

			polar.x = atan(relativePos.y, relativePos.x);
			polar.x -= 1.57079632679;
			if(polar.x < 0.0){
			polar.x += 6.28318530718;
			}
			polar.x /= 6.28318530718;
			polar.x = 1.0 - polar.x;

			// Radius is also 0-1.
			// Angle is not in radians, but 0-1.

			float speed = 1. / 1000.;
			float size = 20.;

			float n = uN; // From uniforms prop.

			float r = polar.y * size;
			float t = polar.x * 2. * PI;

			float x = fragCoord.x / iResolution.x * size;
			float y = fragCoord.y / iResolution.x * size;

			float v = ${expr};

			float hue = mod(v, 1.0);
			 vec3 rgb = hsl2rgb(vec3(hue, 1.0, 0.6));
			fragColor = vec4(rgb, 1.0);
	}
	`;
}
