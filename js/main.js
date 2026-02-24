/* ==========================================================
   Portfolio interactions (frontend)
   - Responsive navbar + accessible mobile menu
   - Smooth scrolling with fixed-header offset
   - Scroll reveal (IntersectionObserver fallback)
   - Optional GSAP enhancements (if CDN is available)
   - Optional contact form backend submission
   ========================================================== */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isFinePointer = () =>
    window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  document.documentElement.classList.add("js");

  // --------------------------
  // Custom cursor (desktop only)
  // --------------------------
  function initCustomCursor() {
    if (!isFinePointer()) return;

    const cursor = $(".cursor");
    const ring = $(".cursor-ring");
    if (!cursor || !ring) return;

    document.body.classList.add("has-custom-cursor");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;

    document.addEventListener(
      "mousemove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    function tick() {
      // Cursor snaps; ring lags slightly for polish
      cursor.style.transform = `translate(${targetX}px, ${targetY}px)`;
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // --------------------------
  // Navbar scroll state
  // --------------------------
  function initNavbarScroll() {
    const nav = $("#navbar");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // --------------------------
  // Mobile menu (burger)
  // --------------------------
  function initMobileMenu() {
    const ham = $("#hamburger");
    const menu = $("#mobileMenu");
    if (!ham || !menu) return;

    const inner = $(".mobile-menu-inner", menu);
    const closeBtn = $("[data-menu-close]", menu);
    const closeTriggers = $$("[data-menu-close]", menu);

    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      ham.setAttribute("aria-expanded", String(open));
      ham.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      // Lock scroll only on small screens (mobile menu exists)
      document.documentElement.style.overflow = open ? "hidden" : "";

      if (open) {
        const target =
          closeBtn || closeTriggers[0] || menu;
        if (target && typeof target.focus === "function") {
          target.focus();
        }
      } else if (typeof ham.focus === "function") {
        ham.focus();
      }
    };

    const toggle = () => setOpen(!menu.classList.contains("is-open"));

    ham.addEventListener("click", toggle);
    closeTriggers.forEach((el) =>
      el.addEventListener("click", () => setOpen(false))
    );

    // Click outside card closes
    menu.addEventListener("click", (e) => {
      if (!inner) return;
      if (e.target === menu) setOpen(false);
    });

    // Escape closes
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!menu.classList.contains("is-open")) return;
      setOpen(false);
    });

    // If user resizes to desktop width, close menu
    const desktopMQ = window.matchMedia("(min-width: 720px)");
    if (desktopMQ && typeof desktopMQ.addEventListener === "function") {
      desktopMQ.addEventListener("change", (e) => {
        if (e.matches) setOpen(false);
      });
    }
  }

  // --------------------------
  // Smooth scroll (with header offset)
  // --------------------------
  function initSmoothScrolling() {
    const links = $$('a[href^="#"]');
    if (!links.length) return;

    const nav = $("#navbar");

    const scrollToHash = (hash) => {
      if (!hash || hash === "#") return false;
      const el = document.querySelector(hash);
      if (!el) return false;

      const headerOffset = (nav?.offsetHeight || 0) + 12;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      const behavior = prefersReducedMotion() ? "auto" : "smooth";

      window.scrollTo({ top, behavior });
      history.pushState(null, "", hash);
      return true;
    };

    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const ok = scrollToHash(href);
        if (ok) e.preventDefault();
      });
    });
  }

  // --------------------------
  // Scroll reveal
  // --------------------------
  function initScrollReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
    if (hasGSAP) {
      try {
        window.gsap.registerPlugin(window.ScrollTrigger);
        els.forEach((el) => {
          // Ensure layout is in its final state; GSAP animates from values below
          el.classList.add("is-visible");
          window.gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          });
        });
        return;
      } catch {
        // fall through to IntersectionObserver
      }
    }

    if (!("IntersectionObserver" in window)) {
      // Basic fallback
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  // --------------------------
  // Hero animations: GSAP if available, otherwise CSS fallback
  // --------------------------
  function initHeroAnimation() {
    if (prefersReducedMotion()) return;

    const hasGSAP = typeof window.gsap !== "undefined";
    if (!hasGSAP) {
      document.body.classList.add("hero-fallback");
      return;
    }

    try {
      if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

      // Navbar logo + CTA
      window.gsap.from(".nav-logo", {
        y: -20,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      window.gsap.from(".nav-cta", {
        y: -20,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.1,
      });

      window.gsap.from(".hero-title", {
        y: 30,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
      });

      window.gsap.from(".hero-desc", {
        y: 22,
        opacity: 0,
        duration: 0.9,
        delay: 0.12,
        ease: "power3.out",
      });

      window.gsap.from(".hero-actions", {
        y: 18,
        opacity: 0,
        duration: 0.85,
        delay: 0.22,
        ease: "power3.out",
      });

      // Gentle continuous 3D rock on the main heading
      window.gsap.to(".hero-title", {
        rotationX: 8,
        rotationY: -6,
        transformOrigin: "50% 50%",
        transformPerspective: 800,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Logo letter "D" drop on click
      const logo = document.querySelector(".nav-logo");
      const logoLetter = logo ? logo.querySelector(".logo-letter") : null;
      if (logo && logoLetter) {
        logo.addEventListener("click", (e) => {
          e.preventDefault();
          window.gsap.fromTo(
            logoLetter,
            { y: 0, rotation: 0 },
            {
              y: 34,
              rotation: 18,
              duration: 0.4,
              ease: "power2.in",
              yoyo: true,
              repeat: 1,
            }
          );
        });
      }

      // Subtle floating orb & depth
      const orb = document.querySelector(".hero-orb");
      if (orb) {
        window.gsap.to(orb, {
          y: -24,
          x: 16,
          scale: 1.08,
          duration: 5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // Parallax on scroll for hero layers
      const layers = window.gsap.utils.toArray(".hero-layer");
      layers.forEach((layer) => {
        const depthAttr = Number(layer.getAttribute("data-depth") || 0);
        const depth = depthAttr / 100;
        window.gsap.to(layer, {
          yPercent: depth * 26,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    } catch {
      document.body.classList.add("hero-fallback");
    }
  }

  // --------------------------
  // 3D tilt on cards (hover)
  // --------------------------
  function initTiltCards() {
    if (prefersReducedMotion() || !isFinePointer()) return;

    const cards = $$(".tilt-card");
    if (!cards.length) return;

    const maxTilt = 10;

    cards.forEach((card) => {
      const rect = () => card.getBoundingClientRect();

      const handleMove = (e) => {
        const r = rect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const centerX = r.width / 2;
        const centerY = r.height / 2;

        const ratioX = (x - centerX) / centerX;
        const ratioY = (y - centerY) / centerY;

        const rotateY = ratioX * maxTilt;
        const rotateX = -ratioY * maxTilt;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      };

      const reset = () => {
        card.style.transform = "";
      };

      card.addEventListener("mousemove", handleMove);
      card.addEventListener("mouseleave", reset);
    });
  }

  // --------------------------
  // Three.js scenes (hero + work)
  // --------------------------
  function initThree() {
    if (prefersReducedMotion()) return;
    if (typeof window.THREE === "undefined") return;

    initHeroThree();
    initWorkThree();
  }

  function initHeroThree() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xff4d00, 1.2);
    keyLight.position.set(3, 3, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xffb800, 0.9);
    rimLight.position.set(-3, -2, -4);
    scene.add(rimLight);

    const geo = new THREE.TorusKnotGeometry(1.2, 0.35, 220, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff7733,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0x220800,
      emissiveIntensity: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    let mouseX = 0;
    let mouseY = 0;

    if (isFinePointer()) {
      window.addEventListener(
        "mousemove",
        (e) => {
          const rect = canvas.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          mouseX = x;
          mouseY = y;
        },
        { passive: true }
      );
    }

    function animate() {
      requestAnimationFrame(animate);

      mesh.rotation.y += 0.007;
      mesh.rotation.x += 0.004;

      mesh.rotation.x += (mouseY * 0.6 - mesh.rotation.x) * 0.08;
      mesh.rotation.y += (mouseX * 0.8 - mesh.rotation.y) * 0.08;

      renderer.render(scene, camera);
    }

    animate();
  }

  function initWorkThree() {
    const canvas = document.getElementById("workCanvas");
    if (!canvas) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const light = new THREE.PointLight(0xff6b2c, 1.3);
    light.position.set(4, 3, 6);
    scene.add(light);

    const geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x151a2a,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x180808,
      emissiveIntensity: 0.4,
    });
    const cube = new THREE.Mesh(geo, mat);
    scene.add(cube);

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);

    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.004;
      cube.rotation.y += 0.007;
      renderer.render(scene, camera);
    }

    animate();
  }

  // --------------------------
  // Contact form (optional backend)
  // --------------------------
  function initContactForm() {
    const form = $("#contactForm");
    const status = $("#formStatus");
    if (!form || !status) return;

    const endpoints = [
      "https://danish-portfolio-1151.onrender.com/contact"
    ];

    const setStatus = (msg) => 
      status.textContent = msg;
    };

    const tryPost = async (payload) => {
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return true;
        } catch {
          // try next endpoint
        }
      }
      return false;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        message: String(fd.get("message") || "").trim(),
      };

      if (!payload.name || !payload.email || !payload.message) {
        setStatus("Please fill in all fields.");
        return;
      }

      setStatus("Sending…");
      const ok = await tryPost(payload);

      if (ok) {
        form.reset();
        setStatus("Message sent. I’ll get back to you soon.");
        return;
      }

      setStatus("Backend isn’t running. Please use the email button instead.");
    });
  }

  // --------------------------
  // Init
  // --------------------------
  initCustomCursor();
  initNavbarScroll();
  initMobileMenu();
  initSmoothScrolling();
  initScrollReveal();
  initHeroAnimation();
  initContactForm();
  initTiltCards();
  initThree();
})();

