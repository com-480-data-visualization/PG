// viz3.js
import { ingredientCompoundsMap } from './sharedData.js';

export function initPairingOracle() {
    const container = d3.select("#oracle-viz-container");
    const width = 1000; 
    const height = 550; 
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("overflow", "visible");

    // Add SVG Definitions for the Arrowheads
    const defs = svg.append("defs");
    
    const createMarker = (id, color) => {
        defs.append("marker")
            .attr("id", id)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10) 
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", color);
    };
    createMarker("arrow-trad", "var(--flavor-matcha)");
    createMarker("arrow-rad", "var(--flavor-strawberry)");

    // Groups for layering (Lines -> Nodes -> Text)
    const linkGroup = svg.append("g").attr("class", "oracle-links");
    const nodeGroup = svg.append("g").attr("class", "oracle-nodes");
    const textGroup = svg.append("g").attr("class", "oracle-text-labels");

    // Dynamic description text at the bottom
    const descriptionText = svg.append("text")
        .attr("x", centerX)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .style("fill", "var(--flavor-blueberry)")
        .style("font-weight", "600");

    // UI Elements
    const searchInput = document.getElementById("oracle-search");
    const autocompleteList = document.getElementById("oracle-autocomplete");
    const randomBtn = document.getElementById("oracle-random-btn");

    let numTraditional = 3;
    let numRadical = 3;
    let currentBaseIngredient = "";

    // Get all unique ingredients that we loaded in Viz 2
    const allIngredients = Array.from(ingredientCompoundsMap.keys());

    // Autocomplete Logic
    function showAutocomplete(query) {
        autocompleteList.innerHTML = "";
        if (!query) {
            autocompleteList.style.display = "none";
            return;
        }
        
        const matches = allIngredients.filter(ing => ing.includes(query.toLowerCase())).slice(0, 10);
        
        if (matches.length > 0) {
            autocompleteList.style.display = "block";
            matches.forEach(match => {
                const li = document.createElement("li");
                // Capitalize for display
                li.textContent = match.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
                li.style.padding = "10px 15px";
                li.style.cursor = "pointer";
                li.style.borderBottom = "1px solid var(--border-color)";
                li.onmouseover = () => { li.style.backgroundColor = "var(--flavor-mango)"; li.style.color = "white"; };
                li.onmouseout = () => { li.style.backgroundColor = "transparent"; li.style.color = "var(--text-dark)"; };
                li.onclick = () => {
                    searchInput.value = li.textContent;
                    autocompleteList.style.display = "none";
                    processOracle(match); 
                };
                autocompleteList.appendChild(li);
            });
        } else {
            autocompleteList.style.display = "none";
        }
    }

    searchInput.addEventListener("input", (e) => showAutocomplete(e.target.value));
    
    // "Enter" key support
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.toLowerCase();
            const match = allIngredients.find(ing => ing === query) || allIngredients.find(ing => ing.includes(query));
            if (match) {
                searchInput.value = match.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                autocompleteList.style.display = "none";
                processOracle(match);
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target !== searchInput) autocompleteList.style.display = "none";
    });

    if (randomBtn) {
        randomBtn.addEventListener("click", () => {
            const randomIng = allIngredients[Math.floor(Math.random() * allIngredients.length)];
            searchInput.value = randomIng.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            processOracle(randomIng);
        });
    }

    // Core Algorithm
    function processOracle(baseIngName) {
        currentBaseIngredient = baseIngName; 
        const baseCompounds = ingredientCompoundsMap.get(baseIngName);
        if (!baseCompounds || baseCompounds.size === 0) return;

        let matches = [];
        
        // Loop through all other ingredients to count shared compounds
        for (let [ingName, otherCompounds] of ingredientCompoundsMap.entries()) {
            if (ingName === baseIngName) continue;
            
            const shared = [...baseCompounds].filter(c => otherCompounds.has(c));
            if (shared.length > 0) {
                matches.push({ name: ingName, sharedCount: shared.length, sharedCompounds: shared });
            }
        }

        if (matches.length < Math.max(numTraditional, numRadical)) return;

        // Sort descending by number of shared compounds
        matches.sort((a, b) => b.sharedCount - a.sharedCount);

        // Dynamically slice based on state
        const traditionalMatches = matches.slice(0, numTraditional);
        // Grab from the bottom (least shared) and reverse so the absolute weirdest are first
        const radicalMatches = matches.slice(-numRadical).reverse();

        const formatLabel = (str) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const getWidth = (label) => Math.max(140, label.length * 9 + 30);

        // Sub-Hub Box Coordinates
        const tCenterX = centerX - 250;
        const rCenterX = centerX + 250;
        const radius = 220; 

        // Mathematical helper to generate an even half-circle spread
        const getAngles = (count, centerAngle, spreadAngle) => {
            if (count === 1) return [centerAngle];
            const start = centerAngle - spreadAngle / 2;
            const step = spreadAngle / (count - 1);
            return Array.from({length: count}, (_, i) => start + i * step);
        };

        const tradAngles = getAngles(numTraditional, Math.PI, Math.PI * 0.7); 
        const radAngles = getAngles(numRadical, 0, Math.PI * 0.7);

        const data = {
            base: { id: "base", label: formatLabel(baseIngName), x: centerX, y: centerY, width: getWidth(formatLabel(baseIngName)), type: 'ingredient', color: "var(--text-dark)" },
            tradCat: { id: "tradCat", label: "Traditional", x: tCenterX, y: centerY, width: 140, type: 'category', color: "var(--flavor-matcha)" },
            radCat: { id: "radCat", label: "Radical", x: rCenterX, y: centerY, width: 140, type: 'category', color: "var(--flavor-strawberry)" },
            
            traditional: traditionalMatches.map((t, i) => ({
                id: `t${i}`, label: formatLabel(t.name), 
                x: tCenterX + radius * Math.cos(tradAngles[i]), 
                y: centerY + radius * Math.sin(tradAngles[i]), 
                color: "var(--flavor-matcha)", marker: "url(#arrow-trad)", shared: t.sharedCompounds, width: getWidth(formatLabel(t.name)), type: 'ingredient'
            })),   
            radical: radicalMatches.map((r, i) => ({
                id: `r${i}`, label: formatLabel(r.name), 
                x: rCenterX + radius * Math.cos(radAngles[i]), 
                y: centerY + radius * Math.sin(radAngles[i]), 
                color: "var(--flavor-strawberry)", marker: "url(#arrow-rad)", shared: r.sharedCompounds, width: getWidth(formatLabel(r.name)), type: 'ingredient'
            }))
        };

        updateOracleVisualization(data);
    }

    // Helper: Calculates exact intersection points of a line with the boundary of our pills/boxes
    function getEdgePoint(source, target, isStart) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        const node = isStart ? source : target;
        
        const a = node.width / 2 + 5; 
        const b = 22 + 5; 
        const r = (a * b) / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2));
        
        return {
            x: node.x + (isStart ? 1 : -1) * r * Math.cos(angle),
            y: node.y + (isStart ? 1 : -1) * r * Math.sin(angle)
        };
    }

    // Draw Visualization
    function updateOracleVisualization(data) {
        const allNodes = [data.base, data.tradCat, data.radCat, ...data.traditional, ...data.radical];
        
        const allLinks = [
            { source: data.base, target: data.tradCat, color: "var(--flavor-matcha)", marker: "url(#arrow-trad)", width: 3 },
            { source: data.base, target: data.radCat, color: "var(--flavor-strawberry)", marker: "url(#arrow-rad)", width: 3 },
            ...data.traditional.map(target => ({ source: data.tradCat, target: target, color: target.color, marker: target.marker, shared: target.shared, width: 2 })),
            ...data.radical.map(target => ({ source: data.radCat, target: target, color: target.color, marker: target.marker, shared: target.shared, width: 2 }))
        ];

        // --- DRAW ARROWS ---
        const links = linkGroup.selectAll("line").data(allLinks, d => d.source.id + "-" + d.target.id);
        links.enter()
            .append("line")
            .style("stroke", d => d.color)
            .style("stroke-width", d => d.width)
            .attr("marker-end", d => d.marker) 
            .merge(links)
            .transition().duration(500)
            .attr("x1", d => getEdgePoint(d.source, d.target, true).x)
            .attr("y1", d => getEdgePoint(d.source, d.target, true).y)
            .attr("x2", d => getEdgePoint(d.source, d.target, false).x)
            .attr("y2", d => getEdgePoint(d.source, d.target, false).y);
        links.exit().remove();

        // --- DRAW NODES ---
        const nodeHeight = 44;
        const nodes = nodeGroup.selectAll("rect").data(allNodes, d => d.id);
        
        nodes.enter()
            .append("rect")
            .style("cursor", d => d.type === 'ingredient' && d.id !== 'base' ? "pointer" : "default")
            .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)")
            .merge(nodes)
            .transition().duration(500)
            .attr("rx", d => d.type === 'category' ? 8 : 22) 
            .attr("ry", d => d.type === 'category' ? 8 : 22)
            .style("fill", d => {
                if (d.id === "base" || d.type === 'category') return d.color;
                return "white"; 
            })
            .style("stroke", d => {
                if (d.id === "base" || d.type === 'category') return "none";
                return d.color;
            })
            .style("stroke-width", d => (d.id === "base" || d.type === 'category') ? 0 : 2)
            .attr("width", d => d.width)
            .attr("height", nodeHeight)
            .attr("x", d => d.x - d.width/2)
            .attr("y", d => d.y - nodeHeight/2);
            
        // Node Interactivity
        nodeGroup.selectAll("rect")
            .on("mouseover", function(event, d) {
                if (d.type === 'ingredient' && d.id !== "base") {
                    d3.select(this).style("fill", "#f8f9fa").style("stroke-width", 3);
                    const sharedCompound = d.shared[Math.floor(Math.random() * d.shared.length)];
                    descriptionText.text(`> ${data.base.label} and ${d.label} both share ${sharedCompound}! <`);
                }
            })
            .on("mouseout", function(event, d) {
                if (d.type === 'ingredient' && d.id !== "base") {
                    d3.select(this).style("fill", "white").style("stroke-width", 2);
                    descriptionText.text(`> Hover over ingredients to discover their molecular links to ${data.base.label}. <`);
                }
            });
            
        nodes.exit().remove();

        // --- DRAW TEXT LABELS ---
        const labels = textGroup.selectAll("text.node-label").data(allNodes, d => d.id);
        labels.enter()
            .append("text")
            .attr("class", "node-label")
            .attr("text-anchor", "middle")
            .attr("dy", "5px") 
            .style("font-family", "sans-serif")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .merge(labels)
            .transition().duration(500)
            .style("font-size", d => d.type === 'category' ? "18px" : "15px")
            .style("fill", d => {
                if (d.id === "base" || d.type === 'category') return "white";
                return "var(--text-dark)"; 
            })
            .text(d => d.label)
            .attr("x", d => d.x)
            .attr("y", d => d.y);
            
        labels.exit().remove();

        // --- DRAW [ + ] and [ - ] ---
        const controlsData = [
            { id: "t-plus", text: "[+]", x: data.tradCat.x, y: data.tradCat.y - 32, onClick: () => { if(numTraditional < 5) { numTraditional++; processOracle(currentBaseIngredient); } } },
            { id: "t-minus", text: "[-]", x: data.tradCat.x, y: data.tradCat.y + 42, onClick: () => { if(numTraditional > 1) { numTraditional--; processOracle(currentBaseIngredient); } } },
            { id: "r-plus", text: "[+]", x: data.radCat.x, y: data.radCat.y - 32, onClick: () => { if(numRadical < 5) { numRadical++; processOracle(currentBaseIngredient); } } },
            { id: "r-minus", text: "[-]", x: data.radCat.x, y: data.radCat.y + 42, onClick: () => { if(numRadical > 1) { numRadical--; processOracle(currentBaseIngredient); } } }
        ];

        // Controls for the [ + ] and [ - ] buttons
        const controls = textGroup.selectAll("text.control-btn").data(controlsData, d => d.id);
        controls.enter()
            .append("text")
            .attr("class", "control-btn")
            .attr("text-anchor", "middle")
            .style("cursor", "pointer")
            .style("font-family", "monospace")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#747d8c")
            .on("mouseover", function() { d3.select(this).style("fill", "var(--text-dark)"); })
            .on("mouseout", function() { d3.select(this).style("fill", "#747d8c"); })
            .on("click", (event, d) => d.onClick())
            .merge(controls)
            .transition().duration(500)
            .text(d => d.text)
            .attr("x", d => d.x)
            .attr("y", d => d.y);
            
        controls.exit().remove();

        descriptionText.text(`> Hover over ingredients to discover their molecular links to ${data.base.label}. <`);
    }

    // Initialize with a fun default ingredient to kick things off!
    processOracle("tomato");
    searchInput.value = "Tomato";
}