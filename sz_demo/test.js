// Copyright 2025, Yongfeng Qiu, The Ohio State University

function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var rotationXMatrix = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), -Math.sin(rotationX), 0,
		0, Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];

	var rotationYMatrix = [
		Math.cos(rotationY), 0, Math.sin(rotationY), 0,
		0, 1, 0, 0,
		-Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	var combinedRotation = MatrixMult(rotationXMatrix, rotationYMatrix);
	var transRot = MatrixMult(trans, combinedRotation);
	var mv = transRot;
	return mv;
}


function updateHTMLImageFromDecompressed(img, dataUint8, width, height) {
	const decompressedImg = document.getElementById("decompress-texture-img");
	const originalImg = document.getElementById("texture-img");
	decompressedImg.src = img.src;
}


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		// Compile the shader program
		this.prog = InitShaderProgram(meshVS, meshFS);

		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.sampler = gl.getUniformLocation( this.prog, 'tex');

		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.texPos = gl.getAttribLocation( this.prog, 'txc' );
		this.normPos = gl.getAttribLocation( this.prog, 'norm' );

		this.vertbuffer = gl.createBuffer();

		this.texturebuffer = gl.createBuffer();

		this.normalbuffer = gl.createBuffer();

		gl.useProgram( this.prog );
		gl.uniform1i(gl.getUniformLocation( this.prog, 'showTexture'), true);

		var viewPosition = [
			0.0, 0.0, 0.0
		];

		gl.uniform3fv(gl.getUniformLocation( this.prog, 'viewPos'), viewPosition);

		var white = [
			1.0, 1.0, 1.0
		];

		gl.uniform3fv(gl.getUniformLocation( this.prog, 'lightColor'), white);
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texturebuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);


		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram( this.prog );
		gl.uniform1i(gl.getUniformLocation( this.prog, 'swapAxes'), swap);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.prog );
		// Set the view matrix
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( gl.getUniformLocation( this.prog, 'mv' ), false, matrixMV );
		gl.uniformMatrix3fv( gl.getUniformLocation( this.prog, 'mNormal' ), false, matrixNormal );
		// Bind and set up the vertex buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalbuffer );
		gl.vertexAttribPointer( this.normPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normPos );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.texturebuffer );
		gl.vertexAttribPointer( this.texPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texPos );

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		this.originalImage = img;
		gl.useProgram( this.prog );
		var texture = gl.createTexture();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		gl.generateMipmap(gl.TEXTURE_2D);

		gl.uniform1i( this.sampler, 0 );
		gl.uniform1i(gl.getUniformLocation( this.prog, 'textureCreated'), true);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		this.bShowTexture = show
		gl.useProgram( this.prog );
		gl.uniform1i(gl.getUniformLocation( this.prog, 'showTexture'), show);
	}

	async createLosslyTexture(image, Module, eb) 
	{
		const width = image.naturalWidth;
		const height = image.naturalHeight;

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0, width, height);
		const imageData = ctx.getImageData(0, 0, width, height);
		const src = imageData.data; // Uint8ClampedArray

		const floatData = new Float32Array(width * height * 4);
		for (let i = 0; i < src.length; i+=4) 
		{
			floatData[i + 0] = src[i + 0] / 255.0;
			floatData[i + 1] = src[i + 1] / 255.0;
			floatData[i + 2] = src[i + 2] / 255.0
			floatData[i + 3] = src[i + 3] / 255.0;
		}
		const len = floatData.length;
		const inputPtr = Module._malloc(len * 4);
		Module.HEAPF32.set(floatData, inputPtr >> 2);

		const sizePtr = Module._malloc(4);
		const compressedPtr = Module._wasm_interp_compress_float_1D(inputPtr, len, sizePtr, eb);
		const compressedSize = Module.HEAPU32[sizePtr >> 2];
		console.log("Compressed size:", compressedSize);
		const outLenPtr = Module._malloc(4);
		const decompressedPtr = Module._wasm_interp_decompress_float(compressedPtr, compressedSize, outLenPtr);
		const outLen = Module.HEAPU32[outLenPtr >> 2];
		const floatDecompressed = new Float32Array(Module.HEAPF32.buffer, decompressedPtr, outLen);
		console.log("Decompressed length:", outLen);
		const resultData = new Uint8ClampedArray(outLen);
		for (let i = 0; i < outLen; i++) {
			resultData[i] = Math.min(255, Math.max(0, Math.round(floatDecompressed[i] * 255)));
		}
		const data = imageData.data;
		for (let i = 0; i < data.length; i+=4) 
		{
			data[i + 0] = resultData[i + 0];
			data[i + 1] = resultData[i + 1];
			data[i + 2] = resultData[i + 2];
			data[i + 3] = resultData[i + 3];
		}
		ctx.putImageData(imageData, 0, 0);
		const resultImage = new Image();
		const promise = new Promise((resolve) => {
			resultImage.onload = () => resolve(resultImage);
		});
		
		resultImage.src = canvas.toDataURL();
		Module._free(inputPtr);
		Module._free(sizePtr);
		Module._free(outLenPtr);
		Module._wasm_free(compressedPtr);
		Module._wasm_free(decompressedPtr);

		return await promise;
	}

	async ShowSZ3Texture(SZ3_show) 
	{
		if (!this.bShowTexture) {
			console.log("Texture is not shown, SZ3 texture will not be shown either.");
			return;
		}
		if (!this.originalImage) return;
	
		if (SZ3_show === true) {
			const redImage = await this.createLosslyTexture(this.originalImage, Module, 0.3);
			console.log("redImg:", redImage.naturalWidth, redImage.naturalHeight);
	
			console.log(redImage.src);
			updateHTMLImageFromDecompressed(redImage, null, 0, 0);
			gl.useProgram(this.prog);
	
			const texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
	
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, redImage);
			gl.generateMipmap(gl.TEXTURE_2D);
	
			gl.uniform1i(this.sampler, 0);
			gl.uniform1i(gl.getUniformLocation(this.prog, 'textureCreated'), true);
		} else {
			this.setTexture(this.originalImage);
			this.showTexture(this.bShowTexture);
			console.log("SZ3 false");
		}
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		var lightDirection = [
			-x, -y, z
		];

		gl.useProgram( this.prog );
		gl.uniform3fv(gl.getUniformLocation( this.prog, 'light'), lightDirection);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		gl.useProgram( this.prog );
		gl.uniform1f(gl.getUniformLocation( this.prog, 'alphaExponent'), shininess );
	}
}

// Vertex shader source code
var meshVS = `
	attribute vec3 pos;
	attribute vec3 norm;
	attribute vec2 txc;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 mNormal;
	varying vec3 viewSpacePosition;
	varying vec3 viewSpaceNormal;
	varying vec2 texCoordinates;
	uniform bool swapAxes;
	void main()
	{
	    if(swapAxes)
	    {
	        gl_Position = mvp * vec4(pos.x,pos.z,pos.y,1);
		    texCoordinates = txc;
		    
		    vec4 viewSpacePosition4 = mv * vec4(pos.x,pos.z,pos.y,1);
		    
		    viewSpacePosition = normalize(vec3(viewSpacePosition4.x, viewSpacePosition4.y, viewSpacePosition4.z));
		    viewSpaceNormal = normalize(mNormal * vec3(norm.x, norm.z, norm.y));
	    }
	    
	    else
	    {
	        gl_Position = mvp * vec4(pos,1);
		    texCoordinates = txc;
		    
		    vec4 viewSpacePosition4 = mv * vec4(pos,1);
		    
		    viewSpacePosition = normalize(vec3(viewSpacePosition4.x, viewSpacePosition4.y, viewSpacePosition4.z));
		    viewSpaceNormal = normalize(mNormal * norm);
	    }
	}
`;
// Fragment shader source code
var meshFS = `
	precision mediump float;
	
	uniform sampler2D tex;
	uniform vec3 light;
	uniform vec3 viewPos;
	uniform vec3 lightColor;
	uniform float alphaExponent;
	varying vec2 texCoordinates;
	varying vec3 viewSpacePosition;
	varying vec3 viewSpaceNormal;
	uniform bool showTexture;
	uniform bool textureCreated;
	
	void main()
	{	
		vec3 viewDir = normalize(viewPos - viewSpacePosition);
		
		vec3 halfAngle = normalize(viewPos + light);
		
		float diffuseCos = max(dot(viewSpaceNormal, light), 0.0);
		float specularCos = pow(max(dot(viewSpaceNormal, halfAngle), 0.0), alphaExponent);
		
		vec3 diffuse = diffuseCos * lightColor;
		vec3 specular = specularCos * lightColor;
		
	    if(textureCreated && showTexture)
	    {
	    	vec4 textureColor = texture2D(tex, texCoordinates);
	    	vec3 result = (diffuse + specular) * vec3(textureColor.x, textureColor.y, textureColor.z);
	        gl_FragColor = vec4(result,1);
	    }
	    
	    else 
	    {
	    	vec3 result = (diffuse + specular) * lightColor;
		    gl_FragColor = vec4(result,1);
		}
	}
`;
