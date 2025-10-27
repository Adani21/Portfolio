// Matter.js setup with walls, mouse attraction and click explosion
const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

function createFloatingShapes() {
    const engine = Engine.create();
    engine.gravity.y = 0;

    const shapes = document.querySelectorAll('.shape');
    const bodies = [];

    // Create invisible walls at screen edges
    const wallThickness = 50;
    const walls = [
        // Top wall
        Bodies.rectangle(window.innerWidth / 2, -wallThickness / 2, window.innerWidth, wallThickness, { isStatic: true }),
        // Bottom wall
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight + wallThickness / 2, window.innerWidth, wallThickness, { isStatic: true }),
        // Left wall
        Bodies.rectangle(-wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true }),
        // Right wall
        Bodies.rectangle(window.innerWidth + wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true })
    ];

    // Add walls to world
    Composite.add(engine.world, walls);

    shapes.forEach((shape, index) => {
        const startX = gsap.utils.random(100, window.innerWidth - 100);
        const startY = gsap.utils.random(100, window.innerHeight - 100);

        let body;
        if (shape.classList.contains('shape-circle')) {
            body = Bodies.circle(startX, startY, 40, {
                restitution: 0.8,
                friction: 0.001,
                frictionAir: 0.01
            });
        } else if (shape.classList.contains('shape-square')) {
            body = Bodies.rectangle(startX, startY, 70, 70, {
                restitution: 0.8,
                friction: 0.001,
                frictionAir: 0.01
            });
        } else if (shape.classList.contains('shape-triangle')) {
            const vertices = [
                { x: 0, y: -35 },
                { x: -35, y: 35 },
                { x: 35, y: 35 }
            ];
            body = Bodies.fromVertices(startX, startY, vertices, {
                restitution: 0.8,
                friction: 0.001,
                frictionAir: 0.01
            });
        }

        Body.setVelocity(body, {
            x: gsap.utils.random(-1, 1),
            y: gsap.utils.random(-1, 1)
        });

        bodies.push({ element: shape, body: body });
        Composite.add(engine.world, body);
    });

    // Mouse position tracking
    let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    document.addEventListener('mousemove', (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
    });

    // Click explosion effect - BIGGER VERSION
    document.addEventListener('click', (e) => {
        const explosionX = e.clientX;
        const explosionY = e.clientY;
        const explosionForce = 0.5;  // Increased from 0.08 (more power!)
        const explosionRadius = 1200; // Increased from 600 (wider range!)

        bodies.forEach(({ body }) => {
            const dx = body.position.x - explosionX;
            const dy = body.position.y - explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < explosionRadius) {
                const forceMagnitude = explosionForce * (1 - distance / explosionRadius);
                const angle = Math.atan2(dy, dx);
                const force = {
                    x: Math.cos(angle) * forceMagnitude,
                    y: Math.sin(angle) * forceMagnitude
                };

                Body.applyForce(body, body.position, force);
            }
        });
    });


    // Apply attraction force towards mouse
    Events.on(engine, 'beforeUpdate', () => {
        bodies.forEach(({ body }) => {
            const dx = mousePos.x - body.position.x;
            const dy = mousePos.y - body.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const attractionStrength = 0.0005;
            const maxDistance = 400;

            if (distance < maxDistance && distance > 10) {
                const force = {
                    x: (dx / distance) * attractionStrength * body.mass,
                    y: (dy / distance) * attractionStrength * body.mass
                };
                Body.applyForce(body, body.position, force);
            }
        });
    });

    // Update visual positions
    Events.on(engine, 'afterUpdate', () => {
        bodies.forEach(({ element, body }) => {
            element.style.transform = `translate(${body.position.x}px, ${body.position.y}px) rotate(${body.angle}rad)`;
        });
    });

    Runner.run(Runner.create(), engine);
}

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Eye tracking (keep your existing code)
const pupils = document.querySelectorAll('.pupil');
let mouseX = 0;
let mouseY = 0;
let isAnimating = false;

if (pupils.length > 0) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(updatePupils);
        }
    });

    function updatePupils() {
        pupils.forEach((pupil) => {
            const eye = pupil.parentElement;
            const eyeRect = eye.getBoundingClientRect();

            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;

            const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);

            const distance = Math.min(8, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) / 20);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            pupil.style.transform = `translate(${x}px, ${y}px)`;
        });

        isAnimating = false;
    }
}

// Loading screen animation (keep your existing GSAP dots animation)
const dots = document.querySelectorAll('.loadingScreen .dot');
dots.forEach((dot, index) => {
    gsap.to(dot, {
        y: -30,
        opacity: 0.3,
        duration: 0.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: index * 0.2
    });
});

// Initialize
window.addEventListener('load', () => {
    createFloatingShapes();
});

// Modal functionality
function openModal(projectData) {
    const modal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalImage = document.getElementById('modalImage');
    const modalTechTags = document.getElementById('modalTechTags');
    
    // Set modal content
    modalTitle.textContent = projectData.title;
    modalDescription.textContent = projectData.description;
    modalImage.src = projectData.image || 'https://via.placeholder.com/600x400';
    
    // Clear and add tech tags
    modalTechTags.innerHTML = '';
    projectData.techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        modalTechTags.appendChild(tag);
    });
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Add click events to project cards
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            // Example project data - replace with your actual data
            const projectData = {
                title: card.querySelector('.project-title').textContent,
                description: card.querySelector('.project-description').textContent,
                image: 'https://via.placeholder.com/800x600', // Replace with actual image
                techStack: Array.from(card.querySelectorAll('.tech-tag')).map(tag => tag.textContent)
            };
            
            openModal(projectData);
        });
    });
});

// Single, clean FAQ toggle function
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isActive = item.classList.contains('active');
    
    // Toggle active class
    item.classList.toggle('active');
    
    // Toggle hidden attribute
    if (isActive) {
      answer.setAttribute('hidden', '');
    } else {
      answer.removeAttribute('hidden');
    }
    
    // Update aria-expanded
    button.setAttribute('aria-expanded', !isActive);
  });
});

// Scroll-based active navigation
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-item');

function updateActiveNav() {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    
    // Check if we're in this section (with 150px offset for navbar)
    if (window.scrollY >= sectionTop - 150) {
      current = section.getAttribute('id');
    }
  });
  
  // Update active class
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === `#${current}`) {
      item.classList.add('active');
    }
  });
}

// Run on scroll
window.addEventListener('scroll', updateActiveNav);

// Run on load
updateActiveNav();

// Smooth scroll on click
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = item.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      window.scrollTo({
        top: targetSection.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  });
});

// Register plugin
gsap.registerPlugin(ScrollTrigger);

// Animate all sections with fade in - triggers later
const sections1 = ["#home", "#about", "#projects", "#faq", "#contact"];

sections1.forEach(section => {
  gsap.to(section, {
    opacity: 1,
    duration: 1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: section,
      start: "top 40%",
      toggleActions: "play none none reverse"
    }
  });
});

