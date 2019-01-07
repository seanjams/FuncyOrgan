import React from "react";
import ReactDOM from "react-dom";

// cool funcs to try:
//
// rectangular:
// (x^2 + y^2) * n,
// ((x^2 + n^2) + x * y^2) / 10
// ((x + y) ^ 2 - x ^ 2 - y ^ 2) * 1.27
// (n^3+x*n+y) ^ (1/2)
// (pow(x,2.0) + pow(y,3.0)) * pow(n,2.0)
//
// polar:
// (r^ 2 + t) ^ 2 / 1000
// 1000 * t * x
// 100 * (sin(a / 10) + cos(b / 10))
// 1000 * sin(r/100) + 1000 * cos(n * t)
// pow(pow(r, 2.1) + pow(t, mod(x, r)), (1.6 * x) / 100.0 / 1000.0);

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
	margin: "30px 0 40px 30px",
	width: "350px",
};

const exampleStyle = {
	display: "flex",
	justifyContent: "space-between",
	marginBottom: "10px",
};

const getRGB = val => {
	val = ((val % 510) + 510) % 510;
	return val > 255 ? 510 - val : val;
};

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rowSize: 700,
			rectFunc: "(pow(x,2.0) + pow(y,2.0)) * n",
			polarFunc: "pow(pow(r,2.0) + t,2.0) / (100.0 * n)",
			range: 100,
			value: 50,
			modRange: 1000,
			polar: false,
			modulo: 500,
		};
	}

	componentDidMount = () => {
		const state = this.props.state ? this.props.state : this.state;
		this.setState(state, () => {
			this.getWebGlContext();
			this.updateCanvas();
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
		if (e.type === "keypress" && e.key !== "Enter") return false;
		this.updateCanvas();
	};

	static fallbackCopyTextToClipboard = text => {
		var textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			var successful = document.execCommand("copy");
			var msg = successful ? "successful" : "unsuccessful";
			console.log("Fallback: Copying text command was " + msg);
		} catch (err) {
			console.error("Fallback: Oops, unable to copy", err);
		}

		document.body.removeChild(textArea);
	};

	static onCopyToClipboard = text => {
		if (!navigator.clipboard) {
			App.fallbackCopyTextToClipboard(text);
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

	onSave = e => {
		// save state to URL
		window.location.hash = encodeURIComponent(JSON.stringify(this.state));

		// copy to clipboard
		App.onCopyToClipboard(window.location.href);
	};

	getFragmentFunction = () => {
		const { polar, polarFunc, rectFunc } = this.state;
		const rowSize = parseInt(this.state.rowSize);
		const n = parseInt(this.state.value);
		const modulo = parseInt(this.state.modulo);
		const func = `
        precision mediump float;

        void main()
        {   
            float n = ${n}.0;
            float size = ${rowSize}.0;
            float modulo = ${modulo}.0;
            float x = gl_FragCoord.x - size / 2.0;
            float y = gl_FragCoord.y - size / 2.0;
            float val;

            if(${polar})
            {
                float r = distance(vec2(x,y), vec2(0.0,0.0));
                float t = atan(y/x);
                val = ${polarFunc};
            }
            else
            {
                val = ${rectFunc};
            }
            
            float red = mod(val, 2.0 * modulo);
            float green = mod(val + modulo / 3.0, 2.0 * modulo);
            float blue = mod(val + 2.0 * modulo / 3.0, 2.0 * modulo);
            red = (red > modulo ? 2.0 * modulo - red: red);
            green = (green > modulo ? 2.0 * modulo - green: green);
            blue = (blue > modulo ? 2.0 * modulo - blue: blue);
            
            gl_FragColor = vec4(red / modulo, green / modulo, blue / modulo, 1.0);
        }`;

		console.log(func);

		return func;
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
		const { rowSize, polarFunc, rectFunc, range, polar } = this.state;
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
			var info = gl.getProgramInfoLog(program);
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
		const {
			rowSize,
			polarFunc,
			rectFunc,
			range,
			value,
			polar,
			modulo,
			modRange,
		} = this.state;

		const containerStyle = {
			width: rowSize + 30,
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
			height: rowSize,
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
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<h2>FuncyOrgan</h2>
						<button style={{ height: "20px" }} onClick={this.onSave}>
							Save To Clipboard
						</button>
					</div>
					<p style={{ width: "100%", fontSize: "12px" }}>
						This is a prototype for a kind of color organ I want to make. Every
						pixel of the grid has a corresponding (x,y) point in rectangular
						coordinates, or (r,t) point in polar coordinates, and displays a
						color plucked from the spectrum by a single integer value, which we
						compute using the function below.
						<br />
						<br />
						Use the input to write a function of 3 variables, using the two
						coordinate variables (x/y or r/t), and an input variable (n), as
						well as any constants. After clicking refresh, each pixel will be
						assigned its own version of this function obtained by plugging in
						its coordinates. This builds a 2 dimensional field of continous
						functions of n with gradually changing parameters. Use the slider to
						change the value for n and evaluate the pixels. The results map to
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
							f(r,t,n) = (r^ 2 + t) ^ 2 / (100 * n)
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
								value={polar ? polarFunc : rectFunc}
								style={{ width: "100%" }}
								onChange={this.onChange(polar ? "polarFunc" : "rectFunc")}
								onKeyPress={this.onRefresh}
							/>
						</div>
						<div style={{ display: "flex", justifyContent: "flex-end" }}>
							<button onClick={this.onRefresh}>Refresh</button>
							<button onClick={this.onToggle("polar")}>
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
				</div>
				<div style={canvasContainerStyle}>
					<div style={yAxisStyle}>
						{!polar && <span>{`${rowSize / 2}`}</span>}
						<span>{polar ? "0" : "b"}</span>
						{!polar && <span>{`-${rowSize / 2}`}</span>}
					</div>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<canvas ref="canvas" width={rowSize} height={rowSize} />
						<div style={xAxisStyle}>
							{!polar && <span>{`-${rowSize / 2}`}</span>}
							<span>{polar ? "0" : "a"}</span>
							{!polar && <span>{`${rowSize / 2}`}</span>}
						</div>
					</div>
				</div>
			</div>
		);
	};
}

export default App;
