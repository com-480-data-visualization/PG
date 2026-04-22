document.addEventListener("DOMContentLoaded", () => {
    initBipartiteGraph();
});

async function initBipartiteGraph() {
    const wrapper = d3.select("#svg-wrapper");
    const width = wrapper.node().getBoundingClientRect().width || 800;
    const margin = { top: 30, right: 150, bottom: 30, left: 150 };

    const svg = wrapper.append("svg")
        .attr("width", "100%")
        .attr("height", "400px");

    const linkGroup = svg.append("g").attr("class", "links");
    const rightNodeGroup = svg.append("g").attr("class", "right-nodes");
    const leftNodeGroup = svg.append("g").attr("class", "left-nodes");

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

        let initialIds = [];
        allIngredientsList.forEach(d => {
            if (d.name.toLowerCase() === "tomato" || d.name.toLowerCase() === "basil") {
                initialIds.push(d.id);
            }
        });

        let activeIngredientIds = new Set(initialIds.length > 0 ? initialIds : [featuredIngredients[0].id, featuredIngredients[1].id]); 
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

            const finalEdges = activeEdges.filter(d => activeCompoundIds.includes(d["compound id"]));

            const minHeight = 400;
            const requiredHeight = Math.max(minHeight, activeCompoundIds.length * 14); 

            svg.transition().duration(300)
               .attr("height", requiredHeight)
               .attr("viewBox", [0, 0, width, requiredHeight]);

            const leftX = margin.left;
            const rightX = width - margin.right;
            
            const yScaleLeft = d3.scalePoint()
                .domain(Array.from(activeIngredientIds))
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.5);

            const yScaleRight = d3.scalePoint()
                .domain(activeCompoundIds)
                .range([margin.top, requiredHeight - margin.bottom])
                .padding(0.5);

            const linkGenerator = d3.linkHorizontal().x(d => d.x).y(d => d.y);

            linkGroup.selectAll("path")
                .data(finalEdges, d => d["# ingredient id"] + "-" + d["compound id"])
                .join(
                    enter => enter.append("path")
                        .attr("fill", "none")
                        .attr("stroke", "#dfe4ea")
                        .attr("stroke-width", 1.5)
                        .attr("stroke-opacity", 0)
                        .attr("d", d => linkGenerator({
                            source: { x: leftX, y: yScaleLeft(d["# ingredient id"]) },
                            target: { x: rightX, y: yScaleRight(d["compound id"]) }
                        }))
                        .call(enter => enter.transition().duration(500).attr("stroke-opacity", 0.4)),
                    update => update.transition().duration(500)
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
                            
                        g.append("circle").attr("r", 6).attr("fill", "var(--flavor-strawberry)");
                        g.append("text").attr("x", -12).attr("y", 4).attr("text-anchor", "end").style("font-size", "12px").style("font-weight", "bold").attr("fill", "var(--text-dark)")
                         .text(d => idToIngrName.get(d) || "Unknown");
                         
                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 9).attr("fill", "var(--flavor-mango)");
                            
                            const connectedCompIds = new Set(finalEdges.filter(e => e["# ingredient id"] === d).map(e => e["compound id"]));

                            linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["# ingredient id"] === d ? 0.8 : 0.05)
                                .style("stroke", linkData => linkData["# ingredient id"] === d ? "var(--flavor-mango)" : "#dfe4ea")
                                .style("stroke-width", linkData => linkData["# ingredient id"] === d ? 2 : 1.5);
                                
                            rightNodeGroup.selectAll("text")
                                .style("font-weight", compD => connectedCompIds.has(compD) ? "bold" : "normal")
                                .attr("fill", compD => connectedCompIds.has(compD) ? "var(--text-dark)" : "#747d8c");
                                
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 6).attr("fill", "var(--flavor-strawberry)");
                            
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.4).style("stroke", "#dfe4ea").style("stroke-width", 1.5);
                                
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
                    update => update.transition().duration(500).attr("transform", d => `translate(${leftX},${yScaleLeft(d)})`),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                );

            rightNodeGroup.selectAll("g")
                .data(activeCompoundIds, d => d)
                .join(
                    enter => {
                        const g = enter.append("g")
                            .attr("transform", d => `translate(${rightX},${yScaleRight(d)})`)
                            .style("opacity", 0)
                            .style("cursor", "pointer");
                            
                        g.append("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                        
                        g.append("text").attr("x", 10).attr("y", 3).attr("text-anchor", "start").style("font-size", "10px").attr("fill", "#747d8c")
                         .style("opacity", 1)
                         .text(d => idToCompName.get(d) || "Unknown");

                        g.on("mouseover", function(event, d) {
                            d3.select(this).select("circle").attr("r", 6).attr("fill", "var(--flavor-matcha)");
                            d3.select(this).select("text").attr("fill", "var(--text-dark)").style("font-weight", "bold");
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", linkData => linkData["compound id"] === d ? 0.8 : 0.05)
                                .style("stroke", linkData => linkData["compound id"] === d ? "var(--flavor-matcha)" : "#dfe4ea")
                                .style("stroke-width", linkData => linkData["compound id"] === d ? 2 : 1.5);
                        }).on("mouseout", function() {
                            d3.select(this).select("circle").attr("r", 3).attr("fill", "var(--flavor-blueberry)");
                            d3.select(this).select("text").attr("fill", "#747d8c").style("font-weight", "normal");
                            linkGroup.selectAll("path")
                                .style("stroke-opacity", 0.4).style("stroke", "#dfe4ea").style("stroke-width", 1.5);
                        });

                        return g.call(enter => enter.transition().duration(500).style("opacity", 1));
                    },
                    update => update.transition().duration(500).attr("transform", d => `translate(${rightX},${yScaleRight(d)})`),
                    exit => exit.transition().duration(300).style("opacity", 0).remove()
                );
        }

        updateGraph();

    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}