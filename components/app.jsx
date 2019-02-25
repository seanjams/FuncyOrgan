import React from "react";
import math from "mathjs";

const containerStyle = {
	margin: "30px 0 0 30px",
	display: "flex",
	fontFamily: "Helvetica",
	fontSize: "12px",
};

const titleContainerStyle = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	height: "40px",
};

const descriptionContainerStyle = {
	height: "660px",
	overflowY: "auto",
};

const exampleStyle = {
	display: "flex",
	justifyContent: "space-between",
	marginBottom: "10px",
};

const sliderContainerStyle = {
	display: "flex",
	flexDirection: "column",
	margin: "30px 0 40px 30px",
};

const sliderStyle = {
	width: "100%",
};

const historyContainerStyle = {
	minHeight: "100px",
	maxHeight: "400px",
	width: "350px",
	display: "flex",
	flexDirection: "column",
	border: "1px solid #333",
	overflowY: "auto",
	boxSizing: "border-box",
};

const historyRowStyle = {
	width: "calc(100% - 10px)",
	height: "20px",
	color: "#333",
	display: "flex",
	alignItems: "center",
	padding: "5px",
	overflow: "hidden",
	whiteSpace: "nowrap",
};

const xAxisStyle = {
	width: "100%",
	display: "flex",
	justifyContent: "space-between",
	paddingTop: "5px",
};

const yAxisStyle = {
	paddingRight: "5px",
	display: "flex",
	justifyContent: "space-between",
	flexDirection: "column",
	textAlign: "right",
	width: "30px",
	height: "100%",
};

const opWhiteList = new Set(["+", "-", "*", "/"]);

const fallbackCopyTextToClipboard = text => {
	const textArea = document.createElement("textarea");
	textArea.value = text;
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		const successful = document.execCommand("copy");
		const msg = successful ? "successful" : "unsuccessful";
		console.log("Fallback: Copying text command was " + msg);
	} catch (err) {
		console.error("Fallback: Oops, unable to copy", err);
	}

	document.body.removeChild(textArea);
};

const onCopyToClipboard = text => {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	navigator.clipboard.writeText(text).then(
		() => {
			console.log("Async: Copying to clipboard was successful!");
		},
		err => {
			console.error("Async: Could not copy text: ", err);
		}
	);
};

// Takes normal math and turns it into GLSL math.
const exprToGlsl = expr => {
	const n = math.parse(expr);

	const buildExpr = n => {
		if (typeof n.value === "number") {
			if (n % 1 !== 0) {
				return n.toString();
			} else {
				return n.toString() + ".";
			}
		} else if (n.fn) {
			if (opWhiteList.has(n.op)) {
				return buildExpr(n.args[0]) + " " + n.op + " " + buildExpr(n.args[1]);
			} else {
				return n.fn + "(" + n.args.map(buildExpr).join(", ") + ")";
			}
		} else if (n.name) {
			return n.name;
		} else if (n.content) {
			return "(" + buildExpr(n.content) + ")";
		} else {
			console.error("Unknown node", n);
		}
	};

	try {
		return buildExpr(n);
	} catch (e) {
		console.error("Parsing Error", e);
		return false;
	}
};

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rowSize: 700,
			func: "(r ^ 2 + t) ^ 2 / (100.0 * n)",
			range: 100,
			value: 50,
			modRange: 1000,
			polar: false,
			modulo: 500,
			// funcHistory: [
			// 	"(x ^ 2 + y ^ 2) * n",
			// 	"((x ^ 2 + n ^ 2) + x * y ^ 2) / 10",
			// 	"((x + y) ^ 2 - x ^ 2 - y ^ 2) * 1.27",
			// 	"(n ^ 3 + x * n + y) ^ (1 / 2)",
			// 	"x ^ 2 + y ^ 3 * n ^ 2",
			// 	"(r ^ 2 + t) ^ 2 / 1000",
			// 	"1000 * t * x",
			// 	"100 * (sin(x / 10) + cos(y / 10))",
			// 	"1000 * sin(r/100) + 1000 * cos(n * t)",
			// 	"(r ^ 2.1 + t ^ (x % r)) ^ ((1.6 * x) / 100.0 / 1000.0)",
			// 	"r * (sin(sin(x / n) + cos(y / n)) - cos(sin(x * y / n ^ 2) + cos(x / n)))",
			// 	"n * (sin(x ^ 2 / 100 + 2 * x * y / 100) - sin(x / 100 - 2 * y / 100))",
			// 	"n * sin(cos(tan(x / n))) * sin(cos(tan(y / n)))",
			// ],
			funcHistory: [],
			historySelectedIndex: null,
		};
	}

	componentDidMount = () => {
		this.rehydrateState(() => {
			this.getWebGlContext();
			this.updateCanvas();
		});
		window.addEventListener("onbeforeunload", this.saveToLocalStorage);
	};

	componentWillUnmount = () => {
		this.saveToLocalStorage();
		removeEventListener(this.saveToLocalStorage);
	};

	rehydrateState = cb => {
		let newState = {};
		for (let key in this.state) {
			if (this.props.state && key !== "funcHistory") {
				newState[key] = this.props.state[key];
			} else if (localStorage.hasOwnProperty(key)) {
				let val = localStorage.getItem(key);
				try {
					val = JSON.parse(val);
					newState[key] = val;
				} catch (e) {
					newState[key] = this.state[key];
				}
			}
		}

		this.setState(newState, cb);
	};

	saveToLocalStorage = () => {
		for (let key in this.state) {
			localStorage.setItem(key, JSON.stringify(this.state[key]));
		}
	};

	loadHistoryRow = i => e => {
		e.preventDefault();
		const func = this.state.funcHistory[i];
		this.setState({ func, historySelectedIndex: i }, this.onRefresh);
	};

	historyRows = () => {
		return this.state.funcHistory.map((func, i) => {
			let rowStyle = { ...historyRowStyle };
			if (i === this.state.historySelectedIndex) {
				rowStyle.background = "#0bf";
			}

			return (
				<div style={rowStyle} key={i} onClick={this.loadHistoryRow(i)}>
					{func}
				</div>
			);
		});
	};

	getWebGlContext = () => {
		if (!this.gl) this.gl = this.refs.canvas.getContext("webgl");
		if (!this.gl) {
			console.log("WebGL not supported, getting Eperimental Context.");
			this.gl = this.refs.canvas.getContext("experimental-webgl");
		}
		if (!this.gl) alert("WebGL not supported in this browser.");
	};

	onChange = (prop, reRender = true) => e => {
		const callback = reRender ? this.updateCanvas : () => {};
		this.setState({ [prop]: e.currentTarget.value }, callback);
	};

	onToggle = (prop, reRender = true) => e => {
		const callback = reRender ? this.updateCanvas : () => {};
		this.setState({ [prop]: !this.state[prop] }, callback);
	};

	onRefresh = e => {
		if (e) {
			if (e.type === "keypress" && e.key !== "Enter") return false;
			const val = this.state.func;
			const funcHistory = [...this.state.funcHistory];
			if (funcHistory.includes(val)) {
				funcHistory.splice(funcHistory.indexOf(val), 1);
			}
			funcHistory.unshift(val);
			this.setState(
				{ funcHistory, historySelectedIndex: 0 },
				this.updateCanvas
			);
		} else {
			this.updateCanvas();
		}
	};

	onSaveToClipboard = e => {
		// save state to URL
		history.pushState(
			"",
			"FuncyOrgan",
			`?q=${encodeURIComponent(JSON.stringify(this.state))}`
		);

		// copy to clipboard
		onCopyToClipboard(window.location.href);
	};

	getFragmentFunction = () => {
		let { func } = this.state;
		const rowSize = parseInt(this.state.rowSize).toFixed(1);
		const n = parseInt(this.state.value).toFixed(1);
		const modulo = parseInt(this.state.modulo).toFixed(1);

		func = exprToGlsl(func);
		if (!func) return false;

		const frag = `
		#define PI 3.14159265359

        precision mediump float;

        void main()
        {   
            float n = ${n};
            float size = ${rowSize};
            float modulo = ${modulo};
            float x = gl_FragCoord.x - size / 2.0;
            float y = gl_FragCoord.y - size / 2.0;
            float val;

			float r = distance(vec2(x,y), vec2(0.0,0.0));
			float t = atan(y/x);
			t = (x < 0.0 && y > 0.0 || x < 0.0 && y < 0.0) ? t + PI: t;
			t = (x > 0.0 && y < 0.0) ? t + 2.0 * PI: t; 
			val = ${func};
                        
            float red = mod(val, 2.0 * modulo);
            float green = mod(val + modulo / 3.0, 2.0 * modulo);
            float blue = mod(val + 2.0 * modulo / 3.0, 2.0 * modulo);
            red = (red > modulo ? 2.0 * modulo - red: red);
            green = (green > modulo ? 2.0 * modulo - green: green);
            blue = (blue > modulo ? 2.0 * modulo - blue: blue);
            
            gl_FragColor = vec4(red / modulo, green / modulo, blue / modulo, 1.0);
        }`;

		return frag;
	};

	getVertexFunction = () => {
		return `
            precision mediump float;

            attribute vec2 position;

            void main()
            {
                gl_Position = vec4(position, 0.0, 1.0);
            }`;
	};

	updateCanvas = () => {
		const { gl } = this;
		const n = parseInt(this.state.value);
		if (!gl) {
			this.getWebGlContext();
		}
		// clear canvas and set to black
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		// create shaders
		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vertexShader, this.getVertexFunction());
		gl.shaderSource(fragmentShader, this.getFragmentFunction());
		gl.compileShader(vertexShader);
		gl.compileShader(fragmentShader);
		if (
			!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) ||
			!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
		) {
			console.error(
				"ERROR compiling shaders",
				gl.getShaderInfoLog(vertexShader),
				gl.getShaderInfoLog(fragmentShader)
			);
			return false;
		}
		// create program object and link shaders
		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.validateProgram(program);
		if (
			!gl.getProgramParameter(
				program,
				gl.LINK_STATUS || !gl.getProgramParameter(program, gl.VALIDATE_STATUS)
			)
		) {
			const info = gl.getProgramInfoLog(program);
			throw "Could not compile WebGL program. \n\n" + info;
		}
		// coordinates for corners of canvas
		const positions = new Float32Array([
			-1.0,
			1.0,
			1.0,
			1.0,
			-1.0,
			-1.0,
			1.0,
			-1.0,
		]);
		// create buffer
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		// pass position to vertex function
		program.position = gl.getAttribLocation(program, "position");
		gl.enableVertexAttribArray(program.position);
		gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);
		gl.useProgram(program);
		// draw pixels
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, positions.length / 2);
	};

	render = () => {
		const { rowSize, func, range, value, modulo, modRange } = this.state;

		const canvasContainerStyle = {
			width: rowSize + 35,
			height: rowSize,
			display: "flex",
			fontSize: "16px",
			fontWeight: 600,
		};

		return (
			<div style={containerStyle}>
				<div
					style={{
						marginRight: "30px",
						width: "350px",
						minWidth: "350px",
					}}
				>
					<div style={titleContainerStyle}>
						<h2>FuncyOrgan</h2>
						<button style={{ height: "20px" }} onClick={this.onSaveToClipboard}>
							Save To Clipboard
						</button>
					</div>
					<div style={descriptionContainerStyle}>
						<p style={{ width: "100%", fontSize: "13px" }}>
							This started out as an idea for a color organ. Currently it's just
							a cool way to graph things.
							<br />
							<br />
							<strong>How it works</strong>
							<br />
							<br />
							We have an x-y grid labeled from -350 to +350 in both directions.
							Every pixel of the grid has 4 coordinate values,{" "}
							<strong>(x, y, r, t)</strong>, where <strong>x</strong> and{" "}
							<strong>y</strong> are the Cartesian coordinates and{" "}
							<strong>r</strong> and <strong>t</strong> are the polar
							coordinates.
							<br />
							<br />
							Every pixel also has a single color, which comes from a number.
							This number is computed by whatever function you type in below.
							Treat it like a graphing calculator. You can use your 4 coordinate
							variables and an additional integer variable <strong>n</strong>.
							You can control <strong>n</strong> with a slider and watch your
							image change.
							<br />
							<br />
							Lastly, you'll notice another slider for <strong>mod</strong>.
							Basically, whatever number your function outputs for a given pixel
							needs to be mapped to a color on the spectrum. This is done
							modularly to account for very large and negative numbers, with a
							modulus defined by this slider.
						</p>

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
								f(r,t,n) = (r^ 2 + t) ^ 2 / (100 * n)
							</span>
						</div>
						<div style={sliderContainerStyle}>
							<div style={{ display: "flex", alignItems: "center" }}>
								<label
									htmlFor="function"
									style={{ paddingRight: "5px", letterSpacing: "1.5px" }}
								>
									<strong>f(x,y,r,t,n)=</strong>
								</label>
								<input
									id="function"
									type="text"
									value={func}
									style={{ width: "100%" }}
									onChange={this.onChange("func", false)}
									onKeyPress={this.onRefresh}
								/>
							</div>
							<div style={{ display: "flex", justifyContent: "flex-end" }}>
								<button onClick={this.onRefresh}>Refresh</button>
							</div>
						</div>
						<div style={sliderContainerStyle}>
							<label htmlFor="range">n: {value}</label>
							<div style={{ display: "flex" }}>
								<input
									style={sliderStyle}
									type="range"
									min="0"
									max={range}
									onChange={this.onChange("value")}
									defaultValue={value}
									id="range"
								/>
								<input
									type="number"
									value={range}
									onChange={this.onChange("range")}
									onKeyPress={this.onRefresh}
									style={{ width: "50px" }}
								/>
							</div>
						</div>
						<div style={sliderContainerStyle}>
							<label htmlFor="range">modulo: {modulo}</label>
							<div style={{ display: "flex" }}>
								<input
									style={sliderStyle}
									type="range"
									min="0"
									max={modRange}
									onChange={this.onChange("modulo")}
									defaultValue={modulo}
									id="range"
								/>
								<input
									type="number"
									value={modRange}
									onChange={this.onChange("modRange")}
									onKeyPress={this.onRefresh}
									style={{ width: "50px" }}
								/>
							</div>
						</div>
						<p>
							<strong>History</strong>
						</p>
						<div style={historyContainerStyle}>{this.historyRows()}</div>
					</div>
				</div>
				<div style={canvasContainerStyle}>
					<div style={yAxisStyle}>
						<span>{`${rowSize / 2}`}</span>
						<span>b</span>
						<span>{`-${rowSize / 2}`}</span>
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<canvas ref="canvas" width={rowSize} height={rowSize} />
						<div style={xAxisStyle}>
							<span>{`-${rowSize / 2}`}</span>
							<span>a</span>
							<span>{`${rowSize / 2}`}</span>
						</div>
					</div>
				</div>
			</div>
		);
	};
}

export default App;
