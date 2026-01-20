/**
 * Interactive Swarm Background & UI Enhancements
 * Features: Mouse interaction, Scroll Reveal, Dynamic Typewriter, Card Spotlight
 */

(function(root) {
    'use strict';
    root.SmallPRNG = function(seed) {
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    };
    root.SmallPRNG.prototype.random = function(min, max) {
        this.state = (this.a * this.state + this.c) % this.m;
        let res = this.state / (this.m - 1);
        if (min !== undefined && max !== undefined) return Math.floor(res * (max - min + 1) + min);
        return res;
    };

    root.Vector3D = function(x, y, z) { this.set(x, y, z); };
    root.Vector3D.prototype = {
        set: function(x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
        add: function(other) { this.x += other.x; this.y += other.y; return this; },
        sub: function(other) { this.x -= other.x; this.y -= other.y; return this; },
        mul: function(n) { this.x *= n; this.y *= n; return this; },
        move: function(dest) { dest.x = this.x; dest.y = this.y; return this; },
        distance: function(other) {
            let dx = this.x - other.x, dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        wrap2d: function(bounds) {
            if (this.x > bounds.x) { this.x = 0; return true; }
            if (this.x < 0) { this.x = bounds.x; return true; }
            if (this.y > bounds.y) { this.y = 0; return true; }
            if (this.y < 0) { this.y = bounds.y; return true; }
            return false;
        },
        clone: function() { return new Vector3D(this.x, this.y, this.z); }
    };

    root.requestAnimFrame = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); };
    })();
})(window);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    if (window.lucide) lucide.createIcons();

    // Scroll Effects
    const header = document.getElementById('fluent-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    const revealElements = document.querySelectorAll('.reveal, .reveal-text, .reveal-left, .reveal-pop, .reveal-card, .reveal-stagger');
    const revealOnScroll = () => {
        revealElements.forEach((el, i) => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
                setTimeout(() => el.classList.add('active'), i * 80);
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // Typewriter effect
    const tw = document.getElementById('typewriter');
    if (tw) {
        const txt = tw.innerText; 
        tw.innerText = '';
        let ti = 0;
        const type = () => { if(ti < txt.length) { tw.innerHTML += txt.charAt(ti++); setTimeout(type, 25); } };
        setTimeout(type, 800);
    }

    // Spotlight effect for agenda cards
    const agendaCards = document.querySelectorAll('.agenda-card');
    agendaCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
        });
    });

    // Swarm Canvas Implementation
    const canvas = document.getElementById("swarm");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const p = new Perlin();
    const rctx = new SmallPRNG(+new Date());
    const bounds = new Vector3D(0, 0, 0);
    let width, height, particles = [], hue = 205;

    const settings = {
        particleNum: window.innerWidth < 768 ? 1200 : 2500,
    };

    const monitor = new MouseMonitor(canvas);

    const resize = () => {
        canvas.width = width = bounds.x = window.innerWidth;
        canvas.height = height = bounds.y = window.innerHeight;
        context.fillStyle = '#050505';
        context.fillRect(0, 0, width, height);
    };
    window.addEventListener('resize', resize);
    resize();

    p.init(() => rctx.random(0, 255));

    for(let i = 0; i < settings.particleNum; i++) {
        particles.push(new Particle(p, bounds, rctx, monitor));
    }

    (function render() {
        requestAnimFrame(render);
        context.beginPath();
        for(let i = 0; i < particles.length; i++) {
            particles[i].step();
            particles[i].render(context);
        }
        context.globalCompositeOperation = 'source-over';
        context.fillStyle = 'rgba(5, 5, 5, .18)';
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'lighter';
        context.strokeStyle = `hsla(${hue}, 75%, 45%, .25)`;
        context.stroke();
        context.closePath();
    })();
});

function Perlin() {
    this.grad3 = [new Vector3D(1,1,0), new Vector3D(-1,1,0), new Vector3D(1,-1,0), new Vector3D(-1,-1,0), new Vector3D(1,0,1), new Vector3D(-1,0,1), new Vector3D(1,0,-1), new Vector3D(-1,0,-1)];
    this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    this.perm = new Array(512);
    this.gradP = new Array(512);
}
Perlin.prototype.init = function(prng) {
    for(let i=0; i<256; i++) {
        this.perm[i] = this.perm[i+256] = this.p[i];
        this.gradP[i] = this.gradP[i+256] = this.grad3[this.perm[i] % this.grad3.length];
    }
};
Perlin.prototype.simplex3d = function(x, y, z) {
    return Math.sin(x + z) * Math.cos(y - z);
};

function MouseMonitor(el) {
    this.position = new Vector3D(0,0,0);
    this.state = {left: false, right: false, middle: false};
    window.addEventListener('mousemove', e => {
        this.position.x = e.clientX;
        this.position.y = e.clientY;
    });
    window.addEventListener('mousedown', e => {
        if(e.which === 1) this.state.left = true;
        if(e.which === 3) this.state.right = true;
    });
    window.addEventListener('mouseup', () => this.state.left = this.state.middle = this.state.right = false);
    window.addEventListener('contextmenu', e => e.preventDefault());
}

function Particle(g, b, r, m) {
    this.p = new Vector3D(); this.t = new Vector3D(); this.v = new Vector3D();
    this.g = g; this.b = b; this.r = r; this.m = m;
    this.reset();
}
Particle.prototype.reset = function() {
    this.p.x = this.t.x = this.r.random() * this.b.x;
    this.p.y = this.t.y = this.r.random() * this.b.y;
    this.v.set(1, 1, 0);
    this.life = this.r.random(1000, 5000); this.iter = 0;
};
Particle.prototype.step = function() {
    if(this.iter++ > this.life) this.reset();
    let xx = this.p.x/300, yy = this.p.y/300, zz = Date.now()/8000;
    this.v.x += (this.r.random() - 0.5) * 0.2 + this.g.simplex3d(xx, yy, zz) * 0.1;
    this.v.y += (this.r.random() - 0.5) * 0.2 + this.g.simplex3d(xx, yy, -zz) * 0.1;
    
    if(this.m.state.left) this.v.add(this.m.position.clone().sub(this.p).mul(0.0002));
    if(this.m.state.right && this.p.distance(this.m.position) < 200) this.v.add(this.p.clone().sub(this.m.position).mul(0.01));
    
    this.p.move(this.t).add(this.v.mul(0.96));
    this.p.wrap2d(this.b);
};
Particle.prototype.render = function(ctx) {
    ctx.moveTo(this.t.x, this.t.y);
    ctx.lineTo(this.p.x, this.p.y);
};