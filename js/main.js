// main.js
import { initBipartiteGraph } from './viz1.js';
import { initCulturalMap } from './viz2.js';
import { initPairingOracle } from './viz3.js';
import { loadSharedData } from './sharedData.js';

document.addEventListener("DOMContentLoaded", async () => {
    initBipartiteGraph();

    await loadSharedData();

    initCulturalMap();
    initPairingOracle();

    initScrollObservers();
    initHorizontalScroll();
});

function initScrollObservers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'network-explorer') {
                    console.log("User reached the Bipartite Graph!");
                }
                if (entry.target.id === 'cultural-maps') {
                    console.log("User reached the Map!");
                }
            }
        });
    }, { threshold: 0.5 }); 

    document.querySelectorAll('.viz-card').forEach(card => observer.observe(card));
}

function initHorizontalScroll() {
    const scrollContainer = document.getElementById('cultural-maps');
    const leftBtn = document.getElementById('scroll-left-btn');
    const rightBtn = document.getElementById('scroll-right-btn');

    if (!scrollContainer || !leftBtn || !rightBtn) return;

    function updateArrows() {
        const buffer = 50; 
        if (scrollContainer.scrollLeft <= buffer) {
            leftBtn.classList.add('hidden');
        } else {
            leftBtn.classList.remove('hidden');
        }

        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (Math.ceil(scrollContainer.scrollLeft) >= maxScrollLeft - buffer) {
            rightBtn.classList.add('hidden');
        } else {
            rightBtn.classList.remove('hidden');
        }
    }

    leftBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
    });

    scrollContainer.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    updateArrows();
}