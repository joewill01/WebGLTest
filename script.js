var mat4 = glMatrix.mat4;

let vertexShaderText =
[
    'precision mediump float;',
    '',
    'attribute vec3 vertPosition;',
    'attribute vec2 vertTexCoord;',
    'varying vec2 fragTexCoord;',
    'uniform mat4 mWorld;',
    'uniform mat4 mView;',
    'uniform mat4 mProj;',
    '',
    'void main()',
    '{',
    '   fragTexCoord = vertTexCoord;',
    '   gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
    '}',
].join('\n');

let fragmentShaderText =
[
'precision mediump float;',
'',
'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',
'',
'void main()',
'{',
'   gl_FragColor = texture2D(sampler, fragTexCoord);',
'}',
].join('\n');

function initDemo() {
    let canvas = document.getElementById("webgl-canvas");
    canvas.height=window.innerHeight;
    canvas.width=window.innerWidth;
    let gl = canvas.getContext("webgl");

    if (!gl) {
        gl = canvas.getContext("experimental-webgl");
        console.log("WebGL not supported. Attempting experimental WebGL")
    }

    if (!gl) {
        alert("WebGL is not supported. Update your browser!")
    }

    gl.clearColor(0.1,0.1,0.1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader: ', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling fragment shader: ', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program: ', gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('Error validating program: ', gl.getProgramInfoLog(program));
        return;
    }

    //
    // Create buffer
    //

    let boxVertices =
        [ // X, Y, Z           U, V
            // Top
            -1.0, 1.0, -1.0,   0, 0,
            -1.0, 1.0, 1.0,    0, 1/16,
            1.0, 1.0, 1.0,     1/16, 1/16,
            1.0, 1.0, -1.0,    1/16, 0,

            // Left
            -1.0, 1.0, 1.0,    4/16, 0,
            -1.0, -1.0, 1.0,   4/16, 1/16,
            -1.0, -1.0, -1.0,  3/16, 1/16,
            -1.0, 1.0, -1.0,   3/16, 0,

            // Right
            1.0, 1.0, 1.0,    3/16, 0,
            1.0, -1.0, 1.0,   3/16, 1/16,
            1.0, -1.0, -1.0,  4/16, 1/16,
            1.0, 1.0, -1.0,   4/16, 0,

            // Front
            1.0, 1.0, 1.0,    4/16, 0,
            1.0, -1.0, 1.0,    4/16, 1/16,
            -1.0, -1.0, 1.0,    3/16, 1/16,
            -1.0, 1.0, 1.0,    3/16, 0,

            // Back
            1.0, 1.0, -1.0,    3/16, 0,
            1.0, -1.0, -1.0,    3/16, 1/16,
            -1.0, -1.0, -1.0,    4/16, 1/16,
            -1.0, 1.0, -1.0,    4/16, 0,

            // Bottom
            -1.0, -1.0, -1.0,   2/16, 0,
            -1.0, -1.0, 1.0,    2/16, 1/16,
            1.0, -1.0, 1.0,     3/16, 1/16,
            1.0, -1.0, -1.0,    3/16, 0,
        ];

    let boxIndices =
        [
            // Top
            0, 1, 2,
            0, 2, 3,

            // Left
            5, 4, 6,
            6, 4, 7,

            // Right
            8, 9, 10,
            8, 10, 11,

            // Front
            13, 12, 14,
            15, 14, 12,

            // Back
            16, 17, 18,
            16, 18, 19,

            // Bottom
            21, 20, 22,
            22, 20, 23
        ];

    let boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    let boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    let texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');
    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        texCoordAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(texCoordAttribLocation);

    //
    // Create texture
    //
    var boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY,  gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY,  gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE,
        document.getElementById("texture")
        );
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindTexture(gl.TEXTURE_2D, null);


    gl.useProgram(program);

    let matWorldUniformLocation = gl.getUniformLocation(program, "mWorld");
    let matViewUniformLocation = gl.getUniformLocation(program, "mView");
    let matProjUniformLocation = gl.getUniformLocation(program, "mProj");

    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [5, 0, -8], [0, 0, 0], [1, 0, 0]);
    mat4.perspective(projMatrix, 0.785398, canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    let xRotationMatrix = new Float32Array(16);
    let yRotationMatrix = new Float32Array(16);

    //
    //  Main render loop
    //
    let identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);

    let angle = 0;
    let frames = 0;
    let lookingAtMouseX = 0;
    let lookingAtMouseY = 0;

    let loop = function () {
        angle = performance.now() / 1000 / 10 * 2 * Math.PI;
        mat4.rotate(xRotationMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [1, 0, 0]);

        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);

        mat4.lookAt(viewMatrix, [0, 0, -8], [lookingAtMouseY, lookingAtMouseX, 0], [1, 0, 0]);

        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(0.1,0.1,0.1,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
        frames++;
    };
    requestAnimationFrame(loop);

    window.addEventListener('mousemove', e => {
        lookingAtMouseX = - (e.clientX - (canvas.width/2)) / (canvas.width/2) * 6;
        lookingAtMouseY = (e.clientY - (canvas.height/2)) / (canvas.height/2) * 6;
    });

    let fpsCount = function () {
        document.getElementById("fps").innerText = `FPS: ${frames}`;
        frames = 0;
    };

    setInterval(fpsCount, 1000);
}

window.onload = function() {
    initDemo();
};
