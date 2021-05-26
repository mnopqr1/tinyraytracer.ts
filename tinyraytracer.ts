/** Tiny raytracer on a train 
 Following https://github.com/ssloy/tinyraytracer/wiki/
**/


/***************** INTERFACE WITH HTML ****************/
// putPixel
// updateCanvas

/** this part of the code is strongly based on 
Gabriel Gambetta's Computer Graphics from Scratch
https://gabrielgambetta.com/computer-graphics-from-scratch/demos/raytracer-01.html 
*/

// get the canvas element and its image data from the html document
// every pixel is encoded as four numbers between 0 and 255: red, green, blue, alpha
let canvas = document.querySelector('#the-canvas') as HTMLCanvasElement;
let canvas_buffer = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

function putPixel(v: Pt2, color: Color) : void {
    // convert x, y coordinates with origin in middle to
    // canvas coordinates with origin in lower left corner
  let px = canvas.width / 2 + v.x;
  let py = canvas.height / 2 - v.y - 1;
  if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
    return;
  }
    // find the address of this pixel in the buffer
    // and set colors
  let offset = 4 * px + 4 * canvas_buffer.width * py;
  canvas_buffer.data[offset++] = 255 * color.r;
  canvas_buffer.data[offset++] = 255 * color.g;
  canvas_buffer.data[offset++] = 255 * color.b;
  canvas_buffer.data[offset++] = 255;    // alpha is always 255
}

function updateCanvas() {
  canvas.getContext('2d').putImageData(canvas_buffer, 0, 0);
}



/******************** SCENE AND CAMERA *********************/

class Camera {
    position : Pt3;
    direction : Vec3;
    viewport : Rectangle;

    constructor(position, direction, vw, vh) {
	this.position = position;
	this.direction = direction;
	// given viewport width and height, position viewport in correct direction in front of camera
	this.viewport = new Rectangle(position.translate(direction), direction, vw, vh);
	return this;
    }
}


/********************* SCENE OBJECTS **************************/
// Sphere
// Material
// Light


class Sphere {
    c : Pt3;    // center
    r : number; // radius
    rsq : number; // radius squared
    material : Material;
    
    constructor(c : Pt3, r : number, m : Material) {
	this.c = c;
	this.r = r;
	this.rsq = r * r;
	this.material = m;
	return this;
    }

    // checks for intersection between sphere and ray
    // returns either the smallest t such that ray.o + t * ray.d is on the sphere, or false if none such exists
    intersection(ray : Ray) : (number | boolean) {
	
	let vPC : Vec3 = this.c.minus(ray.o); // from ray origin to sphere center
	let b : number = vPC.dot(ray.d);      // time b such that ray.o + t * ray.d is the projection of this.c onto the ray
        let Ls : number = vPC.lengthsq();
	if (b < 0) {             // is sphere center behind ray origin?
	    if (Ls <= this.rsq) { // check if ray origin is inside the sphere
		return false; // TODO for now we just don't draw the sphere if we're inside		
	    } else {
		return false;
	    }
	} else {
	    let D : number = b * b + this.rsq - Ls; // discriminant = b^2 + r^2 - L^2
	    if (D < 0) { return false; }
	    else { 
		let sqD : number = Math.sqrt(D);
		let t1 : number = b - sqD;
		let t2 : number = b + sqD;
		if (ray.atTime(t1).distancesq(ray.o) < ray.atTime(t2).distancesq(ray.o)) {
		    return t1;
		} else {
		    return t2;
		}
	    }
	}
    }
}

class Material {
    color : Color;

    constructor(color : Color) {
	this.color = color;
	return this;
    }
}

class Light {
    position : Pt3;
    direction : Vec3n;
    intensity : number;

    constructor(position : Pt3, direction : Vec3n, intensity : number) {
	this.position = position;
	this.direction = direction;
	this.intensity = intensity;
	return this;
    }
}

class PointLight extends Light {
    constructor(position : Pt3, intensity : number) {
	super(position, null, intensity);
	return this;
    }
}

class AmbientLight extends Light {
    constructor(intensity : number) {
	super(null, null, intensity);
	return this;
    }
}

class DirectionalLight extends Light {
    constructor(direction : Vec3n , intensity : number) {
	super(null, direction, intensity);
	return this;
    }
}   

/********************* INTERNAL TYPES *************/
// Pt2: two-dimensional point
// Pt3: three-dimensional point
// Vec3: three-dimensional vector
// Ray: a ray (in 3D)
// Color: RGB color
// Rectangle: a rectangle (in 3D space)

// a two-dimensional point is a pair of integers
// x is between -canvas.width / 2 and +canvas.width / 2
// y is between -canvas.height / 2 and +canvas.height / 2
class Pt2 {
    x: number;
    y: number;
    constructor(x : number, y : number) {
	this.x = x;
	this.y = y;
	return this;
    }

    pmult(p : Pt2) : Pt2 {
	return new Pt2(this.x * p.x, this.y * p.y);
    }
}

class Pt3 {
    x : number;
    y : number;
    z : number;
    constructor(x : number, y : number, z : number) {
	this.x = x;
	this.y = y;
	this.z = z;
	return this;
    }

    minus(p : (Pt3 | Vec3)) : Vec3 {
	return new Vec3(this.x - p.x, this.y - p.y, this.z - p.z);
    }

    distancesq(p : Pt3) : number {
	return (this.x - p.x) ** 2 + (this.y - p.y) ** 2 + (this.z - p.z) ** 2;
    }

    translate(v : Vec3) : Pt3 {
	return new Pt3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
}

class Vec3 {
    x : number;
    y : number;
    z : number;
    
    constructor(x : number, y : number, z : number) {
	this.x = x;
	this.y = y;
	this.z = z;
	return this;
    }

    plus(v : (Pt3 | Vec3)) : Vec3 {
	return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    dot(v : Vec3) : number {
	return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    lengthsq() : number {
	return this.dot(this);
    }

    length() : number {
	return Math.sqrt(this.lengthsq());
    }

    normalize() : Vec3n {
	return new Vec3n(this.x,this.y,this.z);
    }

    scale(r : number) : Vec3 {
	return new Vec3(r * this.x, r * this.y, r * this.z);
    }

}

// a normalized vector, i.e., length 1
class Vec3n extends Vec3 {
    constructor(x : number, y : number, z : number) {
	super(x,y,z);
	let l = Math.sqrt(x * x + y * y + z * z);
	if (l === 0) { return this; }
	if (l != 1) {
	    this.x /= l;
	    this.y /= l;
	    this.z /= l;
	}
	return this;
    }

    lengthsq() : number {
	return 1;
    }
    
    length() : number {
	return 1;
    }
}

class Ray {
    o : Pt3;
    d : Vec3n;

    constructor(o, d) {
	this.o = o;
	this.d = d;
	return this;
    }

    atTime(t : number) {
	return this.o.translate(this.d.scale(t));
    }
}

// Rectangle in 3D space:
// center at a point c
// normal vector in direction n
// width w and height h
class Rectangle {
    c : Pt3;
    n : Vec3n;
    w : number;
    h : number;

    constructor(c, n, w, h) {
	this.c = c;
	this.n = n;
	this.w = w;
	this.h = h;
	return this;
    }
}
// a color is a tuple of 3 floats between 0 and 1
class Color {
    r: number;
    g: number;
    b: number;
    
    constructor(r,g,b) {
	this.r = r;
	this.g = g;
	this.b = b;
	return this;
    }

    scale(i : number) {
	return new Color(this.r * i, this.g * i, this.b * i);
    }
}



/********************* RENDERING FUNCTION ***************/
function render(scene) {
    let cwidth : number = canvas.width;
    let cheight : number = canvas.height;
    let vwidth : number = scene.camera.viewport.w;
    let vheight : number = scene.camera.viewport.h;
    let canvToViewport : Pt2 = new Pt2(vwidth / (cwidth), vheight / (cheight));

    let campos : Pt3 = scene.camera.position;
   

    for (let y = -cheight/2; y < cheight/2; y++) {
	for (let x = -cwidth/2; x < cwidth/2; x++) {
	    let c = new Pt2(x,y) // point on canvas
	    let p = c.pmult(canvToViewport); // corresponding point on viewport
	    let pvc = new Pt3(p.x - scene.camera.viewport.c.x, p.y - scene.camera.viewport.c.y, 0); // from viewport center to point
	    let dir : Vec3n = scene.camera.direction.plus(pvc).normalize();
	    let col : Color = castRay(new Ray(campos, dir), scene);
	    // if (y == 0 && x == cwidth/2 - 1) { console.log(p); console.log(dir); console.log(col); }
	    putPixel(c, col);
	}
    }
}



function castRay(ray : Ray, scene) : Color {
    let min_t : number = Infinity;
    let hit_sphere : Sphere = null;
    for (var s of scene.spheres) {
	let t = s.intersection(ray);
	if (t && t < min_t) {
	    min_t = t;
	    hit_sphere = s;
	}
    }
    if (hit_sphere === null) {
	return scene.bgcolor; // return background color if no intersection found
    } else {
	let intersectionPoint : Pt3 = ray.o.translate(ray.d.scale(min_t));
	let lightIntensityAtPoint : number = 0;
	for (var l of scene.lights) {
	    if (l.constructor.name === "AmbientLight") {
		lightIntensityAtPoint += l.intensity;
	    } else { // point light or directional light
		let lightDirection : Vec3n = null;
		if (l.constructor.name === "PointLight") {
		    lightDirection = l.position.minus(intersectionPoint).normalize();
		} else {
		    lightDirection = l.direction;
		}
		let normalAtIntersection : Vec3n = intersectionPoint.minus(hit_sphere.c).normalize();
		lightIntensityAtPoint += l.intensity * Math.max(0, lightDirection.dot(normalAtIntersection));
	    }
	}
	return hit_sphere.material.color.scale(lightIntensityAtPoint);
    }

}
    


/************* EXAMPLE CAMERA AND SCENE SETUP ***************/
let camera : Camera = new Camera(
    new Pt3(0,0,0),
    new Vec3(0,0,1),
    1,
    1
);

let red : Material = new Material( new Color(1, 0, 0) );
let green : Material = new Material( new Color(0, 1, 0) );
let blue : Material = new Material( new Color(0, 0, 1) );
let yellow : Material = new Material ( new Color(1, 1, 0) );

let scene = {
    camera,
    spheres: [
	new Sphere(new Pt3(0,-1,3), 1, red),
	new Sphere(new Pt3(2,0,4), 1, blue),
	new Sphere(new Pt3(-2,0,4), 1, green),
	new Sphere(new Pt3(0, -5001, 0), 5000, yellow)
//	new Sphere(new Pt3(-3,0,11), 2, red),
//      new Sphere(new Pt3(-1,-1.5,12), 2, red),
//      new Sphere(new Pt3(1.5, 0.5, 11), 3, green),
//	new Sphere(new Pt3(7, 5, 11), 4, green),
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
	new PointLight(new Pt3(2, 1, 0), 0.6),
	new AmbientLight(0.2),
	new DirectionalLight(new Vec3n(1,4,4), 0.2)
    ]
};


/********************* ENTRY POINT **********************/
function main() {
    render(scene);
    updateCanvas();
}

main();
