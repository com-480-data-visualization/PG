// viz3.js
import { ingredientCompoundsMap } from './sharedData.js';

export function initPairingOracle() {
    const container = d3.select("#oracle-viz-container");
    const width = 800;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);
        //.style("background-color", "var(--panel-bg)")
        //.style("border", "2px solid var(--border-color)")
        //.style("border-radius", "15px");

    // Groups for layering (lines behind nodes)
    const linkGroup = svg.append("g").attr("class", "oracle-links");
    const nodeGroup = svg.append("g").attr("class", "oracle-nodes");
    const textGroup = svg.append("g").attr("class", "oracle-text-labels");

    // Dynamic description text at the bottom
    const descriptionText = svg.append("text")
        .attr("x", centerX)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .style("fill", "var(--flavor-blueberry)")
        .style("font-style", "italic");

    // UI Elements
    const searchInput = document.getElementById("oracle-search");
    const autocompleteList = document.getElementById("oracle-autocomplete");
    const randomBtn = document.getElementById("oracle-random-btn");

    let numTraditional = 2;
    let numRadical = 2;
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
        
        // Filter and limit to 10 suggestions
        const matches = allIngredients.filter(ing => ing.includes(query.toLowerCase())).slice(0, 10);
        
        if (matches.length > 0) {
            autocompleteList.style.display = "block";
            matches.forEach(match => {
                const li = document.createElement("li");
                // Capitalize for display
                li.textContent = match.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
                li.style.padding = "8px 12px";
                li.style.cursor = "pointer";
                li.style.borderBottom = "1px solid var(--border-color)";
                li.onmouseover = () => li.style.backgroundColor = "var(--border-color)";
                li.onmouseout = () => li.style.backgroundColor = "transparent";
                li.onclick = () => {
                    searchInput.value = li.textContent;
                    autocompleteList.style.display = "none";
                    processOracle(match); // Run the algorithm!
                };
                autocompleteList.appendChild(li);
            });
        } else {
            autocompleteList.style.display = "none";
        }
    }

    searchInput.addEventListener("input", (e) => showAutocomplete(e.target.value));
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target !== searchInput) autocompleteList.style.display = "none";
    });

    // Randomizer Button
    randomBtn.addEventListener("click", () => {
        const randomIng = allIngredients[Math.floor(Math.random() * allIngredients.length)];
        // Capitalize format for the input box
        searchInput.value = randomIng.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        processOracle(randomIng);
    });

    // Core Algorithm: Find matches based on shared compounds
    function processOracle(baseIngName) {
        currentBaseIngredient = baseIngName; // Save state for the +/- buttons
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

        // Helper: Calculate dynamic Y positions to keep the group vertically centered
        const getVerticalPositions = (count) => {
            const spacing = 55;
            const startY = centerY - ((count - 1) * spacing) / 2;
            return Array.from({length: count}, (_, i) => startY + i * spacing);
        };

        const tY = getVerticalPositions(numTraditional);
        const rY = getVerticalPositions(numRadical);

        const data = {
            base: { id: "base", label: formatLabel(baseIngName), x: centerX, y: centerY },
            traditional: traditionalMatches.map((t, i) => ({
                id: `t${i}`, label: formatLabel(t.name), x: centerX - 260, y: tY[i], color: "var(--flavor-matcha)", shared: t.sharedCompounds
            })),
            radical: radicalMatches.map((r, i) => ({
                id: `r${i}`, label: formatLabel(r.name), x: centerX + 260, y: rY[i], color: "var(--flavor-strawberry)", shared: r.sharedCompounds
            }))
        };

        updateOracleVisualization(data);
    }

    // Draw the D3 Visualization
    function updateOracleVisualization(data) {
        const allNodes = [data.base, ...data.traditional, ...data.radical];
        const allLinks = [...data.traditional, ...data.radical].map(target => ({
            source: data.base, target: target, color: target.color, shared: target.shared
        }));

        // --- DRAW CATEGORY LABELS & BUTTONS ---
        if (textGroup.selectAll("g.category-group").empty()) {
            
            // Traditional Header Group
            const tGroup = textGroup.append("g").attr("class", "category-group")
                .attr("transform", `translate(${centerX - 260}, ${centerY - 160})`); // Pushed up slightly to make room for 5 nodes
            
            tGroup.append("text").attr("text-anchor", "middle").text("Traditional")
                .style("font-family", "sans-serif").style("font-size", "18px").style("fill", "var(--text-dark)");
            
            tGroup.append("text").attr("x", -75).attr("y", -1).attr("text-anchor", "middle").text("[-]")
                .style("cursor", "pointer").style("font-family", "monospace").style("font-size", "16px").style("fill", "#747d8c")
                .on("mouseover", function() { d3.select(this).style("fill", "var(--text-dark)"); })
                .on("mouseout", function() { d3.select(this).style("fill", "#747d8c"); })
                .on("click", () => { if (numTraditional > 1) { numTraditional--; processOracle(currentBaseIngredient); }});
                
            tGroup.append("text").attr("x", 75).attr("y", -1).attr("text-anchor", "middle").text("[+]")
                .style("cursor", "pointer").style("font-family", "monospace").style("font-size", "16px").style("fill", "#747d8c")
                .on("mouseover", function() { d3.select(this).style("fill", "var(--text-dark)"); })
                .on("mouseout", function() { d3.select(this).style("fill", "#747d8c"); })
                .on("click", () => { if (numTraditional < 5) { numTraditional++; processOracle(currentBaseIngredient); }});

            // Radical Header Group
            const rGroup = textGroup.append("g").attr("class", "category-group")
                .attr("transform", `translate(${centerX + 260}, ${centerY - 160})`);
                
            rGroup.append("text").attr("text-anchor", "middle").text("Radical")
                .style("font-family", "sans-serif").style("font-size", "18px").style("fill", "var(--text-dark)");

            rGroup.append("text").attr("x", -65).attr("y", -1).attr("text-anchor", "middle").text("[-]")
                .style("cursor", "pointer").style("font-family", "monospace").style("font-size", "16px").style("fill", "#747d8c")
                .on("mouseover", function() { d3.select(this).style("fill", "var(--text-dark)"); })
                .on("mouseout", function() { d3.select(this).style("fill", "#747d8c"); })
                .on("click", () => { if (numRadical > 1) { numRadical--; processOracle(currentBaseIngredient); }});
                
            rGroup.append("text").attr("x", 65).attr("y", -1).attr("text-anchor", "middle").text("[+]")
                .style("cursor", "pointer").style("font-family", "monospace").style("font-size", "16px").style("fill", "#747d8c")
                .on("mouseover", function() { d3.select(this).style("fill", "var(--text-dark)"); })
                .on("mouseout", function() { d3.select(this).style("fill", "#747d8c"); })
                .on("click", () => { if (numRadical < 5) { numRadical++; processOracle(currentBaseIngredient); }});
        }

        // --- DRAW LINKS ---
        const links = linkGroup.selectAll("line").data(allLinks, d => d.target.id);
        links.enter()
            .append("line")
            .style("stroke", d => d.color)
            .style("stroke-width", 2)
            .style("stroke-dasharray", "6,6")
            .merge(links)
            // Instantly snap lines to new positions
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        links.exit().remove();

        // --- DRAW NODES ---
        const nodeHeight = 44;
        const getWidth = (label) => Math.max(140, label.length * 9 + 30);

        const nodes = nodeGroup.selectAll("rect").data(allNodes, d => d.id);
        
        nodes.enter()
            .append("rect")
            .attr("rx", 10).attr("ry", 10)
            .style("fill", "white")
            .style("stroke", d => d.id === "base" ? "var(--text-dark)" : d.color)
            .style("stroke-width", 2)
            .style("cursor", d => d.id === "base" ? "default" : "pointer")
            .merge(nodes)
            // Instantly snap size and position
            .attr("width", d => getWidth(d.label))
            .attr("height", nodeHeight)
            .attr("x", d => d.x - getWidth(d.label)/2)
            .attr("y", d => d.y - nodeHeight/2)
            .on("mouseover", function(event, d) {
                if (d.id !== "base") {
                    d3.select(this).style("fill", "#f8f9fa").style("stroke-width", 3);
                    const sharedCompound = d.shared[Math.floor(Math.random() * d.shared.length)];
                    descriptionText.text(`> ${data.base.label} and ${d.label} are linked by ${sharedCompound}. <`);
                }
            })
            .on("mouseout", function(event, d) {
                if (d.id !== "base") {
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
            .style("font-size", "15px")
            .style("pointer-events", "none")
            .style("fill", d => d.id === "base" ? "var(--text-dark)" : d.color)
            .merge(labels)
            // Instantly snap text position
            .text(d => d.label)
            .attr("x", d => d.x)
            .attr("y", d => d.y);
            
        labels.exit().remove();

        // Reset the default description when an animation triggers
        descriptionText.text(`> Hover over ingredients to discover their molecular links to ${data.base.label}. <`);
    }

    // Initialize with a fun default ingredient to kick things off!
    processOracle("tomato");
    searchInput.value = "Tomato";
}