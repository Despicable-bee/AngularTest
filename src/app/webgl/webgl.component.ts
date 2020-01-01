import { Component, OnInit, ViewChild, ElementRef, Directive, Input } from '@angular/core';
import { mat4 } from "gl-matrix";

@Component({
  selector: 'app-webgl',
  templateUrl: './webgl.component.html',
  styleUrls: ['./webgl.component.css']
})
export class WebglComponent implements OnInit {
  private cubeRotation = 0.0;
  public canvas: any;
  private gl: any;
  // Vertex shader program
  public vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  /* Updated vertex shader ------------------------------------------------- */
  public vsSourceTex = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1,1,1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program (here we're using white for every pixel)
  public fsSource = `
    varying lowp vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `;

  /* Updated fragment shader ----------------------------------------------- */
  public fsSourceTex = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    
    uniform sampler2D uSampler;

    void main() {
      // Fetch the color of the texel
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      // multiply the texel's color by the lighting value to adjust the texel's
      // color to take into account the effect of our light sources.
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
  }
  `;

  constructor() {}
  /**
   * This method runs when everything has been initialised (i.e. the 
   * constructor has run, the HTML has loaded and the other components
   * have been loaded too).
   */
  ngOnInit() {
    this.canvas = <HTMLCanvasElement> document.querySelector("#glCanvas");
    this.gl = <WebGLRenderingContext> this.canvas.getContext('webgl');
    this.webGLBegin(this.gl, this.canvas);
  }

  public webGLBegin(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    if(gl == null) {
      alert(
        "Unable to initalise WebGL. Your browser may not support it"
      );
      return;
    }
    // Initalize a shader program; this is where all the lighing for the
    //  vertices and so forth are established
    const shaderProgram = this.initShaderProgram(gl, this.vsSourceTex, this.fsSourceTex);
      
    // Collect all the info needed to use the shader program. Look up which
    // attribute our shader program is using for aVertexPosition and look up
    // uniform locations
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        //vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
        vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          "uProjectionMatrix"
        ),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
      }
    };

    // Here's where we call the routine that builds all the objects we'll be drawing
    var buffers = this.initBuffers(gl);

    // Here's where we load the texture
    const texture = this.loadTexture(gl, "/assets/data/barrybee.jpg");

    // Variable to keep track of rotation
    var then = 0;
    var reference = this;
    // Draw the scene repeatedly
    function render(now) {
      now *= 0.001; // convert to seconds
      const deltaTime = now - then;
      then = now;
      // Draw the scene
      reference.drawScene(gl, programInfo, buffers, texture, deltaTime);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  private loadTexture(gl: WebGLRenderingContext, url: string) {
    // WebGL texture object
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be downloaded over the internet, they might take
    // a moment until they are ready. Until then put a single pixel in the 
    // texture so we can use it immediately. When the image has finished
    // downloading, we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // One blue pixel
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );
    
    var reference = this;

    // Now we get the image from the internet and map it to the cube
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image,
      );

        // WebGL1 has different requirements for power of 2 images vs non-power
        // of 2 images so check if the image is a power of 2 in both dimensions.
        if(reference.isPowerOf2(image.width) && reference.isPowerOf2(image.height)){
          // Yes it's a power of 2. Generate mips
          gl.generateMipmap(gl.TEXTURE_2D);
          // WebGL can do higher quality filtering if the texture is a power 
          // of 2 for both height and width (e.g. a repeated texture like a
          // brick wall).
        } else {
          // WebGL calls U-V maps S-T maps (for some reason :/)
          // prevents s-coordinate wrapping (repeating)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          // prevents t-coordinate wrapping (repeating)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          // gl.NEAREST is allowed, instead of gl.LINEAR, as height of mipmap
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          // Mip mapping and UV repeating can be disabled with texParameteri()
          // which will allow non-power-of-two (NPOT) textures at the expense of 
          // mipmapping, UV wrapping, UV tiling, and your control over how the
          // device will handle your texture (so make sure they're squares).
        }
    };
    image.src = url;
    return texture;
  }

  public isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
  }

  public drawScene(gl: WebGLRenderingContext, programInfo: any, buffers: any, texture: any, deltaTime: any) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is used to simulate
    // the distortion of perspective in a camera.
    // our FOV is 45 degrees, with a width/ height ratio that matches the display
    // size of the canvas and we only want to see objects between 0.1 units and 100
    // units away from the camera.

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glMatrix.js always has the first arguement as the destination
    // to receive the result.
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // Set the drawing position to the "identity" point, which is the centre of the scene
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to start drawing the square
    mat4.translate(
      modelViewMatrix, //  destination matrix
      modelViewMatrix, //  matrix to translate
      [-0.0, 0.0, -6.0] // Amount to translate
    );

    // Rotate the square every time we draw
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    this.cubeRotation, // amount to rotate in radians
    [0, 0, 1] // axis to rotate around
  );

  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    this.cubeRotation, // amount to rotate in radians
    [0, 1, 0] // axis to rotate around
  );

  // mat4.rotate(
  //   modelViewMatrix, // destination matrix
  //   modelViewMatrix, // matrix to rotate
  //   this.cubeRotation, // amount to rotate in radians
  //   [1, 1, 1] // axis to rotate around
  // );
  
    /* Normal matrix ------------------------------------------------------- */
    // Code that builds the uniform matrices to generate and deliver to the
    // the shader a NORMAL MATRIX, which is used to transform the normals
    // when dealing with the current orientation of the cube in relation to
    // the light source.
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

  // Tell WebGL how to pull out the positions from the position buffer
  // into the vertexPosition attribute
  {
    const numComponents = 3; // pulls out 3 values per iteration (x,y,z)
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
                      // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer into the
  // vertexColor attribute
  // {
  //   const numComponents = 4;
  //   const type = gl.FLOAT;
  //   const normalize = false;
  //   const stride = 0;
  //   const offset = 0;
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  //   gl.vertexAttribPointer(
  //     programInfo.attribLocations.vertexColor,
  //     numComponents,
  //     type,
  //     normalize,
  //     stride,
  //     offset
  //   );
  //   gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  // }

  /* Updated Texture buffer ------------------------------------------------ */
  {
    const num = 2; // Every coordinate composed of 2 valus
    const type = gl.FLOAT; // the data in the buffer is 32-bit float
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord,
      num,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  /* Vertex normals -------------------------------------------------------- */
  // Tell WebGL how to pull out the normals from the normal buffer into the
  // vertexNormal attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false; 
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexNormal
    );
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix
  );

  // Just before the draw

  // tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const offset = 0;
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw
  this.cubeRotation += deltaTime;
  }

  private initBuffers(gl: WebGLRenderingContext) {

    // Create a buffer for the square's position
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer operations to
    // from here out
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square (x, y, z)
    const positions = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
  
      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
  
      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
  
      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
  
      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
  
      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0
    ];

    // Now pass the list of positions into WebGL to build the shape. We do this
    // by creating a Float32Array from the javascript array, then use it to fill
    // the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Set up the normals for the vertices, so that we can compute lighting.

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    const vertexNormals = [
      // Front
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
      // Back
       0,0,  0.0, -1.0,
       0,0,  0.0, -1.0,
       0,0,  0.0, -1.0,
       0,0,  0.0, -1.0,
      // Top
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
      // Bottom
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
      // Right
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
      // Left
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
        gl.STATIC_DRAW);

    /* Color / Texture mapping --------------------------------------------- */

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = [
      // Front
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Back
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Top
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Bottom,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Right
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Left
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
      gl.STATIC_DRAW);

    // const faceColors = [
    //   [1.0, 1.0, 1.0, 1.0], // Front face:  white
    //   [1.0, 0.0, 0.0, 1.0], // Back face:   red
    //   [0.0, 1.0, 0.0, 1.0], // Top face:    green
    //   [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    //   [1.0, 1.0, 0.0, 1.0], // Right face:  yellow
    //   [1.0, 0.0, 1.0, 1.0], // Left face:   purple
    // ];

    // // Convert the array of colors into a table for all the vertices.
    // var colors = [];

    // for (var j = 0; j < faceColors.length; ++j) {
    //   const c = faceColors[j];

    //   // Repeat each color four times for the four vertices of the face
    //   colors = colors.concat(c, c, c, c);
    // }

    // const colorBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Build the element array buffer; this specifies the indices into the
    // vertex arrays for each face's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the indices
    // into the vertex array to specify each triangle's position.
    const indicies = [
      0,  1,  2,
      0,  2,  3, // front
      4,  5,  6,
      4,  6,  7, // back
      8,  9,  10,
      8,  10, 11, // top
      12, 13, 14,
      12, 14, 15, // bottom
      16, 17, 18,
      16, 18, 19, // right
      20, 21, 22,
      20, 22, 23, // left
    ];

    // Now send the element array to GL
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indicies),
      gl.STATIC_DRAW
    );

    // return {
    //   position: positionBuffer,
    //   color: colorBuffer,
    //   indices: indexBuffer
    // };

    return {
      position: positionBuffer,
      normal: normalBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer
    };
  }

  private initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        "Unable to init the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
      );
      return null;
    }

    return shaderProgram;
  };

  /**
   * @brief Creates a shader of the given type, uploads the source and compiles it.
   * @param gl The rendering context
   * @param type the shader type
   * @param source the shader source
   */
  private loadShader(gl: WebGLRenderingContext, type: any, source: string) {
    // Create a new shader
    const shader: WebGLShader = this.gl.createShader(type);
    // Sends source code to the shader object ( the GLSL program we wrote ).
    gl.shaderSource(shader, source);
    // compile the shader program
    gl.compileShader(shader);
    // see if it compiled successfully
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

}
