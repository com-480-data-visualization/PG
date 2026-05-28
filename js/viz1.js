// ----- Viz 1 ----- //
export async function initBipartiteGraph() {
    const wrapper = d3.select("#svg-wrapper");
    const width = wrapper.node().getBoundingClientRect().width || 800;
    const margin = { top: 30, right: 150, bottom: 30, left: 150 };

    const svg = wrapper.append("svg")
        .attr("width", "100%")
        .attr("height", "400px");

    const mainContent = svg.append("g").attr("id", "main-graph-content");

    const linkGroup = mainContent.append("g").attr("class", "links");
    const rightNodeGroup = mainContent.append("g").attr("class", "right-nodes");
    const leftNodeGroup = mainContent.append("g").attr("class", "left-nodes");

    let magSize = 200; 
    const cursorOffset = 20; 
    
    let lensEnabled = false;
    let magZoom = 2.5;

    const toggleLensCheckbox = document.getElementById("toggle-lens");
    const zoomSlider = document.getElementById("lens-zoom");

    if (toggleLensCheckbox) {
        toggleLensCheckbox.addEventListener("change", (e) => {
            lensEnabled = e.target.checked;
            if (!lensEnabled) magnifier.style("display", "none");
        });
    }

    if (zoomSlider) {
        zoomSlider.addEventListener("input", (e) => {
            magZoom = parseFloat(e.target.value);
        });
    }

    svg.append("defs").append("clipPath")
        .attr("id", "mag-clip")
        .append("rect")
        .attr("id", "mag-clip-rect")
        .attr("width", magSize)
        .attr("height", magSize)
        .attr("rx", 8);

    const magnifier = svg.append("g")
        .attr("class", "magnifier")
        .style("pointer-events", "none")
        .style("display", "none");

    magnifier.append("rect")
        .attr("id", "mag-bg-rect")
        .attr("width", magSize)
        .attr("height", magSize)
        .attr("fill", "white")
        .attr("rx", 8);

    const magContent = magnifier.append("g")
        .attr("clip-path", "url(#mag-clip)");

    const magUse = magContent.append("use")
        .attr("href", "#main-graph-content")
        .attr("xlink:href", "#main-graph-content");

    magnifier.append("rect")
        .attr("id", "mag-border-rect")
        .attr("width", magSize)
        .attr("height", magSize)
        .attr("fill", "none")
        .attr("stroke", "var(--flavor-mango)")
        .attr("stroke-width", 3)
        .attr("rx", 8);

    svg.on("mousemove", function(event) {
        if (!lensEnabled) return; 

        magnifier.style("display", "block");

        const [mx, my] = d3.pointer(event);

        let boxX;
        if (mx > width / 2) {
            boxX = mx - magSize - cursorOffset;
        } else {
            boxX = mx + cursorOffset;
        }

        let boxY = my + cursorOffset;
        if (boxY + magSize > parseInt(svg.attr("height") || 400)) {
            boxY = my - magSize - cursorOffset;
        }

        magnifier.attr("transform", `translate(${boxX}, ${boxY})`);

        const tx = (magSize / 2) - (mx * magZoom);
        const ty = (magSize / 2) - (my * magZoom);
        magUse.attr("transform", `translate(${tx}, ${ty}) scale(${magZoom})`);
    });

    svg.on("mouseleave", () => magnifier.style("display", "none"));

    try {
        const ingrInfo = await d3.tsv("data/ingr_info.tsv");
        const compInfo = await d3.tsv("data/comp_info.tsv");
        const ingrComp = await d3.tsv("data/ingr_comp.tsv");

        const idToIngrName = new Map(ingrInfo.map(d => [d["# id"], d["ingredient name"].replace(/_/g, ' ')]));
        const idToCompName = new Map(compInfo.map(d => [d["# id"], d["Compound name"].replace(/_/g, ' ')]));
        
        const allIngredientsList = Array.from(idToIngrName.entries()).map(([id, name]) => ({id, name}));

        const logicalNames = [
            "tomato", "basil", "garlic", "butter", "onion", "roasted beef", 
            "coffee", "cocoa", "strawberry", "vanilla", "lemon", "chicken", 
            "pork", "apple", "black pepper", "cinnamon"
        ];
        
        const featuredIngredients = allIngredientsList.filter(d => 
            logicalNames.some(logical => d.name.toLowerCase() === logical)
        );

        // Dynamically calculate the simplest ingredient for the default state
        const ingredientConnectionCounts = d3.rollup(ingrComp, v => v.length, d => d["# ingredient id"]);
        
        featuredIngredients.sort((a, b) => {
            const countA = ingredientConnectionCounts.get(a.id) || 0;
            const countB = ingredientConnectionCounts.get(b.id) || 0;
            return countA - countB;
        });

        // Pick the simplest one that still has at least a few connections to look nice
        const simplestIngredient = featuredIngredients.find(d => (ingredientConnectionCounts.get(d.id) || 0) > 3) || featuredIngredients[0];

        let activeIngredientIds = new Set([simplestIngredient.id]); 
        let compoundFilterMode = "all";

        const btnIngr = document.getElementById("btn-ingredients");
        const menuIngr = document.getElementById("menu-ingredients");
        const searchInput = document.getElementById("ingr-search");
        const searchResults = document.getElementById("search-results");
        
        const btnComp = document.getElementById("btn-compounds");
        const menuComp = document.getElementById("menu-compounds");
        const radioFilters = document.querySelectorAll('input[name="comp-filter"]');

        function showSuggestions(query) {
            searchResults.innerHTML = "";
            let matches = [];
            
            if (!query || query.trim() === "") {
                matches = featuredIngredients.slice(0, 15);
            } else {
                matches = allIngredientsList.filter(d => d.name.toLowerCase().includes(query)).slice(0, 15);
            }
            
            matches.forEach(match => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>+</strong> ${match.name}`;
                li.addEventListener("click", () => {
                    activeIngredientIds.add(match.id);
                    searchInput.value = "";
                    menuIngr.classList.remove("active");
                    updateGraph(); 
                });
                searchResults.appendChild(li);
            });
        }

        btnIngr.addEventListener("click", () => {
            menuIngr.classList.toggle("active");
            menuComp.classList.remove("active");
            if (menuIngr.classList.contains("active")) {
                showSuggestions(searchInput.value.toLowerCase());
                searchInput.focus();
            }
        });

        btnComp.addEventListener("click", () => {
            menuComp.classList.toggle("active");
            menuIngr.classList.remove("active");
        });

        searchInput.addEventListener("input", (e) => {
            showSuggestions(e.target.value.toLowerCase());
        });

        radioFilters.forEach(radio => {
            radio.addEventListener("change", (e) => {
                compoundFilterMode = e.target.value;
                updateGraph(); 
            });
        });

        function updateGraph() {
            if (activeIngredientIds.size === 0) {
                svg.transition().duration(300).attr("height", 100);
                linkGroup.selectAll("path").remove();
                leftNodeGroup.selectAll("g").remove();
                rightNodeGroup.selectAll("g").remove();
                return;
            }

            const activeEdges = ingrComp.filter(d => activeIngredientIds.has(d["# ingredient id"]));
            const compoundCounts = d3.rollup(activeEdges, v => v.length, d => d["compound id"]);

            let activeCompoundIds = Array.from(compoundCounts.keys());
            
            if (compoundFilterMode === "shared") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) > 1);
            } else if (compoundFilterMode === "unique") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) === 1);
            } else if (compoundFilterMode === "all-shared") {
                activeCompoundIds = activeCompoundIds.filter(id => compoundCounts.get(id) === activeIngredientIds.size);
            }

            activeCompoundIds.sort((a, b) => {
                const nameA = idToCompName.get(a) || "";
                const nameB = idToCompName.get(b) || "";
                return nameA.localeCompare(nameB);
            });

            const finalEdges = activeEdges.filter(d => activeCompoundIds.includes(d["compound id"]));

            const containerHeight = wrapper.node().getBoundingClientRect().height || 500;
            const requiredHeight = containerHeight;
            
            magSize = Math.max(120, Math.min(250, activeCompoundIds.length * 5 + 50));

            d3.select("#mag-clip-rect").transition().duration(300).attr("width", magSize).attr("height", magSize);
            d3.select("#mag-bg-rect").transition().duration(300).attr("width", magSize).attr("height", magSize);
            d3.select("#mag-border-rect").transition().duration(300).attr("width", magSize).attr("height", magSize);

            svg.transition().duration(300)
               .attr("height", requiredHeight)
               .attr("viewBox", [0, 0, width, requiredHeight]);

            const leftX = margin.left;
            const rightX = width - margin.right - 80;
            
            const yScaleLeft = d3.scalePoint()
                .domain(Array.from(activeIngredientIds))
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.8);

            const yScaleRight = d3.scalePoint()
                .domain(activeCompoundIds)
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.2);

            const ingredientColors = d3.scaleOrdinal()
                .domain(Array.from(activeIngredientIds))
                .range(d3.schemeCategory10);

            const linkGenerator = d3.linkHorizontal().x(d => d.x).y(d => d.y);

            linkGroup.selectAll("path")
                .data(finalEdges, d => d["# ingredient id"] + "-" + d["compound id"])
                .join(
                    enter => enter.append("path")
                        .attr("fill", "none")
                        .attr("stroke", d => ingredientColors(d["# ingredient id"])) // Assigned here
                        .attr("stroke-width", 1.5)
                        .attr("stroke-opacity", 0)
                        .attr("d", d => linkGenerator({
                            source: { x: leftX, y: yScaleLeft(d["# ingredient id"]) },
                            target: { x: rightX, y: yScaleRight(d["compound id"]) }
                        }))
                        .call(enter => enter.transition().duration(500).attr("stroke-opacity", 0.35)),
                    update => update.transition().duration(500)
                        .attr("stroke", d => ingredientColors(d["# ingredient id"])) // Maintained here on layout shifts
                        .attr("d", d => linkGenerator({
                            source: { x: leftX, y: yScaleLeft(d["# ingredient id"]) },
                            target: { x: rightX, y: yScaleRight(d["compound id"]) }
                        })),
                    exit => exit.transition().duration(300).attr("stroke-opacity", 0).remove()
                );

            leftNodeGroup.selectAll("g")
                .data(Array.from(activeIngredientIds), d => d)
                .join(
                    enter => {
                        const g = enter.append("g")
                            .attr("transform", d => `translate(${leftX},${yScaleLeft(d)})`)
                            .style("cursor", "pointer")
                            .style("opacity", 0);
                            
                        // Node bubble matches link colors exactly
                        g.append("circle").attr("r", 6).attr("fill", d => ingredientColors(d));
                        g.append("text").attr("x", -12).attr("y", 4).attr("text-anchor", "end").style("font-size", "12px").style("font-weight", "bold").attr("fill", "var(--text-dark)")
                         .text(d => idToIngrName.get(d) || "Unknown");
                         
                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 9);
                            
                            const connectedCompIds = new Set(finalEdges.filter(e => e["# ingredient id"] === d).map(e => e["compound id"]));

                            linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["# ingredient id"] === d ? 0.85 : 0.04)
                                .style("stroke-width", linkData => linkData["# ingredient id"] === d ? 2.5 : 1.5);
                                
                            rightNodeGroup.selectAll("text")
                                .style("font-weight", compD => connectedCompIds.has(compD) ? "bold" : "normal")
                                .attr("fill", compD => connectedCompIds.has(compD) ? "var(--text-dark)" : "#747d8c");
                                
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 6);
                            
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.35)
                                .style("stroke-width", 1.5);
                                
                            rightNodeGroup.selectAll("text")
                                .style("font-weight", "normal")
                                .attr("fill", "#747d8c");
                        });

                        g.on("click", (event, d) => {
                            activeIngredientIds.delete(d);
                            updateGraph();
                        });

                        return g.call(enter => enter.transition().duration(500).style("opacity", 1));
                    },
                    update => update.transition().duration(500)
                        .attr("transform", d => `translate(${leftX},${yScaleLeft(d)})`)
                        .select("circle").attr("fill", d => ingredientColors(d)),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                );

            const stepSize = yScaleRight.step();
            const dynamicFontSize = Math.max(5, Math.min(11, stepSize - 3));

            rightNodeGroup.selectAll("g")
                .data(activeCompoundIds, d => d)
                .join(
                    enter => {
                        const g = enter.append("g")
                            .attr("transform", d => `translate(${rightX},${yScaleRight(d)})`)
                            .style("opacity", 0)
                            .style("cursor", "pointer");
                            
                        g.append("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                        
                        g.append("text")
                            .attr("x", 10)
                            .attr("y", 3)
                            .attr("text-anchor", "start")
                            .attr("fill", "#747d8c")
                            .text(d => idToCompName.get(d) || "Unknown");

                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 6).attr("fill", "var(--flavor-mango)");
                            d3.select(this).select("text").attr("fill", "var(--text-dark)").style("font-weight", "bold");
                        linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["compound id"] === d ? 0.9 : 0.04)
                                .style("stroke-width", linkData => linkData["compound id"] === d ? 2.5 : 1.5);
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                            d3.select(this).select("text").attr("fill", "#747d8c").style("font-weight", "normal");
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.35)
                                .style("stroke-width", 1.5);
                        });

                        return g.call(enter => enter.transition().duration(500).style("opacity", 1));
                    },
                    update => update.transition().duration(500).attr("transform", d => `translate(${rightX},${yScaleRight(d)})`),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                )
                .select("text")
                .style("font-size", `${dynamicFontSize}px`);
        }

        updateGraph();

    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}